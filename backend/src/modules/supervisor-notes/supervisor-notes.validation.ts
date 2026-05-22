import { SupervisorNoteCategory, SupervisorNoteStatus } from "@prisma/client";
import { z } from "zod";

const positiveId = z.coerce.number().int().positive();

export const listSupervisorNotesQuerySchema = z
  .object({
    centerId: positiveId.optional(),
    circleId: positiveId.optional(),
    category: z.nativeEnum(SupervisorNoteCategory).optional(),
    status: z.nativeEnum(SupervisorNoteStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export const createSupervisorNoteBodySchema = z
  .object({
    centerId: positiveId.optional(),
    circleId: positiveId.optional(),
    category: z.nativeEnum(SupervisorNoteCategory).default("GENERAL"),
    targetLabel: z.string().trim().max(255).optional(),
    content: z.string().trim().min(3).max(5000),
    scores: z
      .record(z.string(), z.number().min(0).max(5))
      .optional(),
    visitChecklist: z
      .array(z.object({ label: z.string(), checked: z.boolean() }))
      .optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  })
  .strict();

export const updateSupervisorNoteStatusBodySchema = z
  .object({
    status: z.nativeEnum(SupervisorNoteStatus),
  })
  .strict();

export const supervisorNoteIdParamSchema = z
  .object({
    id: positiveId,
  })
  .strict();

// ==========================================
// DTO Types inferred from Zod Schemas
// ==========================================
export type ListSupervisorNotesQueryDto = z.infer<typeof listSupervisorNotesQuerySchema>;
export type CreateSupervisorNoteDto = z.infer<typeof createSupervisorNoteBodySchema>;
export type UpdateSupervisorNoteStatusDto = z.infer<typeof updateSupervisorNoteStatusBodySchema>;
export type SupervisorNoteIdParamDto = z.infer<typeof supervisorNoteIdParamSchema>;
