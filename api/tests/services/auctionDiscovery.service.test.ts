import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuctionService } from '../../src/modules/auctions/auction.service.js';
import type {
  AuctionRepositoryPort,
  CreateAuctionRepositoryInput,
  ListAuctionsQuery
} from '../../src/modules/auctions/auction.service.js';
import type { EngineAuctionRecord } from '../../src/modules/auction-engine/auctionEngine.types.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';

const seller = { id: 'seller-1', name: 'Seller One' };
const baseNow = new Date('2026-07-30T10:00:00.000Z');

const auction = (overrides: Partial<EngineAuctionRecord> = {}): EngineAuctionRecord => ({
  id: overrides.id ?? 'auction-1',
  seller,
  title: 'Vintage Camera',
  description: 'Rangefinder camera with original case.',
  imageUrl: 'https://example.com/camera.jpg',
  currency: 'INR',
  startingBidMinor: 50_000,
  minimumIncrementMinor: 5_000,
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
    const search = query.search?.toLowerCase();
    const filtered = this.auctions.filter((item) => {
      const statusMatches = query.status ? item.status === query.status : true;
      const searchMatches = search
        ? `${item.title} ${item.description}`.toLowerCase().includes(search)
        : true;

      return statusMatches && searchMatches;
    });

    return {
      items: filtered.slice((query.page - 1) * query.limit, query.page * query.limit),
      total: filtered.length
    };
  }

  async findById(auctionId: string) {
    return this.auctions.find((item) => item.id === auctionId) ?? null;
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
    auction({ id: 'auction-1', status: 'ACTIVE', title: 'Vintage Camera' }),
    auction({ id: 'auction-2', status: 'UPCOMING', title: 'Mechanical Keyboard' }),
    auction({ id: 'auction-3', status: 'COMPLETED', title: 'Studio Microphone' })
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

describe('AuctionService discovery', () => {
  it('lists auctions with pagination metadata', async () => {
    const { service } = createHarness();

    const result = await service.listAuctions({ page: '1', limit: '2' });

    assert.equal(result.items.length, 2);
    assert.equal(result.meta.total, 3);
    assert.equal(result.meta.hasNextPage, true);
  });

  it('filters auctions by status', async () => {
    const { service } = createHarness();

    const result = await service.listAuctions({ status: 'UPCOMING' });

    assert.deepEqual(
      result.items.map((item) => item.id),
      ['auction-2']
    );
  });

  it('filters auctions by search query', async () => {
    const { service } = createHarness();

    const result = await service.listAuctions({ search: 'keyboard' });

    assert.deepEqual(
      result.items.map((item) => item.id),
      ['auction-2']
    );
  });

  it('returns auction detail when found', async () => {
    const { service } = createHarness();

    const result = await service.getAuctionDetail('auction-1');

    assert.equal(result.title, 'Vintage Camera');
    assert.equal(result.seller.name, 'Seller One');
  });

  it('throws a stable not-found error for missing auction detail', async () => {
    const { service } = createHarness();

    await assert.rejects(() => service.getAuctionDetail('missing'), NotFoundError);
  });
});
