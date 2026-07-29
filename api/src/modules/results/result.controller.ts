import { resultService, type ResultService } from './result.service.js';

export class ResultController {
  constructor(private readonly service: ResultService = resultService) {}
}

export const resultController = new ResultController();
