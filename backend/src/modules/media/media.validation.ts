import { z } from "zod";

export const mediaImageKindSchema = z.enum(["USER_AVATAR", "CENTER_LOGO", "ORG_LOGO"]);

export const uploadMediaImageBodySchema = z.object({
  kind: mediaImageKindSchema.optional().default("USER_AVATAR")
});

