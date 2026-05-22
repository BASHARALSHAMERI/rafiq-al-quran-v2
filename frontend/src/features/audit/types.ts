import type { Role } from "../auth/types";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PUBLISH"
  | "ARCHIVE"
  | "DOWNLOAD"
  | "EXPORT"
  | "SCORE"
  | "LOGIN"
  | "LOGOUT";

export type AuditEntityType =
  | "USER"
  | "CENTER"
  | "CIRCLE"
  | "EXAM"
  | "EXAM_ATTEMPT"
  | "LIBRARY_ITEM"
  | "INVOICE"
  | "PAYMENT"
  | "REPORT_EXPORT"
  | "SETTINGS";

export type AuditCatalogOption = {
  id: number;
  name: string;
};

export type AuditCatalogCircleOption = AuditCatalogOption & {
  centerId: number;
};

export type AuditActorOption = {
  id: number;
  fullName: string;
  role: Role;
};

export type AuditCatalog = {
  actions: AuditAction[];
  entityTypes: AuditEntityType[];
  allowedFilters: string[];
  centers: AuditCatalogOption[];
  circles: AuditCatalogCircleOption[];
  actors: AuditActorOption[];
};

export type AuditLogRow = {
  id: number;
  organizationId: number;
  centerId: number | null;
  circleId: number | null;
  actorUserId: number | null;
  actorRole: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  summary: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: AuditActorOption | null;
  center: AuditCatalogOption | null;
  circle: AuditCatalogOption | null;
};

export type AuditListQuery = {
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

export type AuditListResponse = {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
};

