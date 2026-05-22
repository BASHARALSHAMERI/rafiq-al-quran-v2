import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type { CreateGradeScalePayload, GradeScale, UpdateGradeScalePayload } from "./types";

export const gradeScalesApi = {
  async getAll(): Promise<GradeScale[]> {
    const response = await apiClient.get<ApiResponse<GradeScale[]>>("/grade-scales");
    return response.data.data;
  },

  async getActive(): Promise<GradeScale[]> {
    const response = await apiClient.get<ApiResponse<GradeScale[]>>("/grade-scales/active");
    return response.data.data;
  },

  async create(payload: CreateGradeScalePayload): Promise<GradeScale> {
    const response = await apiClient.post<ApiResponse<GradeScale>>("/grade-scales", payload);
    return response.data.data;
  },

  async update(id: number, payload: UpdateGradeScalePayload): Promise<GradeScale> {
    const response = await apiClient.put<ApiResponse<GradeScale>>(`/grade-scales/${id}`, payload);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<{ success: boolean }>>(`/grade-scales/${id}`);
  }
};
