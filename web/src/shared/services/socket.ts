import { io, type Socket } from 'socket.io-client';

import { env } from '../config/env';

export type SocketAck<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };

export const SOCKET_EVENTS = {
  CONNECTION_READY: 'connection:ready',
  CONNECTION_ERROR: 'connection:error',
  AUCTION_JOIN: 'auction:join',
  AUCTION_LEAVE: 'auction:leave',
  AUCTION_RESYNC: 'auction:resync',
  AUCTION_SNAPSHOT: 'auction:snapshot',
  AUCTION_STATE: 'auction:state',
  AUCTION_STARTED: 'auction:started',
  AUCTION_ENDED: 'auction:ended',
  BID_PLACE: 'bid:place',
  BID_ACCEPTED: 'bid:accepted',
  BID_REJECTED: 'bid:rejected',
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  STATS_UPDATE: 'stats:update',
  ROOM_ERROR: 'room:error'
} as const;

export class SocketClient {
  private socket?: Socket;

  connect(token?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(env.socketUrl, {
      autoConnect: true,
      withCredentials: true,
      auth: token ? { token } : undefined
    });

    return this.socket;
  }

  async emitWithAck<TPayload, TResponse>(
    eventName: string,
    payload: TPayload,
    timeoutMs = 5000
  ): Promise<SocketAck<TResponse>> {
    const socket = this.socket ?? this.connect();

    return new Promise((resolve) => {
      socket.timeout(timeoutMs).emit(
        eventName,
        payload,
        (error: Error | null, response?: SocketAck<TResponse>) => {
          if (error) {
            resolve({
              success: false,
              error: {
                code: 'SOCKET_ACK_TIMEOUT',
                message: error.message || 'Realtime request timed out'
              }
            });
            return;
          }

          resolve(
            response ?? {
              success: false,
              error: {
                code: 'SOCKET_ACK_EMPTY',
                message: 'Realtime request returned an empty acknowledgement'
              }
            }
          );
        }
      );
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  get instance(): Socket | undefined {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
