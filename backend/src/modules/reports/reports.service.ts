import {
  AttendanceStatus,
  AttemptStatus,
  InvoiceStatus,
  ReportFileKind,
  ReportType,
  Role
} from "@prisma/client";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { access } from "node:fs/promises";
import { auditLogger } from "../../shared/audit/audit-log";
import { prisma } from "../../shared/db/prisma";
import type { ScopeContext } from "../../shared/types/auth.types";
import { AppError } from "../../shared/errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import { reportsDomain, type ReportFilterInput } from "./reports.domain";
import { reportsExport } from "./reports.export";
import { reportsRepository } from "./reports.repository";
import { REPORTS_MAX_FILE_SIZE_BYTES, reportsStorage } from "./reports.storage";

type ReportResult = {
  kpis: Record<string, unknown>;
  rows: Record<string, unknown>[];
  meta: {
    from: string;
    to: string;
    reportType: ReportType;
    scope: {
      centerIds?: number[];
      circleIds?: number[];
      studentIds?: number[];
    };
  };
};

const money = (value: number) => Number(value.toFixed(2));
const round2 = (value: number) => Number(value.toFixed(2));

const normalizeDate = (value: Date | string) => new Date(value).toISOString();

const resolveScopedFilters = (scope: ScopeContext, reportType: ReportType, filters: ReportFilterInput) => {
  reportsDomain.assertReportAccess(scope, reportType);
  reportsDomain.assertFilterScope(scope, {
    centerId: filters.centerId,
    circleId: filters.circleId,
    forReportType: reportType
  });

  const range = reportsDomain.resolveDateRange(filters.from, filters.to);
  const centerScope = reportsDomain.resolveCenterScope(scope, filters.centerId);
  const circleScope = reportsDomain.resolveCircleScope(scope, filters.circleId);
  const studentScope = reportsDomain.resolveStudentScope(scope);

  return {
    range,
    centerScope,
    circleScope,
    studentScope
  };
};

const attendanceReport = async (scope: ScopeContext, filters: ReportFilterInput): Promise<ReportResult> => {
  const scoped = resolveScopedFilters(scope, ReportType.ATTENDANCE, filters);

  const rows = await reportsRepository.attendanceRows({
    organizationId: scope.organizationId,
    range: scoped.range,
    centerIds: scoped.centerScope,
    circleIds: scoped.circleScope,
    studentIds: scoped.studentScope
  });

  const mappedRows = rows.map((row) => ({
    attendanceDate: normalizeDate(row.attendanceDate),
    studentId: row.student.id,
    studentName: row.student.fullName,
    status: row.status,
    circleId: row.circle.id,
    circleName: row.circle.name,
    centerId: row.circle.center.id,
    centerName: row.circle.center.name,
    note: row.note ?? ""
  }));

  const statusCounts = mappedRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    kpis: {
      totalRecords: mappedRows.length,
      present: statusCounts.PRESENT ?? 0,
      absent: statusCounts.ABSENT ?? 0,
      late: statusCounts.LATE ?? 0,
      excused: statusCounts.EXCUSED ?? 0
    },
    rows: mappedRows,
    meta: {
      from: scoped.range.from.toISOString(),
      to: scoped.range.to.toISOString(),
      reportType: ReportType.ATTENDANCE,
      scope: {
        centerIds: scoped.centerScope,
        circleIds: scoped.circleScope,
        studentIds: scoped.studentScope
      }
    }
  };
};

const followUpReport = async (scope: ScopeContext, filters: ReportFilterInput): Promise<ReportResult> => {
  const scoped = resolveScopedFilters(scope, ReportType.FOLLOW_UP, filters);

  const rows = await reportsRepository.followUpRows({
    organizationId: scope.organizationId,
    range: scoped.range,
    centerIds: scoped.centerScope,
    circleIds: scoped.circleScope
  });

  const mappedRows = rows.map((row) => ({
    recordDate: normalizeDate(row.recordDate),
    studentName: row.student.fullName,
    teacherName: row.teacher.fullName,
    type: row.type,
    surah: row.surah ?? row.matnName ?? "-",
    pagesCount: row.pagesCount ? Number(row.pagesCount) : 0,
    ayahCount: row.ayahCount ?? 0,
    rating: row.rating ?? "-",
    status: row.status,
    notes: row.notes ?? "-",
    centerName: row.circle.center.name,
    circleName: row.circle.name
  }));

  const totalSessions = mappedRows.length;
  let totalHifzPages = 0;
  let totalReviewPages = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  const uniqueStudents = new Set<string>();

  mappedRows.forEach(row => {
    uniqueStudents.add(row.studentName);
    if (row.type === "NEW_MEMORIZATION") {
      totalHifzPages += row.pagesCount;
    } else if (row.type === "REVIEW") {
      totalReviewPages += row.pagesCount;
    }
    
    if (typeof row.rating === "number") {
      ratingSum += row.rating;
      ratingCount++;
    }
  });

  return {
    kpis: {
      totalSessions,
      totalHifzPages: Number(totalHifzPages.toFixed(1)),
      totalReviewPages: Number(totalReviewPages.toFixed(1)),
      avgRating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0,
      studentsWithActivity: uniqueStudents.size
    },
    rows: mappedRows,
    meta: {
      from: scoped.range.from.toISOString(),
      to: scoped.range.to.toISOString(),
      reportType: ReportType.FOLLOW_UP,
      scope: {
        centerIds: scoped.centerScope,
        circleIds: scoped.circleScope
      }
    }
  };
};

const examsReport = async (scope: ScopeContext, filters: ReportFilterInput): Promise<ReportResult> => {
  const scoped = resolveScopedFilters(scope, ReportType.EXAMS, filters);

  const [attemptRows, examsCount] = await Promise.all([
    reportsRepository.examsRows({
      organizationId: scope.organizationId,
      range: scoped.range,
      centerIds: scoped.centerScope,
      circleIds: scoped.circleScope,
      examStatus: filters.examStatus,
      studentIds: scoped.studentScope
    }),
    reportsRepository.countExamsInRange({
      organizationId: scope.organizationId,
      range: scoped.range,
      centerIds: scoped.centerScope,
      circleIds: scoped.circleScope,
      status: filters.examStatus
    })
  ]);

  const mappedRows = attemptRows.map((row) => ({
    attemptId: row.id,
    examId: row.exam.id,
    examTitle: row.exam.title,
    examStatus: row.exam.status,
    attemptStatus: row.status,
    studentName: row.student.fullName,
    centerName: row.circle.center.name,
    circleName: row.circle.name,
    score: row.totalScore ?? 0,
    passScore: row.exam.passScore,
    isPassed: typeof row.totalScore === "number" ? row.totalScore >= row.exam.passScore : false
  }));

  const scoredRows = mappedRows.filter((item) => item.attemptStatus === AttemptStatus.APPROVED);
  const averageScore = scoredRows.length
    ? scoredRows.reduce((sum, item) => sum + item.score, 0) / scoredRows.length
    : 0;

  return {
    kpis: {
      totalExams: examsCount,
      totalAttempts: mappedRows.length,
      reviewedAttempts: scoredRows.length,
      passRate:
        scoredRows.length > 0
          ? Number(
              ((scoredRows.filter((item) => item.isPassed).length / scoredRows.length) * 100).toFixed(2)
            )
          : 0,
      averageScore: Number(averageScore.toFixed(2))
    },
    rows: mappedRows,
    meta: {
      from: scoped.range.from.toISOString(),
      to: scoped.range.to.toISOString(),
      reportType: ReportType.EXAMS,
      scope: {
        centerIds: scoped.centerScope,
        circleIds: scoped.circleScope,
        studentIds: scoped.studentScope
      }
    }
  };
};

