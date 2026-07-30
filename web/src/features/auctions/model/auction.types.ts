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
  imageUrl: string;
  currency?: string;
  startingBidMinor: number;
  minimumIncrementMinor: number;
  startAt?: string;
  durationSeconds: number;
}
