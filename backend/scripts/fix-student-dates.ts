import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetDate = new Date('2022-01-01T00:00:00.000Z');

  console.log('Updating StudentProfiles joinDate to 2022-01-01...');
  const profileRes = await prisma.studentProfile.updateMany({
    data: {
      joinDate: targetDate,
    },
  });
  console.log(`Updated ${profileRes.count} profiles.`);

  console.log('Updating StudentCircleEnrollment startDate to 2022-01-01...');
  const enrollmentRes = await prisma.studentCircleEnrollment.updateMany({
    data: {
      startDate: targetDate,
    },
  });
  console.log(`Updated ${enrollmentRes.count} enrollments.`);
  
  console.log('Done! All dummy students now have valid old start dates.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
