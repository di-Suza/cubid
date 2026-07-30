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
  AUCTION_MARKETPLACE_UPDATE: 'auction:marketplace:update',
  BID_PLACE: 'bid:place',
  BID_ACCEPTED: 'bid:accepted',
  BID_REJECTED: 'bid:rejected',
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  STATS_UPDATE: 'stats:update',
  ROOM_ERROR: 'room:error'
} as const;

type SocketEventHandler = (...args: unknown[]) => void;

export class SocketClient {
  private socket?: Socket;
  private readonly listeners = new Map<string, Set<SocketEventHandler>>();

  connect(token?: string): Socket {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(env.socketUrl, {
      autoConnect: true,
      withCredentials: true,
      auth: token ? { token } : undefined
    });

    this.attachRegisteredListeners(this.socket);
    return this.socket;
  }

  on<TArgs extends unknown[]>(eventName: string, handler: (...args: TArgs) => void): void {
    const registered = this.listeners.get(eventName) ?? new Set<SocketEventHandler>();
    registered.add(handler as SocketEventHandler);
    this.listeners.set(eventName, registered);
    this.socket?.on(eventName, handler as SocketEventHandler);
  }

  off<TArgs extends unknown[]>(eventName: string, handler: (...args: TArgs) => void): void {
    this.listeners.get(eventName)?.delete(handler as SocketEventHandler);
    this.socket?.off(eventName, handler as SocketEventHandler);
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
    if (this.socket) {
      for (const [eventName, handlers] of this.listeners) {
        for (const handler of handlers) {
          this.socket.off(eventName, handler);
        }
      }

      this.socket.disconnect();
    }

    this.socket = undefined;
  }

  get instance(): Socket | undefined {
    return this.socket;
  }

  private attachRegisteredListeners(socket: Socket): void {
    for (const [eventName, handlers] of this.listeners) {
      for (const handler of handlers) {
        socket.on(eventName, handler);
      }
    }
  }
}

export const socketClient = new SocketClient();
