import {
  EnrollmentStatus,
  FollowUpType,
  Prisma
} from "@prisma/client";
import type { FollowUpRecordStatus } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

type ScopeInput = {
  organizationId: number;
  circleId: number;
  allowAll: boolean;
  scopeCircleIds: number[];
  scopeCenterIds: number[];
};

const followUpRecordSelect = {
  id: true,
  studentId: true,
  circleId: true,
  teacherId: true,
  recordDate: true,
  type: true,
  status: true,
  surah: true,
  fromSurah: true,
  fromAyah: true,
  toSurah: true,
  toAyah: true,
  ayahCount: true,
  fromPage: true,
  toPage: true,
  pagesCount: true,
  rating: true,
  matnId: true,
  matnName: true,
  matnStatus: true,
  matnFromRef: true,
  matnToRef: true,
  notes: true,
  finalizedAt: true,
  createdAt: true,
  updatedAt: true,
  lockVersion: true,
  student: {
    select: {
      id: true,
      fullName: true
    }
  },
  teacher: {
    select: {
      id: true,
      fullName: true
    }
  },
  circle: {
    select: {
      id: true,
      name: true,
      center: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.FollowUpRecordSelect;

export type FollowUpRecordItem = Prisma.FollowUpRecordGetPayload<{
  select: typeof followUpRecordSelect;
}>;

export type CreateFollowUpRecordInput = {
  studentId: number;
  teacherId: number;
  circleId: number;
  recordDate: Date;
  type: FollowUpType;
  status: FollowUpRecordStatus;
  surah?: string;
  fromSurah?: number;
  fromAyah?: number;
  toSurah?: number;
  toAyah?: number;
  ayahCount?: number | null;
  fromPage?: number | null;
  toPage?: number | null;
  pagesCount?: Prisma.Decimal | null;
  rating?: number;
  matnId?: number | null;
  matnName?: string;
  matnStatus?: string;
  matnFromRef?: string | null;
  matnToRef?: string | null;
  notes?: string;
  finalizedAt?: Date | null;
};

export type UpdateFollowUpRecordInput = {
  recordDate?: Date;
  type?: FollowUpType;
  surah?: string | null;
  fromSurah?: number | null;
  fromAyah?: number | null;
  toSurah?: number | null;
  toAyah?: number | null;
  ayahCount?: number | null;
  fromPage?: number | null;
  toPage?: number | null;
  pagesCount?: Prisma.Decimal | null;
  rating?: number | null;
  matnId?: number | null;
  matnName?: string | null;
  matnStatus?: string | null;
  matnFromRef?: string | null;
  matnToRef?: string | null;
  notes?: string | null;
  finalizedAt?: Date | null;
};

export const followUpsRepository = {
  async findAccessibleCircle(input: ScopeInput) {
    return prisma.circle.findFirst({
      where: {
        id: input.circleId,
        center: {
          organizationId: input.organizationId
        },
        ...(input.allowAll
          ? {}
          : {
              OR: [
                ...(input.scopeCircleIds.length
                  ? [
                      {
                        id: {
                          in: input.scopeCircleIds
                        }
                      }
                    ]
                  : []),
                ...(input.scopeCenterIds.length
                  ? [
                      {
                        centerId: {
                          in: input.scopeCenterIds
                        }
                      }
                    ]
                  : [])
              ]
            })
      },
      select: {
        id: true,
        centerId: true
      }
    });
  },

  async findCircleIdsByOrganization(organizationId: number) {
    const circles = await prisma.circle.findMany({
      where: {
        center: {
          organizationId,
          isActive: true
        },
        isActive: true
      },
      select: {
        id: true
      }
    });

    return circles.map((item) => item.id);
  },

  async findCircleIdsByCenterIds(organizationId: number, centerIds: number[]) {
    if (!centerIds.length) {
      return [];
    }

    const circles = await prisma.circle.findMany({
      where: {
        centerId: {
          in: centerIds
        },
        center: {
          organizationId,
          isActive: true
        },
        isActive: true
      },
      select: {
        id: true
      }
    });

    return circles.map((item) => item.id);
  },

  async findActiveEnrollment(input: { studentId: number; circleId: number }) {
    return prisma.studentCircleEnrollment.findFirst({
      where: {
        studentId: input.studentId,
        circleId: input.circleId,
        status: EnrollmentStatus.ACTIVE
      },
      select: {
        id: true
      }
    });
  },

  async createRecord(input: CreateFollowUpRecordInput, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.followUpRecord.create({
      data: {
        studentId: input.studentId,
        teacherId: input.teacherId,
        circleId: input.circleId,
        recordDate: input.recordDate,
        type: input.type,
        status: input.status,
        surah: input.surah,
        fromSurah: input.fromSurah,
        fromAyah: input.fromAyah,
        toSurah: input.toSurah,
        toAyah: input.toAyah,
        ayahCount: input.ayahCount,
        fromPage: input.fromPage,
        toPage: input.toPage,
        pagesCount: input.pagesCount,
        rating: input.rating,
        matnId: input.matnId,
        matnName: input.matnName,
        matnStatus: input.matnStatus,
        matnFromRef: input.matnFromRef,
        matnToRef: input.matnToRef,
        notes: input.notes,
        finalizedAt: input.finalizedAt
      },
      select: followUpRecordSelect
    });
  },

  async findRecordById(id: number, organizationId: number) {
    return prisma.followUpRecord.findFirst({
      where: {
        id,
        circle: {
          center: {
            organizationId
          }
        }
      },
      select: followUpRecordSelect
    });
  },

  async updateRecord(id: number, data: UpdateFollowUpRecordInput, lockVersion?: number, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const updated = await db.followUpRecord.updateMany({
      where: lockVersion === undefined ? { id } : { id, lockVersion },
      data: {
        ...data,
        lockVersion: {
          increment: 1
        }
      }
    });

    if (updated.count === 0) {
      return null;
    }

    return prisma.followUpRecord.findUnique({
      where: { id },
      select: followUpRecordSelect
    });
  },

  async finalizeRecord(id: number, lockVersion?: number, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const updated = await db.followUpRecord.updateMany({
      where: lockVersion === undefined ? { id } : { id, lockVersion },
      data: {
        status: "FINAL",
        finalizedAt: new Date(),
        lockVersion: {
          increment: 1
        }
      }
    });

    if (updated.count === 0) {
      return null;
    }

    return db.followUpRecord.findUnique({
      where: { id },
      select: followUpRecordSelect
    });
  },

  async listRecords(where: Prisma.FollowUpRecordWhereInput, page: number, pageSize: number) {
    const [data, total] = await Promise.all([
      prisma.followUpRecord.findMany({
        where,
        orderBy: [{ recordDate: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: followUpRecordSelect
      }),
      prisma.followUpRecord.count({ where })
    ]);

    return {
      data,
      total
    };
  }
};
