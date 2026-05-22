import {
  EnrollmentStatus,
  Prisma,
  RemoteRecitationBookingStatus
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

const remoteRecitationSettingSelect = {
  id: true,
  centerId: true,
  circleId: true,
  isEnabled: true,
  slotDurationMinutes: true,
  bookingLeadHours: true,
  cancellationWindowHours: true,
  maxAdvanceDays: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      timezone: true
    }
  },
  circle: {
    select: {
      id: true,
      name: true,
      teacherId: true,
      teacher: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  }
} satisfies Prisma.RemoteRecitationSettingSelect;

const remoteRecitationSlotSelect = {
  id: true,
  centerId: true,
  circleId: true,
  teacherId: true,
  startsAt: true,
  endsAt: true,
  joinUrl: true,
  providerHost: true,
  note: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lockVersion: true,
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
      isActive: true,
      teacherId: true,
      center: {
        select: {
          id: true,
          name: true,
          timezone: true,
          isActive: true
        }
      },
      remoteRecitationSetting: {
        select: {
          id: true,
          isEnabled: true,
          slotDurationMinutes: true,
          bookingLeadHours: true,
          cancellationWindowHours: true,
          maxAdvanceDays: true
        }
      }
    }
  }
} satisfies Prisma.RemoteRecitationSlotSelect;

const remoteRecitationBookingSelect = {
  id: true,
  centerId: true,
  circleId: true,
  slotId: true,
  studentId: true,
  teacherId: true,
  status: true,
  requestedAt: true,
  reviewedAt: true,
  reviewNote: true,
  cancelledAt: true,
  cancellationReason: true,
  completedAt: true,
  followUpRecordId: true,
  createdAt: true,
  updatedAt: true,
  lockVersion: true,
  student: {
    select: {
      id: true,
      fullName: true
    }
  },
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
      isActive: true,
      teacherId: true,
      center: {
        select: {
          id: true,
          name: true,
          timezone: true,
          isActive: true
        }
      },
      remoteRecitationSetting: {
        select: {
          id: true,
          isEnabled: true,
          slotDurationMinutes: true,
          bookingLeadHours: true,
          cancellationWindowHours: true,
          maxAdvanceDays: true
        }
      }
    }
  },
  slot: {
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      joinUrl: true,
      providerHost: true,
      note: true,
      isActive: true,
      lockVersion: true
    }
  },
  followUpRecord: {
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
      rating: true,
      matnName: true,
      matnStatus: true,
      notes: true
    }
  }
} satisfies Prisma.RemoteRecitationBookingSelect;

export type RemoteRecitationSettingItem = Prisma.RemoteRecitationSettingGetPayload<{
  select: typeof remoteRecitationSettingSelect;
}>;

export type RemoteRecitationSlotItem = Prisma.RemoteRecitationSlotGetPayload<{
  select: typeof remoteRecitationSlotSelect;
}>;

export type RemoteRecitationBookingItem = Prisma.RemoteRecitationBookingGetPayload<{
  select: typeof remoteRecitationBookingSelect;
}>;

export type CreateRemoteRecitationSlotInput = {
  centerId: number;
  circleId: number;
  teacherId: number;
  startsAt: Date;
  endsAt: Date;
  joinUrl: string;
  providerHost?: string | null;
  note?: string | null;
};

export type UpdateRemoteRecitationSlotInput = {
  startsAt?: Date;
  endsAt?: Date;
  joinUrl?: string;
  providerHost?: string | null;
  note?: string | null;
  isActive?: boolean;
};

export type CreateRemoteRecitationBookingInput = {
  centerId: number;
  circleId: number;
  slotId: number;
  studentId: number;
  teacherId: number;
  status?: RemoteRecitationBookingStatus;
};

export type UpdateRemoteRecitationBookingInput = {
  status?: RemoteRecitationBookingStatus;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  completedAt?: Date | null;
  followUpRecordId?: number | null;
};

