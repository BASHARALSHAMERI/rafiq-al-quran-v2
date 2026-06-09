import type { Role } from "../features/auth/types";

export const getRoleLandingPath = (role: Role): string => {
  if (role === "ACCOUNTANT" || role === "FINANCE_MANAGER" || role === "AUDITOR") {
    return "/finance/invoices";
  }
  if (role === "TREASURER") return "/finance/treasury";
  if (role === "PARENT" || role === "STUDENT" || role === "TEACHER" || role === "SUPERVISOR") {
    return "/403";
  }
  // [PLATFORM POLICY] TEACHER and SUPERVISOR are Mobile-only roles.
  // They cannot log into the web (blocked at auth layer: AUTH_FORBIDDEN_PLATFORM).
  // This fallback to /dashboard is intentional: if a mobile-only role somehow
  // reaches this function, the RequireRole guard will redirect them to /403.
  return "/dashboard";
};
