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
const FINANCE_VISIBLE_USER_ROLES = new Set<Role>([
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.STUDENT
]);

export const usersDomain = {
  assertFinanceUserReadFilter(scope: ScopeContext, role?: Role) {
    if (scope.role !== Role.FINANCE_MANAGER) {
      return;
    }

    if (!role || !FINANCE_VISIBLE_USER_ROLES.has(role)) {
      throw new AppError(
        "يجب تحديد دور مستخدم مطلوب للعمل المالي.",
        403,
        { allowedRoles: [...FINANCE_VISIBLE_USER_ROLES] },
        "FINANCE_USER_READ_SCOPE_DENIED"
      );
    }
  },

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
      throw new AppError("ليس لديك الصلاحية لإدارة المستخدمين.", 403);
    }
  },

  assertRoleCreatable(scope: ScopeContext, requestedRole: Role) {
    this.assertCanManageUsers(scope);

    if (scope.role === Role.SUPER_ADMIN) {
      return;
    }

    if (!CENTER_ADMIN_MANAGED_ROLES.has(requestedRole)) {
      throw new AppError("لا يمكنك إنشاء مستخدم بهذا الدور.", 403);
    }
  },

  assertRoleManageable(scope: ScopeContext, targetRole: Role) {
    this.assertCanManageUsers(scope);

    if (scope.role === Role.SUPER_ADMIN) {
      return;
    }

    if (!CENTER_ADMIN_MANAGED_ROLES.has(targetRole)) {
      throw new AppError("لا يمكنك إدارة مستخدم بهذا الدور.", 403);
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
        "لا يمكن تعطيل آخر مشرف مفعل.",
        409,
        undefined,
        "LAST_SUPER_ADMIN_FORBIDDEN"
      );
    }

    if (!input.nextIsActive && input.actorUserId === input.targetUserId) {
      throw new AppError("لا يمكنك تعطيل حسابك الخاص.", 400, undefined, "SELF_DISABLE_FORBIDDEN");
    }
  },

  assertCenterAccessLinkAllowed(targetRole: Role) {
    if (
      targetRole !== Role.CENTER_ADMIN &&
      targetRole !== Role.SUPERVISOR &&
      targetRole !== Role.TEACHER
    ) {
      throw new AppError(
        "ربط المركز متاح فقط لمدير المركز أو المشرف أو المعلم.",
        400
      );
    }
  },

  assertCircleAccessLinkAllowed(targetRole: Role) {
    if (targetRole !== Role.SUPERVISOR && targetRole !== Role.TEACHER) {
      throw new AppError("ربط الحلقة متاح فقط للمشرف أو المعلم.", 400);
    }
  },

  assertParentLinkAllowed(targetRole: Role, studentRole: Role) {
    if (targetRole !== Role.PARENT) {
      throw new AppError("المستخدم المستهدف ليس ولي أمر.", 400);
    }

    if (studentRole !== Role.STUDENT) {
      throw new AppError("المستخدم المرتبط ليس طالباً.", 400);
    }
  },

  assertEnrollmentLinkAllowed(targetRole: Role) {
    if (targetRole !== Role.STUDENT) {
      throw new AppError("المستخدم المستهدف ليس طالباً.", 400);
    }
  }
};
