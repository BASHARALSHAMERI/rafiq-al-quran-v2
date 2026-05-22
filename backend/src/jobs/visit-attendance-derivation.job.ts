import { prisma } from "../shared/db/prisma";
import { AttendanceStatus, ExcuseRequestStatus, VisitPlanItemStatus, VisitPlanStatus, AttendanceSource } from "@prisma/client";

const toStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const toEndOfDay = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

export async function runVisitAttendanceDerivationJob() {
  console.log("[VisitDerivationJob] Starting visit attendance derivation...");
  const now = new Date();
  const today = toStartOfDay(now);
  const endOfToday = toEndOfDay(now);
  const currentMonth = today.getUTCMonth() + 1;
  const currentYear = today.getUTCFullYear();

  // 1. Mark past pending planned items as MISSED
  const missedCount = await prisma.supervisorVisitPlanItem.updateMany({
    where: {
      status: VisitPlanItemStatus.VISIT_ITEM_PENDING,
      plannedDate: { lt: today }
    },
    data: { status: VisitPlanItemStatus.VISIT_ITEM_MISSED }
  });
  console.log(`[VisitDerivationJob] Marked ${missedCount.count} past plan items as MISSED.`);

  // 2. Fetch active plans for this month
  const activePlans = await prisma.supervisorVisitPlan.findMany({
    where: {
      month: currentMonth,
      year: currentYear,
      status: VisitPlanStatus.VISIT_PLAN_ACTIVE
    },
    include: {
      supervisor: { select: { id: true, role: true } },
      items: {
        where: { plannedDate: today }
      }
    }
  });

  console.log(`[VisitDerivationJob] Found ${activePlans.length} active plans for this month.`);

  for (const plan of activePlans) {
    const supervisorId = plan.supervisorId;
    const orgId = plan.organizationId;
    const centerId = plan.centerId;

    // Check today's logs for this supervisor
    const todayLogs = await prisma.supervisorVisitLog.findMany({
      where: {
        supervisorId,
        startedAt: { gte: today, lte: endOfToday }
      },
      orderBy: { startedAt: "asc" }
    });

    const hasLogs = todayLogs.length > 0;
    const hasPlannedItems = plan.items.length > 0;

    let targetAttendanceStatus: AttendanceStatus | null = null;
    let checkInTime: Date | null = null;
    let checkOutTime: Date | null = null;

    if (hasLogs) {
      targetAttendanceStatus = AttendanceStatus.PRESENT;
      checkInTime = todayLogs[0].startedAt;
      const endedLogs = todayLogs.filter(l => l.endedAt !== null);
      if (endedLogs.length > 0) {
        checkOutTime = endedLogs[endedLogs.length - 1].endedAt;
      }
    } else if (hasPlannedItems) {
      // Look for approved excuse/leave
      const excuse = await prisma.staffExcuseRequest.findFirst({
        where: {
          userId: supervisorId,
          absenceDate: today,
          status: ExcuseRequestStatus.APPROVED
        }
      });
      targetAttendanceStatus = excuse ? AttendanceStatus.EXCUSED : AttendanceStatus.ABSENT;
    } else {
      // 0 logs, 0 planned items -> skip (not a working day)
      continue;
    }

    if (targetAttendanceStatus !== null) {
      // Upsert attendance record
      await prisma.staffAttendanceRecord.upsert({
        where: {
          userId_attendanceDate: {
            userId: supervisorId,
            attendanceDate: today
          }
        },
        update: {
          status: targetAttendanceStatus,
          checkInTime: checkInTime ?? undefined,
          checkOutTime: checkOutTime,
          source: AttendanceSource.SYSTEM,
          staffRole: plan.supervisor.role as any
        },
        create: {
          userId: supervisorId,
          organizationId: orgId,
          centerId,
          attendanceDate: today,
          status: targetAttendanceStatus,
          checkInTime,
          checkOutTime,
          markedById: supervisorId, // Or a system admin user ID
          source: AttendanceSource.SYSTEM,
          staffRole: plan.supervisor.role as any
        }
      });
      console.log(`[VisitDerivationJob] Upserted attendance for supervisor ${supervisorId} -> ${targetAttendanceStatus}`);
    }
  }

  console.log("[VisitDerivationJob] Job completed.");
}
