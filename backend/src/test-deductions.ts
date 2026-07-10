import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.financeDeductionEvent.findMany({
    include: { user: { select: { fullName: true } } }
  });
  console.log("EVENTS: " + JSON.stringify(events, null, 2));

  const rules = await prisma.financeDeductionRule.findMany();
  console.log("RULES: " + JSON.stringify(rules, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
