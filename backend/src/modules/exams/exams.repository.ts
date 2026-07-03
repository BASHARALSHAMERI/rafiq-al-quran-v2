import {
  AttemptStatus,
  ExamPurpose,
  ExamQuestionSource,
  EnrollmentStatus,
  type ExamStatus,
  type ExamType,
  Prisma,
  Role
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import type { ExamsDateRange } from "./exams.domain";
import {
  activeCenterWhere,
  activeCircleWhere,
  activeUserWhere
} from "../../shared/policies/active-read.policy";

type ListExamsInput = {
  organizationId: number;
  centerIds?: number[];
  circleIds?: number[];
  purpose?: ExamPurpose;
  status?: ExamStatus;
  range?: ExamsDateRange;
};

type CreateExamInput = {
  organizationId: number;
  centerId?: number | null;
  circleId?: number | null;
  title: string;
  type: ExamType;
  examBranch?: string | null;
  purpose: ExamPurpose;
  maxScore: number;
  passScore: number;
  scheduledAt?: Date | null;
  createdById: number;
  criteria: {
    memorizationScore: number;
    tajweedScore: number;
    theoreticalTajweedScore: number;
    performanceScore: number;
    promptingPenalty: number;
    remindingPenalty: number;
    tajweedPenalty: number;
    minQuestionCount: number;
    defaultQuestionCount: number;
    maxQuestionCount: number;
  };
};

type ListQuestionBankInput = {
  organizationId: number;
  fromSurah?: number;
  toSurah?: number;
  difficultyLevel?: number;
  source?: ExamQuestionSource;
  search?: string;
};

type CreateQuestionBankItemInput = {
  organizationId: number;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  pageNumber: number;
  lineCount: number;
  difficultyLevel: number;
  suggestedText?: string | null;
  source: ExamQuestionSource;
  createdById: number;
};

const examSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  title: true,
  type: true,
  examBranch: true,
  purpose: true,
  maxScore: true,
  passScore: true,
  status: true,
  scheduledAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
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
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  criteria: {
    select: {
      id: true,
      memorizationScore: true,
      tajweedScore: true,
      theoreticalTajweedScore: true,
      performanceScore: true,
      promptingPenalty: true,
      remindingPenalty: true,
      tajweedPenalty: true,
      minQuestionCount: true,
      defaultQuestionCount: true,
      maxQuestionCount: true
    }
  },
  _count: {
    select: {
      attempts: true
    }
  }
} satisfies Prisma.ExamSelect;

const attemptQuestionSelect = {
  id: true,
  orderIndex: true,
  source: true,
  fromSurah: true,
  fromAyah: true,
  toSurah: true,
  toAyah: true,
  promptingDeductions: true,
  remindingDeductions: true,
  tajweedDeductions: true,
  isEvaluated: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ExamAttemptQuestionSelect;

const attemptSelect = {
  id: true,
  examId: true,
  studentId: true,
  circleId: true,
  examDate: true,
  fullQuranCompletedAt: true,
  committeeNotes: true,
  totalScore: true,
  gradeLabel: true,
  status: true,
  startedAt: true,
  submittedAt: true,
  reviewedAt: true,
  evaluatedById: true,
  lockVersion: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  circle: {
    select: {
      id: true,
      name: true,
      centerId: true,
      teacherId: true,
      center: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  },
  committeeMembers: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      userId: true,
      roleAtAssignment: true,
      assignedById: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      }
    }
  },
  questions: {
    orderBy: [{ orderIndex: "asc" }],
    select: attemptQuestionSelect
  },
  evaluatedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
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
  },
  exam: {
    select: {
      id: true,
      title: true,
      type: true,
      examBranch: true,
      purpose: true,
      centerId: true,
      circleId: true,
      maxScore: true,
      passScore: true,
      status: true,
      center: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      criteria: {
        select: {
          id: true,
          memorizationScore: true,
          tajweedScore: true,
          theoreticalTajweedScore: true,
          performanceScore: true,
          promptingPenalty: true,
          remindingPenalty: true,
          tajweedPenalty: true,
          minQuestionCount: true,
          defaultQuestionCount: true,
          maxQuestionCount: true
        }
      }
    }
  }
} satisfies Prisma.ExamAttemptSelect;

