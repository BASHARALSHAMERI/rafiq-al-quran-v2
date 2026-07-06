import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { financeDeductionService } from "./finance-deduction.service";

export const financeDeductionController = {
  listRules: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const data = await financeDeductionService.listRules(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  upsertRule: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody;
      const data = await financeDeductionService.upsertRule(req.scope, body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  generateDeductions: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { month, year, centerId } = res.locals.validatedBody;
      const data = await financeDeductionService.generateMonthlyDeductions(req.scope, month, year, centerId);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listEvents: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery || {};
      const data = await financeDeductionService.listEvents(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reviewEvent: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = req.params;
      const { action, status, reviewNote, note } = res.locals.validatedBody;
      const resolvedAction = action ?? status;
      const resolvedReviewNote = reviewNote ?? note;
      const data = await financeDeductionService.reviewEvent(req.scope, Number(id), resolvedAction, resolvedReviewNote);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
