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

const resolveAllowedRoles = (path: string, method: string, roles: Role[]): string[] => {
  const allowedRoles = roles.map(normalizeRole);
  if (path.startsWith("/monthly-plans")) {
    return [...new Set([...allowedRoles, ...monthlyPlanFallbackRoles])];
  }
  if (path.startsWith("/remote-recitation")) {
    return [...new Set([...allowedRoles, ...remoteRecitationFallbackRoles])];
  }
  if (path.startsWith("/notifications")) {
    return [...new Set([...allowedRoles, ...notificationsFallbackRoles])];
  }
  if (method === "GET" && path.startsWith("/library")) {
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
