import { OtpModel } from './otp.model.js';
import { AuthSessionModel } from './session/authSession.model.js';

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
}

export const authRepository = new AuthRepository();
