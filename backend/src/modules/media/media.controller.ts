import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { env } from "../../config/env";
import { mediaService } from "./media.service";
import type { MediaImageKind } from "./media.storage";

const buildPublicBaseUrl = (req: Parameters<RequestHandler>[0]) => {
  if (env.PUBLIC_BASE_URL) {
    return env.PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  const protocol =
    (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() ||
    req.protocol;
  const host = req.get("host");

  if (!host) {
    throw new AppError("Unable to resolve public host for media URL", 500);
  }

  return `${protocol}://${host}`;
};

export const mediaController = {
  uploadImage: (async (req, res, next) => {
    try {
      if (!req.auth) {
        throw new AppError("Authentication required", 401);
      }

      if (!req.file) {
        throw new AppError("Image file is required", 400, undefined, "FILE_REQUIRED");
      }

      const body = req.body as { kind?: MediaImageKind };

      const uploaded = await mediaService.uploadImage({
        organizationId: req.auth.organizationId,
        kind: body.kind ?? "USER_AVATAR",
        file: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer
        }
      });

      const baseUrl = buildPublicBaseUrl(req);
      const url = `${baseUrl}/uploads/${uploaded.storageKey}`;

      res.status(201).json({
        ok: true,
        data: {
          ...uploaded,
          url
        }
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};

