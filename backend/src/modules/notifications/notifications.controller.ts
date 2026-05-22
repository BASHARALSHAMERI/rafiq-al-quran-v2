import type { RequestHandler } from "express";
import type { NotificationType } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  list: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as {
        isRead?: boolean;
        type?: NotificationType;
        from?: string;
        to?: string;
        page?: number;
        pageSize?: number;
      };
      const data = await notificationsService.listNotifications(req.scope, query);

      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  unreadCount: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const data = await notificationsService.unreadCount(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  markRead: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const data = await notificationsService.markRead(req.scope, params.id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  markAllRead: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const data = await notificationsService.markAllRead(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};

