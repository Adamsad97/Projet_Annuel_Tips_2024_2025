export type ValidationDetail = { path: string; message: string };
export type AppErrorDetails = string | ValidationDetail[] | Record<string, unknown>;

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details: AppErrorDetails | undefined;

  constructor(message: string, statusCode = 500, details?: AppErrorDetails, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
