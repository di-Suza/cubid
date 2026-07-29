import { Router } from 'express';

import { healthController, type HealthController } from './health.controller.js';

export class HealthRoute {
  readonly router = Router();

  constructor(private readonly controller: HealthController = healthController) {
    this.register();
  }

  private register(): void {
    this.router.get('/', this.controller.getStatus);
  }
}

export const healthRoute = new HealthRoute();
