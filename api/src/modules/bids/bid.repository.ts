import { UserModel } from '../users/user.model.js';
import type { EngineBidRecord } from '../auction-engine/auctionEngine.types.js';
import { BidModel, type BidDocument } from './bid.model.js';

type LeanBid = Record<string, any>;

const toDate = (value: unknown): Date => (value instanceof Date ? value : new Date(String(value)));

const toPublicUser = (value: unknown, fallbackName: string) => {
  if (value && typeof value === 'object' && '_id' in value) {
    const record = value as { _id: unknown; name?: unknown };
    return {
      id: String(record._id),
      name: typeof record.name === 'string' ? record.name : fallbackName
    };
  }

  return {
    id: String(value),
    name: fallbackName
  };
};

export class BidRepository {
  constructor(
    private readonly bidModel = BidModel,
    private readonly userModel = UserModel
  ) {}

  get model(): typeof this.bidModel {
    return this.bidModel;
  }

  async findAcceptedByRequestId(input: {
    auctionId: string;
    bidderId: string;
    requestId: string;
  }): Promise<EngineBidRecord | null> {
    const bid = await this.bidModel
      .findOne({
        auctionId: input.auctionId,
        bidderId: input.bidderId,
        requestId: input.requestId,
        status: 'ACCEPTED'
      })
      .populate('bidderId', 'name')
      .lean();

    return bid ? this.toEngineRecord(bid as LeanBid) : null;
  }

  async findHighestAcceptedBid(auctionId: string): Promise<EngineBidRecord | null> {
    const bid = await this.bidModel
      .findOne({
        auctionId,
        status: 'ACCEPTED'
      })
      .sort({ amountMinor: -1, sequence: 1 })
      .populate('bidderId', 'name')
      .lean();

    return bid ? this.toEngineRecord(bid as LeanBid) : null;
  }

  async createAcceptedBid(input: {
    auctionId: string;
    bidderId: string;
    amountMinor: number;
    requestId: string;
    sequence: number;
  }): Promise<EngineBidRecord> {
    const bid = await this.bidModel.create({
      auctionId: input.auctionId,
      bidderId: input.bidderId,
      amountMinor: input.amountMinor,
      requestId: input.requestId,
      sequence: input.sequence,
      status: 'ACCEPTED'
    });
    const user = await this.userModel.findById(input.bidderId).select('name').lean();

    return {
      id: String(bid._id),
      auctionId: String(bid.auctionId),
      bidder: {
        id: input.bidderId,
        name: typeof user?.name === 'string' ? user.name : 'Bidder'
      },
      amountMinor: bid.amountMinor,
      requestId: bid.requestId,
      sequence: bid.sequence,
      createdAt: bid.createdAt
    };
  }

  async listRecentAcceptedBids(auctionId: string, limit: number): Promise<EngineBidRecord[]> {
    const bids = await this.bidModel
      .find({
        auctionId,
        status: 'ACCEPTED'
      })
      .sort({ sequence: -1 })
      .limit(limit)
      .populate('bidderId', 'name')
      .lean();

    return bids.map((bid) => this.toEngineRecord(bid as LeanBid)).reverse();
  }

  async countDistinctBidders(auctionId: string): Promise<number> {
    const bidders = await this.bidModel.distinct('bidderId', {
      auctionId,
      status: 'ACCEPTED'
    });

    return bidders.length;
  }

  async countAcceptedSince(auctionId: string, since: Date): Promise<number> {
    return this.bidModel.countDocuments({
      auctionId,
      status: 'ACCEPTED',
      createdAt: { $gte: since }
    });
  }

  private toEngineRecord(bid: LeanBid): EngineBidRecord {
    return {
      id: String(bid._id),
      auctionId: String(bid.auctionId),
      bidder: toPublicUser(bid.bidderId, 'Bidder'),
      amountMinor: Number(bid.amountMinor),
      requestId: String(bid.requestId),
      sequence: Number(bid.sequence),
      createdAt: toDate(bid.createdAt)
    };
  }
}

export const bidRepository = new BidRepository();

export type { BidDocument };
