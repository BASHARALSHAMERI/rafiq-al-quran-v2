import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { supervisorVisitService } from "./supervisor-visit.service";

export const supervisorVisitController = {
  createPlan: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody;
      const data = await supervisorVisitService.createPlan(req.scope, body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listPlans: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery || {};
      const data = await supervisorVisitService.listPlans(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updatePlanStatus: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = req.params;
      const { status } = res.locals.validatedBody;
      const data = await supervisorVisitService.updatePlanStatus(req.scope, Number(id), status);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  addPlanItem: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { planId } = req.params;
      const body = res.locals.validatedBody;
      const data = await supervisorVisitService.addPlanItem(req.scope, Number(planId), body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updatePlanItem: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { itemId } = req.params;
      const body = res.locals.validatedBody;
      const data = await supervisorVisitService.updatePlanItem(req.scope, Number(itemId), body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  removePlanItem: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { itemId } = req.params;
      const data = await supervisorVisitService.removePlanItem(req.scope, Number(itemId));
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getTodayVisits: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const data = await supervisorVisitService.getTodayVisits(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  startVisit: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody;
      const data = await supervisorVisitService.startVisit(req.scope, body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  endVisit: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { logId } = req.params;
      const body = res.locals.validatedBody;
      const data = await supervisorVisitService.endVisit(req.scope, Number(logId), body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listVisitLogs: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = (res.locals.validatedQuery || {}) as any;
      const data = await supervisorVisitService.listVisitLogs(req.scope, {
        supervisorId: query.supervisorId ? Number(query.supervisorId) : undefined,
        startDate: query.startDate,
        endDate: query.endDate
      });
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
