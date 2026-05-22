import type { Role } from "../auth/types";

export type CorrectionTargetType = "ATTENDANCE" | "FOLLOW_UP" | "EXAM_ATTEMPT";
export type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED" | "APPLIED" | "CANCELLED";

export type CorrectionItem = {
  id: number;
  organizationId: number;
  centerId: number;
  circleId: number;
  targetType: CorrectionTargetType;
  targetId: number;
  requestedById: number;
  requestedByRole: Role;
  reason: string;
  proposedChanges: Record<string, unknown>;
  currentSnapshot: Record<string, unknown>;
  status: CorrectionStatus;
  reviewedById: number | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  appliedById: number | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListCorrectionsQuery = {
  status?: CorrectionStatus;
  targetType?: CorrectionTargetType;
  centerId?: number;
  circleId?: number;
  page?: number;
  pageSize?: number;
};

export type ListCorrectionsResponse = {
  data: CorrectionItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateCorrectionPayload = {
  targetType: CorrectionTargetType;
  targetId: number;
  reason: string;
  proposedChanges: Record<string, unknown>;
};

export type ApproveCorrectionPayload = {
  applyChanges: boolean;
  reviewNote?: string;
};

export type RejectCorrectionPayload = {
  reviewNote: string;
};
