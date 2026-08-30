import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateParams, validateQuery } from "../../shared/middleware/validate.middleware";
import { matnCatalogsController } from "./matn-catalogs.controller";
import {
  createMatnSchema,
  listMatnQuerySchema,
  matnIdParamSchema,
  updateMatnSchema
} from "./matn-catalogs.validation";

const matnCatalogsRouter = Router();
const matnRoles = [Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER];

matnCatalogsRouter.use(authGuard, attachScope, requireRoles(matnRoles));

matnCatalogsRouter.get(
  "/matn-catalogs",
  validateQuery(listMatnQuerySchema),
  matnCatalogsController.list
);

matnCatalogsRouter.get(
  "/matn-catalogs/:id",
  validateParams(matnIdParamSchema),
  matnCatalogsController.getById
);

matnCatalogsRouter.post(
  "/matn-catalogs",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createMatnSchema),
  matnCatalogsController.create
);

matnCatalogsRouter.patch(
  "/matn-catalogs/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(matnIdParamSchema),
  validateBody(updateMatnSchema),
  matnCatalogsController.update
);

matnCatalogsRouter.delete(
  "/matn-catalogs/:id",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(matnIdParamSchema),
  matnCatalogsController.remove
);

export default matnCatalogsRouter;
