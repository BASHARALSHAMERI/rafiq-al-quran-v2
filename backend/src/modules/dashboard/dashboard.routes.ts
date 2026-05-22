import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateQuery } from "../../shared/middleware/validate.middleware";
import { dashboardController } from "./dashboard.controller";
import {
  activityFeedQuerySchema,
  attendanceSummaryQuerySchema,
  dashboardMetricsQuerySchema
} from "./dashboard.validation";

const dashboardRouter = Router();

dashboardRouter.use(
  authGuard,
  attachScope,
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER])
);

dashboardRouter.get("/metrics", validateQuery(dashboardMetricsQuerySchema), dashboardController.metrics);

dashboardRouter.get(
  "/activity-feed",
  validateQuery(activityFeedQuerySchema),
  dashboardController.activityFeed
);

dashboardRouter.get(
  "/attendance-summary",
  validateQuery(attendanceSummaryQuerySchema),
  dashboardController.attendanceSummary
);

export default dashboardRouter;