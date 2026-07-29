import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

import { TIMELINE_EVENT_TYPES } from '../../shared/constants/auction.js';

const timelineEventSchema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: TIMELINE_EVENT_TYPES,
      required: true,
      index: true
    },
    sequence: {
      type: Number,
      required: true,
      min: 0
    },
    actorPublicId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    publicMetadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

timelineEventSchema.index({ auctionId: 1, sequence: 1 });
timelineEventSchema.index({ auctionId: 1, createdAt: -1 });

export type TimelineEventDocument = InferSchemaType<typeof timelineEventSchema> & {
  auctionId: Types.ObjectId;
  actorPublicId?: Types.ObjectId | null;
};

export const TimelineEventModel: Model<TimelineEventDocument> = model<TimelineEventDocument>(
  'TimelineEvent',
  timelineEventSchema
);
