import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { groupActivitiesService } from "./group-activities.service";
import type { CreateGroupActivityDto, ListGroupActivitiesDto } from "./group-activities.validation";

export const groupActivitiesController = {
  create: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const payload = res.locals.validatedBody as CreateGroupActivityDto;
      const data = await groupActivitiesService.create(req.scope, payload);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  list: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as ListGroupActivitiesDto;
      const data = await groupActivitiesService.list(req.scope, query);
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
      const data = await groupActivitiesService.getById(req.scope, id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
