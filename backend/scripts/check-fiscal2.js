const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    // Check users and their org
    const users = await p.user.findMany({ 
      where: { email: { in: ['superadmin@rafiq.local', 'center.admin@rafiq.local'] } },
      select: { id: true, email: true, role: true, organizationId: true }
    });
    console.log('Users:', JSON.stringify(users));

    // Check fiscal periods org
    const fp = await p.fiscalPeriod.findMany({ 
      select: { id: true, organizationId: true, periodNumber: true }
    });
    console.log('FiscalPeriods:', JSON.stringify(fp));

    // Check fiscal years
    const fy = await p.fiscalYear.findMany({
      select: { id: true, organizationId: true, year: true }
    });
    console.log('FiscalYears:', JSON.stringify(fy));
  } finally {
    await p.$disconnect().catch(() => {});
  }
})();
