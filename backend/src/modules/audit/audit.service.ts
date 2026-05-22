import { type AuditAction, type AuditEntityType, type Prisma, Role } from "@prisma/client";
import type { ScopeContext } from "../../shared/types/auth.types";
import { auditDomain } from "./audit.domain";
import { auditRepository } from "./audit.repository";

type ListAuditQuery = {
  from?: string;
  to?: string;
  centerId?: number;
  circleId?: number;
  actorUserId?: number;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: number;
  q?: string;
  page?: number;
  pageSize?: number;
};

const resolveBaseWhere = (
  scope: ScopeContext,
  query: ListAuditQuery,
  range?: { from: Date; to: Date }
): Prisma.AuditLogWhereInput => {
  return {
    organizationId: scope.organizationId,
    ...(query.centerId ? { centerId: query.centerId } : {}),
    ...(query.circleId ? { circleId: query.circleId } : {}),
    ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(range
      ? {
          createdAt: {
            gte: range.from,
            lte: range.to
          }
        }
      : {}),
    ...(query.q?.trim()
      ? {
          summary: {
            contains: query.q.trim()
          }
        }
      : {})
  };
};

export const auditService = {
  async list(scope: ScopeContext, query: ListAuditQuery) {
    auditDomain.assertCanAccess(scope);
    auditDomain.assertScopeFilters(scope, {
      centerId: query.centerId,
      circleId: query.circleId,
      entityType: query.entityType
    });

    const range = auditDomain.resolveDateRange(query.from, query.to);
    const pagination = auditDomain.resolvePagination(query.page, query.pageSize);
    const visibleEntityTypes = auditDomain.resolveVisibleEntityTypes(scope);
    const scopeWhere = auditDomain.resolveRoleScopeWhere(scope);
    const baseWhere = resolveBaseWhere(scope, query, range);
    const where: Prisma.AuditLogWhereInput = {
      AND: [baseWhere, scopeWhere, { entityType: { in: visibleEntityTypes } }]
    };

    const [rows, total] = await Promise.all([
      auditRepository.listRows({
        where,
        skip: pagination.skip,
        take: pagination.take
      }),
      auditRepository.countRows(where)
    ]);

    return {
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  },

  async catalog(scope: ScopeContext) {
    auditDomain.assertCanAccess(scope);

    const visibleEntityTypes = auditDomain.resolveVisibleEntityTypes(scope);
    const visibleActions = auditDomain.resolveVisibleActions();
    const scopeWhere = auditDomain.resolveRoleScopeWhere(scope);
    const actorWhere: Prisma.AuditLogWhereInput = {
      AND: [
        {
          organizationId: scope.organizationId
        },
        scopeWhere,
        {
          entityType: {
            in: visibleEntityTypes
          }
        }
      ]
    };

    const [actors, centers, circles] = await Promise.all([
      auditRepository.listActors(actorWhere),
      scope.allAccess
        ? auditRepository.listCentersByOrganization(scope.organizationId)
        : auditRepository.listCentersByIds({
            organizationId: scope.organizationId,
            centerIds: scope.centerIds
          }),
      scope.allAccess
        ? auditRepository.listCirclesByOrganization(scope.organizationId)
        : auditRepository.listCirclesByIds({
            organizationId: scope.organizationId,
            circleIds: scope.circleIds
          })
    ]);

    const baseFilters = ["from", "to", "action", "entityType", "entityId", "q", "page", "pageSize"];

    const allowedFilters =
      scope.role === Role.TEACHER
        ? [...baseFilters, "circleId", "actorUserId"]
        : [...baseFilters, "centerId", "circleId", "actorUserId"];

    return {
      actions: visibleActions,
      entityTypes: visibleEntityTypes,
      allowedFilters,
      centers,
      circles,
      actors
    };
  }
};

