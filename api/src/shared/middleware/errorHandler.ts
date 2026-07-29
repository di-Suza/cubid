import type { ErrorRequestHandler } from 'express';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError } from '../errors/AppError.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  logger.error({ error, path: req.originalUrl, method: req.method }, 'Unhandled request error');

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.isProduction ? 'Internal server error' : error.message
    }
  });
};
