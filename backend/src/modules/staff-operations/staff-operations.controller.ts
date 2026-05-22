import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { staffOperationsService } from "./staff-operations.service";

export const staffOperationsController = {
  listAttendance: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        date?: string;
        page: number;
        limit: number;
      };
      const records = await staffOperationsService.listAttendance(req.scope, query);
      res.json({ ok: true, data: records });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  markAttendance: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { records, date } = req.body;
      const result = await staffOperationsService.markAttendance(req.scope, records, date);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getSelfAttendance: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        centerId?: number;
        circleId?: number;
        month?: number;
        year?: number;
      };
      const result = await staffOperationsService.getSelfAttendance(req.scope, query);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  checkInSelf: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as {
        centerId?: number;
        circleId?: number;
        latitude?: number | null;
        longitude?: number | null;
      };
      const result = await staffOperationsService.checkInSelf(req.scope, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      console.error("[StaffOpsCtrl] checkInSelf error:", error);
      next(error);
    }
  }) as RequestHandler,

  checkOutSelf: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as {
        centerId?: number;
        circleId?: number;
        latitude?: number | null;
        longitude?: number | null;
      };
      const result = await staffOperationsService.checkOutSelf(req.scope, body);
      res.status(200).json({ ok: true, data: result });
    } catch (error) {
      console.error("[StaffOpsCtrl] checkOutSelf error:", error);
      next(error);
    }
  }) as RequestHandler,

  listExcuses: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        status?: any;
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
      };
      const excuses = await staffOperationsService.listExcuses(req.scope, query);
      res.json({ ok: true, data: excuses });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  requestExcuse: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as any;
      const result = await staffOperationsService.requestExcuse(req.scope, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      console.error("[StaffOpsCtrl] requestExcuse error:", error);
      next(error);
    }
  }) as RequestHandler,

  updateExcuseStatus: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const excuseId = parseInt(req.params.id as string, 10);
      const { status, note } = req.body;
      const result = await staffOperationsService.updateExcuseStatus(req.scope, excuseId, status, note);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listVisits: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
      };
      const visits = await staffOperationsService.listVisits(req.scope, query);
      res.json({ ok: true, data: visits });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getMonthlyReport: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        month: number;
        year: number;
      };
      const report = await staffOperationsService.getMonthlyReport(req.scope, query.month, query.year);
      res.json({ ok: true, data: report });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listLeaves: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as any;
      const leaves = await staffOperationsService.listLeaves(req.scope, query);
      res.json({ ok: true, data: leaves });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  requestLeave: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as any;
      const result = await staffOperationsService.requestLeave(req.scope, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateLeaveStatus: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const leaveId = parseInt(req.params.id as string, 10);
      const { status, note } = req.body;
      const result = await staffOperationsService.updateLeaveStatus(req.scope, leaveId, status, note);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
};
