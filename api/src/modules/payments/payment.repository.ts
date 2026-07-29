import { env } from '../../config/env.js';
import type { EnginePaymentRecord } from '../auction-engine/auctionEngine.types.js';
import { PaymentModel, type PaymentDocument } from './payment.model.js';

type LeanPayment = Record<string, any>;

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(String(value));
};

export class PaymentRepository {
  constructor(private readonly paymentModel = PaymentModel) {}

  get model(): typeof this.paymentModel {
    return this.paymentModel;
  }

  async createPendingForWinner(input: {
    auctionId: string;
    winnerId: string;
    amountMinor: number;
    currency: string;
  }): Promise<EnginePaymentRecord> {
    const payment = await this.paymentModel
      .findOneAndUpdate(
        {
          auctionId: input.auctionId,
          winnerId: input.winnerId
        },
        {
          $setOnInsert: {
            auctionId: input.auctionId,
            winnerId: input.winnerId,
            amountMinor: input.amountMinor,
            currency: input.currency,
            gateway: env.paymentGateway,
            status: 'PENDING'
          }
        },
        {
          upsert: true,
          new: true
        }
      )
      .lean();

    return this.toEngineRecord(payment as LeanPayment);
  }

  async findLatestByAuctionId(auctionId: string): Promise<EnginePaymentRecord | null> {
    const payment = await this.paymentModel.findOne({ auctionId }).sort({ createdAt: -1 }).lean();

    return payment ? this.toEngineRecord(payment as LeanPayment) : null;
  }

  private toEngineRecord(payment: LeanPayment): EnginePaymentRecord {
    return {
      id: String(payment._id),
      auctionId: String(payment.auctionId),
      winnerId: String(payment.winnerId),
      amountMinor: Number(payment.amountMinor),
      currency: String(payment.currency),
      gateway: payment.gateway,
      status: payment.status,
      verifiedAt: toDateOrNull(payment.verifiedAt)
    };
  }
}

export const paymentRepository = new PaymentRepository();

export type { PaymentDocument };
