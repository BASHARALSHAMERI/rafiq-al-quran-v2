import { AttendanceStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { editLockPolicy } from "../../shared/policies/edit-lock.policy";
import { safeDate } from "../../shared/utils/time";
import type { ScopeContext } from "../../shared/types/auth.types";
import { attendanceRepository } from "./attendance.repository";

type AttendanceQueryInput = {
  circleId: number;
  date: string;
};

type AttendanceBulkInput = {
  circleId: number;
  date: string;
  records: Array<{
    studentId: number;
    status: AttendanceStatus;
    note?: string | null;
    lockVersion?: number;
  }>;
};

const toDateOnly = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const ensureCircleAccessible = async (scope: ScopeContext, circleId: number) => {
  const circle = await attendanceRepository.findAccessibleCircle({
    organizationId: scope.organizationId,
    circleId,
    allowAll: scope.allAccess,
    scopeCircleIds: scope.circleIds,
    scopeCenterIds: scope.centerIds
  });

  if (!circle) {
    throw new AppError("Access denied for requested circle", 403);
  }

  return circle;
};

export const attendanceService = {
  async listForDate(scope: ScopeContext, query: AttendanceQueryInput) {
    await ensureCircleAccessible(scope, query.circleId);
    const attendanceDate = toDateOnly(safeDate(query.date, "date"));

    const records = await attendanceRepository.listAttendanceForDate({
      organizationId: scope.organizationId,
      circleId: query.circleId,
      attendanceDate
    });

    return records.map((item) => ({
      id: item.id,
      studentId: item.studentId,
      circleId: item.circleId,
      attendanceDate: item.attendanceDate.toISOString().slice(0, 10),
      status: item.status,
      note: item.note,
      lockVersion: item.lockVersion,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));
  },

  async getCircleStudentsWithAttendance(scope: ScopeContext, query: AttendanceQueryInput) {
    await ensureCircleAccessible(scope, query.circleId);
    const attendanceDate = toDateOnly(safeDate(query.date, "date"));

    // جلب الطلاب المسجلين
    const enrollments = await attendanceRepository.findActiveEnrollmentsWithNames({
      circleId: query.circleId
    });

    // جلب سجلات الحضور للتاريخ المحدد
    const attendanceRecords = await attendanceRepository.listAttendanceForDate({
      organizationId: scope.organizationId,
      circleId: query.circleId,
      attendanceDate
    });

    const attendanceByStudentId = new Map(attendanceRecords.map((item) => [item.studentId, item]));

    const students = enrollments.map((enrollment) => {
      const att = attendanceByStudentId.get(enrollment.studentId);
      return {
        id: enrollment.studentId,
        fullName: enrollment.student.profile?.fullName ?? enrollment.student.fullName,
        status: att?.status ?? null,
        note: att?.note ?? null,
        lockVersion: att?.lockVersion ?? 0
      };
    });

    const summary = {
      total: students.length,
      present: students.filter((s) => s.status === "PRESENT").length,
      absent: students.filter((s) => s.status === "ABSENT").length,
      excused: students.filter((s) => s.status === "EXCUSED").length,
      late: students.filter((s) => s.status === "LATE").length
    };

    return { students, summary, date: attendanceDate.toISOString().slice(0, 10) };
  },

  async submitBulk(scope: ScopeContext, input: AttendanceBulkInput) {
    await ensureCircleAccessible(scope, input.circleId);
    const attendanceDate = toDateOnly(safeDate(input.date, "date"));

    const enrolledStudentIds = await attendanceRepository.findActiveEnrollmentStudentIds({
      circleId: input.circleId
    });
    const enrolledSet = new Set(enrolledStudentIds);

    const normalizedRecords = input.records.map((record) => {
      const note = record.note?.trim() ?? "";
      return {
        studentId: record.studentId,
        status: record.status,
        note: note.length ? note : null,
        lockVersion:
          typeof record.lockVersion === "number" && Number.isInteger(record.lockVersion)
            ? record.lockVersion
            : undefined
      };
    });

    const studentIds = normalizedRecords.map((item) => item.studentId);
    const uniqueStudentIds = new Set(studentIds);
    if (uniqueStudentIds.size !== studentIds.length) {
      throw new AppError("Duplicate studentId is not allowed in attendance records payload", 422, undefined, "VALIDATION_FAILED");
    }

    const invalidStudent = normalizedRecords.find((record) => !enrolledSet.has(record.studentId));
    if (invalidStudent) {
      throw new AppError(`Student is not enrolled in this circle: ${invalidStudent.studentId}`, 400);
    }

    const existingRows = await attendanceRepository.findAttendanceForStudentsForDate({
      circleId: input.circleId,
      attendanceDate,
      studentIds: [...uniqueStudentIds]
    });
    const existingByStudentId = new Map(existingRows.map((item) => [item.studentId, item]));

    normalizedRecords.forEach((record) => {
      const existing = existingByStudentId.get(record.studentId);
      if (!existing) {
        return;
      }

      editLockPolicy.assertEditable({
        resource: "Attendance record",
        createdAt: existing.createdAt
      });

      editLockPolicy.assertVersionMatch({
        resource: "Attendance record",
        currentVersion: existing.lockVersion,
        expectedVersion: record.lockVersion
      });
    });

    await attendanceRepository.upsertBulkAttendance({
      circleId: input.circleId,
      attendanceDate,
      markedById: scope.userId,
      records: normalizedRecords.map((record) => ({
        studentId: record.studentId,
        status: record.status,
        note: record.note,
        expectedLockVersion: existingByStudentId.get(record.studentId)?.lockVersion
      }))
    });

    return {
      circleId: input.circleId,
      date: attendanceDate.toISOString().slice(0, 10),
      totalRecords: normalizedRecords.length,
      savedAt: new Date().toISOString()
    };
  }
};
