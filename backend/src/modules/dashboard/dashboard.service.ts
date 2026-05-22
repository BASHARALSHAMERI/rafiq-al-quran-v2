import { AttendanceStatus, type Role } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import type { ScopeContext } from "../../shared/types/auth.types";
import { dashboardDomain } from "./dashboard.domain";
import { dashboardRepository } from "./dashboard.repository";
import { reportsRepository } from "../reports/reports.repository";

type DashboardQuery = {
  role?: Role;
  centerId?: number;
  circleId?: number;
  from?: string;
  to?: string;
};

const resolveScopedCircleIds = async (
  scope: ScopeContext,
  query: DashboardQuery
): Promise<number[]> => {
  if (scope.allAccess) {
    if (query.circleId) {
      return [query.circleId];
    }

    if (query.centerId) {
      return dashboardRepository.findCircleIdsByCenterIds(scope.organizationId, [query.centerId]);
    }

    return dashboardRepository.findCircleIdsByOrganization(scope.organizationId);
  }

  if (query.centerId) {
    ensureCenterAllowed(scope, query.centerId);
  }

  if (query.circleId) {
    ensureCircleAllowed(scope, query.circleId);
  }

  let scopedCircleIds = scope.circleIds;

  if (query.centerId) {
    const centerCircleIds = await dashboardRepository.findCircleIdsByCenterIds(scope.organizationId, [
      query.centerId
    ]);
    scopedCircleIds = dashboardDomain.intersect(scopedCircleIds, centerCircleIds);
  }

  if (query.circleId) {
    scopedCircleIds = dashboardDomain.intersect(scopedCircleIds, [query.circleId]);
  }

  return scopedCircleIds;
};

export const dashboardService = {
  async metrics(scope: ScopeContext, query: DashboardQuery) {
    const range = dashboardDomain.resolveDateRange(query.from, query.to);
    const circleIds = await resolveScopedCircleIds(scope, query);

    const [totalStudents, totalTeachers, totalCircles, attendanceGroups, prevStats] = await Promise.all([
      dashboardRepository.countDistinctStudents(circleIds),
      dashboardRepository.countDistinctTeachers(circleIds),
      dashboardRepository.countCircles(circleIds),
      dashboardRepository.attendanceByStatus(circleIds, range),
      reportsRepository.getPreviousPeriodStats({
        organizationId: scope.organizationId,
        range,
        centerIds: query.centerId ? [query.centerId] : scope.centerIds,
        circleIds,
      })
    ]);

    const totalsByStatus = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };

    for (const row of attendanceGroups) {
      if (row.status === AttendanceStatus.PRESENT) {
        totalsByStatus.present = row._count._all;
      }

      if (row.status === AttendanceStatus.ABSENT) {
        totalsByStatus.absent = row._count._all;
      }

      if (row.status === AttendanceStatus.LATE) {
        totalsByStatus.late = row._count._all;
      }

      if (row.status === AttendanceStatus.EXCUSED) {
        totalsByStatus.excused = row._count._all;
      }
    }

    const attendanceTotal =
      totalsByStatus.present +
      totalsByStatus.absent +
      totalsByStatus.late +
      totalsByStatus.excused;

    const currAvgAttendance = dashboardDomain.attendanceRate(totalsByStatus.present, attendanceTotal);
    const attendanceTrend = currAvgAttendance > prevStats.avgAttendance ? "up" : currAvgAttendance < prevStats.avgAttendance ? "down" : "stable";

    return {
      filters: {
        centerId: query.centerId ?? null,
        circleId: query.circleId ?? null,
        from: range.from,
        to: range.to
      },
      totals: {
        totalStudents,
        totalTeachers,
        totalCircles,
        attendanceTotal,
        attendanceRate: currAvgAttendance,
        attendanceTrend
      },
      attendanceByStatus: totalsByStatus
    };
  },

  async activityFeed(scope: ScopeContext, query: DashboardQuery & { limit: number }) {
    const range = dashboardDomain.resolveDateRange(query.from, query.to);
    const circleIds = await resolveScopedCircleIds(scope, query);

    return dashboardRepository.activityFeed({
      organizationId: scope.organizationId,
      circleIds,
      range,
      limit: query.limit
    });
  },

  async attendanceSummary(scope: ScopeContext, query: DashboardQuery) {
    const range = dashboardDomain.resolveDateRange(query.from, query.to);
    const circleIds = await resolveScopedCircleIds(scope, query);

    const rows = await dashboardRepository.attendanceSummaryByCircle(circleIds, range);

    if (!rows.length) {
      return [];
    }

    const groupedByCircle = new Map<
      number,
      {
        circleId: number;
        circleName: string;
        centerId: number | null;
        centerName: string | null;
        totals: {
          present: number;
          absent: number;
          late: number;
          excused: number;
        };
      }
    >();

    for (const row of rows) {
      const current =
        groupedByCircle.get(row.circleId) ??
        {
          circleId: row.circleId,
          circleName: row.circleName,
          centerId: row.centerId,
          centerName: row.centerName,
          totals: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          }
        };

      if (row.status === AttendanceStatus.PRESENT) {
        current.totals.present += row.count;
      }

      if (row.status === AttendanceStatus.ABSENT) {
        current.totals.absent += row.count;
      }

      if (row.status === AttendanceStatus.LATE) {
        current.totals.late += row.count;
      }

      if (row.status === AttendanceStatus.EXCUSED) {
        current.totals.excused += row.count;
      }

      groupedByCircle.set(row.circleId, current);
    }

    return [...groupedByCircle.values()].map((item) => {
      const total =
        item.totals.present + item.totals.absent + item.totals.late + item.totals.excused;

      return {
        ...item,
        total,
        attendanceRate: dashboardDomain.attendanceRate(item.totals.present, total)
      };
    });
  },

  validateDashboardRole(scope: ScopeContext) {
    const allowed = ["SUPER_ADMIN", "CENTER_ADMIN", "SUPERVISOR", "TEACHER"];

    if (!allowed.includes(scope.role)) {
      throw new AppError("Dashboard access is restricted for your role", 403);
    }
  }
};
