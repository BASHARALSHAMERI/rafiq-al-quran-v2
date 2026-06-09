import type { LocalizedMessage } from "../i18n/messages";

export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;
  readonly code: string;
  /** Optional bilingual message pair for locale-aware responses */
  readonly localized?: LocalizedMessage;

  constructor(
    message: string,
    statusCode = 500,
    details?: unknown,
    code?: string,
    localized?: LocalizedMessage
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code ?? "APP_ERROR";
    this.localized = localized;
  }
}
