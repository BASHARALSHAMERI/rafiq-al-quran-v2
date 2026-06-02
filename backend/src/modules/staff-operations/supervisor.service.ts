import { Role } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { ScopeContext } from "../../shared/types/auth.types";

const getMonthBounds = (month: number, year: number) => {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { from, to };
};

export const supervisorService = {
  async getDashboard(
    scope: ScopeContext,
    params: { supervisorId?: number; month: number; year: number }
  ) {
    const targetUserId = params.supervisorId ?? scope.userId;

    if (scope.role === Role.SUPERVISOR && targetUserId !== scope.userId) {
      throw new AppError("Forbidden", 403, undefined, "FORBIDDEN");
    }

    const { from, to } = getMonthBounds(params.month, params.year);

    const [profile, centerAssignments, visits, visitPlans] = await Promise.all([
      prisma.supervisorProfile.findUnique({
        where: { userId: targetUserId },
        select: {
          monthlyHoursTarget: true,
          monthlyVisitsTarget: true,
          status: true,
          user: { select: { id: true, fullName: true } }
        }
      }),

      prisma.centerSupervisor.findMany({
        where: { supervisorUserId: targetUserId, isActive: true },
        select: {
          centerId: true,
          center: { select: { id: true, name: true } }
        }
      }),

      prisma.supervisorVisitLog.findMany({
        where: {
          supervisorId: targetUserId,
          organizationId: scope.organizationId,
          startedAt: { gte: from, lte: to }
        },
        select: {
          id: true,
          centerId: true,
          circleId: true,
          startedAt: true,
          endedAt: true,
          durationMinutes: true,
          rating: true,
          observations: true,
          center: { select: { name: true } },
          circle: { select: { name: true } }
        },
        orderBy: { startedAt: "desc" }
      }),

      prisma.supervisorVisitPlan.findMany({
        where: {
          supervisorId: targetUserId,
          organizationId: scope.organizationId,
          month: params.month,
          year: params.year
        },
        select: {
          id: true,
          centerId: true,
          status: true,
          center: { select: { name: true } },
          items: {
            select: {
              id: true,
              centerId: true,
              circleId: true,
              plannedDate: true,
              priority: true,
              status: true,
              center: { select: { name: true } },
              circle: { select: { name: true } }
            }
          }
        }
      })
    ]);

    const monthlyHoursTarget = profile?.monthlyHoursTarget ?? 80;
    const monthlyVisitsTarget = profile?.monthlyVisitsTarget ?? 20;

    const assignedCenterIds = centerAssignments.map((ca) => ca.centerId);

    const assignedCircles = assignedCenterIds.length
      ? await prisma.circle.findMany({
          where: { centerId: { in: assignedCenterIds }, isActive: true },
          select: {
            id: true,
            name: true,
            centerId: true,
            center: { select: { name: true } }
          }
        })
      : [];

    const completedVisits = visits.filter((v) => v.endedAt !== null).length;
    const inProgressVisits = visits.filter((v) => v.endedAt === null).length;
    const totalMinutes = visits.reduce((sum, v) => sum + (v.durationMinutes ?? 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    const visitedCircleIds = new Set(visits.map((v) => v.circleId).filter(Boolean) as number[]);
    const visitedCenterIds = new Set(visits.map((v) => v.centerId));
    const unvisitedCircles = assignedCircles.filter((c) => !visitedCircleIds.has(c.id));
    const unvisitedCenters = centerAssignments
      .map((ca) => ca.center)
      .filter((c) => !visitedCenterIds.has(c.id));

    const allPlanItems = visitPlans.flatMap((p) => p.items);
    const planPending = allPlanItems.filter((i) => i.status === "VISIT_ITEM_PENDING").length;
    const planMissed = allPlanItems.filter((i) => i.status === "VISIT_ITEM_MISSED").length;
    const planCompleted = allPlanItems.filter((i) => i.status === "VISIT_ITEM_COMPLETED").length;

    return {
      profile: {
        userId: targetUserId,
        fullName: profile?.user.fullName ?? "",
        status: profile?.status ?? "ACTIVE",
        monthlyHoursTarget,
        monthlyVisitsTarget
      },
      period: { month: params.month, year: params.year },
      visits: {
        completed: completedVisits,
        inProgress: inProgressVisits,
        total: visits.length,
        target: monthlyVisitsTarget,
        progressPct:
          monthlyVisitsTarget > 0
            ? Math.min(100, Math.round((completedVisits / monthlyVisitsTarget) * 100))
            : 0,
        planPending,
        planMissed,
        planCompleted
      },
      hours: {
        worked: totalHours,
        target: monthlyHoursTarget,
        progressPct:
          monthlyHoursTarget > 0
            ? Math.min(100, Math.round((totalHours / monthlyHoursTarget) * 100))
            : 0
      },
      assignments: {
        centersCount: assignedCenterIds.length,
        circlesCount: assignedCircles.length,
        centerList: centerAssignments.map((ca) => ({
          id: ca.centerId,
          name: ca.center.name
        }))
      },
      unvisitedCircles: unvisitedCircles.map((c) => ({
        id: c.id,
        name: c.name,
        centerName: c.center.name
      })),
      unvisitedCenters: unvisitedCenters.map((c) => ({ id: c.id, name: c.name })),
      recentVisits: visits.slice(0, 10).map((v) => ({
        id: v.id,
        centerName: v.center.name,
        circleName: v.circle?.name ?? null,
        startedAt: v.startedAt,
        endedAt: v.endedAt,
        durationMinutes: v.durationMinutes,
        rating: v.rating,
        observations: v.observations
      })),
      visitPlans: visitPlans.map((p) => ({
        id: p.id,
        centerId: p.centerId,
        centerName: p.center.name,
        status: p.status,
        itemsCount: p.items.length,
        completedItems: p.items.filter((i) => i.status === "VISIT_ITEM_COMPLETED").length
      }))
    };
  },

  async upsertTargets(
    scope: ScopeContext,
    userId: number,
    targets: { monthlyHoursTarget?: number; monthlyVisitsTarget?: number }
  ) {
    if (scope.role === Role.SUPERVISOR && userId !== scope.userId) {
      throw new AppError("Forbidden", 403, undefined, "FORBIDDEN");
    }

    const profile = await prisma.supervisorProfile.findUnique({
      where: { userId },
      select: { userId: true }
    });

    if (!profile) {
      throw new AppError("Supervisor profile not found", 404, undefined, "NOT_FOUND");
    }

    return prisma.supervisorProfile.update({
      where: { userId },
      data: {
        ...(targets.monthlyHoursTarget !== undefined
          ? { monthlyHoursTarget: targets.monthlyHoursTarget }
          : {}),
        ...(targets.monthlyVisitsTarget !== undefined
          ? { monthlyVisitsTarget: targets.monthlyVisitsTarget }
          : {})
      },
      select: {
        userId: true,
        monthlyHoursTarget: true,
        monthlyVisitsTarget: true,
        status: true
      }
    });
  },

  async listSupervisors(scope: ScopeContext) {
    const where =
      scope.centerIds.length > 0 && !scope.allAccess
        ? {
            organizationId: scope.organizationId,
            isActive: true,
            centerSupervisorLinks: {
              some: { centerId: { in: scope.centerIds }, isActive: true }
            }
          }
        : { organizationId: scope.organizationId, role: Role.SUPERVISOR };

    const supervisors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        supervisorProfile: {
          select: {
            monthlyHoursTarget: true,
            monthlyVisitsTarget: true,
            status: true
          }
        },
        centerSupervisorLinks: {
          where: { isActive: true },
          select: { centerId: true, center: { select: { name: true } } }
        }
      }
    });

    return supervisors;
  }
};
