import { Router } from 'express';

import { authController, type AuthController } from './auth.controller.js';

export class AuthRoute {
  readonly router = Router();

  constructor(private readonly controller: AuthController = authController) {
    this.register();
  }

  private register(): void {
    // Auth endpoints will be registered when registration/session flows are implemented.
  }
}

export const authRoute = new AuthRoute();
