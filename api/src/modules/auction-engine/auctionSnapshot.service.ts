import { paymentRepository } from '../payments/payment.repository.js';
import { bidRepository } from '../bids/bid.repository.js';
import { timelineRepository } from '../timeline/timeline.repository.js';
import type {
  AuctionEngineActor,
  AuctionEngineBidRepository,
  AuctionEnginePaymentRepository,
  AuctionEngineTimelineRepository,
  AuctionPermissions,
  AuctionRoomStats,
  AuctionSnapshot,
  EngineAuctionRecord,
  LiveRoomPresenceStats
} from './auctionEngine.types.js';

const RECENT_BID_LIMIT = 20;
const RECENT_TIMELINE_LIMIT = 30;

export class AuctionSnapshotService {
  constructor(
    private readonly bids: AuctionEngineBidRepository = bidRepository,
    private readonly timelines: AuctionEngineTimelineRepository = timelineRepository,
    private readonly payments: AuctionEnginePaymentRepository = paymentRepository
  ) {}

  async buildSnapshot(
    auction: EngineAuctionRecord,
    actor: AuctionEngineActor = {},
    liveStats: LiveRoomPresenceStats = {},
    now = new Date()
  ): Promise<AuctionSnapshot> {
    const [recentBids, timeline, activeBidders, recentBidCount, latestPayment] = await Promise.all([
      this.bids.listRecentAcceptedBids(auction.id, RECENT_BID_LIMIT),
      this.timelines.listRecentEvents(auction.id, RECENT_TIMELINE_LIMIT),
      this.bids.countDistinctBidders(auction.id),
      this.bids.countAcceptedSince(auction.id, new Date(now.getTime() - 60_000)),
      this.payments.findLatestByAuctionId(auction.id)
    ]);

    const stats = this.buildStats(activeBidders, liveStats.onlineViewers ?? 0, recentBidCount);

    return {
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
      minimumNextBidMinor: this.getMinimumNextBidMinor(auction),
      bidCount: auction.bidCount,
      startAt: auction.startAt.toISOString(),
      endAt: auction.endAt.toISOString(),
      serverNow: now.toISOString(),
      version: auction.version,
      lastSequence: auction.lastSequence,
      recentBids,
      timeline,
      stats,
      permissions: this.buildPermissions(auction, actor, latestPayment?.status ?? 'NOT_REQUIRED', now),
      paymentStatus: latestPayment?.status ?? 'NOT_REQUIRED'
    };
  }

  getMinimumNextBidMinor(auction: EngineAuctionRecord): number {
    if (auction.bidCount === 0) {
      return auction.startingBidMinor;
    }

    return auction.currentHighestBidMinor + auction.minimumIncrementMinor;
  }

  private buildPermissions(
    auction: EngineAuctionRecord,
    actor: AuctionEngineActor,
    paymentStatus: string,
    now: Date
  ): AuctionPermissions {
    const userId = actor.userId;
    const isAuthenticated = Boolean(userId);
    const isOwner = Boolean(userId && userId === auction.seller.id);
    const isWinner = Boolean(userId && userId === auction.winner?.id);
    const activeAndOpen = auction.status === 'ACTIVE' && now < auction.endAt;

    return {
      canBid: isAuthenticated && activeAndOpen && !isOwner,
      canChat: isAuthenticated,
      canManage: isAuthenticated && isOwner,
      canPay: isAuthenticated && isWinner && ['PENDING', 'FAILED'].includes(paymentStatus),
      isOwner,
      isWinner
    };
  }

  private buildStats(activeBidders: number, onlineViewers: number, recentBidCount: number): AuctionRoomStats {
    const spectators = Math.max(onlineViewers - activeBidders, 0);
    const heatScore = recentBidCount * 3 + activeBidders * 2 + spectators;

    return {
      activeBidders,
      onlineViewers,
      spectators,
      heat: heatScore >= 18 ? 'HIGH' : heatScore >= 7 ? 'MEDIUM' : 'LOW'
    };
  }
}

export const auctionSnapshotService = new AuctionSnapshotService();
