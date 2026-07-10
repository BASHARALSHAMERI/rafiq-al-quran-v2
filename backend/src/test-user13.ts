import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const attendances = await prisma.staffAttendanceRecord.findMany({
    where: { userId: 13, status: 'ABSENT' }
  });
  console.log("User 13 Absences:", attendances);

  const u13Profile = await prisma.payrollProfile.findFirst({
    where: { userId: 13 }
  });
  console.log("User 13 PayrollProfile:", u13Profile);
}

main().catch(console.error).finally(() => prisma.$disconnect());
