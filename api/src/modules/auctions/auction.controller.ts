import { auctionService, type AuctionService } from './auction.service.js';

export class AuctionController {
  constructor(private readonly service: AuctionService = auctionService) {}
}

export const auctionController = new AuctionController();
