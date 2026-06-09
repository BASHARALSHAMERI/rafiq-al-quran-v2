import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./notifications.api";
import type { NotificationsListQuery } from "./types";

const notificationsFiltersKey = (query: NotificationsListQuery) =>
  [
    query.isRead ?? null,
    query.type ?? null,
    query.from ?? null,
    query.to ?? null,
    query.page ?? 1,
    query.pageSize ?? 20
  ] as const;

export const NOTIFICATIONS_QUERY_KEYS = {
  all: ["notifications"] as const,
  list: (query: NotificationsListQuery) =>
    [...NOTIFICATIONS_QUERY_KEYS.all, "list", ...notificationsFiltersKey(query)] as const,
  unreadCount: () => [...NOTIFICATIONS_QUERY_KEYS.all, "unread-count"] as const
};

export const useNotificationsQuery = (query: NotificationsListQuery, enabled = true) => {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEYS.list(query),
    queryFn: () => notificationsApi.list(query),
    placeholderData: keepPreviousData,
    enabled
  });
};

export const useUnreadNotificationsCountQuery = (enabled = true) => {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    enabled,
    staleTime: 60_000
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => notificationsApi.markRead(notificationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: NOTIFICATIONS_QUERY_KEYS.all
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"]
        })
      ]);
    }
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: NOTIFICATIONS_QUERY_KEYS.all
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"]
        })
      ]);
    }
  });
};

