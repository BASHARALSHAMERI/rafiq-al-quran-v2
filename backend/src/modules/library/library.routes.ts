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
import { libraryController } from "./library.controller";
import { uploadLibraryFile } from "./library.upload";
import {
  createLibraryCategoryBodySchema,
  createLibraryItemBodySchema,
  libraryItemIdParamSchema,
  listLibraryCategoriesQuerySchema,
  listLibraryItemsQuerySchema,
  updateLibraryItemBodySchema
} from "./library.validation";

const libraryRouter = Router();

libraryRouter.use(authGuard, attachScope);

libraryRouter.get(
  "/library/categories",
  validateQuery(listLibraryCategoriesQuerySchema),
  libraryController.listCategories
);

libraryRouter.post(
  "/library/categories",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateBody(createLibraryCategoryBodySchema),
  libraryController.createCategory
);

libraryRouter.get(
  "/library/items",
  validateQuery(listLibraryItemsQuerySchema),
  libraryController.listItems
);

libraryRouter.post(
  "/library/items",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  uploadLibraryFile,
  validateBody(createLibraryItemBodySchema),
  libraryController.createItem
);

libraryRouter.get(
  "/library/items/:id/download",
  validateParams(libraryItemIdParamSchema),
  libraryController.downloadItem
);

libraryRouter.get(
  "/library/items/:id/cover",
  validateParams(libraryItemIdParamSchema),
  libraryController.getItemCover
);

libraryRouter.patch(
  "/library/items/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(libraryItemIdParamSchema),
  validateBody(updateLibraryItemBodySchema),
  libraryController.updateItem
);

libraryRouter.delete(
  "/library/items/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(libraryItemIdParamSchema),
  libraryController.archiveItem
);

export default libraryRouter;

