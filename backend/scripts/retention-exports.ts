import { unlink } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const STORAGE_ROOT = path.resolve(process.cwd(), "storage", "reports");

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const EXPORT_RETENTION_DAYS = toPositiveInt(process.env.EXPORT_RETENTION_DAYS, 30);
const RETENTION_BATCH_SIZE = toPositiveInt(process.env.RETENTION_BATCH_SIZE, 5000);

const safeResolveStoragePath = (storageKey: string) => {
  const normalizedKey = storageKey.replace(/\\/g, "/").replace(/^([./\\])+/, "");
  const absolutePath = path.resolve(STORAGE_ROOT, normalizedKey);
  const normalizedRoot = path.normalize(STORAGE_ROOT).toLowerCase();
  const normalizedAbsolute = path.normalize(absolutePath).toLowerCase();

  if (!normalizedAbsolute.startsWith(normalizedRoot)) {
    throw new Error(`Unsafe storageKey path detected: ${storageKey}`);
  }

  return absolutePath;
};

const run = async () => {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - EXPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let deletedFilesRows = 0;
  let deletedFilesOnDisk = 0;
  let missingFilesOnDisk = 0;
  let deletedRuns = 0;
  let batches = 0;

  while (true) {
    const rows = await prisma.reportFile.findMany({
      where: {
        OR: [
          {
            expiresAt: {
              not: null,
              lt: now
            }
          },
          {
            createdAt: {
              lt: cutoffDate
            }
          }
        ]
      },
      select: {
        id: true,
        storageKey: true
      },
      orderBy: {
        id: "asc"
      },
      take: RETENTION_BATCH_SIZE
    });

    if (!rows.length) {
      break;
    }

    const ids = rows.map((row) => row.id);

    for (const row of rows) {
      try {
        await unlink(safeResolveStoragePath(row.storageKey));
        deletedFilesOnDisk += 1;
      } catch {
        missingFilesOnDisk += 1;
      }
    }

    const deleteResult = await prisma.reportFile.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    deletedFilesRows += deleteResult.count;
    batches += 1;
  }

  const runCleanup = await prisma.reportRun.deleteMany({
    where: {
      outputFileId: null,
      completedAt: {
        not: null,
        lt: cutoffDate
      }
    }
  });

  deletedRuns = runCleanup.count;

  console.log(
    JSON.stringify(
      {
        ok: true,
        retentionDays: EXPORT_RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
        deletedReportFilesRows: deletedFilesRows,
        deletedReportFilesOnDisk: deletedFilesOnDisk,
        missingReportFilesOnDisk: missingFilesOnDisk,
        deletedReportRuns: deletedRuns,
        batches
      },
      null,
      2
    )
  );
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
