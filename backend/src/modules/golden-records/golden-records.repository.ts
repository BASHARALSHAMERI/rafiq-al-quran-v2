import {
  EnrollmentStatus,
  GoldenRecordStatus,
  GraduationCandidateStatus,
  Prisma,
  Role
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import {
  activeCircleWhere,
  activeUserWhere
} from "../../shared/policies/active-read.policy";

type DbClient = Prisma.TransactionClient | typeof prisma;

const actorSelect = {
  id: true,
  fullName: true,
  role: true
} satisfies Prisma.UserSelect;

const examSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  title: true,
  type: true,
  purpose: true,
  status: true,
  maxScore: true,
  passScore: true,
  scheduledAt: true
} satisfies Prisma.ExamSelect;

const examAttemptOutcomeSelect = {
  id: true,
  examId: true,
  studentId: true,
  circleId: true,
  status: true,
  totalScore: true,
  gradeLabel: true,
  reviewedAt: true,
  committeeNotes: true,
  exam: {
    select: examSelect
  }
} satisfies Prisma.ExamAttemptSelect;

const candidateSelect = {
  id: true,
  organizationId: true,
  year: true,
  studentId: true,
  centerId: true,
  circleId: true,
  examId: true,
  examAttemptId: true,
  studentNameSnapshot: true,
  centerNameSnapshot: true,
  circleNameSnapshot: true,
  memorizationCompletionDate: true,
  khatmaTestDate: true,
  memorizationStartDate: true,
  memorizationDurationMonths: true,
  gradeSnapshot: true,
  averageSnapshot: true,
  notes: true,
  status: true,
  statusNote: true,
  approvedAt: true,
  rejectedAt: true,
  deferredAt: true,
  createdAt: true,
  updatedAt: true,
  lockVersion: true,
  student: {
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  circle: {
    select: {
      id: true,
      name: true,
      centerId: true
    }
  },
  exam: {
    select: examSelect
  },
  examAttempt: {
    select: examAttemptOutcomeSelect
  },
  goldenRecord: {
    select: {
      id: true,
      status: true,
      type: true,
      year: true,
      registrySerial: true
    }
  },
  approvedBy: {
    select: actorSelect
  },
  rejectedBy: {
    select: actorSelect
  },
  deferredBy: {
    select: actorSelect
  },
  createdBy: {
    select: actorSelect
  },
  updatedBy: {
    select: actorSelect
  }
} satisfies Prisma.GraduationCandidateSelect;

const goldenRecordSelect = {
  id: true,
  organizationId: true,
  year: true,
  source: true,
  candidateId: true,
  examId: true,
  examAttemptId: true,
  studentId: true,
  centerId: true,
  circleId: true,
  studentNameSnapshot: true,
  centerNameSnapshot: true,
  circleNameSnapshot: true,
  registrySerial: true,
  grade: true,
  average: true,
  appreciation: true,
  examDate: true,
  type: true,
  riwaya: true,
  notes: true,
  status: true,
  statusNote: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
  lockVersion: true,
  candidate: {
    select: {
      id: true,
      status: true,
      year: true
    }
  },
  student: {
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  circle: {
    select: {
      id: true,
      name: true,
      centerId: true
    }
  },
  exam: {
    select: examSelect
  },
  examAttempt: {
    select: examAttemptOutcomeSelect
  },
  submittedBy: {
    select: actorSelect
  },
  approvedBy: {
    select: actorSelect
  },
  rejectedBy: {
    select: actorSelect
  },
  createdBy: {
    select: actorSelect
  },
  updatedBy: {
    select: actorSelect
  },
  achievementSnapshot: {
    select: {
      id: true,
      year: true,
      achievementCategory: true,
      juzCount: true,
      snapshotSource: true,
      capturedAt: true
    }
  }
} satisfies Prisma.GoldenRecordSelect;

const studentContextSelect = {
  id: true,
  organizationId: true,
  fullName: true,
  role: true,
  isActive: true,
  studentProfile: {
    select: {
      joinDate: true,
      currentJuzz: true,
      studentStatus: true
    }
  },
  studentEnrollments: {
    where: {
      status: EnrollmentStatus.ACTIVE
    },
    orderBy: [{ startDate: "desc" }, { id: "desc" }],
    select: {
      id: true,
      circleId: true,
      startDate: true,
      circle: {
        select: {
          id: true,
          name: true,
          centerId: true,
          center: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.UserSelect;

const achievementSnapshotSelect = {
  id: true,
  organizationId: true,
  year: true,
  studentId: true,
  centerId: true,
  circleId: true,
  achievementCategory: true,
  juzCount: true,
  goldenRecordId: true,
  snapshotSource: true,
  capturedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  }
} satisfies Prisma.StudentYearlyAchievementSnapshotSelect;

export type CandidateItem = Prisma.GraduationCandidateGetPayload<{ select: typeof candidateSelect }>;
export type GoldenRecordItem = Prisma.GoldenRecordGetPayload<{ select: typeof goldenRecordSelect }>;
export type ExamAttemptOutcome = Prisma.ExamAttemptGetPayload<{ select: typeof examAttemptOutcomeSelect }>;
export type StudentContext = Prisma.UserGetPayload<{ select: typeof studentContextSelect }>;
export type AchievementSnapshotItem = Prisma.StudentYearlyAchievementSnapshotGetPayload<{
  select: typeof achievementSnapshotSelect;
}>;

const candidateWhereWithVersion = (id: number, lockVersion?: number | null): Prisma.GraduationCandidateWhereInput => {
  return lockVersion === undefined || lockVersion === null ? { id } : { id, lockVersion };
};

const goldenRecordWhereWithVersion = (id: number, lockVersion?: number | null): Prisma.GoldenRecordWhereInput => {
  return lockVersion === undefined || lockVersion === null ? { id } : { id, lockVersion };
};

export const goldenRecordsRepository = {
  listCandidates(input: {
    organizationId: number;
    centerIds?: number[];
    circleIds?: number[];
    search?: string;
    year: number;
    status?: GraduationCandidateStatus;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.GraduationCandidateWhereInput = {
      organizationId: input.organizationId,
      year: input.year,
      ...(input.centerIds?.length
        ? {
            centerId: {
              in: input.centerIds
            }
          }
        : {}),
      ...(input.circleIds?.length
        ? {
            circleId: {
              in: input.circleIds
            }
          }
        : {}),
      ...(input.status
        ? input.status === GraduationCandidateStatus.NOMINATED
          ? {
              status: {
                in: [
                  GraduationCandidateStatus.NOMINATED,
                  GraduationCandidateStatus.SCHEDULED,
                  GraduationCandidateStatus.TESTED
                ]
              }
            }
          : { status: input.status }
        : {}),
      ...(input.search
        ? {
            OR: [
              { studentNameSnapshot: { contains: input.search, mode: "insensitive" } },
              { centerNameSnapshot: { contains: input.search, mode: "insensitive" } },
              { circleNameSnapshot: { contains: input.search, mode: "insensitive" } },
              { gradeSnapshot: { contains: input.search, mode: "insensitive" } },
              { notes: { contains: input.search, mode: "insensitive" } },
              { statusNote: { contains: input.search, mode: "insensitive" } },
              { student: { is: { fullName: { contains: input.search, mode: "insensitive" } } } },
              { exam: { is: { title: { contains: input.search, mode: "insensitive" } } } }
            ]
          }
        : {})
    };

    return Promise.all([
      prisma.graduationCandidate.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: candidateSelect
      }),
      prisma.graduationCandidate.count({ where })
    ]).then(([items, total]) => ({ items, total }));
  },

  findCandidateById(input: { id: number; organizationId: number }) {
    return prisma.graduationCandidate.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId
      },
      select: candidateSelect
    });
  },

  findCandidateByExamAttemptId(input: { examAttemptId: number; excludeCandidateId?: number }) {
    const where: Prisma.GraduationCandidateWhereInput = {
      examAttemptId: input.examAttemptId,
      ...(input.excludeCandidateId ? { id: { not: input.excludeCandidateId } } : {})
    };
    return prisma.graduationCandidate.findFirst({ where, select: { id: true } });
  },

  findCandidateByStudentYear(input: { organizationId: number; studentId: number; year: number }) {
    return prisma.graduationCandidate.findFirst({
      where: {
        organizationId: input.organizationId,
        studentId: input.studentId,
        year: input.year
      },
      select: candidateSelect
    });
  },

  createCandidate(
    data: Prisma.GraduationCandidateUncheckedCreateInput,
    db: DbClient = prisma
  ) {
    return db.graduationCandidate.create({
      data,
      select: candidateSelect
    });
  },

  async updateCandidate(
    input: {
      id: number;
      lockVersion?: number | null;
      data: Prisma.GraduationCandidateUncheckedUpdateManyInput;
    },
    db: DbClient = prisma
  ) {
    const result = await db.graduationCandidate.updateMany({
      where: candidateWhereWithVersion(input.id, input.lockVersion),
      data: {
        ...input.data,
        lockVersion: { increment: 1 }
      }
    });

    if (result.count === 0) {
      return null;
    }

    return db.graduationCandidate.findUnique({
      where: { id: input.id },
      select: candidateSelect
    });
  },

  listGoldenRecords(input: {
    organizationId: number;
    centerIds?: number[];
    circleIds?: number[];
    search?: string;
    year: number;
    type?: import("@prisma/client").GoldenRecordType;
    riwaya?: import("@prisma/client").RiwayaType;
    status?: GoldenRecordStatus;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.GoldenRecordWhereInput = {
      organizationId: input.organizationId,
      year: input.year,
      ...(input.centerIds?.length
        ? {
            centerId: {
              in: input.centerIds
            }
          }
        : {}),
      ...(input.circleIds?.length
        ? {
            circleId: {
              in: input.circleIds
            }
          }
        : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.riwaya ? { riwaya: input.riwaya } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.search
        ? {
            OR: [
              { studentNameSnapshot: { contains: input.search, mode: "insensitive" } },
              { centerNameSnapshot: { contains: input.search, mode: "insensitive" } },
              { circleNameSnapshot: { contains: input.search, mode: "insensitive" } },
              { registrySerial: { contains: input.search, mode: "insensitive" } },
              { grade: { contains: input.search, mode: "insensitive" } },
              { appreciation: { contains: input.search, mode: "insensitive" } },
              { notes: { contains: input.search, mode: "insensitive" } },
              { statusNote: { contains: input.search, mode: "insensitive" } },
              { student: { is: { fullName: { contains: input.search, mode: "insensitive" } } } },
              { exam: { is: { title: { contains: input.search, mode: "insensitive" } } } }
            ]
          }
        : {})
    };

    return Promise.all([
      prisma.goldenRecord.findMany({
        where,
        orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: goldenRecordSelect
      }),
      prisma.goldenRecord.count({ where })
    ]).then(([items, total]) => ({ items, total }));
  },

  findGoldenRecordById(input: { id: number; organizationId: number }) {
    return prisma.goldenRecord.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId
      },
      select: goldenRecordSelect
    });
  },

  createGoldenRecord(
    data: Prisma.GoldenRecordUncheckedCreateInput,
    db: DbClient = prisma
  ) {
    return db.goldenRecord.create({
      data,
      select: goldenRecordSelect
    });
  },

  async updateGoldenRecord(
    input: {
      id: number;
      lockVersion?: number | null;
      data: Prisma.GoldenRecordUncheckedUpdateManyInput;
    },
    db: DbClient = prisma
  ) {
    const result = await db.goldenRecord.updateMany({
      where: goldenRecordWhereWithVersion(input.id, input.lockVersion),
      data: {
        ...input.data,
        lockVersion: { increment: 1 }
      }
    });

    if (result.count === 0) {
      return null;
    }

    return db.goldenRecord.findUnique({
      where: { id: input.id },
      select: goldenRecordSelect
    });
  },

  findStudentContext(input: { studentId: number; organizationId: number }) {
    return prisma.user.findFirst({
      where: activeUserWhere({
        id: input.studentId,
        organizationId: input.organizationId,
        role: Role.STUDENT
      }),
      select: studentContextSelect
    });
  },

  async findEarliestStudentEnrollmentStartDate(input: {
    organizationId: number;
    studentId: number;
  }) {
    const row = await prisma.studentCircleEnrollment.findFirst({
      where: {
        studentId: input.studentId,
        circle: {
          center: {
            organizationId: input.organizationId
          }
        }
      },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
      select: {
        startDate: true
      }
    });

    return row?.startDate ?? null;
  },

  findCenterById(input: { centerId: number; organizationId: number }) {
    return prisma.center.findFirst({
      where: {
        id: input.centerId,
        organizationId: input.organizationId
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        isActive: true
      }
    });
  },

  findCircleById(input: { circleId: number; organizationId: number }) {
    return prisma.circle.findFirst({
      where: {
        id: input.circleId,
        center: {
          organizationId: input.organizationId
        }
      },
      select: {
        id: true,
        name: true,
        centerId: true,
        isActive: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true
          }
        }
      }
    });
  },

  findExamById(input: { examId: number; organizationId: number }) {
    return prisma.exam.findFirst({
      where: {
        id: input.examId,
        organizationId: input.organizationId
      },
      select: examSelect
    });
  },

  findExamAttemptOutcome(input: { examAttemptId: number; organizationId: number }) {
    return prisma.examAttempt.findFirst({
      where: {
        id: input.examAttemptId,
        exam: {
          organizationId: input.organizationId
        }
      },
      select: examAttemptOutcomeSelect
    });
  },

  findAchievementSnapshotsByStudentYear(input: {
    organizationId: number;
    year: number;
    studentIds: number[];
  }) {
    return prisma.studentYearlyAchievementSnapshot.findMany({
      where: {
        organizationId: input.organizationId,
        year: input.year,
        ...(input.studentIds.length
          ? {
              studentId: {
                in: input.studentIds
              }
            }
          : {})
      },
      select: {
        id: true,
        studentId: true,
        year: true,
        goldenRecordId: true,
        achievementCategory: true,
        juzCount: true
      }
    });
  },

  findActiveStudentAchievementSources(input: {
    organizationId: number;
    centerIds?: number[];
  }) {
    return prisma.studentCircleEnrollment.findMany({
      where: {
        status: EnrollmentStatus.ACTIVE,
        student: activeUserWhere({
          organizationId: input.organizationId,
          role: Role.STUDENT
        }),
        circle: activeCircleWhere({
          ...(input.centerIds?.length
            ? {
                centerId: {
                  in: input.centerIds
                }
              }
            : {}),
          center: {
            organizationId: input.organizationId
          }
        })
      },
      orderBy: [{ startDate: "desc" }, { id: "desc" }],
      select: {
        id: true,
        studentId: true,
        circleId: true,
        startDate: true,
        circle: {
          select: {
            id: true,
            name: true,
            centerId: true,
            center: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            fullName: true,
            studentProfile: {
              select: {
                currentJuzz: true
              }
            }
          }
        }
      }
    });
  },

  upsertAchievementSnapshot(
    input: {
      organizationId: number;
      year: number;
      studentId: number;
      centerId: number;
      circleId?: number | null;
      achievementCategory: import("@prisma/client").AchievementCategory;
      juzCount: number;
      goldenRecordId?: number | null;
      snapshotSource: string;
      capturedById?: number | null;
      notes?: string | null;
    },
    db: DbClient = prisma
  ) {
    return db.studentYearlyAchievementSnapshot.upsert({
      where: {
        organizationId_studentId_year: {
          organizationId: input.organizationId,
          studentId: input.studentId,
          year: input.year
        }
      },
      update: {
        centerId: input.centerId,
        circleId: input.circleId ?? null,
        achievementCategory: input.achievementCategory,
        juzCount: input.juzCount,
        snapshotSource: input.snapshotSource,
        capturedById: input.capturedById ?? null,
        capturedAt: new Date(),
        ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
        ...(input.goldenRecordId !== undefined ? { goldenRecordId: input.goldenRecordId ?? null } : {})
      },
      create: {
        organizationId: input.organizationId,
        year: input.year,
        studentId: input.studentId,
        centerId: input.centerId,
        circleId: input.circleId ?? null,
        achievementCategory: input.achievementCategory,
        juzCount: input.juzCount,
        goldenRecordId: input.goldenRecordId ?? null,
        snapshotSource: input.snapshotSource,
        capturedById: input.capturedById ?? null,
        notes: input.notes ?? null
      }
    });
  },

  listAchievementSnapshots(input: {
    organizationId: number;
    year: number;
    centerIds?: number[];
  }) {
    return prisma.studentYearlyAchievementSnapshot.findMany({
      where: {
        organizationId: input.organizationId,
        year: input.year,
        ...(input.centerIds?.length
          ? {
              centerId: {
                in: input.centerIds
              }
            }
          : {})
      },
      orderBy: [{ centerId: "asc" }, { studentId: "asc" }],
      select: achievementSnapshotSelect
    });
  }
};
