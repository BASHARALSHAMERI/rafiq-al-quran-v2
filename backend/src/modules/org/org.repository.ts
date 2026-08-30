import {
  Prisma,
  Role,
  type CircleScheduleMode,
  type CircleType,
  type Gender,
  type PrayerName,
  type Weekday,
  type CircleApprovalStatus
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { activeCenterWhere, activeCircleWhere, activeUserWhere } from "../../shared/policies/active-read.policy";

type CenterFilter = {
  organizationId: number;
  centerIds?: number[];
};

type CircleFilter = {
  organizationId: number;
  centerIds?: number[];
  circleIds?: number[];
  approvalStatuses?: CircleApprovalStatus[];
};

type CenterByIdFilter = {
  organizationId: number;
  centerId: number;
  centerIds?: number[];
  includeInactive?: boolean;
};

type CircleByIdFilter = {
  organizationId: number;
  circleId: number;
  centerIds?: number[];
  circleIds?: number[];
  includeInactive?: boolean;
};

type OrgUserFilter = {
  organizationId: number;
  userId: number;
  includeInactive?: boolean;
};

type CreateCenterInput = {
  organizationId: number;
  name: string;
  gender: Gender;
  logoUrl?: string | null;
  mosqueName?: string | null;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  timezone: string;
  centerAdminUserId: number;
  supervisorUserIds: number[];
  code: string;
  isActive?: boolean;
};

type UpdateCenterInput = {
  centerId: number;
  name?: string;
  gender?: Gender;
  logoUrl?: string | null;
  mosqueName?: string | null;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  timezone?: string | null;
  centerAdminUserId?: number;
  supervisorUserIds?: number[];
  isActive?: boolean;
};

type UpdateOrganizationBrandingInput = {
  organizationId: number;
  name?: string;
  logoUrl?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  associationLocationName?: string | null;
  associationAddress?: string | null;
  associationLatitude?: number | null;
  associationLongitude?: number | null;
  associationGeoRadiusMeters?: number | null;
};

type CreateCircleInput = {
  centerId: number;
  name: string;
  gender: Gender;
  circleType: CircleType;
  teacherId: number;
  mosqueName?: string | null;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  weeklySchedule?: CircleScheduleSlotInput[];
  isActive?: boolean;
  approvalStatus?: CircleApprovalStatus;
  approvedById?: number | null;
};

type UpdateCircleInput = {
  circleId: number;
  name?: string;
  circleType?: CircleType;
  teacherId?: number;
  mosqueName?: string | null;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  weeklySchedule?: CircleScheduleSlotInput[];
  isActive?: boolean;
};

type CircleScheduleSlotInput = {
  dayOfWeek: Weekday;
  mode: CircleScheduleMode;
  fromTime?: string | null;
  toTime?: string | null;
  fromPrayer?: PrayerName | null;
  toPrayer?: PrayerName | null;
};

const centerSelect = {
  id: true,
  organizationId: true,
  name: true,
  gender: true,
  logoUrl: true,
  mosqueName: true,
  locationText: true,
  latitude: true,
  longitude: true,
  allowedRadiusMeters: true,
  timezone: true,
  centerAdminUserId: true,
  code: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  centerAdmin: {
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true
    }
  },
  centerSupervisors: {
    where: {
      isActive: true
    },
    orderBy: [{ supervisor: { fullName: "asc" } }],
    select: {
      id: true,
      isActive: true,
      supervisorUserId: true,
      supervisor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true
        }
      }
    }
  },
  _count: {
    select: {
      circles: true
    }
  },
  staffSchedules: {
    where: {
      staffRole: "CENTER_ADMIN",
      isActive: true
    },
    select: {
      id: true,
      userId: true,
      isActive: true,
      slots: {
        select: {
          id: true,
          dayOfWeek: true,
          mode: true,
          fromTime: true,
          toTime: true,
          fromPrayer: true,
          toPrayer: true
        }
      }
    }
  }
} satisfies Prisma.CenterSelect;

