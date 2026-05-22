import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { monthlyPlansService } from "./monthly-plans.service";
import type {
  GenerateMonthlyPlansDto,
  ListMonthlyPlansDto,
  UpdateMonthlyPlanDto,
  UpdateReviewSettingsDto
} from "./monthly-plans.validation";

export const monthlyPlansController = {
  generate: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const payload = res.locals.validatedBody as GenerateMonthlyPlansDto;
      const data = await monthlyPlansService.generate(req.scope, payload);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  list: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as ListMonthlyPlansDto;
      const data = await monthlyPlansService.list(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getById: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const id = parseInt(String(req.params.id ?? "0"), 10);
      if (!id) throw new AppError("Invalid ID", 400);
      const data = await monthlyPlansService.getById(req.scope, id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  update: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const id = parseInt(String(req.params.id ?? "0"), 10);
      if (!id) throw new AppError("Invalid ID", 400);
      const payload = res.locals.validatedBody as UpdateMonthlyPlanDto;
      const data = await monthlyPlansService.update(req.scope, id, payload);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approve: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const id = parseInt(String(req.params.id ?? "0"), 10);
      if (!id) throw new AppError("Invalid ID", 400);
      const data = await monthlyPlansService.approve(req.scope, id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveAll: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { circleId, month, year } = req.body as {
        circleId: number;
        month: number;
        year: number;
      };
      const data = await monthlyPlansService.approveAll(req.scope, circleId, month, year);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getReviewSettings: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const circleId = req.query.circleId
        ? parseInt(String(req.query.circleId), 10)
        : undefined;
      const data = await monthlyPlansService.getReviewSettings(req.scope, circleId);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateReviewSettings: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const payload = res.locals.validatedBody as UpdateReviewSettingsDto;
      const data = await monthlyPlansService.updateReviewSettings(req.scope, payload);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
