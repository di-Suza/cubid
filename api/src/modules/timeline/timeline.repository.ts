import { TimelineEventModel, type TimelineEventDocument } from './timeline.model.js';

export class TimelineRepository {
  constructor(private readonly timelineEventModel = TimelineEventModel) {}

  get model(): typeof this.timelineEventModel {
    return this.timelineEventModel;
  }
}

export const timelineRepository = new TimelineRepository();

export type { TimelineEventDocument };
