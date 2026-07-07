const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.payrollItem.findMany({
    where: { 
      batch: { periodYear: 2026, periodMonth: 7 }
    },
    include: { batch: true }
  });
  
  const byUser = {};
  for (const item of items) {
    if (!byUser[item.beneficiaryUserId]) byUser[item.beneficiaryUserId] = [];
    byUser[item.beneficiaryUserId].push(item);
  }
  
  const duplicates = Object.entries(byUser).filter(([_, userItems]) => userItems.length > 1);
  console.log(JSON.stringify(duplicates, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
