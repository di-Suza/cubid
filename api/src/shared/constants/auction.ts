export const AUCTION_STATUSES = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];

export const BID_STATUSES = ['ACCEPTED'] as const;
export type BidStatus = (typeof BID_STATUSES)[number];

export const PAYMENT_STATUSES = ['NOT_REQUIRED', 'PENDING', 'SUCCESSFUL', 'FAILED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_GATEWAYS = ['mock', 'razorpay', 'stripe'] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

export const TIMELINE_EVENT_TYPES = [
  'AUCTION_CREATED',
  'AUCTION_STARTED',
  'BID_ACCEPTED',
  'AUCTION_ENDED',
  'WINNER_DECLARED',
  'PAYMENT_PENDING',
  'PAYMENT_SUCCESSFUL',
  'PAYMENT_FAILED'
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const BID_ERROR_CODES = [
  'AUTH_REQUIRED',
  'AUCTION_NOT_FOUND',
  'AUCTION_NOT_ACTIVE',
  'AUCTION_NOT_STARTED',
  'AUCTION_ENDED',
  'OWNER_CANNOT_BID',
  'INVALID_AMOUNT',
  'BID_TOO_LOW',
  'DUPLICATE_REQUEST',
  'RATE_LIMITED',
  'STATE_CONFLICT'
] as const;
export type BidErrorCode = (typeof BID_ERROR_CODES)[number];

export const DEFAULT_CURRENCY = 'INR';
