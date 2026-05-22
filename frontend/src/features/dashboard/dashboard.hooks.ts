import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./dashboard.api";
import type { ActivityFeedFilters, DashboardFilters } from "./types";

const filtersKey = (filters: DashboardFilters) => {
  return [
    filters.centerId ?? null,
    filters.circleId ?? null,
    filters.from ?? null,
    filters.to ?? null
  ];
};

export const DASHBOARD_QUERY_KEYS = {
  all: ["dashboard"] as const,
  metrics: (filters: DashboardFilters) =>
    [...DASHBOARD_QUERY_KEYS.all, "metrics", ...filtersKey(filters)] as const,
  activityFeed: (filters: ActivityFeedFilters) =>
    [
      ...DASHBOARD_QUERY_KEYS.all,
      "activity-feed",
      ...filtersKey(filters),
      filters.limit ?? 20
    ] as const,
  attendanceSummary: (filters: DashboardFilters) =>
    [...DASHBOARD_QUERY_KEYS.all, "attendance-summary", ...filtersKey(filters)] as const
};

export const useDashboardMetricsQuery = (filters: DashboardFilters, enabled: boolean) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.metrics(filters),
    queryFn: () => dashboardApi.getMetrics(filters),
    enabled,
    staleTime: 30_000
  });
};

export const useActivityFeedQuery = (filters: ActivityFeedFilters, enabled: boolean) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.activityFeed(filters),
    queryFn: () => dashboardApi.getActivityFeed(filters),
    enabled,
    staleTime: 15_000
  });
};

export const useAttendanceSummaryQuery = (
  filters: DashboardFilters,
  enabled: boolean
) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.attendanceSummary(filters),
    queryFn: () => dashboardApi.getAttendanceSummary(filters),
    enabled,
    staleTime: 30_000
  });
};
