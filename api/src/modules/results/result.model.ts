import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

const auctionResultSchema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      unique: true,
      index: true
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    winningBidId: {
      type: Schema.Types.ObjectId,
      ref: 'Bid',
      default: null
    },
    winningAmountMinor: {
      type: Number,
      default: 0,
      min: 0
    },
    declaredAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type AuctionResultDocument = InferSchemaType<typeof auctionResultSchema> & {
  auctionId: Types.ObjectId;
  winnerId?: Types.ObjectId | null;
  winningBidId?: Types.ObjectId | null;
};

export const AuctionResultModel: Model<AuctionResultDocument> = model<AuctionResultDocument>(
  'AuctionResult',
  auctionResultSchema
);
