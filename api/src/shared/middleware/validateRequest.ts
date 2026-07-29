import type { RequestHandler } from 'express';
import { validationResult } from 'express-validator';

import { ValidationError } from '../errors/ValidationError.js';

export const validateRequest: RequestHandler = (req, _res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  next(
    new ValidationError('Validation failed', 'VALIDATION_ERROR', {
      fields: result.array({ onlyFirstError: true })
    })
  );
};
