import { auctionRepository } from '../auctions/auction.repository.js';
import { bidRepository } from '../bids/bid.repository.js';
import { paymentRepository } from '../payments/payment.repository.js';
import { resultRepository } from '../results/result.repository.js';
import { timelineRepository } from '../timeline/timeline.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { auctionQueueService, type AuctionQueueService } from './auctionQueue.service.js';
import { auctionSnapshotService, type AuctionSnapshotService } from './auctionSnapshot.service.js';
import type {
  AuctionEngineActor,
  AuctionEngineAuctionRepository,
  AuctionEngineBidRepository,
  AuctionEnginePaymentRepository,
  AuctionEngineResultRepository,
  AuctionEngineTimelineRepository,
  AuctionLifecycleResult,
  AuctionSnapshot,
  BidRejectionCode,
  EngineAuctionRecord,
  PlaceBidInput,
  PlaceBidResult
} from './auctionEngine.types.js';

interface AuctionEngineServiceDependencies {
  queue?: AuctionQueueService;
  auctions?: AuctionEngineAuctionRepository;
  bids?: AuctionEngineBidRepository;
  timelines?: AuctionEngineTimelineRepository;
  results?: AuctionEngineResultRepository;
  payments?: AuctionEnginePaymentRepository;
  snapshots?: AuctionSnapshotService;
  now?: () => Date;
}

export class AuctionEngineService {
  private readonly queue: AuctionQueueService;
  private readonly auctions: AuctionEngineAuctionRepository;
  private readonly bids: AuctionEngineBidRepository;
  private readonly timelines: AuctionEngineTimelineRepository;
  private readonly results: AuctionEngineResultRepository;
  private readonly payments: AuctionEnginePaymentRepository;
  private readonly snapshots: AuctionSnapshotService;
  private readonly now: () => Date;

  constructor(dependencies: AuctionEngineServiceDependencies = {}) {
    this.queue = dependencies.queue ?? auctionQueueService;
    this.auctions = dependencies.auctions ?? auctionRepository;
    this.bids = dependencies.bids ?? bidRepository;
    this.timelines = dependencies.timelines ?? timelineRepository;
    this.results = dependencies.results ?? resultRepository;
    this.payments = dependencies.payments ?? paymentRepository;
    this.snapshots = dependencies.snapshots ?? auctionSnapshotService;
    this.now = dependencies.now ?? (() => new Date());
  }

  async getSnapshot(
    auctionId: string,
    actor: AuctionEngineActor = {},
    liveStats = {}
  ): Promise<AuctionSnapshot> {
    const auction = await this.auctions.findById(auctionId);

    if (!auction) {
      throw new NotFoundError('Auction not found', 'AUCTION_NOT_FOUND');
    }

    return this.snapshots.buildSnapshot(auction, actor, liveStats, this.now());
  }

  async placeBid(input: PlaceBidInput): Promise<PlaceBidResult> {
    if (!input.actor.userId) {
      return this.reject('AUTH_REQUIRED', 'Authentication required');
    }

    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
      return this.reject('INVALID_AMOUNT', 'Bid amount must be a positive integer');
    }

    if (!input.requestId || input.requestId.length > 120) {
      return this.reject('INVALID_AMOUNT', 'requestId is required');
    }

