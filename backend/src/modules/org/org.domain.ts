import { Role } from "@prisma/client";
import type { ScopeContext } from "../../shared/types/auth.types";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import { AppError } from "../../shared/errors/app-error";

export const orgDomain = {
  assertCanManageCenters(scope: ScopeContext) {
    if (scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("Forbidden", 403);
    }
  },

  assertCanManageCircles(scope: ScopeContext) {
    if (scope.role !== Role.SUPER_ADMIN && scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Forbidden", 403);
    }
  },

  assertCanApproveCircles(scope: ScopeContext) {
    if (scope.role !== Role.SUPER_ADMIN && scope.role !== Role.SUPERVISOR) {
      throw new AppError("Forbidden", 403);
    }
  },

  ensureCenterManageable(scope: ScopeContext, centerId: number) {
    if (scope.role !== Role.SUPER_ADMIN && scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Forbidden", 403);
    }
    ensureCenterAllowed(scope, centerId);
  },

  managedCenterScope(scope: ScopeContext) {
    return scope.allAccess ? undefined : scope.centerIds;
  },

  managedCircleScope(scope: ScopeContext) {
    return scope.allAccess ? undefined : scope.circleIds;
  },

  resolveCenterScope(scope: ScopeContext, requestedCenterId?: number) {
    if (requestedCenterId) {
      ensureCenterAllowed(scope, requestedCenterId);
      return [requestedCenterId];
    }

    return scope.allAccess ? undefined : scope.centerIds;
  },

  resolveCircleScope(scope: ScopeContext, requestedCircleId?: number, requestedCenterId?: number) {
    if (requestedCenterId) {
      ensureCenterAllowed(scope, requestedCenterId);
    }

    if (requestedCircleId) {
      ensureCircleAllowed(scope, requestedCircleId);
      return [requestedCircleId];
    }

    return scope.allAccess ? undefined : scope.circleIds;
  }
};
