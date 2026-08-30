import type { Role } from "../auth/types";

const CENTER_READ_ROLES: Role[] = ["SUPER_ADMIN", "CENTER_ADMIN", "SUPERVISOR", "FINANCE_MANAGER"];
const CIRCLE_READ_ROLES: Role[] = ["SUPER_ADMIN", "CENTER_ADMIN", "SUPERVISOR", "TEACHER"];

export const canReadCenters = (role?: Role | null): boolean => {
  return role ? CENTER_READ_ROLES.includes(role) : false;
};

export const canReadCircles = (role?: Role | null): boolean => {
  return role ? CIRCLE_READ_ROLES.includes(role) : false;
};
