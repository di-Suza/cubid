import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

import { AUCTION_STATUSES, DEFAULT_CURRENCY } from '../../shared/constants/auction.js';

const auctionSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      uppercase: true,
      trim: true
    },
    startingBidMinor: {
      type: Number,
      required: true,
      min: 0
    },
    minimumIncrementMinor: {
      type: Number,
      required: true,
      min: 1
    },
    currentHighestBidMinor: {
      type: Number,
      default: 0,
      min: 0
    },
    highestBidderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    bidCount: {
      type: Number,
      default: 0,
      min: 0
    },
    startAt: {
      type: Date,
      required: true,
      index: true
    },
    endAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: AUCTION_STATUSES,
      default: 'UPCOMING',
      index: true
    },
    version: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSequence: {
      type: Number,
      default: 0,
      min: 0
    },
    finalizedAt: {
      type: Date,
      default: null,
      index: true
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

auctionSchema.index({ status: 1, startAt: 1, endAt: 1 });
auctionSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
auctionSchema.index({ title: 'text', description: 'text' });

export type AuctionDocument = InferSchemaType<typeof auctionSchema> & {
  sellerId: Types.ObjectId;
  highestBidderId?: Types.ObjectId | null;
  winnerId?: Types.ObjectId | null;
};

export const AuctionModel: Model<AuctionDocument> = model<AuctionDocument>('Auction', auctionSchema);
