import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type { AuditCatalog, AuditListQuery, AuditListResponse, AuditLogRow } from "./types";

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRow = (row: AuditLogRow): AuditLogRow => {
  return {
    ...row,
    id: toNumber(row.id),
    organizationId: toNumber(row.organizationId),
    centerId: row.centerId === null ? null : toNumber(row.centerId),
    circleId: row.circleId === null ? null : toNumber(row.circleId),
    actorUserId: row.actorUserId === null ? null : toNumber(row.actorUserId),
    entityId: toNumber(row.entityId),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    actor: row.actor
      ? {
          ...row.actor,
          id: toNumber(row.actor.id)
        }
      : null,
    center: row.center
      ? {
          ...row.center,
          id: toNumber(row.center.id)
        }
      : null,
    circle: row.circle
      ? {
          ...row.circle,
          id: toNumber(row.circle.id)
        }
      : null
  };
};

export const auditApi = {
  async list(params: AuditListQuery): Promise<AuditListResponse> {
    const response = await apiClient.get<ApiResponse<AuditListResponse>>("/audit", {
      params: {
        from: params.from,
        to: params.to,
        centerId: params.centerId,
        circleId: params.circleId,
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        q: params.q,
        page: params.page,
        pageSize: params.pageSize
      }
    });

    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizeRow(row))
    };
  },

  async catalog(): Promise<AuditCatalog> {
    const response = await apiClient.get<ApiResponse<AuditCatalog>>("/audit/catalog");
    return response.data.data;
  }
};

