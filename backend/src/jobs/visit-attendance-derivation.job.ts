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

  // 1. Mark pending planned items as MISSED based on plannedEndAt or plannedDate
  const pendingItems = await prisma.supervisorVisitPlanItem.findMany({
    where: { status: VisitPlanItemStatus.VISIT_ITEM_PENDING },
    include: {
      plan: { select: { supervisorId: true, organizationId: true } },
      center: { select: { name: true } },
      circle: { select: { name: true } }
    }
  });

  const missedItems = pendingItems.filter(item => {
    if (item.plannedEndAt) {
      const gracePeriodEnd = new Date(item.plannedEndAt.getTime() + 30 * 60 * 1000);
      return now > gracePeriodEnd;
    } else {
      return item.plannedDate < today;
    }
  });

  if (missedItems.length > 0) {
    const missedCount = await prisma.supervisorVisitPlanItem.updateMany({
      where: { id: { in: missedItems.map(i => i.id) } },
      data: { status: VisitPlanItemStatus.VISIT_ITEM_MISSED }
    });

    for (const item of missedItems) {
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
