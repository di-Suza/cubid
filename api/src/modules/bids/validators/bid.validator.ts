import { body } from 'express-validator';

import { positiveIntegerBody } from '../../../shared/validators/common.js';

export const placeBidValidators = [
  body('auctionId').isMongoId().withMessage('auctionId must be valid'),
  positiveIntegerBody('amountMinor'),
  body('requestId').isString().trim().isLength({ min: 8, max: 120 }).withMessage('requestId is required')
];
