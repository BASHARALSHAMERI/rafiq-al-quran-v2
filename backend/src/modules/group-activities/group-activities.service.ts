import { AppError } from "../../shared/errors/app-error";
import { safeDate } from "../../shared/utils/time";
import type { ScopeContext } from "../../shared/types/auth.types";
import { groupActivitiesRepository } from "./group-activities.repository";
import type { CreateGroupActivityDto, ListGroupActivitiesDto } from "./group-activities.validation";

const toDateOnly = (input: Date): Date => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
};

const serializeActivity = (item: {
  id: number;
  circleId: number;
  teacherId: number;
  activityDate: Date;
  activityType: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: Array<{ studentId: number; student: { id: number; fullName: string } }>;
}) => ({
  id: item.id,
  circleId: item.circleId,
  teacherId: item.teacherId,
  activityDate: item.activityDate.toISOString().slice(0, 10),
  activityType: item.activityType,
  title: item.title,
  description: item.description,
  participantsCount: item.participants.length,
  participants: item.participants.map((p) => ({
    studentId: p.studentId,
    fullName: p.student.fullName
  })),
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString()
});

export const groupActivitiesService = {
  async create(scope: ScopeContext, input: CreateGroupActivityDto) {
    if (scope.role !== "TEACHER" && scope.role !== "SUPERVISOR" && !scope.allAccess) {
      throw new AppError("فقط المعلمون يمكنهم إنشاء أنشطة جماعية", 403);
    }

    const activityDate = toDateOnly(safeDate(input.activityDate, "activityDate"));

    const circle = await groupActivitiesRepository.findCircleWithCenter(
      input.circleId,
      scope.organizationId
    );

    if (!circle) {
      throw new AppError("الحلقة غير موجودة", 404);
    }

    // تحقق من وصول المعلم للحلقة
    if (!scope.allAccess) {
      const hasAccess =
        scope.circleIds.includes(input.circleId) ||
        scope.centerIds.includes(circle.centerId);
      if (!hasAccess) {
        throw new AppError("ليس لديك صلاحية الوصول للحلقة المطلوبة", 403);
      }
    }

    // جلب الطلاب الحاضرين فقط
    const presentRecords = await groupActivitiesRepository.findPresentStudentsForDate(
      input.circleId,
      activityDate
    );

    if (!presentRecords.length) {
      throw new AppError(
        "لا يوجد طلاب حاضرون لهذا اليوم. يرجى تسجيل الحضور أولاً.",
        400,
        undefined,
        "NO_PRESENT_STUDENTS"
      );
    }

    const participantIds = presentRecords.map((r) => r.studentId);

    const activity = await groupActivitiesRepository.create({
      organizationId: scope.organizationId,
      centerId: circle.centerId,
      circleId: input.circleId,
      teacherId: scope.userId,
      activityDate,
      activityType: input.activityType,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      participantIds
    });

    return serializeActivity(activity);
  },

  async list(scope: ScopeContext, query: ListGroupActivitiesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    let circleIds: number[] = [];

    if (query.circleId) {
      if (!scope.allAccess && !scope.circleIds.includes(query.circleId)) {
        throw new AppError("ليس لديك صلاحية", 403);
      }
      circleIds = [query.circleId];
    } else if (scope.allAccess) {
      // جلب جميع الحلقات في المنظمة — نترك where بدون قيد circleId
    } else {
      circleIds = scope.circleIds;
    }

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const fromDate = query.from ? new Date(query.from) : defaultFrom;
    const toDate = query.to ? new Date(query.to) : defaultTo;

    const where = {
      organizationId: scope.organizationId,
      ...(circleIds.length ? { circleId: { in: circleIds } } : {}),
      activityDate: { gte: fromDate, lte: toDate },
      ...(scope.role === "TEACHER" ? { teacherId: scope.userId } : {})
    };

    const result = await groupActivitiesRepository.list(where, page, pageSize);

    return {
      data: result.data.map(serializeActivity),
      page,
      pageSize,
      total: result.total
    };
  },

  async getById(scope: ScopeContext, id: number) {
    const activity = await groupActivitiesRepository.findById(id, scope.organizationId);
    if (!activity) {
      throw new AppError("النشاط غير موجود", 404);
    }
    return serializeActivity(activity);
  }
};
