import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error";
import { scopeService } from "../scoping/scope.service";

export const attachScope: RequestHandler = async (req, _res, next) => {
  if (!req.auth) {
    next(new AppError("Authentication required before scope resolution", 401));
    return;
  }

  try {
    req.scope = await scopeService.resolveScope(req.auth);
    next();
  } catch (error) {
    next(error);
  }
};