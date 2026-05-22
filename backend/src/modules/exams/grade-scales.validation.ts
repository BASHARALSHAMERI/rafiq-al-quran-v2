import { z } from "zod";

export const gradeScaleBodySchema = z.object({
  label: z.string().min(1).max(60),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  color: z.string().max(20).optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true)
});

export type GradeScaleBody = z.infer<typeof gradeScaleBodySchema>;
