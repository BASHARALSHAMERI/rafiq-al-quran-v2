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

  async activityFeed(input: {
    organizationId: number;
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
      ...(input.circleIds.length
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
          center: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    const circleMap = new Map(circles.map((circle) => [circle.id, circle]));

    return grouped.map((item) => ({
      circleId: item.circleId,
      circleName: circleMap.get(item.circleId)?.name ?? "Unknown",
      centerId: circleMap.get(item.circleId)?.center.id ?? null,
      centerName: circleMap.get(item.circleId)?.center.name ?? null,
      status: item.status,
      count: item._count._all
    }));
  }
};
