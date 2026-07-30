import { Router } from 'express';

import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { authRateLimiter, requireAuth, validateRequest } from '../../shared/middleware/index.js';
import { authController, type AuthController } from './auth.controller.js';
import { loginValidators, registerValidators } from './validators/auth.validator.js';

export class AuthRoute {
  readonly router = Router();

  constructor(private readonly controller: AuthController = authController) {
    this.register();
  }

  private register(): void {
    this.router.post(
      '/register',
      authRateLimiter,
      registerValidators,
      validateRequest,
      asyncHandler(this.controller.register)
    );
    this.router.post('/login', authRateLimiter, loginValidators, validateRequest, asyncHandler(this.controller.login));
    this.router.post('/refresh', asyncHandler(this.controller.refresh));
    this.router.post('/logout', asyncHandler(this.controller.logout));
    this.router.get('/me', requireAuth, asyncHandler(this.controller.me));
  }
}

export const authRoute = new AuthRoute();
