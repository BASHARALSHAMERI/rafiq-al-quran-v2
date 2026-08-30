import { z } from "zod";

export const matnIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const createMatnSchema = z
  .object({
    code: z.string().trim().min(1).max(80),
    titleAr: z.string().trim().min(1).max(160),
    titleEn: z.string().trim().max(160).optional().nullable(),
    category: z.string().trim().min(1).max(80),
    isActive: z.boolean().optional()
  })
  .strict();

export const updateMatnSchema = z
  .object({
    code: z.string().trim().min(1).max(80).optional(),
    titleAr: z.string().trim().min(1).max(160).optional(),
    titleEn: z.string().trim().max(160).optional().nullable(),
    category: z.string().trim().min(1).max(80).optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حقل واحد على الأقل مطلوب"
  });

export const listMatnQuerySchema = z
  .object({
    category: z.string().trim().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(50)
  })
  .strict();

export type CreateMatnDto = z.infer<typeof createMatnSchema>;
export type UpdateMatnDto = z.infer<typeof updateMatnSchema>;
export type ListMatnQueryDto = z.infer<typeof listMatnQuerySchema>;
