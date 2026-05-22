import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import {
  followUpsService,
  type CreateFollowUpInput,
  type ListFollowUpsInput,
  type UpdateFollowUpInput
} from "./follow-ups.service";

export const followUpsController = {
  listFollowUps: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);

      const query = res.locals.validatedQuery as ListFollowUpsInput;
      const data = await followUpsService.listFollowUps(req.scope, query);

      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createFollowUp: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);

      const input = req.body as CreateFollowUpInput;
      const record = await followUpsService.createFollowUp(req.scope, input);

      res.status(201).json({ ok: true, data: record });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateFollowUp: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as UpdateFollowUpInput;
      const record = await followUpsService.updateFollowUp(req.scope, params.id, input);

      res.json({ ok: true, data: record });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  finalizeFollowUp: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);

      const params = res.locals.validatedParams as { id: number };
      const record = await followUpsService.finalizeFollowUp(req.scope, params.id);

      res.json({ ok: true, data: record });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
