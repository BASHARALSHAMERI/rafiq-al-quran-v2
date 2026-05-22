import { prisma } from "../src/shared/db/prisma";

async function finalLocalize() {
  console.log("🚀 Starting FINAL Database Localization...");

  // 1. Localize Supervisor Visits Target Labels
  await prisma.supervisorNote.updateMany({
    where: { targetLabel: "Classroom Evaluation" },
    data: { targetLabel: "تقييم الحلقات التعليمية" }
  });

  // 2. Localize Excuse Reasons
  await prisma.staffExcuseRequest.update({
    where: { id: 1 },
    data: { reason: "موعد طبي (أسنان)" }
  });

  await prisma.staffExcuseRequest.update({
    where: { id: 3 },
    data: { reason: "تأخر طارئ في الاستيقاظ" }
  });

  // Extra cleanup for any other obvious English
  await prisma.supervisorNote.updateMany({
    where: { targetLabel: { contains: "General" } },
    data: { targetLabel: "زيارة عامة للمركز" }
  });

  console.log("✅ Final Database Localization Completed!");
}

finalLocalize()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
