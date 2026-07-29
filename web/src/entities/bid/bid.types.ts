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
  bid: Bid;
  snapshot: import('../auction').AuctionSnapshot;
}

export interface BidRejectedResult {
  ok: false;
  code: BidRejectionCode;
  message: string;
  minimumNextBidMinor?: number;
  snapshot?: import('../auction').AuctionSnapshot;
}

export type PlaceBidResult = BidAcceptedResult | BidRejectedResult;
