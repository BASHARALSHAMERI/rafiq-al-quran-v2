import type { Role } from "../features/auth/types";

export const getRoleLandingPath = (role: Role): string => {
  if (role === "PARENT") return "/parent/home";
  if (role === "STUDENT") return "/student/home";
  // [PLATFORM POLICY] TEACHER and SUPERVISOR are Mobile-only roles.
  // They cannot log into the web (blocked at auth layer: AUTH_FORBIDDEN_PLATFORM).
  // This fallback to /dashboard is intentional: if a mobile-only role somehow
  // reaches this function, the RequireRole guard will redirect them to /403.
  return "/dashboard";
};
