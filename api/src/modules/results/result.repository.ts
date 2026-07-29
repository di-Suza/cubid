import { AuctionResultModel, type AuctionResultDocument } from './result.model.js';

export class ResultRepository {
  constructor(private readonly resultModel = AuctionResultModel) {}

  get model(): typeof this.resultModel {
    return this.resultModel;
  }
}

export const resultRepository = new ResultRepository();

export type { AuctionResultDocument };
