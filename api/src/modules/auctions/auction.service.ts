import { auctionRepository, type AuctionRepository } from './auction.repository.js';

export class AuctionService {
  constructor(private readonly repository: AuctionRepository = auctionRepository) {}
}

export const auctionService = new AuctionService();
