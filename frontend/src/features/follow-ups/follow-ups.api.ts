import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  CreateFollowUpPayload,
  FollowUpRecordItem,
  FollowUpsListQuery,
  FollowUpsListResponse,
  UpdateFollowUpPayload
} from "./types";

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRecord = (item: FollowUpRecordItem): FollowUpRecordItem => {
  return {
    ...item,
    id: toNumber(item.id),
    studentId: toNumber(item.studentId),
    circleId: toNumber(item.circleId),
    teacherId: toNumber(item.teacherId),
    fromSurah: item.fromSurah === null ? null : toNumber(item.fromSurah),
    fromAyah: item.fromAyah === null ? null : toNumber(item.fromAyah),
    toSurah: item.toSurah === null ? null : toNumber(item.toSurah),
    toAyah: item.toAyah === null ? null : toNumber(item.toAyah),
    ayahCount: item.ayahCount === null ? null : toNumber(item.ayahCount),
    fromPage: item.fromPage === null ? null : toNumber(item.fromPage),
    toPage: item.toPage === null ? null : toNumber(item.toPage),
    pagesCount: item.pagesCount === null ? null : toNumber(item.pagesCount),
    rating: item.rating === null ? null : toNumber(item.rating),
    matnId: item.matnId === null ? null : toNumber(item.matnId),
    lockVersion: toNumber(item.lockVersion),
    student: {
      ...item.student,
      id: toNumber(item.student.id)
    },
    teacher: {
      ...item.teacher,
      id: toNumber(item.teacher.id)
    },
    circle: {
      ...item.circle,
      id: toNumber(item.circle.id),
      center: {
        ...item.circle.center,
        id: toNumber(item.circle.center.id)
      }
    }
  };
};

export const followUpsApi = {
  async list(query: FollowUpsListQuery): Promise<FollowUpsListResponse> {
    const response = await apiClient.get<ApiResponse<FollowUpsListResponse>>("/follow-ups", {
      params: {
        centerId: query.centerId,
        circleId: query.circleId,
        studentId: query.studentId,
        from: query.from,
        to: query.to,
        status: query.status,
        page: query.page,
        pageSize: query.pageSize
      }
    });

    return {
      ...response.data.data,
      data: response.data.data.data.map((item) => normalizeRecord(item))
    };
  },

  async create(payload: CreateFollowUpPayload): Promise<FollowUpRecordItem> {
    const response = await apiClient.post<ApiResponse<FollowUpRecordItem>>("/follow-ups", payload);
    return normalizeRecord(response.data.data);
  },

  async update(followUpId: number, payload: UpdateFollowUpPayload): Promise<FollowUpRecordItem> {
    const response = await apiClient.patch<ApiResponse<FollowUpRecordItem>>(
      `/follow-ups/${followUpId}`,
      payload
    );
    return normalizeRecord(response.data.data);
  },

  async finalize(followUpId: number): Promise<FollowUpRecordItem> {
    const response = await apiClient.patch<ApiResponse<FollowUpRecordItem>>(
      `/follow-ups/${followUpId}/finalize`
    );
    return normalizeRecord(response.data.data);
  }
};
