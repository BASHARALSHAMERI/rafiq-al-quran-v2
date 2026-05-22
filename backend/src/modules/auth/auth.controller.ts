import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { authService } from "./auth.service";
import {
  buildRefreshCookieOptions,
  extractRefreshToken,
  REFRESH_COOKIE_NAME
} from "./auth.domain";

const getClientInfo = (req: Parameters<RequestHandler>[0]) => {
  const userAgentHeader = req.headers["user-agent"];
  const userAgent = typeof userAgentHeader === "string" ? userAgentHeader : undefined;

  const platformHeader = req.headers["x-platform"];
  const platform = String(platformHeader).toLowerCase() === "web" ? ("web" as const) : ("mobile" as const);

  return {
    userAgent,
    ipAddress: req.ip,
    platform
  };
};

export const authController = {
  login: (async (req, res, next) => {
    try {
      const result = await authService.login(req.body, getClientInfo(req));

      try {
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());
      } catch {
        // Continue without cookie, refresh token is returned in payload for API clients.
      }

      res.json({
        ok: true,
        data: {
          accessToken: result.accessToken,
          accessExpiresIn: result.accessExpiresIn,
          refreshToken: result.refreshToken,
          user: result.user
        }
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  checkUser: (async (req, res, next) => {
    try {
      const result = await authService.checkUser(req.body);

      res.json({
        ok: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  setupPassword: (async (req, res, next) => {
    try {
      const result = await authService.setupPassword(req.body);

      res.json({
        ok: true,
        data: { message: result.message }
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  forgotPassword: (async (req, res, next) => {
    try {
      const result = await authService.forgotPassword(req.body, getClientInfo(req));

      res.json({
        ok: true,
        data: {
          message: result.message
        }
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  resetPassword: (async (req, res, next) => {
    try {
      const result = await authService.resetPassword(req.body);

      res.json({
        ok: true,
        data: {
          message: result.message
        }
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  refresh: (async (req, res, next) => {
    try {
      const refreshToken = extractRefreshToken(req);

      if (!refreshToken) {
        throw new AppError("Refresh token is required", 400);
      }

      const result = await authService.refresh(refreshToken, getClientInfo(req));

      try {
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());
      } catch {
        // Continue without cookie, refresh token is returned in payload for API clients.
      }

      res.json({
        ok: true,
        data: {
          accessToken: result.accessToken,
          accessExpiresIn: result.accessExpiresIn,
          refreshToken: result.refreshToken,
          user: result.user
        }
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  logout: (async (req, res, next) => {
    try {
      const refreshToken = extractRefreshToken(req);

      await authService.logout(refreshToken);

      try {
        res.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions());
      } catch {
        // Ignore clear cookie errors when no cookie transport is used.
      }
      res.json({ ok: true, message: "Logged out" });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  me: (async (req, res, next) => {
    try {
      if (!req.auth) {
        throw new AppError("Authentication required", 401);
      }

      const user = await authService.me(req.auth.userId);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  validateActivationToken: (async (req, res, next) => {
    try {
      const result = await authService.validateActivationToken(req.body);

      res.json({
        ok: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  activateAccount: (async (req, res, next) => {
    try {
      const result = await authService.activateAccount(req.body);

      res.json({
        ok: true,
        data: {
          message: result.message
        }
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
