import { Router } from 'express';

import { requireAuth, validateRequest } from '../../shared/middleware/index.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { paymentController, type PaymentController } from './payment.controller.js';
import {
  checkoutOrderValidators,
  mockCheckoutValidators,
  paymentWebhookValidators,
  verifyCheckoutValidators
} from './validators/payment.validator.js';

export class PaymentRoute {
  readonly router = Router();

  constructor(private readonly controller: PaymentController = paymentController) {
    this.register();
  }

  private register(): void {
    this.router.get('/me/wins', requireAuth, asyncHandler(this.controller.myWins));
    this.router.post('/webhook', paymentWebhookValidators, validateRequest, asyncHandler(this.controller.webhook));
    this.router.post(
      '/:paymentId/order',
      requireAuth,
      checkoutOrderValidators,
      validateRequest,
      asyncHandler(this.controller.createCheckoutOrder)
    );
    this.router.post(
      '/:paymentId/verify',
      requireAuth,
      verifyCheckoutValidators,
      validateRequest,
      asyncHandler(this.controller.verifyCheckout)
    );
    this.router.post(
      '/:paymentId/mock-checkout',
      requireAuth,
      mockCheckoutValidators,
      validateRequest,
      asyncHandler(this.controller.mockCheckout)
    );
  }
}

export const paymentRoute = new PaymentRoute();
