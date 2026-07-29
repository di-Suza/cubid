import { BidModel, type BidDocument } from './bid.model.js';

export class BidRepository {
  constructor(private readonly bidModel = BidModel) {}

  get model(): typeof this.bidModel {
    return this.bidModel;
  }
}

export const bidRepository = new BidRepository();

export type { BidDocument };
