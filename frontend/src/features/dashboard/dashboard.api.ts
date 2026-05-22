import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  ActivityFeedFilters,
  ActivityFeedItem,
  AttendanceSummaryItem,
  DashboardFilters,
  DashboardMetrics
} from "./types";

const normalizeParams = (filters: DashboardFilters | ActivityFeedFilters) => {
  return {
    centerId: filters.centerId,
    circleId: filters.circleId,
    from: filters.from,
    to: filters.to,
    ...("limit" in filters && filters.limit ? { limit: filters.limit } : {})
  };
};

export const dashboardApi = {
  async getMetrics(filters: DashboardFilters): Promise<DashboardMetrics> {
    const response = await apiClient.get<ApiResponse<DashboardMetrics>>(
      "/dashboard/metrics",
      {
        params: normalizeParams(filters)
      }
    );

    return response.data.data;
  },

  async getActivityFeed(filters: ActivityFeedFilters): Promise<ActivityFeedItem[]> {
    const response = await apiClient.get<ApiResponse<ActivityFeedItem[]>>(
      "/dashboard/activity-feed",
      {
        params: normalizeParams(filters)
      }
    );

    return response.data.data;
  },

  async getAttendanceSummary(
    filters: DashboardFilters
  ): Promise<AttendanceSummaryItem[]> {
    const response = await apiClient.get<ApiResponse<AttendanceSummaryItem[]>>(
      "/dashboard/attendance-summary",
      {
        params: normalizeParams(filters)
      }
    );

    return response.data.data;
  }
};