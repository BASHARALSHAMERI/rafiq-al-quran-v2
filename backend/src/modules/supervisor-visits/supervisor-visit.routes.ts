import { Router } from "express";
import { Role } from "@prisma/client";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { validateBody, validateQuery } from "../../shared/middleware/validate.middleware";
import { supervisorVisitController } from "./supervisor-visit.controller";
import {
  createPlanSchema,
  updatePlanStatusSchema,
  listPlansQuerySchema,
  addPlanItemSchema,
  updatePlanItemSchema,
  startVisitSchema,
  endVisitSchema,
  listVisitLogsQuerySchema
} from "./supervisor-visit.validation";

const supervisorVisitRouter = Router();

supervisorVisitRouter.use(authGuard, attachScope);

// Plans
supervisorVisitRouter.post(
  "/plans",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createPlanSchema),
  supervisorVisitController.createPlan
);

supervisorVisitRouter.get(
  "/plans",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(listPlansQuerySchema),
  supervisorVisitController.listPlans
);

supervisorVisitRouter.patch(
  "/plans/:id/status",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(updatePlanStatusSchema),
  supervisorVisitController.updatePlanStatus
);

// Plan Items
supervisorVisitRouter.post(
  "/plans/:planId/items",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(addPlanItemSchema),
  supervisorVisitController.addPlanItem
);

supervisorVisitRouter.put(
  "/plans/items/:itemId",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(updatePlanItemSchema),
  supervisorVisitController.updatePlanItem
);

supervisorVisitRouter.delete(
  "/plans/items/:itemId",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  supervisorVisitController.removePlanItem
);

// Execution
supervisorVisitRouter.get(
  "/today",
  requireRoles([Role.SUPERVISOR]),
  supervisorVisitController.getTodayVisits
);

supervisorVisitRouter.post(
  "/start",
  requireRoles([Role.SUPERVISOR]),
  validateBody(startVisitSchema),
  supervisorVisitController.startVisit
);

supervisorVisitRouter.patch(
  "/:logId/end",
  requireRoles([Role.SUPERVISOR]),
  validateBody(endVisitSchema),
  supervisorVisitController.endVisit
);

supervisorVisitRouter.get(
  "/logs",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(listVisitLogsQuerySchema),
  supervisorVisitController.listVisitLogs
);

export default supervisorVisitRouter;
