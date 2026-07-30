import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PaymentService } from '../../src/modules/payments/payment.service.js';
import type {
  PaymentRepositoryPort,
  PaymentTimelineRepositoryPort,
  WinnerPaymentRecord
} from '../../src/modules/payments/payment.service.js';
import type { EnginePaymentRecord, EngineTimelineEventRecord } from '../../src/modules/auction-engine/auctionEngine.types.js';
import type {
  PaymentCheckoutOrder,
  PaymentGatewayProvider,
  PaymentGatewayVerificationResult,
  PaymentVerificationInput,
  PaymentWebhookInput
} from '../../src/infrastructure/payments/index.js';
import { ForbiddenError } from '../../src/shared/errors/ForbiddenError.js';
import { UnauthorizedError } from '../../src/shared/errors/UnauthorizedError.js';

const baseNow = new Date('2026-07-30T10:00:00.000Z');

const payment = (overrides: Partial<EnginePaymentRecord> = {}): EnginePaymentRecord => ({
  id: 'payment-1',
  auctionId: 'auction-1',
  winnerId: 'winner-1',
  amountMinor: 120_000,
  currency: 'INR',
  gateway: 'mock',
  gatewayOrderId: null,
  gatewayPaymentId: null,
  status: 'PENDING',
  verifiedAt: null,
  ...overrides
});

class FakePaymentRepository implements PaymentRepositoryPort {
  readonly payments = new Map<string, EnginePaymentRecord>();

  constructor(records: EnginePaymentRecord[]) {
    for (const record of records) {
      this.payments.set(record.id, record);
    }
  }

  async createPendingForWinner(input: {
    auctionId: string;
    winnerId: string;
    amountMinor: number;
    currency: string;
  }) {
    const record = payment({
      id: `payment-${this.payments.size + 1}`,
      auctionId: input.auctionId,
      winnerId: input.winnerId,
      amountMinor: input.amountMinor,
      currency: input.currency
    });
    this.payments.set(record.id, record);
    return record;
  }

  async findLatestByAuctionId(auctionId: string) {
    return [...this.payments.values()].find((record) => record.auctionId === auctionId) ?? null;
  }

  async listWinsForUser(userId: string): Promise<WinnerPaymentRecord[]> {
    return [...this.payments.values()]
      .filter((record) => record.winnerId === userId)
      .map((record) => ({
        payment: record,
        auction: {
          id: record.auctionId,
          title: 'Won Camera',
          imageUrl: 'https://example.com/won.jpg',
          currency: record.currency,
          winningAmountMinor: record.amountMinor,
          status: 'COMPLETED',
          endAt: baseNow.toISOString(),
          seller: {
            id: 'seller-1',
            name: 'Seller One'
          }
        }
      }));
  }

  async findById(paymentId: string) {
    return this.payments.get(paymentId) ?? null;
  }

  async findByGatewayOrderId(gatewayOrderId: string) {
    return [...this.payments.values()].find((record) => record.gatewayOrderId === gatewayOrderId) ?? null;
  }

  async setGatewayOrder(input: {
    paymentId: string;
    gateway: 'mock' | 'razorpay' | 'stripe';
    gatewayOrderId: string;
  }) {
    const existing = this.payments.get(input.paymentId);

    assert.ok(existing);

    const updated = {
      ...existing,
      gateway: input.gateway,
      gatewayOrderId: input.gatewayOrderId,
      status: 'PENDING' as const
    };
    this.payments.set(input.paymentId, updated);
    return updated;
  }

  async updateStatus(input: {
    paymentId: string;
    status: 'SUCCESSFUL' | 'FAILED';
    gatewayPaymentId: string | null;
    verifiedAt: Date | null;
  }) {
    const existing = this.payments.get(input.paymentId);

    assert.ok(existing);

    const updated = {
      ...existing,
      status: input.status,
      gatewayPaymentId: input.gatewayPaymentId,
      verifiedAt: input.verifiedAt
    };
    this.payments.set(input.paymentId, updated);
    return updated;
  }
}

class FakeTimelineRepository implements PaymentTimelineRepositoryPort {
  readonly events: EngineTimelineEventRecord[] = [];

  async createEvent(input: Parameters<PaymentTimelineRepositoryPort['createEvent']>[0]) {
    const event: EngineTimelineEventRecord = {
      id: `event-${this.events.length + 1}`,
      auctionId: input.auctionId,
      type: input.type,
      sequence: input.sequence,
      actorPublicId: input.actorPublicId,
      publicMetadata: input.publicMetadata ?? {},
      createdAt: baseNow
    };

    this.events.push(event);
    return event;
  }
}

class FakePaymentGateway implements PaymentGatewayProvider {
  readonly gateway = 'razorpay' as const;
  createdFor?: EnginePaymentRecord;

