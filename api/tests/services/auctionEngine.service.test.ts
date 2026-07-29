import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuctionEngineService } from '../../src/modules/auction-engine/auctionEngine.service.js';
import { AuctionQueueService } from '../../src/modules/auction-engine/auctionQueue.service.js';
import { AuctionSnapshotService } from '../../src/modules/auction-engine/auctionSnapshot.service.js';
import type {
  AuctionEngineAuctionRepository,
  AuctionEngineBidRepository,
  AuctionEnginePaymentRepository,
  AuctionEngineResultRepository,
  AuctionEngineTimelineRepository,
  EngineAuctionRecord,
  EngineBidRecord,
  EnginePaymentRecord,
  EngineTimelineEventRecord
} from '../../src/modules/auction-engine/auctionEngine.types.js';
import type { TimelineEventType } from '../../src/shared/constants/auction.js';

const baseNow = new Date('2026-07-30T10:00:00.000Z');

const users = {
  seller: { id: 'seller-1', name: 'Seller One' },
  bidderA: { id: 'bidder-a', name: 'Bidder A' },
  bidderB: { id: 'bidder-b', name: 'Bidder B' }
};

const createAuction = (overrides: Partial<EngineAuctionRecord> = {}): EngineAuctionRecord => ({
  id: 'auction-1',
  seller: users.seller,
  title: 'Vintage Keyboard',
  description: 'A clean auction record for engine tests.',
  imageUrl: 'https://example.com/keyboard.png',
  currency: 'INR',
  startingBidMinor: 100_000,
  minimumIncrementMinor: 10_000,
  currentHighestBidMinor: 0,
  highestBidder: null,
  bidCount: 0,
  startAt: new Date(baseNow.getTime() - 60_000),
  endAt: new Date(baseNow.getTime() + 60_000),
  status: 'ACTIVE',
  version: 1,
  lastSequence: 0,
  finalizedAt: null,
  winner: null,
  ...overrides
});

class FakeAuctionRepository implements AuctionEngineAuctionRepository {
  constructor(private auction: EngineAuctionRecord | null) {}

  findById = async () => this.auction;

  findSchedulableAuctions = async () => (this.auction ? [this.auction] : []);

  startAuction = async (input: Parameters<AuctionEngineAuctionRepository['startAuction']>[0]) => {
    if (!this.auction || this.auction.version !== input.expectedVersion || this.auction.status !== 'UPCOMING') {
      return null;
    }

    this.auction = {
      ...this.auction,
      status: 'ACTIVE',
      lastSequence: input.sequence,
      version: input.version
    };

    return this.auction;
  };

  applyAcceptedBid = async (input: Parameters<AuctionEngineAuctionRepository['applyAcceptedBid']>[0]) => {
    if (
      !this.auction ||
      this.auction.status !== 'ACTIVE' ||
      this.auction.finalizedAt ||
      this.auction.version !== input.expectedVersion ||
      input.now >= this.auction.endAt
    ) {
      return null;
    }

    const bidder = input.bidderId === users.bidderA.id ? users.bidderA : users.bidderB;

    this.auction = {
      ...this.auction,
      currentHighestBidMinor: input.amountMinor,
      highestBidder: bidder,
      bidCount: this.auction.bidCount + 1,
      lastSequence: input.sequence,
      version: input.version
    };

    return this.auction;
  };

  finalizeAuction = async (input: Parameters<AuctionEngineAuctionRepository['finalizeAuction']>[0]) => {
    if (!this.auction || this.auction.status !== 'ACTIVE' || this.auction.version !== input.expectedVersion) {
      return null;
    }

    const winner = input.winnerId === users.bidderA.id ? users.bidderA : input.winnerId === users.bidderB.id ? users.bidderB : null;

    this.auction = {
      ...this.auction,
      status: 'COMPLETED',
      finalizedAt: input.finalizedAt,
      winner,
      lastSequence: input.sequence,
      version: input.version
    };

    return this.auction;
  };

  get current() {
    return this.auction;
  }
}

