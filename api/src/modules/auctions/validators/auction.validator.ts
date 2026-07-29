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
  nonNegativeIntegerBody('startingBidMinor'),
  positiveIntegerBody('minimumIncrementMinor'),
  optionalIsoDateBody('startAt'),
  positiveIntegerBody('durationSeconds')
];
