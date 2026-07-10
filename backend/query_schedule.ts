import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.findFirst({
    where: { fullName: { contains: 'محمود' }, role: 'TEACHER' }
  });

  if (!teacher) {
    console.log('Teacher Mahmoud not found');
    return;
  }

  console.log(`Teacher found: ${teacher.fullName} (ID: ${teacher.id})`);

  // 1. Circle Schedule (Web Circles page)
  const circles = await prisma.circle.findMany({
    where: { teacherId: teacher.id },
    include: {
      weeklyScheduleSlots: {
        where: { dayOfWeek: 'THURSDAY' }
      }
    }
  });

  console.log('\n--- Circle Schedule (Web page) ---');
  for (const c of circles) {
    console.log(`Circle: ${c.name} (ID: ${c.id})`);
    for (const slot of c.weeklyScheduleSlots) {
      console.log(`  Thursday Slot: Mode=${slot.mode}, FromTime=${slot.fromTime}, ToTime=${slot.toTime}, FromPrayer=${slot.fromPrayer}, ToPrayer=${slot.toPrayer}`);
    }
    if (c.weeklyScheduleSlots.length === 0) {
      console.log('  No Thursday slots found.');
    }
  }

  // 2. Staff Schedule (Flutter My Preparation page)
  const assignments = await prisma.staffScheduleAssignment.findMany({
    where: { userId: teacher.id },
    include: {
      slots: {
        where: { dayOfWeek: 'THURSDAY' }
      }
    }
  });

  console.log('\n--- Staff Schedule (Flutter التحضيري) ---');
  for (const a of assignments) {
    console.log(`Assignment ID: ${a.id}, Circle ID: ${a.circleId}, Role: ${a.staffRole}`);
    for (const slot of a.slots) {
      console.log(`  Thursday Shift: Mode=${slot.mode}, FromTime=${slot.fromTime}, ToTime=${slot.toTime}, FromPrayer=${slot.fromPrayer}, ToPrayer=${slot.toPrayer}, fromPrayerOffset=${slot.fromPrayerOffsetMinutes}, toPrayerOffset=${slot.toPrayerOffsetMinutes}`);
    }
    if (a.slots.length === 0) {
      console.log('  No Thursday slots found.');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
