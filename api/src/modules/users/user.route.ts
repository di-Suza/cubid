import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/index.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { userController, type UserController } from './user.controller.js';

export class UserRoute {
  readonly router = Router();

  constructor(private readonly controller: UserController = userController) {
    this.register();
  }

  private register(): void {
    this.router.get('/me', requireAuth, asyncHandler(this.controller.me));
  }
}

export const userRoute = new UserRoute();
