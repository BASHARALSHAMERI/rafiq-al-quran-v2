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
import { usersController } from "./users.controller";
import {
  createParentStudentLinkBodySchema,
  createStudentEnrollmentBodySchema,
  createUserBodySchema,
  createUserCenterAccessBodySchema,
  createUserCircleAccessBodySchema,
  updateUserBodySchema,
  updateUserStatusBodySchema,
  userCenterLinkParamsSchema,
  userCircleLinkParamsSchema,
  userIdParamSchema,
  usersQuerySchema,
  userStudentLinkParamsSchema
} from "./users.validation";

const usersRouter = Router();

usersRouter.use(authGuard, attachScope);

usersRouter.post(
  "/",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createUserBodySchema),
  usersController.createUser
);

usersRouter.get(
  "/",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(usersQuerySchema),
  usersController.listUsers
);

usersRouter.get(
  "/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.PARENT, Role.STUDENT]),
  validateParams(userIdParamSchema),
  usersController.getUserById
);

usersRouter.get(
  "/:id/student-profile",
  requireRoles([
    Role.SUPER_ADMIN,
    Role.CENTER_ADMIN,
    Role.SUPERVISOR,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT
  ]),
  validateParams(userIdParamSchema),
  usersController.getStudentProfile
);

usersRouter.patch(
  "/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userIdParamSchema),
  validateBody(updateUserBodySchema),
  usersController.updateUser
);

usersRouter.patch(
  "/:id/status",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userIdParamSchema),
  validateBody(updateUserStatusBodySchema),
  usersController.updateUserStatus
);

usersRouter.delete(
  "/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userIdParamSchema),
  usersController.deleteUser
);

usersRouter.post(
  "/:id/center-access",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userIdParamSchema),
  validateBody(createUserCenterAccessBodySchema),
  verifyScope("center", "body", "centerId"),
  usersController.addCenterAccess
);

usersRouter.delete(
  "/:id/center-access/:centerId",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userCenterLinkParamsSchema),
  verifyScope("center", "params", "centerId"),
  usersController.removeCenterAccess
);

usersRouter.post(
  "/:id/circle-access",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userIdParamSchema),
  validateBody(createUserCircleAccessBodySchema),
  verifyScope("circle", "body", "circleId"),
  usersController.addCircleAccess
);

usersRouter.delete(
  "/:id/circle-access/:circleId",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userCircleLinkParamsSchema),
  verifyScope("circle", "params", "circleId"),
  usersController.removeCircleAccess
);

usersRouter.post(
  "/:id/parent-links",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userIdParamSchema),
  validateBody(createParentStudentLinkBodySchema),
  usersController.addParentStudentLink
);

usersRouter.delete(
  "/:id/parent-links/:studentId",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userStudentLinkParamsSchema),
  usersController.removeParentStudentLink
);

usersRouter.post(
  "/:id/enrollments",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userIdParamSchema),
  validateBody(createStudentEnrollmentBodySchema),
  verifyScope("circle", "body", "circleId"),
  usersController.addStudentEnrollment
);

usersRouter.delete(
  "/:id/enrollments/:circleId",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userCircleLinkParamsSchema),
  verifyScope("circle", "params", "circleId"),
  usersController.removeStudentEnrollment
);

usersRouter.post(
  "/:id/activation/resend",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(userIdParamSchema),
  usersController.resendActivation
);

export default usersRouter;
