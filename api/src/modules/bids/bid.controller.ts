import { bidService, type BidService } from './bid.service.js';

export class BidController {
  constructor(private readonly service: BidService = bidService) {}
}

export const bidController = new BidController();
