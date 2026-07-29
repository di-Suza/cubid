import { Router } from 'express';

import { resultController, type ResultController } from './result.controller.js';

export class ResultRoute {
  readonly router = Router();

  constructor(private readonly controller: ResultController = resultController) {
    this.register();
  }

  private register(): void {
    // Result endpoints will be registered when winner history views are implemented.
  }
}

export const resultRoute = new ResultRoute();
