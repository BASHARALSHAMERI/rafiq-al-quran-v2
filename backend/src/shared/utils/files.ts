import { AppError } from "../errors/app-error";

const DISALLOWED_SEGMENTS = new Set([".", ".."]);

const normalizeStorageKey = (storageKey: string): string => {
  return storageKey.replace(/\\/g, "/").trim();
};

export const assertSafeStorageKey = (storageKey: string, fieldName = "storageKey") => {
  const normalized = normalizeStorageKey(storageKey);

  if (!normalized) {
    throw new AppError(`${fieldName} is required`, 400, undefined, "INVALID_STORAGE_KEY");
  }

  if (normalized.startsWith("/")) {
    throw new AppError(`${fieldName} cannot start with "/"`, 400, undefined, "INVALID_STORAGE_KEY");
  }

  const segments = normalized.split("/");

  if (segments.some((segment) => !segment || DISALLOWED_SEGMENTS.has(segment))) {
    throw new AppError(
      `${fieldName} contains invalid path segments`,
      400,
      undefined,
      "INVALID_STORAGE_KEY"
    );
  }

  return normalized;
};

export const buildAttachmentContentDisposition = (fileName: string): string => {
  const trimmed = fileName.trim();
  const safeFileName =
    trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 160) || "download";

  return `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(trimmed || safeFileName)}`;
};
