import { prisma } from "../src/shared/db/prisma";

async function localizeData() {
  console.log("🚀 Starting Database Localization...");

  // 1. Localize Supervisor Visits (Notes)
  const visits = await prisma.supervisorNote.findMany();
  console.log(`🔍 Found ${visits.length} supervisor visits.`);

  for (const visit of visits) {
    let newContent = visit.content;
    let newTarget = visit.targetLabel || "";

    // Content mapping
    if (newContent.toLowerCase().includes("excellent")) newContent = "أداء ممتاز ومتابعة دقيقة للمعلم والحلقة.";
    if (newContent.toLowerCase().includes("good")) newContent = "أداء جيد مع وجود بعض الملاحظات البسيطة للتطوير.";
    if (newContent.toLowerCase().includes("need")) newContent = "تحتاج الحلقة إلى مزيد من الضبط والمتابعة المستمرة.";
    if (newContent.toLowerCase().includes("great")) newContent = "عمل متميز وجهد ملموس في تحفيظ الطلاب.";
    
    // Target mapping
    if (newTarget.toLowerCase().includes("teacher")) newTarget = newTarget.replace(/Teacher/gi, "المعلم");
    if (newTarget.toLowerCase().includes("circle")) newTarget = newTarget.replace(/Circle/gi, "الحلقة");
    if (newTarget === "General Visit") newTarget = "زيارة عامة للمركز";

    await prisma.supervisorNote.update({
      where: { id: visit.id },
      data: { content: newContent, targetLabel: newTarget }
    });
  }

  // 2. Localize Staff Excuses
  const excuses = await prisma.staffExcuseRequest.findMany();
  console.log(`🔍 Found ${excuses.length} excuse requests.`);

  for (const excuse of excuses) {
    let newReason = excuse.reason;
    const lower = newReason.toLowerCase();

    if (lower.includes("sick")) newReason = "عذر مرضي طارئ";
    if (lower.includes("family")) newReason = "ظروف عائلية خاصة تستدعي الغياب";
    if (lower.includes("travel")) newReason = "سفر ضروري ومجدول مسبقاً";
    if (lower.includes("personal")) newReason = "أسباب شخصية قاهرة";
    if (lower.includes("emergency")) newReason = "حالة طارئة غير متوقعة";

    await prisma.staffExcuseRequest.update({
      where: { id: excuse.id },
      data: { reason: newReason }
    });
  }

  console.log("✅ Database Localization Completed Successfully!");
}

localizeData()
  .catch((e) => {
    console.error("❌ Error during localization:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
