import type { AuctionStatus } from '../../shared/constants/auction.js';
import type { EnginePublicUser } from '../../modules/auction-engine/index.js';

export const REALTIME_EVENTS = {
  CONNECTION_READY: 'connection:ready',
  CONNECTION_ERROR: 'connection:error',
  AUCTION_JOIN: 'auction:join',
  AUCTION_LEAVE: 'auction:leave',
  AUCTION_RESYNC: 'auction:resync',
  AUCTION_SNAPSHOT: 'auction:snapshot',
  AUCTION_STATE: 'auction:state',
  AUCTION_STARTED: 'auction:started',
  AUCTION_ENDED: 'auction:ended',
  AUCTION_MARKETPLACE_UPDATE: 'auction:marketplace:update',
  BID_PLACE: 'bid:place',
  BID_ACCEPTED: 'bid:accepted',
  BID_REJECTED: 'bid:rejected',
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  STATS_UPDATE: 'stats:update',
  ROOM_ERROR: 'room:error'
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export type AuctionMarketplaceUpdateReason = 'CREATED' | 'STARTED' | 'UPDATED' | 'ENDED';

export interface AuctionMarketplaceItem {
  id: string;
  seller: EnginePublicUser;
  title: string;
  description: string;
  imageUrl: string;
  currency: string;
  startingBidMinor: number;
  currentHighestBidMinor: number;
  highestBidder: EnginePublicUser | null;
  minimumIncrementMinor: number;
  bidCount: number;
  status: AuctionStatus;
  startAt: string;
  endAt: string;
  version: number;
  lastSequence: number;
  finalizedAt?: string | null;
  winner?: EnginePublicUser | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuctionMarketplaceUpdate {
  auction: AuctionMarketplaceItem;
  reason: AuctionMarketplaceUpdateReason;
  previousStatus?: AuctionStatus | null;
  serverNow: string;
}
