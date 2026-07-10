import {
  AttemptStatus,
  InvoiceStatus,
  Prisma,
  ReportFileKind,
  ReportRunStatus,
  ReportType,
  Role
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

const reportFileSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  name: true,
  mimeType: true,
  sizeBytes: true,
  storageKey: true,
  kind: true,
  createdById: true,
  expiresAt: true,
  createdAt: true
} satisfies Prisma.ReportFileSelect;

const reportRunSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  circleId: true,
  reportType: true,
  status: true,
  requestedById: true,
  requestedAt: true,
  completedAt: true,
  filters: true,
  summary: true,
  errorMessage: true,
  outputFileId: true,
  outputFile: {
    select: reportFileSelect
  }
} satisfies Prisma.ReportRunSelect;

export const reportsRepository = {
  async supervisorRawAttendance(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    circleIds?: number[];
  }) {
    return prisma.attendanceRecord.findMany({
      where: {
        attendanceDate: { gte: input.range.from, lte: input.range.to },
        circle: {
          center: {
            organizationId: input.organizationId,
            ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
          }
        },
        ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {})
      },
      select: {
        studentId: true,
        circleId: true,
        status: true,
        student: { select: { fullName: true } },
        circle: { select: { name: true, teacher: { select: { fullName: true } }, _count: { select: { enrollments: true } } } }
      }
    });
  },

  async supervisorRawFollowUps(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    circleIds?: number[];
  }) {
    return prisma.followUpRecord.findMany({
      where: {
        recordDate: { gte: input.range.from, lte: input.range.to },
        circle: {
          center: {
            organizationId: input.organizationId,
            ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
          }
        },
        ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {})
      },
      select: {
        studentId: true,
        circleId: true,
        pagesCount: true,
        rating: true,
        type: true
      }
    });
  },

  async supervisorCircles(input: {
    organizationId: number;
    centerIds?: number[];
    circleIds?: number[];
  }) {
    return prisma.circle.findMany({
      where: {
        center: {
          organizationId: input.organizationId,
          ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
        },
        ...(input.circleIds?.length ? { id: { in: input.circleIds } } : {})
      },
      select: {
        id: true,
        name: true,
        teacher: { select: { fullName: true } },
        _count: { select: { enrollments: true } }
      }
    });
  },

  async findStudentById(input: { organizationId: number; studentId: number }) {
    return prisma.user.findFirst({
      where: {
        id: input.studentId,
        organizationId: input.organizationId,
        role: Role.STUDENT
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true
      }
    });
  },

  async isParentLinkedToStudent(input: { parentId: number; studentId: number }) {
    const link = await prisma.parentStudentLink.findFirst({
      where: {
        parentId: input.parentId,
        studentId: input.studentId
      },
      select: {
        id: true
      }
    });

    return Boolean(link);
  },

  async studentAttendanceRows(input: {
    organizationId: number;
    studentId: number;
    centerIds?: number[];
    circleIds?: number[];
    range?: { from: Date; to: Date };
  }) {
    return prisma.attendanceRecord.findMany({
      where: {
        studentId: input.studentId,
        ...(input.range
          ? {
              attendanceDate: {
                gte: input.range.from,
                lte: input.range.to
              }
            }
          : {}),
        circle: {
          center: {
            organizationId: input.organizationId,
            ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
          }
        },
        ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {})
      },
      orderBy: [{ attendanceDate: "desc" }, { id: "desc" }],
      select: {
        id: true,
        attendanceDate: true,
        status: true,
        note: true,
        circle: {
          select: {
            id: true,
            name: true,
            center: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            }
          }
        }
      }
    });
  },

  async studentFollowUpRows(input: {
    organizationId: number;
    studentId: number;
    centerIds?: number[];
    circleIds?: number[];
    range?: { from: Date; to: Date };
  }) {
    return prisma.followUpRecord.findMany({
      where: {
        studentId: input.studentId,
        ...(input.range
          ? {
              recordDate: {
                gte: input.range.from,
                lte: input.range.to
              }
            }
          : {}),
        circle: {
          center: {
            organizationId: input.organizationId,
            ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
          }
        },
        ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {})
      },
      orderBy: [{ recordDate: "desc" }, { id: "desc" }],
      select: {
        id: true,
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
        matn: {
          select: {
            titleAr: true
          }
        },
        notes: true,
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
                name: true,
                logoUrl: true
              }
            }
          }
        }
      }
    });
  },

  async studentExamRows(input: {
    organizationId: number;
    studentId: number;
    centerIds?: number[];
    circleIds?: number[];
    range?: { from: Date; to: Date };
  }) {
    return prisma.examAttempt.findMany({
      where: {
        studentId: input.studentId,
        exam: {
          organizationId: input.organizationId
        },
        ...(input.range
          ? {
              OR: [
                {
                  examDate: {
                    gte: input.range.from,
                    lte: input.range.to
                  }
                },
                {
                  createdAt: {
                    gte: input.range.from,
                    lte: input.range.to
                  }
                }
              ]
            }
          : {}),
        circle: {
          center: {
            organizationId: input.organizationId,
            ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
          }
        },
        ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {})
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        status: true,
        totalScore: true,
        gradeLabel: true,
        reviewedAt: true,
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
        },
        exam: {
          select: {
            id: true,
            title: true,
            passScore: true,
            maxScore: true,
            center: {
              select: {
                id: true,
                name: true
              }
            },
            circle: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
  },

  async attendanceRows(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    circleIds?: number[];
    studentIds?: number[];
  }) {
    const where: Prisma.AttendanceRecordWhereInput = {
      attendanceDate: {
        gte: input.range.from,
        lte: input.range.to
      },
      circle: {
        center: {
          organizationId: input.organizationId,
          ...(input.centerIds?.length
            ? {
                id: {
                  in: input.centerIds
                }
              }
            : {})
        }
      },
      ...(input.circleIds?.length
        ? {
            circleId: {
              in: input.circleIds
            }
          }
        : {}),
      ...(input.studentIds?.length
        ? {
            studentId: {
              in: input.studentIds
            }
          }
        : {})
    };

    return prisma.attendanceRecord.findMany({
      where,
      orderBy: [{ attendanceDate: "desc" }, { id: "desc" }],
      select: {
        id: true,
        attendanceDate: true,
        status: true,
        note: true,
        student: {
          select: {
            id: true,
            fullName: true,
            email: true
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
      }
    });
  },

  async followUpRows(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    circleIds?: number[];
  }) {
    const where: Prisma.FollowUpRecordWhereInput = {
      circle: {
        center: {
          organizationId: input.organizationId,
          ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
        }
      },
      ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {}),
      recordDate: {
        gte: input.range.from,
        lte: input.range.to
      }
    };

    return prisma.followUpRecord.findMany({
      where,
      orderBy: [{ recordDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        recordDate: true,
        type: true,
        status: true,
        surah: true,
        fromSurah: true,
        toSurah: true,
        fromAyah: true,
        toAyah: true,
        pagesCount: true,
        ayahCount: true,
        rating: true,
        matnName: true,
        matnStatus: true,
        matnFromRef: true,
        matnToRef: true,
        matn: {
          select: {
            titleAr: true
          }
        },
        notes: true,
        teacher: {
          select: {
            fullName: true
          }
        },
        student: {
          select: {
            fullName: true
          }
        },
        circle: {
          select: {
            name: true,
            center: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
  },

  async examsRows(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    circleIds?: number[];
    examStatus?: import("@prisma/client").ExamStatus;
    studentIds?: number[];
  }) {
    const where: Prisma.ExamAttemptWhereInput = {
      exam: {
        organizationId: input.organizationId,
        ...(input.examStatus ? { status: input.examStatus } : {})
      },
      circle: {
        center: {
          organizationId: input.organizationId,
          ...(input.centerIds?.length
            ? {
                id: {
                  in: input.centerIds
                }
              }
            : {})
        }
      },
      ...(input.circleIds?.length
        ? {
            circleId: {
              in: input.circleIds
            }
          }
        : {}),
      OR: [
        {
          examDate: {
            gte: input.range.from,
            lte: input.range.to
          }
        },
        {
          createdAt: {
            gte: input.range.from,
            lte: input.range.to
          }
        }
      ],
      ...(input.studentIds?.length
        ? {
            studentId: {
              in: input.studentIds
            }
          }
        : {})
    };

    return prisma.examAttempt.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        totalScore: true,
        student: {
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
        },
        exam: {
          select: {
            id: true,
            title: true,
            status: true,
            maxScore: true,
            passScore: true,
            center: {
              select: {
                id: true,
                name: true
              }
            },
            circle: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
  },

  async financeRows(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    status?: InvoiceStatus;
    studentIds?: number[];
  }) {
    const where: Prisma.InvoiceWhereInput = {
      student: {
        organizationId: input.organizationId,
        role: Role.STUDENT
      },
      center: {
        organizationId: input.organizationId,
        ...(input.centerIds?.length
          ? {
              id: {
                in: input.centerIds
              }
            }
          : {})
      },
      issuedAt: {
        gte: input.range.from,
        lte: input.range.to
      },
      ...(input.status ? { status: input.status } : {}),
      ...(input.studentIds?.length
        ? {
            studentId: {
              in: input.studentIds
            }
          }
        : {})
    };

    return prisma.invoice.findMany({
      where,
      orderBy: [{ issuedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        month: true,
        year: true,
        amount: true,
        status: true,
        issuedAt: true,
        student: {
          select: {
            id: true,
            fullName: true
          }
        },
        center: {
          select: {
            id: true,
            name: true
          }
        },
        payments: {
          select: {
            amount: true,
            method: true,
            receivedAt: true
          }
        }
      }
    });
  },

  async createReportRun(input: {
    organizationId: number;
    centerId?: number;
    circleId?: number;
    reportType: ReportType;
    requestedById: number;
    filters: Prisma.InputJsonValue;
  }) {
    return prisma.reportRun.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        circleId: input.circleId,
        reportType: input.reportType,
        requestedById: input.requestedById,
        status: ReportRunStatus.PENDING,
        filters: input.filters
      },
      select: reportRunSelect
    });
  },

  async markReportRunFailed(input: { runId: number; errorMessage: string }) {
    return prisma.reportRun.update({
      where: {
        id: input.runId
      },
      data: {
        status: ReportRunStatus.FAILED,
        errorMessage: input.errorMessage,
        completedAt: new Date()
      },
      select: reportRunSelect
    });
  },

  async markReportRunCompleted(input: {
    runId: number;
    outputFileId: number;
    summary: Prisma.InputJsonValue;
  }) {
    return prisma.reportRun.update({
      where: {
        id: input.runId
      },
      data: {
        status: ReportRunStatus.COMPLETED,
        outputFileId: input.outputFileId,
        completedAt: new Date(),
        summary: input.summary,
        errorMessage: null
      },
      select: reportRunSelect
    });
  },

  async createReportFile(input: {
    organizationId: number;
    centerId?: number;
    circleId?: number;
    name: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    kind: ReportFileKind;
    createdById: number;
    expiresAt?: Date;
  }) {
    return prisma.reportFile.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        circleId: input.circleId,
        name: input.name,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey,
        kind: input.kind,
        createdById: input.createdById,
        expiresAt: input.expiresAt
      },
      select: reportFileSelect
    });
  },

  async findReportFileById(input: { fileId: number; organizationId: number }) {
    return prisma.reportFile.findFirst({
      where: {
        id: input.fileId,
        organizationId: input.organizationId
      },
      select: reportFileSelect
    });
  },

  async listReportRunsByType(input: { organizationId: number; reportType: ReportType; requestedById: number }) {
    return prisma.reportRun.findMany({
      where: {
        organizationId: input.organizationId,
        reportType: input.reportType,
        requestedById: input.requestedById
      },
      orderBy: {
        requestedAt: "desc"
      },
      select: reportRunSelect
    });
  },

  async summarizeFinanceByStatus(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    studentIds?: number[];
  }) {
    const grouped = await prisma.invoice.groupBy({
      by: ["status"],
      where: {
        student: {
          organizationId: input.organizationId,
          role: Role.STUDENT
        },
        center: {
          organizationId: input.organizationId,
          ...(input.centerIds?.length
            ? {
                id: {
                  in: input.centerIds
                }
              }
            : {})
        },
        issuedAt: {
          gte: input.range.from,
          lte: input.range.to
        },
        ...(input.studentIds?.length
          ? {
              studentId: {
                in: input.studentIds
              }
            }
          : {})
      },
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    });

    return grouped.map((item) => ({
      status: item.status,
      count: item._count._all,
      amount: Number(item._sum.amount ?? 0)
    }));
  },

  async countExamsInRange(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    circleIds?: number[];
    status?: import("@prisma/client").ExamStatus;
  }) {
    const items = await prisma.examAttempt.findMany({
      where: {
        exam: {
          organizationId: input.organizationId,
          ...(input.status ? { status: input.status } : {})
        },
        circle: {
          center: {
            organizationId: input.organizationId,
            ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
          }
        },
        ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {}),
        OR: [
          {
            examDate: {
              gte: input.range.from,
              lte: input.range.to
            }
          },
          {
            createdAt: {
              gte: input.range.from,
              lte: input.range.to
            }
          }
        ]
      },
      distinct: ["examId"],
      select: {
        examId: true
      }
    });

    return items.length;
  },

  async getPreviousPeriodStats(input: {
    organizationId: number;
    range: { from: Date; to: Date };
    centerIds?: number[];
    circleIds?: number[];
  }) {
    const prevRange = {
      from: new Date(input.range.from.getTime() - (input.range.to.getTime() - input.range.from.getTime())),
      to: new Date(input.range.from.getTime())
    };

    const [attendance, followUps] = await Promise.all([
      prisma.attendanceRecord.groupBy({
        by: ["status"],
        where: {
          attendanceDate: { gte: prevRange.from, lt: prevRange.to },
          circle: {
            center: {
              organizationId: input.organizationId,
              ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
            }
          },
          ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {})
        },
        _count: { _all: true }
      }),
      prisma.followUpRecord.aggregate({
        where: {
          recordDate: { gte: prevRange.from, lt: prevRange.to },
          circle: {
            center: {
              organizationId: input.organizationId,
              ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
            }
          },
          ...(input.circleIds?.length ? { circleId: { in: input.circleIds } } : {})
        },
        _avg: { rating: true },
        _count: { _all: true }
      })
    ]);

    let totalAttendance = 0;
    let presentAttendance = 0;
    attendance.forEach(stat => {
      totalAttendance += stat._count._all;
      if (stat.status === "PRESENT" || stat.status === "LATE") presentAttendance += stat._count._all;
    });

    return {
      avgAttendance: totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0,
      avgRating: followUps._avg.rating ? Number(followUps._avg.rating.toFixed(1)) : 0,
      totalFollowUps: followUps._count._all
    };
  },

  /** REPORTS-1: Center summary for administrative reports */
  async centersSummary(input: { organizationId: number; centerIds?: number[] }) {
    return prisma.center.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
      },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        _count: {
          select: {
            circles: true,
            staffAssignments: true
          }
        }
      },
      orderBy: { name: "asc" }
    });
  },

  /** REPORTS-1: Circle summary with student counts */
  async circlesSummary(input: { organizationId: number; centerIds?: number[]; circleIds?: number[] }) {
    return prisma.circle.findMany({
      where: {
        center: {
          organizationId: input.organizationId,
          ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
        },
        ...(input.circleIds?.length ? { id: { in: input.circleIds } } : {})
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        center: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
        _count: { select: { enrollments: true } }
      },
      orderBy: [{ center: { name: "asc" } }, { name: "asc" }]
    });
  },

  /** REPORTS-1: Student summary with enrollment info */
  async studentsSummary(input: { organizationId: number; centerIds?: number[]; circleIds?: number[]; activeOnly?: boolean }) {
    const enrollmentWhere = {
      status: "ACTIVE" as const,
      circle: {
        ...(input.circleIds?.length ? { id: { in: input.circleIds } } : {}),
        center: {
          organizationId: input.organizationId,
          ...(input.centerIds?.length ? { id: { in: input.centerIds } } : {})
        }
      }
    };

    return prisma.user.findMany({
      where: {
        organizationId: input.organizationId,
        role: Role.STUDENT,
        ...(input.activeOnly !== undefined ? { isActive: input.activeOnly } : {}),
        ...(input.centerIds?.length || input.circleIds?.length
          ? {
              studentEnrollments: { some: enrollmentWhere }
            }
          : {})
      },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        studentEnrollments: {
          where: enrollmentWhere,
          select: {
            circle: {
              select: {
                id: true,
                name: true,
                center: { select: { id: true, name: true } }
              }
            }
          },
          take: 1
        },
        studentProfile: {
          select: { level: true }
        }
      },
      orderBy: { fullName: "asc" }
    });
  },

  /** REPORTS-1: Golden Records summary stats */
  async goldenRecordsSummary(input: { organizationId: number; centerIds?: number[] }) {
    return prisma.goldenRecord.findMany({
      where: {
        organizationId: input.organizationId,
        status: "APPROVED",
        ...(input.centerIds?.length
          ? {
              student: {
                studentEnrollments: { some: { circle: {
                      center: {
                        organizationId: input.organizationId,
                        id: { in: input.centerIds }
                      }
                    }
                  }
                }
              }
            }
          : {})
      },
      select: {
        id: true,
        student: { select: { id: true, fullName: true } },
        type: true,
        riwaya: true, grade: true, examDate: true,
        
        center: { select: { id: true, name: true } }
      },
      orderBy: { examDate: "desc" }
    });
  }
};
