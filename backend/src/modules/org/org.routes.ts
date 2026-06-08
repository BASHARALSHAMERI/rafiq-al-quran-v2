import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import {
  validateBody,
  validateParams,
  validateQuery
} from "../../shared/middleware/validate.middleware";
import { orgController } from "./org.controller";
import {
  centerStatusBodySchema,
  centersQuerySchema,
  circleStatusBodySchema,
  circlesQuerySchema,
  createCenterBodySchema,
  createCircleBodySchema,
  orgBrandingUpdateBodySchema,
  orgEntityIdParamSchema,
  updateCenterBodySchema,
  updateCircleBodySchema
} from "./org.validation";

const orgRouter = Router();

orgRouter.use(authGuard, attachScope);

export const centerReadRoles = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.FINANCE_MANAGER
];

orgRouter.get(
  "/branding",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  orgController.getBranding
);

orgRouter.patch(
  "/branding",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(orgBrandingUpdateBodySchema),
  orgController.updateBranding
);

orgRouter.post(
  "/centers",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(createCenterBodySchema),
  orgController.createCenter
);

orgRouter.get(
  "/centers",
  requireRoles(centerReadRoles),
  validateQuery(centersQuerySchema),
  verifyScope("center", "query", "centerId"),
  orgController.listCenters
);

orgRouter.patch(
  "/centers/:id",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(orgEntityIdParamSchema),
  validateBody(updateCenterBodySchema),
  orgController.updateCenter
);

orgRouter.patch(
  "/centers/:id/status",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(orgEntityIdParamSchema),
  validateBody(centerStatusBodySchema),
  orgController.updateCenterStatus
);

orgRouter.post(
  "/circles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createCircleBodySchema),
  verifyScope("center", "body", "centerId"),
  orgController.createCircle
);

orgRouter.get(
  "/circles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(circlesQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  orgController.listCircles
);

orgRouter.patch(
  "/circles/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(orgEntityIdParamSchema),
  verifyScope("circle", "params", "id"),
  validateBody(updateCircleBodySchema),
  orgController.updateCircle
);

orgRouter.patch(
  "/circles/:id/status",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(orgEntityIdParamSchema),
  verifyScope("circle", "params", "id"),
  validateBody(circleStatusBodySchema),
  orgController.updateCircleStatus
);

export default orgRouter;
