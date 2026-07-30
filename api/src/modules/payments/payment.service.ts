import { env } from '../../config/env.js';
import {
  mockPaymentGatewayProvider,
  razorpayPaymentGatewayProvider,
  stripePaymentGatewayProvider
} from '../../infrastructure/payments/index.js';
import type {
  PaymentCheckoutOrder,
  PaymentGatewayProvider,
  PaymentVerificationInput,
  PaymentWebhookInput
} from '../../infrastructure/payments/index.js';
import { auctionEngineService, type AuctionEngineService } from '../auction-engine/auctionEngine.service.js';
import { realtimeService } from '../../infrastructure/realtime/index.js';
import type { PaymentGateway, PaymentStatus, TimelineEventType } from '../../shared/constants/auction.js';
import type {
  AuctionEngineActor,
  AuctionEnginePaymentRepository,
  EnginePaymentRecord,
  EngineTimelineEventRecord
} from '../auction-engine/auctionEngine.types.js';
import { timelineRepository } from '../timeline/timeline.repository.js';
import { ConflictError } from '../../shared/errors/ConflictError.js';
import { ForbiddenError } from '../../shared/errors/ForbiddenError.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';
import { paymentRepository, type PaymentRepository } from './payment.repository.js';

export interface WinnerPaymentAuctionRecord {
  id: string;
  title: string;
  imageUrl: string;
  currency: string;
  winningAmountMinor: number;
  status: 'COMPLETED' | 'CANCELLED' | 'ACTIVE' | 'UPCOMING';
  endAt: string;
  seller: {
    id: string;
    name: string;
  };
}

export interface WinnerPaymentRecord {
  payment: EnginePaymentRecord;
  auction: WinnerPaymentAuctionRecord;
}

export interface PaymentRepositoryPort extends AuctionEnginePaymentRepository {
  listWinsForUser(userId: string): Promise<WinnerPaymentRecord[]>;
  findById(paymentId: string): Promise<EnginePaymentRecord | null>;
  findByGatewayOrderId(gatewayOrderId: string): Promise<EnginePaymentRecord | null>;
  setGatewayOrder(input: {
    paymentId: string;
    gateway: PaymentGateway;
    gatewayOrderId: string;
  }): Promise<EnginePaymentRecord>;
  updateStatus(input: {
    paymentId: string;
    status: Extract<PaymentStatus, 'SUCCESSFUL' | 'FAILED'>;
    gatewayPaymentId: string | null;
    verifiedAt: Date | null;
  }): Promise<EnginePaymentRecord>;
}

export interface PaymentTimelineRepositoryPort {
  createEvent(input: {
    auctionId: string;
    type: TimelineEventType;
    sequence: number;
    actorPublicId: string | null;
    publicMetadata?: Record<string, unknown>;
  }): Promise<EngineTimelineEventRecord>;
}

export interface CompleteMockCheckoutInput {
  paymentId: string;
  outcome?: Extract<PaymentStatus, 'SUCCESSFUL' | 'FAILED'>;
}

interface PaymentServiceDependencies {
  engine?: AuctionEngineService;
  gateway?: PaymentGatewayProvider;
  payments?: PaymentRepositoryPort;
  timelines?: PaymentTimelineRepositoryPort;
  now?: () => Date;
  notifyPaymentChanged?: (payment: EnginePaymentRecord, actor: AuctionEngineActor) => Promise<void>;
}

export class PaymentService {
  private readonly engine: AuctionEngineService;
  private readonly gateway: PaymentGatewayProvider;
  private readonly payments: PaymentRepositoryPort;
  private readonly timelines: PaymentTimelineRepositoryPort;
  private readonly now: () => Date;
  private readonly notifyPaymentChanged: (payment: EnginePaymentRecord, actor: AuctionEngineActor) => Promise<void>;

  constructor(dependencies: PaymentServiceDependencies = {}) {
    this.engine = dependencies.engine ?? auctionEngineService;
    this.gateway = dependencies.gateway ?? this.resolveGatewayProvider();
    this.payments = dependencies.payments ?? paymentRepository;
    this.timelines = dependencies.timelines ?? timelineRepository;
    this.now = dependencies.now ?? (() => new Date());
    this.notifyPaymentChanged = dependencies.notifyPaymentChanged ?? ((payment, actor) => this.broadcastPaymentState(payment, actor));
  }

  async listMyWins(actor: AuctionEngineActor): Promise<WinnerPaymentRecord[]> {
    if (!actor.userId) {
      throw new UnauthorizedError('Authentication required to view winning payments');
    }

    return this.payments.listWinsForUser(actor.userId);
  }

  async createCheckoutOrder(paymentId: string, actor: AuctionEngineActor): Promise<PaymentCheckoutOrder> {
    const payment = await this.loadPayablePayment(paymentId, actor);
    const order = await this.gateway.createOrder(payment);

    await this.payments.setGatewayOrder({
      paymentId: payment.id,
      gateway: order.gateway,
      gatewayOrderId: order.gatewayOrderId
    });

    return order;
  }

