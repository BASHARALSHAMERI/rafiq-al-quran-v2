import {
  AttemptStatus,
  CommitteeRole,
  ExamPurpose,
  ExamQuestionSource,
  NominationRequestStatus,
  Prisma,
  Role
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

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
  nominationRequestId: true,
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
  evaluationClosedById: true,
  evaluationClosedAt: true,
  approvedById: true,
  approvedAt: true,
  publishedById: true,
  publishedAt: true,
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
    orderBy: [{ committeeRole: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      userId: true,
      roleAtAssignment: true,
      committeeRole: true,
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
  nominationRequest: {
    select: {
      id: true,
      status: true,
      proposedExamDate: true
    }
  },
  evaluatedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  evaluationClosedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  approvedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  publishedBy: {
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
          tajweedPenalty: true
        }
      }
    }
  }
} satisfies Prisma.ExamAttemptSelect;

const nominationSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  examId: true,
  studentId: true,
  circleId: true,
  proposedExamDate: true,
  teacherNotes: true,
  readinessScore: true,
  status: true,
  supervisorReviewNotes: true,
  supervisorReviewedById: true,
  supervisorReviewedAt: true,
  centerApprovalNotes: true,
  centerApprovedById: true,
  centerApprovedAt: true,
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
      centerId: true,
      teacherId: true
    }
  },
  exam: {
    select: {
      id: true,
      title: true,
      type: true,
      examBranch: true,
      purpose: true,
      maxScore: true,
      passScore: true,
      status: true
    }
  },
  student: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
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
  supervisorReviewedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  centerApprovedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  attempt: {
    select: {
      id: true,
      status: true,
      examDate: true,
      publishedAt: true,
      approvedAt: true
    }
  }
} satisfies Prisma.ExamNominationRequestSelect;

const buildAttemptVisibilityWhere = (input: {
  organizationId: number;
  examId?: number;
  centerIds?: number[];
  circleIds?: number[];
  studentId?: number;
  purpose?: ExamPurpose;
  viewerRole?: Role;
  viewerUserId?: number;
  viewerStudentIds?: number[];
}) => {
  const visibilityClause: Prisma.ExamAttemptWhereInput | undefined =
    input.viewerRole === Role.TEACHER && input.viewerUserId
      ? {
          OR: [
            {
              committeeMembers: {
                some: {
                  userId: input.viewerUserId
                }
              }
            },
            {
              circle: {
                teacherId: input.viewerUserId
              }
            }
          ]
        }
      : input.viewerRole === Role.SUPERVISOR && input.viewerUserId
        ? {
            committeeMembers: {
              some: {
                userId: input.viewerUserId
            }
          }
        }
      : input.viewerRole === Role.STUDENT && input.viewerUserId
        ? {
            studentId: input.viewerUserId
          }
        : input.viewerRole === Role.PARENT
          ? {
              studentId: {
                in: input.viewerStudentIds ?? []
              }
            }
        : undefined;

  return {
    AND: [
      {
        circle: {
          center: {
            organizationId: input.organizationId
          }
        },
        ...(input.purpose ? { exam: { purpose: input.purpose } } : {})
      },
      ...(input.examId ? [{ examId: input.examId }] : []),
      ...(input.centerIds?.length
        ? [
            {
              circle: {
                centerId: {
                  in: input.centerIds
                }
              }
            }
          ]
        : []),
      ...(input.circleIds?.length
        ? [
            {
              circleId: {
                in: input.circleIds
              }
            }
          ]
        : []),
      ...(input.studentId ? [{ studentId: input.studentId }] : []),
      ...(visibilityClause ? [visibilityClause] : [])
    ]
  } satisfies Prisma.ExamAttemptWhereInput;
};

