import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

const chatMessageSchema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

chatMessageSchema.index({ auctionId: 1, createdAt: -1 });

export type ChatMessageDocument = InferSchemaType<typeof chatMessageSchema> & {
  auctionId: Types.ObjectId;
  senderId: Types.ObjectId;
};

export const ChatMessageModel: Model<ChatMessageDocument> = model<ChatMessageDocument>(
  'ChatMessage',
  chatMessageSchema
);
