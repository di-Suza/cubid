import { resultRepository, type ResultRepository } from './result.repository.js';

export class ResultService {
  constructor(private readonly repository: ResultRepository = resultRepository) {}
}

export const resultService = new ResultService();