const financeReport = async (scope: ScopeContext, filters: ReportFilterInput): Promise<ReportResult> => {
  const scoped = resolveScopedFilters(scope, ReportType.FINANCE, filters);

  const [invoiceRows, groupedByStatus] = await Promise.all([
    reportsRepository.financeRows({
      organizationId: scope.organizationId,
      range: scoped.range,
      centerIds: scoped.centerScope,
      status: filters.status,
      studentIds: scoped.studentScope
    }),
    reportsRepository.summarizeFinanceByStatus({
      organizationId: scope.organizationId,
      range: scoped.range,
      centerIds: scoped.centerScope,
      studentIds: scoped.studentScope
    })
  ]);

  const mappedRows = invoiceRows.map((row) => {
    const collected = row.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Math.max(0, Number(row.amount) - collected);

    return {
      invoiceId: row.id,
      studentName: row.student.fullName,
      centerName: row.center.name,
      month: row.month,
      year: row.year,
      issuedAt: normalizeDate(row.issuedAt),
      status: row.status,
      amount: money(Number(row.amount)),
      collected: money(collected),
      remaining: money(remaining)
    };
  });

  const totalAmount = mappedRows.reduce((sum, row) => sum + row.amount, 0);
  const totalCollected = mappedRows.reduce((sum, row) => sum + row.collected, 0);

  return {
    kpis: {
      totalInvoices: mappedRows.length,
      totalAmount: money(totalAmount),
      totalCollected: money(totalCollected),
      collectionRate: totalAmount > 0 ? Number(((totalCollected / totalAmount) * 100).toFixed(2)) : 0,
      groupedByStatus
    },
    rows: mappedRows,
    meta: {
      from: scoped.range.from.toISOString(),
      to: scoped.range.to.toISOString(),
      reportType: ReportType.FINANCE,
      scope: {
        centerIds: scoped.centerScope,
        studentIds: scoped.studentScope
      }
    }
  };
};

const reportTitleMap: Record<ReportType, string> = {
  ATTENDANCE: "Attendance Report",
  FOLLOW_UP: "Follow-up Report",
  EXAMS: "Exams Report",
  FINANCE: "Finance Report"
};

type SupRawAttendance = {
  studentId: number | null;
  circleId: number;
  status: string;
  student: { fullName: string } | null;
  circle: { name: string; teacher: { fullName: string } | null; _count: { students: number } };
};

type SupRawFollowUp = {
  studentId: number | null;
  circleId: number | null;
  pagesCount: import("@prisma/client").Prisma.Decimal | null;
  rating: number | null;
  type: string;
};

type SupCircle = {
  id: number;
  name: string;
  teacher: { fullName: string } | null;
  _count: { enrollments: number };
};

