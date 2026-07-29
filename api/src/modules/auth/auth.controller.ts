import { authService, type AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}
}

export const authController = new AuthController();
