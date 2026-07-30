import { logger } from '../../config/logger.js';
import { auctionEngineService, type AuctionEngineService } from './auctionEngine.service.js';
import type { AuctionLifecycleResult, AuctionSnapshot, EngineAuctionRecord } from './auctionEngine.types.js';

interface AuctionTimerCallbacks {
  onAuctionStarted?: (snapshot: AuctionSnapshot) => void;
  onAuctionEnded?: (snapshot: AuctionSnapshot) => void;
}

const MAX_TIMEOUT_MS = 2_147_483_647;

export class AuctionTimerService {
  private readonly timers = new Map<string, NodeJS.Timeout[]>();

  constructor(private readonly engine: AuctionEngineService = auctionEngineService) {}

  async restoreTimers(callbacks: AuctionTimerCallbacks = {}): Promise<void> {
    const auctions = await this.engine.getSchedulableAuctions();

    await Promise.all(auctions.map((auction) => this.reconcileAuction(auction, callbacks)));
    logger.info({ auctionCount: auctions.length }, 'Auction timers restored');
  }

  scheduleAuction(auction: EngineAuctionRecord, callbacks: AuctionTimerCallbacks = {}): void {
    this.clearAuctionTimers(auction.id);

    if (auction.status === 'UPCOMING') {
      this.schedule(auction.id, auction.startAt, async () => {
        const result = await this.engine.startAuction(auction.id);
        this.emitLifecycle(result, callbacks.onAuctionStarted);

        if (result.snapshot.status === 'ACTIVE') {
          this.scheduleSnapshotEnd(result.snapshot, callbacks);
        }
      });
      return;
    }

    if (auction.status === 'ACTIVE') {
      this.schedule(auction.id, auction.endAt, async () => {
        const result = await this.engine.finalizeAuction(auction.id);
        this.emitLifecycle(result, callbacks.onAuctionEnded);
      });
    }
  }

  clearAuctionTimers(auctionId: string): void {
    for (const timer of this.timers.get(auctionId) ?? []) {
      clearTimeout(timer);
    }

    this.timers.delete(auctionId);
  }

  shutdown(): void {
    for (const auctionId of this.timers.keys()) {
      this.clearAuctionTimers(auctionId);
    }
  }

  private async reconcileAuction(auction: EngineAuctionRecord, callbacks: AuctionTimerCallbacks): Promise<void> {
    const now = new Date();

    if (auction.status === 'UPCOMING' && auction.startAt <= now) {
      const result = await this.engine.startAuction(auction.id);
      this.emitLifecycle(result, callbacks.onAuctionStarted);

      if (result.snapshot.status === 'ACTIVE') {
        this.scheduleSnapshotEnd(result.snapshot, callbacks);
      }

      return;
    }

    if (auction.status === 'ACTIVE' && auction.endAt <= now) {
      const result = await this.engine.finalizeAuction(auction.id);
      this.emitLifecycle(result, callbacks.onAuctionEnded);
      return;
    }

    this.scheduleAuction(auction, callbacks);
  }

  private scheduleSnapshotEnd(snapshot: AuctionSnapshot, callbacks: AuctionTimerCallbacks): void {
    this.schedule(snapshot.auctionId, new Date(snapshot.endAt), async () => {
      const result = await this.engine.finalizeAuction(snapshot.auctionId);
      this.emitLifecycle(result, callbacks.onAuctionEnded);
    });
  }

  private schedule(auctionId: string, date: Date, task: () => Promise<void>): void {
    const delayMs = Math.max(date.getTime() - Date.now(), 0);
    const timeout = setTimeout(() => {
      void task().catch((error) => {
        logger.error({ error, auctionId }, 'Auction timer task failed');
      });
    }, Math.min(delayMs, MAX_TIMEOUT_MS));

    const existing = this.timers.get(auctionId) ?? [];
    existing.push(timeout);
    this.timers.set(auctionId, existing);
  }

  private emitLifecycle(result: AuctionLifecycleResult, callback?: (snapshot: AuctionSnapshot) => void): void {
    if (result.changed) {
      callback?.(result.snapshot);
    }
  }
}

export const auctionTimerService = new AuctionTimerService();
