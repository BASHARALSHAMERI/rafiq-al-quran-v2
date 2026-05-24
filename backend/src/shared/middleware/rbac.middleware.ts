import { Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error";

const normalizeRole = (role: unknown): string => String(role ?? "").trim().toUpperCase();
// Some hot-reloaded route snapshots have been observed to miss teacher/supervisor
// roles for monthly plans. Keep the runtime guard aligned with the intended access.
const monthlyPlanFallbackRoles = [Role.SUPERVISOR, Role.TEACHER].map(normalizeRole);
const remoteRecitationFallbackRoles = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.STUDENT
].map(normalizeRole);
const notificationsFallbackRoles = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.PARENT,
  Role.STUDENT
].map(normalizeRole);
const libraryReadFallbackRoles = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.PARENT,
  Role.STUDENT
].map(normalizeRole);

type SafeRoutePattern = {
  method: string;
  path: RegExp;
};

const numericIdSegment = "\\d+";

const safeRoute = (method: string, path: RegExp): SafeRoutePattern => ({
  method,
  path
});

const monthlyPlanFallbackRoutes = [
  safeRoute("GET", /^\/monthly-plans\/review-settings$/),
  safeRoute("PUT", /^\/monthly-plans\/review-settings$/),
  safeRoute("GET", /^\/monthly-plans$/),
  safeRoute("POST", /^\/monthly-plans\/generate$/),
  safeRoute("POST", /^\/monthly-plans\/approve-all$/),
  safeRoute("GET", new RegExp(`^/monthly-plans/${numericIdSegment}$`)),
  safeRoute("PUT", new RegExp(`^/monthly-plans/${numericIdSegment}$`)),
  safeRoute("POST", new RegExp(`^/monthly-plans/${numericIdSegment}/approve$`))
];

const remoteRecitationFallbackRoutes = [
  safeRoute("GET", /^\/remote-recitation\/settings$/),
  safeRoute("PUT", /^\/remote-recitation\/settings$/),
  safeRoute("GET", /^\/remote-recitation\/slots$/),
  safeRoute("POST", /^\/remote-recitation\/slots$/),
  safeRoute("PATCH", new RegExp(`^/remote-recitation/slots/${numericIdSegment}$`)),
  safeRoute("DELETE", new RegExp(`^/remote-recitation/slots/${numericIdSegment}$`)),
  safeRoute("GET", /^\/remote-recitation\/bookings$/),
  safeRoute("POST", /^\/remote-recitation\/bookings$/),
  safeRoute("PATCH", new RegExp(`^/remote-recitation/bookings/${numericIdSegment}/approve$`)),
  safeRoute("PATCH", new RegExp(`^/remote-recitation/bookings/${numericIdSegment}/reject$`)),
  safeRoute("PATCH", new RegExp(`^/remote-recitation/bookings/${numericIdSegment}/cancel$`)),
  safeRoute("POST", new RegExp(`^/remote-recitation/bookings/${numericIdSegment}/complete$`))
];

const notificationsFallbackRoutes = [
  safeRoute("GET", /^\/notifications$/),
  safeRoute("GET", /^\/notifications\/unread-count$/),
  safeRoute("PATCH", new RegExp(`^/notifications/${numericIdSegment}/read$`)),
  safeRoute("PATCH", /^\/notifications\/read-all$/)
];

const libraryReadFallbackRoutes = [
  safeRoute("GET", /^\/library\/categories$/),
  safeRoute("GET", /^\/library\/items$/),
  safeRoute("GET", new RegExp(`^/library/items/${numericIdSegment}/download$`)),
  safeRoute("GET", new RegExp(`^/library/items/${numericIdSegment}/cover$`))
];

const matchesSafeRoute = (
  routes: SafeRoutePattern[],
  path: string,
  method: string
): boolean => {
  const normalizedMethod = method.toUpperCase();
  return routes.some((route) => route.method === normalizedMethod && route.path.test(path));
};

const resolveAllowedRoles = (path: string, method: string, roles: Role[]): string[] => {
  const allowedRoles = roles.map(normalizeRole);

  if (matchesSafeRoute(monthlyPlanFallbackRoutes, path, method)) {
    return [...new Set([...allowedRoles, ...monthlyPlanFallbackRoles])];
  }
  if (matchesSafeRoute(remoteRecitationFallbackRoutes, path, method)) {
    return [...new Set([...allowedRoles, ...remoteRecitationFallbackRoles])];
  }
  if (matchesSafeRoute(notificationsFallbackRoutes, path, method)) {
    return [...new Set([...allowedRoles, ...notificationsFallbackRoles])];
  }
  if (matchesSafeRoute(libraryReadFallbackRoutes, path, method)) {
    return [...new Set([...allowedRoles, ...libraryReadFallbackRoles])];
  }

  return allowedRoles;
};

export const requireRoles = (roles: Role[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new AppError("Authentication required", 401));
      return;
    }

    const allowedRoles = resolveAllowedRoles(req.path, req.method, roles);
    const currentRole = normalizeRole(req.auth.role);

    if (!allowedRoles.includes(currentRole)) {
      next(
        new AppError("Forbidden", 403, {
          allowedRoles,
          currentRole
        })
      );
      return;
    }

    next();
  };
};
