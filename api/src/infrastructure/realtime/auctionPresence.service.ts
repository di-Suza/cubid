import type { LiveRoomPresenceStats } from '../../modules/auction-engine/auctionEngine.types.js';

interface PresenceIdentity {
  userId?: string;
  guestId: string;
}

export class AuctionPresenceService {
  private readonly auctionSockets = new Map<string, Map<string, PresenceIdentity>>();
  private readonly socketAuctions = new Map<string, Set<string>>();

  join(auctionId: string, socketId: string, identity: PresenceIdentity): LiveRoomPresenceStats {
    const sockets = this.auctionSockets.get(auctionId) ?? new Map<string, PresenceIdentity>();
    sockets.set(socketId, identity);
    this.auctionSockets.set(auctionId, sockets);

    const auctions = this.socketAuctions.get(socketId) ?? new Set<string>();
    auctions.add(auctionId);
    this.socketAuctions.set(socketId, auctions);

    return this.getStats(auctionId);
  }

  leave(auctionId: string, socketId: string): LiveRoomPresenceStats {
    this.auctionSockets.get(auctionId)?.delete(socketId);

    if (this.auctionSockets.get(auctionId)?.size === 0) {
      this.auctionSockets.delete(auctionId);
    }

    this.socketAuctions.get(socketId)?.delete(auctionId);

    if (this.socketAuctions.get(socketId)?.size === 0) {
      this.socketAuctions.delete(socketId);
    }

    return this.getStats(auctionId);
  }

  leaveAll(socketId: string): string[] {
    const auctionIds = [...(this.socketAuctions.get(socketId) ?? [])];

    for (const auctionId of auctionIds) {
      this.leave(auctionId, socketId);
    }

    return auctionIds;
  }

  getStats(auctionId: string): LiveRoomPresenceStats {
    const identities = [...(this.auctionSockets.get(auctionId)?.values() ?? [])];
    const uniqueUsers = new Set(identities.filter((identity) => identity.userId).map((identity) => identity.userId));
    const uniqueGuests = new Set(
      identities.filter((identity) => !identity.userId).map((identity) => identity.guestId)
    );

    return {
      onlineViewers: uniqueUsers.size + uniqueGuests.size
    };
  }
}

export const auctionPresenceService = new AuctionPresenceService();
