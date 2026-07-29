import { Router } from 'express';

import { timelineController, type TimelineController } from './timeline.controller.js';

export class TimelineRoute {
  readonly router = Router();

  constructor(private readonly controller: TimelineController = timelineController) {
    this.register();
  }

  private register(): void {
    // Timeline endpoints will be registered when completed auction views are implemented.
  }
}

export const timelineRoute = new TimelineRoute();
