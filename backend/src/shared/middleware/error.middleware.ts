import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../../config/env";
import { AppError } from "../errors/app-error";
import { logger } from "../logger/logger";
import { metrics } from "../metrics/metrics";

type NormalizedError = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

const toNormalizedError = (error: unknown): NormalizedError => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "بيانات الطلب غير صحيحة. يرجى مراجعة الحقول المطلوبة.",
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
      message: "حجم البيانات المرسلة كبير جداً. يرجى تقليل حجم الملف."
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
      message: "صيغة البيانات المرسلة غير صحيحة."
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "تعذر إتمام العملية. يرجى المحاولة مرة أخرى أو التواصل مع الدعم."
  };
};

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const normalized = toNormalizedError(error);
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
