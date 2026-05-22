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
  const token = extractBearerToken(req.headers.authorization) || (req.query.token as string);

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