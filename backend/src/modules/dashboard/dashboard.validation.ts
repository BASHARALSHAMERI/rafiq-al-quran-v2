import { z } from "zod";

const baseDashboardQuery = {
  centerId: z.coerce.number().int().positive().optional(),
  circleId: z.coerce.number().int().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional()
};

export const dashboardMetricsQuerySchema = z.object(baseDashboardQuery).strict();

export const activityFeedQuerySchema = z
  .object({
    ...baseDashboardQuery,
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const attendanceSummaryQuerySchema = z.object(baseDashboardQuery).strict();