import pino from "pino";
import { env } from "../../config/env";

export const logger = pino({
  name: env.SERVICE_NAME,
  messageKey: "msg",
  timestamp: () => `,"ts":"${new Date().toISOString()}"`,
  level: env.LOG_LEVEL,
  base: {
    service: env.SERVICE_NAME,
    env: env.NODE_ENV
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.newPassword",
      "req.body.token",
      "req.body.refreshToken",
      "res.headers.set-cookie"
    ],
    censor: "[REDACTED]"
  }
});
