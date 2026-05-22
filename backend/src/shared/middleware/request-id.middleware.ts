import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

const REQUEST_ID_HEADER = "x-request-id";

const normalizeHeaderValue = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && value.length > 0 && value[0]?.trim()) {
    return value[0].trim();
  }

  return null;
};

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = normalizeHeaderValue(req.headers[REQUEST_ID_HEADER]);
  const requestId = incoming ?? randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
};
