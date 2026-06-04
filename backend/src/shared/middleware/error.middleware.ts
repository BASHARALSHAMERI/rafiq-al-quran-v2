import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../../config/env";
import { AppError } from "../errors/app-error";
import { logger } from "../logger/logger";
import { metrics } from "../metrics/metrics";
import { t, type Lang } from "../i18n";
import { messages } from "../i18n/messages";

type NormalizedError = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

const toNormalizedError = (error: unknown, lang: Lang): NormalizedError => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.localized ? t(error.localized, lang) : error.message,
      details: error.details
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: t(messages.system.zodValidationError, lang),
      details: error.flatten()
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: string }).type === "entity.too.large"
  ) {
    return {
      statusCode: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: t(messages.system.payloadTooLarge, lang)
    };
  }

  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "body" in error
  ) {
    return {
      statusCode: 400,
      code: "INVALID_JSON",
      message: t(messages.system.invalidJson, lang)
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: t(messages.system.internalServerError, lang)
  };
};

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const lang = req.lang ?? "ar";
  const normalized = toNormalizedError(error, lang);
  const requestId = req.requestId ?? "unknown";
  metrics.recordError({
    code: normalized.code,
    status: normalized.statusCode
  });

  logger.error({
    msg: "request_failed",
    request_id: requestId,
    method: req.method,
    path: req.originalUrl,
    status: normalized.statusCode,
    code: normalized.code,
    message: normalized.message,
    user_id: req.auth?.userId ?? null,
    role: req.auth?.role ?? null,
    stack: error instanceof Error ? error.stack : undefined
  });

  const responseBody: {
    ok: false;
    error: {
      code: string;
      message: string;
      requestId: string;
      details?: unknown;
      stack?: string;
    };
    message: string;
    details?: unknown;
  } = {
    ok: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      requestId
    },
    message: normalized.message
  };

  if (normalized.details !== undefined) {
    responseBody.error.details = normalized.details;
    responseBody.details = normalized.details;
  }

  if (env.NODE_ENV !== "production" && error instanceof Error && error.stack) {
    responseBody.error.stack = error.stack;
  }

  res.status(normalized.statusCode).json(responseBody);
};
