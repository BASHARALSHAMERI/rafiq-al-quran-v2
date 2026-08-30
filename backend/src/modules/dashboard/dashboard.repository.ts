import { AttendanceStatus, EnrollmentStatus, type Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import {
  activeCenterWhere,
  activeCircleWhere,
  activeUserWhere
} from "../../shared/policies/active-read.policy";

export const dashboardRepository = {
  async findCircleIdsByOrganization(organizationId: number) {
    const circles = await prisma.circle.findMany({
      where: activeCircleWhere({
        center: activeCenterWhere({
          organizationId
        })
      }),
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
      where: activeCircleWhere({
        centerId: {
          in: centerIds
        },
        center: activeCenterWhere({
          organizationId
        })
      }),
      select: {
        id: true
      }
    });

    return circles.map((item) => item.id);
  },

  async countDistinctStudents(circleIds: number[]) {
    if (!circleIds.length) {
      return 0;
    }

    const rows = await prisma.studentCircleEnrollment.findMany({
      where: {
        circleId: { in: circleIds },
        status: EnrollmentStatus.ACTIVE,
        student: activeUserWhere()
      },
      distinct: ["studentId"],
      select: {
        studentId: true
      }
    });

    return rows.length;
  },

  async countDistinctTeachers(circleIds: number[]) {
    if (!circleIds.length) {
      return 0;
    }

    const rows = await prisma.circle.findMany({
      where: activeCircleWhere({
        id: {
          in: circleIds
        }
      }),
      distinct: ["teacherId"],
      select: {
        teacherId: true
      }
    });

    return rows.length;
  },

  async countCircles(circleIds: number[]) {
    if (!circleIds.length) {
      return 0;
    }

    return prisma.circle.count({
      where: activeCircleWhere({
        id: {
          in: circleIds
        }
      })
    });
  },

  async attendanceByStatus(circleIds: number[], range: { from: Date; to: Date }) {
    if (!circleIds.length) {
      return [];
    }

    return prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: {
        circleId: {
          in: circleIds
        },
        attendanceDate: {
          gte: range.from,
          lte: range.to
        }
      },
      _count: {
        _all: true
      }
    });
  },

  async latestStudentAttendanceUpdate(circleIds: number[], range: { from: Date; to: Date }) {
    if (!circleIds.length) {
      return null;
    }

    const result = await prisma.attendanceRecord.aggregate({
      where: {
        circleId: { in: circleIds },
        attendanceDate: { gte: range.from, lte: range.to }
      },
      _max: { updatedAt: true }
    });

    return result._max.updatedAt;
  },

  async staffAttendanceSummary(input: {
    organizationId: number;
    centerIds?: number[];
    range: { from: Date; to: Date };
  }) {
    const where: Prisma.StaffAttendanceRecordWhereInput = {
      organizationId: input.organizationId,
      attendanceDate: { gte: input.range.from, lte: input.range.to },
      ...(input.centerIds ? { centerId: { in: input.centerIds } } : {})
    };

    const [groups, latest] = await Promise.all([
      prisma.staffAttendanceRecord.groupBy({
        by: ["status", "staffRole"],
        where,
        _count: { _all: true }
      }),
      prisma.staffAttendanceRecord.aggregate({
        where,
        _max: { updatedAt: true }
      })
    ]);

    return { groups, latestUpdatedAt: latest._max.updatedAt };
  },

  async activityFeed(input: {
    organizationId: number;
    centerId?: number;
    circleIds: number[];
    range: { from: Date; to: Date };
    limit: number;
  }) {
    const where: Prisma.ActivityLogWhereInput = {
      organizationId: input.organizationId,
      createdAt: {
        gte: input.range.from,
        lte: input.range.to
      },
      ...(input.centerId
        ? {
            OR: [
              { centerId: input.centerId },
              { circle: { centerId: input.centerId } }
            ]
          }
        : input.circleIds.length
        ? {
            OR: [
              {
                circleId: {
                  in: input.circleIds
                }
              },
              {
                circleId: null,
                center: {
                  circles: {
                    some: {
                      id: {
                        in: input.circleIds
                      }
                    }
                  }
                }
              }
            ]
          }
        : {})
    };

    return prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      take: input.limit,
      select: {
        id: true,
        activityType: true,
        message: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        metadata: true,
        user: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
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
    });
  },

  async attendanceSummaryByCircle(circleIds: number[], range: { from: Date; to: Date }) {
    if (!circleIds.length) {
      return [];
    }

    const [grouped, circles] = await Promise.all([
      prisma.attendanceRecord.groupBy({
        by: ["circleId", "status"],
        where: {
          circleId: {
            in: circleIds
          },
          attendanceDate: {
            gte: range.from,
            lte: range.to
          }
        },
        _count: {
          _all: true
        }
      }),
      prisma.circle.findMany({
        where: activeCircleWhere({
          id: {
            in: circleIds
          }
        }),
        select: {
          id: true,
          name: true,
          teacher: {
            select: {
              id: true,
              fullName: true
            }
          },
          _count: {
            select: {
              enrollments: {
                where: {
                  status: EnrollmentStatus.ACTIVE,
                  student: activeUserWhere()
                }
              }
            }
          },
          center: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    const groupedByCircle = new Map<number, typeof grouped>();
    for (const item of grouped) {
      const rows = groupedByCircle.get(item.circleId) ?? [];
      rows.push(item);
      groupedByCircle.set(item.circleId, rows);
    }

    const result: Array<{
      circleId: number;
      circleName: string;
      centerId: number;
      centerName: string;
      teacher: { id: number; fullName: string } | null;
      activeStudents: number;
      status: AttendanceStatus | null;
      count: number;
    }> = [];

    for (const circle of circles) {
      const rows = groupedByCircle.get(circle.id) ?? [];
      const base = {
        circleId: circle.id,
        circleName: circle.name,
        centerId: circle.center.id,
        centerName: circle.center.name,
        teacher: circle.teacher,
        activeStudents: circle._count.enrollments
      };

      if (!rows.length) {
        result.push({ ...base, status: null, count: 0 });
        continue;
      }

      for (const item of rows) {
        result.push({ ...base, status: item.status, count: item._count._all });
      }
    }

    return result;
  }
};
