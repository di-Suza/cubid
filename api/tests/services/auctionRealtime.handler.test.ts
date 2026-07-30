import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { describe, it } from 'node:test';

import { AuctionRealtimeHandler } from '../../src/infrastructure/realtime/auctionRealtime.handler.js';
import { AuctionPresenceService } from '../../src/infrastructure/realtime/auctionPresence.service.js';
import { REALTIME_EVENTS } from '../../src/infrastructure/realtime/realtime.types.js';
import type {
  AuctionEngineActor,
  AuctionSnapshot,
  PlaceBidInput,
  PlaceBidResult
} from '../../src/modules/auction-engine/auctionEngine.types.js';
import type { ChatMessageRecord } from '../../src/modules/chat/chat.types.js';

const snapshot: AuctionSnapshot = {
  auctionId: 'auction-1',
  status: 'ACTIVE',
  seller: { id: 'seller-1', name: 'Seller One' },
  title: 'Realtime Test Auction',
  description: 'Realtime test fixture',
  imageUrl: 'https://example.com/realtime.png',
  currency: 'INR',
  startingBidMinor: 100_000,
  currentHighestBidMinor: 100_000,
  highestBidder: { id: 'bidder-1', name: 'Bidder One' },
  minimumIncrementMinor: 10_000,
  minimumNextBidMinor: 110_000,
  bidCount: 1,
  startAt: '2026-07-30T09:59:00.000Z',
  endAt: '2026-07-30T10:01:00.000Z',
  serverNow: '2026-07-30T10:00:00.000Z',
  version: 2,
  lastSequence: 1,
  recentBids: [],
  timeline: [],
  stats: {
    activeBidders: 1,
    onlineViewers: 1,
    spectators: 0,
    heat: 'LOW'
  },
  permissions: {
    canBid: true,
    canChat: true,
    canManage: false,
    canPay: false,
    isOwner: false,
    isWinner: false
  },
  paymentStatus: 'NOT_REQUIRED'
};

class FakeSocket {
  readonly id = 'socket-1';
  readonly data: Record<string, unknown> = {
    identity: {
      userId: 'bidder-1',
      role: 'USER'
    }
  };
  readonly handlers = new Map<string, (...args: any[]) => void>();
  readonly emitted: Array<{ event: string; payload: unknown }> = [];
  readonly joined: string[] = [];
  readonly left: string[] = [];

  on(event: string, handler: (...args: any[]) => void) {
    this.handlers.set(event, handler);
    return this;
  }

  emit(event: string, payload: unknown) {
    this.emitted.push({ event, payload });
    return true;
  }

  join = async (roomName: string) => {
    this.joined.push(roomName);
  };

  leave = async (roomName: string) => {
    this.left.push(roomName);
  };

  trigger(event: string, payload?: unknown, ack?: (payload: unknown) => void) {
    this.handlers.get(event)?.(payload, ack);
  }
}

class FakeIo {
  readonly emitted: Array<{ room: string; event: string; payload: unknown }> = [];

  emit(event: string, payload: unknown) {
    this.emitted.push({ room: '*', event, payload });
    return true;
  }

  to(room: string) {
    return {
      emit: (event: string, payload: unknown) => {
        this.emitted.push({ room, event, payload });
      }
    };
  }
}

class FakeAuctionEngine {
  readonly bids: PlaceBidInput[] = [];
  readonly snapshots: string[] = [];
  finalizeCalls = 0;
  bidResult: PlaceBidResult = {
    ok: true,
    duplicate: false,
    bid: {
      id: 'bid-1',
      auctionId: 'auction-1',
      bidder: { id: 'bidder-1', name: 'Bidder One' },
      amountMinor: 110_000,
      requestId: 'request-1',
      sequence: 2,
      createdAt: new Date('2026-07-30T10:00:00.000Z')
    },
    snapshot: {
      ...snapshot,
      currentHighestBidMinor: 110_000,
      minimumNextBidMinor: 120_000,
      bidCount: 2,
      version: 3,
      lastSequence: 2
    }
  };

  getSnapshot = async (auctionId: string) => {
    this.snapshots.push(auctionId);
    return snapshot;
  };

  placeBid = async (input: PlaceBidInput) => {
    this.bids.push(input);
    return this.bidResult;
  };

  finalizeAuction = async () => {
    this.finalizeCalls += 1;
    return {
      changed: true,
      snapshot: {
        ...snapshot,
        status: 'COMPLETED' as const,
        version: 4,
        lastSequence: 3
      }
    };
  };
}

