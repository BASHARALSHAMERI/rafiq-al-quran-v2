import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateParams, validateQuery } from "../../shared/middleware/validate.middleware";
import { notificationsController } from "./notifications.controller";
import {
  notificationIdParamSchema,
  notificationsListQuerySchema
} from "./notifications.validation";

const notificationsRouter = Router();

notificationsRouter.use(authGuard, attachScope);

notificationsRouter.get(
  "/notifications",
  requireRoles([
    Role.SUPER_ADMIN,
    Role.CENTER_ADMIN,
    Role.SUPERVISOR,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
    Role.FINANCE_MANAGER
  ]),
  validateQuery(notificationsListQuerySchema),
  notificationsController.list
);

notificationsRouter.get(
  "/notifications/unread-count",
  requireRoles([
    Role.SUPER_ADMIN,
    Role.CENTER_ADMIN,
    Role.SUPERVISOR,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
    Role.FINANCE_MANAGER
  ]),
  notificationsController.unreadCount
);

notificationsRouter.patch(
  "/notifications/:id/read",
  requireRoles([
    Role.SUPER_ADMIN,
    Role.CENTER_ADMIN,
    Role.SUPERVISOR,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
    Role.FINANCE_MANAGER
  ]),
  validateParams(notificationIdParamSchema),
  notificationsController.markRead
);

notificationsRouter.patch(
  "/notifications/read-all",
  requireRoles([
    Role.SUPER_ADMIN,
    Role.CENTER_ADMIN,
    Role.SUPERVISOR,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
    Role.FINANCE_MANAGER
  ]),
  notificationsController.markAllRead
);

export default notificationsRouter;
