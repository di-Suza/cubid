import type { PublicUser } from '../user';

export interface Bid {
  id: string;
  auctionId: string;
  bidder: PublicUser;
  amountMinor: number;
  requestId: string;
  sequence: number;
  createdAt: string;
}

export interface BidIntent {
  auctionId: string;
  amountMinor: number;
  requestId: string;
}
