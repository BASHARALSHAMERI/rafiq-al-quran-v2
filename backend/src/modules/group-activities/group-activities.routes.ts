import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateQuery } from "../../shared/middleware/validate.middleware";
import { groupActivitiesController } from "./group-activities.controller";
import {
  createGroupActivitySchema,
  listGroupActivitiesSchema
} from "./group-activities.validation";

const groupActivitiesRouter = Router();

groupActivitiesRouter.use(
  authGuard,
  attachScope,
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER])
);

groupActivitiesRouter.get(
  "/group-activities",
  validateQuery(listGroupActivitiesSchema),
  groupActivitiesController.list
);

groupActivitiesRouter.post(
  "/group-activities",
  validateBody(createGroupActivitySchema),
  groupActivitiesController.create
);

groupActivitiesRouter.get("/group-activities/:id", groupActivitiesController.getById);

export default groupActivitiesRouter;
