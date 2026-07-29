import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError, type AppErrorDetails } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN', details?: AppErrorDetails) {
    super(message, HTTP_STATUS.FORBIDDEN, code, details);
  }
}
