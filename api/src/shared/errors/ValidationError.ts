import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError, type AppErrorDetails } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', code = 'VALIDATION_ERROR', details?: AppErrorDetails) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, code, details);
  }
}
