import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuctionPresenceService } from '../../src/infrastructure/realtime/auctionPresence.service.js';

describe('AuctionPresenceService', () => {
  it('counts one authenticated user once across multiple sockets', () => {
    const presence = new AuctionPresenceService();

    presence.join('auction-1', 'socket-1', { userId: 'user-1', guestId: 'socket-1' });
    const stats = presence.join('auction-1', 'socket-2', { userId: 'user-1', guestId: 'socket-2' });

    assert.equal(stats.onlineViewers, 1);
  });

  it('counts guests separately and removes them on disconnect', () => {
    const presence = new AuctionPresenceService();

    presence.join('auction-1', 'socket-1', { guestId: 'guest-1' });
    presence.join('auction-1', 'socket-2', { guestId: 'guest-2' });

    assert.equal(presence.getStats('auction-1').onlineViewers, 2);
    assert.deepEqual(presence.leaveAll('socket-1'), ['auction-1']);
    assert.equal(presence.getStats('auction-1').onlineViewers, 1);
  });
});
