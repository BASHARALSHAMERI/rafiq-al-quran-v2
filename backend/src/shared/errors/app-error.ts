export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;
  readonly code: string;

  constructor(message: string, statusCode = 500, details?: unknown, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code ?? "APP_ERROR";
  }
}
