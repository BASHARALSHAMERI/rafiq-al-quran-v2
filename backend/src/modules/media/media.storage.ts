import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";

export const MEDIA_STORAGE_ROOT = path.resolve(process.cwd(), "storage", "uploads");
export const MEDIA_MAX_FILE_SIZE_BYTES = env.UPLOAD_MAX_BYTES;

export const MEDIA_ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml"
] as const;

export type MediaImageMimeType = (typeof MEDIA_ALLOWED_IMAGE_MIME_TYPES)[number];

export type MediaImageKind = "USER_AVATAR" | "CENTER_LOGO" | "ORG_LOGO";

const MIME_EXTENSION_MAP: Record<MediaImageMimeType, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg"
};

const KIND_SEGMENT_MAP: Record<MediaImageKind, string> = {
  USER_AVATAR: "user-avatar",
  CENTER_LOGO: "center-logo",
  ORG_LOGO: "org-logo"
};

const sanitizeFileName = (fileName: string) => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const ensureWithinMediaRoot = (targetPath: string) => {
  const normalizedRoot = path.normalize(MEDIA_STORAGE_ROOT).toLowerCase();
  const normalizedTarget = path.normalize(targetPath).toLowerCase();

  if (!normalizedTarget.startsWith(normalizedRoot)) {
    throw new AppError("Invalid media storage path", 400);
  }
};

export const mediaStorage = {
  isAllowedImageMimeType(mimeType: string): mimeType is MediaImageMimeType {
    return MEDIA_ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as MediaImageMimeType);
  },

  async saveImage(input: {
    organizationId: number;
    kind: MediaImageKind;
    mimeType: string;
    originalFileName: string;
    buffer: Buffer;
  }) {
    if (!this.isAllowedImageMimeType(input.mimeType)) {
      throw new AppError("Unsupported image type", 400, undefined, "UNSUPPORTED_IMAGE_TYPE");
    }

    if (input.buffer.length > MEDIA_MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        "Uploaded image exceeds max allowed size",
        413,
        undefined,
        "PAYLOAD_TOO_LARGE"
      );
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const extension =
      path.extname(input.originalFileName).toLowerCase() || MIME_EXTENSION_MAP[input.mimeType];
    const generatedBase = `${Date.now()}-${randomBytes(6).toString("hex")}`;
    const generatedFileName = sanitizeFileName(`${generatedBase}${extension}`);
    const relativeDirectory = path.join(
      String(input.organizationId),
      KIND_SEGMENT_MAP[input.kind],
      year,
      month
    );
    const absoluteDirectory = path.join(MEDIA_STORAGE_ROOT, relativeDirectory);
    const absolutePath = path.join(absoluteDirectory, generatedFileName);
    ensureWithinMediaRoot(absolutePath);

    await mkdir(absoluteDirectory, { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      storageKey: path.join(relativeDirectory, generatedFileName).replace(/\\/g, "/"),
      absolutePath,
      generatedFileName
    };
  }
};

