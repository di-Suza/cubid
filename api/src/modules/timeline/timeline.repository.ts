import type { TimelineEventType } from '../../shared/constants/auction.js';
import type { EngineTimelineEventRecord } from '../auction-engine/auctionEngine.types.js';
import { TimelineEventModel, type TimelineEventDocument } from './timeline.model.js';

type LeanTimelineEvent = Record<string, any>;

const toDate = (value: unknown): Date => (value instanceof Date ? value : new Date(String(value)));

export class TimelineRepository {
  constructor(private readonly timelineEventModel = TimelineEventModel) {}

  get model(): typeof this.timelineEventModel {
    return this.timelineEventModel;
  }

  async createEvent(input: {
    auctionId: string;
    type: TimelineEventType;
    sequence: number;
    actorPublicId: string | null;
    publicMetadata?: Record<string, unknown>;
  }): Promise<EngineTimelineEventRecord> {
    const event = await this.timelineEventModel.create({
      auctionId: input.auctionId,
      type: input.type,
      sequence: input.sequence,
      actorPublicId: input.actorPublicId,
      publicMetadata: input.publicMetadata ?? {}
    });

    return this.toEngineRecord(event.toObject() as LeanTimelineEvent);
  }

  async listRecentEvents(auctionId: string, limit: number): Promise<EngineTimelineEventRecord[]> {
    const events = await this.timelineEventModel
      .find({ auctionId })
      .sort({ sequence: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return events.map((event) => this.toEngineRecord(event as LeanTimelineEvent)).reverse();
  }

  private toEngineRecord(event: LeanTimelineEvent): EngineTimelineEventRecord {
    return {
      id: String(event._id),
      auctionId: String(event.auctionId),
      type: event.type,
      sequence: Number(event.sequence),
      actorPublicId: event.actorPublicId ? String(event.actorPublicId) : null,
      publicMetadata:
        event.publicMetadata && typeof event.publicMetadata === 'object'
          ? (event.publicMetadata as Record<string, unknown>)
          : {},
      createdAt: toDate(event.createdAt)
    };
  }
}

export const timelineRepository = new TimelineRepository();

export type { TimelineEventDocument };
