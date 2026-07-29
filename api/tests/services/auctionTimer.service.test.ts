import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuctionTimerService } from '../../src/modules/auction-engine/auctionTimer.service.js';
import type {
  AuctionLifecycleResult,
  AuctionSnapshot,
  EngineAuctionRecord
} from '../../src/modules/auction-engine/auctionEngine.types.js';

const baseAuction = (overrides: Partial<EngineAuctionRecord> = {}): EngineAuctionRecord => ({
  id: 'auction-1',
  seller: { id: 'seller-1', name: 'Seller One' },
  title: 'Timer Test Auction',
  description: 'Timer test fixture',
  imageUrl: 'https://example.com/timer.png',
  currency: 'INR',
  startingBidMinor: 100_000,
  minimumIncrementMinor: 10_000,
  currentHighestBidMinor: 0,
  highestBidder: null,
  bidCount: 0,
  startAt: new Date(Date.now() - 1000),
  endAt: new Date(Date.now() + 60_000),
  status: 'UPCOMING',
  version: 1,
  lastSequence: 0,
  finalizedAt: null,
  winner: null,
  ...overrides
});

const snapshotFor = (auction: EngineAuctionRecord): AuctionSnapshot => ({
  auctionId: auction.id,
  status: auction.status,
  seller: auction.seller,
  title: auction.title,
  description: auction.description,
  imageUrl: auction.imageUrl,
  currency: auction.currency,
  startingBidMinor: auction.startingBidMinor,
  currentHighestBidMinor: auction.currentHighestBidMinor,
  highestBidder: auction.highestBidder,
  minimumIncrementMinor: auction.minimumIncrementMinor,
  minimumNextBidMinor: auction.bidCount === 0 ? auction.startingBidMinor : auction.currentHighestBidMinor + auction.minimumIncrementMinor,
  bidCount: auction.bidCount,
  startAt: auction.startAt.toISOString(),
  endAt: auction.endAt.toISOString(),
  serverNow: new Date().toISOString(),
  version: auction.version,
  lastSequence: auction.lastSequence,
  recentBids: [],
  timeline: [],
  stats: {
    activeBidders: 0,
    onlineViewers: 0,
    spectators: 0,
    heat: 'LOW'
  },
  permissions: {
    canBid: false,
    canChat: false,
    canManage: false,
    canPay: false,
    isOwner: false,
    isWinner: false
  },
  paymentStatus: 'NOT_REQUIRED'
});

class FakeTimerEngine {
  readonly started: string[] = [];
  readonly finalized: string[] = [];

  constructor(private readonly auctions: EngineAuctionRecord[]) {}

  getSchedulableAuctions = async () => this.auctions;

  startAuction = async (auctionId: string): Promise<AuctionLifecycleResult> => {
    this.started.push(auctionId);
    const auction = this.auctions.find((candidate) => candidate.id === auctionId);

    assert.ok(auction);
    auction.status = 'ACTIVE';
    auction.version += 1;
    auction.lastSequence += 1;

    return {
      changed: true,
      snapshot: snapshotFor(auction)
    };
  };

  finalizeAuction = async (auctionId: string): Promise<AuctionLifecycleResult> => {
    this.finalized.push(auctionId);
    const auction = this.auctions.find((candidate) => candidate.id === auctionId);

    assert.ok(auction);
    auction.status = 'COMPLETED';
    auction.version += 1;
    auction.lastSequence += 1;
    auction.finalizedAt = new Date();

    return {
      changed: true,
      snapshot: snapshotFor(auction)
    };
  };
}

describe('AuctionTimerService', () => {
  it('starts overdue upcoming auctions during timer restore', async () => {
    const engine = new FakeTimerEngine([baseAuction()]);
    const service = new AuctionTimerService(engine as never);
    const started: AuctionSnapshot[] = [];

    try {
      await service.restoreTimers({
        onAuctionStarted: (snapshot) => started.push(snapshot)
      });

      assert.deepEqual(engine.started, ['auction-1']);
      assert.equal(started[0]?.status, 'ACTIVE');
    } finally {
      service.shutdown();
    }
  });

  it('finalizes active auctions whose end time has already passed', async () => {
    const engine = new FakeTimerEngine([
      baseAuction({
        status: 'ACTIVE',
        endAt: new Date(Date.now() - 1)
      })
    ]);
    const service = new AuctionTimerService(engine as never);
    const ended: AuctionSnapshot[] = [];

    try {
      await service.restoreTimers({
        onAuctionEnded: (snapshot) => ended.push(snapshot)
      });

      assert.deepEqual(engine.finalized, ['auction-1']);
      assert.equal(ended[0]?.status, 'COMPLETED');
    } finally {
      service.shutdown();
    }
  });
});
