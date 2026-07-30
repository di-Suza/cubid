import type {
  AuctionStatus,
  PaymentGateway,
  PaymentStatus,
  TimelineEventType
} from '../../shared/constants/auction.js';

export interface EnginePublicUser {
  id: string;
  name: string;
}

export interface AuctionEngineActor {
  userId?: string;
  role?: 'USER' | 'ADMIN';
  guestId?: string;
}

export interface EngineAuctionRecord {
  id: string;
  seller: EnginePublicUser;
  title: string;
  description: string;
  imageUrl: string;
  currency: string;
  startingBidMinor: number;
  minimumIncrementMinor: number;
  currentHighestBidMinor: number;
  highestBidder: EnginePublicUser | null;
  bidCount: number;
  startAt: Date;
  endAt: Date;
  status: AuctionStatus;
  version: number;
  lastSequence: number;
  finalizedAt: Date | null;
  winner: EnginePublicUser | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EngineBidRecord {
  id: string;
  auctionId: string;
  bidder: EnginePublicUser;
  amountMinor: number;
  requestId: string;
  sequence: number;
  createdAt: Date;
}

export interface EngineTimelineEventRecord {
  id: string;
  auctionId: string;
  type: TimelineEventType;
  sequence: number;
  actorPublicId: string | null;
  publicMetadata: Record<string, unknown>;
  createdAt: Date;
}

export interface EnginePaymentRecord {
  id: string;
  auctionId: string;
  winnerId: string;
  amountMinor: number;
  currency: string;
  gateway: PaymentGateway;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  status: PaymentStatus;
  verifiedAt: Date | null;
}

export interface AuctionPermissions {
  canBid: boolean;
  canChat: boolean;
  canManage: boolean;
  canPay: boolean;
  isOwner: boolean;
  isWinner: boolean;
}

export interface AuctionRoomStats {
  activeBidders: number;
  onlineViewers: number;
  spectators: number;
  heat: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuctionSnapshot {
  auctionId: string;
  status: AuctionStatus;
  seller: EnginePublicUser;
  title: string;
  description: string;
  imageUrl: string;
  currency: string;
  startingBidMinor: number;
  currentHighestBidMinor: number;
  highestBidder: EnginePublicUser | null;
  minimumIncrementMinor: number;
  minimumNextBidMinor: number;
  bidCount: number;
  startAt: string;
  endAt: string;
  serverNow: string;
  version: number;
  lastSequence: number;
  recentBids: EngineBidRecord[];
  timeline: EngineTimelineEventRecord[];
  stats: AuctionRoomStats;
  permissions: AuctionPermissions;
  paymentStatus: PaymentStatus;
}

export interface LiveRoomPresenceStats {
  onlineViewers?: number;
}

export interface PlaceBidInput {
  auctionId: string;
  amountMinor: number;
  requestId: string;
  actor: AuctionEngineActor;
  liveStats?: LiveRoomPresenceStats;
}

export type BidRejectionCode =
  | 'AUTH_REQUIRED'
  | 'AUCTION_NOT_FOUND'
  | 'AUCTION_NOT_ACTIVE'
  | 'AUCTION_NOT_STARTED'
  | 'AUCTION_ENDED'
  | 'OWNER_CANNOT_BID'
  | 'INVALID_AMOUNT'
  | 'BID_TOO_LOW'
  | 'DUPLICATE_REQUEST'
  | 'RATE_LIMITED'
  | 'STATE_CONFLICT';

export interface BidAcceptedResult {
  ok: true;
  duplicate: boolean;
  bid: EngineBidRecord;
  snapshot: AuctionSnapshot;
}

export interface BidRejectedResult {
  ok: false;
  code: BidRejectionCode;
  message: string;
  minimumNextBidMinor?: number;
  snapshot?: AuctionSnapshot;
}

export type PlaceBidResult = BidAcceptedResult | BidRejectedResult;

export interface AuctionLifecycleResult {
  changed: boolean;
  snapshot: AuctionSnapshot;
}

export interface AuctionEngineAuctionRepository {
  findById(auctionId: string): Promise<EngineAuctionRecord | null>;
  findSchedulableAuctions(now: Date): Promise<EngineAuctionRecord[]>;
  startAuction(input: {
    auctionId: string;
    now: Date;
    expectedVersion: number;
    sequence: number;
    version: number;
  }): Promise<EngineAuctionRecord | null>;
  applyAcceptedBid(input: {
    auctionId: string;
    bidderId: string;
    amountMinor: number;
    expectedVersion: number;
    sequence: number;
    version: number;
    now: Date;
  }): Promise<EngineAuctionRecord | null>;
  finalizeAuction(input: {
    auctionId: string;
    winnerId: string | null;
    finalizedAt: Date;
    expectedVersion: number;
    sequence: number;
    version: number;
  }): Promise<EngineAuctionRecord | null>;
}

export interface AuctionEngineBidRepository {
  findAcceptedByRequestId(input: {
    auctionId: string;
    bidderId: string;
    requestId: string;
  }): Promise<EngineBidRecord | null>;
  findHighestAcceptedBid(auctionId: string): Promise<EngineBidRecord | null>;
  createAcceptedBid(input: {
    auctionId: string;
    bidderId: string;
    amountMinor: number;
    requestId: string;
    sequence: number;
  }): Promise<EngineBidRecord>;
  listRecentAcceptedBids(auctionId: string, limit: number): Promise<EngineBidRecord[]>;
  countDistinctBidders(auctionId: string): Promise<number>;
  countAcceptedSince(auctionId: string, since: Date): Promise<number>;
}

export interface AuctionEngineTimelineRepository {
  createEvent(input: {
    auctionId: string;
    type: TimelineEventType;
    sequence: number;
    actorPublicId: string | null;
    publicMetadata?: Record<string, unknown>;
  }): Promise<EngineTimelineEventRecord>;
  listRecentEvents(auctionId: string, limit: number): Promise<EngineTimelineEventRecord[]>;
}

export interface AuctionEngineResultRepository {
  createResultOnce(input: {
    auctionId: string;
    winnerId: string | null;
    winningBidId: string | null;
    winningAmountMinor: number;
    declaredAt: Date;
  }): Promise<void>;
}

export interface AuctionEnginePaymentRepository {
  createPendingForWinner(input: {
    auctionId: string;
    winnerId: string;
    amountMinor: number;
    currency: string;
  }): Promise<EnginePaymentRecord>;
  findLatestByAuctionId(auctionId: string): Promise<EnginePaymentRecord | null>;
}