const organizationBrandingSelect = {
  id: true,
  name: true,
  code: true,
  logoUrl: true,
  description: true,
  address: true,
  phone: true,
  email: true,
  associationLocationName: true,
  associationAddress: true,
  associationLatitude: true,
  associationLongitude: true,
  associationGeoRadiusMeters: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.OrganizationSelect;

const circleSelect = {
  id: true,
  name: true,
  gender: true,
  circleType: true,
  isActive: true,
  centerId: true,
  teacherId: true,
  mosqueName: true,
  locationText: true,
  latitude: true,
  longitude: true,
  allowedRadiusMeters: true,
  approvalStatus: true,
  approvedById: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      gender: true,
      code: true,
      isActive: true
    }
  },
  teacher: {
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true
    }
  },
  _count: {
    select: {
      enrollments: true
    }
  },
  weeklyScheduleSlots: {
    select: {
      id: true,
      dayOfWeek: true,
      mode: true,
      fromTime: true,
      toTime: true,
      fromPrayer: true,
      toPrayer: true
    }
  }
} satisfies Prisma.CircleSelect;

const circleListSelect = {
  id: true,
  name: true,
  gender: true,
  circleType: true,
  isActive: true,
  centerId: true,
  teacherId: true,
  mosqueName: true,
  locationText: true,
  latitude: true,
  longitude: true,
  allowedRadiusMeters: true,
  approvalStatus: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      gender: true,
      code: true,
      isActive: true
    }
  },
  teacher: {
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true
    }
  },
  _count: {
    select: {
      enrollments: true
    }
  },
  weeklyScheduleSlots: {
    select: {
      id: true,
      dayOfWeek: true,
      mode: true,
      fromTime: true,
      toTime: true,
      fromPrayer: true,
      toPrayer: true
    }
  }
} satisfies Prisma.CircleSelect;

const centerCoreSelect = {
  id: true,
  organizationId: true,
  name: true,
  gender: true,
  timezone: true,
  isActive: true,
  centerAdminUserId: true
} satisfies Prisma.CenterSelect;

const orgUserSelect = {
  id: true,
  organizationId: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  centerAccesses: {
    select: {
      centerId: true
    }
  },
  circleAccesses: {
    select: {
      circleId: true,
      circle: {
        select: {
          centerId: true
        }
      }
    }
  },
  taughtCircles: {
    select: {
      id: true,
      centerId: true
    }
  }
} satisfies Prisma.UserSelect;

type Tx = Prisma.TransactionClient;

const createStaffAssignment = async (
  tx: Tx,
  input: {
    organizationId: number;
    userId: number;
    assignmentType: "CENTER_ADMIN" | "CENTER_SUPERVISOR" | "CIRCLE_TEACHER" | "CIRCLE_SUPERVISOR";
    centerId?: number | null;
    circleId?: number | null;
    createdById?: number | null;
  }
) => {
  await tx.staffAssignment.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      assignmentType: input.assignmentType,
      centerId: input.centerId ?? null,
      circleId: input.circleId ?? null,
      effectiveFrom: new Date(),
      isActive: true,
      createdById: input.createdById ?? null
    }
  });
};

const closeStaffAssignment = async (
  tx: Tx,
  input: {
    userId: number;
    assignmentType: "CENTER_ADMIN" | "CENTER_SUPERVISOR" | "CIRCLE_TEACHER" | "CIRCLE_SUPERVISOR";
    centerId?: number | null;
    circleId?: number | null;
    endReason?: string;
    endedById?: number | null;
  }
) => {
  await tx.staffAssignment.updateMany({
    where: {
      userId: input.userId,
      assignmentType: input.assignmentType,
      isActive: true,
      ...(input.centerId ? { centerId: input.centerId } : {}),
      ...(input.circleId ? { circleId: input.circleId } : {})
    },
    data: {
      isActive: false,
      effectiveTo: new Date(),
      endReason: input.endReason ?? "Replaced",
      endedById: input.endedById ?? null
    }
  });
};

