import { LibraryVisibility, Role } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";

type AccessWindow = {
  allAccess: boolean;
  centerIds: number[];
  circleIds: number[];
};

const unique = (values: number[]) => [...new Set(values)];

const VIEW_ALLOWED_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.PARENT,
  Role.STUDENT
];

const CATEGORY_MANAGE_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR
];

const ITEM_WRITE_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER
];

export const libraryDomain = {
  assertCanView(scope: ScopeContext) {
    if (!VIEW_ALLOWED_ROLES.includes(scope.role)) {
      throw new AppError("Library access is restricted for your role", 403);
    }
  },

  assertCanManageCategories(scope: ScopeContext) {
    if (!CATEGORY_MANAGE_ROLES.includes(scope.role)) {
      throw new AppError("You are not allowed to manage library categories", 403);
    }
  },

  assertCanWriteItems(scope: ScopeContext) {
    if (!ITEM_WRITE_ROLES.includes(scope.role)) {
      throw new AppError("You are not allowed to manage library items", 403);
    }
  },

  assertCenterInAccess(access: AccessWindow, centerId: number) {
    if (access.allAccess) {
      return;
    }

    if (!access.centerIds.includes(centerId)) {
      throw new AppError("Access denied for requested center", 403);
    }
  },

  assertCircleInAccess(access: AccessWindow, circleId: number) {
    if (access.allAccess) {
      return;
    }

    if (!access.circleIds.includes(circleId)) {
      throw new AppError("Access denied for requested circle", 403);
    }
  },

  normalizeCategoryCode(rawCode: string) {
    return rawCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "");
  },

  resolvePagination(page?: number, pageSize?: number) {
    const safePage = page && page > 0 ? page : 1;
    const safePageSize = pageSize && pageSize > 0 ? Math.min(pageSize, 100) : 10;

    return {
      page: safePage,
      pageSize: safePageSize,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize
    };
  },

  assertVisibilityPayload(input: {
    visibility: LibraryVisibility;
    centerId?: number | null;
    circleId?: number | null;
  }) {
    if (input.visibility === LibraryVisibility.ORG) {
      if (input.centerId || input.circleId) {
        throw new AppError("ORG visibility cannot be attached to center/circle", 400);
      }
      return;
    }

    if (input.visibility === LibraryVisibility.CENTER) {
      if (!input.centerId) {
        throw new AppError("centerId is required for CENTER visibility", 400);
      }

      if (input.circleId) {
        throw new AppError("CENTER visibility cannot include circleId", 400);
      }

      return;
    }

    if (input.visibility === LibraryVisibility.CIRCLE && !input.circleId) {
      throw new AppError("circleId is required for CIRCLE visibility", 400);
    }
  },

  assertTeacherOwnsItem(scope: ScopeContext, createdById: number) {
    if (scope.role !== Role.TEACHER) {
      return;
    }

    if (scope.userId !== createdById) {
      throw new AppError("Teacher can only manage their own uploads", 403);
    }
  },

  isItemVisible(
    access: AccessWindow,
    item: {
      visibility: LibraryVisibility;
      centerId: number | null;
      circleId: number | null;
    }
  ) {
    if (access.allAccess) {
      return true;
    }

    if (item.visibility === LibraryVisibility.ORG) {
      return true;
    }

    if (item.visibility === LibraryVisibility.CENTER) {
      return Boolean(item.centerId && access.centerIds.includes(item.centerId));
    }

    return Boolean(item.circleId && access.circleIds.includes(item.circleId));
  },

  uniqueIds(values: number[]) {
    return unique(values);
  }
};

