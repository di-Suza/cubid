import { Router } from 'express';

import { userController, type UserController } from './user.controller.js';

export class UserRoute {
  readonly router = Router();

  constructor(private readonly controller: UserController = userController) {
    this.register();
  }

  private register(): void {
    // User endpoints will be registered when profile/account flows are implemented.
  }
}

export const userRoute = new UserRoute();
