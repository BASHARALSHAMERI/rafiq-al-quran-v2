import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const AUDIT_RETENTION_DAYS = toPositiveInt(process.env.AUDIT_RETENTION_DAYS, 90);
const RETENTION_BATCH_SIZE = toPositiveInt(process.env.RETENTION_BATCH_SIZE, 5000);

const cutoffDate = new Date(Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

const run = async () => {
  let deletedTotal = 0;
  let batches = 0;

  while (true) {
    const rows = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      },
      select: {
        id: true
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
    const result = await prisma.auditLog.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    deletedTotal += result.count;
    batches += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        retentionDays: AUDIT_RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
        deletedTotal,
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
