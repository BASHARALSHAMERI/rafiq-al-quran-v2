import { Role } from "@prisma/client";
import type { AuthUserContext, ScopeContext } from "../types/auth.types";
import { AppError } from "../errors/app-error";
import { scopeRepository } from "./scope.repository";
import { buildScopeFromAssignments, mergeScope } from "./scope.domain";
import { memoryCache } from "../cache/memory-cache";

export const scopeService = {
  async resolveScope(auth: AuthUserContext): Promise<ScopeContext> {
    const cacheKey = `scope:${auth.userId}:${auth.organizationId}`;
    const cached = memoryCache.get<ScopeContext>(cacheKey);
    if (cached) return cached;

    const snapshot = await scopeRepository.findUserAssignments(auth.userId);

    if (!snapshot) {
      throw new AppError("Authenticated user not found", 401);
    }

    if (snapshot.organizationId !== auth.organizationId || snapshot.role !== auth.role) {
      throw new AppError("Token/user mismatch", 401);
    }

    let scope = buildScopeFromAssignments(snapshot);

    if (scope.allAccess) {
      return scope;
    }

    if (
      (scope.role === Role.CENTER_ADMIN || scope.role === Role.SUPERVISOR) &&
      scope.centerIds.length
    ) {
      const circleIdsFromCenters = await scopeRepository.findCircleIdsByCenterIds(scope.centerIds);
      scope = mergeScope(scope, [], circleIdsFromCenters);
    }

    if (scope.circleIds.length && scope.role !== Role.CENTER_ADMIN) {
      const centerIdsFromCircles = await scopeRepository.findCenterIdsByCircleIds(scope.circleIds);
      scope = mergeScope(scope, centerIdsFromCircles, []);
    }

    memoryCache.set(cacheKey, scope, 300); // Cache for 5 minutes
    return scope;
  }
};
