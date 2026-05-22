import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { quranController } from "./quran.controller";
import { calculateQuranRangeBodySchema, previewQuranRangeBodySchema } from "./quran.validation";

const quranRouter = Router();

quranRouter.use(authGuard, attachScope);

quranRouter.post(
  "/quran/range/calculate",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateBody(calculateQuranRangeBodySchema),
  quranController.calculateRange
);

quranRouter.post(
  "/quran/range/preview",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateBody(previewQuranRangeBodySchema),
  quranController.previewRange
);

export default quranRouter;
