import type { RequestHandler } from "express";
import { env } from "../../config/env";
import { logger } from "../logger/logger";
import { metrics } from "../metrics/metrics";

export const httpLoggerMiddleware: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const finishedAt = process.hrtime.bigint();
    const durationMs = Number(finishedAt - startedAt) / 1_000_000;
    const durationMsRounded = Number(durationMs.toFixed(2));
    const path = req.originalUrl;

    metrics.recordHttpRequest({
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: durationMsRounded
    });

    const logPayload = {
      msg: durationMsRounded > env.SLOW_REQUEST_MS ? "slow_request" : "request_completed",
      request_id: req.requestId ?? null,
      method: req.method,
      path,
      status: res.statusCode,
      duration_ms: durationMsRounded,
      user_id: req.auth?.userId ?? null,
      role: req.auth?.role ?? null
    };

    if (durationMsRounded > env.SLOW_REQUEST_MS) {
      logger.warn(logPayload);
      return;
    }

    logger.info(logPayload);
  });

  next();
};
