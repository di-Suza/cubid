export type AppErrorDetails = Record<string, unknown> | undefined;

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: AppErrorDetails;
  readonly isOperational = true;

  constructor(message: string, statusCode: number, code: string, details?: AppErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
