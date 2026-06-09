import type { CookieOptions, Request } from "express";
import { env } from "../../config/env";
import { durationToMs } from "../../shared/utils/time";

export const REFRESH_COOKIE_NAME = "rafiq_rt";

export const buildRefreshCookieOptions = (): CookieOptions => {
  const crossSiteCookie = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: crossSiteCookie,
    sameSite: crossSiteCookie ? "none" : "lax",
    path: "/auth",
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN)
  };
};

export const extractRefreshToken = (request: Request): string | null => {
  const bodyToken =
    typeof request.body?.refreshToken === "string" ? request.body.refreshToken : undefined;
  const cookieToken = request.cookies?.[REFRESH_COOKIE_NAME];

  return bodyToken || cookieToken || null;
};
