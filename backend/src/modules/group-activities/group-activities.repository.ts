import { GroupActivityType, Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

export const groupActivitiesRepository = {
  async create(input: {
    organizationId: number;
    centerId: number;
    circleId: number;
    teacherId: number;
    activityDate: Date;
    activityType: GroupActivityType;
    title: string;
    description?: string | null;
    participantIds: number[];
  }) {
    return prisma.groupActivity.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        circleId: input.circleId,
        teacherId: input.teacherId,
        activityDate: input.activityDate,
        activityType: input.activityType,
        title: input.title,
        description: input.description ?? null,
        participants: {
          create: input.participantIds.map((studentId) => ({ studentId }))
        }
      },
      include: {
        participants: {
          select: {
            studentId: true,
            student: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      }
    });
  },

  async list(where: Prisma.GroupActivityWhereInput, page: number, pageSize: number) {
    const [data, total] = await Promise.all([
      prisma.groupActivity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }],
        include: {
          participants: {
            select: {
              studentId: true,
              student: {
                select: { id: true, fullName: true }
              }
            }
          }
        }
      }),
      prisma.groupActivity.count({ where })
    ]);
    return { data, total };
  },

  async findById(id: number, organizationId: number) {
    return prisma.groupActivity.findFirst({
      where: { id, organizationId },
      include: {
        participants: {
          select: {
            studentId: true,
            student: { select: { id: true, fullName: true } }
          }
        }
      }
    });
  },

  async findCircleWithCenter(circleId: number, organizationId: number) {
    return prisma.circle.findFirst({
      where: { id: circleId, center: { organizationId } },
      select: { id: true, centerId: true }
    });
  },

  async remove(id: number, organizationId: number) {
    return prisma.groupActivity.delete({
      where: { id }
    });
  },

  async findPresentStudentsForDate(circleId: number, date: Date) {
    return prisma.attendanceRecord.findMany({
      where: {
        circleId,
        attendanceDate: date,
        status: { in: ["PRESENT", "LATE"] }
      },
      select: { studentId: true }
    });
  }
};