const syncCenterAdminAccess = async (
  tx: Tx,
  input: { centerId: number; nextCenterAdminUserId: number; previousCenterAdminUserId?: number | null }
) => {
  await tx.userCenterAccess.upsert({
    where: {
      userId_centerId: {
        userId: input.nextCenterAdminUserId,
        centerId: input.centerId
      }
    },
    create: {
      userId: input.nextCenterAdminUserId,
      centerId: input.centerId
    },
    update: {}
  });

  if (
    input.previousCenterAdminUserId &&
    input.previousCenterAdminUserId !== input.nextCenterAdminUserId
  ) {
    await tx.userCenterAccess.deleteMany({
      where: {
        userId: input.previousCenterAdminUserId,
        centerId: input.centerId
      }
    });
  }
};

const syncCenterSupervisors = async (
  tx: Tx,
  input: { centerId: number; supervisorUserIds: number[] }
) => {
  const nextIds = [...new Set(input.supervisorUserIds)];
  const existing = await tx.centerSupervisor.findMany({
    where: { centerId: input.centerId },
    select: { supervisorUserId: true, isActive: true }
  });

  const existingIds = new Set(existing.map((item) => item.supervisorUserId));
  const activeIds = new Set(existing.filter((item) => item.isActive).map((item) => item.supervisorUserId));

  const toCreate = nextIds.filter((id) => !existingIds.has(id));
  const toActivate = nextIds.filter((id) => existingIds.has(id) && !activeIds.has(id));
  const toDeactivate = [...activeIds].filter((id) => !nextIds.includes(id));

  if (toCreate.length) {
    await tx.centerSupervisor.createMany({
      data: toCreate.map((supervisorUserId) => ({
        centerId: input.centerId,
        supervisorUserId,
        isActive: true
      })),
      skipDuplicates: true
    });
  }

  if (toActivate.length) {
    await tx.centerSupervisor.updateMany({
      where: {
        centerId: input.centerId,
        supervisorUserId: { in: toActivate }
      },
      data: {
        isActive: true
      }
    });
  }

  if (toDeactivate.length) {
    await tx.centerSupervisor.updateMany({
      where: {
        centerId: input.centerId,
        supervisorUserId: { in: toDeactivate }
      },
      data: {
        isActive: false
      }
    });
  }

  if (nextIds.length) {
    await tx.userCenterAccess.createMany({
      data: nextIds.map((userId) => ({ userId, centerId: input.centerId })),
      skipDuplicates: true
    });
  }

  if (toDeactivate.length) {
    await tx.userCenterAccess.deleteMany({
      where: {
        centerId: input.centerId,
        userId: { in: toDeactivate }
      }
    });
  }
};