const supervisorDashboardReport = async (scope: ScopeContext, filters: ReportFilterInput) => {
  const scoped = resolveScopedFilters(scope, ReportType.FOLLOW_UP, filters);

  const [attendance, followUps, circles, prevStats] = await Promise.all([
    reportsRepository.supervisorRawAttendance({
      organizationId: scope.organizationId,
      range: scoped.range,
      centerIds: scoped.centerScope,
      circleIds: scoped.circleScope,
    }),
    reportsRepository.supervisorRawFollowUps({
      organizationId: scope.organizationId,
      range: scoped.range,
      centerIds: scoped.centerScope,
      circleIds: scoped.circleScope,
    }),
    reportsRepository.supervisorCircles({
      organizationId: scope.organizationId,
      centerIds: scoped.centerScope,
      circleIds: scoped.circleScope,
    }),
    reportsRepository.getPreviousPeriodStats({
      organizationId: scope.organizationId,
      range: scoped.range,
      centerIds: scoped.centerScope,
      circleIds: scoped.circleScope,
    })
  ]) as [unknown, unknown, unknown, any];

  const typedAttendance = attendance as SupRawAttendance[];
  const typedFollowUps = followUps as SupRawFollowUp[];
  const typedCircles = circles as SupCircle[];

  const totalStudents = typedCircles.reduce((sum, c) => sum + c._count.enrollments, 0);

  let totalAtt = 0;
  let presentAtt = 0;

  const circleStats: Record<number, { att: number, present: number, hifzPages: number, reviewPages: number, ratingSum: number, ratingCount: number }> = {};
  const studentStats: Record<number, { att: number, present: number, hifzPages: number, ratingSum: number, ratingCount: number, name: string, halqa: string }> = {};

  for (const c of typedCircles) {
    circleStats[c.id] = { att: 0, present: 0, hifzPages: 0, reviewPages: 0, ratingSum: 0, ratingCount: 0 };
  }

  for (const a of typedAttendance) {
    totalAtt++;
    if (a.status === "PRESENT") presentAtt++;
    
    if (a.circleId && circleStats[a.circleId]) {
      circleStats[a.circleId].att++;
      if (a.status === "PRESENT") circleStats[a.circleId].present++;
    }

    if (a.studentId && a.student) {
      if (!studentStats[a.studentId]) {
        studentStats[a.studentId] = { att: 0, present: 0, hifzPages: 0, ratingSum: 0, ratingCount: 0, name: a.student.fullName, halqa: a.circle.name };
      }
      studentStats[a.studentId].att++;
      if (a.status === "PRESENT") studentStats[a.studentId].present++;
    }
  }

  let totalPages = 0;
  let totalRatingSum = 0;
  let totalRatingCount = 0;

  for (const f of typedFollowUps) {
    if (f.pagesCount) {
      const p = Number(f.pagesCount);
      totalPages += p;
      if (f.type === "NEW_MEMORIZATION") {
        if (f.circleId && circleStats[f.circleId]) circleStats[f.circleId].hifzPages += p;
        if (f.studentId && studentStats[f.studentId]) studentStats[f.studentId].hifzPages += p;
      } else {
        if (f.circleId && circleStats[f.circleId]) circleStats[f.circleId].reviewPages += p;
      }
    }
    if (f.rating) {
      const r = Number(f.rating);
      totalRatingSum += r;
      totalRatingCount++;
      if (f.circleId && circleStats[f.circleId]) {
        circleStats[f.circleId].ratingSum += r;
        circleStats[f.circleId].ratingCount++;
      }
      if (f.studentId && studentStats[f.studentId]) {
        studentStats[f.studentId].ratingSum += r;
        studentStats[f.studentId].ratingCount++;
      }
    }
  }

  const halaqat = typedCircles.map(c => {
    const stats = circleStats[c.id];
    const avgAttendance = stats.att > 0 ? Math.round((stats.present / stats.att) * 100) : 0;
    const avgRating = stats.ratingCount > 0 ? Number((stats.ratingSum / stats.ratingCount).toFixed(1)) : 0;
    const trend = avgAttendance >= 80 && avgRating >= 3.5 ? "up" : "down";
    
    return {
      id: c.id.toString(),
      name: c.name,
      teacher: c.teacher?.fullName ?? "لا يوجد معلم",
      students: c._count.enrollments,
      trend,
      avgAttendance,
      avgHifz: stats.hifzPages,
      avgReview: stats.reviewPages,
      avgRating,
    };
  });

  const strugglingStudents = [];
  for (const [id, stats] of Object.entries(studentStats)) {
    const attRate = stats.att > 0 ? Math.round((stats.present / stats.att) * 100) : 0;
    const avgR = stats.ratingCount > 0 ? stats.ratingSum / stats.ratingCount : 0;
    
    let reason = "";
    if (stats.att >= 3 && attRate < 70) reason = "كثرة الغياب";
    else if (stats.ratingCount >= 3 && avgR < 3) reason = "ضعف التقييم";
    
    if (reason !== "") {
      strugglingStudents.push({
        id: id.toString(),
        name: stats.name,
        halqa: stats.halqa,
        hifzPercent: stats.hifzPages,
        attendance: attRate,
        reason,
      });
    }
  }

  strugglingStudents.sort((a, b) => a.attendance - b.attendance);
  const limitedStruggling = strugglingStudents.slice(0, 10);

  const currAvgAttendance = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
  const currAvgRating = totalRatingCount > 0 ? Number((totalRatingSum / totalRatingCount).toFixed(1)) : 0;

  const attendanceTrend = currAvgAttendance > prevStats.avgAttendance ? "up" : currAvgAttendance < prevStats.avgAttendance ? "down" : "stable";
  const ratingTrend = currAvgRating > prevStats.avgRating ? "up" : currAvgRating < prevStats.avgRating ? "down" : "stable";

  // Real Plan Completion: sessions recorded vs expected (4 per student)
  const expectedSessions = totalStudents * 4;
  const actualSessions = typedFollowUps.length;
  const planCompletion = expectedSessions > 0 ? Math.min(100, Math.round((actualSessions / expectedSessions) * 100)) : 0;

  return {
    overallStats: {
      totalStudents,
      avgAttendance: currAvgAttendance,
      attendanceTrend,
      totalHifzPages: totalPages,
      avgPlanCompletion: planCompletion,
      strugglingStudents: strugglingStudents.length,
      avgRating: currAvgRating,
      ratingTrend
    },
    halaqat,
    strugglingStudents: limitedStruggling,
  };
};

const resolveMonthWindow = (month?: number, year?: number) => {
  const now = new Date();
  const resolvedMonth = month ?? now.getMonth() + 1;
  const resolvedYear = year ?? now.getFullYear();
  const from = new Date(resolvedYear, resolvedMonth - 1, 1);
  const to = new Date(resolvedYear, resolvedMonth, 0, 23, 59, 59, 999);
  return {
    month: resolvedMonth,
    year: resolvedYear,
    from,
    to
  };
};

const scoreToGradeLabel = (score: number) => {
  if (score >= 90) return "ممتاز";
  if (score >= 80) return "جيد جدا";
  if (score >= 70) return "جيد";
  if (score >= 60) return "مقبول";
  return "يحتاج متابعة";
};

