import { type RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "../errors/app-error";

export const validateBody = (schema: ZodTypeAny): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const error = parsed.error.issues[0];
      const field = error?.path.join(".") || "body";
      const message = error ? `${field}: ${error.message}` : "Invalid request body";
      
      console.error("[Validation Error]", JSON.stringify(parsed.error.flatten(), null, 2));
      next(new AppError(message, 400, parsed.error.flatten()));
      return;
    }

    req.body = parsed.data;
    res.locals.validatedBody = parsed.data;
    next();
  };
};

export const validateQuery = (schema: ZodTypeAny): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
      const error = parsed.error.issues[0];
      const field = error?.path.join(".") || "query";
      const message = error ? `${field}: ${error.message}` : "Invalid query params";
      
      next(new AppError(message, 400, parsed.error.flatten()));
      return;
    }

    res.locals.validatedQuery = parsed.data;
    next();
  };
};

export const validateParams = (schema: ZodTypeAny): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);

    if (!parsed.success) {
      const error = parsed.error.issues[0];
      const field = error?.path.join(".") || "params";
      const message = error ? `${field}: ${error.message}` : "Invalid route params";
      
      next(new AppError(message, 400, parsed.error.flatten()));
      return;
    }

    res.locals.validatedParams = parsed.data;
    next();
  };
};