export const remoteRecitationRepository = {
  async findCircleContext(input: { circleId: number }) {
    return prisma.circle.findFirst({
      where: {
        id: input.circleId,
      },
      select: {
        id: true,
        name: true,
        teacherId: true,
        isActive: true,
        centerId: true,
        center: {
          select: {
            id: true,
            name: true,
            timezone: true,
            organizationId: true,
            isActive: true
          }
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
            isActive: true
          }
        },
        remoteRecitationSetting: {
          select: {
            id: true,
            isEnabled: true,
            slotDurationMinutes: true,
            bookingLeadHours: true,
            cancellationWindowHours: true,
            maxAdvanceDays: true
          }
        }
      }
    });
  },

  async findSettingByCircleId(input: { circleId: number }) {
    return prisma.remoteRecitationSetting.findFirst({
      where: {
        circleId: input.circleId
      },
      select: remoteRecitationSettingSelect
    });
  },

  async upsertSetting(
    input: {
      centerId: number;
      circleId: number;
      isEnabled: boolean;
      slotDurationMinutes: number;
      bookingLeadHours: number;
      cancellationWindowHours: number;
      maxAdvanceDays: number;
    },
    db: DbClient = prisma
  ) {
    return db.remoteRecitationSetting.upsert({
      where: {
        circleId: input.circleId
      },
      create: {
        centerId: input.centerId,
        circleId: input.circleId,
        isEnabled: input.isEnabled,
        slotDurationMinutes: input.slotDurationMinutes,
        bookingLeadHours: input.bookingLeadHours,
        cancellationWindowHours: input.cancellationWindowHours,
        maxAdvanceDays: input.maxAdvanceDays
      } as Prisma.RemoteRecitationSettingUncheckedCreateInput,

      update: {
        centerId: input.centerId,
        isEnabled: input.isEnabled,
        slotDurationMinutes: input.slotDurationMinutes,
        bookingLeadHours: input.bookingLeadHours,
        cancellationWindowHours: input.cancellationWindowHours,
        maxAdvanceDays: input.maxAdvanceDays
      },
      select: remoteRecitationSettingSelect
    });
  },

  async findOverlappingSlot(input: {
    teacherId: number;
    startsAt: Date;
    endsAt: Date;
    excludeSlotId?: number;
  }) {
    return prisma.remoteRecitationSlot.findFirst({
      where: {
        teacherId: input.teacherId,
        isActive: true,
        ...(input.excludeSlotId
          ? {
              id: {
                not: input.excludeSlotId
              }
            }
          : {}),
        startsAt: {
          lt: input.endsAt
        },
        endsAt: {
          gt: input.startsAt
        }
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true
      }
    });
  },

  async findSlotById(id: number) {
    return prisma.remoteRecitationSlot.findFirst({
      where: {
        id,
      },
      select: remoteRecitationSlotSelect
    });
  },

  async listSlots(
    where: Prisma.RemoteRecitationSlotWhereInput,
    page: number,
    pageSize: number
  ) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      prisma.remoteRecitationSlot.findMany({
        where,
        orderBy: [{ startsAt: "asc" }, { id: "asc" }],
        skip,
        take: pageSize,
        select: remoteRecitationSlotSelect
      }),
      prisma.remoteRecitationSlot.count({ where })
    ]);

    return { data, total };
  },

  async createSlot(input: CreateRemoteRecitationSlotInput, db: DbClient = prisma) {
    return db.remoteRecitationSlot.create({
      data: {
        centerId: input.centerId,
        circleId: input.circleId,
        teacherId: input.teacherId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        joinUrl: input.joinUrl,
        providerHost: input.providerHost ?? null,
        note: input.note ?? null
      } as Prisma.RemoteRecitationSlotUncheckedCreateInput,

      select: remoteRecitationSlotSelect
    });
  },

  async updateSlot(
    id: number,
    input: UpdateRemoteRecitationSlotInput,
    expectedLockVersion: number | undefined,
    db: DbClient = prisma
  ) {
    const result = await db.remoteRecitationSlot.updateMany({
      where: {
        id,
        ...(typeof expectedLockVersion === "number"
          ? { lockVersion: expectedLockVersion }
          : {})
      },
      data: {
        ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
        ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
        ...(input.joinUrl !== undefined ? { joinUrl: input.joinUrl } : {}),
        ...(input.providerHost !== undefined ? { providerHost: input.providerHost } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        lockVersion: {
          increment: 1
        }
      }
    });

    if (!result.count) {
      return null;
    }

    return db.remoteRecitationSlot.findUnique({
      where: { id },
      select: remoteRecitationSlotSelect
    });
  },

  async findBlockingBookingForSlot(input: {
    slotId: number;
    excludeBookingId?: number;
    statuses?: RemoteRecitationBookingStatus[];
  }) {
    return prisma.remoteRecitationBooking.findFirst({
      where: {
        slotId: input.slotId,
        ...(input.excludeBookingId
          ? {
              id: {
                not: input.excludeBookingId
              }
            }
          : {}),
        status: {
          in: input.statuses ?? [
            RemoteRecitationBookingStatus.REQUESTED,
            RemoteRecitationBookingStatus.APPROVED,
            RemoteRecitationBookingStatus.COMPLETED
          ]
        }
      },
      select: {
        id: true,
        status: true
      }
    });
  },

  async findActiveEnrollment(input: { studentId: number; circleId: number }) {
    return prisma.studentCircleEnrollment.findFirst({
      where: {
        studentId: input.studentId,
        circleId: input.circleId,
        status: EnrollmentStatus.ACTIVE
      },
      select: {
        id: true
      }
    });
  },

  async createBooking(input: CreateRemoteRecitationBookingInput, db: DbClient = prisma) {
    return db.remoteRecitationBooking.create({
      data: {
        centerId: input.centerId,
        circleId: input.circleId,
        slotId: input.slotId,
        studentId: input.studentId,
        teacherId: input.teacherId,
        status: input.status ?? RemoteRecitationBookingStatus.REQUESTED
      } as Prisma.RemoteRecitationBookingUncheckedCreateInput,

      select: remoteRecitationBookingSelect
    });
  },

  async findBookingById(id: number) {
    return prisma.remoteRecitationBooking.findFirst({
      where: {
        id,
      },
      select: remoteRecitationBookingSelect
    });
  },

  async listBookings(
    where: Prisma.RemoteRecitationBookingWhereInput,
    page: number,
    pageSize: number,
    orderBy: Prisma.RemoteRecitationBookingOrderByWithRelationInput[] = [
      { requestedAt: "desc" },
      { id: "desc" }
    ]
  ) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      prisma.remoteRecitationBooking.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: remoteRecitationBookingSelect
      }),
      prisma.remoteRecitationBooking.count({ where })
    ]);

    return { data, total };
  },

  async updateBooking(
    id: number,
    input: UpdateRemoteRecitationBookingInput,
    expectedLockVersion: number | undefined,
    db: DbClient = prisma
  ) {
    const result = await db.remoteRecitationBooking.updateMany({
      where: {
        id,
        ...(typeof expectedLockVersion === "number"
          ? { lockVersion: expectedLockVersion }
          : {})
      },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.reviewedAt !== undefined ? { reviewedAt: input.reviewedAt } : {}),
        ...(input.reviewNote !== undefined ? { reviewNote: input.reviewNote } : {}),
        ...(input.cancelledAt !== undefined ? { cancelledAt: input.cancelledAt } : {}),
        ...(input.cancellationReason !== undefined
          ? { cancellationReason: input.cancellationReason }
          : {}),
        ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
        ...(input.followUpRecordId !== undefined
          ? { followUpRecordId: input.followUpRecordId }
          : {}),
        lockVersion: {
          increment: 1
        }
      }
    });

    if (!result.count) {
      return null;
    }

    return db.remoteRecitationBooking.findUnique({
      where: { id },
      select: remoteRecitationBookingSelect
    });
  },

  async findBookingNotificationContext(input: { bookingId: number }) {
    return prisma.remoteRecitationBooking.findFirst({
      where: {
        id: input.bookingId,
      },
      select: {
        id: true,
        slotId: true,
        status: true,
        requestedAt: true,
        reviewedAt: true,
        completedAt: true,
        student: {
          select: {
            id: true,
            fullName: true
          }
        },
        teacher: {
          select: {
            id: true,
            fullName: true
          }
        },
        slot: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true
          }
        },
        circle: {
          select: {
            id: true,
            name: true,
            centerId: true,
            center: {
              select: {
                id: true,
                name: true,
                timezone: true
              }
            }
          }
        }
      }
    });
  }
};
