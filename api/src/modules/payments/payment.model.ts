import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

import { DEFAULT_CURRENCY, PAYMENT_GATEWAYS, PAYMENT_STATUSES } from '../../shared/constants/auction.js';

const paymentSchema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      uppercase: true,
      trim: true
    },
    gateway: {
      type: String,
      enum: PAYMENT_GATEWAYS,
      default: 'mock'
    },
    gatewayOrderId: {
      type: String,
      default: null,
      index: true
    },
    gatewayPaymentId: {
      type: String,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PENDING',
      index: true
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

paymentSchema.index({ auctionId: 1, winnerId: 1 });
paymentSchema.index({ gateway: 1, gatewayOrderId: 1 }, { sparse: true });

export type PaymentDocument = InferSchemaType<typeof paymentSchema> & {
  auctionId: Types.ObjectId;
  winnerId: Types.ObjectId;
};

export const PaymentModel: Model<PaymentDocument> = model<PaymentDocument>('Payment', paymentSchema);
