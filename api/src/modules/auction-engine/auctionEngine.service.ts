import { auctionQueueService, type AuctionQueueService } from './auctionQueue.service.js';

export class AuctionEngineService {
  constructor(private readonly queue: AuctionQueueService = auctionQueueService) {}
}

export const auctionEngineService = new AuctionEngineService();
