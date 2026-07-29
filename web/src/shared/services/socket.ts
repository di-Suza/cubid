import { io, type Socket } from 'socket.io-client';

import { env } from '../config/env';

export const SOCKET_EVENTS = {
  CONNECTION_READY: 'connection:ready',
  AUCTION_JOIN: 'auction:join',
  AUCTION_LEAVE: 'auction:leave',
  AUCTION_RESYNC: 'auction:resync',
  AUCTION_SNAPSHOT: 'auction:snapshot',
  AUCTION_STATE: 'auction:state',
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

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  get instance(): Socket | undefined {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
