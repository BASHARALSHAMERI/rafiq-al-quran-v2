import { prisma } from "../src/shared/db/prisma";

async function researchData() {
  console.log("--- SUPERVISOR VISITS ---");
  const visits = await prisma.supervisorNote.findMany({
    include: { center: true }
  });
  visits.forEach(v => {
    console.log(`ID: ${v.id} | Target: "${v.targetLabel}" | Center: "${v.center.name}" | Content: "${v.content.substring(0, 30)}..."`);
  });

  console.log("\n--- EXCUSE REQUESTS ---");
  const excuses = await prisma.staffExcuseRequest.findMany();
  excuses.forEach(e => {
    console.log(`ID: ${e.id} | Reason: "${e.reason}"`);
  });
}

researchData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
