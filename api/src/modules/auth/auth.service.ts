import { authRepository, type AuthRepository } from './auth.repository.js';

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}
}

export const authService = new AuthService();