const saveCustomReportFile = async (input: {
  scope: ScopeContext;
  title: string;
  baseName: string;
  format: ReportFileKind;
  rows: Record<string, unknown>[];
  kpis: Record<string, unknown>;
  centerId?: number;
  circleId?: number;
}) => {
  const now = new Date();
  const buffer =
    input.format === ReportFileKind.PDF
      ? await reportsExport.toPdfBuffer({
          title: input.title,
          generatedAt: now,
          kpis: input.kpis,
          rows: input.rows
        })
      : await reportsExport.toExcelBuffer({
          title: input.title,
          generatedAt: now,
          kpis: input.kpis,
          rows: input.rows
        });

  const saved = await reportsStorage.saveFile({
    organizationId: input.scope.organizationId,
    reportType: ReportType.FOLLOW_UP,
    extension: input.format === ReportFileKind.PDF ? "pdf" : "xlsx",
    fileNamePrefix: input.baseName,
    buffer
  });

  const reportFile = await reportsRepository.createReportFile({
    organizationId: input.scope.organizationId,
    centerId: input.centerId,
    circleId: input.circleId,
    name: `${input.baseName}.${input.format === ReportFileKind.PDF ? "pdf" : "xlsx"}`,
    mimeType:
      input.format === ReportFileKind.PDF
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeBytes: saved.sizeBytes,
    storageKey: saved.storageKey,
    kind: input.format,
    createdById: input.scope.userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return {
    fileId: reportFile.id,
    name: reportFile.name,
    kind: reportFile.kind,
    downloadUrl: `/reports/exports/${reportFile.id}/download`
  };
};

const buildTeacherMonthlyHalqaData = async (
  scope: ScopeContext,
  query: { circleId?: number; month?: number; year?: number }
) => {
  const window = resolveMonthWindow(query.month, query.year);
  const resolvedCircleId = query.circleId ?? scope.circleIds[0];

  if (!resolvedCircleId) {
    throw new AppError("تقرير المعلم الشهري للحلقة يتطلب تحديد حلقة", 400);
  }

  if (!scope.allAccess) {
    reportsDomain.assertFilterScope(scope, {
      circleId: resolvedCircleId,
      forReportType: ReportType.FOLLOW_UP
    });
  }

  const circle = await prisma.circle.findFirst({
    where: {
      id: resolvedCircleId,
      center: { organizationId: scope.organizationId }
    },
    select: {
      id: true,
      name: true,
      centerId: true,
      teacher: {
        select: {
          fullName: true
        }
      },
      enrollments: {
        where: {
          status: "ACTIVE",
          student: { isActive: true }
        },
        select: {
          studentId: true,
          student: {
            select: {
              id: true,
              fullName: true,
              studentProfile: {
                select: {
                  level: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!circle) {
    throw new AppError("الحلقة غير موجودة", 404);
  }

  if (scope.role === Role.TEACHER && circle.centerId && !scope.circleIds.includes(circle.id)) {
    throw new AppError("تقرير الحلقة خارج نطاق صلاحياتك", 403);
  }

  const previousWindow = resolveMonthWindow(
    window.month === 1 ? 12 : window.month - 1,
    window.month === 1 ? window.year - 1 : window.year
  );

  const [attendanceRows, followUps, previousFollowUps, activities, plans] = await Promise.all([
    reportsRepository.attendanceRows({
      organizationId: scope.organizationId,
      range: { from: window.from, to: window.to },
      circleIds: [circle.id]
    }),
    prisma.followUpRecord.findMany({
      where: {
        circleId: circle.id,
        recordDate: {
          gte: window.from,
          lte: window.to
        }
      },
      select: {
        studentId: true,
        type: true,
        rating: true,
        pagesCount: true,
        toSurah: true,
        toAyah: true,
        surah: true,
        status: true
      }
    }),
    prisma.followUpRecord.findMany({
      where: {
        circleId: circle.id,
        recordDate: {
          gte: previousWindow.from,
          lte: previousWindow.to
        }
      },
      select: {
        studentId: true,
        pagesCount: true
      }
    }),
    prisma.groupActivity.findMany({
      where: {
        circleId: circle.id,
        activityDate: {
          gte: window.from,
          lte: window.to
        }
      },
      include: {
        participants: true
      },
      orderBy: [{ activityDate: "desc" }]
    }),
    prisma.monthlyPlan.findMany({
      where: {
        circleId: circle.id,
        month: window.month,
        year: window.year
      },
      select: {
        studentId: true,
        status: true,
        hifzTargetPages: true,
        reviewTargetPages: true
      }
    })
  ]);

  const levelCounts = new Map<string, number>();
  const studentMap = new Map<
    number,
    {
      id: number;
      name: string;
      level: string | null;
      attendanceTotal: number;
      attendancePresent: number;
      hifzPages: number;
      reviewPages: number;
      matnProgress: number;
      ratingSum: number;
      ratingCount: number;
      lastMemorized: string | null;
    }
  >();

  for (const enrollment of circle.enrollments) {
    const level = enrollment.student.studentProfile?.level ?? null;
    if (level) {
      levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
    }
    studentMap.set(enrollment.studentId, {
      id: enrollment.student.id,
      name: enrollment.student.fullName,
      level,
      attendanceTotal: 0,
      attendancePresent: 0,
      hifzPages: 0,
      reviewPages: 0,
      matnProgress: 0,
      ratingSum: 0,
      ratingCount: 0,
      lastMemorized: null
    });
  }

  for (const row of attendanceRows) {
    const studentId = row.student.id;
    const current = studentMap.get(studentId);
    if (!current) continue;
    current.attendanceTotal += 1;
    if (row.status === AttendanceStatus.PRESENT || row.status === AttendanceStatus.LATE) {
      current.attendancePresent += 1;
    }
  }

  for (const row of followUps) {
    const current = studentMap.get(row.studentId ?? 0);
    if (!current) continue;

    const pages = row.pagesCount ? Number(row.pagesCount) : 0;
    if (row.type === "NEW_MEMORIZATION") {
      current.hifzPages += pages;
      if (row.toSurah && row.toAyah) {
        current.lastMemorized = `${row.surah ?? row.toSurah} - آية ${row.toAyah}`;
      }
    } else if (row.type === "REVIEW") {
      current.reviewPages += pages;
    } else {
      current.matnProgress += 1;
    }

    if (typeof row.rating === "number") {
      current.ratingSum += Number(row.rating);
      current.ratingCount += 1;
    }
  }

  const previousPagesByStudent = previousFollowUps.reduce<Map<number, number>>((acc, row) => {
    acc.set(row.studentId ?? 0, (acc.get(row.studentId ?? 0) ?? 0) + Number(row.pagesCount ?? 0));
    return acc;
  }, new Map<number, number>());

  const students = Array.from(studentMap.values()).map((student) => {
    const attendanceRate =
      student.attendanceTotal > 0
        ? Number(((student.attendancePresent / student.attendanceTotal) * 100).toFixed(2))
        : 0;
    const averageRating =
      student.ratingCount > 0 ? Number((student.ratingSum / student.ratingCount).toFixed(2)) : 0;
    const achievementScore = Math.round(attendanceRate * 0.4 + student.hifzPages * 4 + averageRating * 12);
    const previousPages = previousPagesByStudent.get(student.id) ?? 0;

    return {
      id: student.id,
      name: student.name,
      level: student.level,
      attendanceRate,
      attendancePresent: student.attendancePresent,
      attendanceTotal: student.attendanceTotal,
      hifzPages: round2(student.hifzPages),
      reviewPages: round2(student.reviewPages),
      matnProgress: student.matnProgress,
      averageRating,
      achievementScore,
      trendPagesDelta: round2(student.hifzPages - previousPages),
      lastMemorized: student.lastMemorized
    };
  });

  students.sort((a, b) => b.achievementScore - a.achievementScore);
  const bestStudent = students[0] ?? null;
  const mostImproved = [...students].sort((a, b) => b.trendPagesDelta - a.trendPagesDelta)[0] ?? null;

  const totalAttendanceRecords = attendanceRows.length;
  const presentAttendanceRecords = attendanceRows.filter(
    (row) => row.status === AttendanceStatus.PRESENT || row.status === AttendanceStatus.LATE
  ).length;
  const memorizationPages = followUps
    .filter((row) => row.type === "NEW_MEMORIZATION")
    .reduce((sum, row) => sum + Number(row.pagesCount ?? 0), 0);
  const reviewPages = followUps
    .filter((row) => row.type === "REVIEW")
    .reduce((sum, row) => sum + Number(row.pagesCount ?? 0), 0);
  const ratedRows = followUps.filter((row) => typeof row.rating === "number");
  const attendanceRate =
    totalAttendanceRecords > 0
      ? Number(((presentAttendanceRecords / totalAttendanceRecords) * 100).toFixed(2))
      : 0;
  const averageRating =
    ratedRows.length > 0
      ? Number(
          (
            ratedRows.reduce((sum, row) => sum + Number(row.rating ?? 0), 0) / ratedRows.length
          ).toFixed(2)
        )
      : 0;

  const totalPlanPages = plans.reduce(
    (sum, row) => sum + Number(row.hifzTargetPages ?? 0) + Number(row.reviewTargetPages ?? 0),
    0
  );
  const executedPlanPages = memorizationPages + reviewPages;
  const completionRate =
    totalPlanPages > 0 ? Number(((executedPlanPages / totalPlanPages) * 100).toFixed(2)) : 0;

  return {
    circle: {
      id: circle.id,
      centerId: circle.centerId,
      name: circle.name,
      teacherName: circle.teacher?.fullName ?? null,
      totalStudents: circle.enrollments.length
    },
    period: {
      month: window.month,
      year: window.year,
      from: window.from.toISOString(),
      to: window.to.toISOString()
    },
    summary: {
      overallGrade: scoreToGradeLabel(Math.round((attendanceRate + completionRate) / 2)),
      completionRate,
      attendanceRate,
      averageRating,
      memorizationPages: round2(memorizationPages),
      reviewPages: round2(reviewPages),
      totalStudents: circle.enrollments.length,
      activitiesCount: activities.length,
      bestStudent,
      mostImproved,
      levelsDistribution: Array.from(levelCounts.entries()).map(([level, count]) => ({
        level,
        count
      }))
    },
    students,
    activities: activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      type: activity.activityType,
      activityDate: activity.activityDate.toISOString(),
      participantsCount: activity.participants.length
    }))
  };
};

export const reportsService = {
  async catalog(scope: ScopeContext) {
    const all = [ReportType.ATTENDANCE, ReportType.FOLLOW_UP, ReportType.EXAMS, ReportType.FINANCE];

    const available = all.filter((reportType) => {
      try {
        reportsDomain.assertReportAccess(scope, reportType);
        return true;
      } catch {
        return false;
      }
    });

    return available.map((reportType) => ({
      reportType,
      title: reportTitleMap[reportType],
      formats: [ReportFileKind.PDF, ReportFileKind.XLSX],
      filters:
        reportType === ReportType.FINANCE
          ? ["from", "to", "centerId", "status"]
          : reportType === ReportType.EXAMS
            ? ["from", "to", "centerId", "circleId", "examStatus"]
            : reportType === ReportType.FOLLOW_UP
              ? ["from", "to", "centerId", "circleId", "actorRole"]
              : ["from", "to", "centerId", "circleId"]
    }));
  },

  async attendance(scope: ScopeContext, filters: ReportFilterInput) {
    return attendanceReport(scope, filters);
  },

  async supervisorDashboard(scope: ScopeContext, filters: ReportFilterInput) {
    return supervisorDashboardReport(scope, filters);
  },

  async teacherMonthlyHalqa(
    scope: ScopeContext,
    query: { circleId?: number; month?: number; year?: number }
  ) {
    return buildTeacherMonthlyHalqaData(scope, query);
  },

  async followUp(scope: ScopeContext, filters: ReportFilterInput) {
    return followUpReport(scope, filters);
  },

  async exams(scope: ScopeContext, filters: ReportFilterInput) {
    return examsReport(scope, filters);
  },

  async finance(scope: ScopeContext, filters: ReportFilterInput) {
    return financeReport(scope, filters);
  },

  async student(
    scope: ScopeContext,
    studentId: number,
    query?: { centerId?: number; circleId?: number; month?: number; year?: number }
  ) {
    const student = await reportsRepository.findStudentById({
      organizationId: scope.organizationId,
      studentId
    });

    if (!student) {
      throw new AppError("الطالب غير موجود", 404);
    }

    if (scope.role === Role.STUDENT && scope.userId !== studentId) {
      throw new AppError("تقرير الطالب خارج نطاق صلاحياتك", 403);
    }

    if (scope.role === Role.PARENT) {
      const linked = await reportsRepository.isParentLinkedToStudent({
        parentId: scope.userId,
        studentId
      });

      if (!linked) {
        throw new AppError("تقرير الطالب خارج نطاق صلاحياتك", 403);
      }
    }

    if (query?.centerId && scope.role !== Role.PARENT && scope.role !== Role.STUDENT) {
      ensureCenterAllowed(scope, query.centerId);
    }

    if (query?.circleId && scope.role !== Role.PARENT && scope.role !== Role.STUDENT) {
      ensureCircleAllowed(scope, query.circleId);
    }

    if (
      query?.centerId ||
      query?.circleId ||
      (!scope.allAccess && scope.role !== Role.PARENT && scope.role !== Role.STUDENT)
    ) {
      if (
        !scope.allAccess &&
        scope.role !== Role.PARENT &&
        scope.role !== Role.STUDENT &&
        scope.centerIds.length === 0 &&
        scope.circleIds.length === 0
      ) {
        throw new AppError("تقرير الطالب خارج نطاق صلاحياتك", 403);
      }
      
      const hasValidEnrollment = await prisma.studentCircleEnrollment.findFirst({
        where: {
          studentId,
          circle: {
            center: {
              organizationId: scope.organizationId,
              ...(query?.centerId ? { id: query.centerId } : {})
            },
            ...(query?.circleId ? { id: query.circleId } : {}),
            ...(!scope.allAccess && scope.role !== Role.PARENT && scope.role !== Role.STUDENT
              ? {
                  OR: [
                    ...(scope.circleIds.length > 0 ? [{ id: { in: scope.circleIds } }] : []),
                    ...(scope.centerIds.length > 0 ? [{ centerId: { in: scope.centerIds } }] : [])
                  ]
                }
              : {})
          }
        }
      });
      
      if (!hasValidEnrollment) {
        throw new AppError("تقرير الطالب خارج نطاق صلاحياتك", 403);
      }
    }

    const centerScope = query?.centerId
      ? [query.centerId]
      : scope.allAccess || scope.role === Role.PARENT || scope.role === Role.STUDENT
        ? undefined
        : scope.centerIds;
    const circleScope = query?.circleId
      ? [query.circleId]
      : scope.allAccess || scope.role === Role.PARENT || scope.role === Role.STUDENT
        ? undefined
        : scope.circleIds;
    const window = resolveMonthWindow(query?.month, query?.year);

    const [attendanceRows, followUpRows, examRows, monthlyPlan, activities] = await Promise.all([
      reportsRepository.studentAttendanceRows({
        organizationId: scope.organizationId,
        studentId,
        centerIds: centerScope,
        circleIds: circleScope,
        range: { from: window.from, to: window.to }
      }),
      reportsRepository.studentFollowUpRows({
        organizationId: scope.organizationId,
        studentId,
        centerIds: centerScope,
        circleIds: circleScope,
        range: { from: window.from, to: window.to }
      }),
      reportsRepository.studentExamRows({
        organizationId: scope.organizationId,
        studentId,
        centerIds: centerScope,
        circleIds: circleScope,
        range: { from: window.from, to: window.to }
      }),
      prisma.monthlyPlan.findFirst({
        where: {
          organizationId: scope.organizationId,
          studentId,
          month: window.month,
          year: window.year,
          ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
          ...(circleScope?.length ? { circleId: { in: circleScope } } : {})
        },
        select: {
          id: true,
          month: true,
          year: true,
          status: true,
          hifzFromSurah: true,
          hifzFromAyah: true,
          hifzToSurah: true,
          hifzToAyah: true,
          hifzTargetPages: true,
          reviewFromSurah: true,
          reviewFromAyah: true,
          reviewToSurah: true,
          reviewToAyah: true,
          reviewTargetPages: true
        }
      }),
      prisma.groupActivityParticipant.findMany({
        where: {
          studentId,
          activity: {
            organizationId: scope.organizationId,
            activityDate: {
              gte: window.from,
              lte: window.to
            },
            ...(circleScope?.length ? { circleId: { in: circleScope } } : {}),
            ...(centerScope?.length ? { centerId: { in: centerScope } } : {})
          }
        },
        select: {
          activity: {
            select: {
              id: true,
              title: true,
              activityType: true,
              activityDate: true,
              description: true,
              circle: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })
    ]);



    const attendanceCounts = attendanceRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
    const attendanceTotal = attendanceRows.length;
    const attendancePresent = (attendanceCounts.PRESENT ?? 0) + (attendanceCounts.LATE ?? 0);

    const followUpFinal = followUpRows.filter((item) => item.status === "FINAL").length;
    const ratedFollowUps = followUpRows.filter((item) => typeof item.rating === "number");
    const averageRating = ratedFollowUps.length
      ? ratedFollowUps.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / ratedFollowUps.length
      : 0;

    const reviewedAttempts = examRows.filter((item) => item.status === AttemptStatus.APPROVED);
    const passedAttempts = reviewedAttempts.filter(
      (item) => typeof item.totalScore === "number" && item.totalScore >= item.exam.passScore
    );
    const avgExamScore = reviewedAttempts.length
      ? reviewedAttempts.reduce((sum, item) => sum + Number(item.totalScore ?? 0), 0) / reviewedAttempts.length
      : 0;

    const finalFollowUps = followUpRows.filter((item) => item.status === "FINAL");
    const hifzRows = finalFollowUps.filter((item) => item.type === "NEW_MEMORIZATION");
    const reviewRows = finalFollowUps.filter((item) => item.type === "REVIEW");
    const matnRows = finalFollowUps.filter((item) => item.type !== "NEW_MEMORIZATION" && item.type !== "REVIEW");

    const hifzExecutedPages = hifzRows.reduce((sum, item) => sum + Number(item.pagesCount ?? 0), 0);
    const reviewExecutedPages = reviewRows.reduce((sum, item) => sum + Number(item.pagesCount ?? 0), 0);
    const latestHifz = hifzRows[0] ?? null;
    const overallCompletionRate = Math.round(
      (
        (attendanceTotal > 0 ? (attendancePresent / attendanceTotal) * 40 : 0) +
        (monthlyPlan?.hifzTargetPages ? Math.min(100, (hifzExecutedPages / Number(monthlyPlan.hifzTargetPages)) * 100) * 0.3 : 0) +
        (monthlyPlan?.reviewTargetPages ? Math.min(100, (reviewExecutedPages / Number(monthlyPlan.reviewTargetPages)) * 100) * 0.3 : 0)
      )
    );

    return {
      student,
      period: {
        month: window.month,
        year: window.year,
        from: window.from.toISOString(),
        to: window.to.toISOString()
      },
      kpis: {
        attendance: {
          total: attendanceTotal,
          present: attendancePresent,
          absent: attendanceCounts.ABSENT ?? 0,
          late: attendanceCounts.LATE ?? 0,
          excused: attendanceCounts.EXCUSED ?? 0,
          presentRate: attendanceTotal > 0 ? Number(((attendancePresent / attendanceTotal) * 100).toFixed(2)) : 0
        },
        followUp: {
          total: followUpRows.length,
          draft: followUpRows.length - followUpFinal,
          final: followUpFinal,
          averageRating: Number(averageRating.toFixed(2))
        },
        exams: {
          totalAttempts: examRows.length,
          reviewedAttempts: reviewedAttempts.length,
          passedAttempts: passedAttempts.length,
          passRate: reviewedAttempts.length > 0 ? Number(((passedAttempts.length / reviewedAttempts.length) * 100).toFixed(2)) : 0,
          averageScore: Number(avgExamScore.toFixed(2))
        },
        overallCompletionRate,
        monthlyGrade: scoreToGradeLabel(overallCompletionRate)
      },
      monthlyPlan:
        monthlyPlan === null
          ? null
          : {
              id: monthlyPlan.id,
              month: monthlyPlan.month,
              year: monthlyPlan.year,
              status: monthlyPlan.status,
              hifz: {
                fromSurah: monthlyPlan.hifzFromSurah,
                fromAyah: monthlyPlan.hifzFromAyah,
                toSurah: monthlyPlan.hifzToSurah,
                toAyah: monthlyPlan.hifzToAyah,
                targetPages:
                  monthlyPlan.hifzTargetPages === null ? null : Number(monthlyPlan.hifzTargetPages)
              },
              review: {
                fromSurah: monthlyPlan.reviewFromSurah,
                fromAyah: monthlyPlan.reviewFromAyah,
                toSurah: monthlyPlan.reviewToSurah,
                toAyah: monthlyPlan.reviewToAyah,
                targetPages:
                  monthlyPlan.reviewTargetPages === null ? null : Number(monthlyPlan.reviewTargetPages)
              }
            },
      sections: {
        hifz: {
          plannedPages: monthlyPlan?.hifzTargetPages ? Number(monthlyPlan.hifzTargetPages) : 0,
          executedPages: round2(hifzExecutedPages),
          remainingPages: monthlyPlan?.hifzTargetPages
            ? Math.max(0, round2(Number(monthlyPlan.hifzTargetPages) - hifzExecutedPages))
            : 0,
          completionRate:
            monthlyPlan?.hifzTargetPages && Number(monthlyPlan.hifzTargetPages) > 0
              ? Number(((hifzExecutedPages / Number(monthlyPlan.hifzTargetPages)) * 100).toFixed(2))
              : 0,
          latestReached:
            latestHifz && latestHifz.toSurah && latestHifz.toAyah
              ? {
                  surah: latestHifz.surah,
                  toSurah: latestHifz.toSurah,
                  toAyah: latestHifz.toAyah
                }
              : null
        },
        review: {
          plannedPages: monthlyPlan?.reviewTargetPages ? Number(monthlyPlan.reviewTargetPages) : 0,
          executedPages: round2(reviewExecutedPages),
          remainingPages: monthlyPlan?.reviewTargetPages
            ? Math.max(0, round2(Number(monthlyPlan.reviewTargetPages) - reviewExecutedPages))
            : 0,
          completionRate:
            monthlyPlan?.reviewTargetPages && Number(monthlyPlan.reviewTargetPages) > 0
              ? Number(((reviewExecutedPages / Number(monthlyPlan.reviewTargetPages)) * 100).toFixed(2))
              : 0
        },
        matn: {
          totalRecords: matnRows.length,
          completedRecords: matnRows.filter((item) => item.matnStatus?.toUpperCase() === "COMPLETED").length
        }
      },
      attendance: attendanceRows.map((row) => ({
        ...row,
        attendanceDate: normalizeDate(row.attendanceDate)
      })),
      followUps: followUpRows.map((row) => ({
        ...row,
        recordDate: normalizeDate(row.recordDate),
        pagesCount: row.pagesCount ? Number(row.pagesCount) : null
      })),
      exams: examRows.map((row) => ({
        ...row,
        reviewedAt: row.reviewedAt ? normalizeDate(row.reviewedAt) : null
      })),
      activities: activities.map((item) => ({
        id: item.activity.id,
        title: item.activity.title,
        activityType: item.activity.activityType,
        activityDate: normalizeDate(item.activity.activityDate),
        description: item.activity.description,
        circleName: item.activity.circle.name
      }))
    };
  },

  async export(scope: ScopeContext, input: {
    reportType: ReportType;
    format: ReportFileKind;
    filters: ReportFilterInput;
  }) {
    const run = await reportsRepository.createReportRun({
      organizationId: scope.organizationId,
      centerId: input.filters.centerId,
      circleId: input.filters.circleId,
      reportType: input.reportType,
      requestedById: scope.userId,
      filters: input.filters
    });

    try {
      const result =
        input.reportType === ReportType.ATTENDANCE
          ? await attendanceReport(scope, input.filters)
          : input.reportType === ReportType.FOLLOW_UP
            ? await followUpReport(scope, input.filters)
            : input.reportType === ReportType.EXAMS
              ? await examsReport(scope, input.filters)
              : await financeReport(scope, input.filters);

      const now = new Date();
      const title = reportTitleMap[input.reportType];
      const baseName = `${input.reportType.toLowerCase()}-${now.toISOString().slice(0, 10)}`;

      const buffer =
        input.format === ReportFileKind.PDF
          ? await reportsExport.toPdfBuffer({
              title,
              generatedAt: now,
              kpis: result.kpis,
              rows: result.rows
            })
          : await reportsExport.toExcelBuffer({
              title,
              generatedAt: now,
              kpis: result.kpis,
              rows: result.rows
            });

      const saved = await reportsStorage.saveFile({
        organizationId: scope.organizationId,
        reportType: input.reportType,
        extension: input.format === ReportFileKind.PDF ? "pdf" : "xlsx",
        fileNamePrefix: baseName,
        buffer
      });

      const reportFile = await reportsRepository.createReportFile({
        organizationId: scope.organizationId,
        centerId: input.filters.centerId,
        circleId: input.filters.circleId,
        name: `${baseName}.${input.format === ReportFileKind.PDF ? "pdf" : "xlsx"}`,
        mimeType:
          input.format === ReportFileKind.PDF
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sizeBytes: saved.sizeBytes,
        storageKey: saved.storageKey,
        kind: input.format,
        createdById: scope.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await reportsRepository.markReportRunCompleted({
        runId: run.id,
        outputFileId: reportFile.id,
        summary: {
          rowsCount: result.rows.length,
          kpis: result.kpis
        } as unknown as import("@prisma/client").Prisma.InputJsonValue
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: reportFile.centerId,
        circleId: reportFile.circleId,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.EXPORT,
        entityType: AuditEntityType.REPORT_EXPORT,
        entityId: reportFile.id,
        summary: "تم تصدير تقرير",
        metadata: {
          reportType: input.reportType,
          format: input.format,
          runId: run.id,
          fileId: reportFile.id
        }
      });

      return {
        runId: run.id,
        fileId: reportFile.id,
        status: "COMPLETED",
        downloadUrl: `/reports/exports/${reportFile.id}/download`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export report";
      await reportsRepository.markReportRunFailed({
        runId: run.id,
        errorMessage: message.slice(0, 500)
      });
      throw error;
    }
  },

  async exportTeacherMonthlyHalqa(
    scope: ScopeContext,
    input: { circleId?: number; month?: number; year?: number; format: ReportFileKind }
  ) {
    const report = await buildTeacherMonthlyHalqaData(scope, input);
    const rows = report.students.map((student) => ({
      studentName: student.name,
      level: student.level ?? "-",
      attendanceRate: student.attendanceRate,
      hifzPages: student.hifzPages,
      reviewPages: student.reviewPages,
      averageRating: student.averageRating,
      lastMemorized: student.lastMemorized ?? "-"
    }));

    return saveCustomReportFile({
      scope,
      title: `Teacher Halqa Monthly Report - ${report.circle.name}`,
      baseName: `teacher-halqa-monthly-${report.circle.id}-${report.period.year}-${String(report.period.month).padStart(2, "0")}`,
      format: input.format,
      rows,
      kpis: report.summary as unknown as Record<string, unknown>,
      centerId: report.circle.centerId,
      circleId: report.circle.id
    });
  },

  async exportStudentMonthly(
    scope: ScopeContext,
    studentId: number,
    input: { month?: number; year?: number; format: ReportFileKind }
  ) {
    const report = await this.student(scope, studentId, input);
    const rows = [
      ...report.attendance.map((row) => ({
        section: "attendance",
        date: row.attendanceDate,
        status: row.status,
        note: row.note,
        circleName: row.circle.name,
        centerName: row.circle.center.name
      })),
      ...report.followUps.map((row) => ({
        section: "follow_up",
        date: row.recordDate,
        type: row.type,
        status: row.status,
        surah: row.surah,
        pagesCount: row.pagesCount ? Number(row.pagesCount) : 0,
        rating: row.rating ?? "",
        circleName: row.circle.name
      })),
      ...report.activities.map((row: any) => ({
        section: "activity",
        date: row.activityDate,
        title: row.title,
        type: row.activityType,
        circleName: row.circleName
      }))
    ];

    return saveCustomReportFile({
      scope,
      title: `Student Monthly Report - ${report.student.fullName}`,
      baseName: `student-monthly-${report.student.id}-${report.period.year}-${String(report.period.month).padStart(2, "0")}`,
      format: input.format,
      rows,
      kpis: {
        ...report.kpis.attendance,
        followUpAverageRating: report.kpis.followUp.averageRating,
        examAverageScore: report.kpis.exams.averageScore,
        overallCompletionRate: report.kpis.overallCompletionRate,
        monthlyGrade: report.kpis.monthlyGrade
      },
      centerId: undefined,
      circleId: undefined
    });
  },


  /** REPORTS-1: Centers summary report */
  async centersSummary(scope: ScopeContext) {
    const centerScope = scope.allAccess ? undefined : scope.centerIds;
    const rows = await reportsRepository.centersSummary({
      organizationId: scope.organizationId,
      centerIds: centerScope
    }) as any[];
    return {
      rows: rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        isActive: r.isActive,
        circlesCount: r._count.circles,
        staffCount: r._count.staffAssignments || 0
      })),
      kpis: {
        totalCenters: rows.length,
        activeCenters: rows.filter(r => r.isActive).length,
        inactiveCenters: rows.filter(r => !r.isActive).length,
        totalCircles: rows.reduce((s, r) => s + r._count.circles, 0),
        totalStaff: rows.reduce((s, r) => s + (r._count.staffAssignments || 0), 0)
      }
    };
  },

  /** REPORTS-1: Circles summary report */
  async circlesSummary(scope: ScopeContext, filters: { centerId?: number }) {
    if (filters.centerId) {
      ensureCenterAllowed(scope, filters.centerId);
    }
    const centerScope = filters.centerId ? [filters.centerId] : (scope.allAccess ? undefined : scope.centerIds);
    const circleScope = scope.allAccess ? undefined : scope.circleIds;
    const rows = await reportsRepository.circlesSummary({
      organizationId: scope.organizationId,
      centerIds: centerScope,
      circleIds: circleScope
    }) as any[];
    return {
      rows: rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        centerName: r.center.name,
        teacherName: r.teacher?.fullName ?? "-",
        studentCount: r._count.enrollments
      })),
      kpis: {
        totalCircles: rows.length,
        activeCircles: rows.filter(r => r.isActive).length,
        totalStudents: rows.reduce((s, r) => s + r._count.enrollments, 0)
      }
    };
  },

  /** REPORTS-1: Students summary report */
  async studentsSummary(scope: ScopeContext, filters: { centerId?: number; circleId?: number; activeOnly?: boolean }) {
    if (filters.centerId) {
      ensureCenterAllowed(scope, filters.centerId);
    }
    if (filters.circleId) {
      ensureCircleAllowed(scope, filters.circleId);
    }
    const centerScope = filters.centerId ? [filters.centerId] : (scope.allAccess ? undefined : scope.centerIds);
    const circleScope = filters.circleId ? [filters.circleId] : (scope.allAccess ? undefined : scope.circleIds);
    const rows = await reportsRepository.studentsSummary({
      organizationId: scope.organizationId,
      centerIds: centerScope,
      circleIds: circleScope,
      activeOnly: filters.activeOnly
    });
    return {
      rows: rows.map((r: any) => ({
        id: r.id,
        name: r.fullName,
        isActive: r.isActive,
        level: r.studentProfile?.level ?? "-",
        circleName: r.studentEnrollments?.[0]?.circle?.name ?? "-",
        centerName: r.studentEnrollments?.[0]?.circle?.center?.name ?? "-"
      })),
      kpis: {
        totalStudents: rows.length,
        activeStudents: rows.filter(r => r.isActive).length,
        inactiveStudents: rows.filter(r => !r.isActive).length
      }
    };
  },

  /** REPORTS-1: Golden Records summary report */
  async goldenRecordsSummary(scope: ScopeContext, filters: { centerId?: number }) {
    if (filters.centerId) {
      ensureCenterAllowed(scope, filters.centerId);
    }
    const centerScope = filters.centerId ? [filters.centerId] : (scope.allAccess ? undefined : scope.centerIds);
    const rows = await reportsRepository.goldenRecordsSummary({
      organizationId: scope.organizationId,
      centerIds: centerScope
    });
    return {
      rows: rows.map((r: any) => ({
        id: r.id,
        studentName: r.student?.fullName ?? '-',
        type: r.type,
        narration: r.riwaya ?? "-",
        centerName: r.center?.name ?? "-",
        completionDate: r.examDate ? (new Date(r.examDate)).toISOString().slice(0, 10) : "-"
      })),
      kpis: {
        totalRecords: rows.length,
        byType: rows.reduce<Record<string, number>>((acc, r) => {
          acc[r.type] = (acc[r.type] ?? 0) + 1;
          return acc;
        }, {})
      }
    };
  },

  async getDownloadableExport(scope: ScopeContext, fileId: number) {
    const file = await reportsRepository.findReportFileById({
      fileId,
      organizationId: scope.organizationId
    });

    if (!file) {
      throw new AppError("ملف التصدير غير موجود", 404);
    }

    if (file.expiresAt && file.expiresAt.getTime() < Date.now()) {
      throw new AppError("ملف التصدير منتهي الصلاحية", 404);
    }

    if (
      file.mimeType !== "application/pdf" &&
      file.mimeType !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      throw new AppError("نوع ملف التصدير غير مدعوم", 400);
    }

    if (file.sizeBytes > REPORTS_MAX_FILE_SIZE_BYTES) {
      throw new AppError("ملف التصدير يتجاوز الحد الأقصى المسموح به", 413);
    }

    if (!scope.allAccess) {
      if (scope.role === Role.PARENT) {
        if (file.createdById !== scope.userId) {
          throw new AppError("ملف التصدير خارج نطاق صلاحياتك", 403);
        }
      } else {
        if (file.centerId && !scope.centerIds.includes(file.centerId)) {
          throw new AppError("ملف التصدير خارج نطاق صلاحية المركز", 403);
        }

        if (file.circleId && !scope.circleIds.includes(file.circleId)) {
          throw new AppError("ملف التصدير خارج نطاق صلاحية الحلقة", 403);
        }
      }
    }

    const absolutePath = reportsStorage.resolveAbsolutePath(file.storageKey);
    try {
      await access(absolutePath);
    } catch {
      throw new AppError("ملف التصدير غير موجود في التخزين", 404);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: file.centerId,
      circleId: file.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DOWNLOAD,
      entityType: AuditEntityType.REPORT_EXPORT,
      entityId: file.id,
      summary: "تم تنزيل ملف تقرير",
      metadata: {
        fileId: file.id,
        reportFileName: file.name,
        kind: file.kind
      }
    });

    return {
      file,
      absolutePath
    };
  }
};





