import { Role, type NotificationType, type Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { notificationsDomain } from "./notifications.domain";
import { notificationsRepository } from "./notifications.repository";

type ListNotificationsQuery = {
  isRead?: boolean;
  type?: NotificationType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

const startOfDay = (value: string | Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: string | Date) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const readPayloadString = (payload: Prisma.JsonValue, key: string) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = (payload as Record<string, unknown>)[key];
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
};

const hasNotificationMarker = async (input: {
  organizationId: number;
  recipientUserId: number;
  type: NotificationType;
  markerKey: string;
  markerValue: string;
  when: string | Date;
}) => {
  const existing = await notificationsRepository.listUnpaginated({
    organizationId: input.organizationId,
    recipientUserId: input.recipientUserId,
    type: input.type,
    range: {
      from: startOfDay(input.when),
      to: endOfDay(input.when)
    }
  });

  return existing.some(
    (notification) =>
      readPayloadString(notification.payload, input.markerKey) === input.markerValue
  );
};

const filterParentVisibleNotifications = <
  T extends {
    payload: Prisma.JsonValue;
  }
>(
  scope: ScopeContext,
  items: T[]
): T[] => {
  return items.filter((item) =>
    notificationsDomain.isParentNotificationVisible(scope, item.payload)
  );
};

export const notificationsService = {
  async notifySupervisorVisitAssigned(input: {
    organizationId: number;
    centerId: number;
    circleId?: number | null;
    recipientUserId: number;
    planItemId: number;
    plannedDate: string;
    plannedTimeWindow?: string | null;
    centerName: string;
    circleName?: string | null;
    createdById?: number | null;
  }) {
    const targetLabel = input.circleName?.trim() || input.centerName;
    const timeLabel = input.plannedTimeWindow?.trim()
      ? ` - ${input.plannedTimeWindow.trim()}`
      : "";

    const title = "تمت جدولة زيارة إشرافية";
    const body = `تم تحديد زيارة ميدانية إلى ${targetLabel} بتاريخ ${input.plannedDate}${timeLabel}.`;

    const result = await notificationsRepository.createMany({
      data: [
        {
          organizationId: input.organizationId,
          centerId: input.centerId,
          circleId: input.circleId ?? null,
          type: "SUPERVISOR_VISIT_ASSIGNED",
          title,
          body,
          payload: {
            workflow: "SUPERVISOR_VISIT_PLAN",
            planItemId: input.planItemId,
            centerId: input.centerId,
            circleId: input.circleId ?? null,
            plannedDate: input.plannedDate,
            plannedTimeWindow: input.plannedTimeWindow ?? null,
            targetLabel
          },
          recipientUserId: input.recipientUserId,
          createdById: input.createdById ?? null
        }
      ]
    });

    return { createdCount: result.count };
  },

  async notifyStaffShiftReminder(input: {
    organizationId: number;
    centerId: number;
    circleId?: number | null;
    recipientUserId: number;
    recipientName: string;
    shiftDate: string;
    shiftStartIso: string;
    shiftEndIso: string;
    scheduleKey: string;
    centerName: string;
    circleName?: string | null;
  }) {
    const alreadySent = await hasNotificationMarker({
      organizationId: input.organizationId,
      recipientUserId: input.recipientUserId,
      type: "STAFF_SHIFT_REMINDER",
      markerKey: "scheduleKey",
      markerValue: input.scheduleKey,
      when: input.shiftDate
    });

    if (alreadySent) {
      return { createdCount: 0 };
    }

    const startTime = new Date(input.shiftStartIso).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const endTime = new Date(input.shiftEndIso).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const targetLabel = input.circleName?.trim() || input.centerName;
    const title = "تنبيه دوام وتحضير";
    const body = `دوامك اليوم في ${targetLabel} من ${startTime} إلى ${endTime}. يرجى التحضير والتواجد قبل الموعد.`;

    const result = await notificationsRepository.createMany({
      data: [
        {
          organizationId: input.organizationId,
          centerId: input.centerId,
          circleId: input.circleId ?? null,
          type: "STAFF_SHIFT_REMINDER",
          title,
          body,
          payload: {
            workflow: "STAFF_SHIFT",
            shiftDate: input.shiftDate,
            shiftStartIso: input.shiftStartIso,
            shiftEndIso: input.shiftEndIso,
            scheduleKey: input.scheduleKey,
            centerId: input.centerId,
            circleId: input.circleId ?? null,
            targetLabel
          },
          recipientUserId: input.recipientUserId,
          createdById: null
        }
      ]
    });

    return { createdCount: result.count };
  },

  async notifyStaffLateAlert(input: {
    organizationId: number;
    centerId: number;
    circleId?: number | null;
    recipientUserId: number;
    shiftDate: string;
    shiftStartIso: string;
    lateMarker: string;
    lateMinutes: number;
    centerName: string;
    circleName?: string | null;
  }) {
    const alreadySent = await hasNotificationMarker({
      organizationId: input.organizationId,
      recipientUserId: input.recipientUserId,
      type: "STAFF_LATE_ALERT",
      markerKey: "lateMarker",
      markerValue: input.lateMarker,
      when: input.shiftDate
    });

    if (alreadySent) {
      return { createdCount: 0 };
    }

    const shiftStart = new Date(input.shiftStartIso).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const targetLabel = input.circleName?.trim() || input.centerName;
    const title = "تنبيه تأخر عن الدوام";
    const body = `تم رصد عدم تسجيل حضورك حتى الآن. موعدك في ${targetLabel} كان عند ${shiftStart}، والتأخر الحالي ${input.lateMinutes} دقيقة.`;

    const result = await notificationsRepository.createMany({
      data: [
        {
          organizationId: input.organizationId,
          centerId: input.centerId,
          circleId: input.circleId ?? null,
          type: "STAFF_LATE_ALERT",
          title,
          body,
          payload: {
            workflow: "STAFF_SHIFT",
            shiftDate: input.shiftDate,
            shiftStartIso: input.shiftStartIso,
            lateMinutes: input.lateMinutes,
            lateMarker: input.lateMarker,
            centerId: input.centerId,
            circleId: input.circleId ?? null,
            targetLabel
          },
          recipientUserId: input.recipientUserId,
          createdById: null
        }
      ]
    });

    return { createdCount: result.count };
  },

  async notifyStaffAbsence(input: {
    organizationId: number;
    centerId: number;
    circleId?: number | null;
    recipientUserId: number;
    absenceDate: string;
    absenceMarker: string;
    centerName: string;
    circleName?: string | null;
  }) {
    const alreadySent = await hasNotificationMarker({
      organizationId: input.organizationId,
      recipientUserId: input.recipientUserId,
      type: "STAFF_ABSENCE_MARKED",
      markerKey: "absenceMarker",
      markerValue: input.absenceMarker,
      when: input.absenceDate
    });

    if (alreadySent) {
      return { createdCount: 0 };
    }

    const targetLabel = input.circleName?.trim() || input.centerName;
    const title = "تسجيل غياب تلقائي";
    const body = `تم تسجيل غيابك عن ${targetLabel} بتاريخ ${input.absenceDate} بشكل تلقائي. إذا كان ذلك خطأً يرجى تقديم عذر أو التواصل مع المسؤول.`;

    const result = await notificationsRepository.createMany({
      data: [
        {
          organizationId: input.organizationId,
          centerId: input.centerId,
          circleId: input.circleId ?? null,
          type: "STAFF_ABSENCE_MARKED",
          title,
          body,
          payload: {
            workflow: "STAFF_ATTENDANCE",
            absenceDate: input.absenceDate,
            absenceMarker: input.absenceMarker,
            centerId: input.centerId,
            circleId: input.circleId ?? null,
            targetLabel
          },
          recipientUserId: input.recipientUserId,
          createdById: null
        }
      ]
    });

    return { createdCount: result.count };
  },

  async notifyGoldenRecordNominationApproved(
    input: {
      organizationId: number;
      centerId: number;
      circleId: number;
      candidateId: number;
      studentId: number;
      studentName: string;
      centerName: string;
      circleName: string | null;
      year: number;
      mushafExamDate: Date | null;
      approvedByUserId: number;
    },
    db?: Prisma.TransactionClient
  ) {
    const recipients = await notificationsRepository.findActiveCenterSupervisorRecipients(
      {
        organizationId: input.organizationId,
        centerId: input.centerId
      },
      db
    );

    if (!recipients.length) {
      return { createdCount: 0 };
    }

    const plannedDate = input.mushafExamDate
      ? input.mushafExamDate.toISOString().slice(0, 10)
      : null;
    const targetCircleName = input.circleName ?? "بدون حلقة";
    const title = "اعتماد ترشيح طالب لاختبار المصحف";
    const body = plannedDate
      ? `تم اعتماد ترشيح الطالب ${input.studentName} من ${targetCircleName} في ${input.centerName}. الموعد المخطط لاختبار المصحف: ${plannedDate}.`
      : `تم اعتماد ترشيح الطالب ${input.studentName} من ${targetCircleName} في ${input.centerName}.`;

    const result = await notificationsRepository.createMany(
      {
        data: recipients.map((recipient) => ({
          organizationId: input.organizationId,
          centerId: input.centerId,
          circleId: input.circleId,
          type: "GOLDEN_RECORD_NOMINATION_APPROVED",
          title,
          body,
          payload: {
            workflow: "GOLDEN_RECORD_NOMINATION",
            candidateId: input.candidateId,
            studentId: input.studentId,
            centerId: input.centerId,
            circleId: input.circleId,
            year: input.year,
            mushafExamDate: plannedDate
          },
          recipientUserId: recipient.supervisorUserId,
          createdById: input.approvedByUserId
        }))
      },
      db
    );

    return {
      createdCount: result.count
    };
  },

  async listNotifications(scope: ScopeContext, query: ListNotificationsQuery) {
    notificationsDomain.assertCanAccess(scope);

    const range = notificationsDomain.resolveDateRange(query.from, query.to);
    const pagination = notificationsDomain.resolvePagination(query.page, query.pageSize);

    if (scope.role === Role.PARENT) {
      const all = await notificationsRepository.listUnpaginated({
        organizationId: scope.organizationId,
        recipientUserId: scope.userId,
        isRead: query.isRead,
        type: query.type,
        range
      });
      const scoped = filterParentVisibleNotifications(scope, all);
      const data = scoped.slice(pagination.skip, pagination.skip + pagination.take);

      return {
        data,
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: scoped.length
      };
    }

    const scopedWhere = notificationsDomain.resolveRoleScopeWhere(scope);
    const { items, total } = await notificationsRepository.list({
      organizationId: scope.organizationId,
      recipientUserId: scope.userId,
      isRead: query.isRead,
      type: query.type,
      range,
      scopeWhere: scopedWhere,
      skip: pagination.skip,
      take: pagination.take
    });

    return {
      data: items,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total
    };
  },

  async unreadCount(scope: ScopeContext) {
    notificationsDomain.assertCanAccess(scope);

    if (scope.role === Role.PARENT) {
      const allUnread = await notificationsRepository.listUnpaginated({
        organizationId: scope.organizationId,
        recipientUserId: scope.userId,
        isRead: false
      });

      return {
        unreadCount: filterParentVisibleNotifications(scope, allUnread).length
      };
    }

    const scopedWhere = notificationsDomain.resolveRoleScopeWhere(scope);
    const unreadCount = await notificationsRepository.countUnread({
      organizationId: scope.organizationId,
      recipientUserId: scope.userId,
      scopeWhere: scopedWhere
    });

    return { unreadCount };
  },

  async markRead(scope: ScopeContext, notificationId: number) {
    notificationsDomain.assertCanAccess(scope);

    const existing = await notificationsRepository.findByIdForRecipient({
      id: notificationId,
      organizationId: scope.organizationId,
      recipientUserId: scope.userId
    });

    if (!existing) {
      throw new AppError("Notification not found", 404);
    }

    notificationsDomain.ensureNotificationVisible(scope, existing);

    if (existing.isRead) {
      return existing;
    }

    return notificationsRepository.markRead({
      id: notificationId,
      readAt: new Date()
    });
  },

  async markAllRead(scope: ScopeContext) {
    notificationsDomain.assertCanAccess(scope);

    if (scope.role === Role.PARENT) {
      const unread = await notificationsRepository.listUnpaginated({
        organizationId: scope.organizationId,
        recipientUserId: scope.userId,
        isRead: false
      });
      const ids = filterParentVisibleNotifications(scope, unread).map((item) => item.id);

      const result = await notificationsRepository.markManyReadByIds({
        ids,
        readAt: new Date()
      });

      return {
        updatedCount: result.count
      };
    }

    const scopedWhere = notificationsDomain.resolveRoleScopeWhere(scope);
    const result = await notificationsRepository.markAllRead({
      organizationId: scope.organizationId,
      recipientUserId: scope.userId,
      scopeWhere: scopedWhere,
      readAt: new Date()
    });

    return {
      updatedCount: result.count
    };
  }
};