class FakeChatService {
  readonly messages: Array<{ auctionId: string; message: string; actor: AuctionEngineActor }> = [];

  sendMessage = async (input: { auctionId: string; message: string; actor: AuctionEngineActor }): Promise<ChatMessageRecord> => {
    this.messages.push(input);

    return {
      id: 'chat-1',
      auctionId: input.auctionId,
      sender: {
        id: input.actor.userId ?? 'guest',
        name: 'Bidder One'
      },
      message: input.message.trim(),
      createdAt: new Date('2026-07-30T10:00:00.000Z')
    };
  };
}

const createHarness = () => {
  const engine = new FakeAuctionEngine();
  const chat = new FakeChatService();
  const handler = new AuctionRealtimeHandler(engine as never, new AuctionPresenceService(), chat as never);
  const io = new FakeIo();
  const socket = new FakeSocket();

  handler.registerSocket(io as never, socket as never);

  return {
    chat,
    engine,
    handler,
    io,
    socket
  };
};

describe('AuctionRealtimeHandler', () => {
  it('joins auction rooms with an authoritative snapshot acknowledgement', async () => {
    const { io, socket } = createHarness();
    let ack: unknown;

    socket.trigger(REALTIME_EVENTS.AUCTION_JOIN, { auctionId: 'auction-1' }, (response) => {
      ack = response;
    });
    await setImmediate();

    assert.deepEqual(socket.joined, ['auction:auction-1']);
    assert.deepEqual(ack, {
      success: true,
      data: snapshot
    });
    assert.equal(socket.emitted[0]?.event, REALTIME_EVENTS.AUCTION_SNAPSHOT);
    assert.equal(io.emitted[0]?.event, REALTIME_EVENTS.STATS_UPDATE);
  });

  it('acknowledges accepted bids and broadcasts persisted bid state to the room', async () => {
    const { engine, io, socket } = createHarness();
    let ack: unknown;

    socket.trigger(
      REALTIME_EVENTS.BID_PLACE,
      {
        auctionId: 'auction-1',
        amountMinor: 110_000,
        requestId: 'request-1'
      },
      (response) => {
        ack = response;
      }
    );
    await setImmediate();

    assert.equal(engine.bids[0]?.actor.userId, 'bidder-1');
    assert.deepEqual(ack, {
      success: true,
      data: engine.bidResult
    });
    assert.deepEqual(
      io.emitted.map((entry) => entry.event),
      [REALTIME_EVENTS.BID_ACCEPTED, REALTIME_EVENTS.AUCTION_STATE, REALTIME_EVENTS.AUCTION_MARKETPLACE_UPDATE]
    );
  });

  it('finalizes and broadcasts when a bid arrives after auction end', async () => {
    const { engine, io, socket } = createHarness();
    engine.bidResult = {
      ok: false,
      code: 'AUCTION_ENDED',
      message: 'Auction has ended',
      snapshot
    };

    socket.trigger(REALTIME_EVENTS.BID_PLACE, { auctionId: 'auction-1', amountMinor: 120_000, requestId: 'request-2' });
    await setImmediate();

    assert.equal(engine.finalizeCalls, 1);
    assert.deepEqual(
      io.emitted.map((entry) => entry.event),
      [REALTIME_EVENTS.AUCTION_ENDED, REALTIME_EVENTS.AUCTION_STATE, REALTIME_EVENTS.AUCTION_MARKETPLACE_UPDATE]
    );
  });

  it('broadcasts chat messages without touching the auction bid path', async () => {
    const { chat, engine, io, socket } = createHarness();
    let ack: unknown;

    socket.trigger(
      REALTIME_EVENTS.CHAT_SEND,
      {
        auctionId: 'auction-1',
        message: '  Nice timing  '
      },
      (response) => {
        ack = response;
      }
    );
    await setImmediate();

    assert.equal(engine.bids.length, 0);
    assert.equal(chat.messages[0]?.actor.userId, 'bidder-1');
    assert.deepEqual(ack, {
      success: true,
      data: {
        id: 'chat-1',
        auctionId: 'auction-1',
        sender: {
          id: 'bidder-1',
          name: 'Bidder One'
        },
        message: 'Nice timing',
        createdAt: new Date('2026-07-30T10:00:00.000Z')
      }
    });
    assert.equal(io.emitted[0]?.event, REALTIME_EVENTS.CHAT_MESSAGE);
  });
});
