import type { AuctionSnapshot, EngineAuctionRecord } from '../../modules/auction-engine/index.js';
import type {
  AuctionMarketplaceItem,
  AuctionMarketplaceUpdate,
  AuctionMarketplaceUpdateReason
} from './realtime.types.js';

const toIso = (value?: Date): string | undefined => value?.toISOString();

export const toMarketplaceItemFromSnapshot = (snapshot: AuctionSnapshot): AuctionMarketplaceItem => ({
  id: snapshot.auctionId,
  seller: snapshot.seller,
  title: snapshot.title,
  description: snapshot.description,
  imageUrl: snapshot.imageUrl,
  currency: snapshot.currency,
  startingBidMinor: snapshot.startingBidMinor,
  currentHighestBidMinor: snapshot.currentHighestBidMinor,
  highestBidder: snapshot.highestBidder,
  minimumIncrementMinor: snapshot.minimumIncrementMinor,
  bidCount: snapshot.bidCount,
  status: snapshot.status,
  startAt: snapshot.startAt,
  endAt: snapshot.endAt,
  version: snapshot.version,
  lastSequence: snapshot.lastSequence,
  winner: snapshot.status === 'COMPLETED' ? snapshot.highestBidder : undefined,
  updatedAt: snapshot.serverNow
});

export const toMarketplaceItemFromRecord = (auction: EngineAuctionRecord): AuctionMarketplaceItem => ({
  id: auction.id,
  seller: auction.seller,
  title: auction.title,
  description: auction.description,
  imageUrl: auction.imageUrl,
  currency: auction.currency,
  startingBidMinor: auction.startingBidMinor,
  currentHighestBidMinor: auction.currentHighestBidMinor,
  highestBidder: auction.highestBidder,
  minimumIncrementMinor: auction.minimumIncrementMinor,
  bidCount: auction.bidCount,
  status: auction.status,
  startAt: auction.startAt.toISOString(),
  endAt: auction.endAt.toISOString(),
  version: auction.version,
  lastSequence: auction.lastSequence,
  finalizedAt: toIso(auction.finalizedAt ?? undefined) ?? null,
  winner: auction.winner,
  createdAt: toIso(auction.createdAt),
  updatedAt: toIso(auction.updatedAt)
});

export const toMarketplaceUpdateFromSnapshot = (
  snapshot: AuctionSnapshot,
  reason: AuctionMarketplaceUpdateReason,
  previousStatus: AuctionMarketplaceUpdate['previousStatus'] = snapshot.status
): AuctionMarketplaceUpdate => ({
  auction: toMarketplaceItemFromSnapshot(snapshot),
  reason,
  previousStatus,
  serverNow: snapshot.serverNow
});

export const toMarketplaceUpdateFromRecord = (
  auction: EngineAuctionRecord,
  reason: AuctionMarketplaceUpdateReason,
  previousStatus: AuctionMarketplaceUpdate['previousStatus'] = null
): AuctionMarketplaceUpdate => ({
  auction: toMarketplaceItemFromRecord(auction),
  reason,
  previousStatus,
  serverNow: new Date().toISOString()
});
