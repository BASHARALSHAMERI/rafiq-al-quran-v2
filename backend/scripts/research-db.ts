import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.log(JSON.stringify({ error: "No organization found" }));
      return;
    }

    const center = await prisma.center.findFirst({
      where: { organizationId: org.id }
    });

    const staff = await prisma.user.findMany({
      where: {
        organizationId: org.id,
        role: { in: ['TEACHER', 'SUPERVISOR', 'CENTER_ADMIN'] }
      },
      take: 5,
      select: { id: true, fullName: true, role: true }
    });

    console.log(JSON.stringify({
      orgId: org.id,
      centerId: center?.id,
      staff
    }, null, 2));
  } catch (err: any) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
