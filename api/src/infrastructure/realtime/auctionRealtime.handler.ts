import type { Server as SocketServer, Socket } from 'socket.io';

import {
  auctionEngineService,
  type AuctionEngineActor,
  type AuctionEngineService,
  type AuctionSnapshot,
  type PlaceBidResult
} from '../../modules/auction-engine/index.js';
import { logger } from '../../config/logger.js';
import { auctionPresenceService, type AuctionPresenceService } from './auctionPresence.service.js';
import { REALTIME_EVENTS } from './realtime.types.js';

type AckCallback<T> = (response: { success: true; data: T } | { success: false; error: { code: string; message: string } }) => void;

interface AuctionJoinPayload {
  auctionId?: unknown;
}

interface BidPlacePayload {
  auctionId?: unknown;
  amountMinor?: unknown;
  requestId?: unknown;
}

export class AuctionRealtimeHandler {
  constructor(
    private readonly engine: AuctionEngineService = auctionEngineService,
    private readonly presence: AuctionPresenceService = auctionPresenceService
  ) {}

  registerSocket(io: SocketServer, socket: Socket): void {
    socket.on(REALTIME_EVENTS.AUCTION_JOIN, (payload: AuctionJoinPayload, ack?: AckCallback<AuctionSnapshot>) => {
      void this.handleJoin(io, socket, payload, ack);
    });

    socket.on(REALTIME_EVENTS.AUCTION_RESYNC, (payload: AuctionJoinPayload, ack?: AckCallback<AuctionSnapshot>) => {
      void this.handleResync(socket, payload, ack);
    });

    socket.on(REALTIME_EVENTS.AUCTION_LEAVE, (payload: AuctionJoinPayload, ack?: AckCallback<{ auctionId: string }>) => {
      void this.handleLeave(io, socket, payload, ack);
    });

    socket.on(REALTIME_EVENTS.BID_PLACE, (payload: BidPlacePayload, ack?: AckCallback<PlaceBidResult>) => {
      void this.handleBid(io, socket, payload, ack);
    });

    socket.on('disconnect', () => {
      void this.handleDisconnect(io, socket);
    });
  }

  broadcastAuctionStarted(io: SocketServer, snapshot: AuctionSnapshot): void {
    io.to(this.roomName(snapshot.auctionId)).emit(REALTIME_EVENTS.AUCTION_STARTED, snapshot);
    io.to(this.roomName(snapshot.auctionId)).emit(REALTIME_EVENTS.AUCTION_STATE, snapshot);
  }

  broadcastAuctionEnded(io: SocketServer, snapshot: AuctionSnapshot): void {
    io.to(this.roomName(snapshot.auctionId)).emit(REALTIME_EVENTS.AUCTION_ENDED, snapshot);
    io.to(this.roomName(snapshot.auctionId)).emit(REALTIME_EVENTS.AUCTION_STATE, snapshot);
  }

  private async handleJoin(
    io: SocketServer,
    socket: Socket,
    payload: AuctionJoinPayload,
    ack?: AckCallback<AuctionSnapshot>
  ): Promise<void> {
    const auctionId = this.parseAuctionId(payload);

    if (!auctionId) {
      this.fail(ack, 'INVALID_AUCTION_ID', 'auctionId is required');
      return;
    }

    try {
      await socket.join(this.roomName(auctionId));
      const presenceStats = this.presence.join(auctionId, socket.id, this.presenceIdentity(socket));
      const snapshot = await this.engine.getSnapshot(auctionId, this.actor(socket), presenceStats);
      socket.emit(REALTIME_EVENTS.AUCTION_SNAPSHOT, snapshot);
      io.to(this.roomName(auctionId)).emit(REALTIME_EVENTS.STATS_UPDATE, snapshot.stats);
      this.ok(ack, snapshot);
    } catch (error) {
      this.handleError(socket, ack, error);
    }
  }

  private async handleResync(
    socket: Socket,
    payload: AuctionJoinPayload,
    ack?: AckCallback<AuctionSnapshot>
  ): Promise<void> {
    const auctionId = this.parseAuctionId(payload);

    if (!auctionId) {
      this.fail(ack, 'INVALID_AUCTION_ID', 'auctionId is required');
      return;
    }

    try {
      const snapshot = await this.engine.getSnapshot(auctionId, this.actor(socket), this.presence.getStats(auctionId));
      socket.emit(REALTIME_EVENTS.AUCTION_SNAPSHOT, snapshot);
      this.ok(ack, snapshot);
    } catch (error) {
      this.handleError(socket, ack, error);
    }
  }

