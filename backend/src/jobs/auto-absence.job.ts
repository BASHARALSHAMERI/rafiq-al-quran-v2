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

  // We process per organization
  const orgs = await prisma.organization.findMany();

  for (const org of orgs) {
    const policy = await attendancePolicyService.getPolicy(org.id);
    const timezone = policy.timezone ?? "Asia/Aden";

    // Format current time in the org's timezone
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);

    // Calculate local today and local yesterday as UTC Date objects (at 00:00:00)
    const localToday = new Date(Date.UTC(year, month - 1, day));
    const localYesterday = new Date(Date.UTC(year, month - 1, day - 1));

    // Evaluate both yesterday and today to catch any overnight shifts
    const targetDates = [localYesterday, localToday];

    for (const targetDate of targetDates) {
      const isWorkday = await attendancePolicyService.isWorkday(org.id, targetDate);
      if (!isWorkday) {
        continue;
      }

      const weekday = attendancePolicyService.getWeekdayName(targetDate);

      // Find all users with active schedule slots for this targetDate
      const activeSchedules = await prisma.staffScheduleAssignment.findMany({
        where: {
          organizationId: org.id,
          isActive: true,
          slots: { some: { dayOfWeek: weekday } },
          effectiveFrom: { lte: targetDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: targetDate } }]
        },
        include: {
          user: { select: { id: true, role: true } },
          center: { select: { id: true, name: true } },
          circle: { select: { id: true, name: true } }
        }
      });

      if (activeSchedules.length === 0) continue;

      const userMap = new Map<number, typeof activeSchedules[0]>();
      for (const sched of activeSchedules) {
        if (!userMap.has(sched.userId)) {
          userMap.set(sched.userId, sched);
        }
      }

      const targetUserIds = Array.from(userMap.values())
        .filter((s) => s.user.role !== Role.SUPERVISOR)
        .map((s) => s.userId);

      if (targetUserIds.length === 0) continue;

      const [allAttendances, allExcuses, allLeaves] = await Promise.all([
        prisma.staffAttendanceRecord.findMany({
          where: { attendanceDate: targetDate, userId: { in: targetUserIds } },
          select: { userId: true, status: true }
        }),
        prisma.staffExcuseRequest.findMany({
          where: { absenceDate: targetDate, status: ExcuseRequestStatus.APPROVED, userId: { in: targetUserIds } },
          select: { userId: true }
        }),
        prisma.staffLeaveRequest.findMany({
          where: { status: LeaveRequestStatus.LEAVE_APPROVED, startDate: { lte: targetDate }, endDate: { gte: targetDate }, userId: { in: targetUserIds } },
          select: { userId: true }
        })
      ]);

      const attendanceMap = new Map(allAttendances.map(a => [a.userId, a.status]));
      const excuseSet = new Set(allExcuses.map(e => e.userId));
      const leaveSet = new Set(allLeaves.map(l => l.userId));

      let markedAbsences = 0;
      
      for (const [userId, sched] of userMap.entries()) {
        if (sched.user.role === Role.SUPERVISOR) {
          continue; // Handled by supervisor visit derivation job
        }

        // If they already have an attendance record for this logical day, check it
        const currentStatus = attendanceMap.get(userId);
        if (currentStatus && currentStatus !== AttendanceStatus.ABSENT) {
          continue; // Already checked in, excused, on leave, etc.
        }

        const effectiveShift = await effectiveShiftService.resolveEffectiveShift(
          userId,
          targetDate,
          sched.centerId,
          org.id,
          timezone
        );

        if (!effectiveShift) {
          continue;
        }

        const checkInAfterMinutes = 60; // Policy grace/close minutes
        const checkInCloseAt = new Date(effectiveShift.start.getTime() + checkInAfterMinutes * 60_000);
        const absentDueAt = checkInCloseAt;

        // If the window hasn't closed yet, skip
        if (now < absentDueAt) {
          continue;
        }

        // If they had an ABSENT record already and no excuse/leave replaced it, it's fine, we skip.
        if (currentStatus === AttendanceStatus.ABSENT) {
           // We might want to upgrade it to EXCUSED/ON_LEAVE if one was approved recently
           if (excuseSet.has(userId) || leaveSet.has(userId)) {
             const newStatus = excuseSet.has(userId) ? AttendanceStatus.EXCUSED : AttendanceStatus.ON_LEAVE;
             await upsertAttendance(org.id, userId, sched.centerId ?? null, sched.isHeadquarters, targetDate, newStatus, sched.user.role as any);
           }
           continue;
        }

        // Check for approved excuse
        if (excuseSet.has(userId)) {
          await upsertAttendance(org.id, userId, sched.centerId ?? null, sched.isHeadquarters, targetDate, AttendanceStatus.EXCUSED, sched.user.role as any);
          continue;
        }

        // Check for approved leave
        if (leaveSet.has(userId)) {
          await upsertAttendance(org.id, userId, sched.centerId ?? null, sched.isHeadquarters, targetDate, AttendanceStatus.ON_LEAVE, sched.user.role as any);
          continue;
        }

        // Mark ABSENT
        const wasNew = await upsertAttendance(org.id, userId, sched.centerId ?? null, sched.isHeadquarters, targetDate, AttendanceStatus.ABSENT, sched.user.role as any);
        if (wasNew) {
          markedAbsences++;
          const absenceDate = targetDate.toISOString().slice(0, 10);
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

      if (markedAbsences > 0) {
        logger.info({ job: "auto-absence", orgId: org.id, targetDate, markedAbsences }, "Marked automatic absences");
      }
    }
  }

  logger.info({ job: "auto-absence" }, "Auto-absence job completed");
}

async function upsertAttendance(orgId: number, userId: number, centerId: number | null, isHeadquarters: boolean, date: Date, status: AttendanceStatus, role: any): Promise<boolean> {
  const existing = await prisma.staffAttendanceRecord.findUnique({
    where: { userId_attendanceDate: { userId, attendanceDate: date } }
  });

  if (existing) {
    if (existing.status !== status) {
      await prisma.staffAttendanceRecord.update({
        where: { id: existing.id },
        data: { status, note: "Auto-generated by System (Updated)" }
      });
      return false; // Not a new absence
    }
    return false; // Unchanged
  }

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
  return true; // Was new
}
