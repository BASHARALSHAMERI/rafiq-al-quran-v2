import {
  AttemptStatus,
  CorrectionRequestStatus,
  CorrectionTargetType,
  Prisma,
  type AttendanceStatus,
  type FollowUpType
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

const correctionSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  targetType: true,
  targetId: true,
  requestedById: true,
  requestedByRole: true,
  reason: true,
  proposedChanges: true,
  currentSnapshot: true,
  status: true,
  reviewedById: true,
  reviewNote: true,
  reviewedAt: true,
  appliedById: true,
  appliedAt: true,
  createdAt: true,
  updatedAt: true,
  requestedBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  reviewedBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  appliedBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  }
} satisfies Prisma.CorrectionRequestSelect;

export type CorrectionItem = Prisma.CorrectionRequestGetPayload<{ select: typeof correctionSelect }>;

const attendanceTargetSelect = {
  id: true,
  studentId: true,
  circleId: true,
  attendanceDate: true,
  status: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  lockVersion: true,
  circle: {
    select: {
      centerId: true
    }
  }
} satisfies Prisma.AttendanceRecordSelect;

const followUpTargetSelect = {
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
  notes: true,
  finalizedAt: true,
  createdAt: true,
  updatedAt: true,
  lockVersion: true,
  circle: {
    select: {
      centerId: true
    }
  }
} satisfies Prisma.FollowUpRecordSelect;

const examAttemptTargetSelect = {
  id: true,
  examId: true,
  studentId: true,
  circleId: true,
  committeeNotes: true,
  totalScore: true,
  gradeLabel: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  lockVersion: true,
  exam: {
    select: {
      centerId: true
    }
  },
  circle: {
    select: {
      centerId: true
    }
  },
  breakdown: {
    select: {
      id: true,
      memorizationScore: true,
      tajweedScore: true,
      theoreticalTajweedScore: true,
      performanceScore: true,
      promptingDeductions: true,
      remindingDeductions: true,
      tajweedDeductions: true,
      strengthNotes: true,
      weaknessNotes: true
    }
  }
} satisfies Prisma.ExamAttemptSelect;

export type AttendanceTarget = Prisma.AttendanceRecordGetPayload<{ select: typeof attendanceTargetSelect }>;
export type FollowUpTarget = Prisma.FollowUpRecordGetPayload<{ select: typeof followUpTargetSelect }>;
export type ExamAttemptTarget = Prisma.ExamAttemptGetPayload<{ select: typeof examAttemptTargetSelect }>;

const withVersionWhere = (id: number, lockVersion?: number | null): Prisma.AttendanceRecordWhereInput => {
  return lockVersion === undefined || lockVersion === null ? { id } : { id, lockVersion };
};

