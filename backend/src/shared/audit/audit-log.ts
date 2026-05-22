import { AuditAction, AuditEntityType, type Prisma, type Role } from "@prisma/client";
import { prisma } from "../db/prisma";

type AuditLogInput = {
  organizationId: number;
  centerId?: number | null;
  circleId?: number | null;
  actorUserId?: number | null;
  actorRole?: Role | string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  summary: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
};

const SENSITIVE_KEYS = ["password", "token", "secret", "hash", "authorization", "cookie"];

const shouldOmitKey = (key: string): boolean => {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((item) => normalized.includes(item));
};

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(record)) {
    if (shouldOmitKey(key)) {
      continue;
    }

    sanitized[key] = sanitizeValue(nestedValue);
  }

  return sanitized;
};

const sanitizeMetadata = (value?: Prisma.InputJsonValue): Prisma.InputJsonValue => {
  if (!value) {
    return {};
  }

  return sanitizeValue(value) as Prisma.InputJsonValue;
};

export const auditLogger = {
  async log(input: AuditLogInput) {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: input.organizationId,
          centerId: input.centerId ?? null,
          circleId: input.circleId ?? null,
          actorUserId: input.actorUserId ?? null,
          actorRole: (input.actorRole ?? "SYSTEM").toString(),
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          summary: input.summary.slice(0, 255),
          metadata: sanitizeMetadata(input.metadata),
          ip: input.ip ?? null,
          userAgent: input.userAgent?.slice(0, 255) ?? null,
          createdAt: input.createdAt
        }
      });
    } catch (error) {
      // Auditing must not break business flows.
      console.error("audit.log.failed", error);
    }
  }
};

