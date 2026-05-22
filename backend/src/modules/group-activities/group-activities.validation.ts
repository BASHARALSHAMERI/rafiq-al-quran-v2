import { z } from "zod";
import { GroupActivityType } from "@prisma/client";

export const createGroupActivitySchema = z
  .object({
    circleId: z.coerce.number().int().positive(),
    activityDate: z.string().trim().min(1),
    activityType: z.nativeEnum(GroupActivityType),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(1000).optional().nullable()
  })
  .strict();

export const listGroupActivitiesSchema = z
  .object({
    circleId: z.coerce.number().int().positive().optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export type CreateGroupActivityDto = z.infer<typeof createGroupActivitySchema>;
export type ListGroupActivitiesDto = z.infer<typeof listGroupActivitiesSchema>;
