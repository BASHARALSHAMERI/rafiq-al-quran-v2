import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { staffLeaveService } from "./staff-leave.service";

export const staffLeaveController = {
  submitLeaveRequest: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody;
      const data = await staffLeaveService.submitLeaveRequest(req.scope, body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listLeaveRequests: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery || {};
      const data = await staffLeaveService.listLeaveRequests(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveLeave: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = req.params;
      const { responseNote } = res.locals.validatedBody || {};
      const data = await staffLeaveService.approveLeave(req.scope, Number(id), responseNote);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  rejectLeave: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = req.params;
      const { responseNote } = res.locals.validatedBody || {};
      const data = await staffLeaveService.rejectLeave(req.scope, Number(id), responseNote);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  cancelLeave: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = req.params;
      await staffLeaveService.cancelLeave(req.scope, Number(id));
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
