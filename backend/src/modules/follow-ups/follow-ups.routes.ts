import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import {
  validateBody,
  validateParams,
  validateQuery
} from "../../shared/middleware/validate.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import { followUpsController } from "./follow-ups.controller";
import {
  createFollowUpBodySchema,
  followUpIdParamSchema,
  listFollowUpsQuerySchema,
  updateFollowUpBodySchema
} from "./follow-ups.validation";

const followUpsRouter = Router();

followUpsRouter.use(authGuard, attachScope);

followUpsRouter.get(
  "/",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(listFollowUpsQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  followUpsController.listFollowUps
);

followUpsRouter.post(
  "/",
  requireRoles([Role.TEACHER, Role.SUPERVISOR]),
  validateBody(createFollowUpBodySchema),
  followUpsController.createFollowUp
);

followUpsRouter.patch(
  "/:id",
  requireRoles([Role.TEACHER, Role.SUPERVISOR]),
  validateParams(followUpIdParamSchema),
  validateBody(updateFollowUpBodySchema),
  followUpsController.updateFollowUp
);

followUpsRouter.patch(
  "/:id/finalize",
  requireRoles([Role.TEACHER, Role.SUPERVISOR]),
  validateParams(followUpIdParamSchema),
  followUpsController.finalizeFollowUp
);

followUpsRouter.delete(
  "/:id",
  requireRoles([Role.TEACHER, Role.SUPERVISOR]),
  validateParams(followUpIdParamSchema),
  followUpsController.removeFollowUp
);

export default followUpsRouter;
