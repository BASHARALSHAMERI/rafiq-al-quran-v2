import { Role, StaffRoleType, ExcuseRequestStatus, LeaveRequestStatus } from "@prisma/client";
import { prisma } from "../shared/db/prisma";
import { attendancePolicyService } from "../modules/staff-operations/attendance-policy.service";
import { effectiveShiftService } from "../modules/staff-operations/effective-shift.service";
import { notificationsService } from "../modules/notifications/notifications.service";
import { logger } from "../shared/logger/logger";

const toStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const REMINDER_LEAD_MINUTES = 30;

export async function runStaffShiftReminderJob() {
  logger.info({ job: "shift-reminder" }, "Starting staff shift reminder job");
  const now = new Date();
  const today = toStartOfDay(now);
  const orgs = await prisma.organization.findMany();

  for (const org of orgs) {
    const policy = await attendancePolicyService.getPolicy(org.id);
    const isWorkday = await attendancePolicyService.isWorkday(org.id, today);
    if (!isWorkday) {
      continue;
    }

    const weekday = attendancePolicyService.getWeekdayName(today);
    const activeSchedules = await prisma.staffScheduleAssignment.findMany({
      where: {
        organizationId: org.id,
        isActive: true,
        staffRole: {
          in: [StaffRoleType.TEACHER, StaffRoleType.CENTER_ADMIN]
        },
        user: {
          isActive: true
        },
        slots: {
          some: {
            dayOfWeek: weekday
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        center: {
          select: {
            id: true,
            name: true
          }
        },
        circle: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ createdAt: "asc" }]
    });

    const scheduleByUser = new Map<number, (typeof activeSchedules)[number]>();
    for (const schedule of activeSchedules) {
      if (!scheduleByUser.has(schedule.userId)) {
        scheduleByUser.set(schedule.userId, schedule);
      }
    }

    const targetUserIds = Array.from(scheduleByUser.values())
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

    for (const schedule of scheduleByUser.values()) {
      if (schedule.user.role === Role.SUPERVISOR) {
        continue;
      }

      if (attendanceSet.has(schedule.userId) || excuseSet.has(schedule.userId) || leaveSet.has(schedule.userId)) {
        continue;
      }

      const effectiveShift = await effectiveShiftService.resolveEffectiveShift(schedule.userId, now, schedule.centerId, org.id);

      if (!effectiveShift) {
        continue;
      }

      const shiftDate = today.toISOString().slice(0, 10);
      const scheduleKey = `${shiftDate}:${schedule.userId}:${effectiveShift.start.toISOString()}`;
      const leadWindowStart = new Date(
        effectiveShift.start.getTime() - REMINDER_LEAD_MINUTES * 60_000
      );

      if (now >= leadWindowStart && now < effectiveShift.start) {
        await notificationsService.notifyStaffShiftReminder({
          organizationId: org.id,
          centerId: schedule.centerId,
          circleId: schedule.circleId ?? effectiveShift.assignments.find((item) => item.circleId)?.circleId ?? null,
          recipientUserId: schedule.userId,
          recipientName: schedule.user.fullName,
          shiftDate,
          shiftStartIso: effectiveShift.start.toISOString(),
          shiftEndIso: effectiveShift.end.toISOString(),
          scheduleKey,
          centerName: schedule.center.name,
          circleName: schedule.circle?.name ?? null
        });
      }

      const lateMinutes = Math.max(
        0,
        Math.floor((now.getTime() - effectiveShift.start.getTime()) / 60_000) -
          Math.max(0, policy.gracePeriodMinutes)
      );

      if (lateMinutes > 0) {
        await notificationsService.notifyStaffLateAlert({
          organizationId: org.id,
          centerId: schedule.centerId,
          circleId: schedule.circleId ?? effectiveShift.assignments.find((item) => item.circleId)?.circleId ?? null,
          recipientUserId: schedule.userId,
          shiftDate,
          shiftStartIso: effectiveShift.start.toISOString(),
          lateMarker: scheduleKey,
          lateMinutes,
          centerName: schedule.center.name,
          circleName: schedule.circle?.name ?? null
        });
      }
    }
  }

  logger.info({ job: "shift-reminder" }, "Staff shift reminder job completed");
}
