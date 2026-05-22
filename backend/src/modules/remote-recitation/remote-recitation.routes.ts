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
import { remoteRecitationController } from "./remote-recitation.controller";
import {
  completeRemoteRecitationBookingBodySchema,
  createRemoteRecitationBookingBodySchema,
  createRemoteRecitationSlotBodySchema,
  listRemoteRecitationBookingsQuerySchema,
  listRemoteRecitationSlotsQuerySchema,
  remoteRecitationBookingCancelBodySchema,
  remoteRecitationBookingDecisionBodySchema,
  remoteRecitationBookingIdParamSchema,
  remoteRecitationCircleQuerySchema,
  remoteRecitationDeleteSlotQuerySchema,
  remoteRecitationSlotIdParamSchema,
  updateRemoteRecitationSlotBodySchema,
  upsertRemoteRecitationSettingsBodySchema
} from "./remote-recitation.validation";

const remoteRecitationRouter = Router();

remoteRecitationRouter.use(authGuard, attachScope);

remoteRecitationRouter.get(
  "/remote-recitation/settings",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(remoteRecitationCircleQuerySchema),
  remoteRecitationController.getSettings
);

remoteRecitationRouter.put(
  "/remote-recitation/settings",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateBody(upsertRemoteRecitationSettingsBodySchema),
  remoteRecitationController.upsertSettings
);

remoteRecitationRouter.get(
  "/remote-recitation/slots",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.STUDENT]),
  validateQuery(listRemoteRecitationSlotsQuerySchema),
  remoteRecitationController.listSlots
);

remoteRecitationRouter.post(
  "/remote-recitation/slots",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateBody(createRemoteRecitationSlotBodySchema),
  remoteRecitationController.createSlot
);

remoteRecitationRouter.patch(
  "/remote-recitation/slots/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(remoteRecitationSlotIdParamSchema),
  validateBody(updateRemoteRecitationSlotBodySchema),
  remoteRecitationController.updateSlot
);

remoteRecitationRouter.delete(
  "/remote-recitation/slots/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(remoteRecitationSlotIdParamSchema),
  validateQuery(remoteRecitationDeleteSlotQuerySchema),
  remoteRecitationController.deleteSlot
);

remoteRecitationRouter.get(
  "/remote-recitation/bookings",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.STUDENT]),
  validateQuery(listRemoteRecitationBookingsQuerySchema),
  remoteRecitationController.listBookings
);

remoteRecitationRouter.post(
  "/remote-recitation/bookings",
  requireRoles([Role.STUDENT]),
  validateBody(createRemoteRecitationBookingBodySchema),
  remoteRecitationController.createBooking
);

remoteRecitationRouter.patch(
  "/remote-recitation/bookings/:id/approve",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(remoteRecitationBookingIdParamSchema),
  validateBody(remoteRecitationBookingDecisionBodySchema),
  remoteRecitationController.approveBooking
);

remoteRecitationRouter.patch(
  "/remote-recitation/bookings/:id/reject",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(remoteRecitationBookingIdParamSchema),
  validateBody(remoteRecitationBookingDecisionBodySchema),
  remoteRecitationController.rejectBooking
);

remoteRecitationRouter.patch(
  "/remote-recitation/bookings/:id/cancel",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.STUDENT]),
  validateParams(remoteRecitationBookingIdParamSchema),
  validateBody(remoteRecitationBookingCancelBodySchema),
  remoteRecitationController.cancelBooking
);

remoteRecitationRouter.post(
  "/remote-recitation/bookings/:id/complete",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(remoteRecitationBookingIdParamSchema),
  validateBody(completeRemoteRecitationBookingBodySchema),
  remoteRecitationController.completeBooking
);

export default remoteRecitationRouter;
