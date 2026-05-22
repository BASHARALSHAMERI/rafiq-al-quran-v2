import { Role, type Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { safeDate } from "../../shared/utils/time";

export type NotificationsDateRange = {
  from: Date;
  to: Date;
};

const NOTIFICATIONS_ALLOWED_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.PARENT,
  Role.STUDENT
];

const uniqueIds = (values: number[]): number[] => [...new Set(values)];

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const asPositiveInt = (value: unknown): number | undefined => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

export const notificationsDomain = {
  assertCanAccess(scope: ScopeContext) {
    if (!NOTIFICATIONS_ALLOWED_ROLES.includes(scope.role)) {
      throw new AppError("Notifications are restricted for your role", 403);
    }
  },

  resolveDateRange(from?: string, to?: string): NotificationsDateRange | undefined {
    if (!from && !to) {
      return undefined;
    }

    const now = new Date();
    const resolvedFrom = from ? safeDate(from, "from") : new Date(0);
    const resolvedTo = to ? safeDate(to, "to") : now;
    const range = {
      from: startOfDay(resolvedFrom),
      to: endOfDay(resolvedTo)
    };

    if (range.from > range.to) {
      throw new AppError("Date range is invalid: from must be before to", 400);
    }

    return range;
  },

  resolvePagination(page?: number, pageSize?: number) {
    const normalizedPage = page ?? 1;
    const normalizedPageSize = pageSize ?? 20;

    if (normalizedPage <= 0 || normalizedPageSize <= 0) {
      throw new AppError("Pagination values must be positive", 400);
    }

    if (normalizedPageSize > 100) {
      throw new AppError("pageSize must be 100 or less", 400);
    }

    return {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize
    };
  },

  resolveRoleScopeWhere(scope: ScopeContext): Prisma.NotificationWhereInput {
    if (scope.allAccess) {
      return {};
    }

    if (scope.role === Role.PARENT || scope.role === Role.STUDENT) {
      return {};
    }

    if (scope.role === Role.TEACHER) {
      if (!scope.circleIds.length) {
        return { id: { equals: -1 } };
      }

      return {
        circleId: {
          in: scope.circleIds
        }
      };
    }

    const scopedConditions: Prisma.NotificationWhereInput[] = [];

    if (scope.circleIds.length) {
      scopedConditions.push({
        circleId: {
          in: scope.circleIds
        }
      });
    }

    if (scope.centerIds.length) {
      scopedConditions.push({
        circleId: null,
        centerId: {
          in: scope.centerIds
        }
      });
    }

    if (!scopedConditions.length) {
      return { id: { equals: -1 } };
    }

    return {
      OR: scopedConditions
    };
  },

  extractPayloadStudentIds(payload: unknown): number[] {
    if (!payload || typeof payload !== "object") {
      return [];
    }

    const payloadRecord = payload as Record<string, unknown>;
    const ids: number[] = [];

    const pushId = (value: unknown) => {
      const parsed = asPositiveInt(value);

      if (parsed) {
        ids.push(parsed);
      }
    };

    pushId(payloadRecord.studentId);

    if (Array.isArray(payloadRecord.studentIds)) {
      payloadRecord.studentIds.forEach((item) => pushId(item));
    }

    if (payloadRecord.student && typeof payloadRecord.student === "object") {
      pushId((payloadRecord.student as Record<string, unknown>).id);
    }

    if (Array.isArray(payloadRecord.students)) {
      payloadRecord.students.forEach((item) => {
        if (item && typeof item === "object") {
          pushId((item as Record<string, unknown>).id);
        } else {
          pushId(item);
        }
      });
    }

    return uniqueIds(ids);
  },

  isParentNotificationVisible(scope: ScopeContext, payload: unknown): boolean {
    if (scope.role !== Role.PARENT) {
      return true;
    }

    if (!scope.studentIds.length) {
      return false;
    }

    const payloadStudentIds = this.extractPayloadStudentIds(payload);

    if (!payloadStudentIds.length) {
      return false;
    }

    return payloadStudentIds.some((studentId) => scope.studentIds.includes(studentId));
  },

  ensureNotificationVisible(
    scope: ScopeContext,
    notification: {
      organizationId: number;
      centerId: number | null;
      circleId: number | null;
      payload: unknown;
    }
  ) {
    if (scope.organizationId !== notification.organizationId) {
      throw new AppError("Notification is outside your organization", 403);
    }

    if (scope.allAccess) {
      return;
    }

    if (scope.role === Role.PARENT) {
      if (!this.isParentNotificationVisible(scope, notification.payload)) {
        throw new AppError("Notification is outside your child scope", 403);
      }

      return;
    }

    if (scope.role === Role.STUDENT) {
      return;
    }

    if (scope.role === Role.TEACHER) {
      if (!notification.circleId || !scope.circleIds.includes(notification.circleId)) {
        throw new AppError("Notification is outside your circle scope", 403);
      }

      return;
    }

    if (notification.circleId) {
      if (!scope.circleIds.includes(notification.circleId)) {
        throw new AppError("Notification is outside your circle scope", 403);
      }

      return;
    }

    if (notification.centerId) {
      if (!scope.centerIds.includes(notification.centerId)) {
        throw new AppError("Notification is outside your center scope", 403);
      }

      return;
    }

    throw new AppError("Notification is outside your scope", 403);
  }
};
