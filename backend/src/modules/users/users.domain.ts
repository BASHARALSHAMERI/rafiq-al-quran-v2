import { Role } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import { assertRoleChangeAllowed } from "./users.linking.rules";

const unique = (values: number[]): number[] => [...new Set(values)];

const CENTER_ADMIN_MANAGED_ROLES = new Set<Role>([
  Role.PARENT,
  Role.STUDENT
]);

export const usersDomain = {
  assertScopeFilter(scope: ScopeContext, filters: { centerId?: number; circleId?: number }) {
    if (filters.centerId) {
      ensureCenterAllowed(scope, filters.centerId);
    }

    if (filters.circleId) {
      ensureCircleAllowed(scope, filters.circleId);
    }
  },

  resolveSelfScopedUserIds(scope: ScopeContext): number[] | null {
    if (scope.role === Role.PARENT) {
      return unique([scope.userId, ...scope.studentIds]);
    }

    if (scope.role === Role.STUDENT) {
      return [scope.userId];
    }

    return null;
  },

  uniqueIds(values: number[]): number[] {
    return unique(values);
  },

  assertCanManageUsers(scope: ScopeContext) {
    if (scope.role !== Role.SUPER_ADMIN && scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Forbidden", 403);
    }
  },

  assertRoleCreatable(scope: ScopeContext, requestedRole: Role) {
    this.assertCanManageUsers(scope);

    if (scope.role === Role.SUPER_ADMIN) {
      return;
    }

    if (!CENTER_ADMIN_MANAGED_ROLES.has(requestedRole)) {
      throw new AppError("Forbidden", 403);
    }
  },

  assertRoleManageable(scope: ScopeContext, targetRole: Role) {
    this.assertCanManageUsers(scope);

    if (scope.role === Role.SUPER_ADMIN) {
      return;
    }

    if (!CENTER_ADMIN_MANAGED_ROLES.has(targetRole)) {
      throw new AppError("Forbidden", 403);
    }
  },

  assertCenterAllowedForManagement(scope: ScopeContext, centerId: number) {
    this.assertCanManageUsers(scope);
    ensureCenterAllowed(scope, centerId);
  },

  assertCircleAllowedForManagement(scope: ScopeContext, circleId: number) {
    this.assertCanManageUsers(scope);
    ensureCircleAllowed(scope, circleId);
  },

  assertRoleImmutable(currentRole: Role, requestedRole: Role) {
    assertRoleChangeAllowed(currentRole, requestedRole);
  },

  assertCanToggleUserStatus(input: {
    actorUserId: number;
    targetUserId: number;
    nextIsActive: boolean;
    targetRole: Role;
    activeSuperAdminsCount: number;
    currentIsActive: boolean;
  }) {
    if (
      !input.nextIsActive &&
      input.currentIsActive &&
      input.targetRole === Role.SUPER_ADMIN &&
      input.activeSuperAdminsCount <= 1
    ) {
      throw new AppError(
        "Cannot disable the last active super admin",
        409,
        undefined,
        "LAST_SUPER_ADMIN_FORBIDDEN"
      );
    }

    if (!input.nextIsActive && input.actorUserId === input.targetUserId) {
      throw new AppError("Cannot disable your own account", 400, undefined, "SELF_DISABLE_FORBIDDEN");
    }
  },

  assertCenterAccessLinkAllowed(targetRole: Role) {
    if (
      targetRole !== Role.CENTER_ADMIN &&
      targetRole !== Role.SUPERVISOR &&
      targetRole !== Role.TEACHER
    ) {
      throw new AppError(
        "Center access link is only allowed for center admin, supervisor, or teacher",
        400
      );
    }
  },

  assertCircleAccessLinkAllowed(targetRole: Role) {
    if (targetRole !== Role.SUPERVISOR && targetRole !== Role.TEACHER) {
      throw new AppError("Circle access link is only allowed for supervisor or teacher", 400);
    }
  },

  assertParentLinkAllowed(targetRole: Role, studentRole: Role) {
    if (targetRole !== Role.PARENT) {
      throw new AppError("Target user is not a parent", 400);
    }

    if (studentRole !== Role.STUDENT) {
      throw new AppError("Linked user is not a student", 400);
    }
  },

  assertEnrollmentLinkAllowed(targetRole: Role) {
    if (targetRole !== Role.STUDENT) {
      throw new AppError("Target user is not a student", 400);
    }
  }
};
