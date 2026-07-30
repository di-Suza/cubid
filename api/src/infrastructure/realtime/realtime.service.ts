import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type { AuctionSnapshot, EngineAuctionRecord } from '../../modules/auction-engine/index.js';
import { auctionRealtimeHandler, type AuctionRealtimeHandler } from './auctionRealtime.handler.js';
import { toMarketplaceUpdateFromRecord, toMarketplaceUpdateFromSnapshot } from './auctionMarketplace.presenter.js';
import { REALTIME_EVENTS } from './realtime.types.js';
import { resolveSocketIdentity } from './socketAuth.js';

export class RealtimeService {
  private io?: SocketServer;

  constructor(private readonly auctionHandler: AuctionRealtimeHandler = auctionRealtimeHandler) {}

  attach(httpServer: HttpServer): SocketServer {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: env.socketCorsOrigin,
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      let identity = null;

      try {
        identity = resolveSocketIdentity(socket);
      } catch (error) {
        logger.warn({ socketId: socket.id, error }, 'Socket token verification failed');
      }

      socket.data.identity = identity;
      socket.emit(REALTIME_EVENTS.CONNECTION_READY, {
        socketId: socket.id,
        authenticated: Boolean(identity),
        serverNow: new Date().toISOString()
      });

      this.auctionHandler.registerSocket(this.io as SocketServer, socket);
    });

    logger.info('Socket.IO gateway attached');
    return this.io;
  }

  get server(): SocketServer | undefined {
    return this.io;
  }

  broadcastAuctionStarted(snapshot: AuctionSnapshot): void {
    if (this.io) {
      this.auctionHandler.broadcastAuctionStarted(this.io, snapshot);
    }
  }

  broadcastAuctionEnded(snapshot: AuctionSnapshot): void {
    if (this.io) {
      this.auctionHandler.broadcastAuctionEnded(this.io, snapshot);
    }
  }

  broadcastAuctionCreated(auction: EngineAuctionRecord): void {
    if (this.io) {
      this.io.emit(REALTIME_EVENTS.AUCTION_MARKETPLACE_UPDATE, toMarketplaceUpdateFromRecord(auction, 'CREATED', null));
    }
  }

  broadcastAuctionState(snapshot: AuctionSnapshot): void {
    if (this.io) {
      this.io.to(`auction:${snapshot.auctionId}`).emit(REALTIME_EVENTS.AUCTION_STATE, snapshot);
      this.io.emit(
        REALTIME_EVENTS.AUCTION_MARKETPLACE_UPDATE,
        toMarketplaceUpdateFromSnapshot(snapshot, 'UPDATED', snapshot.status)
      );
    }
  }
}

export const realtimeService = new RealtimeService();