  private async handleLeave(
    io: SocketServer,
    socket: Socket,
    payload: AuctionJoinPayload,
    ack?: AckCallback<{ auctionId: string }>
  ): Promise<void> {
    const auctionId = this.parseAuctionId(payload);

    if (!auctionId) {
      this.fail(ack, 'INVALID_AUCTION_ID', 'auctionId is required');
      return;
    }

    await socket.leave(this.roomName(auctionId));
    const stats = this.presence.leave(auctionId, socket.id);
    io.to(this.roomName(auctionId)).emit(REALTIME_EVENTS.STATS_UPDATE, stats);
    this.ok(ack, { auctionId });
  }

  private async handleBid(
    io: SocketServer,
    socket: Socket,
    payload: BidPlacePayload,
    ack?: AckCallback<PlaceBidResult>
  ): Promise<void> {
    const auctionId = this.parseAuctionId(payload);
    const amountMinor = typeof payload.amountMinor === 'number' && Number.isSafeInteger(payload.amountMinor)
      ? payload.amountMinor
      : null;
    const requestId = typeof payload.requestId === 'string' && payload.requestId.trim() ? payload.requestId.trim() : null;

    if (!auctionId || amountMinor === null || !requestId) {
      this.fail(ack, 'INVALID_BID_PAYLOAD', 'auctionId, amountMinor, and requestId are required');
      return;
    }

    try {
      const result = await this.engine.placeBid({
        auctionId,
        amountMinor,
        requestId,
        actor: this.actor(socket),
        liveStats: this.presence.getStats(auctionId)
      });

      this.ok(ack, result);

      if (result.ok) {
        io.to(this.roomName(auctionId)).emit(REALTIME_EVENTS.BID_ACCEPTED, result.bid);
        io.to(this.roomName(auctionId)).emit(REALTIME_EVENTS.AUCTION_STATE, result.snapshot);
        return;
      }

      socket.emit(REALTIME_EVENTS.BID_REJECTED, result);

      if (result.code === 'AUCTION_ENDED') {
        const finalized = await this.engine.finalizeAuction(auctionId, this.actor(socket));

        if (finalized.changed) {
          this.broadcastAuctionEnded(io, finalized.snapshot);
        }
      }
    } catch (error) {
      this.handleError(socket, ack, error);
    }
  }

  private async handleDisconnect(io: SocketServer, socket: Socket): Promise<void> {
    const impactedAuctionIds = this.presence.leaveAll(socket.id);

    await Promise.all(
      impactedAuctionIds.map(async (auctionId) => {
        try {
          const snapshot = await this.engine.getSnapshot(auctionId, {}, this.presence.getStats(auctionId));
          io.to(this.roomName(auctionId)).emit(REALTIME_EVENTS.STATS_UPDATE, snapshot.stats);
        } catch (error) {
          logger.warn({ error, auctionId, socketId: socket.id }, 'Failed to broadcast disconnect stats');
        }
      })
    );
  }

  private actor(socket: Socket): AuctionEngineActor {
    const identity = socket.data.identity as { userId?: string; role?: 'USER' | 'ADMIN' } | null | undefined;

    return identity?.userId
      ? {
          userId: identity.userId,
          role: identity.role
        }
      : {
          guestId: socket.id
        };
  }

  private presenceIdentity(socket: Socket) {
    const actor = this.actor(socket);

    return {
      userId: actor.userId,
      guestId: actor.guestId ?? socket.id
    };
  }

  private roomName(auctionId: string): string {
    return `auction:${auctionId}`;
  }

  private parseAuctionId(payload: AuctionJoinPayload | BidPlacePayload): string | null {
    return typeof payload?.auctionId === 'string' && payload.auctionId.trim() ? payload.auctionId.trim() : null;
  }

  private ok<T>(ack: AckCallback<T> | undefined, data: T): void {
    ack?.({
      success: true,
      data
    });
  }

  private fail<T>(ack: AckCallback<T> | undefined, code: string, message: string): void {
    ack?.({
      success: false,
      error: {
        code,
        message
      }
    });
  }

  private handleError<T>(socket: Socket, ack: AckCallback<T> | undefined, error: unknown): void {
    logger.error({ error, socketId: socket.id }, 'Auction realtime handler failed');
    const message = error instanceof Error ? error.message : 'Realtime request failed';
    this.fail(ack, 'ROOM_ERROR', message);
    socket.emit(REALTIME_EVENTS.ROOM_ERROR, {
      code: 'ROOM_ERROR',
      message
    });
  }
}

export const auctionRealtimeHandler = new AuctionRealtimeHandler();
