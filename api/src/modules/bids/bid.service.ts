import { bidRepository, type BidRepository } from './bid.repository.js';

export class BidService {
  constructor(private readonly repository: BidRepository = bidRepository) {}
}

export const bidService = new BidService();
