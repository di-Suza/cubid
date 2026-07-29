import { body } from 'express-validator';

export const createPaymentOrderValidators = [body('auctionId').isMongoId().withMessage('auctionId must be valid')];

export const paymentWebhookValidators = [
  body('gateway').isIn(['razorpay', 'stripe', 'mock']).withMessage('gateway must be supported')
];
