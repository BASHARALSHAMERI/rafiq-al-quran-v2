import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import {
  activeCenterWhere,
  activeCircleWhere,
  activeUserWhere
} from "../policies/active-read.policy";

export const scopeRepository = {
  findUserAssignments(userId: number) {
    return prisma.user.findFirst({
      // Scope resolution needs inactive users to return a deterministic 403.
      where: activeUserWhere({ id: userId }, { includeInactive: true }),
      select: {
        id: true,
        role: true,
        organizationId: true,
        isActive: true,
        centerAccesses: {
          select: {
            centerId: true
          }
        },
        managedCenters: {
          select: {
            id: true
          }
        },
        centerSupervisorLinks: {
          select: {
            centerId: true,
            isActive: true
          }
        },
        circleAccesses: {
          select: {
            circleId: true
          }
        },
        taughtCircles: {
          select: {
            id: true,
            centerId: true
          }
        },
        parentLinks: {
          select: {
            id: true,
            parentId: true,
            studentId: true
          }
        },
        studentEnrollments: {
          where: {
            status: EnrollmentStatus.ACTIVE
          },
          select: {
            circleId: true,
            circle: {
              select: {
                centerId: true
              }
            }
          }
        }
      }
    });
  },

  async findCircleIdsByCenterIds(centerIds: number[]) {
    if (!centerIds.length) {
      return [];
    }

    const circles = await prisma.circle.findMany({
      where: activeCircleWhere({
        centerId: {
          in: centerIds
        },
        center: activeCenterWhere()
      }),
      select: {
        id: true
      }
    });

    return circles.map((circle) => circle.id);
  },

  async findCenterIdsByCircleIds(circleIds: number[]) {
    if (!circleIds.length) {
      return [];
    }

    const circles = await prisma.circle.findMany({
      where: activeCircleWhere({
        id: {
          in: circleIds
        }
      }),
      select: {
        centerId: true
      }
    });

    return circles.map((circle) => circle.centerId);
  }
};
