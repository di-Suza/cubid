import { Router } from 'express';

import { auctionController, type AuctionController } from './auction.controller.js';

export class AuctionRoute {
  readonly router = Router();

  constructor(private readonly controller: AuctionController = auctionController) {
    this.register();
  }

  private register(): void {
    // Auction endpoints will be registered when creation/discovery flows are implemented.
  }
}

export const auctionRoute = new AuctionRoute();
