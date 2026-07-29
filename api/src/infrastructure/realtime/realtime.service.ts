import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { REALTIME_EVENTS } from './realtime.types.js';
import { resolveSocketIdentity } from './socketAuth.js';

export class RealtimeService {
  private io?: SocketServer;

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
    });

    logger.info('Socket.IO gateway attached');
    return this.io;
  }

  get server(): SocketServer | undefined {
    return this.io;
  }
}

export const realtimeService = new RealtimeService();
