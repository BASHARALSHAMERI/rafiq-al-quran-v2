import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { assertSafeStorageKey } from "../../shared/utils/files";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage", "reports");
export const REPORTS_MAX_FILE_SIZE_BYTES = env.UPLOAD_MAX_BYTES;

const ensureWithinRoot = (targetPath: string) => {
  const normalizedRoot = path.normalize(STORAGE_ROOT).toLowerCase();
  const normalizedTarget = path.normalize(targetPath).toLowerCase();

  if (!normalizedTarget.startsWith(normalizedRoot)) {
    throw new AppError("Invalid reports storage path", 400);
  }
};

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

const walkFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const nested = await walkFiles(absolute);
      files.push(...nested);
      continue;
    }

    files.push(absolute);
  }

  return files;
};

export const reportsStorage = {
  resolveAbsolutePath(storageKey: string) {
    const safeKey = assertSafeStorageKey(storageKey, "reports storageKey");
    const absolute = path.resolve(STORAGE_ROOT, safeKey);
    ensureWithinRoot(absolute);
    return absolute;
  },

  async saveFile(input: {
    organizationId: number;
    reportType: string;
    extension: "pdf" | "xlsx";
    fileNamePrefix: string;
    buffer: Buffer;
  }) {
    if (input.buffer.length > REPORTS_MAX_FILE_SIZE_BYTES) {
      throw new AppError("Report export file exceeds max allowed size", 413);
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const relativeDir = path.join(
      String(input.organizationId),
      input.reportType.toLowerCase(),
      year,
      month
    );

    const absoluteDir = path.join(STORAGE_ROOT, relativeDir);
    const generated = sanitizeFileName(
      `${Date.now()}-${randomBytes(6).toString("hex")}-${input.fileNamePrefix}.${input.extension}`
    );
    const absolutePath = path.join(absoluteDir, generated);
    ensureWithinRoot(absolutePath);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      storageKey: path.join(relativeDir, generated).replace(/\\/g, "/"),
      absolutePath,
      sizeBytes: input.buffer.length
    };
  },

  async cleanupExpiredFiles(expiredBefore: Date) {
    try {
      const files = await walkFiles(STORAGE_ROOT);

      await Promise.all(
        files.map(async (filePath) => {
          const info = await stat(filePath);
          if (info.mtime < expiredBefore) {
            await unlink(filePath).catch(() => undefined);
          }
        })
      );
    } catch {
      // Ignore storage cleanup errors for MVP.
    }
  }
};

