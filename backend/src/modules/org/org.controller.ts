import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { orgService } from "./org.service";

export const orgController = {
  getBranding: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const branding = await orgService.getBranding(req.scope);
      res.json({
        ok: true,
        data: branding
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateBranding: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const branding = await orgService.updateBranding(req.scope, req.body as any);
      res.json({
        ok: true,
        data: branding
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createCenter: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const center = await orgService.createCenter(req.scope, req.body as any);
      res.status(201).json({
        ok: true,
        data: center
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateCenter: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const center = await orgService.updateCenter(
        req.scope,
        params.id,
        req.body as any
      );

      res.json({
        ok: true,
        data: center
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateCenterStatus: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const center = await orgService.updateCenterStatus(req.scope, params.id, req.body as { isActive: boolean });

      res.json({
        ok: true,
        data: center
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listCenters: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as { centerId?: number };
      const centers = await orgService.listCenters(req.scope, query);

      res.json({
        ok: true,
        data: centers
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listCircles: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as { centerId?: number; circleId?: number; approvalStatus?: string };
      const circles = await orgService.listCircles(req.scope, query);

      res.json({
        ok: true,
        data: circles
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createCircle: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const circle = await orgService.createCircle(req.scope, req.body as any);
      res.status(201).json({
        ok: true,
        data: circle
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateCircle: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const circle = await orgService.updateCircle(
        req.scope,
        params.id,
        req.body as any
      );
      res.json({
        ok: true,
        data: circle
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateCircleStatus: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const circle = await orgService.updateCircleStatus(req.scope, params.id, req.body as { isActive: boolean });
      res.json({
        ok: true,
        data: circle
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateCircleApprovalStatus: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const body = req.body as { status: 'APPROVED' | 'REJECTED' };
      const circle = await orgService.updateCircleApprovalStatus(req.scope, params.id, body.status);
      res.json({
        ok: true,
        data: circle
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
