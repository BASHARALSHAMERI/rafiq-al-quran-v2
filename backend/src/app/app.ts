import cors, { type CorsOptionsDelegate } from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import path from "node:path";
import { allowedCorsOrigins, corsCredentialsPaths, env } from "../config/env";
import router from "./router";
import { AppError } from "../shared/errors/app-error";
import { requestIdMiddleware } from "../shared/middleware/request-id.middleware";
import { httpLoggerMiddleware } from "../shared/middleware/http-logger.middleware";
import { errorMiddleware } from "../shared/middleware/error.middleware";
import { localeMiddleware, t } from "../shared/i18n";
import { messages } from "../shared/i18n/messages";
import { metrics } from "../shared/metrics/metrics";
import { notFoundHandler } from "../shared/middleware/not-found.middleware";

const app = express();
// Trust the first proxy hop (nginx / load balancer) so that express-rate-limit
// reads the real client IP from X-Forwarded-For instead of the proxy address.
app.set("trust proxy", 1);
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const vercelOriginPattern = /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i;

const shouldAllowCredentials = (requestPath: string) => {
  return corsCredentialsPaths.some((pathPrefix) => {
    const normalized = pathPrefix.startsWith("/") ? pathPrefix : `/${pathPrefix}`;
    return requestPath === normalized || requestPath.startsWith(`${normalized}/`);
  });
};

const isAllowedCorsOrigin = (origin: string) => {
  if (allowedCorsOrigins.includes(origin) || allowedCorsOrigins.includes("*")) {
    return true;
  }

  const matchesWildcard = allowedCorsOrigins.some((allowed) => {
    if (allowed.includes("*")) {
      const regex = new RegExp(`^${allowed.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\\\*/g, ".*")}$`, "i");
      return regex.test(origin);
    }
    return false;
  });

  if (matchesWildcard) {
    return true;
  }

  if (vercelOriginPattern.test(origin)) {
    return true;
  }

  return env.NODE_ENV !== "production" && localDevOriginPattern.test(origin);
};

const buildCorsOptions: CorsOptionsDelegate = (req, callback) => {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
  const requestPath = ((req as unknown as { url?: string }).url ?? "/").split("?")[0] ?? "/";
  const credentials = shouldAllowCredentials(requestPath);

  if (!origin) {
    callback(null, {
      origin: false,
      credentials,
      optionsSuccessStatus: 204
    });
    return;
  }

  if (!isAllowedCorsOrigin(origin)) {
    callback(new AppError(`CORS origin is not allowed: ${origin}`, 403, undefined, "CORS_ORIGIN_DENIED"));
    return;
  }

  callback(null, {
    origin: true,
    credentials,
    optionsSuccessStatus: 204,
    maxAge: 86_400
  });
};

const buildRateLimitResponse = (req: express.Request, max: number, windowMs: number) => {
  const lang = req.lang ?? "ar";
  const msg = t(messages.errors.auth.rateLimited, lang);
  return {
    ok: false as const,
    error: {
      code: "RATE_LIMITED",
      message: msg,
      requestId: req.requestId ?? "unknown"
    },
    message: msg,
    details: {
      limit: max,
      windowMs
    }
  };
};

const authLoginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_LOGIN_WINDOW_MS,
  limit: env.RATE_LIMIT_LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    metrics.recordRateLimited();
    res.status(429).json(
      buildRateLimitResponse(req, env.RATE_LIMIT_LOGIN_MAX, env.RATE_LIMIT_LOGIN_WINDOW_MS)
    );
  }
});

const authRefreshLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_REFRESH_WINDOW_MS,
  limit: env.RATE_LIMIT_REFRESH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    metrics.recordRateLimited();
    res.status(429).json(
      buildRateLimitResponse(req, env.RATE_LIMIT_REFRESH_MAX, env.RATE_LIMIT_REFRESH_WINDOW_MS)
    );
  }
});

const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_GENERAL_WINDOW_MS,
  limit: env.RATE_LIMIT_GENERAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/auth/login",
  handler: (req, res) => {
    metrics.recordRateLimited();
    res.status(429).json(
      buildRateLimitResponse(req, env.RATE_LIMIT_GENERAL_MAX, env.RATE_LIMIT_GENERAL_WINDOW_MS)
    );
  }
});

app.use(requestIdMiddleware);
app.use(localeMiddleware);
app.use(httpLoggerMiddleware);
app.use(
  helmet(
    env.NODE_ENV === "production"
      ? {
          contentSecurityPolicy: {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              frameAncestors: ["'none'"],
              objectSrc: ["'none'"],
              scriptSrc: ["'self'"],
              connectSrc: ["'self'"],
              imgSrc: ["'self'", "data:"],
              styleSrc: ["'self'"]
            }
          }
        }
      : {}
  )
);

if (env.ENABLE_COMPRESSION) {
  app.use(compression());
}

app.use(cors(buildCorsOptions));
app.use(express.json({ limit: env.REQUEST_JSON_LIMIT }));
app.use(
  express.urlencoded({
    extended: true,
    limit: env.REQUEST_URLENCODED_LIMIT
  })
);
app.use(cookieParser());
app.use("/auth/check-user", authLoginLimiter);
app.use("/auth/login", authLoginLimiter);
app.use("/auth/forgot-password", authLoginLimiter);
app.use("/auth/reset-password", authLoginLimiter);
app.use("/auth/refresh", authRefreshLimiter);
app.use(generalLimiter);
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "storage", "uploads"), {
    fallthrough: true,
    maxAge: env.NODE_ENV === "production" ? "7d" : 0,
    setHeaders: (res) => {
      // Allow frontend on a different origin (e.g. Vite dev server on :5173) to embed images.
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    }
  })
);
app.use(router);
app.use(notFoundHandler);
app.use(errorMiddleware);

export default app;
