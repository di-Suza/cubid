import { AuctionModel, type AuctionDocument } from './auction.model.js';

export class AuctionRepository {
  constructor(private readonly auctionModel = AuctionModel) {}

  get model(): typeof this.auctionModel {
    return this.auctionModel;
  }
}

export const auctionRepository = new AuctionRepository();

export type { AuctionDocument };
