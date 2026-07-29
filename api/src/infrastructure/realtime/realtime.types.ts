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
  BID_PLACE: 'bid:place',
  BID_ACCEPTED: 'bid:accepted',
  BID_REJECTED: 'bid:rejected',
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  STATS_UPDATE: 'stats:update',
  ROOM_ERROR: 'room:error'
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
