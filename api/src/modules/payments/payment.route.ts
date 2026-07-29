import { Router } from 'express';

import { paymentController, type PaymentController } from './payment.controller.js';

export class PaymentRoute {
  readonly router = Router();

  constructor(private readonly controller: PaymentController = paymentController) {
    this.register();
  }

  private register(): void {
    // Payment endpoints will be registered when gateway integration is implemented.
  }
}

export const paymentRoute = new PaymentRoute();