  async verifyCheckout(
    paymentId: string,
    input: PaymentVerificationInput,
    actor: AuctionEngineActor
  ): Promise<EnginePaymentRecord> {
    const payment = await this.loadPayablePayment(paymentId, actor);
    const verification = await this.gateway.verifyPayment(input);

    if (payment.gatewayOrderId && payment.gatewayOrderId !== verification.gatewayOrderId) {
      throw new ForbiddenError('Payment order does not match this winner payment', 'PAYMENT_ORDER_MISMATCH');
    }

    const updated = await this.markPaymentStatus({
      paymentId: payment.id,
      auctionId: payment.auctionId,
      actorPublicId: actor.userId ?? null,
      status: verification.status,
      gatewayPaymentId: verification.gatewayPaymentId
    });

    await this.notifyPaymentChanged(updated, actor);
    return updated;
  }

  async handleWebhook(input: PaymentWebhookInput): Promise<EnginePaymentRecord | null> {
    const verification = await this.gateway.parseWebhook(input);

    if (!verification) {
      return null;
    }

    const payment = await this.payments.findByGatewayOrderId(verification.gatewayOrderId);

    if (!payment) {
      throw new NotFoundError('Payment order not found', 'PAYMENT_ORDER_NOT_FOUND');
    }

    if (payment.status === 'SUCCESSFUL' || payment.status === verification.status) {
      return payment;
    }

    const updated = await this.markPaymentStatus({
      paymentId: payment.id,
      auctionId: payment.auctionId,
      actorPublicId: payment.winnerId,
      status: verification.status,
      gatewayPaymentId: verification.gatewayPaymentId
    });

    await this.notifyPaymentChanged(updated, { userId: payment.winnerId });
    return updated;
  }

  async completeMockCheckout(
    input: CompleteMockCheckoutInput,
    actor: AuctionEngineActor
  ): Promise<EnginePaymentRecord> {
    if (!actor.userId) {
      throw new UnauthorizedError('Authentication required to pay for an auction');
    }

    const outcome = input.outcome ?? 'SUCCESSFUL';
    const payment = await this.loadPayablePayment(input.paymentId, actor, { allowSuccessful: false });
    const order = await mockPaymentGatewayProvider.createOrder(payment);
    await this.payments.setGatewayOrder({
      paymentId: payment.id,
      gateway: 'mock',
      gatewayOrderId: order.gatewayOrderId
    });
    const verification = await mockPaymentGatewayProvider.verifyPayment({
      gatewayOrderId: order.gatewayOrderId,
      outcome
    });
    const updated = await this.markPaymentStatus({
      paymentId: payment.id,
      auctionId: payment.auctionId,
      actorPublicId: actor.userId,
      status: verification.status,
      gatewayPaymentId: verification.gatewayPaymentId
    });

    await this.notifyPaymentChanged(updated, actor);
    return updated;
  }

  private async loadPayablePayment(
    paymentId: string,
    actor: AuctionEngineActor,
    options: { allowSuccessful?: boolean } = {}
  ): Promise<EnginePaymentRecord> {
    if (!actor.userId) {
      throw new UnauthorizedError('Authentication required to pay for an auction');
    }

    const payment = await this.payments.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (payment.winnerId !== actor.userId) {
      throw new ForbiddenError('Only the winning bidder can pay for this auction', 'PAYMENT_FORBIDDEN');
    }

    if (!options.allowSuccessful && payment.status === 'SUCCESSFUL') {
      throw new ConflictError('Payment is already successful', 'PAYMENT_ALREADY_SUCCESSFUL');
    }

    return payment;
  }

  private async markPaymentStatus(input: {
    paymentId: string;
    auctionId: string;
    actorPublicId: string | null | undefined;
    status: Extract<PaymentStatus, 'SUCCESSFUL' | 'FAILED'>;
    gatewayPaymentId: string | null;
  }): Promise<EnginePaymentRecord> {
    const now = this.now();
    const updated = await this.payments.updateStatus({
      paymentId: input.paymentId,
      status: input.status,
      gatewayPaymentId: input.gatewayPaymentId,
      verifiedAt: input.status === 'SUCCESSFUL' ? now : null
    });

    await this.timelines.createEvent({
      auctionId: input.auctionId,
      type: input.status === 'SUCCESSFUL' ? 'PAYMENT_SUCCESSFUL' : 'PAYMENT_FAILED',
      sequence: 0,
      actorPublicId: input.actorPublicId ?? null,
      publicMetadata: {
        paymentId: updated.id,
        amountMinor: updated.amountMinor,
        gateway: updated.gateway,
        gatewayOrderId: updated.gatewayOrderId,
        gatewayPaymentId: updated.gatewayPaymentId
      }
    });

    return updated;
  }

  private async broadcastPaymentState(payment: EnginePaymentRecord, actor: AuctionEngineActor): Promise<void> {
    const snapshot = await this.engine.getSnapshot(payment.auctionId, actor);
    realtimeService.broadcastAuctionState(snapshot);
  }

  private resolveGatewayProvider(): PaymentGatewayProvider {
    if (env.paymentGateway === 'razorpay') {
      return razorpayPaymentGatewayProvider;
    }

    if (env.paymentGateway === 'stripe') {
      return stripePaymentGatewayProvider;
    }

    return mockPaymentGatewayProvider;
  }
}

export const paymentService = new PaymentService();