export const examsWorkflowRepository = {
  attemptSelect,
  nominationSelect,

  async listNominationRequests(input: {
    organizationId: number;
    centerIds?: number[];
    circleIds?: number[];
    studentId?: number;
    status?: NominationRequestStatus;
    createdById?: number;
  }) {
    return prisma.examNominationRequest.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.centerIds?.length ? { centerId: { in: input.centerIds } } : {}),
        ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {}),
        ...(input.studentId ? { studentId: input.studentId } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.createdById ? { createdById: input.createdById } : {})
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: nominationSelect
    });
  },

  async findNominationRequestById(input: { nominationId: number; organizationId: number }) {
    return prisma.examNominationRequest.findFirst({
      where: {
        id: input.nominationId,
        organizationId: input.organizationId
      },
      select: nominationSelect
    });
  },

  async findActiveNomination(input: { examId: number; studentId: number }) {
    return prisma.examNominationRequest.findFirst({
      where: {
        examId: input.examId,
        studentId: input.studentId,
        status: { in: ["PENDING", "APPROVED"] }
      },
      select: nominationSelect
    });
  },

  async createNominationRequest(input: {
    organizationId: number;
    centerId: number;
    examId: number;
    studentId: number;
    circleId: number;
    proposedExamDate?: Date | null;
    teacherNotes?: string | null;
    readinessScore?: number | null;
    createdById: number;
  }) {
    return prisma.examNominationRequest.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        examId: input.examId,
        studentId: input.studentId,
        circleId: input.circleId,
        proposedExamDate: input.proposedExamDate ?? null,
        teacherNotes: input.teacherNotes ?? null,
        readinessScore: input.readinessScore ?? null,
        createdById: input.createdById
      },
      select: nominationSelect
    });
  },

  async supervisorReviewNominationRequest(input: {
    nominationId: number;
    status: NominationRequestStatus;
    notes?: string | null;
    supervisorReviewedById: number;
  }) {
    return prisma.examNominationRequest.update({
      where: {
        id: input.nominationId
      },
      data: {
        status: input.status,
        supervisorReviewNotes: input.notes ?? null,
        supervisorReviewedById: input.supervisorReviewedById,
        supervisorReviewedAt: new Date()
      },
      select: nominationSelect
    });
  },

  async centerReviewNominationRequest(input: {
    nominationId: number;
    status: NominationRequestStatus;
    notes?: string | null;
    centerReviewedById: number;
  }) {
    return prisma.examNominationRequest.update({
      where: {
        id: input.nominationId
      },
      data: {
        status: input.status,
        centerApprovalNotes: input.notes ?? null,
        centerApprovedById: input.centerReviewedById,
        centerApprovedAt: new Date()
      },
      select: nominationSelect
    });
  },

  async centerApproveNominationRequest(input: {
    nominationId: number;
    centerApprovalNotes?: string | null;
    centerApprovedById: number;
    examDate: Date;
    fullQuranCompletedAt?: Date | null;
    committeeMembers: Array<{
      userId: number;
      roleAtAssignment: Role;
      committeeRole: CommitteeRole;
      assignedById?: number | null;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const nomination = await tx.examNominationRequest.update({
        where: {
          id: input.nominationId
        },
        data: {
          status: NominationRequestStatus.CENTER_APPROVED,
          centerApprovalNotes: input.centerApprovalNotes ?? null,
          centerApprovedById: input.centerApprovedById,
          centerApprovedAt: new Date()
        },
        select: {
          id: true,
          examId: true,
          studentId: true,
          circleId: true
        }
      });

      const attempt = await tx.examAttempt.create({
        data: {
          examId: nomination.examId,
          studentId: nomination.studentId,
          circleId: nomination.circleId,
          nominationRequestId: nomination.id,
          examDate: input.examDate,
          fullQuranCompletedAt: input.fullQuranCompletedAt ?? null,
          status: AttemptStatus.SCHEDULED,
          committeeMembers: {
            create: input.committeeMembers.map((member) => ({
              userId: member.userId,
              roleAtAssignment: member.roleAtAssignment,
              committeeRole: member.committeeRole,
              assignedById: member.assignedById ?? null
            }))
          }
        },
        select: attemptSelect
      });

      const updatedNomination = await tx.examNominationRequest.findUniqueOrThrow({
        where: {
          id: input.nominationId
        },
        select: nominationSelect
      });

      return {
        nomination: updatedNomination,
        attempt
      };
    });
  },

  async listAttempts(input: {
    organizationId: number;
    examId?: number;
    centerIds?: number[];
    circleIds?: number[];
    studentId?: number;
    purpose?: ExamPurpose;
    viewerRole?: Role;
    viewerUserId?: number;
    viewerStudentIds?: number[];
  }) {
    return prisma.examAttempt.findMany({
      where: buildAttemptVisibilityWhere(input),
      orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
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
      committeeRole: CommitteeRole;
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

        await tx.examAttemptCommitteeMember.createMany({
          data: input.committeeMembers.map((member) => ({
            attemptId: input.attemptId,
            userId: member.userId,
            roleAtAssignment: member.roleAtAssignment,
            committeeRole: member.committeeRole,
            assignedById: member.assignedById ?? null
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

  async saveAttemptEvaluation(input: {
    attemptId: number;
    evaluatedById: number;
    totalScore: number;
    gradeLabel: string;
    committeeNotes?: string | null;
    strengthNotes?: string | null;
    weaknessNotes?: string | null;
    memorizationScore: number;
    tajweedScore: number;
    theoreticalTajweedScore: number;
    performanceScore: number;
    promptingDeductions: number;
    remindingDeductions: number;
    tajweedDeductions: number;
    questionUpdates: Array<{
      id: number;
      promptingDeductions: number;
      remindingDeductions: number;
      tajweedDeductions: number;
      isEvaluated: boolean;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
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

      await tx.examAttempt.update({
        where: {
          id: input.attemptId
        },
        data: {
          totalScore: input.totalScore,
          gradeLabel: input.gradeLabel,
          committeeNotes: input.committeeNotes ?? null,
          status: AttemptStatus.IN_PROGRESS,
          startedAt: new Date(),
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

  async finalizeAttemptEvaluation(input: { attemptId: number; evaluationClosedById: number }) {
    return prisma.examAttempt.update({
      where: {
        id: input.attemptId
      },
      data: {
        status: AttemptStatus.EVALUATED,
        evaluationClosedById: input.evaluationClosedById,
        evaluationClosedAt: new Date(),
        reviewedAt: new Date(),
        submittedAt: new Date(),
        lockVersion: {
          increment: 1
        }
      },
      select: attemptSelect
    });
  },

  async approveAttempt(input: { attemptId: number; approvedById: number }) {
    return prisma.examAttempt.update({
      where: {
        id: input.attemptId
      },
      data: {
        status: AttemptStatus.APPROVED,
        approvedById: input.approvedById,
        approvedAt: new Date(),
        lockVersion: {
          increment: 1
        }
      },
      select: attemptSelect
    });
  },

  async publishAttempt(input: { attemptId: number; publishedById: number }) {
    return prisma.examAttempt.update({
      where: {
        id: input.attemptId
      },
      data: {
        status: AttemptStatus.PUBLISHED,
        publishedById: input.publishedById,
        publishedAt: new Date(),
        lockVersion: {
          increment: 1
        }
      },
      select: attemptSelect
    });
  },

  async reopenAttemptForQuestionAdjustment(input: { attemptId: number }) {
    return prisma.examAttempt.update({
      where: {
        id: input.attemptId
      },
      data: {
        status: AttemptStatus.IN_PROGRESS,
        evaluationClosedById: null,
        evaluationClosedAt: null,
        approvedById: null,
        approvedAt: null,
        publishedById: null,
        publishedAt: null,
        reviewedAt: null,
        submittedAt: null,
        lockVersion: {
          increment: 1
        }
      },
      select: attemptSelect
    });
  }
};