  async createOrder(payment: EnginePaymentRecord): Promise<PaymentCheckoutOrder> {
    this.createdFor = payment;

    return {
      paymentId: payment.id,
      gateway: this.gateway,
      gatewayOrderId: `order_${payment.id}`,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      keyId: 'rzp_test_key'
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentGatewayVerificationResult> {
    return {
      gatewayOrderId: input.gatewayOrderId,
      gatewayPaymentId: input.gatewayPaymentId ?? 'pay_verified',
      status: input.outcome ?? 'SUCCESSFUL'
    };
  }

  async parseWebhook(input: PaymentWebhookInput): Promise<PaymentGatewayVerificationResult | null> {
    const body = input.body as { orderId?: string; paymentId?: string; status?: 'SUCCESSFUL' | 'FAILED' };

    if (!body.orderId) {
      return null;
    }

    return {
      gatewayOrderId: body.orderId,
      gatewayPaymentId: body.paymentId ?? null,
      status: body.status ?? 'SUCCESSFUL'
    };
  }
}

const createHarness = () => {
  const payments = new FakePaymentRepository([
    payment({ id: 'payment-1', winnerId: 'winner-1', amountMinor: 120_000 }),
    payment({ id: 'payment-2', winnerId: 'winner-2', amountMinor: 150_000 })
  ]);
  const timelines = new FakeTimelineRepository();
  const gateway = new FakePaymentGateway();
  const service = new PaymentService({
    gateway,
    payments,
    timelines,
    now: () => baseNow,
    notifyPaymentChanged: async () => undefined
  });

  return {
    gateway,
    payments,
    service,
    timelines
  };
};

describe('PaymentService', () => {
  it('lists pending wins for the authenticated winner', async () => {
    const { service } = createHarness();

    const result = await service.listMyWins({ userId: 'winner-1' });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.payment.amountMinor, 120_000);
    assert.equal(result[0]?.auction.title, 'Won Camera');
  });

  it('rejects unauthenticated win queries', async () => {
    const { service } = createHarness();

    await assert.rejects(() => service.listMyWins({}), UnauthorizedError);
  });

  it('marks a winner payment successful using the persisted payment amount', async () => {
    const { payments, service, timelines } = createHarness();

    const result = await service.completeMockCheckout(
      {
        paymentId: 'payment-1',
        outcome: 'SUCCESSFUL'
      },
      { userId: 'winner-1' }
    );

    assert.equal(result.status, 'SUCCESSFUL');
    assert.equal(result.amountMinor, 120_000);
    assert.equal(payments.payments.get('payment-1')?.verifiedAt?.toISOString(), baseNow.toISOString());
    assert.equal(timelines.events[0]?.type, 'PAYMENT_SUCCESSFUL');
  });

  it('creates a gateway order using the persisted payment record', async () => {
    const { gateway, payments, service } = createHarness();

    const result = await service.createCheckoutOrder('payment-1', { userId: 'winner-1' });

    assert.equal(result.gateway, 'razorpay');
    assert.equal(result.amountMinor, 120_000);
    assert.equal(gateway.createdFor?.winnerId, 'winner-1');
    assert.equal(payments.payments.get('payment-1')?.gatewayOrderId, 'order_payment-1');
  });

  it('verifies a gateway payment and records the provider payment id', async () => {
    const { payments, service, timelines } = createHarness();
    await service.createCheckoutOrder('payment-1', { userId: 'winner-1' });

    const result = await service.verifyCheckout(
      'payment-1',
      {
        gatewayOrderId: 'order_payment-1',
        gatewayPaymentId: 'pay_123',
        gatewaySignature: 'valid'
      },
      { userId: 'winner-1' }
    );

    assert.equal(result.status, 'SUCCESSFUL');
    assert.equal(payments.payments.get('payment-1')?.gatewayPaymentId, 'pay_123');
    assert.equal(timelines.events.at(-1)?.type, 'PAYMENT_SUCCESSFUL');
  });

  it('applies a signed gateway webhook by stored provider order id', async () => {
    const { payments, service, timelines } = createHarness();
    await service.createCheckoutOrder('payment-1', { userId: 'winner-1' });

    const result = await service.handleWebhook({
      signature: 'provider-signature',
      rawBody: Buffer.from('{}'),
      body: {
        orderId: 'order_payment-1',
        paymentId: 'pay_hook',
        status: 'SUCCESSFUL'
      }
    });

    assert.equal(result?.status, 'SUCCESSFUL');
    assert.equal(payments.payments.get('payment-1')?.gatewayPaymentId, 'pay_hook');
    assert.equal(timelines.events.at(-1)?.type, 'PAYMENT_SUCCESSFUL');
  });

  it('keeps successful webhook updates idempotent and never downgrades paid records', async () => {
    const { payments, service, timelines } = createHarness();
    payments.payments.set(
      'payment-1',
      payment({
        id: 'payment-1',
        gateway: 'razorpay',
        gatewayOrderId: 'order_paid',
        gatewayPaymentId: 'pay_paid',
        status: 'SUCCESSFUL',
        verifiedAt: baseNow
      })
    );

    const result = await service.handleWebhook({
      signature: 'provider-signature',
      rawBody: Buffer.from('{}'),
      body: {
        orderId: 'order_paid',
        paymentId: 'pay_late_failure',
        status: 'FAILED'
      }
    });

    assert.equal(result?.status, 'SUCCESSFUL');
    assert.equal(payments.payments.get('payment-1')?.gatewayPaymentId, 'pay_paid');
    assert.equal(timelines.events.length, 0);
  });

  it('rejects payment actions from non-winners', async () => {
    const { service } = createHarness();

    await assert.rejects(
      () => service.completeMockCheckout({ paymentId: 'payment-1', outcome: 'SUCCESSFUL' }, { userId: 'winner-2' }),
      ForbiddenError
    );
  });

  it('keeps failed payments retryable without changing auction ownership', async () => {
    const { service, timelines } = createHarness();

    const result = await service.completeMockCheckout(
      {
        paymentId: 'payment-1',
        outcome: 'FAILED'
      },
      { userId: 'winner-1' }
    );

    assert.equal(result.status, 'FAILED');
    assert.equal(result.verifiedAt, null);
    assert.equal(timelines.events[0]?.type, 'PAYMENT_FAILED');
  });
});
