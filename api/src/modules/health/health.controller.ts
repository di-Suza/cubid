import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { healthService, type HealthService } from './health.service.js';

export class HealthController {
  constructor(private readonly service: HealthService = healthService) {}

  getStatus = (_req: Request, res: Response): void => {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: this.service.getStatus()
    });
  };
}

export const healthController = new HealthController();
