import { Router } from 'express';

import { requireAuth, validateRequest } from '../../shared/middleware/index.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { auctionController, type AuctionController } from './auction.controller.js';
import {
  auctionDetailValidators,
  createAuctionValidators,
  listAuctionValidators
} from './validators/auction.validator.js';

export class AuctionRoute {
  readonly router = Router();

  constructor(private readonly controller: AuctionController = auctionController) {
    this.register();
  }

  private register(): void {
    this.router.get('/', listAuctionValidators, validateRequest, asyncHandler(this.controller.list));
    this.router.post('/', requireAuth, createAuctionValidators, validateRequest, asyncHandler(this.controller.create));
    this.router.get(
      '/:auctionId',
      auctionDetailValidators,
      validateRequest,
      asyncHandler(this.controller.detail)
    );
  }
}

export const auctionRoute = new AuctionRoute();
