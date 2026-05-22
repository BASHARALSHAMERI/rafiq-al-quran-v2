import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  MarkAllNotificationsReadResponse,
  NotificationItem,
  NotificationsListQuery,
  NotificationsListResponse,
  NotificationsUnreadCountResponse
} from "./types";

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeNotification = (item: NotificationItem): NotificationItem => {
  return {
    ...item,
    id: toNumber(item.id),
    organizationId: toNumber(item.organizationId),
    centerId: item.centerId === null ? null : toNumber(item.centerId),
    circleId: item.circleId === null ? null : toNumber(item.circleId),
    recipientUserId: toNumber(item.recipientUserId),
    createdById: item.createdById === null ? null : toNumber(item.createdById),
    recipient: {
      ...item.recipient,
      id: toNumber(item.recipient.id)
    },
    createdBy: item.createdBy
      ? {
          ...item.createdBy,
          id: toNumber(item.createdBy.id)
        }
      : null,
    center: item.center
      ? {
          ...item.center,
          id: toNumber(item.center.id)
        }
      : null,
    circle: item.circle
      ? {
          ...item.circle,
          id: toNumber(item.circle.id)
        }
      : null
  };
};

export const notificationsApi = {
  async list(query: NotificationsListQuery): Promise<NotificationsListResponse> {
    const response = await apiClient.get<ApiResponse<NotificationsListResponse>>("/notifications", {
      params: {
        isRead: query.isRead,
        type: query.type,
        from: query.from,
        to: query.to,
        page: query.page,
        pageSize: query.pageSize
      }
    });

    return {
      ...response.data.data,
      data: response.data.data.data.map((item) => normalizeNotification(item))
    };
  },

  async unreadCount(): Promise<NotificationsUnreadCountResponse> {
    const response = await apiClient.get<ApiResponse<NotificationsUnreadCountResponse>>(
      "/notifications/unread-count"
    );

    return {
      unreadCount: toNumber(response.data.data.unreadCount)
    };
  },

  async markRead(notificationId: number): Promise<NotificationItem> {
    const response = await apiClient.patch<ApiResponse<NotificationItem>>(
      `/notifications/${notificationId}/read`
    );

    return normalizeNotification(response.data.data);
  },

  async markAllRead(): Promise<MarkAllNotificationsReadResponse> {
    const response = await apiClient.patch<ApiResponse<MarkAllNotificationsReadResponse>>(
      "/notifications/read-all"
    );

    return {
      updatedCount: toNumber(response.data.data.updatedCount)
    };
  }
};

