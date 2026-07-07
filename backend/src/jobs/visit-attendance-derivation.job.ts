import { prisma } from "../shared/db/prisma";
import { VisitPlanItemStatus } from "@prisma/client";
import { logger } from "../shared/logger/logger";
import { notificationsService } from "../modules/notifications/notifications.service";

const toStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export async function runVisitAttendanceDerivationJob() {
  logger.info({ job: "visit-derivation" }, "Starting visit attendance derivation job");
  const now = new Date();
  const today = toStartOfDay(now);

  // 1. Mark past pending planned items as MISSED
  // Only handles dates strictly before today.
  const pendingItems = await prisma.supervisorVisitPlanItem.findMany({
    where: { status: VisitPlanItemStatus.VISIT_ITEM_PENDING, plannedDate: { lt: today } },
    include: {
      plan: { select: { supervisorId: true, organizationId: true } },
      center: { select: { name: true } },
      circle: { select: { name: true } }
    }
  });

  if (pendingItems.length > 0) {
    const missedCount = await prisma.supervisorVisitPlanItem.updateMany({
      where: { id: { in: pendingItems.map(i => i.id) } },
      data: { status: VisitPlanItemStatus.VISIT_ITEM_MISSED }
    });

    for (const item of pendingItems) {
      try {
        await notificationsService.notifySupervisorVisitMissed({
          organizationId: item.plan.organizationId,
          centerId: item.centerId,
          circleId: item.circleId,
          recipientUserId: item.plan.supervisorId,
          planItemId: item.id,
          plannedDate: item.plannedDate.toISOString().split("T")[0],
          centerName: item.center.name,
          circleName: item.circle?.name
        });
      } catch (err) {
        logger.error({ job: "visit-derivation", error: err, itemId: item.id }, "Failed to send missed visit notification");
      }
    }
    logger.info({ job: "visit-derivation", count: missedCount.count }, "Marked past plan items as MISSED");
  } else {
    logger.info({ job: "visit-derivation", count: 0 }, "No past plan items to mark as MISSED");
  }

  logger.info({ job: "visit-derivation" }, "Job completed");
}
