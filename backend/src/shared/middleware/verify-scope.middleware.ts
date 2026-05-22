import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../scoping/scope.domain";

type ScopeType = "center" | "circle";
type ScopeSource = "params" | "query" | "body";

/**
 * Universal Scope Verification Middleware
 * -----------------------------------------
 * Verifies that the requested ID (Center or Circle) is within the user's allowed scope.
 * It fails fast with a 403 Forbidden before reaching the controller.
 */
export const verifyScope = (
  type: ScopeType,
  source: ScopeSource = "params",
  fieldName: string = "id"
): RequestHandler => {
  return (req, _res, next) => {
    if (!req.scope) {
      next(new AppError("Scope not resolved. Ensure attachScope is used before verifyScope.", 500));
      return;
    }

    const dataSource = req[source];
    const idValue = dataSource ? dataSource[fieldName] : undefined;

    if (idValue === undefined || idValue === null) {
      // If the field is missing, we bypass verifyScope. 
      // Individual validation (Zod) should have caught this if it was required.
      next();
      return;
    }

    const id = parseInt(String(idValue), 10);

    if (isNaN(id)) {
      next(new AppError(`Invalid ${fieldName} for scope verification`, 400));
      return;
    }

    try {
      if (type === "center") {
        ensureCenterAllowed(req.scope, id);
      } else if (type === "circle") {
        ensureCircleAllowed(req.scope, id);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
