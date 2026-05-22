import { z } from "zod";

export const calculateQuranRangeBodySchema = z
  .object({
    fromSurah: z.coerce.number().int().min(1).max(114),
    fromAyah: z.coerce.number().int().positive(),
    toSurah: z.coerce.number().int().min(1).max(114),
    toAyah: z.coerce.number().int().positive()
  })
  .strict();

export const previewQuranRangeBodySchema = calculateQuranRangeBodySchema;
