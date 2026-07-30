import type { AuctionStatus, AuctionSummary } from '../../../entities/auction';

export type {
  AuctionPermissions,
  AuctionSnapshot,
  AuctionStats,
  AuctionStatus,
  AuctionSummary
} from '../../../entities/auction';

export interface CreateAuctionPayload {
  title: string;
  description: string;
  imageUrl?: string;
  imageDataUrl?: string;
  currency?: string;
  startingBidMinor: number;
  minimumIncrementMinor: number;
  startAt?: string;
  durationSeconds: number;
}

export type AuctionMarketplaceUpdateReason = 'CREATED' | 'STARTED' | 'UPDATED' | 'ENDED';

export interface AuctionMarketplaceUpdate {
  auction: AuctionSummary;
  reason: AuctionMarketplaceUpdateReason;
  previousStatus?: AuctionStatus | null;
  serverNow: string;
}
