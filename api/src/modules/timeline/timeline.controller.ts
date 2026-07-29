import { timelineService, type TimelineService } from './timeline.service.js';

export class TimelineController {
  constructor(private readonly service: TimelineService = timelineService) {}
}

export const timelineController = new TimelineController();
