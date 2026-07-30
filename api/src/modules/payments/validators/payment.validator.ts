import { body } from 'express-validator';

import { mongoIdParam } from '../../../shared/validators/common.js';

export const createPaymentOrderValidators = [body('auctionId').isMongoId().withMessage('auctionId must be valid')];

export const paymentWebhookValidators = [
  body('gateway').isIn(['razorpay', 'stripe', 'mock']).withMessage('gateway must be supported')
];

export const mockCheckoutValidators = [
  mongoIdParam('paymentId'),
  body('outcome')
    .optional()
    .isIn(['SUCCESSFUL', 'FAILED'])
    .withMessage('outcome must be SUCCESSFUL or FAILED')
];
