import { NotificationType } from "@prisma/client";
import { z } from "zod";

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean().optional());

export const notificationsListQuerySchema = z
  .object({
    isRead: booleanQuerySchema,
    type: z.nativeEnum(NotificationType).optional(),
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

export const notificationIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

