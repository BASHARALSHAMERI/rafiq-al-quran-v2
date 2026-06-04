import { VisitPlanStatus, VisitPriority, VisitPlanItemStatus, GeoState, Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { ScopeContext } from "../../shared/types/auth.types";
import { notificationsService } from "../notifications/notifications.service";

const haversineMeters = (input: { fromLat: number; fromLng: number; toLat: number; toLng: number }): number => {
  const R = 6371e3;
  const toRad = (val: number) => (val * Math.PI) / 180;
  const phi1 = toRad(input.fromLat);
  const phi2 = toRad(input.toLat);
  const deltaPhi = toRad(input.toLat - input.fromLat);
  const deltaLambda = toRad(input.toLng - input.fromLng);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const mapGeoState = (distance: number | null, allowedRadius: number | null): GeoState => {
  if (distance === null || allowedRadius === null) return GeoState.NOT_SENT;
  return distance <= allowedRadius ? GeoState.INSIDE : GeoState.OUTSIDE;
};

const toStartOfDay = (dateString: string | Date) => {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const toEndOfDay = (dateString: string | Date) => {
  const date = new Date(dateString);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const mapPlanStatusToDb = (status: VisitPlanStatus | string): VisitPlanStatus => {
  const normalized = String(status).toUpperCase();
  if (normalized === "DRAFT" || normalized === "VISIT_PLAN_DRAFT") return VisitPlanStatus.VISIT_PLAN_DRAFT;
  if (normalized === "ACTIVE" || normalized === "VISIT_PLAN_ACTIVE") return VisitPlanStatus.VISIT_PLAN_ACTIVE;
  if (normalized === "COMPLETED" || normalized === "VISIT_PLAN_COMPLETED") return VisitPlanStatus.VISIT_PLAN_COMPLETED;
  throw new AppError("حالة خطة الزيارة غير صالحة", 400, undefined, "VALIDATION_FAILED");
};

const mapPlanStatusToApi = (status: VisitPlanStatus): "DRAFT" | "ACTIVE" | "COMPLETED" => {
  switch (status) {
    case VisitPlanStatus.VISIT_PLAN_ACTIVE:
      return "ACTIVE";
    case VisitPlanStatus.VISIT_PLAN_COMPLETED:
      return "COMPLETED";
    default:
      return "DRAFT";
  }
};

const mapPlanItemStatusToApi = (status: VisitPlanItemStatus): "PENDING" | "COMPLETED" | "MISSED" => {
  switch (status) {
    case VisitPlanItemStatus.VISIT_ITEM_COMPLETED:
      return "COMPLETED";
    case VisitPlanItemStatus.VISIT_ITEM_MISSED:
      return "MISSED";
    default:
      return "PENDING";
  }
};

const mapGeoStateToApi = (state: GeoState | null | undefined): "VERIFIED" | "OUTSIDE_RANGE" | "NOT_SENT" => {
  if (!state || state === GeoState.NOT_SENT) return "NOT_SENT";
  if (state === GeoState.INSIDE) return "VERIFIED";
  return "OUTSIDE_RANGE";
};

const serializePlanItem = (item: any) => ({
  ...item,
  status: mapPlanItemStatusToApi(item.status),
  plannedDate: item.plannedDate instanceof Date ? item.plannedDate.toISOString().slice(0, 10) : item.plannedDate
});

const serializePlan = (plan: any) => {
  const items = Array.isArray(plan.items) ? plan.items.map(serializePlanItem) : [];
  const completionRate =
    items.length === 0
      ? 0
      : Math.round(
          (items.filter((item: any) => item.status === "COMPLETED").length / items.length) * 100
        );

  return {
    ...plan,
    status: mapPlanStatusToApi(plan.status),
    items,
    completionRate
  };
};

const serializeVisitLog = (log: any) => {
  const geoState = mapGeoStateToApi(log.endGeoState ?? log.startGeoState ?? GeoState.NOT_SENT);
  return {
    ...log,
    category: "VISIT",
    status: log.endedAt ? "COMPLETED" : "PENDING",
    geoState,
    startGeoState: mapGeoStateToApi(log.startGeoState),
    endGeoState: log.endGeoState ? mapGeoStateToApi(log.endGeoState) : null,
    visitType: log.planItemId ? "PLANNED" : "EMERGENCY",
    targetLabel: log.circle?.name ?? log.center?.name ?? "General Visit",
    content: log.observations ?? "",
    checklist: Array.isArray(log.checklist) ? log.checklist : [],
    createdAt: log.createdAt ?? log.startedAt
  };
};

export const supervisorVisitService = {
  // ==========================================
  // Plan Management
  // ==========================================
  async createPlan(scope: ScopeContext, data: { supervisorId: number; centerId: number; month: number; year: number }) {
    const plan = await prisma.supervisorVisitPlan.create({
      data: {
        organizationId: scope.organizationId,
        supervisorId: data.supervisorId,
        centerId: data.centerId,
        month: data.month,
        year: data.year,
        status: VisitPlanStatus.VISIT_PLAN_DRAFT,
        createdById: scope.userId
      },
      include: {
        items: {
          include: {
            center: { select: { id: true, name: true } },
            circle: { select: { id: true, name: true } }
          }
        },
        supervisor: { select: { id: true, fullName: true } },
        center: { select: { id: true, name: true } }
      }
    });

    return serializePlan(plan);
  },

  async updatePlanStatus(scope: ScopeContext, planId: number, status: VisitPlanStatus | string) {
    const existing = await prisma.supervisorVisitPlan.findFirst({
      where: { id: planId, organizationId: scope.organizationId },
      select: { id: true }
    });

    if (!existing) throw new AppError("خطة الزيارة غير موجودة", 404);

    const updated = await prisma.supervisorVisitPlan.update({
      where: { id: planId },
      data: { status: mapPlanStatusToDb(status) },
      include: {
        items: {
          include: {
            center: { select: { id: true, name: true } },
            circle: { select: { id: true, name: true } }
          }
        },
        supervisor: { select: { id: true, fullName: true } },
        center: { select: { id: true, name: true } }
      }
    });

    return serializePlan(updated);
  },

  async listPlans(scope: ScopeContext, query: { supervisorId?: number; month?: number; year?: number; status?: VisitPlanStatus | string }) {
    const whereClause: any = {
      organizationId: scope.organizationId,
      ...(query.supervisorId ? { supervisorId: query.supervisorId } : {}),
      ...(query.month ? { month: query.month } : {}),
      ...(query.year ? { year: query.year } : {})
    };

    if (query.status) {
      whereClause.status = mapPlanStatusToDb(query.status);
    }

    const plans = await prisma.supervisorVisitPlan.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            center: { select: { id: true, name: true } },
            circle: { select: { id: true, name: true } }
          }
        },
        supervisor: { select: { id: true, fullName: true } },
        center: { select: { id: true, name: true } }
      },
      orderBy: [{ year: "desc" }, { month: "desc" }]
    });

    return plans.map(serializePlan);
  },

  // ==========================================
  // Plan Items
  // ==========================================
  async addPlanItem(scope: ScopeContext, planId: number, data: { centerId: number; circleId?: number; plannedDate: string; plannedTimeWindow?: string; priority?: VisitPriority; notes?: string }) {
    const plan = await prisma.supervisorVisitPlan.findFirst({
      where: { id: planId, organizationId: scope.organizationId },
      select: {
        id: true,
        organizationId: true,
        supervisorId: true
      }
    });
    if (!plan) throw new AppError("خطة الزيارة غير موجودة", 404);

    const item = await prisma.supervisorVisitPlanItem.create({
      data: {
        planId,
        centerId: data.centerId,
        circleId: data.circleId ?? null,
        plannedDate: toStartOfDay(data.plannedDate),
        plannedTimeWindow: data.plannedTimeWindow,
        priority: data.priority ?? VisitPriority.NORMAL,
        notes: data.notes,
        status: VisitPlanItemStatus.VISIT_ITEM_PENDING
      },
      include: {
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    await notificationsService.notifySupervisorVisitAssigned({
      organizationId: scope.organizationId,
      centerId: item.centerId,
      circleId: item.circleId,
      recipientUserId: plan.supervisorId,
      planItemId: item.id,
      plannedDate: item.plannedDate.toISOString().slice(0, 10),
      plannedTimeWindow: item.plannedTimeWindow,
      centerName: item.center.name,
      circleName: item.circle?.name ?? null,
      createdById: scope.userId
    });

    return serializePlanItem(item);
  },

  async updatePlanItem(
    scope: ScopeContext,
    itemId: number,
    data: {
      centerId?: number;
      circleId?: number | null;
      plannedDate?: string;
      plannedTimeWindow?: string;
      priority?: VisitPriority;
      notes?: string;
    }
  ) {
    const existing = await prisma.supervisorVisitPlanItem.findFirst({
      where: { id: itemId, plan: { organizationId: scope.organizationId } },
      select: {
        id: true,
        centerId: true,
        plan: {
          select: {
            supervisorId: true
          }
        }
      }
    });
    if (!existing) throw new AppError("عنصر خطة الزيارة غير موجود", 404);

    const nextCenterId = data.centerId ?? existing.centerId;

    if (data.centerId) {
      const center = await prisma.center.findFirst({
        where: {
          id: data.centerId,
          organizationId: scope.organizationId
        },
        select: { id: true }
      });
      if (!center) {
        throw new AppError("المركز غير موجود في نطاق المنظمة", 404);
      }
    }

    if (data.circleId !== undefined && data.circleId !== null) {
      const circle = await prisma.circle.findFirst({
        where: {
          id: data.circleId,
          centerId: nextCenterId,
          center: { organizationId: scope.organizationId }
        },
        select: { id: true }
      });
      if (!circle) {
        throw new AppError("الحلقة غير موجودة في نطاق المركز", 404);
      }
    }

    const item = await prisma.supervisorVisitPlanItem.update({
      where: { id: itemId },
      data: {
        ...(data.centerId ? { centerId: data.centerId } : {}),
        ...(data.centerId !== undefined && data.circleId === undefined ? { circleId: null } : {}),
        ...(data.circleId !== undefined ? { circleId: data.circleId } : {}),
        ...(data.plannedDate ? { plannedDate: toStartOfDay(data.plannedDate) } : {}),
        ...(data.plannedTimeWindow !== undefined ? { plannedTimeWindow: data.plannedTimeWindow } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {})
      },
      include: {
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    await notificationsService.notifySupervisorVisitAssigned({
      organizationId: scope.organizationId,
      centerId: item.centerId,
      circleId: item.circleId,
      recipientUserId: existing.plan.supervisorId,
      planItemId: item.id,
      plannedDate: item.plannedDate.toISOString().slice(0, 10),
      plannedTimeWindow: item.plannedTimeWindow,
      centerName: item.center.name,
      circleName: item.circle?.name ?? null,
      createdById: scope.userId
    });

    return serializePlanItem(item);
  },

  async removePlanItem(scope: ScopeContext, itemId: number) {
    const existing = await prisma.supervisorVisitPlanItem.findFirst({
      where: { id: itemId, plan: { organizationId: scope.organizationId } },
      select: { id: true }
    });
    if (!existing) throw new AppError("عنصر خطة الزيارة غير موجود", 404);

    return prisma.supervisorVisitPlanItem.delete({
      where: { id: itemId }
    });
  },

  // ==========================================
  // Visit Execution
  // ==========================================
  async getTodayVisits(scope: ScopeContext) {
    const today = toStartOfDay(new Date());

    const plannedItems = await prisma.supervisorVisitPlanItem.findMany({
      where: {
        plannedDate: today,
        plan: {
          organizationId: scope.organizationId,
          supervisorId: scope.userId,
          status: VisitPlanStatus.VISIT_PLAN_ACTIVE
        }
      },
      include: {
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    const logs = await prisma.supervisorVisitLog.findMany({
      where: {
        organizationId: scope.organizationId,
        supervisorId: scope.userId,
        startedAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    return { plannedItems, logs };
  },

  async startVisit(scope: ScopeContext, data: { centerId: number; circleId?: number; planItemId?: number; latitude?: number; longitude?: number }) {
    const now = new Date();

    if (data.planItemId) {
      const planItem = await prisma.supervisorVisitPlanItem.findFirst({
        where: {
          id: data.planItemId,
          plan: {
            organizationId: scope.organizationId,
            supervisorId: scope.userId
          }
        },
        select: { id: true }
      });
      if (!planItem) {
        throw new AppError("عنصر الخطة خارج نطاق صلاحياتك", 404);
      }
    }
    
    // Resolve location math
    let targetLat = null;
    let targetLng = null;
    let allowedRadius = null;
    
    const target = await prisma.center.findUnique({ where: { id: data.centerId } });
    if (target) {
      if (data.circleId) {
        const circle = await prisma.circle.findUnique({ where: { id: data.circleId } });
        targetLat = circle?.latitude ? Number(circle.latitude) : (target.latitude ? Number(target.latitude) : null);
        targetLng = circle?.longitude ? Number(circle.longitude) : (target.longitude ? Number(target.longitude) : null);
        allowedRadius = circle?.allowedRadiusMeters ?? target.allowedRadiusMeters ?? null;
      } else {
        targetLat = target.latitude ? Number(target.latitude) : null;
        targetLng = target.longitude ? Number(target.longitude) : null;
        allowedRadius = target.allowedRadiusMeters;
      }
    }

    let distanceMeters: number | null = null;
    if (targetLat !== null && targetLng !== null && data.latitude !== undefined && data.longitude !== undefined) {
      distanceMeters = Math.round(haversineMeters({
        fromLat: data.latitude, fromLng: data.longitude,
        toLat: targetLat, toLng: targetLng
      }));
    }

    const startGeoState = mapGeoState(distanceMeters, allowedRadius);

    return prisma.supervisorVisitLog.create({
      data: {
        organizationId: scope.organizationId,
        supervisorId: scope.userId,
        centerId: data.centerId,
        circleId: data.circleId ?? null,
        planItemId: data.planItemId ?? null,
        startedAt: now,
        startLatitude: data.latitude ?? null,
        startLongitude: data.longitude ?? null,
        startDistanceMeters: distanceMeters,
        startGeoState
      },
      include: {
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });
  },

  async endVisit(scope: ScopeContext, logId: number, data: { latitude?: number; longitude?: number; checklist?: any; rating?: number; observations?: string }) {
    const log = await prisma.supervisorVisitLog.findUnique({ where: { id: logId } });
    if (!log) throw new AppError("سجل الزيارة غير موجود", 404);
    if (log.organizationId !== scope.organizationId || log.supervisorId !== scope.userId) {
      throw new AppError("ليس لديك صلاحية الوصول لسجل الزيارة", 403);
    }
    if (log.endedAt) {
      throw new AppError("الزيارة منتهية بالفعل", 409, undefined, "INVALID_STATE");
    }

    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - log.startedAt.getTime()) / 60000);

    // Geo check
    let targetLat = null;
    let targetLng = null;
    let allowedRadius = null;
    const target = await prisma.center.findUnique({ where: { id: log.centerId } });
    if (target) {
      if (log.circleId) {
        const circle = await prisma.circle.findUnique({ where: { id: log.circleId } });
        targetLat = circle?.latitude ? Number(circle.latitude) : (target.latitude ? Number(target.latitude) : null);
        targetLng = circle?.longitude ? Number(circle.longitude) : (target.longitude ? Number(target.longitude) : null);
        allowedRadius = circle?.allowedRadiusMeters ?? target.allowedRadiusMeters ?? null;
      } else {
        targetLat = target.latitude ? Number(target.latitude) : null;
        targetLng = target.longitude ? Number(target.longitude) : null;
        allowedRadius = target.allowedRadiusMeters;
      }
    }

    let distanceMeters: number | null = null;
    if (targetLat !== null && targetLng !== null && data.latitude !== undefined && data.longitude !== undefined) {
      distanceMeters = Math.round(haversineMeters({
        fromLat: data.latitude, fromLng: data.longitude,
        toLat: targetLat, toLng: targetLng
      }));
    }

    const endGeoState = mapGeoState(distanceMeters, allowedRadius);

    const updated = await prisma.supervisorVisitLog.update({
      where: { id: logId },
      data: {
        endedAt: now,
        durationMinutes,
        endLatitude: data.latitude ?? null,
        endLongitude: data.longitude ?? null,
        endDistanceMeters: distanceMeters,
        endGeoState,
        checklist: data.checklist ?? Prisma.JsonNull,
        rating: data.rating,
        observations: data.observations
      },
      include: {
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    if (updated.planItemId) {
      await prisma.supervisorVisitPlanItem.update({
        where: { id: updated.planItemId },
        data: { status: VisitPlanItemStatus.VISIT_ITEM_COMPLETED }
      });
    }

    return updated;
  },

  async listVisitLogs(scope: ScopeContext, query: { supervisorId?: number; startDate?: string; endDate?: string }) {
    const whereClause: any = {
      organizationId: scope.organizationId,
      ...(query.supervisorId ? { supervisorId: query.supervisorId } : {}),
      ...(query.startDate || query.endDate
        ? {
            startedAt: {
              ...(query.startDate ? { gte: toStartOfDay(query.startDate) } : {}),
              ...(query.endDate ? { lte: toEndOfDay(query.endDate) } : {})
            }
          }
        : {})
    };

    if (scope.role === "SUPERVISOR") {
      whereClause.supervisorId = scope.userId;
    } else if (!scope.allAccess && scope.centerIds.length > 0) {
      whereClause.centerId = { in: scope.centerIds };
    }

    const logs = await prisma.supervisorVisitLog.findMany({
      where: whereClause,
      include: {
        supervisor: { select: { id: true, fullName: true } },
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      },
      orderBy: { startedAt: "desc" }
    });

    return logs.map(serializeVisitLog);
  }
};
