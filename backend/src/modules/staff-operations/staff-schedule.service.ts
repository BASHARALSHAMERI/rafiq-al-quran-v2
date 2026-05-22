import { ScheduleSourceType, StaffRoleType, Weekday, CircleScheduleMode, PrayerName } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { ScopeContext } from "../../shared/types/auth.types";

/**
 * Phase 3 — Staff Schedule Service
 *
 * Manages StaffScheduleAssignment and StaffScheduleSlot records.
 *
 * Two creation paths:
 * 1. CIRCLE_SYNC: Auto-generated from circle schedule (teacher only).
 *    Called after circle create/update.
 * 2. MANUAL: Created by CENTER_ADMIN/SUPER_ADMIN for any staff role.
 */

type SlotInput = {
  dayOfWeek: Weekday;
  mode: CircleScheduleMode;
  fromTime?: string | null;
  toTime?: string | null;
  fromPrayer?: PrayerName | null;
  toPrayer?: PrayerName | null;
  fromPrayerOffsetMinutes?: number | null;
  toPrayerOffsetMinutes?: number | null;
  defaultDurationMinutes?: number | null;
};

type ListFilters = {
  centerId?: number;
  staffRole?: StaffRoleType;
  isActive?: boolean;
  userId?: number;
};

type CreateManualInput = {
  userId: number;
  staffRole: StaffRoleType;
  centerId: number;
  circleId?: number | null;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  slots: SlotInput[];
};

type UpdateInput = {
  effectiveTo?: Date | null;
  slots?: SlotInput[];
};

type SyncCenterAdminInput = {
  organizationId: number;
  centerId: number;
  userId: number;
  slots: SlotInput[];
  effectiveFrom?: Date;
};

