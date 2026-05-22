import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { gradeScalesController } from "./grade-scales.controller";
import { gradeScaleBodySchema } from "./grade-scales.validation";

const gradeScalesRouter = Router();

gradeScalesRouter.use(authGuard, attachScope);

const ADMIN_ROLES = [Role.SUPER_ADMIN];

gradeScalesRouter.get(
  "/",
  requireRoles(ADMIN_ROLES),
  gradeScalesController.listAll
);

gradeScalesRouter.get(
  "/active",
  requireRoles(ADMIN_ROLES),
  gradeScalesController.listActive
);

gradeScalesRouter.post(
  "/",
  requireRoles(ADMIN_ROLES),
  validateBody(gradeScaleBodySchema),
  gradeScalesController.create
);

gradeScalesRouter.put(
  "/:id",
  requireRoles(ADMIN_ROLES),
  validateBody(gradeScaleBodySchema),
  gradeScalesController.update
);

gradeScalesRouter.delete(
  "/:id",
  requireRoles(ADMIN_ROLES),
  gradeScalesController.delete
);

export default gradeScalesRouter;
