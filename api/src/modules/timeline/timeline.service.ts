import { timelineRepository, type TimelineRepository } from './timeline.repository.js';

export class TimelineService {
  constructor(private readonly repository: TimelineRepository = timelineRepository) {}
}

export const timelineService = new TimelineService();
