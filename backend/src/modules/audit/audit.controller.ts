import type { RequestHandler } from "express";
import type { AuditAction, AuditEntityType } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { auditService } from "./audit.service";

export const auditController = {
  list: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as {
        from?: string;
        to?: string;
        centerId?: number;
        circleId?: number;
        actorUserId?: number;
        action?: AuditAction;
        entityType?: AuditEntityType;
        entityId?: number;
        q?: string;
        page?: number;
        pageSize?: number;
      };
      const data = await auditService.list(req.scope, query);

      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  catalog: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const data = await auditService.catalog(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};

