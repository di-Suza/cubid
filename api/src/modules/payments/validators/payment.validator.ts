import { body } from 'express-validator';

import { mongoIdParam } from '../../../shared/validators/common.js';

export const createPaymentOrderValidators = [body('auctionId').isMongoId().withMessage('auctionId must be valid')];

export const paymentWebhookValidators = [
  body('gateway').optional().isIn(['razorpay', 'stripe', 'mock']).withMessage('gateway must be supported')
];

export const mockCheckoutValidators = [
  mongoIdParam('paymentId'),
  body('outcome')
    .optional()
    .isIn(['SUCCESSFUL', 'FAILED'])
    .withMessage('outcome must be SUCCESSFUL or FAILED')
];

export const checkoutOrderValidators = [mongoIdParam('paymentId')];

export const verifyCheckoutValidators = [
  mongoIdParam('paymentId'),
  body('gatewayOrderId').isString().trim().notEmpty().withMessage('gatewayOrderId is required'),
  body('gatewayPaymentId').optional().isString().trim().notEmpty().withMessage('gatewayPaymentId must be a string'),
  body('gatewaySignature').optional().isString().trim().notEmpty().withMessage('gatewaySignature must be a string'),
  body('outcome').optional().isIn(['SUCCESSFUL', 'FAILED']).withMessage('outcome must be SUCCESSFUL or FAILED')
];
