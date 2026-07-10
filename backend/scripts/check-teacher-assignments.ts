import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const teacherId = Number(process.argv[2]);
  if (!teacherId) {
    console.error("Usage: npx ts-node check-teacher-assignments.ts <userId>");
    process.exit(1);
  }

  const assignments = await prisma.staffScheduleAssignment.findMany({
    where: {
      userId: teacherId,
      staffRole: "TEACHER",
      isActive: true,
      effectiveFrom: { lte: new Date() },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
    },
    include: {
      slots: true,
    },
  });

  console.log(`Found ${assignments.length} active assignments for teacher #${teacherId}\n`);
  for (const a of assignments) {
    console.log(`Assignment #${a.id} | sourceType: ${a.sourceType} | circleId: ${a.circleId}`);
    console.log(`  effectiveFrom: ${a.effectiveFrom} | effectiveTo: ${a.effectiveTo ?? "∞"}`);
    for (const s of a.slots) {
      console.log(`  ${s.dayOfWeek}: ${s.fromTime ?? s.fromPrayer} → ${s.toTime ?? s.toPrayer} (mode: ${s.mode})`);
    }
    console.log();
  }

  if (assignments.length > 1) {
    console.log("⚠️  CONFLICT: Teacher has multiple active assignments!");
    console.log("   Resolve by deactivating the extra MANUAL assignment.");
  } else {
    console.log("✅ No conflicts found.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
