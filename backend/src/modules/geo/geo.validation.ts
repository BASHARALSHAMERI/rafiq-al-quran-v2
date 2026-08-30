import { z } from "zod";

export const geoSearchQuerySchema = z.object({
  q: z.string().trim().min(3).max(120),
  limit: z.coerce.number().int().min(1).max(10).optional()
});

export const geoReverseQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});

export const geoNearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(5000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional()
});
