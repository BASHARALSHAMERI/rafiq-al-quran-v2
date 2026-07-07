import { prisma } from "../shared/db/prisma";
import { AttendanceStatus, AttendanceSource, ExcuseRequestStatus, LeaveRequestStatus, Role } from "@prisma/client";
import { attendancePolicyService } from "../modules/staff-operations/attendance-policy.service";
import { effectiveShiftService } from "../modules/staff-operations/effective-shift.service";
import { logger } from "../shared/logger/logger";
import { notificationsService } from "../modules/notifications/notifications.service";

const toStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export async function runAutoAbsenceJob() {
  logger.info({ job: "auto-absence" }, "Starting auto-absence job");
  const now = new Date();
  const today = toStartOfDay(now);

  // We process per organization
  const orgs = await prisma.organization.findMany();

  for (const org of orgs) {
    const policy = await attendancePolicyService.getPolicy(org.id);
    const isWorkday = await attendancePolicyService.isWorkday(org.id, today);
    if (!isWorkday) {
      logger.info({ job: "auto-absence", orgId: org.id }, "Skipping org - not a workday");
      continue;
    }

    const weekday = attendancePolicyService.getWeekdayName(today);

    // Find all users with active schedule slots for today
    const activeSchedules = await prisma.staffScheduleAssignment.findMany({
      where: {
        organizationId: org.id,
        isActive: true,
        slots: { some: { dayOfWeek: weekday } }
      },
      include: {
        user: { select: { id: true, role: true } },
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    logger.info({ job: "auto-absence", orgId: org.id, scheduleCount: activeSchedules.length }, "Found schedules with slots for today");

    const userMap = new Map<number, typeof activeSchedules[0]>();
    for (const sched of activeSchedules) {
      // Prioritize preserving the first schedule found per user
      if (!userMap.has(sched.userId)) {
        userMap.set(sched.userId, sched);
      }
    }

    const targetUserIds = Array.from(userMap.values())
      .filter((s) => s.user.role !== Role.SUPERVISOR)
      .map((s) => s.userId);

    const [allAttendances, allExcuses, allLeaves] = await Promise.all([
      targetUserIds.length > 0 ? prisma.staffAttendanceRecord.findMany({
        where: { attendanceDate: today, userId: { in: targetUserIds } },
        select: { userId: true }
      }) : Promise.resolve([]),
      targetUserIds.length > 0 ? prisma.staffExcuseRequest.findMany({
        where: { absenceDate: today, status: ExcuseRequestStatus.APPROVED, userId: { in: targetUserIds } },
        select: { userId: true }
      }) : Promise.resolve([]),
      targetUserIds.length > 0 ? prisma.staffLeaveRequest.findMany({
        where: { status: LeaveRequestStatus.LEAVE_APPROVED, startDate: { lte: today }, endDate: { gte: today }, userId: { in: targetUserIds } },
        select: { userId: true }
      }) : Promise.resolve([])
    ]);

    const attendanceSet = new Set(allAttendances.map(a => a.userId));
    const excuseSet = new Set(allExcuses.map(e => e.userId));
    const leaveSet = new Set(allLeaves.map(l => l.userId));

    let markedAbsences = 0;
    
    for (const [userId, sched] of userMap.entries()) {
      if (sched.user.role === Role.SUPERVISOR) {
        continue; // Handled by supervisor visit derivation job
      }

      if (attendanceSet.has(userId)) {
        continue; // They checked in, or were already marked EXCUSED/ON_LEAVE
      }

      const effectiveShift = await effectiveShiftService.resolveEffectiveShift(
        userId,
        now,
        sched.centerId,
        org.id
      );

      if (!effectiveShift) {
        continue;
      }

      const autoAbsenceAt = new Date(
        effectiveShift.start.getTime() + Math.max(0, policy.autoAbsenceDelayMinutes) * 60_000
      );

      if (now < autoAbsenceAt) {
        continue;
      }

      // Check for approved excuse
      if (excuseSet.has(userId)) {
        await upsertAttendance(org.id, userId, sched.centerId ?? null, sched.isHeadquarters, today, AttendanceStatus.EXCUSED, sched.user.role as any);
        continue;
      }

      // Check for approved leave
      if (leaveSet.has(userId)) {
        await upsertAttendance(org.id, userId, sched.centerId ?? null, sched.isHeadquarters, today, AttendanceStatus.ON_LEAVE, sched.user.role as any);
        continue;
      }

      // Mark ABSENT
      const wasNew = await upsertAttendance(org.id, userId, sched.centerId ?? null, sched.isHeadquarters, today, AttendanceStatus.ABSENT, sched.user.role as any);
      if (wasNew) {
        markedAbsences++;
        const absenceDate = today.toISOString().slice(0, 10);
        const absenceMarker = `${absenceDate}:${userId}:absence`;
        notificationsService.notifyStaffAbsence({
          organizationId: org.id,
          centerId: sched.centerId ?? 0,
          circleId: sched.circleId ?? null,
          recipientUserId: userId,
          absenceDate,
          absenceMarker,
          centerName: (sched as any).center?.name ?? "",
          circleName: (sched as any).circle?.name ?? null
        }).catch((err) => logger.error({ job: "auto-absence", userId, err }, "Failed to send absence notification"));
      }
    }

    logger.info({ job: "auto-absence", orgId: org.id, markedAbsences }, "Marked automatic absences");
  }

  logger.info({ job: "auto-absence" }, "Auto-absence job completed");
}

async function upsertAttendance(orgId: number, userId: number, centerId: number | null, isHeadquarters: boolean, date: Date, status: AttendanceStatus, role: any): Promise<boolean> {
  const existing = await prisma.staffAttendanceRecord.findUnique({
    where: { userId_attendanceDate: { userId, attendanceDate: date } },
    select: { id: true }
  });
  if (existing) return false;

  await prisma.staffAttendanceRecord.create({
    data: {
      organizationId: orgId,
      userId,
      centerId,
      isHeadquarters,
      attendanceDate: date,
      status,
      source: AttendanceSource.SYSTEM,
      staffRole: role,
      note: "Auto-generated by System"
    }
  });
  return true;
}
