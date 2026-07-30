import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuctionQueueService } from '../../src/modules/auction-engine/auctionQueue.service.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('AuctionQueueService', () => {
  it('serializes tasks for the same auction in enqueue order', async () => {
    const queue = new AuctionQueueService();
    const events: string[] = [];

    const first = queue.run('auction-a', async () => {
      events.push('first:start');
      await delay(20);
      events.push('first:end');
      return 'first';
    });

    const second = queue.run('auction-a', async () => {
      events.push('second:start');
      await delay(1);
      events.push('second:end');
      return 'second';
    });

    assert.deepEqual(await Promise.all([first, second]), ['first', 'second']);
    assert.deepEqual(events, ['first:start', 'first:end', 'second:start', 'second:end']);
  });

  it('allows different auctions to process independently', async () => {
    const queue = new AuctionQueueService();
    let activeTasks = 0;
    let maxActiveTasks = 0;

    await Promise.all([
      queue.run('auction-a', async () => {
        activeTasks += 1;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        await delay(10);
        activeTasks -= 1;
      }),
      queue.run('auction-b', async () => {
        activeTasks += 1;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        await delay(10);
        activeTasks -= 1;
      })
    ]);

    assert.equal(maxActiveTasks, 2);
  });
});