class FakeBidRepository implements AuctionEngineBidRepository {
  readonly bids: EngineBidRecord[] = [];

  findAcceptedByRequestId = async (input: Parameters<AuctionEngineBidRepository['findAcceptedByRequestId']>[0]) =>
    this.bids.find(
      (bid) => bid.auctionId === input.auctionId && bid.bidder.id === input.bidderId && bid.requestId === input.requestId
    ) ?? null;

  findHighestAcceptedBid = async (auctionId: string) =>
    this.bids
      .filter((bid) => bid.auctionId === auctionId)
      .sort((a, b) => b.amountMinor - a.amountMinor || a.sequence - b.sequence)[0] ?? null;

  createAcceptedBid = async (input: Parameters<AuctionEngineBidRepository['createAcceptedBid']>[0]) => {
    const bidder = input.bidderId === users.bidderA.id ? users.bidderA : users.bidderB;
    const bid: EngineBidRecord = {
      id: `bid-${this.bids.length + 1}`,
      auctionId: input.auctionId,
      bidder,
      amountMinor: input.amountMinor,
      requestId: input.requestId,
      sequence: input.sequence,
      createdAt: baseNow
    };

    this.bids.push(bid);
    return bid;
  };

  listRecentAcceptedBids = async () => [...this.bids];

  countDistinctBidders = async () => new Set(this.bids.map((bid) => bid.bidder.id)).size;

  countAcceptedSince = async () => this.bids.length;
}

class FakeTimelineRepository implements AuctionEngineTimelineRepository {
  readonly events: EngineTimelineEventRecord[] = [];

  createEvent = async (input: Parameters<AuctionEngineTimelineRepository['createEvent']>[0]) => {
    const event: EngineTimelineEventRecord = {
      id: `event-${this.events.length + 1}`,
      auctionId: input.auctionId,
      type: input.type as TimelineEventType,
      sequence: input.sequence,
      actorPublicId: input.actorPublicId,
      publicMetadata: input.publicMetadata ?? {},
      createdAt: baseNow
    };

    this.events.push(event);
    return event;
  };

  listRecentEvents = async () => [...this.events];
}

class FakeResultRepository implements AuctionEngineResultRepository {
  readonly results: Array<Parameters<AuctionEngineResultRepository['createResultOnce']>[0]> = [];

  createResultOnce = async (input: Parameters<AuctionEngineResultRepository['createResultOnce']>[0]) => {
    if (!this.results.some((result) => result.auctionId === input.auctionId)) {
      this.results.push(input);
    }
  };
}

class FakePaymentRepository implements AuctionEnginePaymentRepository {
  readonly payments: EnginePaymentRecord[] = [];

  createPendingForWinner = async (input: Parameters<AuctionEnginePaymentRepository['createPendingForWinner']>[0]) => {
    const payment: EnginePaymentRecord = {
      id: `payment-${this.payments.length + 1}`,
      auctionId: input.auctionId,
      winnerId: input.winnerId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      gateway: 'mock',
      status: 'PENDING',
      verifiedAt: null
    };

    this.payments.push(payment);
    return payment;
  };

  findLatestByAuctionId = async (auctionId: string) =>
    [...this.payments].reverse().find((payment) => payment.auctionId === auctionId) ?? null;
}

const createHarness = (auction = createAuction(), now = () => baseNow) => {
  const auctions = new FakeAuctionRepository(auction);
  const bids = new FakeBidRepository();
  const timelines = new FakeTimelineRepository();
  const results = new FakeResultRepository();
  const payments = new FakePaymentRepository();
  const snapshots = new AuctionSnapshotService(bids, timelines, payments);
  const service = new AuctionEngineService({
    queue: new AuctionQueueService(),
    auctions,
    bids,
    timelines,
    results,
    payments,
    snapshots,
    now
  });

  return {
    service,
    auctions,
    bids,
    timelines,
    results,
    payments
  };
};

