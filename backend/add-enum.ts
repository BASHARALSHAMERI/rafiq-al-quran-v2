import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`ALTER TYPE "FixedAssetStatus" ADD VALUE IF NOT EXISTS 'IN_CUSTODY'`;
  console.log("Added IN_CUSTODY to FixedAssetStatus enum");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
