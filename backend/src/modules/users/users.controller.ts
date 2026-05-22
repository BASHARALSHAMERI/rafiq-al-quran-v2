import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { usersService } from "./users.service";

export const usersController = {
  listUsers: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as {
        role?: import("@prisma/client").Role;
        centerId?: number;
        circleId?: number;
      };
      const users = await usersService.listUsers(req.scope, query);

      res.json({ ok: true, data: users });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getUserById: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const user = await usersService.getUserById(req.scope, params.id);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getStudentProfile: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);

      const params = res.locals.validatedParams as { id: number };
      const profile = await usersService.getStudentProfile(req.scope, params.id);
      
      res.json({ ok: true, data: profile });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createUser: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const user = await usersService.createUser(req.scope, req.body);
      res.status(201).json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateUser: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const user = await usersService.updateUser(req.scope, params.id, req.body);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateUserStatus: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const user = await usersService.updateUserStatus(req.scope, params.id, req.body);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  deleteUser: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      await usersService.deleteUser(req.scope, params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  addCenterAccess: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const user = await usersService.addCenterAccess(req.scope, params.id, req.body);
      res.status(201).json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  removeCenterAccess: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number; centerId: number };
      const user = await usersService.removeCenterAccess(req.scope, params.id, params.centerId);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  addCircleAccess: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const user = await usersService.addCircleAccess(req.scope, params.id, req.body);
      res.status(201).json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  removeCircleAccess: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number; circleId: number };
      const user = await usersService.removeCircleAccess(req.scope, params.id, params.circleId);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  addParentStudentLink: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const user = await usersService.addParentStudentLink(req.scope, params.id, req.body);
      res.status(201).json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  removeParentStudentLink: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number; studentId: number };
      const user = await usersService.removeParentStudentLink(req.scope, params.id, params.studentId);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  addStudentEnrollment: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const user = await usersService.addStudentEnrollment(req.scope, params.id, req.body);
      res.status(201).json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  removeStudentEnrollment: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number; circleId: number };
      const user = await usersService.removeStudentEnrollment(req.scope, params.id, params.circleId);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  resendActivation: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);

      const params = res.locals.validatedParams as { id: number };
      const result = await usersService.resendActivation(req.scope, params.id);
      
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
