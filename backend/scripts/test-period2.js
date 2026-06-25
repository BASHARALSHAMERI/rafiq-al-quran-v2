// Test the EXACT query that ensurePeriodOpenTx runs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const orgId = 1;
  
  // Try each month of 2026
  for (let month = 1; month <= 12; month++) {
    const issuedAt = new Date(2026, month - 1, 1);
    console.log(`\nMonth ${month}: issuedAt = ${issuedAt.toISOString()} (local: ${issuedAt.toString()})`);
    
    // Direct Prisma query (same as ensurePeriodOpenTx)
    const fp = await p.fiscalPeriod.findFirst({
      where: {
        organizationId: orgId,
        startDate: { lte: issuedAt },
        endDate: { gte: issuedAt }
      }
    });
    
    if (fp) {
      console.log(`  FOUND: Period ${fp.periodNumber}, start=${fp.startDate.toISOString()}, end=${fp.endDate.toISOString()}`);
    } else {
      console.log(`  NOT FOUND`);
    }
  }
  
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
