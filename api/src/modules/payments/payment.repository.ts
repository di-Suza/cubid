import { env } from '../../config/env.js';
import type { EnginePaymentRecord } from '../auction-engine/auctionEngine.types.js';
import type { WinnerPaymentRecord } from './payment.service.js';
import { PaymentModel, type PaymentDocument } from './payment.model.js';

type LeanPayment = Record<string, any>;
type LeanAuction = Record<string, any>;

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

  async listWinsForUser(userId: string): Promise<WinnerPaymentRecord[]> {
    const payments = await this.paymentModel
      .find({ winnerId: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'auctionId',
        select: 'title imageUrl currency currentHighestBidMinor status endAt sellerId',
        populate: {
          path: 'sellerId',
          select: 'name'
        }
      })
      .lean();

    return payments
      .map((payment) => this.toWinnerPaymentRecord(payment as LeanPayment))
      .filter((record): record is WinnerPaymentRecord => Boolean(record));
  }

  async findById(paymentId: string): Promise<EnginePaymentRecord | null> {
    const payment = await this.paymentModel.findById(paymentId).lean();

    return payment ? this.toEngineRecord(payment as LeanPayment) : null;
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<EnginePaymentRecord | null> {
    const payment = await this.paymentModel.findOne({ gatewayOrderId }).lean();

    return payment ? this.toEngineRecord(payment as LeanPayment) : null;
  }

  async setGatewayOrder(input: {
    paymentId: string;
    gateway: 'mock' | 'razorpay' | 'stripe';
    gatewayOrderId: string;
  }): Promise<EnginePaymentRecord> {
    const payment = await this.paymentModel
      .findByIdAndUpdate(
        input.paymentId,
        {
          $set: {
            gateway: input.gateway,
            gatewayOrderId: input.gatewayOrderId,
            status: 'PENDING'
          }
        },
        { new: true }
      )
      .lean();

    return this.toEngineRecord(payment as LeanPayment);
  }

  async updateStatus(input: {
    paymentId: string;
    status: 'SUCCESSFUL' | 'FAILED';
    gatewayPaymentId: string | null;
    verifiedAt: Date | null;
  }): Promise<EnginePaymentRecord> {
    const payment = await this.paymentModel
      .findByIdAndUpdate(
        input.paymentId,
        {
          $set: {
            status: input.status,
            gatewayPaymentId: input.gatewayPaymentId,
            verifiedAt: input.verifiedAt
          }
        },
        { new: true }
      )
      .lean();

    return this.toEngineRecord(payment as LeanPayment);
  }

  private toEngineRecord(payment: LeanPayment): EnginePaymentRecord {
    return {
      id: String(payment._id),
      auctionId: String(payment.auctionId),
      winnerId: String(payment.winnerId),
      amountMinor: Number(payment.amountMinor),
      currency: String(payment.currency),
      gateway: payment.gateway,
      gatewayOrderId: payment.gatewayOrderId ? String(payment.gatewayOrderId) : null,
      gatewayPaymentId: payment.gatewayPaymentId ? String(payment.gatewayPaymentId) : null,
      status: payment.status,
      verifiedAt: toDateOrNull(payment.verifiedAt)
    };
  }

  private toWinnerPaymentRecord(payment: LeanPayment): WinnerPaymentRecord | null {
    const auction = payment.auctionId;

    if (!auction || typeof auction !== 'object' || !('_id' in auction)) {
      return null;
    }

    const auctionRecord = auction as LeanAuction;
    const seller = this.toPublicUser(auctionRecord.sellerId, 'Seller');

    return {
      payment: this.toEngineRecord({
        ...payment,
        auctionId: auctionRecord._id
      }),
      auction: {
        id: String(auctionRecord._id),
        title: String(auctionRecord.title),
        imageUrl: String(auctionRecord.imageUrl),
        currency: String(auctionRecord.currency),
        winningAmountMinor: Number(payment.amountMinor),
        status: auctionRecord.status,
        endAt: toDateOrNull(auctionRecord.endAt)?.toISOString() ?? new Date().toISOString(),
        seller
      }
    };
  }

  private toPublicUser(value: unknown, fallbackName: string) {
    if (value && typeof value === 'object' && '_id' in value) {
      const record = value as { _id: unknown; name?: unknown };
      return {
        id: String(record._id),
        name: typeof record.name === 'string' ? record.name : fallbackName
      };
    }

    return {
      id: String(value),
      name: fallbackName
    };
  }
}

export const paymentRepository = new PaymentRepository();

export type { PaymentDocument };
