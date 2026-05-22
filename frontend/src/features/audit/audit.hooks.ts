import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { auditApi } from "./audit.api";
import type { AuditListQuery } from "./types";

const auditFiltersKey = (query: AuditListQuery) =>
  [
    query.from ?? null,
    query.to ?? null,
    query.centerId ?? null,
    query.circleId ?? null,
    query.actorUserId ?? null,
    query.action ?? null,
    query.entityType ?? null,
    query.entityId ?? null,
    query.q ?? null,
    query.page ?? 1,
    query.pageSize ?? 20
  ] as const;

export const AUDIT_QUERY_KEYS = {
  all: ["audit"] as const,
  catalog: () => [...AUDIT_QUERY_KEYS.all, "catalog"] as const,
  list: (query: AuditListQuery) => [...AUDIT_QUERY_KEYS.all, "list", ...auditFiltersKey(query)] as const
};

export const useAuditCatalogQuery = (enabled = true) => {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.catalog(),
    queryFn: () => auditApi.catalog(),
    enabled,
    staleTime: 60_000
  });
};

export const useAuditLogsQuery = (query: AuditListQuery, enabled = true) => {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.list(query),
    queryFn: () => auditApi.list(query),
    enabled,
    placeholderData: keepPreviousData
  });
};

