import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

const authSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false
    },
    userAgent: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true
    },
    expiresAt: {
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

authSessionSchema.index({ userId: 1, revokedAt: 1 });
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AuthSessionDocument = InferSchemaType<typeof authSessionSchema> & {
  userId: Types.ObjectId;
};

export const AuthSessionModel: Model<AuthSessionDocument> = model<AuthSessionDocument>(
  'AuthSession',
  authSessionSchema
);
