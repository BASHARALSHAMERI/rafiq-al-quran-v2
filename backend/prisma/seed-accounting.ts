/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import { defaultAccountingAccounts, seedAccountingChart } from "./accounting-chart-seed";

const prisma = new PrismaClient();

const main = async () => {
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { id: "asc" }
  });

  if (organizations.length === 0) {
    console.log(JSON.stringify({ organizations: 0, expectedAccountsPerOrganization: 0 }));
    return;
  }

  for (const organization of organizations) {
    await seedAccountingChart(prisma, organization.id);
  }

  console.log(
    JSON.stringify({
      organizations: organizations.length,
      expectedAccountsPerOrganization: defaultAccountingAccounts.length
    })
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
