import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { mediaController } from "./media.controller";
import { uploadMediaImage } from "./media.upload";
import { uploadMediaImageBodySchema } from "./media.validation";

const mediaRouter = Router();

mediaRouter.use("/media", authGuard);

mediaRouter.post(
  "/media/images",
  requireRoles([
    Role.SUPER_ADMIN,
    Role.CENTER_ADMIN,
    Role.SUPERVISOR,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT
  ]),
  uploadMediaImage,
  validateBody(uploadMediaImageBodySchema),
  mediaController.uploadImage
);

export default mediaRouter;