export const correctionsRepository = {
  createCorrection(input: {
    organizationId: number;
    centerId: number;
    circleId: number;
    targetType: CorrectionTargetType;
    targetId: number;
    requestedById: number;
    requestedByRole: import("@prisma/client").Role;
    reason: string;
    proposedChanges: Prisma.InputJsonValue;
    currentSnapshot: Prisma.InputJsonValue;
  }) {
    return prisma.correctionRequest.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        circleId: input.circleId,
        targetType: input.targetType,
        targetId: input.targetId,
        requestedById: input.requestedById,
        requestedByRole: input.requestedByRole,
        reason: input.reason,
        proposedChanges: input.proposedChanges,
        currentSnapshot: input.currentSnapshot
      },
      select: correctionSelect
    });
  },

  listCorrections(input: {
    where: Prisma.CorrectionRequestWhereInput;
    page: number;
    pageSize: number;
  }) {
    return Promise.all([
      prisma.correctionRequest.findMany({
        where: input.where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: correctionSelect
      }),
      prisma.correctionRequest.count({ where: input.where })
    ]).then(([data, total]) => ({ data, total }));
  },

  findCorrectionById(input: { id: number; organizationId: number }) {
    return prisma.correctionRequest.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId
      },
      select: correctionSelect
    });
  },

  approveCorrection(input: {
    id: number;
    reviewedById: number;
    reviewNote?: string;
    status: "APPROVED" | "APPLIED";
    appliedById?: number;
    appliedAt?: Date;
  }) {
    return prisma.correctionRequest.update({
      where: { id: input.id },
      data: {
        status: input.status,
        reviewedById: input.reviewedById,
        reviewNote: input.reviewNote ?? null,
        reviewedAt: new Date(),
        appliedById: input.appliedById ?? null,
        appliedAt: input.appliedAt ?? null
      },
      select: correctionSelect
    });
  },

  rejectCorrection(input: { id: number; reviewedById: number; reviewNote: string }) {
    return prisma.correctionRequest.update({
      where: { id: input.id },
      data: {
        status: CorrectionRequestStatus.REJECTED,
        reviewedById: input.reviewedById,
        reviewNote: input.reviewNote,
        reviewedAt: new Date()
      },
      select: correctionSelect
    });
  },

  findAttendanceTarget(input: { id: number; organizationId: number }) {
    return prisma.attendanceRecord.findFirst({
      where: {
        id: input.id,
        circle: {
          center: {
            organizationId: input.organizationId
          }
        }
      },
      select: attendanceTargetSelect
    });
  },

  findFollowUpTarget(input: { id: number; organizationId: number }) {
    return prisma.followUpRecord.findFirst({
      where: {
        id: input.id,
        circle: {
          center: {
            organizationId: input.organizationId
          }
        }
      },
      select: followUpTargetSelect
    });
  },

  findExamAttemptTarget(input: { id: number; organizationId: number }) {
    return prisma.examAttempt.findFirst({
      where: {
        id: input.id,
        exam: {
          organizationId: input.organizationId
        }
      },
      select: examAttemptTargetSelect
    });
  },

  async applyAttendanceCorrection(input: {
    id: number;
    lockVersion?: number;
    markedById: number;
    status?: AttendanceStatus;
    note?: string | null;
  }) {
    const result = await prisma.attendanceRecord.updateMany({
      where: withVersionWhere(input.id, input.lockVersion),
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        markedById: input.markedById,
        lockVersion: { increment: 1 }
      }
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.attendanceRecord.findUnique({
      where: { id: input.id },
      select: attendanceTargetSelect
    });
  },

  async applyFollowUpCorrection(input: {
    id: number;
    lockVersion?: number;
    data: {
      recordDate?: Date;
      type?: FollowUpType;
      status?: import("@prisma/client").FollowUpRecordStatus;
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
      notes?: string | null;
      finalizedAt?: Date | null;
    };
  }) {
    const result = await prisma.followUpRecord.updateMany({
      where: input.lockVersion === undefined ? { id: input.id } : { id: input.id, lockVersion: input.lockVersion },
      data: {
        ...input.data,
        lockVersion: { increment: 1 }
      }
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.followUpRecord.findUnique({
      where: { id: input.id },
      select: followUpTargetSelect
    });
  },

  async applyExamAttemptCorrection(input: {
    id: number;
    lockVersion?: number;
    reviewedById: number;
    attemptData: {
      committeeNotes?: string | null;
      totalScore?: number | null;
      gradeLabel?: string | null;
      status?: AttemptStatus;
      reviewedAt?: Date | null;
    };
    breakdownData?: {
      memorizationScore?: number | null;
      tajweedScore?: number | null;
      theoreticalTajweedScore?: number | null;
      performanceScore?: number | null;
      promptingDeductions?: number | null;
      remindingDeductions?: number | null;
      tajweedDeductions?: number | null;
      strengthNotes?: string | null;
      weaknessNotes?: string | null;
    };
  }) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.examAttempt.updateMany({
        where: input.lockVersion === undefined ? { id: input.id } : { id: input.id, lockVersion: input.lockVersion },
        data: {
          ...input.attemptData,
          evaluatedById: input.reviewedById,
          lockVersion: { increment: 1 }
        }
      });

      if (result.count === 0) {
        return null;
      }

      if (input.breakdownData) {
        await tx.examAttemptBreakdown.upsert({
          where: { attemptId: input.id },
          create: {
            attemptId: input.id,
            memorizationScore: input.breakdownData.memorizationScore ?? null,
            tajweedScore: input.breakdownData.tajweedScore ?? null,
            theoreticalTajweedScore: input.breakdownData.theoreticalTajweedScore ?? null,
            performanceScore: input.breakdownData.performanceScore ?? null,
            promptingDeductions: input.breakdownData.promptingDeductions ?? null,
            remindingDeductions: input.breakdownData.remindingDeductions ?? null,
            tajweedDeductions: input.breakdownData.tajweedDeductions ?? null,
            strengthNotes: input.breakdownData.strengthNotes ?? null,
            weaknessNotes: input.breakdownData.weaknessNotes ?? null
          },
          update: {
            memorizationScore: input.breakdownData.memorizationScore ?? null,
            tajweedScore: input.breakdownData.tajweedScore ?? null,
            theoreticalTajweedScore: input.breakdownData.theoreticalTajweedScore ?? null,
            performanceScore: input.breakdownData.performanceScore ?? null,
            promptingDeductions: input.breakdownData.promptingDeductions ?? null,
            remindingDeductions: input.breakdownData.remindingDeductions ?? null,
            tajweedDeductions: input.breakdownData.tajweedDeductions ?? null,
            strengthNotes: input.breakdownData.strengthNotes ?? null,
            weaknessNotes: input.breakdownData.weaknessNotes ?? null
          }
        });
      }

      return tx.examAttempt.findUnique({
        where: { id: input.id },
        select: examAttemptTargetSelect
      });
    });
  }
};
