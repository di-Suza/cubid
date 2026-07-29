import type { PublicUser } from '../user';

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

export interface AuctionSnapshot extends AuctionSummary {
  highestBidder: PublicUser | null;
  minimumNextBidMinor: number;
  bidCount: number;
  version: number;
  lastSequence: number;
  serverNow: string;
  permissions: AuctionPermissions;
  stats: AuctionStats;
}
