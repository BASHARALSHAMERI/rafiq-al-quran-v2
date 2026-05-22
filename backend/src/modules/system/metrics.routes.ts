import { timingSafeEqual } from "node:crypto";
import { Router, type RequestHandler } from "express";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { metrics } from "../../shared/metrics/metrics";

const metricsRouter = Router();

const parseBasicAuth = (headerValue?: string) => {
  if (!headerValue || !headerValue.startsWith("Basic ")) {
    return null;
  }

  try {
    const encoded = headerValue.slice("Basic ".length).trim();
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex <= 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
};

const safeEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const requireMetricsAccess: RequestHandler = (req, res, next) => {
  const hasBasicCredentials =
    typeof env.METRICS_BASIC_USER === "string" &&
    env.METRICS_BASIC_USER.length > 0 &&
    typeof env.METRICS_BASIC_PASS === "string" &&
    env.METRICS_BASIC_PASS.length > 0;

  if (hasBasicCredentials) {
    const parsed = parseBasicAuth(req.headers.authorization);
    const isAuthorized =
      parsed &&
      safeEquals(parsed.username, env.METRICS_BASIC_USER as string) &&
      safeEquals(parsed.password, env.METRICS_BASIC_PASS as string);

    if (!isAuthorized) {
      res.setHeader("WWW-Authenticate", 'Basic realm="metrics"');
      res.status(401).send("Unauthorized");
      return;
    }

    next();
    return;
  }

  if (env.NODE_ENV !== "development") {
    next(new AppError("Metrics endpoint requires basic auth outside development", 403));
    return;
  }

  next();
};

metricsRouter.get("/metrics", requireMetricsAccess, (_req, res) => {
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(metrics.renderPrometheus());
});

export default metricsRouter;
