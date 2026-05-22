import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  CandidateDecisionPayload,
  LinkCandidateExamAttemptPayload,
  CandidateRequiredDecisionPayload,
  CandidatesQuery,
  CreateCandidatePayload,
  CreateGoldenRecordPayload,
  GoldenRecordDecisionPayload,
  GoldenRecordItem,
  GoldenRecordRequiredDecisionPayload,
  GoldenRecordsQuery,
  GoldenRecordStats,
  GoldenRecordStatsQuery,
  GraduationCandidateItem,
  PaginatedList,
  UpdateCandidatePayload,
  UpdateGoldenRecordPayload
} from "./types";

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const goldenRecordsApi = {
  async getCandidates(query: CandidatesQuery): Promise<PaginatedList<GraduationCandidateItem>> {
    const response = await apiClient.get<ApiResponse<PaginatedList<GraduationCandidateItem>>>(
      "/candidates",
      { params: cleanParams(query) }
    );

    return response.data.data;
  },

  async createCandidate(payload: CreateCandidatePayload): Promise<GraduationCandidateItem> {
    const response = await apiClient.post<ApiResponse<GraduationCandidateItem>>(
      "/candidates",
      payload
    );

    return response.data.data;
  },

  async updateCandidate(
    candidateId: number,
    payload: UpdateCandidatePayload
  ): Promise<GraduationCandidateItem> {
    const response = await apiClient.patch<ApiResponse<GraduationCandidateItem>>(
      `/candidates/${candidateId}`,
      payload
    );

    return response.data.data;
  },

  async approveCandidate(
    candidateId: number,
    payload: CandidateDecisionPayload
  ): Promise<GraduationCandidateItem> {
    const response = await apiClient.post<ApiResponse<GraduationCandidateItem>>(
      `/candidates/${candidateId}/approve`,
      payload
    );

    return response.data.data;
  },

  async rejectCandidate(
    candidateId: number,
    payload: CandidateRequiredDecisionPayload
  ): Promise<GraduationCandidateItem> {
    const response = await apiClient.post<ApiResponse<GraduationCandidateItem>>(
      `/candidates/${candidateId}/reject`,
      payload
    );

    return response.data.data;
  },

  async deferCandidate(
    candidateId: number,
    payload: CandidateRequiredDecisionPayload
  ): Promise<GraduationCandidateItem> {
    const response = await apiClient.post<ApiResponse<GraduationCandidateItem>>(
      `/candidates/${candidateId}/defer`,
      payload
    );

    return response.data.data;
  },

  async linkCandidateExamAttempt(
    candidateId: number,
    payload: LinkCandidateExamAttemptPayload
  ): Promise<GraduationCandidateItem> {
    const response = await apiClient.post<ApiResponse<GraduationCandidateItem>>(
      `/candidates/${candidateId}/link-exam-attempt`,
      payload
    );

    return response.data.data;
  },

  async getGoldenRecords(query: GoldenRecordsQuery): Promise<PaginatedList<GoldenRecordItem>> {
    const response = await apiClient.get<ApiResponse<PaginatedList<GoldenRecordItem>>>(
      "/golden-records",
      { params: cleanParams(query) }
    );

    return response.data.data;
  },

  async createGoldenRecord(payload: CreateGoldenRecordPayload): Promise<GoldenRecordItem> {
    const response = await apiClient.post<ApiResponse<GoldenRecordItem>>(
      "/golden-records",
      payload
    );

    return response.data.data;
  },

  async updateGoldenRecord(
    recordId: number,
    payload: UpdateGoldenRecordPayload
  ): Promise<GoldenRecordItem> {
    const response = await apiClient.patch<ApiResponse<GoldenRecordItem>>(
      `/golden-records/${recordId}`,
      payload
    );

    return response.data.data;
  },

  async submitGoldenRecord(
    recordId: number,
    payload: GoldenRecordDecisionPayload
  ): Promise<GoldenRecordItem> {
    const response = await apiClient.post<ApiResponse<GoldenRecordItem>>(
      `/golden-records/${recordId}/submit`,
      payload
    );

    return response.data.data;
  },

  async approveGoldenRecord(
    recordId: number,
    payload: GoldenRecordDecisionPayload
  ): Promise<GoldenRecordItem> {
    const response = await apiClient.post<ApiResponse<GoldenRecordItem>>(
      `/golden-records/${recordId}/approve`,
      payload
    );

    return response.data.data;
  },

  async rejectGoldenRecord(
    recordId: number,
    payload: GoldenRecordRequiredDecisionPayload
  ): Promise<GoldenRecordItem> {
    const response = await apiClient.post<ApiResponse<GoldenRecordItem>>(
      `/golden-records/${recordId}/reject`,
      payload
    );

    return response.data.data;
  },

  async getStats(query: GoldenRecordStatsQuery): Promise<GoldenRecordStats> {
    const response = await apiClient.get<ApiResponse<GoldenRecordStats>>(
      "/golden-records/stats",
      { params: cleanParams(query) }
    );

    return response.data.data;
  }
};