export const staffScheduleService = {
  // =========================================================
  // CRUD Operations
  // =========================================================

  async listAssignments(scope: ScopeContext, filters: ListFilters) {
    const where: Record<string, unknown> = {
      organizationId: scope.organizationId
    };

    if (filters.centerId) where.centerId = filters.centerId;
    if (filters.staffRole) where.staffRole = filters.staffRole;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.userId) where.userId = filters.userId;

    // Scope center access
    if (!scope.allAccess && scope.centerIds?.length) {
      where.centerId = { in: scope.centerIds };
    }

    return prisma.staffScheduleAssignment.findMany({
      where: where as any,
      include: {
        slots: true,
        user: { select: { id: true, fullName: true, role: true } },
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
    });
  },

  async getAssignment(scope: ScopeContext, assignmentId: number) {
    const assignment = await prisma.staffScheduleAssignment.findFirst({
      where: {
        id: assignmentId,
        organizationId: scope.organizationId
      },
      include: {
        slots: { orderBy: { dayOfWeek: "asc" } },
        user: { select: { id: true, fullName: true, role: true } },
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    if (!assignment) {
      throw new AppError("Schedule assignment not found", 404);
    }

    return assignment;
  },

  async createManualAssignment(scope: ScopeContext, input: CreateManualInput) {
    if (input.staffRole === StaffRoleType.TEACHER) {
      throw new AppError(
        "Teacher schedules are managed from circle schedules and cannot be created manually.",
        400
      );
    }

    return prisma.staffScheduleAssignment.create({
      data: {
        organizationId: scope.organizationId,
        userId: input.userId,
        staffRole: input.staffRole,
        centerId: input.centerId,
        circleId: input.circleId ?? null,
        sourceType: ScheduleSourceType.MANUAL,
        isActive: true,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo ?? null,
        slots: {
          create: input.slots.map((slot) => ({
            dayOfWeek: slot.dayOfWeek,
            mode: slot.mode,
            fromTime: slot.fromTime ?? null,
            toTime: slot.toTime ?? null,
            fromPrayer: slot.fromPrayer ?? null,
            toPrayer: slot.toPrayer ?? null,
            fromPrayerOffsetMinutes: slot.fromPrayerOffsetMinutes ?? 0,
            toPrayerOffsetMinutes: slot.toPrayerOffsetMinutes ?? 0,
            defaultDurationMinutes: slot.defaultDurationMinutes ?? null
          }))
        }
      },
      include: {
        slots: true,
        user: { select: { id: true, fullName: true, role: true } },
        center: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } }
      }
    });
  },

  async updateAssignment(scope: ScopeContext, assignmentId: number, input: UpdateInput) {
    const existing = await prisma.staffScheduleAssignment.findFirst({
      where: {
        id: assignmentId,
        organizationId: scope.organizationId
      }
    });

    if (!existing) {
      throw new AppError("Schedule assignment not found", 404);
    }

    // If this is a CIRCLE_SYNC assignment, don't allow slot edits (read-only)
    if (existing.sourceType === ScheduleSourceType.CIRCLE_SYNC && input.slots) {
      throw new AppError(
        "Cannot manually edit slots on a circle-synced assignment. Edit the circle schedule instead.",
        400
      );
    }

    return prisma.$transaction(async (tx) => {
      // Update assignment fields
      const updateData: Record<string, unknown> = {};
      if (input.effectiveTo !== undefined) updateData.effectiveTo = input.effectiveTo;

      if (Object.keys(updateData).length > 0) {
        await tx.staffScheduleAssignment.update({
          where: { id: assignmentId },
          data: updateData
        });
      }

      // Replace slots if provided
      if (input.slots) {
        await tx.staffScheduleSlot.deleteMany({
          where: { assignmentId }
        });

        for (const slot of input.slots) {
          await tx.staffScheduleSlot.create({
            data: {
              assignmentId,
              dayOfWeek: slot.dayOfWeek,
              mode: slot.mode,
              fromTime: slot.fromTime ?? null,
              toTime: slot.toTime ?? null,
              fromPrayer: slot.fromPrayer ?? null,
              toPrayer: slot.toPrayer ?? null,
              fromPrayerOffsetMinutes: slot.fromPrayerOffsetMinutes ?? 0,
              toPrayerOffsetMinutes: slot.toPrayerOffsetMinutes ?? 0,
              defaultDurationMinutes: slot.defaultDurationMinutes ?? null
            }
          });
        }
      }

      return tx.staffScheduleAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          slots: true,
          user: { select: { id: true, fullName: true, role: true } },
          center: { select: { id: true, name: true } },
          circle: { select: { id: true, name: true } }
        }
      });
    });
  },

  async deactivateAssignment(scope: ScopeContext, assignmentId: number) {
    const existing = await prisma.staffScheduleAssignment.findFirst({
      where: {
        id: assignmentId,
        organizationId: scope.organizationId
      }
    });

    if (!existing) {
      throw new AppError("Schedule assignment not found", 404);
    }

    if (existing.sourceType === ScheduleSourceType.CIRCLE_SYNC) {
      throw new AppError(
        "Circle-synced schedules cannot be deactivated manually. Update the circle instead.",
        400
      );
    }

    return prisma.staffScheduleAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        effectiveTo: new Date()
      }
    });
  },

  // =========================================================
  // Circle Sync Logic (Section 5.1 of spec)
  // =========================================================

  /**
   * Sync teacher's StaffScheduleAssignment from a circle's schedule.
   *
   * Called after circle create/update when:
   * - A circle is created (new assignment)
   * - A circle's weekly schedule changes (update slots)
   * - No change if assignment is MANUAL (skip with log)
   */
  async syncTeacherScheduleFromCircle(circleId: number) {
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        weeklyScheduleSlots: true,
        center: { select: { id: true, organizationId: true } }
      }
    });

    if (!circle || !circle.center) {
      console.warn(`[schedule-sync] Circle ${circleId} not found, skipping sync`);
      return;
    }

    const teacherId = circle.teacherId;
    const organizationId = circle.center.organizationId;
    const centerId = circle.center.id;

    if (!circle.isActive || circle.weeklyScheduleSlots.length === 0) {
      await prisma.staffScheduleAssignment.updateMany({
        where: {
          organizationId,
          circleId,
          staffRole: StaffRoleType.TEACHER,
          isActive: true
        },
        data: {
          isActive: false,
          effectiveTo: new Date()
        }
      });
      return;
    }

    const existingAssignments = await prisma.staffScheduleAssignment.findMany({
      where: {
        userId: teacherId,
        circleId,
        organizationId,
        staffRole: StaffRoleType.TEACHER
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
    });

    const [existing, ...duplicates] = existingAssignments;

    if (duplicates.length > 0) {
      await prisma.staffScheduleAssignment.updateMany({
        where: {
          id: {
            in: duplicates.map((assignment) => assignment.id)
          }
        },
        data: {
          isActive: false,
          effectiveTo: new Date()
        }
      });
    }

    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.staffScheduleSlot.deleteMany({
          where: { assignmentId: existing.id }
        });

        for (const circleSlot of circle.weeklyScheduleSlots) {
          await tx.staffScheduleSlot.create({
            data: {
              assignmentId: existing.id,
              dayOfWeek: circleSlot.dayOfWeek,
              mode: circleSlot.mode,
              fromTime: circleSlot.fromTime,
              toTime: circleSlot.toTime,
              fromPrayer: circleSlot.fromPrayer,
              toPrayer: circleSlot.toPrayer,
              fromPrayerOffsetMinutes: 0,
              toPrayerOffsetMinutes: 0,
              defaultDurationMinutes: null
            }
          });
        }

        // Reactivate if it was deactivated
        if (!existing.isActive) {
          await tx.staffScheduleAssignment.update({
            where: { id: existing.id },
            data: { isActive: true, effectiveTo: null }
          });
        }

        if (existing.sourceType !== ScheduleSourceType.CIRCLE_SYNC) {
          await tx.staffScheduleAssignment.update({
            where: { id: existing.id },
            data: {
              sourceType: ScheduleSourceType.CIRCLE_SYNC,
              centerId,
              staffRole: StaffRoleType.TEACHER
            }
          });
        }
      });

      return;
    }

    // Create new CIRCLE_SYNC assignment
    await prisma.staffScheduleAssignment.create({
      data: {
        organizationId,
        userId: teacherId,
        staffRole: StaffRoleType.TEACHER,
        centerId,
        circleId,
        sourceType: ScheduleSourceType.CIRCLE_SYNC,
        isActive: true,
        effectiveFrom: new Date(),
        slots: {
          create: circle.weeklyScheduleSlots.map((circleSlot) => ({
            dayOfWeek: circleSlot.dayOfWeek,
            mode: circleSlot.mode,
            fromTime: circleSlot.fromTime,
            toTime: circleSlot.toTime,
            fromPrayer: circleSlot.fromPrayer,
            toPrayer: circleSlot.toPrayer,
            fromPrayerOffsetMinutes: 0,
            toPrayerOffsetMinutes: 0,
            defaultDurationMinutes: null
          }))
        }
      }
    });
  },

  /**
   * Handle teacher reassignment on a circle.
   *
   * 1. Deactivate old teacher's CIRCLE_SYNC assignment for this circle
   * 2. Create new assignment for new teacher
   */
  async handleTeacherChanged(circleId: number, oldTeacherId: number, newTeacherId: number) {
    if (oldTeacherId === newTeacherId) return;

    await prisma.staffScheduleAssignment.updateMany({
      where: {
        userId: oldTeacherId,
        circleId,
        staffRole: StaffRoleType.TEACHER,
        isActive: true
      },
      data: {
        isActive: false,
        effectiveTo: new Date()
      }
    });

    await this.syncTeacherScheduleFromCircle(circleId);
  },

  async handleCenterAdminChanged(input: {
    organizationId: number;
    centerId: number;
    oldAdminUserId: number;
    newAdminUserId: number;
  }) {
    if (input.oldAdminUserId === input.newAdminUserId) {
      return;
    }

    const previousAssignments = await prisma.staffScheduleAssignment.findMany({
      where: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        userId: input.oldAdminUserId,
        staffRole: StaffRoleType.CENTER_ADMIN,
        isActive: true
      },
      include: {
        slots: true
      },
      orderBy: [{ createdAt: "desc" }]
    });

    const transferableSlots =
      previousAssignments[0]?.slots.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        mode: slot.mode,
        fromTime: slot.fromTime,
        toTime: slot.toTime,
        fromPrayer: slot.fromPrayer,
        toPrayer: slot.toPrayer,
        fromPrayerOffsetMinutes: slot.fromPrayerOffsetMinutes,
        toPrayerOffsetMinutes: slot.toPrayerOffsetMinutes,
        defaultDurationMinutes: slot.defaultDurationMinutes
      })) ?? [];

    if (previousAssignments.length) {
      await prisma.staffScheduleAssignment.updateMany({
        where: {
          id: { in: previousAssignments.map((assignment) => assignment.id) }
        },
        data: {
          isActive: false,
          effectiveTo: new Date()
        }
      });
    }

    if (transferableSlots.length) {
      await this.syncCenterAdminScheduleFromCenter({
        organizationId: input.organizationId,
        centerId: input.centerId,
        userId: input.newAdminUserId,
        slots: transferableSlots,
        effectiveFrom: new Date()
      });
    }
  },

  async syncCenterAdminScheduleFromCenter(input: SyncCenterAdminInput) {
    const existingAssignments = await prisma.staffScheduleAssignment.findMany({
      where: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        userId: input.userId,
        staffRole: StaffRoleType.CENTER_ADMIN
      },
      include: {
        slots: true
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
    });

    const [existing, ...duplicates] = existingAssignments;

    if (duplicates.length) {
      await prisma.staffScheduleAssignment.updateMany({
        where: {
          id: { in: duplicates.map((assignment) => assignment.id) }
        },
        data: {
          isActive: false,
          effectiveTo: new Date()
        }
      });
    }

    if (!input.slots.length) {
      if (existing?.isActive) {
        await prisma.staffScheduleAssignment.update({
          where: { id: existing.id },
          data: {
            isActive: false,
            effectiveTo: new Date()
          }
        });
      }
      return;
    }

    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.staffScheduleSlot.deleteMany({
          where: { assignmentId: existing.id }
        });

        for (const slot of input.slots) {
          await tx.staffScheduleSlot.create({
            data: {
              assignmentId: existing.id,
              dayOfWeek: slot.dayOfWeek,
              mode: slot.mode,
              fromTime: slot.fromTime ?? null,
              toTime: slot.toTime ?? null,
              fromPrayer: slot.fromPrayer ?? null,
              toPrayer: slot.toPrayer ?? null,
              fromPrayerOffsetMinutes: slot.fromPrayerOffsetMinutes ?? 0,
              toPrayerOffsetMinutes: slot.toPrayerOffsetMinutes ?? 0,
              defaultDurationMinutes: slot.defaultDurationMinutes ?? null
            }
          });
        }

        await tx.staffScheduleAssignment.update({
          where: { id: existing.id },
          data: {
            sourceType: ScheduleSourceType.MANUAL,
            isActive: true,
            effectiveTo: null,
            effectiveFrom: existing.isActive
              ? existing.effectiveFrom
              : input.effectiveFrom ?? new Date()
          }
        });
      });

      return;
    }

    await prisma.staffScheduleAssignment.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        staffRole: StaffRoleType.CENTER_ADMIN,
        centerId: input.centerId,
        circleId: null,
        sourceType: ScheduleSourceType.MANUAL,
        isActive: true,
        effectiveFrom: input.effectiveFrom ?? new Date(),
        slots: {
          create: input.slots.map((slot) => ({
            dayOfWeek: slot.dayOfWeek,
            mode: slot.mode,
            fromTime: slot.fromTime ?? null,
            toTime: slot.toTime ?? null,
            fromPrayer: slot.fromPrayer ?? null,
            toPrayer: slot.toPrayer ?? null,
            fromPrayerOffsetMinutes: slot.fromPrayerOffsetMinutes ?? 0,
            toPrayerOffsetMinutes: slot.toPrayerOffsetMinutes ?? 0,
            defaultDurationMinutes: slot.defaultDurationMinutes ?? null
          }))
        }
      }
    });
  },

  async syncCircleScheduleState(circleId: number, isActive: boolean) {
    if (isActive) {
      await this.syncTeacherScheduleFromCircle(circleId);
      return;
    }

    await prisma.staffScheduleAssignment.updateMany({
      where: {
        circleId,
        staffRole: StaffRoleType.TEACHER,
        isActive: true
      },
      data: {
        isActive: false,
        effectiveTo: new Date()
      }
    });
  }
};
