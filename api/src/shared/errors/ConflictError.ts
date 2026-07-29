import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError, type AppErrorDetails } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details?: AppErrorDetails) {
    super(message, HTTP_STATUS.CONFLICT, code, details);
  }
}
