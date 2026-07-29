import { Router } from 'express';

import { bidController, type BidController } from './bid.controller.js';

export class BidRoute {
  readonly router = Router();

  constructor(private readonly controller: BidController = bidController) {
    this.register();
  }

  private register(): void {
    // Live bids will use Socket.IO. HTTP bid history endpoints can be added later.
  }
}

export const bidRoute = new BidRoute();
