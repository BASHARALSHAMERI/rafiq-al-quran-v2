import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  ExportReportPayload,
  ExportReportResponse,
  ReportsCatalogItem,
  ReportsFilters,
  ReportsPayload,
  ReportType,
  StudentReportPayload
} from "./types";

const toParams = (filters: ReportsFilters) => ({
  from: filters.from,
  to: filters.to,
  centerId: filters.centerId,
  circleId: filters.circleId,
  actorRole: filters.actorRole,
  examStatus: filters.examStatus,
  status: filters.status,
  month: filters.month,
  year: filters.year,
  studentId: filters.studentId
});

export const reportsApi = {
  async getCatalog(): Promise<ReportsCatalogItem[]> {
    const response = await apiClient.get<ApiResponse<ReportsCatalogItem[]>>("/reports/catalog");
    return response.data.data;
  },

  async getReport(reportType: ReportType, filters: ReportsFilters): Promise<ReportsPayload> {
    const route =
      reportType === "ATTENDANCE"
        ? "/reports/attendance"
        : reportType === "FOLLOW_UP"
          ? "/reports/follow-up"
          : reportType === "EXAMS"
            ? "/reports/exams"
            : "/reports/finance";

    const response = await apiClient.get<ApiResponse<ReportsPayload>>(route, {
      params: toParams(filters)
    });

    return response.data.data;
  },



  async getStudentReport(studentId: number, filters: ReportsFilters): Promise<StudentReportPayload> {
    const response = await apiClient.get<ApiResponse<StudentReportPayload>>(
      `/reports/student/${studentId}`,
      {
        params: toParams(filters)
      }
    );
    return response.data.data;
  },

  async exportReport(payload: ExportReportPayload): Promise<ExportReportResponse> {
    const response = await apiClient.post<ApiResponse<ExportReportResponse>>(
      "/reports/export",
      payload
    );

    return response.data.data;
  },


  /** REPORTS-1: Administrative summary endpoints */
  async getCentersSummary(): Promise<{ rows: any[]; kpis: any }> {
    const response = await apiClient.get<ApiResponse<{ rows: any[]; kpis: any }>>("/reports/summary/centers");
    return response.data.data;
  },

  async getCirclesSummary(centerId?: number): Promise<{ rows: any[]; kpis: any }> {
    const response = await apiClient.get<ApiResponse<{ rows: any[]; kpis: any }>>("/reports/summary/circles", {
      params: centerId ? { centerId } : {}
    });
    return response.data.data;
  },

  async getStudentsSummary(filters?: { centerId?: number; circleId?: number; activeOnly?: boolean }): Promise<{ rows: any[]; kpis: any }> {
    const response = await apiClient.get<ApiResponse<{ rows: any[]; kpis: any }>>("/reports/summary/students", {
      params: filters ?? {}
    });
    return response.data.data;
  },

  async getGoldenRecordsSummary(centerId?: number): Promise<{ rows: any[]; kpis: any }> {
    const response = await apiClient.get<ApiResponse<{ rows: any[]; kpis: any }>>("/reports/summary/golden-records", {
      params: centerId ? { centerId } : {}
    });
    return response.data.data;
  },

  getDownloadUrl(fileId: number): string {
    const baseURL = apiClient.defaults.baseURL ?? "";
    return `${baseURL}/reports/exports/${fileId}/download`;
  },

  async downloadExport(fileId: number): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/reports/exports/${fileId}/download`, {
      responseType: "blob"
    });

    return response.data;
  }
};
