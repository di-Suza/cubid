import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError, type AppErrorDetails } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(message = 'Not found', code = 'NOT_FOUND', details?: AppErrorDetails) {
    super(message, HTTP_STATUS.NOT_FOUND, code, details);
  }
}
