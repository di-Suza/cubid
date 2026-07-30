import type { PaymentStatus, TimelineEventType } from '../../shared/constants/auction.js';
import type {
  AuctionEngineActor,
  AuctionEnginePaymentRepository,
  EnginePaymentRecord,
  EngineTimelineEventRecord
} from '../auction-engine/auctionEngine.types.js';
import { timelineRepository } from '../timeline/timeline.repository.js';
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
  payments?: PaymentRepositoryPort;
  timelines?: PaymentTimelineRepositoryPort;
  now?: () => Date;
}

export class PaymentService {
  private readonly payments: PaymentRepositoryPort;
  private readonly timelines: PaymentTimelineRepositoryPort;
  private readonly now: () => Date;

  constructor(dependencies: PaymentServiceDependencies = {}) {
    this.payments = dependencies.payments ?? paymentRepository;
    this.timelines = dependencies.timelines ?? timelineRepository;
    this.now = dependencies.now ?? (() => new Date());
  }

  async listMyWins(actor: AuctionEngineActor): Promise<WinnerPaymentRecord[]> {
    if (!actor.userId) {
      throw new UnauthorizedError('Authentication required to view winning payments');
    }

    return this.payments.listWinsForUser(actor.userId);
  }

  async completeMockCheckout(
    input: CompleteMockCheckoutInput,
    actor: AuctionEngineActor
  ): Promise<EnginePaymentRecord> {
    if (!actor.userId) {
      throw new UnauthorizedError('Authentication required to pay for an auction');
    }

    const payment = await this.payments.findById(input.paymentId);

    if (!payment) {
      throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (payment.winnerId !== actor.userId) {
      throw new ForbiddenError('Only the winning bidder can pay for this auction', 'PAYMENT_FORBIDDEN');
    }

    const outcome = input.outcome ?? 'SUCCESSFUL';
    const now = this.now();
    const updated = await this.payments.updateStatus({
      paymentId: payment.id,
      status: outcome,
      gatewayPaymentId: outcome === 'SUCCESSFUL' ? `mock_${payment.id}_${now.getTime()}` : null,
      verifiedAt: outcome === 'SUCCESSFUL' ? now : null
    });

    await this.timelines.createEvent({
      auctionId: payment.auctionId,
      type: outcome === 'SUCCESSFUL' ? 'PAYMENT_SUCCESSFUL' : 'PAYMENT_FAILED',
      sequence: 0,
      actorPublicId: actor.userId,
      publicMetadata: {
        paymentId: payment.id,
        amountMinor: payment.amountMinor
      }
    });

    return updated;
  }
}

export const paymentService = new PaymentService();
