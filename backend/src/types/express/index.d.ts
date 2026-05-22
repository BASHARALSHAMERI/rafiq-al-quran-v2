import type { AuthUserContext, ScopeContext } from "../../shared/types/auth.types";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: AuthUserContext;
      scope?: ScopeContext;
    }
  }
}

export {};
