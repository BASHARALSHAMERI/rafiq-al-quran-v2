import { AttendanceStatus, EnrollmentStatus, Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { prisma } from "../../shared/db/prisma";

type ScopeInput = {
  organizationId: number;
  circleId: number;
  allowAll: boolean;
  scopeCircleIds: number[];
  scopeCenterIds: number[];
};

const accessibleCircleSelect = {
  id: true,
  centerId: true
} satisfies PrismaTypes.CircleSelect;

export const attendanceRepository = {
  async findAccessibleCircle(input: ScopeInput) {
    return prisma.circle.findFirst({
      where: {
        id: input.circleId,
        center: {
          organizationId: input.organizationId
        },
        ...(input.allowAll
          ? {}
          : {
              OR: [
                ...(input.scopeCircleIds.length
                  ? [
                      {
                        id: {
                          in: input.scopeCircleIds
                        }
                      }
                    ]
                  : []),
                ...(input.scopeCenterIds.length
                  ? [
                      {
                        centerId: {
                          in: input.scopeCenterIds
                        }
                      }
                    ]
                  : [])
              ]
            })
      },
      select: accessibleCircleSelect
    });
  },

  async findActiveEnrollmentStudentIds(input: { circleId: number }) {
    const rows = await prisma.studentCircleEnrollment.findMany({
      where: {
        circleId: input.circleId,
        status: EnrollmentStatus.ACTIVE,
        student: {
          isActive: true
        }
      },
      select: {
        studentId: true
      }
    });

    return rows.map((row) => row.studentId);
  },

  async findActiveEnrollmentsWithNames(input: { circleId: number }) {
    return prisma.studentCircleEnrollment.findMany({
      where: {
        circleId: input.circleId,
        status: EnrollmentStatus.ACTIVE,
        student: {
          isActive: true
        }
      },
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: [{ student: { fullName: "asc" } }]
    });
  },

  async listAttendanceForDate(input: {
    organizationId: number;
    circleId: number;
    attendanceDate: Date;
  }) {
    return prisma.attendanceRecord.findMany({
      where: {
        circleId: input.circleId,
        attendanceDate: input.attendanceDate,
        circle: {
          center: {
            organizationId: input.organizationId
          }
        }
      },
      orderBy: [{ id: "asc" }],
      select: {
        id: true,
        studentId: true,
        circleId: true,
        attendanceDate: true,
        status: true,
        note: true,
        lockVersion: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  async findAttendanceForStudentsForDate(input: {
    circleId: number;
    attendanceDate: Date;
    studentIds: number[];
  }) {
    if (!input.studentIds.length) {
      return [];
    }

    return prisma.attendanceRecord.findMany({
      where: {
        circleId: input.circleId,
        attendanceDate: input.attendanceDate,
        studentId: {
          in: input.studentIds
        }
      },
      select: {
        id: true,
        studentId: true,
        createdAt: true,
        lockVersion: true
      }
    });
  },

  async upsertBulkAttendance(input: {
    circleId: number;
    attendanceDate: Date;
    markedById: number;
    records: Array<{
      studentId: number;
      status: AttendanceStatus;
      note: string | null;
      expectedLockVersion?: number;
    }>;
  }) {
    await prisma.$transaction(async (tx) => {
      for (const record of input.records) {
        if (record.expectedLockVersion !== undefined) {
          const updated = await tx.attendanceRecord.updateMany({
            where: {
              studentId: record.studentId,
              circleId: input.circleId,
              attendanceDate: input.attendanceDate,
              lockVersion: record.expectedLockVersion
            },
            data: {
              status: record.status,
              markedById: input.markedById,
              note: record.note,
              lockVersion: {
                increment: 1
              }
            }
          });

          if (updated.count === 0) {
            throw new AppError(
              "Attendance record version conflict",
              409,
              {
                studentId: record.studentId,
                circleId: input.circleId,
                attendanceDate: input.attendanceDate.toISOString().slice(0, 10)
              },
              "VERSION_CONFLICT"
            );
          }

          continue;
        }

        try {
          await tx.attendanceRecord.create({
            data: {
              studentId: record.studentId,
              circleId: input.circleId,
              attendanceDate: input.attendanceDate,
              status: record.status,
              markedById: input.markedById,
              note: record.note
            }
          });
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
            throw error;
          }

          await tx.attendanceRecord.updateMany({
            where: {
              studentId: record.studentId,
              circleId: input.circleId,
              attendanceDate: input.attendanceDate
            },
            data: {
              status: record.status,
              markedById: input.markedById,
              note: record.note,
              lockVersion: {
                increment: 1
              }
            }
          });
        }
      }
    });
  }
};
