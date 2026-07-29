import bcrypt from 'bcryptjs';

const PASSWORD_SALT_ROUNDS = 12;

export class PasswordService {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }

  comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const passwordService = new PasswordService();
