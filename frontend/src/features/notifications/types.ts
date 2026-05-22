import type { Role } from "../auth/types";

export type NotificationType =
  | "EXAM_PUBLISHED"
  | "EXAM_SCORED"
  | "GOLDEN_RECORD_NOMINATION_APPROVED"
  | "LIBRARY_UPLOADED"
  | "INVOICE_ISSUED"
  | "PAYMENT_RECORDED"
  | "REPORT_EXPORTED";

export type NotificationUserRef = {
  id: number;
  fullName: string;
  role: Role;
};

export type NotificationScopeRef = {
  id: number;
  name: string;
};

export type NotificationItem = {
  id: number;
  organizationId: number;
  centerId: number | null;
  circleId: number | null;
  type: NotificationType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  recipientUserId: number;
  isRead: boolean;
  createdById: number | null;
  createdAt: string;
  readAt: string | null;
  center: NotificationScopeRef | null;
  circle: NotificationScopeRef | null;
  recipient: NotificationUserRef;
  createdBy: NotificationUserRef | null;
};

export type NotificationsListQuery = {
  isRead?: boolean;
  type?: NotificationType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type NotificationsListResponse = {
  data: NotificationItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type NotificationsUnreadCountResponse = {
  unreadCount: number;
};

export type MarkAllNotificationsReadResponse = {
  updatedCount: number;
};
