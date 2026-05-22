import { AuditAction, AuditEntityType } from "@prisma/client";
import { z } from "zod";

const optionalId = z.coerce.number().int().positive().optional();

export const listAuditQuerySchema = z
  .object({
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    centerId: optionalId,
    circleId: optionalId,
    actorUserId: optionalId,
    action: z.nativeEnum(AuditAction).optional(),
    entityType: z.nativeEnum(AuditEntityType).optional(),
    entityId: optionalId,
    q: z.string().trim().max(255).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

