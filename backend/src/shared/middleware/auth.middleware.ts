import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error";
import { verifyAccessToken } from "../utils/jwt";

const extractBearerToken = (authorization?: string): string | null => {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const authGuard: RequestHandler = (req, _res, next) => {
  let token = extractBearerToken(req.headers.authorization);

  // Hardening fallback: Allow token in query string only for download/cover paths where custom headers cannot be set easily.
  if (!token && req.query.token && typeof req.query.token === "string") {
    const path = req.path || "";
    if (path.includes("/download") || path.includes("/cover")) {
      token = req.query.token;
    }
  }

  if (!token) {
    next(new AppError("Missing access token", 401));
    return;
  }

  const payload = verifyAccessToken(token);

  req.auth = {
    userId: payload.sub,
    role: payload.role,
    organizationId: payload.organizationId
  };

  next();
};