import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError, type AppErrorDetails } from './AppError.js';

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code = 'TOO_MANY_REQUESTS', details?: AppErrorDetails) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, code, details);
  }
}
