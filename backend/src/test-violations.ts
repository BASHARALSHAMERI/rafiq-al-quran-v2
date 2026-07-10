import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { organizationId: 2 }
  });
  
  for (const user of users) {
    const profile = await prisma.payrollProfile.findFirst({
      where: { userId: user.id }
    });

    const absences = await prisma.staffAttendanceRecord.count({
      where: { userId: user.id, status: 'ABSENT' }
    });

    if (absences > 0) {
      console.log(`User ${user.id} (${user.fullName}): Absences=${absences}, HasPayrollProfile=${!!profile}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
