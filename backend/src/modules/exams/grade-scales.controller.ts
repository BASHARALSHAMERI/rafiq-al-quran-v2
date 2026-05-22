import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { createGradeScalesService } from "./grade-scales.service";
import { prisma } from "../../shared/db/prisma";

const gradeScalesService = createGradeScalesService(prisma);

export const gradeScalesController = {
  listAll: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const scales = await gradeScalesService.listAll(req.scope.organizationId);
      res.json({ ok: true, data: scales });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listActive: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const scales = await gradeScalesService.listActive(req.scope.organizationId);
      res.json({ ok: true, data: scales });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  create: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const scale = await gradeScalesService.create(req.scope.organizationId, req.body);
      res.status(201).json({ ok: true, data: scale });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  update: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        throw new AppError("Invalid ID", 400);
      }

      const scale = await gradeScalesService.update(id, req.scope.organizationId, req.body);
      if (!scale) {
        throw new AppError("Grade scale not found", 404);
      }

      res.json({ ok: true, data: scale });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  delete: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        throw new AppError("Invalid ID", 400);
      }

      const success = await gradeScalesService.delete(id, req.scope.organizationId);
      if (!success) {
        throw new AppError("Grade scale not found", 404);
      }

      res.json({ ok: true, data: { success: true } });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
