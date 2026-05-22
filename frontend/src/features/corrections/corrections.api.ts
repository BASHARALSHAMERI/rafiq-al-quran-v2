import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  ApproveCorrectionPayload,
  CorrectionItem,
  CreateCorrectionPayload,
  ListCorrectionsQuery,
  ListCorrectionsResponse,
  RejectCorrectionPayload
} from "./types";

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeItem = (item: CorrectionItem): CorrectionItem => {
  return {
    ...item,
    id: toNumber(item.id),
    organizationId: toNumber(item.organizationId),
    centerId: toNumber(item.centerId),
    circleId: toNumber(item.circleId),
    targetId: toNumber(item.targetId),
    requestedById: toNumber(item.requestedById),
    reviewedById: item.reviewedById === null ? null : toNumber(item.reviewedById),
    appliedById: item.appliedById === null ? null : toNumber(item.appliedById)
  };
};

export const correctionsApi = {
  async list(query: ListCorrectionsQuery): Promise<ListCorrectionsResponse> {
    const response = await apiClient.get<ApiResponse<ListCorrectionsResponse>>("/corrections", {
      params: {
        status: query.status,
        targetType: query.targetType,
        centerId: query.centerId,
        circleId: query.circleId,
        page: query.page,
        pageSize: query.pageSize
      }
    });

    return {
      ...response.data.data,
      data: response.data.data.data.map((item) => normalizeItem(item))
    };
  },

  async create(payload: CreateCorrectionPayload): Promise<CorrectionItem> {
    const response = await apiClient.post<ApiResponse<CorrectionItem>>("/corrections", payload);
    return normalizeItem(response.data.data);
  },

  async approve(correctionId: number, payload: ApproveCorrectionPayload): Promise<CorrectionItem> {
    const response = await apiClient.post<ApiResponse<CorrectionItem>>(
      `/corrections/${correctionId}/approve`,
      payload
    );
    return normalizeItem(response.data.data);
  },

  async reject(correctionId: number, payload: RejectCorrectionPayload): Promise<CorrectionItem> {
    const response = await apiClient.post<ApiResponse<CorrectionItem>>(
      `/corrections/${correctionId}/reject`,
      payload
    );
    return normalizeItem(response.data.data);
  }
};