describe('AuctionEngineService', () => {
  it('accepts a first bid at the starting bid and persists authoritative state before returning', async () => {
    const { service, auctions, bids, timelines } = createHarness();

    const result = await service.placeBid({
      auctionId: 'auction-1',
      amountMinor: 100_000,
      requestId: 'request-1',
      actor: { userId: users.bidderA.id },
      liveStats: { onlineViewers: 3 }
    });

    assert.equal(result.ok, true);
    assert.equal(result.duplicate, false);
    assert.equal(result.bid.sequence, 1);
    assert.equal(auctions.current?.currentHighestBidMinor, 100_000);
    assert.equal(auctions.current?.highestBidder?.id, users.bidderA.id);
    assert.equal(auctions.current?.version, 2);
    assert.equal(bids.bids.length, 1);
    assert.equal(timelines.events[0]?.type, 'BID_ACCEPTED');
    assert.equal(result.snapshot.minimumNextBidMinor, 110_000);
  });

  it('orders same-amount concurrent bids through the auction queue and rejects the stale bid', async () => {
    const { service } = createHarness();

    const [first, second] = await Promise.all([
      service.placeBid({
        auctionId: 'auction-1',
        amountMinor: 100_000,
        requestId: 'request-1',
        actor: { userId: users.bidderA.id }
      }),
      service.placeBid({
        auctionId: 'auction-1',
        amountMinor: 100_000,
        requestId: 'request-2',
        actor: { userId: users.bidderB.id }
      })
    ]);

    assert.equal(first.ok, true);
    assert.equal(second.ok, false);

    if (!second.ok) {
      assert.equal(second.code, 'BID_TOO_LOW');
      assert.equal(second.minimumNextBidMinor, 110_000);
    }
  });

  it('returns the original accepted bid for a duplicate request id', async () => {
    const { service, bids } = createHarness();
    const payload = {
      auctionId: 'auction-1',
      amountMinor: 100_000,
      requestId: 'request-1',
      actor: { userId: users.bidderA.id }
    };

    const first = await service.placeBid(payload);
    const duplicate = await service.placeBid(payload);

    assert.equal(first.ok, true);
    assert.equal(duplicate.ok, true);

    if (duplicate.ok) {
      assert.equal(duplicate.duplicate, true);
      assert.equal(duplicate.bid.id, 'bid-1');
    }

    assert.equal(bids.bids.length, 1);
  });

  it('finalizes an ended auction with a winner, result, payment, and timeline events', async () => {
    const endedAuction = createAuction({
      endAt: new Date(baseNow.getTime() - 1),
      currentHighestBidMinor: 120_000,
      highestBidder: users.bidderA,
      bidCount: 1,
      lastSequence: 1
    });
    const { service, auctions, bids, timelines, results, payments } = createHarness(endedAuction);
    bids.bids.push({
      id: 'bid-1',
      auctionId: 'auction-1',
      bidder: users.bidderA,
      amountMinor: 120_000,
      requestId: 'request-1',
      sequence: 1,
      createdAt: baseNow
    });

    const result = await service.finalizeAuction('auction-1', { userId: users.seller.id });

    assert.equal(result.changed, true);
    assert.equal(auctions.current?.status, 'COMPLETED');
    assert.equal(auctions.current?.winner?.id, users.bidderA.id);
    assert.equal(results.results[0]?.winnerId, users.bidderA.id);
    assert.equal(payments.payments[0]?.status, 'PENDING');
    assert.deepEqual(
      timelines.events.map((event) => event.type),
      ['AUCTION_ENDED', 'WINNER_DECLARED', 'PAYMENT_PENDING']
    );
  });

  it('finalizes an auction with no bids without creating a payment', async () => {
    const endedAuction = createAuction({
      endAt: new Date(baseNow.getTime() - 1)
    });
    const { service, auctions, results, payments } = createHarness(endedAuction);

    const result = await service.finalizeAuction('auction-1');

    assert.equal(result.changed, true);
    assert.equal(auctions.current?.status, 'COMPLETED');
    assert.equal(auctions.current?.winner, null);
    assert.equal(results.results[0]?.winnerId, null);
    assert.equal(payments.payments.length, 0);
  });
});
