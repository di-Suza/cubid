import { body } from 'express-validator';

import {
  nonNegativeIntegerBody,
  optionalIsoDateBody,
  positiveIntegerBody,
  requiredStringBody
} from '../../../shared/validators/common.js';

export const createAuctionValidators = [
  requiredStringBody('title', 140),
  requiredStringBody('description', 5000),
  body('imageUrl').isURL({ require_protocol: true }).withMessage('imageUrl must be a URL'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('currency must be a three-letter code'),
  nonNegativeIntegerBody('startingBidMinor'),
  positiveIntegerBody('minimumIncrementMinor'),
  optionalIsoDateBody('startAt'),
  body('durationSeconds')
    .isInt({ min: 10, max: 7 * 24 * 60 * 60 })
    .withMessage('durationSeconds must be between 10 seconds and 7 days')
];
