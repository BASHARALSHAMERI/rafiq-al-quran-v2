import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { supervisorService } from "./supervisor.service";

export const supervisorController = {
  getDashboard: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        supervisorId?: number;
        month: number;
        year: number;
      };
      const data = await supervisorService.getDashboard(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  upsertTargets: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const userId = parseInt(req.params.userId as string, 10);
      const body = req.body as {
        monthlyHoursTarget?: number;
        monthlyVisitsTarget?: number;
      };
      const data = await supervisorService.upsertTargets(req.scope, userId, body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listSupervisors: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const data = await supervisorService.listSupervisors(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
};