    return this.queue.run(input.auctionId, async () => this.placeBidInQueue(input));
  }

  async startAuction(auctionId: string, actor: AuctionEngineActor = {}): Promise<AuctionLifecycleResult> {
    return this.queue.run(auctionId, async () => {
      const auction = await this.loadAuctionOrThrow(auctionId);
      const now = this.now();

      if (auction.status !== 'UPCOMING' || auction.startAt > now) {
        return {
          changed: false,
          snapshot: await this.snapshots.buildSnapshot(auction, actor, {}, now)
        };
      }

      const startedAuction = await this.auctions.startAuction({
        auctionId,
        now,
        expectedVersion: auction.version,
        sequence: auction.lastSequence + 1,
        version: auction.version + 1
      });

      if (!startedAuction) {
        return {
          changed: false,
          snapshot: await this.getSnapshot(auctionId, actor)
        };
      }

      await this.timelines.createEvent({
        auctionId,
        type: 'AUCTION_STARTED',
        sequence: startedAuction.lastSequence,
        actorPublicId: null
      });

      return {
        changed: true,
        snapshot: await this.snapshots.buildSnapshot(startedAuction, actor, {}, now)
      };
    });
  }

  async finalizeAuction(auctionId: string, actor: AuctionEngineActor = {}): Promise<AuctionLifecycleResult> {
    return this.queue.run(auctionId, async () => {
      const auction = await this.loadAuctionOrThrow(auctionId);
      const now = this.now();

      if (auction.status === 'COMPLETED' || auction.finalizedAt) {
        return {
          changed: false,
          snapshot: await this.snapshots.buildSnapshot(auction, actor, {}, now)
        };
      }

      if (auction.status !== 'ACTIVE' || now < auction.endAt) {
        return {
          changed: false,
          snapshot: await this.snapshots.buildSnapshot(auction, actor, {}, now)
        };
      }

      const events = auction.highestBidder ? ['AUCTION_ENDED', 'WINNER_DECLARED', 'PAYMENT_PENDING'] : ['AUCTION_ENDED'];
      const finalSequence = auction.lastSequence + events.length;
      const finalizedAuction = await this.auctions.finalizeAuction({
        auctionId,
        winnerId: auction.highestBidder?.id ?? null,
        finalizedAt: now,
        expectedVersion: auction.version,
        sequence: finalSequence,
        version: auction.version + 1
      });

      if (!finalizedAuction) {
        return {
          changed: false,
          snapshot: await this.getSnapshot(auctionId, actor)
        };
      }

      const winningBid = auction.highestBidder ? await this.bids.findHighestAcceptedBid(auctionId) : null;

      await this.results.createResultOnce({
        auctionId,
        winnerId: auction.highestBidder?.id ?? null,
        winningBidId: winningBid?.id ?? null,
        winningAmountMinor: auction.highestBidder ? auction.currentHighestBidMinor : 0,
        declaredAt: now
      });

      await this.timelines.createEvent({
        auctionId,
        type: 'AUCTION_ENDED',
        sequence: auction.lastSequence + 1,
        actorPublicId: null
      });

      if (auction.highestBidder) {
        await this.timelines.createEvent({
          auctionId,
          type: 'WINNER_DECLARED',
          sequence: auction.lastSequence + 2,
          actorPublicId: auction.highestBidder.id,
          publicMetadata: {
            amountMinor: auction.currentHighestBidMinor
          }
        });

        await this.payments.createPendingForWinner({
          auctionId,
          winnerId: auction.highestBidder.id,
          amountMinor: auction.currentHighestBidMinor,
          currency: auction.currency
        });

        await this.timelines.createEvent({
          auctionId,
          type: 'PAYMENT_PENDING',
          sequence: auction.lastSequence + 3,
          actorPublicId: auction.highestBidder.id
        });
      }

      return {
        changed: true,
        snapshot: await this.snapshots.buildSnapshot(finalizedAuction, actor, {}, now)
      };
    });
  }

  async getSchedulableAuctions(): Promise<EngineAuctionRecord[]> {
    return this.auctions.findSchedulableAuctions(this.now());
  }

  private async placeBidInQueue(input: PlaceBidInput): Promise<PlaceBidResult> {
    const userId = input.actor.userId;
    const auction = await this.auctions.findById(input.auctionId);
    const now = this.now();

    if (!userId) {
      return this.reject('AUTH_REQUIRED', 'Authentication required');
    }

    if (!auction) {
      return this.reject('AUCTION_NOT_FOUND', 'Auction not found');
    }

    const existingBid = await this.bids.findAcceptedByRequestId({
      auctionId: input.auctionId,
      bidderId: userId,
      requestId: input.requestId
    });

    if (existingBid) {
      return {
        ok: true,
        duplicate: true,
        bid: existingBid,
        snapshot: await this.snapshots.buildSnapshot(auction, input.actor, input.liveStats, now)
      };
    }

    if (auction.status === 'UPCOMING') {
      return this.rejectWithSnapshot('AUCTION_NOT_STARTED', 'Auction has not started', auction, input.actor, input.liveStats);
    }

    if (auction.status !== 'ACTIVE') {
      return this.rejectWithSnapshot('AUCTION_NOT_ACTIVE', 'Auction is not active', auction, input.actor, input.liveStats);
    }

    if (now >= auction.endAt) {
      return this.rejectWithSnapshot('AUCTION_ENDED', 'Auction has ended', auction, input.actor, input.liveStats);
    }

    if (userId === auction.seller.id) {
      return this.rejectWithSnapshot('OWNER_CANNOT_BID', 'Auction owner cannot bid', auction, input.actor, input.liveStats);
    }

    const minimumNextBidMinor = this.snapshots.getMinimumNextBidMinor(auction);

    if (input.amountMinor < minimumNextBidMinor) {
      return this.rejectWithSnapshot(
        'BID_TOO_LOW',
        'Bid is below the minimum allowed amount',
        auction,
        input.actor,
        input.liveStats,
        minimumNextBidMinor
      );
    }

    const sequence = auction.lastSequence + 1;
    const version = auction.version + 1;
    const updatedAuction = await this.auctions.applyAcceptedBid({
      auctionId: input.auctionId,
      bidderId: userId,
      amountMinor: input.amountMinor,
      expectedVersion: auction.version,
      sequence,
      version,
      now
    });

    if (!updatedAuction) {
      return this.rejectWithSnapshot('STATE_CONFLICT', 'Auction state changed while processing the bid', auction, input.actor);
    }

    const bid = await this.bids.createAcceptedBid({
      auctionId: input.auctionId,
      bidderId: userId,
      amountMinor: input.amountMinor,
      requestId: input.requestId,
      sequence
    });

    await this.timelines.createEvent({
      auctionId: input.auctionId,
      type: 'BID_ACCEPTED',
      sequence,
      actorPublicId: userId,
      publicMetadata: {
        amountMinor: input.amountMinor
      }
    });

    return {
      ok: true,
      duplicate: false,
      bid,
      snapshot: await this.snapshots.buildSnapshot(updatedAuction, input.actor, input.liveStats, now)
    };
  }

  private async loadAuctionOrThrow(auctionId: string): Promise<EngineAuctionRecord> {
    const auction = await this.auctions.findById(auctionId);

    if (!auction) {
      throw new NotFoundError('Auction not found', 'AUCTION_NOT_FOUND');
    }

    return auction;
  }

  private reject(code: BidRejectionCode, message: string): PlaceBidResult {
    return {
      ok: false,
      code,
      message
    };
  }

  private async rejectWithSnapshot(
    code: BidRejectionCode,
    message: string,
    auction: EngineAuctionRecord,
    actor: AuctionEngineActor,
    liveStats = {},
    minimumNextBidMinor = this.snapshots.getMinimumNextBidMinor(auction)
  ): Promise<PlaceBidResult> {
    return {
      ok: false,
      code,
      message,
      minimumNextBidMinor,
      snapshot: await this.snapshots.buildSnapshot(auction, actor, liveStats, this.now())
    };
  }
}

export const auctionEngineService = new AuctionEngineService();
