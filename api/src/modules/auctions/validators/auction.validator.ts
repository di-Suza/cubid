import { body, query } from 'express-validator';

import { AUCTION_STATUSES } from '../../../shared/constants/auction.js';
import {
  mongoIdParam,
  nonNegativeIntegerBody,
  optionalIsoDateBody,
  positiveIntegerBody,
  requiredStringBody
} from '../../../shared/validators/common.js';

export const createAuctionValidators = [
  requiredStringBody('title', 140),
  requiredStringBody('description', 5000),
  body('imageUrl').optional().isURL({ require_protocol: true }).withMessage('imageUrl must be a URL'),
  body('imageDataUrl')
    .optional()
    .isString()
    .isLength({ max: 2_500_000 })
    .withMessage('imageDataUrl is too large'),
  body().custom((value) => {
    if (value.imageUrl || value.imageDataUrl) {
      return true;
    }

    throw new Error('imageUrl or imageDataUrl is required');
  }),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('currency must be a three-letter code'),
  nonNegativeIntegerBody('startingBidMinor'),
  positiveIntegerBody('minimumIncrementMinor'),
  optionalIsoDateBody('startAt'),
  body('durationSeconds')
    .isInt({ min: 10, max: 7 * 24 * 60 * 60 })
    .withMessage('durationSeconds must be between 10 seconds and 7 days')
];

export const listAuctionValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(AUCTION_STATUSES).withMessage('status must be a supported auction status'),
  query('search').optional().trim().isLength({ max: 120 }).withMessage('search is too long')
];

export const auctionDetailValidators = [mongoIdParam('auctionId')];
