import { Role } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";

export const LINK_MANAGED_ROLES = new Set<Role>([
  Role.CENTER_ADMIN,
  Role.SUPER_ADMIN
]);

export const ROLE_IMMUTABLE_AFTER_CREATE = true;
export const UNLINK_MODE = "DELETE_WITH_AUDIT" as const;

export const assertRoleChangeAllowed = (
  currentRole: Role,
  requestedRole: Role
): void => {
  if (!ROLE_IMMUTABLE_AFTER_CREATE) {
    return;
  }

  if (currentRole !== requestedRole) {
    throw new AppError("Role change is not allowed in this phase", 400, undefined, "ROLE_CHANGE_FORBIDDEN");
  }
};
