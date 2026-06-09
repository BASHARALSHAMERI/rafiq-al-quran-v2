import { Role } from "@prisma/client";
import { usersDomain } from "./users.domain";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";

describe("usersDomain", () => {
  const superAdminScope: ScopeContext = {
    userId: 1,
    role: Role.SUPER_ADMIN,
    organizationId: 1,
    allAccess: true,
    centerIds: [],
    circleIds: [],
    studentIds: [],
  };

  const centerAdminScope: ScopeContext = {
    userId: 2,
    role: Role.CENTER_ADMIN,
    organizationId: 1,
    allAccess: false,
    centerIds: [10],
    circleIds: [],
    studentIds: [],
  };

  const teacherScope: ScopeContext = {
    userId: 3,
    role: Role.TEACHER,
    organizationId: 1,
    allAccess: false,
    centerIds: [],
    circleIds: [20],
    studentIds: [],
  };

  const parentScope: ScopeContext = {
    userId: 4,
    role: Role.PARENT,
    organizationId: 1,
    allAccess: false,
    centerIds: [],
    circleIds: [],
    studentIds: [100, 101],
  };

  const studentScope: ScopeContext = {
    userId: 5,
    role: Role.STUDENT,
    organizationId: 1,
    allAccess: false,
    centerIds: [],
    circleIds: [],
    studentIds: [],
  };

  describe("assertCanManageUsers", () => {
    it("should allow SUPER_ADMIN", () => {
      expect(() => usersDomain.assertCanManageUsers(superAdminScope)).not.toThrow();
    });

    it("should allow CENTER_ADMIN", () => {
      expect(() => usersDomain.assertCanManageUsers(centerAdminScope)).not.toThrow();
    });

    it("should throw 403 for TEACHER", () => {
      expect(() => usersDomain.assertCanManageUsers(teacherScope)).toThrow(
        new AppError("ليس لديك الصلاحية لإدارة المستخدمين.", 403)
      );
    });

    it("should throw 403 for STUDENT", () => {
      expect(() => usersDomain.assertCanManageUsers(studentScope)).toThrow(
        new AppError("ليس لديك الصلاحية لإدارة المستخدمين.", 403)
      );
    });
  });

  describe("assertRoleCreatable", () => {
    it("should allow SUPER_ADMIN to create any role", () => {
      expect(() => usersDomain.assertRoleCreatable(superAdminScope, Role.SUPER_ADMIN)).not.toThrow();
      expect(() => usersDomain.assertRoleCreatable(superAdminScope, Role.TEACHER)).not.toThrow();
    });

    it("should allow CENTER_ADMIN to create PARENT", () => {
      expect(() => usersDomain.assertRoleCreatable(centerAdminScope, Role.PARENT)).not.toThrow();
    });

    it("should allow CENTER_ADMIN to create STUDENT", () => {
      expect(() => usersDomain.assertRoleCreatable(centerAdminScope, Role.STUDENT)).not.toThrow();
    });

    it("should throw 403 when CENTER_ADMIN creates TEACHER", () => {
      expect(() => usersDomain.assertRoleCreatable(centerAdminScope, Role.TEACHER)).toThrow(
        new AppError("لا يمكنك إنشاء مستخدم بهذا الدور.", 403)
      );
    });

    it("should throw 403 when CENTER_ADMIN creates SUPERVISOR", () => {
      expect(() => usersDomain.assertRoleCreatable(centerAdminScope, Role.SUPERVISOR)).toThrow(
        new AppError("لا يمكنك إنشاء مستخدم بهذا الدور.", 403)
      );
    });
  });

  describe("assertRoleManageable", () => {
    it("should allow SUPER_ADMIN to manage any role", () => {
      expect(() => usersDomain.assertRoleManageable(superAdminScope, Role.SUPER_ADMIN)).not.toThrow();
    });

    it("should allow CENTER_ADMIN to manage STUDENT", () => {
      expect(() => usersDomain.assertRoleManageable(centerAdminScope, Role.STUDENT)).not.toThrow();
    });

    it("should throw 403 when CENTER_ADMIN manages CENTER_ADMIN", () => {
      expect(() => usersDomain.assertRoleManageable(centerAdminScope, Role.CENTER_ADMIN)).toThrow(
        new AppError("لا يمكنك إدارة مستخدم بهذا الدور.", 403)
      );
    });
  });

  describe("resolveSelfScopedUserIds", () => {
    it("should return userId + studentIds for PARENT", () => {
      const result = usersDomain.resolveSelfScopedUserIds(parentScope);
      expect(result).toEqual([4, 100, 101]);
    });

    it("should return only userId for STUDENT", () => {
      const result = usersDomain.resolveSelfScopedUserIds(studentScope);
      expect(result).toEqual([5]);
    });

    it("should return null for TEACHER", () => {
      const result = usersDomain.resolveSelfScopedUserIds(teacherScope);
      expect(result).toBeNull();
    });

    it("should return null for SUPER_ADMIN", () => {
      const result = usersDomain.resolveSelfScopedUserIds(superAdminScope);
      expect(result).toBeNull();
    });
  });

  describe("uniqueIds", () => {
    it("should remove duplicates", () => {
      expect(usersDomain.uniqueIds([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    });

    it("should handle empty array", () => {
      expect(usersDomain.uniqueIds([])).toEqual([]);
    });
  });

  describe("assertCanToggleUserStatus", () => {
    it("should throw when disabling last active SUPER_ADMIN", () => {
      expect(() =>
        usersDomain.assertCanToggleUserStatus({
          actorUserId: 1,
          targetUserId: 2,
          nextIsActive: false,
          targetRole: Role.SUPER_ADMIN,
          activeSuperAdminsCount: 1,
          currentIsActive: true,
        })
      ).toThrow(new AppError("لا يمكن تعطيل آخر مشرف مفعل.", 409, undefined, "LAST_SUPER_ADMIN_FORBIDDEN"));
    });

    it("should allow disabling SUPER_ADMIN when more than one exists", () => {
      expect(() =>
        usersDomain.assertCanToggleUserStatus({
          actorUserId: 1,
          targetUserId: 2,
          nextIsActive: false,
          targetRole: Role.SUPER_ADMIN,
          activeSuperAdminsCount: 2,
          currentIsActive: true,
        })
      ).not.toThrow();
    });

    it("should throw when self-disabling", () => {
      expect(() =>
        usersDomain.assertCanToggleUserStatus({
          actorUserId: 5,
          targetUserId: 5,
          nextIsActive: false,
          targetRole: Role.TEACHER,
          activeSuperAdminsCount: 0,
          currentIsActive: true,
        })
      ).toThrow(new AppError("لا يمكنك تعطيل حسابك الخاص.", 400, undefined, "SELF_DISABLE_FORBIDDEN"));
    });

    it("should allow activating any user", () => {
      expect(() =>
        usersDomain.assertCanToggleUserStatus({
          actorUserId: 1,
          targetUserId: 2,
          nextIsActive: true,
          targetRole: Role.SUPER_ADMIN,
          activeSuperAdminsCount: 1,
          currentIsActive: false,
        })
      ).not.toThrow();
    });
  });

  describe("assertCenterAccessLinkAllowed", () => {
    it("should allow CENTER_ADMIN", () => {
      expect(() => usersDomain.assertCenterAccessLinkAllowed(Role.CENTER_ADMIN)).not.toThrow();
    });

    it("should allow SUPERVISOR", () => {
      expect(() => usersDomain.assertCenterAccessLinkAllowed(Role.SUPERVISOR)).not.toThrow();
    });

    it("should allow TEACHER", () => {
      expect(() => usersDomain.assertCenterAccessLinkAllowed(Role.TEACHER)).not.toThrow();
    });

    it("should throw for STUDENT", () => {
      expect(() => usersDomain.assertCenterAccessLinkAllowed(Role.STUDENT)).toThrow(
        new AppError("ربط المركز متاح فقط لمدير المركز أو المشرف أو المعلم.", 400)
      );
    });
  });

  describe("assertCircleAccessLinkAllowed", () => {
    it("should allow SUPERVISOR", () => {
      expect(() => usersDomain.assertCircleAccessLinkAllowed(Role.SUPERVISOR)).not.toThrow();
    });

    it("should throw for CENTER_ADMIN", () => {
      expect(() => usersDomain.assertCircleAccessLinkAllowed(Role.CENTER_ADMIN)).toThrow(
        new AppError("ربط الحلقة متاح فقط للمشرف أو المعلم.", 400)
      );
    });
  });

  describe("assertParentLinkAllowed", () => {
    it("should allow PARENT + STUDENT", () => {
      expect(() => usersDomain.assertParentLinkAllowed(Role.PARENT, Role.STUDENT)).not.toThrow();
    });

    it("should throw when target is not PARENT", () => {
      expect(() => usersDomain.assertParentLinkAllowed(Role.TEACHER, Role.STUDENT)).toThrow(
        new AppError("المستخدم المستهدف ليس ولي أمر.", 400)
      );
    });

    it("should throw when student is not STUDENT", () => {
      expect(() => usersDomain.assertParentLinkAllowed(Role.PARENT, Role.TEACHER)).toThrow(
        new AppError("المستخدم المرتبط ليس طالباً.", 400)
      );
    });
  });

  describe("assertEnrollmentLinkAllowed", () => {
    it("should allow STUDENT", () => {
      expect(() => usersDomain.assertEnrollmentLinkAllowed(Role.STUDENT)).not.toThrow();
    });

    it("should throw for TEACHER", () => {
      expect(() => usersDomain.assertEnrollmentLinkAllowed(Role.TEACHER)).toThrow(
        new AppError("المستخدم المستهدف ليس طالباً.", 400)
      );
    });
  });
});
