import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { matnCatalogsService } from "./matn-catalogs.service";
import type { CreateMatnDto, ListMatnQueryDto, UpdateMatnDto } from "./matn-catalogs.validation";

export const matnCatalogsController = {
  list: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as ListMatnQueryDto;
      const data = await matnCatalogsService.list(req.scope, query);
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
      const data = await matnCatalogsService.getById(req.scope, id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  create: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const payload = res.locals.validatedBody as CreateMatnDto;
      const data = await matnCatalogsService.create(req.scope, payload);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  update: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const params = res.locals.validatedParams as { id: number };
      const payload = res.locals.validatedBody as UpdateMatnDto;
      const data = await matnCatalogsService.update(req.scope, params.id, payload);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  remove: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const params = res.locals.validatedParams as { id: number };
      const data = await matnCatalogsService.remove(req.scope, params.id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
