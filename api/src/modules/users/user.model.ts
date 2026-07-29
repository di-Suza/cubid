import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

import { USER_ROLES } from '../../shared/constants/roles.js';

export const USER_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'USER',
      index: true
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ name: 'text', email: 'text' });

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel: Model<UserDocument> = model<UserDocument>('User', userSchema);
