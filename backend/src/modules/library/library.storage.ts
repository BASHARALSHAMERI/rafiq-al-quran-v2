import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { assertSafeStorageKey } from "../../shared/utils/files";

export const LIBRARY_MAX_FILE_SIZE_BYTES = env.UPLOAD_MAX_BYTES;

export const LIBRARY_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "video/mp4",
  "video/x-m4v"
] as const;

type AllowedMimeType = (typeof LIBRARY_ALLOWED_MIME_TYPES)[number];

const MIME_EXTENSION_MAP: Record<AllowedMimeType, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/aac": ".m4a",
  "video/mp4": ".mp4",
  "video/x-m4v": ".m4v"
};

const STORAGE_ROOT = path.resolve(process.cwd(), "storage", "library");

const sanitizeFileName = (fileName: string) => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const ensureWithinStorageRoot = (targetPath: string) => {
  const normalizedRoot = path.normalize(STORAGE_ROOT).toLowerCase();
  const normalizedTarget = path.normalize(targetPath).toLowerCase();

  if (!normalizedTarget.startsWith(normalizedRoot)) {
    throw new AppError("Invalid storage path", 400);
  }
};

export const libraryStorage = {
  isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
    return LIBRARY_ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
  },

  resolveAbsolutePath(storageKey: string) {
    const safeStorageKey = assertSafeStorageKey(storageKey, "library storageKey");
    const absolute = path.resolve(STORAGE_ROOT, safeStorageKey);
    ensureWithinStorageRoot(absolute);
    return absolute;
  },

  async saveFile(input: {
    organizationId: number;
    centerId?: number | null;
    mimeType: string;
    originalFileName: string;
    buffer: Buffer;
  }) {
    if (!this.isAllowedMimeType(input.mimeType)) {
      throw new AppError("Unsupported file type", 400);
    }
    if (input.buffer.length > LIBRARY_MAX_FILE_SIZE_BYTES) {
      throw new AppError("Uploaded file exceeds max allowed size", 413);
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const centerSegment = input.centerId ? String(input.centerId) : "org";
    const extension =
      path.extname(input.originalFileName).toLowerCase() ||
      MIME_EXTENSION_MAP[input.mimeType];
    const generatedBase = `${Date.now()}-${randomBytes(6).toString("hex")}`;
    const generatedFileName = sanitizeFileName(`${generatedBase}${extension}`);
    const relativeDirectory = path.join(
      String(input.organizationId),
      centerSegment,
      year,
      month
    );
    const absoluteDirectory = path.join(STORAGE_ROOT, relativeDirectory);
    const absolutePath = path.join(absoluteDirectory, generatedFileName);
    ensureWithinStorageRoot(absolutePath);

    await mkdir(absoluteDirectory, { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      storageKey: path
        .join(relativeDirectory, generatedFileName)
        .replace(/\\/g, "/"),
      absolutePath,
      generatedFileName
    };
  },

  async deleteByStorageKey(storageKey: string) {
    const absolutePath = this.resolveAbsolutePath(storageKey);

    try {
      await unlink(absolutePath);
    } catch {
      // Ignore missing file cleanup errors.
    }
  }
};
