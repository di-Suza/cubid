import { AuctionResultModel, type AuctionResultDocument } from './result.model.js';

export class ResultRepository {
  constructor(private readonly resultModel = AuctionResultModel) {}

  get model(): typeof this.resultModel {
    return this.resultModel;
  }

  async createResultOnce(input: {
    auctionId: string;
    winnerId: string | null;
    winningBidId: string | null;
    winningAmountMinor: number;
    declaredAt: Date;
  }): Promise<void> {
    await this.resultModel.findOneAndUpdate(
      {
        auctionId: input.auctionId
      },
      {
        $setOnInsert: {
          auctionId: input.auctionId,
          winnerId: input.winnerId,
          winningBidId: input.winningBidId,
          winningAmountMinor: input.winningAmountMinor,
          declaredAt: input.declaredAt
        }
      },
      {
        upsert: true,
        new: true
      }
    );
  }
}

export const resultRepository = new ResultRepository();

export type { AuctionResultDocument };
