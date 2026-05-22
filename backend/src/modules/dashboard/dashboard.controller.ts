import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  metrics: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      dashboardService.validateDashboardRole(req.scope);

      const query = res.locals.validatedQuery as {
        centerId?: number;
        circleId?: number;
        from?: string;
        to?: string;
      };
      const result = await dashboardService.metrics(req.scope, query);

      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  activityFeed: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      dashboardService.validateDashboardRole(req.scope);

      const query = res.locals.validatedQuery as {
        centerId?: number;
        circleId?: number;
        from?: string;
        to?: string;
        limit: number;
      };
      const result = await dashboardService.activityFeed(req.scope, query);

      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  attendanceSummary: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      dashboardService.validateDashboardRole(req.scope);

      const query = res.locals.validatedQuery as {
        centerId?: number;
        circleId?: number;
        from?: string;
        to?: string;
      };
      const result = await dashboardService.attendanceSummary(req.scope, query);

      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
