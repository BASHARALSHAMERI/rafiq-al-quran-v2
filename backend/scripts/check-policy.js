const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const fp = await p.financePolicyProfile.findMany({ select: { id: true, organizationId: true, feesEnabled: true } });
    console.log('Policies:', JSON.stringify(fp));
  } finally {
    await p.$disconnect().catch(() => {});
  }
})();
