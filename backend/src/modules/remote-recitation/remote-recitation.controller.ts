import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import {
  remoteRecitationService,
  type CompleteRemoteRecitationBookingInput,
  type CreateRemoteRecitationBookingInput,
  type CreateRemoteRecitationSlotInput,
  type ListRemoteRecitationBookingsInput,
  type ListRemoteRecitationSlotsInput,
  type RemoteRecitationBookingCancelInput,
  type RemoteRecitationBookingDecisionInput,
  type RemoteRecitationSettingsInput,
  type UpdateRemoteRecitationSlotInput
} from "./remote-recitation.service";

const ensureScope = (scope: ScopeContext | undefined): ScopeContext => {
  if (!scope) {
    throw new AppError("Scope not resolved", 500);
  }

  return scope;
};

export const remoteRecitationController = {
  getSettings: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const query = res.locals.validatedQuery as { circleId: number };
      const data = await remoteRecitationService.getSettings(scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  upsertSettings: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const input = req.body as RemoteRecitationSettingsInput;
      const data = await remoteRecitationService.upsertSettings(scope, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listSlots: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const query = res.locals.validatedQuery as ListRemoteRecitationSlotsInput;
      const data = await remoteRecitationService.listSlots(scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createSlot: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const input = req.body as CreateRemoteRecitationSlotInput;
      const data = await remoteRecitationService.createSlot(scope, input);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateSlot: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const params = res.locals.validatedParams as { id: number };
      const input = req.body as UpdateRemoteRecitationSlotInput;
      const data = await remoteRecitationService.updateSlot(scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  deleteSlot: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const params = res.locals.validatedParams as { id: number };
      const query = res.locals.validatedQuery as { lockVersion?: number };
      const data = await remoteRecitationService.deleteSlot(scope, params.id, query.lockVersion);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listBookings: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const query = res.locals.validatedQuery as ListRemoteRecitationBookingsInput;
      const data = await remoteRecitationService.listBookings(scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createBooking: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const input = req.body as CreateRemoteRecitationBookingInput;
      const data = await remoteRecitationService.createBooking(scope, input);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveBooking: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const params = res.locals.validatedParams as { id: number };
      const input = req.body as RemoteRecitationBookingDecisionInput;
      const data = await remoteRecitationService.approveBooking(scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  rejectBooking: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const params = res.locals.validatedParams as { id: number };
      const input = req.body as RemoteRecitationBookingDecisionInput;
      const data = await remoteRecitationService.rejectBooking(scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  cancelBooking: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const params = res.locals.validatedParams as { id: number };
      const input = req.body as RemoteRecitationBookingCancelInput;
      const data = await remoteRecitationService.cancelBooking(scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  completeBooking: (async (req, res, next) => {
    try {
      const scope = ensureScope(req.scope);
      const params = res.locals.validatedParams as { id: number };
      const input = req.body as CompleteRemoteRecitationBookingInput;
      const data = await remoteRecitationService.completeBooking(scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
