export type FollowUpType = "NEW_MEMORIZATION" | "REVIEW" | "MATN";
export type FollowUpStatus = "DRAFT" | "FINAL";

export type FollowUpRecordItem = {
  id: number;
  studentId: number;
  circleId: number;
  teacherId: number;
  recordDate: string;
  type: FollowUpType;
  status: FollowUpStatus;
  surah: string | null;
  fromSurah: number | null;
  fromAyah: number | null;
  toSurah: number | null;
  toAyah: number | null;
  ayahCount: number | null;
  fromPage: number | null;
  toPage: number | null;
  pagesCount: number | null;
  rating: number | null;
  matnId: number | null;
  matnName: string | null;
  matnStatus: string | null;
  notes: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
  student: {
    id: number;
    fullName: string;
  };
  teacher: {
    id: number;
    fullName: string;
  };
  circle: {
    id: number;
    name: string;
    center: {
      id: number;
      name: string;
    };
  };
};

export type FollowUpsListQuery = {
  centerId?: number;
  circleId?: number;
  studentId?: number;
  from?: string;
  to?: string;
  status?: FollowUpStatus;
  page?: number;
  pageSize?: number;
};

export type FollowUpsListResponse = {
  data: FollowUpRecordItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateFollowUpPayload = {
  studentId: number;
  circleId: number;
  recordDate: string;
  type: FollowUpType;
  status?: FollowUpStatus;
  surah?: string;
  fromSurah?: number;
  fromAyah?: number;
  toSurah?: number;
  toAyah?: number;
  pagesCount?: number;
  rating?: number;
  matnId?: number;
  matnName?: string;
  matnStatus?: string;
  notes?: string;
};

export type UpdateFollowUpPayload = {
  recordDate?: string;
  type?: FollowUpType;
  surah?: string | null;
  fromSurah?: number | null;
  fromAyah?: number | null;
  toSurah?: number | null;
  toAyah?: number | null;
  pagesCount?: number | null;
  rating?: number | null;
  matnId?: number | null;
  matnName?: string | null;
  matnStatus?: string | null;
  notes?: string | null;
  lockVersion?: number;
};
