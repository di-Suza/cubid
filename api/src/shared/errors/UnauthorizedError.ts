import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError, type AppErrorDetails } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'AUTH_REQUIRED', details?: AppErrorDetails) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code, details);
  }
}
