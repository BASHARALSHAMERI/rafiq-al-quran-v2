import { MonthlyPlanStatus, Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

export const monthlyPlansRepository = {
  async findCircleWithCenter(circleId: number, organizationId: number) {
    return prisma.circle.findFirst({
      where: { id: circleId, center: { organizationId } },
      select: { id: true, centerId: true, teacherId: true }
    });
  },

  async findActiveStudents(circleId: number) {
    return prisma.studentCircleEnrollment.findMany({
      where: {
        circleId,
        status: "ACTIVE",
        student: { isActive: true }
      },
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            fullName: true,
            studentProfile: {
              select: {
                level: true,
                currentJuzz: true
              }
            },
            profile: {
              select: { fullName: true }
            }
          }
        }
      }
    });
  },

  // جلب آخر سجل متابعة للحفظ للطالب (من الشهر السابق)
  async findLastHifzFollowUp(studentId: number, circleId: number, beforeDate: Date) {
    return prisma.followUpRecord.findFirst({
      where: {
        studentId,
        circleId,
        type: "NEW_MEMORIZATION",
        status: "FINAL",
        recordDate: { lt: beforeDate }
      },
      orderBy: { recordDate: "desc" },
      select: {
        id: true,
        toSurah: true,
        toAyah: true,
        toPage: true,
        recordDate: true
      }
    });
  },

  // جلب آخر سجل متابعة للمراجعة (من الشهر السابق)
  async findLastReviewFollowUp(studentId: number, circleId: number, beforeDate: Date) {
    return prisma.followUpRecord.findFirst({
      where: {
        studentId,
        circleId,
        type: "REVIEW",
        status: "FINAL",
        recordDate: { lt: beforeDate }
      },
      orderBy: { recordDate: "desc" },
      select: {
        id: true,
        toSurah: true,
        toAyah: true,
        toPage: true,
        recordDate: true
      }
    });
  },

  // حساب معدل الحفظ في شهر معين
  async calcMonthlyHifzStats(studentId: number, circleId: number, from: Date, to: Date) {
    const records = await prisma.followUpRecord.findMany({
      where: {
        studentId,
        circleId,
        type: "NEW_MEMORIZATION",
        status: "FINAL",
        recordDate: { gte: from, lte: to }
      },
      select: { pagesCount: true, recordDate: true }
    });

    const totalPages = records.reduce(
      (sum, r) => sum + (r.pagesCount ? Number(r.pagesCount) : 0),
      0
    );
    const sessionCount = records.length;
    const dailyRate = sessionCount > 0 ? totalPages / sessionCount : 0;
    const pageSamples = records
      .map((record) => (record.pagesCount ? Number(record.pagesCount) : 0))
      .filter((pages) => pages > 0);

    return { totalPages, sessionCount, dailyRate, pageSamples };
  },

  // حساب أيام الحضور في شهر معين
  async countAttendanceDays(studentId: number, circleId: number, from: Date, to: Date) {
    return prisma.attendanceRecord.count({
      where: {
        studentId,
        circleId,
        status: "PRESENT",
        attendanceDate: { gte: from, lte: to }
      }
    });
  },

  async summarizeAttendance(studentId: number, circleId: number, from: Date, to: Date) {
    const [present, total] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          studentId,
          circleId,
          status: "PRESENT",
          attendanceDate: { gte: from, lte: to }
        }
      }),
      prisma.attendanceRecord.count({
        where: {
          studentId,
          circleId,
          attendanceDate: { gte: from, lte: to }
        }
      })
    ]);

    return { present, total };
  },

  async summarizeMonthlyProgress(studentId: number, circleId: number, from: Date, to: Date) {
    const records = await prisma.followUpRecord.findMany({
      where: {
        studentId,
        circleId,
        status: "FINAL",
        recordDate: { gte: from, lte: to }
      },
      orderBy: [{ recordDate: "desc" }, { id: "desc" }],
      select: {
        type: true,
        pagesCount: true,
        surah: true,
        toSurah: true,
        toAyah: true,
        toPage: true,
        recordDate: true
      }
    });

    const hifzPages = records
      .filter((record) => record.type === "NEW_MEMORIZATION")
      .reduce((sum, record) => sum + (record.pagesCount ? Number(record.pagesCount) : 0), 0);

    const reviewPages = records
      .filter((record) => record.type === "REVIEW")
      .reduce((sum, record) => sum + (record.pagesCount ? Number(record.pagesCount) : 0), 0);

    const latestHifz =
      records.find((record) => record.type === "NEW_MEMORIZATION" && (record.toSurah || record.surah)) ?? null;

    return {
      hifzPages,
      reviewPages,
      latestHifz
    };
  },

  async findReviewSettings(teacherId: number, circleId: number, organizationId: number) {
    return prisma.reviewPlanSettings.findFirst({
      where: {
        teacherId,
        organizationId,
        OR: [{ circleId }, { circleId: null }]
      },
      orderBy: [{ circleId: "desc" }] // يفضل الإعداد الخاص بالحلقة
    });
  },

  async upsertReviewSettings(input: {
    organizationId: number;
    teacherId: number;
    circleId?: number;
    juzThreshold5: number;
    juzThreshold10: number;
    juzThreshold20: number;
    juzThreshold30: number;
  }) {
    const existing = await prisma.reviewPlanSettings.findFirst({
      where: {
        organizationId: input.organizationId,
        teacherId: input.teacherId,
        circleId: input.circleId ?? null
      },
      select: { id: true }
    });

    if (existing) {
      return prisma.reviewPlanSettings.update({
        where: { id: existing.id },
        data: {
          juzThreshold5: input.juzThreshold5,
          juzThreshold10: input.juzThreshold10,
          juzThreshold20: input.juzThreshold20,
          juzThreshold30: input.juzThreshold30
        }
      });
    }

    return prisma.reviewPlanSettings.create({
      data: {
        organizationId: input.organizationId,
        teacherId: input.teacherId,
        circleId: input.circleId ?? null,
        juzThreshold5: input.juzThreshold5,
        juzThreshold10: input.juzThreshold10,
        juzThreshold20: input.juzThreshold20,
        juzThreshold30: input.juzThreshold30
      }
    });
  },

  async findPlanById(id: number, organizationId: number) {
    return prisma.monthlyPlan.findFirst({
      where: { id, organizationId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentProfile: { select: { level: true, currentJuzz: true } },
            profile: { select: { fullName: true } }
          }
        }
      }
    });
  },

  async findPlanByStudentMonth(input: {
    organizationId: number;
    studentId: number;
    circleId: number;
    month: number;
    year: number;
  }) {
    return prisma.monthlyPlan.findFirst({
      where: {
        organizationId: input.organizationId,
        studentId: input.studentId,
        circleId: input.circleId,
        month: input.month,
        year: input.year
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentProfile: { select: { level: true, currentJuzz: true } },
            profile: { select: { fullName: true } }
          }
        }
      }
    });
  },

  async listPlans(where: Prisma.MonthlyPlanWhereInput) {
    return prisma.monthlyPlan.findMany({
      where,
      orderBy: [{ studentId: "asc" }],
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentProfile: { select: { level: true, currentJuzz: true } },
            profile: { select: { fullName: true } }
          }
        }
      }
    });
  },

  async upsertPlan(input: {
    organizationId: number;
    centerId: number;
    circleId: number;
    studentId: number;
    teacherId: number;
    month: number;
    year: number;
    hifzFromSurah?: number | null;
    hifzFromAyah?: number | null;
    hifzToSurah?: number | null;
    hifzToAyah?: number | null;
    hifzTargetPages?: number | null;
    hifzDailyRate?: number | null;
    reviewFromSurah?: number | null;
    reviewFromAyah?: number | null;
    reviewToSurah?: number | null;
    reviewToAyah?: number | null;
    reviewTargetPages?: number | null;
    reviewDailyRate?: number | null;
  }) {
    return prisma.monthlyPlan.upsert({
      where: {
        studentId_circleId_month_year: {
          studentId: input.studentId,
          circleId: input.circleId,
          month: input.month,
          year: input.year
        }
      },
      create: {
        ...input,
        status: MonthlyPlanStatus.PENDING
      },
      update: {
        hifzFromSurah: input.hifzFromSurah,
        hifzFromAyah: input.hifzFromAyah,
        hifzToSurah: input.hifzToSurah,
        hifzToAyah: input.hifzToAyah,
        hifzTargetPages: input.hifzTargetPages,
        hifzDailyRate: input.hifzDailyRate,
        reviewFromSurah: input.reviewFromSurah,
        reviewFromAyah: input.reviewFromAyah,
        reviewToSurah: input.reviewToSurah,
        reviewToAyah: input.reviewToAyah,
        reviewTargetPages: input.reviewTargetPages,
        reviewDailyRate: input.reviewDailyRate,
        status: MonthlyPlanStatus.PENDING
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentProfile: { select: { level: true, currentJuzz: true } },
            profile: { select: { fullName: true } }
          }
        }
      }
    });
  },

  async updatePlan(id: number, data: Prisma.MonthlyPlanUpdateInput) {
    return prisma.monthlyPlan.update({ where: { id }, data });
  },

  async approvePlan(id: number) {
    return prisma.monthlyPlan.update({
      where: { id },
      data: {
        status: MonthlyPlanStatus.APPROVED,
        approvedAt: new Date()
      }
    });
  },

  async approveAllInCircle(circleId: number, month: number, year: number) {
    return prisma.monthlyPlan.updateMany({
      where: {
        circleId,
        month,
        year,
        status: { in: [MonthlyPlanStatus.PENDING, MonthlyPlanStatus.MODIFIED] }
      },
      data: {
        status: MonthlyPlanStatus.APPROVED,
        approvedAt: new Date()
      }
    });
  }
};
