import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

import { BID_STATUSES } from '../../shared/constants/auction.js';

const bidSchema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true
    },
    bidderId: {
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
    requestId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    sequence: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: BID_STATUSES,
      default: 'ACCEPTED'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

bidSchema.index({ auctionId: 1, sequence: 1 }, { unique: true });
bidSchema.index({ auctionId: 1, bidderId: 1, requestId: 1 }, { unique: true });
bidSchema.index({ auctionId: 1, createdAt: -1 });

export type BidDocument = InferSchemaType<typeof bidSchema> & {
  auctionId: Types.ObjectId;
  bidderId: Types.ObjectId;
};

export const BidModel: Model<BidDocument> = model<BidDocument>('Bid', bidSchema);
