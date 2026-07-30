import type { FilterQuery } from 'mongoose';

import type { EngineAuctionRecord } from '../auction-engine/auctionEngine.types.js';
import type { CreateAuctionRepositoryInput, ListAuctionsQuery } from './auction.service.js';
import { AuctionModel, type AuctionDocument } from './auction.model.js';

type LeanAuction = Record<string, any>;

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

export class AuctionRepository {
  constructor(private readonly auctionModel = AuctionModel) {}

  get model(): typeof this.auctionModel {
    return this.auctionModel;
  }

  async createAuction(input: CreateAuctionRepositoryInput): Promise<EngineAuctionRecord> {
    const created = await this.auctionModel.create({
      sellerId: input.sellerId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      currency: input.currency,
      startingBidMinor: input.startingBidMinor,
      minimumIncrementMinor: input.minimumIncrementMinor,
      currentHighestBidMinor: 0,
      highestBidderId: null,
      bidCount: 0,
      startAt: input.startAt,
      endAt: input.endAt,
      status: input.status,
      version: 0,
      lastSequence: 0,
      finalizedAt: null,
      winnerId: null
    });

    const auction = await this.auctionModel
      .findById(created._id)
      .populate('sellerId', 'name')
      .populate('highestBidderId', 'name')
      .populate('winnerId', 'name')
      .lean();

    return this.toEngineRecord(auction as LeanAuction);
  }

  async listAuctions(query: ListAuctionsQuery): Promise<{ items: EngineAuctionRecord[]; total: number }> {
    const filter: FilterQuery<AuctionDocument> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.sellerId) {
      filter.sellerId = query.sellerId;
    }

    if (query.search) {
      filter.$text = {
        $search: query.search
      };
    }

    const skip = (query.page - 1) * query.limit;
    const [auctions, total] = await Promise.all([
      this.auctionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate('sellerId', 'name')
        .populate('highestBidderId', 'name')
        .populate('winnerId', 'name')
        .lean(),
      this.auctionModel.countDocuments(filter)
    ]);

    return {
      items: auctions.map((auction) => this.toEngineRecord(auction as LeanAuction)),
      total
    };
  }

  async findById(auctionId: string): Promise<EngineAuctionRecord | null> {
    const auction = await this.auctionModel
      .findById(auctionId)
      .populate('sellerId', 'name')
      .populate('highestBidderId', 'name')
      .populate('winnerId', 'name')
      .lean();

    return auction ? this.toEngineRecord(auction as LeanAuction) : null;
  }

  async findSchedulableAuctions(now: Date): Promise<EngineAuctionRecord[]> {
    const query: FilterQuery<AuctionDocument> = {
      $or: [
        {
          status: 'UPCOMING',
          startAt: { $lte: now }
        },
        {
          status: 'ACTIVE'
        }
      ]
    };

    const auctions = await this.auctionModel
      .find(query)
      .populate('sellerId', 'name')
      .populate('highestBidderId', 'name')
      .populate('winnerId', 'name')
      .lean();

    return auctions.map((auction) => this.toEngineRecord(auction as LeanAuction));
  }

  async startAuction(input: {
    auctionId: string;
    now: Date;
    expectedVersion: number;
    sequence: number;
    version: number;
  }): Promise<EngineAuctionRecord | null> {
    const auction = await this.auctionModel
      .findOneAndUpdate(
        {
          _id: input.auctionId,
          status: 'UPCOMING',
          startAt: { $lte: input.now },
          version: input.expectedVersion
        },
        {
          $set: {
            status: 'ACTIVE',
            lastSequence: input.sequence,
            version: input.version
          }
        },
        { new: true }
      )
      .populate('sellerId', 'name')
      .populate('highestBidderId', 'name')
      .populate('winnerId', 'name')
      .lean();

    return auction ? this.toEngineRecord(auction as LeanAuction) : null;
  }

  async applyAcceptedBid(input: {
    auctionId: string;
    bidderId: string;
    amountMinor: number;
    expectedVersion: number;
    sequence: number;
    version: number;
    now: Date;
  }): Promise<EngineAuctionRecord | null> {
    const auction = await this.auctionModel
      .findOneAndUpdate(
        {
          _id: input.auctionId,
          status: 'ACTIVE',
          finalizedAt: null,
          endAt: { $gt: input.now },
          version: input.expectedVersion
        },
        {
          $set: {
            currentHighestBidMinor: input.amountMinor,
            highestBidderId: input.bidderId,
            lastSequence: input.sequence,
            version: input.version
          },
          $inc: {
            bidCount: 1
          }
        },
        { new: true }
      )
      .populate('sellerId', 'name')
      .populate('highestBidderId', 'name')
      .populate('winnerId', 'name')
      .lean();

    return auction ? this.toEngineRecord(auction as LeanAuction) : null;
  }

  async finalizeAuction(input: {
    auctionId: string;
    winnerId: string | null;
    finalizedAt: Date;
    expectedVersion: number;
    sequence: number;
    version: number;
  }): Promise<EngineAuctionRecord | null> {
    const auction = await this.auctionModel
      .findOneAndUpdate(
        {
          _id: input.auctionId,
          status: 'ACTIVE',
          finalizedAt: null,
          version: input.expectedVersion
        },
        {
          $set: {
            status: 'COMPLETED',
            winnerId: input.winnerId,
            finalizedAt: input.finalizedAt,
            lastSequence: input.sequence,
            version: input.version
          }
        },
        { new: true }
      )
      .populate('sellerId', 'name')
      .populate('highestBidderId', 'name')
      .populate('winnerId', 'name')
      .lean();

    return auction ? this.toEngineRecord(auction as LeanAuction) : null;
  }

  private toEngineRecord(auction: LeanAuction): EngineAuctionRecord {
    const seller = toPublicUser(auction.sellerId, 'Seller');
    const highestBidder = auction.highestBidderId ? toPublicUser(auction.highestBidderId, 'Bidder') : null;
    const winner = auction.winnerId ? toPublicUser(auction.winnerId, 'Winner') : null;

    return {
      id: String(auction._id),
      seller,
      title: String(auction.title),
      description: String(auction.description),
      imageUrl: String(auction.imageUrl),
      currency: String(auction.currency),
      startingBidMinor: Number(auction.startingBidMinor),
      minimumIncrementMinor: Number(auction.minimumIncrementMinor),
      currentHighestBidMinor: Number(auction.currentHighestBidMinor),
      highestBidder,
      bidCount: Number(auction.bidCount),
      startAt: toDate(auction.startAt),
      endAt: toDate(auction.endAt),
      status: auction.status,
      version: Number(auction.version),
      lastSequence: Number(auction.lastSequence),
      finalizedAt: auction.finalizedAt ? toDate(auction.finalizedAt) : null,
      winner,
      createdAt: auction.createdAt ? toDate(auction.createdAt) : undefined,
      updatedAt: auction.updatedAt ? toDate(auction.updatedAt) : undefined
    };
  }
}

export const auctionRepository = new AuctionRepository();

export type { AuctionDocument };
