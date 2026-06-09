import { prisma } from "../shared/db/prisma";
import { AttendanceStatus, ExcuseRequestStatus, VisitPlanItemStatus, VisitPlanStatus, AttendanceSource } from "@prisma/client";
import { logger } from "../shared/logger/logger";

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

async function upsertSupervisorAttendance(params: {
  supervisorId: number;
  orgId: number;
  centerId: number;
  today: Date;
  role: string;
  status: AttendanceStatus;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  visitsCount: number;
}) {
  const { supervisorId, orgId, centerId, today, role, status, checkInTime, checkOutTime } = params;
  await prisma.staffAttendanceRecord.upsert({
    where: { userId_attendanceDate: { userId: supervisorId, attendanceDate: today } },
    update: { status, checkInTime: checkInTime ?? undefined, checkOutTime, source: AttendanceSource.SYSTEM, staffRole: role as any },
    create: { userId: supervisorId, organizationId: orgId, centerId, attendanceDate: today, status, checkInTime, checkOutTime, source: AttendanceSource.SYSTEM, staffRole: role as any }
  });
}

export async function runVisitAttendanceDerivationJob() {
  logger.info({ job: "visit-derivation" }, "Starting visit attendance derivation job");
  const now = new Date();
  const today = toStartOfDay(now);
  const endOfToday = toEndOfDay(now);
  const currentMonth = today.getUTCMonth() + 1;
  const currentYear = today.getUTCFullYear();

  // 1. Mark past pending planned items as MISSED
  const missedCount = await prisma.supervisorVisitPlanItem.updateMany({
    where: { status: VisitPlanItemStatus.VISIT_ITEM_PENDING, plannedDate: { lt: today } },
    data: { status: VisitPlanItemStatus.VISIT_ITEM_MISSED }
  });
  logger.info({ job: "visit-derivation", count: missedCount.count }, "Marked past plan items as MISSED");

  // 2. Track which supervisors have been processed (to avoid duplicate upserts)
  const processedSupervisorIds = new Set<number>();

  // 3. Process supervisors with ACTIVE plans for this month
  const activePlans = await prisma.supervisorVisitPlan.findMany({
    where: { month: currentMonth, year: currentYear, status: VisitPlanStatus.VISIT_PLAN_ACTIVE },
    include: {
      supervisor: { select: { id: true, role: true } },
      items: { where: { plannedDate: today } }
    }
  });

  logger.info({ job: "visit-derivation", planCount: activePlans.length }, "Processing active plans");

  for (const plan of activePlans) {
    const supervisorId = plan.supervisorId;
    const orgId = plan.organizationId;
    const centerId = plan.centerId;

    const todayLogs = await prisma.supervisorVisitLog.findMany({
      where: { supervisorId, startedAt: { gte: today, lte: endOfToday } },
      orderBy: { startedAt: "asc" }
    });

    const hasLogs = todayLogs.length > 0;
    const hasPlannedItems = plan.items.length > 0;

    let targetStatus: AttendanceStatus | null = null;
    let checkInTime: Date | null = null;
    let checkOutTime: Date | null = null;

    if (hasLogs) {
      targetStatus = AttendanceStatus.PRESENT;
      checkInTime = todayLogs[0].startedAt;
      const endedLogs = todayLogs.filter((l) => l.endedAt !== null);
      checkOutTime = endedLogs.length > 0 ? endedLogs[endedLogs.length - 1].endedAt : null;
    } else if (hasPlannedItems) {
      const excuse = await prisma.staffExcuseRequest.findFirst({
        where: { userId: supervisorId, absenceDate: today, status: ExcuseRequestStatus.APPROVED }
      });
      targetStatus = excuse ? AttendanceStatus.EXCUSED : AttendanceStatus.ABSENT;
    } else {
      continue; // No planned items and no logs → not a working day for this plan
    }

    if (targetStatus !== null) {
      await upsertSupervisorAttendance({
        supervisorId, orgId, centerId, today,
        role: plan.supervisor.role,
        status: targetStatus,
        checkInTime, checkOutTime,
        visitsCount: todayLogs.length
      });
      processedSupervisorIds.add(supervisorId);
      logger.info({ job: "visit-derivation", supervisorId, status: targetStatus }, "Upserted plan-based attendance");
    }
  }

  // 4. Handle supervisors with visit logs TODAY but no active plan (ad-hoc / emergency visits)
  const logsWithNoProcessedSupervisor = await prisma.supervisorVisitLog.findMany({
    where: { startedAt: { gte: today, lte: endOfToday } },
    select: {
      supervisorId: true,
      centerId: true,
      organizationId: true,
      startedAt: true,
      endedAt: true,
      supervisor: { select: { role: true } }
    },
    orderBy: { startedAt: "asc" }
  });

  // Group by supervisorId
  const bySupevisor = new Map<number, typeof logsWithNoProcessedSupervisor>();
  for (const log of logsWithNoProcessedSupervisor) {
    if (processedSupervisorIds.has(log.supervisorId)) continue;
    if (!bySupevisor.has(log.supervisorId)) bySupevisor.set(log.supervisorId, []);
    bySupevisor.get(log.supervisorId)!.push(log);
  }

  for (const [supervisorId, logs] of bySupevisor.entries()) {
    const first = logs[0];
    const endedLogs = logs.filter((l) => l.endedAt !== null);
    const checkOutTime = endedLogs.length > 0 ? endedLogs[endedLogs.length - 1].endedAt : null;

    await upsertSupervisorAttendance({
      supervisorId,
      orgId: first.organizationId,
      centerId: first.centerId,
      today,
      role: first.supervisor.role,
      status: AttendanceStatus.PRESENT,
      checkInTime: first.startedAt,
      checkOutTime,
      visitsCount: logs.length
    });
    logger.info({ job: "visit-derivation", supervisorId, type: "ad-hoc" }, "Upserted ad-hoc visit attendance");
  }

  logger.info({ job: "visit-derivation" }, "Job completed");
}