export const orgRepository = {
  async listCenters(filter: CenterFilter) {
    const where = activeCenterWhere(
      {
        organizationId: filter.organizationId,
        ...(filter.centerIds?.length
          ? {
              id: {
                in: filter.centerIds
              }
            }
          : {})
      },
      { includeInactive: true }
    );

    return prisma.center.findMany({
      where,
      orderBy: [{ name: "asc" }],
      select: centerSelect
    });
  },

  async listCircles(filter: CircleFilter) {
    const where: Prisma.CircleWhereInput = activeCircleWhere(
      {
        center: activeCenterWhere(
          {
            organizationId: filter.organizationId,
            ...(filter.centerIds?.length
              ? {
                  id: {
                    in: filter.centerIds
                  }
                }
              : {})
          },
          { includeInactive: true }
        ),
        ...(filter.circleIds?.length
          ? {
              id: {
                in: filter.circleIds
              }
            }
          : {}),
        ...(filter.approvalStatuses?.length
          ? {
              approvalStatus: {
                in: filter.approvalStatuses
              }
            }
          : {})
      },
      { includeInactive: true }
    );

    return prisma.circle.findMany({
      where,
      orderBy: [{ centerId: "asc" }, { name: "asc" }],
      select: circleListSelect
    });
  },

  async findCenterById(filter: CenterByIdFilter) {
    const where = activeCenterWhere(
      {
        organizationId: filter.organizationId,
        AND: [
          { id: filter.centerId },
          ...(filter.centerIds?.length
            ? [
                {
                  id: {
                    in: filter.centerIds
                  }
                }
              ]
            : [])
        ]
      },
      { includeInactive: filter.includeInactive }
    );

    return prisma.center.findFirst({
      where,
      select: centerSelect
    });
  },

  async findCenterCoreById(filter: CenterByIdFilter) {
    const where = activeCenterWhere(
      {
        organizationId: filter.organizationId,
        AND: [
          { id: filter.centerId },
          ...(filter.centerIds?.length
            ? [
                {
                  id: {
                    in: filter.centerIds
                  }
                }
              ]
            : [])
        ]
      },
      { includeInactive: filter.includeInactive }
    );

    return prisma.center.findFirst({
      where,
      select: centerCoreSelect
    });
  },

  async listCenterCodesByOrganization(organizationId: number) {
    const rows = await prisma.center.findMany({
      where: { organizationId },
      select: { code: true }
    });

    return rows.map((row) => row.code);
  },

  async findOrgUserById(filter: OrgUserFilter) {
    return prisma.user.findFirst({
      where: activeUserWhere(
        {
          id: filter.userId,
          organizationId: filter.organizationId
        },
        { includeInactive: filter.includeInactive }
      ),
      select: orgUserSelect
    });
  },

  async createCenter(input: CreateCenterInput) {
    return prisma.$transaction(async (tx) => {
      const center = await tx.center.create({
        data: {
          organizationId: input.organizationId,
          name: input.name,
          gender: input.gender,
          logoUrl: input.logoUrl ?? null,
          mosqueName: input.mosqueName ?? null,
          locationText: input.locationText ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          allowedRadiusMeters: input.allowedRadiusMeters ?? null,
          timezone: input.timezone,
          centerAdminUserId: input.centerAdminUserId,
          code: input.code,
          isActive: input.isActive ?? true
        },
        select: {
          id: true,
          centerAdminUserId: true
        }
      });

      await syncCenterAdminAccess(tx, {
        centerId: center.id,
        nextCenterAdminUserId: input.centerAdminUserId
      });
      await syncCenterSupervisors(tx, {
        centerId: center.id,
        supervisorUserIds: input.supervisorUserIds
      });

      await createStaffAssignment(tx, {
        organizationId: input.organizationId,
        userId: input.centerAdminUserId,
        assignmentType: "CENTER_ADMIN",
        centerId: center.id
      });
      for (const supervisorId of input.supervisorUserIds) {
        await createStaffAssignment(tx, {
          organizationId: input.organizationId,
          userId: supervisorId,
          assignmentType: "CENTER_SUPERVISOR",
          centerId: center.id
        });
      }

      return tx.center.findUniqueOrThrow({
        where: { id: center.id },
        select: centerSelect
      });
    });
  },

  async updateCenter(input: UpdateCenterInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.center.findUnique({
        where: { id: input.centerId },
        select: {
          id: true,
          organizationId: true,
          centerAdminUserId: true
        }
      });

      if (!existing) {
        throw new Error("CENTER_NOT_FOUND");
      }

      await tx.center.update({
        where: { id: input.centerId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.gender !== undefined ? { gender: input.gender } : {}),
          ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl ?? null } : {}),
          ...(input.mosqueName !== undefined ? { mosqueName: input.mosqueName ?? null } : {}),
          ...(input.locationText !== undefined ? { locationText: input.locationText ?? null } : {}),
          ...(input.latitude !== undefined ? { latitude: input.latitude ?? null } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude ?? null } : {}),
          ...(input.allowedRadiusMeters !== undefined ? { allowedRadiusMeters: input.allowedRadiusMeters ?? null } : {}),
          ...(input.timezone !== undefined ? { timezone: input.timezone ?? "Asia/Aden" } : {}),
          ...(input.centerAdminUserId !== undefined
            ? { centerAdminUserId: input.centerAdminUserId }
            : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
        }
      });

      if (input.centerAdminUserId !== undefined) {
        await syncCenterAdminAccess(tx, {
          centerId: input.centerId,
          nextCenterAdminUserId: input.centerAdminUserId,
          previousCenterAdminUserId: existing.centerAdminUserId
        });
        if (existing.centerAdminUserId !== input.centerAdminUserId) {
          await closeStaffAssignment(tx, {
            userId: existing.centerAdminUserId,
            assignmentType: "CENTER_ADMIN",
            centerId: input.centerId,
            endReason: "Replaced by new center admin"
          });
          await createStaffAssignment(tx, {
            organizationId: existing.organizationId,
            userId: input.centerAdminUserId,
            assignmentType: "CENTER_ADMIN",
            centerId: input.centerId
          });
        }
      }

      if (input.supervisorUserIds !== undefined) {
        const prevSupervisors = await tx.centerSupervisor.findMany({
          where: { centerId: input.centerId, isActive: true },
          select: { supervisorUserId: true }
        });
        const prevIds = new Set(prevSupervisors.map((s) => s.supervisorUserId));
        const nextIds = new Set(input.supervisorUserIds);

        for (const removedId of prevIds) {
          if (!nextIds.has(removedId)) {
            await closeStaffAssignment(tx, {
              userId: removedId,
              assignmentType: "CENTER_SUPERVISOR",
              centerId: input.centerId,
              endReason: "Removed from center supervisors"
            });
          }
        }
        for (const addedId of nextIds) {
          if (!prevIds.has(addedId)) {
            await createStaffAssignment(tx, {
              organizationId: existing.organizationId,
              userId: addedId,
              assignmentType: "CENTER_SUPERVISOR",
              centerId: input.centerId
            });
          }
        }

        await syncCenterSupervisors(tx, {
          centerId: input.centerId,
          supervisorUserIds: input.supervisorUserIds
        });
      }

      return tx.center.findUniqueOrThrow({
        where: { id: input.centerId },
        select: centerSelect
      });
    });
  },

  async findCircleById(filter: CircleByIdFilter) {
    const where: Prisma.CircleWhereInput = activeCircleWhere(
      {
        AND: [
          { id: filter.circleId },
          ...(filter.circleIds?.length
            ? [
                {
                  id: {
                    in: filter.circleIds
                  }
                }
              ]
            : [])
        ],
        center: activeCenterWhere(
          {
            organizationId: filter.organizationId,
            ...(filter.centerIds?.length
              ? {
                  id: {
                    in: filter.centerIds
                  }
                }
              : {})
          },
          { includeInactive: filter.includeInactive }
        )
      },
      { includeInactive: filter.includeInactive }
    );

    return prisma.circle.findFirst({
      where,
      select: circleSelect
    });
  },

  async createCircle(input: CreateCircleInput) {
    return prisma.$transaction(async (tx) => {
      const circle = await tx.circle.create({
        data: {
          centerId: input.centerId,
          name: input.name,
          gender: input.gender,
          circleType: input.circleType,
          teacherId: input.teacherId,
          mosqueName: input.mosqueName ?? null,
          locationText: input.locationText ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          allowedRadiusMeters: input.allowedRadiusMeters ?? null,
          isActive: input.isActive ?? true,
          approvalStatus: input.approvalStatus,
          approvedById: input.approvedById,
          approvedAt: input.approvedById ? new Date() : null
        },
        select: {
          id: true
        }
      });

      await tx.userCircleAccess.upsert({
        where: {
          userId_circleId: {
            userId: input.teacherId,
            circleId: circle.id
          }
        },
        create: {
          userId: input.teacherId,
          circleId: circle.id
        },
        update: {}
      });

      if (input.weeklySchedule?.length) {
        await tx.circleScheduleSlot.createMany({
          data: input.weeklySchedule.map((slot) => ({
            circleId: circle.id,
            dayOfWeek: slot.dayOfWeek,
            mode: slot.mode,
            fromTime: slot.fromTime ?? null,
            toTime: slot.toTime ?? null,
            fromPrayer: slot.fromPrayer ?? null,
            toPrayer: slot.toPrayer ?? null
          }))
        });
      }

      const parentCenter = await tx.center.findUnique({
        where: { id: input.centerId },
        select: { organizationId: true }
      });
      if (parentCenter) {
        await createStaffAssignment(tx, {
          organizationId: parentCenter.organizationId,
          userId: input.teacherId,
          assignmentType: "CIRCLE_TEACHER",
          centerId: input.centerId,
          circleId: circle.id
        });
      }

      return tx.circle.findUniqueOrThrow({
        where: { id: circle.id },
        select: circleSelect
      });
    });
  },

  async updateCircle(input: UpdateCircleInput) {
    return prisma.$transaction(async (tx) => {
      const existingCircle = await tx.circle.findUnique({
        where: { id: input.circleId },
        select: { id: true, teacherId: true, centerId: true, center: { select: { organizationId: true } } }
      });

      const circle = await tx.circle.update({
        where: { id: input.circleId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.circleType !== undefined ? { circleType: input.circleType } : {}),
          ...(input.teacherId !== undefined ? { teacherId: input.teacherId } : {}),
          ...(input.mosqueName !== undefined ? { mosqueName: input.mosqueName ?? null } : {}),
          ...(input.locationText !== undefined ? { locationText: input.locationText ?? null } : {}),
          ...(input.latitude !== undefined ? { latitude: input.latitude ?? null } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude ?? null } : {}),
          ...(input.allowedRadiusMeters !== undefined
            ? { allowedRadiusMeters: input.allowedRadiusMeters ?? null }
            : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
        },
        select: {
          id: true,
          teacherId: true
        }
      });

      if (input.teacherId !== undefined) {
        await tx.userCircleAccess.upsert({
          where: {
            userId_circleId: {
              userId: input.teacherId,
              circleId: circle.id
            }
          },
          create: {
            userId: input.teacherId,
            circleId: circle.id
          },
          update: {}
        });

        if (existingCircle && existingCircle.teacherId !== input.teacherId) {
          await closeStaffAssignment(tx, {
            userId: existingCircle.teacherId,
            assignmentType: "CIRCLE_TEACHER",
            circleId: input.circleId,
            endReason: "Replaced by new teacher"
          });
          await createStaffAssignment(tx, {
            organizationId: existingCircle.center.organizationId,
            userId: input.teacherId,
            assignmentType: "CIRCLE_TEACHER",
            centerId: existingCircle.centerId,
            circleId: input.circleId
          });
        }
      }

      if (input.weeklySchedule !== undefined) {
        await tx.circleScheduleSlot.deleteMany({
          where: { circleId: circle.id }
        });

        if (input.weeklySchedule.length) {
          await tx.circleScheduleSlot.createMany({
            data: input.weeklySchedule.map((slot) => ({
              circleId: circle.id,
              dayOfWeek: slot.dayOfWeek,
              mode: slot.mode,
              fromTime: slot.fromTime ?? null,
              toTime: slot.toTime ?? null,
              fromPrayer: slot.fromPrayer ?? null,
              toPrayer: slot.toPrayer ?? null
            }))
          });
        }
      }

      return tx.circle.findUniqueOrThrow({
        where: { id: circle.id },
        select: circleSelect
      });
    });
  },

  async getOrganizationBranding(organizationId: number) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      select: organizationBrandingSelect
    });
  },

  async updateOrganizationBranding(input: UpdateOrganizationBrandingInput) {
    return prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl ?? null } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.address !== undefined ? { address: input.address ?? null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
        ...(input.email !== undefined ? { email: input.email ?? null } : {}),
        ...(input.associationLocationName !== undefined ? { associationLocationName: input.associationLocationName ?? null } : {}),
        ...(input.associationAddress !== undefined ? { associationAddress: input.associationAddress ?? null } : {}),
        ...(input.associationLatitude !== undefined ? { associationLatitude: input.associationLatitude ?? null } : {}),
        ...(input.associationLongitude !== undefined ? { associationLongitude: input.associationLongitude ?? null } : {}),
        ...(input.associationGeoRadiusMeters !== undefined ? { associationGeoRadiusMeters: input.associationGeoRadiusMeters ?? null } : {})
      },
      select: organizationBrandingSelect
    });
  },

  async updateCircleApprovalStatus(circleId: number, status: 'PENDING' | 'APPROVED' | 'REJECTED', approvedById: number) {
    return prisma.circle.update({
      where: { id: circleId },
      data: {
        approvalStatus: status,
        approvedById,
        approvedAt: new Date()
      },
      select: circleSelect
    });
  }
};
