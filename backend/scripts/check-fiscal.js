const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const fy = await p.fiscalYear.findMany({ select: { id: true, year: true, status: true, startDate: true, endDate: true } });
    console.log('FiscalYears:', JSON.stringify(fy));
    const fp = await p.fiscalPeriod.findMany({ select: { id: true, fiscalYearId: true, periodNumber: true, status: true, startDate: true, endDate: true } });
    console.log('FiscalPeriods:', JSON.stringify(fp));
  } finally {
    await p.$disconnect().catch(() => {});
  }
})();