const questionBankItemSelect = {
  id: true,
  organizationId: true,
  fromSurah: true,
  fromAyah: true,
  toSurah: true,
  toAyah: true,
  pageNumber: true,
  lineCount: true,
  difficultyLevel: true,
  suggestedText: true,
  source: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  }
} satisfies Prisma.ExamQuestionBankItemSelect;

const createTemplateScopeClauses = (input: Pick<ListExamsInput, "centerIds" | "circleIds">) => {
  const clauses: Prisma.ExamWhereInput[] = [];

  if (input.centerIds?.length) {
    clauses.push({
      OR: [
        { centerId: null },
        {
          centerId: {
            in: input.centerIds
          }
        }
      ]
    });
  }

  if (input.circleIds?.length) {
    clauses.push({
      OR: [
        { circleId: null },
        {
          circleId: {
            in: input.circleIds
          }
        }
      ]
    });
  }

  return clauses;
};

export const examsRepository = {
  async listExams(input: ListExamsInput) {
    const where: Prisma.ExamWhereInput = {
      AND: [
        { organizationId: input.organizationId },
        ...(input.purpose ? [{ purpose: input.purpose }] : []),
        ...(input.status ? [{ status: input.status }] : []),
        ...(input.range
          ? [
              {
                scheduledAt: {
                  gte: input.range.from,
                  lte: input.range.to
                }
              }
            ]
          : []),
        ...createTemplateScopeClauses(input)
      ]
    };

    return prisma.exam.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: examSelect
    });
  },

  async findExamById(input: { examId: number; organizationId: number }) {
    return prisma.exam.findFirst({
      where: {
        id: input.examId,
        organizationId: input.organizationId
      },
      select: examSelect
    });
  },

  async findExamByTitle(input: { title: string; organizationId: number }) {
    return prisma.exam.findFirst({
      where: {
        title: input.title,
        organizationId: input.organizationId
      },
      select: examSelect
    });
  },

  async createExam(input: CreateExamInput) {
    return prisma.exam.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId ?? null,
        circleId: input.circleId ?? null,
        title: input.title,
        type: input.type,
        examBranch: input.examBranch?.trim() ? input.examBranch.trim() : null,
        purpose: input.purpose,
        maxScore: input.maxScore,
        passScore: input.passScore,
        status: "DRAFT",
        scheduledAt: input.scheduledAt ?? null,
        createdById: input.createdById,
        criteria: {
          create: {
            memorizationScore: input.criteria.memorizationScore,
            tajweedScore: input.criteria.tajweedScore,
            theoreticalTajweedScore: input.criteria.theoreticalTajweedScore,
            performanceScore: input.criteria.performanceScore,
            promptingPenalty: input.criteria.promptingPenalty,
            remindingPenalty: input.criteria.remindingPenalty,
            tajweedPenalty: input.criteria.tajweedPenalty,
            minQuestionCount: input.criteria.minQuestionCount,
            defaultQuestionCount: input.criteria.defaultQuestionCount,
            maxQuestionCount: input.criteria.maxQuestionCount
          }
        }
      },
      select: examSelect
    });
  },

  async updateExam(input: {
    examId: number;
    title?: string;
    type?: ExamType;
    examBranch?: string | null;
    purpose?: ExamPurpose;
    maxScore?: number;
    passScore?: number;
    centerId?: number | null;
    circleId?: number | null;
    scheduledAt?: Date | null;
    criteria?: {
      memorizationScore: number;
      tajweedScore: number;
      theoreticalTajweedScore: number;
      performanceScore: number;
      promptingPenalty: number;
      remindingPenalty: number;
      tajweedPenalty: number;
      minQuestionCount: number;
      defaultQuestionCount: number;
      maxQuestionCount: number;
    };
  }) {
    return prisma.exam.update({
      where: {
        id: input.examId
      },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.examBranch !== undefined
          ? { examBranch: input.examBranch?.trim() ? input.examBranch.trim() : null }
          : {}),
        ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
        ...(input.maxScore !== undefined ? { maxScore: input.maxScore } : {}),
        ...(input.passScore !== undefined ? { passScore: input.passScore } : {}),
        ...(input.centerId !== undefined ? { centerId: input.centerId } : {}),
        ...(input.circleId !== undefined ? { circleId: input.circleId } : {}),
        ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
        ...(input.criteria
          ? {
              criteria: {
                upsert: {
                  create: {
                    memorizationScore: input.criteria.memorizationScore,
                    tajweedScore: input.criteria.tajweedScore,
                    theoreticalTajweedScore: input.criteria.theoreticalTajweedScore,
                    performanceScore: input.criteria.performanceScore,
                    promptingPenalty: input.criteria.promptingPenalty,
                    remindingPenalty: input.criteria.remindingPenalty,
                    tajweedPenalty: input.criteria.tajweedPenalty,
                    minQuestionCount: input.criteria.minQuestionCount,
                    defaultQuestionCount: input.criteria.defaultQuestionCount,
                    maxQuestionCount: input.criteria.maxQuestionCount
                  },
                  update: {
                    memorizationScore: input.criteria.memorizationScore,
                    tajweedScore: input.criteria.tajweedScore,
                    theoreticalTajweedScore: input.criteria.theoreticalTajweedScore,
                    performanceScore: input.criteria.performanceScore,
                    promptingPenalty: input.criteria.promptingPenalty,
                    remindingPenalty: input.criteria.remindingPenalty,
                    tajweedPenalty: input.criteria.tajweedPenalty,
                    minQuestionCount: input.criteria.minQuestionCount,
                    defaultQuestionCount: input.criteria.defaultQuestionCount,
                    maxQuestionCount: input.criteria.maxQuestionCount
                  }
                }
              }
            }
          : {})
      },
      select: examSelect
    });
  },

  async deleteExam(examId: number) {
    return prisma.exam.delete({
      where: {
        id: examId
      },
      select: examSelect
    });
  },

  async publishExam(examId: number) {
    return prisma.exam.update({
      where: {
        id: examId
      },
      data: {
        status: "PUBLISHED"
      },
      select: examSelect
    });
  },

  async unpublishExam(examId: number) {
    return prisma.exam.update({
      where: {
        id: examId
      },
      data: {
        status: "DRAFT"
      },
      select: examSelect
    });
  },

  async listQuestionBank(input: ListQuestionBankInput) {
    const search = input.search?.trim();
    const where: Prisma.ExamQuestionBankItemWhereInput = {
      organizationId: input.organizationId,
      ...(input.fromSurah !== undefined
        ? {
            fromSurah: {
              gte: input.fromSurah
            }
          }
        : {}),
      ...(input.toSurah !== undefined
        ? {
            toSurah: {
              lte: input.toSurah
            }
          }
        : {}),
      ...(input.difficultyLevel !== undefined
        ? {
            difficultyLevel: input.difficultyLevel
          }
        : {}),
      ...(input.source !== undefined
        ? {
            source: input.source
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                suggestedText: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                createdBy: {
                  fullName: {
                    contains: search,
                    mode: "insensitive"
                  }
                }
              }
            ]
          }
        : {})
    };

    return prisma.examQuestionBankItem.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: questionBankItemSelect
    });
  },

  async createQuestionBankItem(input: CreateQuestionBankItemInput) {
    return prisma.examQuestionBankItem.create({
      data: {
        organizationId: input.organizationId,
        fromSurah: input.fromSurah,
        fromAyah: input.fromAyah,
        toSurah: input.toSurah,
        toAyah: input.toAyah,
        pageNumber: input.pageNumber,
        lineCount: input.lineCount,
        difficultyLevel: input.difficultyLevel,
        suggestedText: input.suggestedText?.trim() ? input.suggestedText.trim() : null,
        source: input.source,
        createdById: input.createdById
      },
      select: questionBankItemSelect
    });
  },

  async createQuestionBankItems(input: { items: CreateQuestionBankItemInput[] }) {
    if (input.items.length === 0) {
      return [];
    }

    return prisma.$transaction(
      input.items.map((item) =>
        prisma.examQuestionBankItem.create({
          data: {
            organizationId: item.organizationId,
            fromSurah: item.fromSurah,
            fromAyah: item.fromAyah,
            toSurah: item.toSurah,
            toAyah: item.toAyah,
            pageNumber: item.pageNumber,
            lineCount: item.lineCount,
            difficultyLevel: item.difficultyLevel,
            suggestedText: item.suggestedText?.trim() ? item.suggestedText.trim() : null,
            source: item.source,
            createdById: item.createdById
          },
          select: questionBankItemSelect
        })
      )
    );
  },

  async findQuestionBankItemById(input: { itemId: number; organizationId: number }) {
    return prisma.examQuestionBankItem.findFirst({
      where: {
        id: input.itemId,
        organizationId: input.organizationId
      },
      select: questionBankItemSelect
    });
  },

  async updateQuestionBankItem(input: {
    itemId: number;
    organizationId: number;
    fromSurah: number;
    fromAyah: number;
    toSurah: number;
    toAyah: number;
    pageNumber: number;
    lineCount: number;
    difficultyLevel: number;
    suggestedText?: string | null;
  }) {
    return prisma.examQuestionBankItem.update({
      where: {
        id: input.itemId
      },
      data: {
        organizationId: input.organizationId,
        fromSurah: input.fromSurah,
        fromAyah: input.fromAyah,
        toSurah: input.toSurah,
        toAyah: input.toAyah,
        pageNumber: input.pageNumber,
        lineCount: input.lineCount,
        difficultyLevel: input.difficultyLevel,
        suggestedText: input.suggestedText?.trim() ? input.suggestedText.trim() : null
      },
      select: questionBankItemSelect
    });
  },

  async deleteQuestionBankItem(itemId: number) {
    return prisma.examQuestionBankItem.delete({
      where: {
        id: itemId
      },
      select: questionBankItemSelect
    });
  },

  async findCenterById(input: { centerId: number; organizationId: number }) {
    return prisma.center.findFirst({
      where: activeCenterWhere({
        id: input.centerId,
        organizationId: input.organizationId
      }),
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        isActive: true
      }
    });
  },

  async findCircleById(input: { circleId: number; organizationId: number }) {
    return prisma.circle.findFirst({
      where: activeCircleWhere({
        id: input.circleId,
        center: activeCenterWhere({
          organizationId: input.organizationId
        })
      }),
      select: {
        id: true,
        centerId: true,
        name: true,
        isActive: true,
        teacherId: true
      }
    });
  },

  async findStudentById(input: { studentId: number; organizationId: number }) {
    return prisma.user.findFirst({
      where: activeUserWhere({
        id: input.studentId,
        organizationId: input.organizationId
      }),
      select: {
        id: true,
        role: true,
        fullName: true,
        isActive: true
      }
    });
  },

  async findCommitteeUsers(input: {
    organizationId: number;
    centerId: number;
    userIds: number[];
  }) {
    if (!input.userIds.length) {
      return [];
    }

    return prisma.user.findMany({
      where: activeUserWhere({
        organizationId: input.organizationId,
        id: {
          in: input.userIds
        },
        role: {
          in: [Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]
        },
        OR: [
          {
            centerAccesses: {
              some: {
                centerId: input.centerId
              }
            }
          },
          {
            circleAccesses: {
              some: {
                circle: {
                  centerId: input.centerId
                }
              }
            }
          },
          {
            taughtCircles: {
              some: {
                centerId: input.centerId
              }
            }
          },
          {
            centerSupervisorLinks: {
              some: {
                centerId: input.centerId,
                isActive: true
              }
            }
          }
        ]
      }),
      select: {
        id: true,
        fullName: true,
        role: true
      }
    });
  },

  async findActiveEnrollment(input: {
    studentId: number;
    circleId: number;
    organizationId: number;
  }) {
    return prisma.studentCircleEnrollment.findFirst({
      where: {
        studentId: input.studentId,
        circleId: input.circleId,
        status: EnrollmentStatus.ACTIVE,
        student: activeUserWhere({
          organizationId: input.organizationId,
          role: Role.STUDENT
        }),
        circle: activeCircleWhere({
          center: activeCenterWhere({
            organizationId: input.organizationId
          })
        })
      },
      select: {
        id: true
      }
    });
  },

  async listExamAttempts(input: {
    examId: number;
    organizationId: number;
    centerIds?: number[];
    circleIds?: number[];
    committeeUserId?: number;
  }) {
    const where: Prisma.ExamAttemptWhereInput = {
      examId: input.examId,
      exam: {
        organizationId: input.organizationId
      },
      ...(input.centerIds?.length
        ? {
            circle: {
              centerId: {
                in: input.centerIds
              }
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
      ...(input.committeeUserId
        ? {
            committeeMembers: {
              some: {
                userId: input.committeeUserId
              }
            }
          }
        : {})
    };

    return prisma.examAttempt.findMany({
      where,
      orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
      select: attemptSelect
    });
  },

  async listAllAttempts(input: {
    organizationId: number;
    centerIds?: number[];
    circleIds?: number[];
    studentId?: number;
    purpose?: ExamPurpose;
    committeeUserId?: number;
  }) {
    const where: Prisma.ExamAttemptWhereInput = {
      exam: {
        organizationId: input.organizationId,
        ...(input.purpose ? { purpose: input.purpose } : {})
      },
      ...(input.centerIds?.length
        ? {
            circle: {
              centerId: {
                in: input.centerIds
              }
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
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.committeeUserId
        ? {
            committeeMembers: {
              some: {
                userId: input.committeeUserId
              }
            }
          }
        : {})
    };

    return prisma.examAttempt.findMany({
      where,
      orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
      select: attemptSelect
    });
  },

  async findActiveStudentAttemptForExam(input: { examId: number; studentId: number }) {
    return prisma.examAttempt.findFirst({
      where: {
        examId: input.examId,
        studentId: input.studentId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] }
      },
      select: attemptSelect
    });
  },

  async createExamAttempt(input: {
    examId: number;
    studentId: number;
    circleId: number;
    examDate: Date;
    fullQuranCompletedAt?: Date | null;
    committeeMembers: Array<{
      userId: number;
      roleAtAssignment: Role;
      assignedById?: number | null;
    }>;
  }) {
    return prisma.examAttempt.create({
      data: {
        examId: input.examId,
        studentId: input.studentId,
        circleId: input.circleId,
        examDate: input.examDate,
        fullQuranCompletedAt: input.fullQuranCompletedAt ?? null,
        status: AttemptStatus.SCHEDULED,
        committeeMembers: {
          create: input.committeeMembers.map((member) => ({
            userId: member.userId,
            roleAtAssignment: member.roleAtAssignment,
            assignedById: member.assignedById ?? null
          }))
        }
      },
      select: attemptSelect
    });
  },

  async findAttemptById(input: { attemptId: number; organizationId: number }) {
    return prisma.examAttempt.findFirst({
      where: {
        id: input.attemptId,
        circle: {
          center: {
            organizationId: input.organizationId
          }
        }
      },
      select: attemptSelect
    });
  },

  async replaceAttemptCommittee(input: {
    attemptId: number;
    lockVersion?: number;
    examDate?: Date;
    fullQuranCompletedAt?: Date | null;
    committeeMembers?: Array<{
      userId: number;
      roleAtAssignment: Role;
      assignedById?: number | null;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.examAttempt.updateMany({
        where:
          input.lockVersion === undefined
            ? { id: input.attemptId }
            : { id: input.attemptId, lockVersion: input.lockVersion },
        data: {
          ...(input.examDate !== undefined ? { examDate: input.examDate } : {}),
          ...(input.fullQuranCompletedAt !== undefined
            ? { fullQuranCompletedAt: input.fullQuranCompletedAt }
            : {}),
          lockVersion: {
            increment: 1
          }
        }
      });

      if (updated.count === 0) {
        return null;
      }

      if (input.committeeMembers) {
        await tx.examAttemptCommitteeMember.deleteMany({
          where: {
            attemptId: input.attemptId
          }
        });

        if (input.committeeMembers.length) {
          await tx.examAttemptCommitteeMember.createMany({
            data: input.committeeMembers.map((member) => ({
              attemptId: input.attemptId,
              userId: member.userId,
              roleAtAssignment: member.roleAtAssignment,
              assignedById: member.assignedById ?? null
            }))
          });
        }
      }

      return tx.examAttempt.findUnique({
        where: {
          id: input.attemptId
        },
        select: attemptSelect
      });
    });
  },

  async replaceAttemptQuestions(input: {
    attemptId: number;
    questions: Array<{
      orderIndex: number;
      source: ExamQuestionSource;
      fromSurah: number;
      fromAyah: number;
      toSurah: number;
      toAyah: number;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.examAttemptQuestion.deleteMany({
        where: {
          attemptId: input.attemptId
        }
      });

      if (input.questions.length) {
        await tx.examAttemptQuestion.createMany({
          data: input.questions.map((question) => ({
            attemptId: input.attemptId,
            orderIndex: question.orderIndex,
            source: question.source,
            fromSurah: question.fromSurah,
            fromAyah: question.fromAyah,
            toSurah: question.toSurah,
            toAyah: question.toAyah
          }))
        });
      }

      return tx.examAttempt.findUnique({
        where: {
          id: input.attemptId
        },
        select: attemptSelect
      });
    });
  },

  async createAttemptQuestion(input: {
    attemptId: number;
    source: ExamQuestionSource;
    fromSurah: number;
    fromAyah: number;
    toSurah: number;
    toAyah: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const lastQuestion = await tx.examAttemptQuestion.findFirst({
        where: {
          attemptId: input.attemptId
        },
        orderBy: [{ orderIndex: "desc" }],
        select: {
          orderIndex: true
        }
      });

      await tx.examAttemptQuestion.create({
        data: {
          attemptId: input.attemptId,
          orderIndex: (lastQuestion?.orderIndex ?? 0) + 1,
          source: input.source,
          fromSurah: input.fromSurah,
          fromAyah: input.fromAyah,
          toSurah: input.toSurah,
          toAyah: input.toAyah
        }
      });

      return tx.examAttempt.findUnique({
        where: {
          id: input.attemptId
        },
        select: attemptSelect
      });
    });
  },

  async deleteAttemptQuestion(input: { attemptId: number; questionId: number }) {
    return prisma.$transaction(async (tx) => {
      const question = await tx.examAttemptQuestion.findFirst({
        where: {
          id: input.questionId,
          attemptId: input.attemptId
        },
        select: {
          id: true,
          orderIndex: true
        }
      });

      if (!question) {
        return null;
      }

      await tx.examAttemptQuestion.delete({
        where: {
          id: question.id
        }
      });

      await tx.examAttemptQuestion.updateMany({
        where: {
          attemptId: input.attemptId,
          orderIndex: {
            gt: question.orderIndex
          }
        },
        data: {
          orderIndex: {
            decrement: 1
          }
        }
      });

      return tx.examAttempt.findUnique({
        where: {
          id: input.attemptId
        },
        select: attemptSelect
      });
    });
  },

  async scoreAttempt(input: {
    attemptId: number;
    evaluatedById: number;
    totalScore: number;
    gradeLabel: string;
    committeeNotes?: string;
    strengthNotes?: string;
    weaknessNotes?: string;
    memorizationScore: number;
    tajweedScore: number;
    theoreticalTajweedScore: number;
    performanceScore: number;
    promptingDeductions: number;
    remindingDeductions: number;
    tajweedDeductions: number;
    questionUpdates?: Array<{
      id: number;
      promptingDeductions: number;
      remindingDeductions: number;
      tajweedDeductions: number;
      isEvaluated: boolean;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      if (input.questionUpdates?.length) {
        for (const question of input.questionUpdates) {
          await tx.examAttemptQuestion.updateMany({
            where: {
              id: question.id,
              attemptId: input.attemptId
            },
            data: {
              promptingDeductions: question.promptingDeductions,
              remindingDeductions: question.remindingDeductions,
              tajweedDeductions: question.tajweedDeductions,
              isEvaluated: question.isEvaluated
            }
          });
        }
      }

      await tx.examAttempt.update({
        where: {
          id: input.attemptId
        },
        data: {
          totalScore: input.totalScore,
          gradeLabel: input.gradeLabel,
          committeeNotes: input.committeeNotes ?? null,
          status: AttemptStatus.APPROVED,
          startedAt: new Date(),
          reviewedAt: new Date(),
          submittedAt: new Date(),
          evaluatedById: input.evaluatedById,
          lockVersion: {
            increment: 1
          }
        }
      });

      await tx.examAttemptBreakdown.upsert({
        where: {
          attemptId: input.attemptId
        },
        create: {
          attemptId: input.attemptId,
          memorizationScore: input.memorizationScore,
          tajweedScore: input.tajweedScore,
          theoreticalTajweedScore: input.theoreticalTajweedScore,
          performanceScore: input.performanceScore,
          promptingDeductions: input.promptingDeductions,
          remindingDeductions: input.remindingDeductions,
          tajweedDeductions: input.tajweedDeductions,
          strengthNotes: input.strengthNotes ?? null,
          weaknessNotes: input.weaknessNotes ?? null
        },
        update: {
          memorizationScore: input.memorizationScore,
          tajweedScore: input.tajweedScore,
          theoreticalTajweedScore: input.theoreticalTajweedScore,
          performanceScore: input.performanceScore,
          promptingDeductions: input.promptingDeductions,
          remindingDeductions: input.remindingDeductions,
          tajweedDeductions: input.tajweedDeductions,
          strengthNotes: input.strengthNotes ?? null,
          weaknessNotes: input.weaknessNotes ?? null
        }
      });

      return tx.examAttempt.findUnique({
        where: {
          id: input.attemptId
        },
        select: attemptSelect
      });
    });
  },

  async findAttemptNotificationContext(input: { attemptId: number; organizationId: number }) {
    return prisma.examAttempt.findFirst({
      where: {
        id: input.attemptId,
        exam: {
          organizationId: input.organizationId
        }
      },
      select: {
        id: true,
        examDate: true,
        totalScore: true,
        gradeLabel: true,
        studentId: true,
        circleId: true,
        student: {
          select: {
            id: true,
            fullName: true,
            childLinks: {
              select: {
                parentId: true
              }
            }
          }
        },
        circle: {
          select: {
            id: true,
            name: true,
            centerId: true,
            teacherId: true,
            center: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        exam: {
          select: {
            id: true,
            title: true,
            type: true,
            examBranch: true
          }
        },
        committeeMembers: {
          select: {
            userId: true
          }
        }
      }
    });
  }
};
