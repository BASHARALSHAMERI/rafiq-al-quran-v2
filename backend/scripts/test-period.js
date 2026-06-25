// Test what ensurePeriodOpenTx would find
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const orgId = 1;
  
  // The exact date from createInvoice for month=1, year=2026
  const issuedAt = new Date(2026, 0, 1);
  console.log('issuedAt:', issuedAt.toISOString());
  console.log('issuedAt getTime:', issuedAt.getTime());
  
  const period = await p.fiscalPeriod.findFirst({
    where: {
      organizationId: orgId,
      startDate: { lte: issuedAt },
      endDate: { gte: issuedAt }
    }
  });
  
  console.log('Found period:', JSON.stringify(period));
  
  if (!period) {
    // Let's see what's in the DB
    const all = await p.fiscalPeriod.findMany({
      where: { organizationId: orgId },
      select: { id: true, periodNumber: true, startDate: true, endDate: true, status: true }
    });
    console.log('All periods:', JSON.stringify(all, null, 2));
    
    // Check each period manually
    for (const fp of all) {
      const startOk = fp.startDate <= issuedAt;
      const endOk = fp.endDate >= issuedAt;
      console.log(`Period ${fp.periodNumber}: start=${fp.startDate.toISOString()} <= ${issuedAt.toISOString()} = ${startOk}, end=${fp.endDate.toISOString()} >= ${issuedAt.toISOString()} = ${endOk}`);
    }
  }
  
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
