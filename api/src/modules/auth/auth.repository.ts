import { OtpModel } from './otp.model.js';
import { AuthSessionModel } from './session/authSession.model.js';
import type { AuthSessionRecord } from './auth.service.js';

type LeanSession = Record<string, any>;

const toDate = (value: unknown): Date => (value instanceof Date ? value : new Date(String(value)));

const toSessionRecord = (session: LeanSession): AuthSessionRecord => ({
  id: String(session._id),
  userId: String(session.userId),
  refreshTokenHash: String(session.refreshTokenHash),
  userAgent: String(session.userAgent ?? ''),
  ipAddress: String(session.ipAddress ?? ''),
  revokedAt: session.revokedAt ? toDate(session.revokedAt) : null,
  expiresAt: toDate(session.expiresAt)
});

export class AuthRepository {
  constructor(
    private readonly sessionModel = AuthSessionModel,
    private readonly otpModel = OtpModel
  ) {}

  get sessions(): typeof this.sessionModel {
    return this.sessionModel;
  }

  get otps(): typeof this.otpModel {
    return this.otpModel;
  }

  async createSession(input: AuthSessionRecord): Promise<AuthSessionRecord> {
    const session = await this.sessionModel.create({
      _id: input.id,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      revokedAt: input.revokedAt,
      expiresAt: input.expiresAt
    });

    return toSessionRecord(session.toObject() as LeanSession);
  }

  async findSessionById(sessionId: string): Promise<AuthSessionRecord | null> {
    const session = await this.sessionModel.findById(sessionId).select('+refreshTokenHash').lean();

    return session ? toSessionRecord(session as LeanSession) : null;
  }

  async revokeSession(sessionId: string, revokedAt: Date): Promise<void> {
    await this.sessionModel.updateOne(
      {
        _id: sessionId,
        revokedAt: null
      },
      {
        $set: {
          revokedAt
        }
      }
    );
  }
}

export const authRepository = new AuthRepository();
