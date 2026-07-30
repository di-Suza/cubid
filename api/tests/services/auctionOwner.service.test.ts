import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuctionService } from '../../src/modules/auctions/auction.service.js';
import type {
  AuctionRepositoryPort,
  CreateAuctionRepositoryInput,
  ListAuctionsQuery
} from '../../src/modules/auctions/auction.service.js';
import type { EngineAuctionRecord } from '../../src/modules/auction-engine/auctionEngine.types.js';
import { UnauthorizedError } from '../../src/shared/errors/UnauthorizedError.js';

const baseNow = new Date('2026-07-30T10:00:00.000Z');

const auction = (overrides: Partial<EngineAuctionRecord> = {}): EngineAuctionRecord => ({
  id: 'auction-1',
  seller: { id: 'seller-1', name: 'Seller One' },
  title: 'Seller Auction',
  description: 'Owned listing',
  imageUrl: 'https://example.com/item.jpg',
  currency: 'INR',
  startingBidMinor: 10_000,
  minimumIncrementMinor: 1_000,
  currentHighestBidMinor: 0,
  highestBidder: null,
  bidCount: 0,
  startAt: baseNow,
  endAt: new Date(baseNow.getTime() + 60 * 60 * 1000),
  status: 'ACTIVE',
  version: 0,
  lastSequence: 0,
  finalizedAt: null,
  winner: null,
  createdAt: baseNow,
  updatedAt: baseNow,
  ...overrides
});

class FakeAuctionRepository implements AuctionRepositoryPort {
  lastQuery?: ListAuctionsQuery;

  constructor(private readonly auctions: EngineAuctionRecord[]) {}

  async createAuction(input: CreateAuctionRepositoryInput) {
    const record = auction({
      id: `auction-${this.auctions.length + 1}`,
      seller: { id: input.sellerId, name: 'Seller' },
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      currency: input.currency,
      startingBidMinor: input.startingBidMinor,
      minimumIncrementMinor: input.minimumIncrementMinor,
      startAt: input.startAt,
      endAt: input.endAt,
      status: input.status
    });
    this.auctions.push(record);
    return record;
  }

  async listAuctions(query: ListAuctionsQuery) {
    this.lastQuery = query;
    const filtered = this.auctions.filter((item) => {
      const ownerMatches = query.sellerId ? item.seller.id === query.sellerId : true;
      const statusMatches = query.status ? item.status === query.status : true;

      return ownerMatches && statusMatches;
    });

    return {
      items: filtered,
      total: filtered.length
    };
  }

  async findById() {
    return null;
  }

  async findSchedulableAuctions() {
    return [];
  }

  async startAuction() {
    return null;
  }

  async applyAcceptedBid() {
    return null;
  }

  async finalizeAuction() {
    return null;
  }
}

const createHarness = () => {
  const auctions = new FakeAuctionRepository([
    auction({ id: 'auction-1', seller: { id: 'seller-1', name: 'Seller One' }, status: 'ACTIVE' }),
    auction({ id: 'auction-2', seller: { id: 'seller-2', name: 'Seller Two' }, status: 'ACTIVE' }),
    auction({ id: 'auction-3', seller: { id: 'seller-1', name: 'Seller One' }, status: 'COMPLETED' })
  ]);
  const service = new AuctionService({
    auctions,
    timelines: {
      createEvent: async () => {
        throw new Error('not used');
      },
      listRecentEvents: async () => []
    },
    scheduler: {
      scheduleAuction: () => undefined
    },
    now: () => baseNow
  });

  return {
    auctions,
    service
  };
};

describe('AuctionService owner queries', () => {
  it('returns only auctions owned by the authenticated seller', async () => {
    const { service } = createHarness();

    const result = await service.listMyAuctions({}, { userId: 'seller-1' });

    assert.deepEqual(
      result.items.map((item) => item.id),
      ['auction-1', 'auction-3']
    );
  });

  it('applies owner status filters', async () => {
    const { service } = createHarness();

    const result = await service.listMyAuctions({ status: 'COMPLETED' }, { userId: 'seller-1' });

    assert.deepEqual(
      result.items.map((item) => item.id),
      ['auction-3']
    );
  });

  it('rejects unauthenticated owner queries', async () => {
    const { service } = createHarness();

    await assert.rejects(() => service.listMyAuctions({}, {}), UnauthorizedError);
  });
});
