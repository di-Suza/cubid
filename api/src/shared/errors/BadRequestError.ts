import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError, type AppErrorDetails } from './AppError.js';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST', details?: AppErrorDetails) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, details);
  }
}
