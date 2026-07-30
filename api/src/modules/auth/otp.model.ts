import { Schema, model, type InferSchemaType, type Model, Types } from 'mongoose';

export const OTP_PURPOSES = ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PASSWORDLESS_LOGIN'] as const;

const otpSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    purpose: {
      type: String,
      enum: OTP_PURPOSES,
      required: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true,
      select: false
    },
    consumedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

otpSchema.index({ email: 1, purpose: 1, consumedAt: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpDocument = InferSchemaType<typeof otpSchema> & {
  userId?: Types.ObjectId | null;
};

export const OtpModel: Model<OtpDocument> = model<OtpDocument>('Otp', otpSchema);
