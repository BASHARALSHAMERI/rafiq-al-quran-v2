import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { correctionsService } from "./corrections.service";

export const correctionsController = {
  list: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./corrections.service").ListCorrectionsInput;
      const data = await correctionsService.list(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  create: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const input = req.body as import("./corrections.service").CreateCorrectionInput;
      const data = await correctionsService.create(req.scope, input);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approve: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const body = req.body as { applyChanges: boolean; reviewNote?: string };
      const data = await correctionsService.approve(req.scope, params.id, body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reject: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const body = req.body as { reviewNote: string };
      const data = await correctionsService.reject(req.scope, params.id, body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};

