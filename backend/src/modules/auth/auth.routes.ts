import { Router, type RequestHandler } from "express";
import { authController } from "./auth.controller";
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  refreshBodySchema,
  resetPasswordBodySchema,
  checkUserBodySchema,
  setupPasswordBodySchema,
  validateActivationTokenBodySchema,
  activateAccountBodySchema
} from "./auth.validation";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { AppError } from "../../shared/errors/app-error";

const authRouter = Router();

// [FIX] CSRF Protection Middleware
const csrfProtection: RequestHandler = (req, _res, next) => {
  const xRequestedWith = req.headers["x-requested-with"];

  if (!xRequestedWith || xRequestedWith !== "XMLHttpRequest") {
    next(
      new AppError(
        "CSRF check failed: missing or invalid X-Requested-With header",
        403,
        undefined,
        "CSRF_MISMATCH"
      )
    );
    return;
  }

  next();
};

authRouter.post("/check-user", validateBody(checkUserBodySchema), authController.checkUser);
authRouter.post("/setup-password", validateBody(setupPasswordBodySchema), authController.setupPassword);
authRouter.post("/login", validateBody(loginBodySchema), authController.login);
authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordBodySchema),
  authController.forgotPassword
);
authRouter.post("/reset-password", validateBody(resetPasswordBodySchema), authController.resetPassword);

authRouter.post(
  "/activation/validate",
  validateBody(validateActivationTokenBodySchema),
  authController.validateActivationToken
);
authRouter.post(
  "/activation/activate",
  validateBody(activateAccountBodySchema),
  authController.activateAccount
);

// [FIX] تطبيق CSRF protection على refresh — هذا هو المسار الوحيد الذي يستقبل
// الـ refresh token من Cookie وينتج access token جديد؛ حمايته أمر حيوي.
authRouter.post(
  "/refresh",
  csrfProtection,
  validateBody(refreshBodySchema),
  authController.refresh
);

authRouter.post("/logout", validateBody(refreshBodySchema), authController.logout);
authRouter.get("/me", authGuard, authController.me);

export default authRouter;
