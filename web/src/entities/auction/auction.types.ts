import type { PublicUser } from '../user';
import type { Bid } from '../bid';
import type { PaymentStatus } from '../payment';
import type { TimelineEvent } from '../timeline';

export type AuctionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface AuctionPermissions {
  canBid: boolean;
  canChat: boolean;
  canManage: boolean;
  canPay: boolean;
  isOwner: boolean;
  isWinner: boolean;
}

export interface AuctionStats {
  activeBidders: number;
  onlineViewers: number;
  spectators: number;
  heat: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuctionSummary {
  id: string;
  seller: PublicUser;
  title: string;
  description: string;
  imageUrl: string;
  currency: string;
  startingBidMinor: number;
  currentHighestBidMinor: number;
  minimumIncrementMinor: number;
  status: AuctionStatus;
  startAt: string;
  endAt: string;
}

export interface AuctionSnapshot {
  auctionId: string;
  seller: PublicUser;
  title: string;
  description: string;
  imageUrl: string;
  currency: string;
  startingBidMinor: number;
  currentHighestBidMinor: number;
  minimumIncrementMinor: number;
  status: AuctionStatus;
  startAt: string;
  endAt: string;
  highestBidder: PublicUser | null;
  minimumNextBidMinor: number;
  bidCount: number;
  version: number;
  lastSequence: number;
  serverNow: string;
  recentBids: Bid[];
  timeline: TimelineEvent[];
  permissions: AuctionPermissions;
  stats: AuctionStats;
  paymentStatus: PaymentStatus;
}
