const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.payrollBatch.findMany({
    where: { periodYear: 2026, periodMonth: 7 },
    include: { center: true }
  });
  console.log(JSON.stringify(batches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
