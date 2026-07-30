import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuctionService } from '../../src/modules/auctions/auction.service.js';
import type {
  AuctionRepositoryPort,
  AuctionSchedulerPort,
  CreateAuctionRepositoryInput
} from '../../src/modules/auctions/auction.service.js';
import type {
  AuctionEngineTimelineRepository,
  EngineAuctionRecord,
  EngineTimelineEventRecord
} from '../../src/modules/auction-engine/auctionEngine.types.js';
import { BadRequestError } from '../../src/shared/errors/BadRequestError.js';
import { UnauthorizedError } from '../../src/shared/errors/UnauthorizedError.js';

const baseNow = new Date('2026-07-30T10:00:00.000Z');
const seller = { id: 'seller-1', name: 'Seller One' };

const createAuctionRecord = (input: CreateAuctionRepositoryInput): EngineAuctionRecord => ({
  id: 'auction-1',
  seller,
  title: input.title,
  description: input.description,
  imageUrl: input.imageUrl,
  currency: input.currency,
  startingBidMinor: input.startingBidMinor,
  minimumIncrementMinor: input.minimumIncrementMinor,
  currentHighestBidMinor: 0,
  highestBidder: null,
  bidCount: 0,
  startAt: input.startAt,
  endAt: input.endAt,
  status: input.status,
  version: 0,
  lastSequence: 0,
  finalizedAt: null,
  winner: null,
  createdAt: baseNow,
  updatedAt: baseNow
});

class FakeAuctionRepository implements AuctionRepositoryPort {
  created?: CreateAuctionRepositoryInput;

  async createAuction(input: CreateAuctionRepositoryInput) {
    this.created = input;
    return createAuctionRecord(input);
  }

  async listAuctions() {
    return {
      items: [],
      total: 0
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

class FakeTimelineRepository implements AuctionEngineTimelineRepository {
  readonly events: EngineTimelineEventRecord[] = [];

  async createEvent(input: Parameters<AuctionEngineTimelineRepository['createEvent']>[0]) {
    const event: EngineTimelineEventRecord = {
      id: `event-${this.events.length + 1}`,
      auctionId: input.auctionId,
      type: input.type,
      sequence: input.sequence,
      actorPublicId: input.actorPublicId,
      publicMetadata: input.publicMetadata ?? {},
      createdAt: baseNow
    };

    this.events.push(event);
    return event;
  }

  async listRecentEvents() {
    return this.events;
  }
}

class FakeScheduler implements AuctionSchedulerPort {
  scheduled: EngineAuctionRecord[] = [];

  scheduleAuction(auction: EngineAuctionRecord) {
    this.scheduled.push(auction);
  }
}

const createHarness = () => {
  const auctions = new FakeAuctionRepository();
  const timelines = new FakeTimelineRepository();
  const scheduler = new FakeScheduler();
  const service = new AuctionService({
    auctions,
    timelines,
    scheduler,
    now: () => baseNow
  });

  return {
    auctions,
    scheduler,
    service,
    timelines
  };
};

const validInput = {
  title: '  Vintage Camera  ',
  description: '  A working rangefinder camera.  ',
  imageUrl: 'https://example.com/camera.jpg',
  startingBidMinor: 50_000,
  minimumIncrementMinor: 5_000,
  durationSeconds: 3_600
};

describe('AuctionService', () => {
  it('creates an active auction for an authenticated seller and records the creation timeline', async () => {
    const { auctions, scheduler, service, timelines } = createHarness();

    const result = await service.createAuction(validInput, { userId: seller.id });

    assert.equal(result.title, 'Vintage Camera');
    assert.equal(result.status, 'ACTIVE');
    assert.equal(auctions.created?.sellerId, seller.id);
    assert.equal(auctions.created?.currency, 'INR');
    assert.equal(auctions.created?.startAt.toISOString(), baseNow.toISOString());
    assert.equal(auctions.created?.endAt.toISOString(), '2026-07-30T11:00:00.000Z');
    assert.equal(timelines.events[0]?.type, 'AUCTION_CREATED');
    assert.equal(timelines.events[0]?.actorPublicId, seller.id);
    assert.equal(scheduler.scheduled[0]?.id, result.id);
  });

  it('accepts an uploaded image data URL instead of a remote image link', async () => {
    const { auctions, service } = createHarness();
    const imageDataUrl = 'data:image/png;base64,aGVsbG8=';

    const result = await service.createAuction(
      {
        ...validInput,
        imageUrl: undefined,
        imageDataUrl
      },
      { userId: seller.id }
    );

    assert.equal(result.imageUrl, imageDataUrl);
    assert.equal(auctions.created?.imageUrl, imageDataUrl);
  });

  it('rejects unauthenticated auction creation', async () => {
    const { service } = createHarness();

    await assert.rejects(() => service.createAuction(validInput, {}), UnauthorizedError);
  });

  it('rejects invalid start and duration ranges before repository work', async () => {
    const { auctions, service } = createHarness();

    await assert.rejects(
      () =>
        service.createAuction(
          {
            ...validInput,
            startAt: '2026-07-30T09:59:00.000Z'
          },
          { userId: seller.id }
        ),
      BadRequestError
    );

    await assert.rejects(
      () =>
        service.createAuction(
          {
            ...validInput,
            durationSeconds: 5
          },
          { userId: seller.id }
        ),
      BadRequestError
    );

    assert.equal(auctions.created, undefined);
  });

  it('rejects invalid money values before repository work', async () => {
    const { auctions, service } = createHarness();

    await assert.rejects(
      () =>
        service.createAuction(
          {
            ...validInput,
            startingBidMinor: -1
          },
          { userId: seller.id }
        ),
      BadRequestError
    );

    await assert.rejects(
      () =>
        service.createAuction(
          {
            ...validInput,
            minimumIncrementMinor: 0
          },
          { userId: seller.id }
        ),
      BadRequestError
    );

    assert.equal(auctions.created, undefined);
  });
});
