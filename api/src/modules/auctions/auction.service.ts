import { realtimeService } from '../../infrastructure/realtime/index.js';
import { auctionTimerService } from '../auction-engine/auctionTimer.service.js';
import type {
  AuctionEngineActor,
  AuctionEngineAuctionRepository,
  AuctionEngineTimelineRepository,
  AuctionSnapshot,
  EngineAuctionRecord
} from '../auction-engine/auctionEngine.types.js';
import { timelineRepository } from '../timeline/timeline.repository.js';
import { AUCTION_STATUSES, DEFAULT_CURRENCY, type AuctionStatus } from '../../shared/constants/auction.js';
import { BadRequestError } from '../../shared/errors/BadRequestError.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';
import { auctionRepository, type AuctionRepository } from './auction.repository.js';

const MIN_DURATION_SECONDS = 10;
const MAX_DURATION_SECONDS = 7 * 24 * 60 * 60;

export interface CreateAuctionInput {
  title: string;
  description: string;
  imageUrl: string;
  currency?: string;
  startingBidMinor: number;
  minimumIncrementMinor: number;
  startAt?: string;
  durationSeconds: number;
}

export interface CreateAuctionRepositoryInput {
  sellerId: string;
  title: string;
  description: string;
  imageUrl: string;
  currency: string;
  startingBidMinor: number;
  minimumIncrementMinor: number;
  startAt: Date;
  endAt: Date;
  status: AuctionStatus;
}

export interface ListAuctionsInput {
  page?: unknown;
  limit?: unknown;
  status?: unknown;
  search?: unknown;
}

export interface ListAuctionsQuery {
  page: number;
  limit: number;
  status?: AuctionStatus;
  search?: string;
}

export interface AuctionListResult {
  items: EngineAuctionRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

export interface AuctionCreationRepositoryPort {
  createAuction(input: CreateAuctionRepositoryInput): Promise<EngineAuctionRecord>;
}

export interface AuctionDiscoveryRepositoryPort {
  listAuctions(query: ListAuctionsQuery): Promise<{ items: EngineAuctionRecord[]; total: number }>;
  findById(auctionId: string): Promise<EngineAuctionRecord | null>;
}

export interface AuctionRepositoryPort
  extends AuctionCreationRepositoryPort,
    AuctionDiscoveryRepositoryPort,
    AuctionEngineAuctionRepository {}

export interface AuctionSchedulerPort {
  scheduleAuction(auction: EngineAuctionRecord, callbacks?: {
    onAuctionStarted?: (snapshot: AuctionSnapshot) => void;
    onAuctionEnded?: (snapshot: AuctionSnapshot) => void;
  }): void;
}

interface AuctionServiceDependencies {
  auctions?: AuctionRepositoryPort;
  timelines?: AuctionEngineTimelineRepository;
  scheduler?: AuctionSchedulerPort;
  now?: () => Date;
}

export class AuctionService {
  private readonly auctions: AuctionRepositoryPort;
  private readonly timelines: AuctionEngineTimelineRepository;
  private readonly scheduler: AuctionSchedulerPort;
  private readonly now: () => Date;

  constructor(dependencies: AuctionServiceDependencies = {}) {
    this.auctions = dependencies.auctions ?? auctionRepository;
    this.timelines = dependencies.timelines ?? timelineRepository;
    this.scheduler = dependencies.scheduler ?? auctionTimerService;
    this.now = dependencies.now ?? (() => new Date());
  }

  async createAuction(input: CreateAuctionInput, actor: AuctionEngineActor): Promise<EngineAuctionRecord> {
    if (!actor.userId) {
      throw new UnauthorizedError('Authentication required to create an auction');
    }

    const now = this.now();
    const startAt = input.startAt ? new Date(input.startAt) : now;

    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestError('startAt must be a valid ISO timestamp', 'INVALID_AUCTION_TIME');
    }

    if (startAt < now) {
      throw new BadRequestError('startAt must be now or in the future', 'INVALID_AUCTION_TIME');
    }

    if (
      !Number.isSafeInteger(input.durationSeconds) ||
      input.durationSeconds < MIN_DURATION_SECONDS ||
      input.durationSeconds > MAX_DURATION_SECONDS
    ) {
      throw new BadRequestError('durationSeconds is outside the allowed range', 'INVALID_AUCTION_DURATION');
    }

    if (!Number.isSafeInteger(input.startingBidMinor) || input.startingBidMinor < 0) {
      throw new BadRequestError('startingBidMinor must be a non-negative integer', 'INVALID_AUCTION_PRICE');
    }

    if (!Number.isSafeInteger(input.minimumIncrementMinor) || input.minimumIncrementMinor <= 0) {
      throw new BadRequestError('minimumIncrementMinor must be a positive integer', 'INVALID_AUCTION_PRICE');
    }

    const title = input.title.trim();
    const description = input.description.trim();
    const imageUrl = input.imageUrl.trim();
    const currency = (input.currency ?? DEFAULT_CURRENCY).trim().toUpperCase();

    if (!title || !description) {
      throw new BadRequestError('title and description are required', 'INVALID_AUCTION_TEXT');
    }

    try {
      new URL(imageUrl);
    } catch {
      throw new BadRequestError('imageUrl must be a valid URL', 'INVALID_AUCTION_IMAGE');
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestError('currency must be a three-letter code', 'INVALID_AUCTION_CURRENCY');
    }

    const endAt = new Date(startAt.getTime() + input.durationSeconds * 1000);
    const status: AuctionStatus = startAt.getTime() <= now.getTime() ? 'ACTIVE' : 'UPCOMING';
    const auction = await this.auctions.createAuction({
      sellerId: actor.userId,
      title,
      description,
      imageUrl,
      currency,
      startingBidMinor: input.startingBidMinor,
      minimumIncrementMinor: input.minimumIncrementMinor,
      startAt,
      endAt,
      status
    });

    await this.timelines.createEvent({
      auctionId: auction.id,
      type: 'AUCTION_CREATED',
      sequence: 0,
      actorPublicId: actor.userId
    });

    this.scheduler.scheduleAuction(auction, {
      onAuctionStarted: (snapshot) => realtimeService.broadcastAuctionStarted(snapshot),
      onAuctionEnded: (snapshot) => realtimeService.broadcastAuctionEnded(snapshot)
    });

    return auction;
  }

  async listAuctions(input: ListAuctionsInput = {}): Promise<AuctionListResult> {
    const query = this.normalizeListQuery(input);
    const result = await this.auctions.listAuctions(query);

    return {
      items: result.items,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        hasNextPage: query.page * query.limit < result.total
      }
    };
  }

  async getAuctionDetail(auctionId: string): Promise<EngineAuctionRecord> {
    const auction = await this.auctions.findById(auctionId);

    if (!auction) {
      throw new NotFoundError('Auction not found', 'AUCTION_NOT_FOUND');
    }

    return auction;
  }

  private normalizeListQuery(input: ListAuctionsInput): ListAuctionsQuery {
    const page = this.parsePositiveInteger(input.page, 1);
    const limit = Math.min(this.parsePositiveInteger(input.limit, 20), 100);
    const status = typeof input.status === 'string' && AUCTION_STATUSES.includes(input.status as AuctionStatus)
      ? (input.status as AuctionStatus)
      : undefined;
    const search = typeof input.search === 'string' && input.search.trim()
      ? input.search.trim().slice(0, 120)
      : undefined;

    return {
      page,
      limit,
      status,
      search
    };
  }

  private parsePositiveInteger(value: unknown, fallback: number): number {
    const parsed = Number(value);

    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}

export const auctionService = new AuctionService();
