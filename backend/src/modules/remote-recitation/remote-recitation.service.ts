import {
  ActivityType,
  AuditAction,
  AuditEntityType,
  FollowUpType,
  Prisma,
  RemoteRecitationBookingStatus,
  Role,
  type NotificationType
} from "@prisma/client";
import { auditLogger } from "../../shared/audit/audit-log";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { editLockPolicy } from "../../shared/policies/edit-lock.policy";
import type { ScopeContext } from "../../shared/types/auth.types";
import { safeDate } from "../../shared/utils/time";
import { followUpDomain } from "../follow-ups/follow-ups.domain";
import { followUpsRepository } from "../follow-ups/follow-ups.repository";
import { notificationsRepository } from "../notifications/notifications.repository";
import { quranService } from "../quran/quran.service";
import {
  remoteRecitationRepository,
  type RemoteRecitationBookingItem,
  type RemoteRecitationSettingItem,
  type RemoteRecitationSlotItem
} from "./remote-recitation.repository";

export type RemoteRecitationSettingsInput = {
  circleId: number;
  isEnabled?: boolean;
  slotDurationMinutes?: number;
  bookingLeadHours?: number;
  cancellationWindowHours?: number;
  maxAdvanceDays?: number;
};

export type ListRemoteRecitationSlotsInput = {
  circleId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type CreateRemoteRecitationSlotInput = {
  circleId: number;
  startsAt: string;
  endsAt: string;
  joinUrl: string;
  note?: string | null;
};

export type UpdateRemoteRecitationSlotInput = {
  startsAt?: string;
  endsAt?: string;
  joinUrl?: string;
  note?: string | null;
  isActive?: boolean;
  lockVersion?: number;
};

export type ListRemoteRecitationBookingsInput = {
  circleId?: number;
  status?: RemoteRecitationBookingStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type CreateRemoteRecitationBookingInput = {
  slotId: number;
};

export type RemoteRecitationBookingDecisionInput = {
  note?: string | null;
  lockVersion?: number;
};

export type RemoteRecitationBookingCancelInput = {
  reason?: string | null;
  lockVersion?: number;
};

export type CompleteRemoteRecitationBookingInput = {
  type: FollowUpType;
  recordDate?: string;
  surah?: string | null;
  fromSurah?: number | null;
  fromAyah?: number | null;
  toSurah?: number | null;
  toAyah?: number | null;
  rating?: number | null;
  matnId?: number | null;
  matnName?: string | null;
  matnStatus?: string | null;
  notes?: string | null;
  lockVersion?: number;
};

type CircleContextItem = NonNullable<
  Awaited<ReturnType<typeof remoteRecitationRepository.findCircleContext>>
>;

type EffectiveRemoteRecitationSetting = {
  id: number | null;
  centerId: number;
  circleId: number;
  isEnabled: boolean;
  slotDurationMinutes: number;
  bookingLeadHours: number;
  cancellationWindowHours: number;
  maxAdvanceDays: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  center: {
    id: number;
    name: string;
    timezone: string;
  };
  circle: {
    id: number;
    name: string;
    teacherId: number;
    teacher: {
      id: number;
      fullName: string;
    } | null;
  };
};

type ResolvedQuranRange = {
  fromSurah: number | null;
  fromAyah: number | null;
  toSurah: number | null;
  toAyah: number | null;
  ayahCount: number | null;
  fromPage: number | null;
  toPage: number | null;
  pagesCount: Prisma.Decimal | null;
};

const DEFAULT_SETTINGS = {
  isEnabled: true,
  slotDurationMinutes: 30,
  bookingLeadHours: 2,
  cancellationWindowHours: 2,
  maxAdvanceDays: 21
} as const;

const MANAGER_ROLES: Role[] = [Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER];
const ACTIVE_BOOKING_STATUSES = [
  RemoteRecitationBookingStatus.REQUESTED,
  RemoteRecitationBookingStatus.APPROVED,
  RemoteRecitationBookingStatus.COMPLETED
] as const;

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const toDateOnly = (input: Date): Date => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeText = (value: string | null | undefined): string | null | undefined => {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeOptionalInt = (value: number | null | undefined): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!Number.isInteger(value)) {
    return undefined;
  }

  return value;
};

const parseLegacySurahNumber = (surah: string | null | undefined): number | null => {
  if (!surah) {
    return null;
  }

  const normalized = surah.trim();
  if (!/^\d{1,3}$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 114) {
    return null;
  }

  return parsed;
};

const calculateRangeIfComplete = async (input: {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
}): Promise<ResolvedQuranRange> => {
  const calculated = await quranService.calculateRange(input);

  return {
    fromSurah: input.fromSurah,
    fromAyah: input.fromAyah,
    toSurah: input.toSurah,
    toAyah: input.toAyah,
    ayahCount: calculated.ayahCount,
    fromPage: calculated.fromPage,
    toPage: calculated.toPage,
    pagesCount: new Prisma.Decimal(calculated.pagesCount)
  };
};

const resolveCreateQuranRange = async (input: {
  surah?: string | null;
  fromSurah?: number | null;
  fromAyah?: number | null;
  toSurah?: number | null;
  toAyah?: number | null;
}): Promise<ResolvedQuranRange> => {
  let fromSurah = normalizeOptionalInt(input.fromSurah) ?? null;
  let toSurah = normalizeOptionalInt(input.toSurah) ?? null;
  const fromAyah = normalizeOptionalInt(input.fromAyah) ?? null;
  const toAyah = normalizeOptionalInt(input.toAyah) ?? null;

  const legacySurah = parseLegacySurahNumber(input.surah);
  if (!fromSurah && !toSurah && legacySurah && fromAyah !== null && toAyah !== null) {
    fromSurah = legacySurah;
    toSurah = legacySurah;
  }

  const hasStructuredRange = fromSurah !== null || toSurah !== null;
  if (!hasStructuredRange) {
    return {
      fromSurah: null,
      fromAyah: null,
      toSurah: null,
      toAyah: null,
      ayahCount: null,
      fromPage: null,
      toPage: null,
      pagesCount: null
    };
  }

  const allProvided = [fromSurah, fromAyah, toSurah, toAyah].every((value) => typeof value === "number");
  if (!allProvided) {
    throw new AppError(
      "Quran range requires fromSurah/fromAyah/toSurah/toAyah together",
      422,
      undefined,
      "VALIDATION_FAILED"
    );
  }

  return calculateRangeIfComplete({
    fromSurah: fromSurah as number,
    fromAyah: fromAyah as number,
    toSurah: toSurah as number,
    toAyah: toAyah as number
  });
};

const resolvePagination = (page?: number, pageSize?: number) => ({
  page: page && page > 0 ? page : 1,
  pageSize: pageSize && pageSize > 0 ? Math.min(pageSize, 100) : 20
});

const resolveDateRange = (from?: string, to?: string) => {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 90);
  const defaultTo = new Date(now);
  defaultTo.setDate(defaultTo.getDate() + 90);
  const resolvedFrom = from ? safeDate(from, "from") : defaultFrom;
  const resolvedTo = to ? safeDate(to, "to") : defaultTo;

  if (resolvedFrom > resolvedTo) {
    throw new AppError("Date range is invalid: from must be before to", 400);
  }

  return {
    from: startOfDay(resolvedFrom),
    to: endOfDay(resolvedTo)
  };
};

const parseJoinUrl = (value: string) => {
  const normalized = value.trim();
  let url: URL;

  try {
    url = new URL(normalized);
  } catch {
    throw new AppError("joinUrl must be a valid URL", 400);
  }

  if (url.protocol !== "https:") {
    throw new AppError("joinUrl must use HTTPS", 400);
  }

  if (!url.hostname) {
    throw new AppError("joinUrl must include a hostname", 400);
  }

  return {
    joinUrl: url.toString(),
    providerHost: url.hostname.replace(/^www\./i, "")
  };
};

const resolveEffectiveSetting = (
  seed: Partial<RemoteRecitationSettingItem> | null | undefined,
  circleContext: CircleContextItem
): EffectiveRemoteRecitationSetting => ({
  id: seed?.id ?? null,
  centerId: seed?.centerId ?? circleContext.centerId,
  circleId: seed?.circleId ?? circleContext.id,
  isEnabled: seed?.isEnabled ?? DEFAULT_SETTINGS.isEnabled,
  slotDurationMinutes: seed?.slotDurationMinutes ?? DEFAULT_SETTINGS.slotDurationMinutes,
  bookingLeadHours: seed?.bookingLeadHours ?? DEFAULT_SETTINGS.bookingLeadHours,
  cancellationWindowHours:
    seed?.cancellationWindowHours ?? DEFAULT_SETTINGS.cancellationWindowHours,
  maxAdvanceDays: seed?.maxAdvanceDays ?? DEFAULT_SETTINGS.maxAdvanceDays,
  createdAt: seed?.createdAt ?? null,
  updatedAt: seed?.updatedAt ?? null,
  center: {
    id: circleContext.center.id,
    name: circleContext.center.name,
    timezone: circleContext.center.timezone
  },
  circle: {
    id: circleContext.id,
    name: circleContext.name,
    teacherId: circleContext.teacherId,
    teacher: circleContext.teacher
      ? {
          id: circleContext.teacher.id,
          fullName: circleContext.teacher.fullName
        }
      : null
  }
});

const getCircleContextOrThrow = async (scope: ScopeContext, circleId: number) => {
  const circleContext = await remoteRecitationRepository.findCircleContext({
    circleId
  });

  if (!circleContext) {
    throw new AppError("Circle not found", 404);
  }

  return circleContext;
};

const ensureScopeCanAccessCircle = (scope: ScopeContext, circleId: number, centerId: number) => {
  if (scope.allAccess) {
    return;
  }

  if (scope.circleIds.includes(circleId) || scope.centerIds.includes(centerId)) {
    return;
  }

  throw new AppError("Access denied for requested circle", 403);
};

const ensureManageCircle = (scope: ScopeContext, circleContext: CircleContextItem) => {
  ensureScopeCanAccessCircle(scope, circleContext.id, circleContext.centerId);

  if (scope.role === Role.TEACHER && circleContext.teacherId !== scope.userId) {
    throw new AppError("Teachers can only manage their own remote recitation circles", 403);
  }
};

const ensureManageBooking = (scope: ScopeContext, booking: RemoteRecitationBookingItem) => {
  ensureScopeCanAccessCircle(scope, booking.circleId, booking.centerId);

  if (scope.role === Role.TEACHER && booking.teacherId !== scope.userId) {
    throw new AppError("Teachers can only manage their own remote recitation bookings", 403);
  }
};

const ensureOperationalCircle = (circleContext: CircleContextItem) => {
  if (!circleContext.isActive || !circleContext.center.isActive) {
    throw new AppError("Circle is not active for remote recitation", 409);
  }

  if (!circleContext.teacher?.isActive) {
    throw new AppError("Circle teacher is not active", 409);
  }
};

const assertFeatureEnabled = (setting: EffectiveRemoteRecitationSetting) => {
  if (!setting.isEnabled) {
    throw new AppError("Remote recitation is disabled for this circle", 409);
  }
};

const assertSlotWindow = (
  startsAt: Date,
  endsAt: Date,
  setting: EffectiveRemoteRecitationSetting
) => {
  if (startsAt >= endsAt) {
    throw new AppError("Slot end time must be after start time", 400);
  }

  if (startsAt.getTime() <= Date.now()) {
    throw new AppError("Slot must be scheduled in the future", 400);
  }

  const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  if (durationMinutes !== setting.slotDurationMinutes) {
    throw new AppError(
      `Slot duration must be exactly ${setting.slotDurationMinutes} minutes`,
      400
    );
  }

  const advanceLimit = new Date();
  advanceLimit.setDate(advanceLimit.getDate() + setting.maxAdvanceDays);
  if (startsAt.getTime() > advanceLimit.getTime()) {
    throw new AppError(
      `Slot must be within ${setting.maxAdvanceDays} days from now`,
      400
    );
  }
};

const isSlotTimingTouched = (input: UpdateRemoteRecitationSlotInput) =>
  input.startsAt !== undefined || input.endsAt !== undefined;

const serializeSetting = (setting: EffectiveRemoteRecitationSetting) => ({
  id: setting.id,
  centerId: setting.centerId,
  circleId: setting.circleId,
  isEnabled: setting.isEnabled,
  slotDurationMinutes: setting.slotDurationMinutes,
  bookingLeadHours: setting.bookingLeadHours,
  cancellationWindowHours: setting.cancellationWindowHours,
  maxAdvanceDays: setting.maxAdvanceDays,
  createdAt: setting.createdAt ? setting.createdAt.toISOString() : null,
  updatedAt: setting.updatedAt ? setting.updatedAt.toISOString() : null,
  center: setting.center,
  circle: setting.circle
});

const canViewBookingJoinUrl = (scope: ScopeContext, booking: RemoteRecitationBookingItem) => {
  if (
    scope.role === Role.TEACHER ||
    scope.role === Role.SUPER_ADMIN ||
    scope.role === Role.CENTER_ADMIN ||
    scope.role === Role.SUPERVISOR
  ) {
    return true;
  }

  return (
    scope.role === Role.STUDENT &&
    booking.studentId === scope.userId &&
    (booking.status === RemoteRecitationBookingStatus.APPROVED ||
      booking.status === RemoteRecitationBookingStatus.COMPLETED)
  );
};

const serializeSlot = (
  scope: ScopeContext,
  slot: RemoteRecitationSlotItem,
  includeJoinUrl = scope.role !== Role.STUDENT
) => ({
  id: slot.id,
  centerId: slot.centerId,
  circleId: slot.circleId,
  teacherId: slot.teacherId,
  startsAt: slot.startsAt.toISOString(),
  endsAt: slot.endsAt.toISOString(),
  joinUrl: includeJoinUrl ? slot.joinUrl : null,
  providerHost: slot.providerHost,
  note: slot.note,
  isActive: slot.isActive,
  lockVersion: slot.lockVersion,
  createdAt: slot.createdAt.toISOString(),
  updatedAt: slot.updatedAt.toISOString(),
  teacher: slot.teacher,
  circle: {
    id: slot.circle.id,
    name: slot.circle.name,
    isActive: slot.circle.isActive,
    teacherId: slot.circle.teacherId,
    center: {
      id: slot.circle.center.id,
      name: slot.circle.center.name,
      timezone: slot.circle.center.timezone,
      isActive: slot.circle.center.isActive
    }
  }
});

const serializeBooking = (scope: ScopeContext, booking: RemoteRecitationBookingItem) => ({
  id: booking.id,
  centerId: booking.centerId,
  circleId: booking.circleId,
  slotId: booking.slotId,
  studentId: booking.studentId,
  teacherId: booking.teacherId,
  status: booking.status,
  requestedAt: booking.requestedAt.toISOString(),
  reviewedAt: booking.reviewedAt ? booking.reviewedAt.toISOString() : null,
  reviewNote: booking.reviewNote,
  cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
  cancellationReason: booking.cancellationReason,
  completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
  followUpRecordId: booking.followUpRecordId,
  createdAt: booking.createdAt.toISOString(),
  updatedAt: booking.updatedAt.toISOString(),
  lockVersion: booking.lockVersion,
  student: booking.student,
  teacher: booking.teacher,
  circle: {
    id: booking.circle.id,
    name: booking.circle.name,
    isActive: booking.circle.isActive,
    teacherId: booking.circle.teacherId,
    center: {
      id: booking.circle.center.id,
      name: booking.circle.center.name,
      timezone: booking.circle.center.timezone,
      isActive: booking.circle.center.isActive
    }
  },
  slot: {
    id: booking.slot.id,
    startsAt: booking.slot.startsAt.toISOString(),
    endsAt: booking.slot.endsAt.toISOString(),
    joinUrl: canViewBookingJoinUrl(scope, booking) ? booking.slot.joinUrl : null,
    providerHost: booking.slot.providerHost,
    note: booking.slot.note,
    isActive: booking.slot.isActive,
    lockVersion: booking.slot.lockVersion
  },
  followUpRecord: booking.followUpRecord
    ? {
        ...booking.followUpRecord,
        recordDate: booking.followUpRecord.recordDate.toISOString().slice(0, 10)
      }
    : null
});

const buildSlotScopeWhere = (scope: ScopeContext): Prisma.RemoteRecitationSlotWhereInput => {
  if (scope.allAccess) {
    return {};
  }

  const conditions: Prisma.RemoteRecitationSlotWhereInput[] = [];
  if (scope.circleIds.length) {
    conditions.push({ circleId: { in: scope.circleIds } });
  }
  if (scope.centerIds.length) {
    conditions.push({ centerId: { in: scope.centerIds } });
  }

  if (!conditions.length) {
    return { id: { equals: -1 } };
  }

  return conditions.length === 1 ? conditions[0] : { OR: conditions };
};

const buildBookingScopeWhere = (scope: ScopeContext): Prisma.RemoteRecitationBookingWhereInput => {
  if (scope.allAccess) {
    return {};
  }

  const conditions: Prisma.RemoteRecitationBookingWhereInput[] = [];
  if (scope.circleIds.length) {
    conditions.push({ circleId: { in: scope.circleIds } });
  }
  if (scope.centerIds.length) {
    conditions.push({ centerId: { in: scope.centerIds } });
  }

  if (!conditions.length) {
    return { id: { equals: -1 } };
  }

  return conditions.length === 1 ? conditions[0] : { OR: conditions };
};

const notifySafely = async (input: {
  organizationId: number;
  centerId: number;
  circleId: number;
  recipientUserIds: number[];
  type: NotificationType;
  title: string;
  body: string;
  payload: Prisma.InputJsonValue;
  createdById: number;
}) => {
  if (!input.recipientUserIds.length) {
    return;
  }
  try {
    await notificationsRepository.createMany({
      data: input.recipientUserIds.map((recipientUserId) => ({
        organizationId: input.organizationId,
        centerId: input.centerId,
        circleId: input.circleId,
        type: input.type,
        title: input.title,
        body: input.body,
        payload: input.payload,
        recipientUserId,
        createdById: input.createdById
      }))
    });
  } catch (error) {
    console.error("remoteRecitation.notifications.failed", error);
  }
};

export const remoteRecitationService = {
  async getSettings(scope: ScopeContext, input: { circleId: number }) {
    if (!MANAGER_ROLES.includes(scope.role)) {
      throw new AppError("Remote recitation settings are restricted for your role", 403);
    }

    const circleContext = await getCircleContextOrThrow(scope, input.circleId);
    ensureManageCircle(scope, circleContext);

    const setting = await remoteRecitationRepository.findSettingByCircleId({
      circleId: input.circleId
    });

    return serializeSetting(resolveEffectiveSetting(setting, circleContext));
  },

  async upsertSettings(scope: ScopeContext, input: RemoteRecitationSettingsInput) {
    if (!MANAGER_ROLES.includes(scope.role)) {
      throw new AppError("Remote recitation settings are restricted for your role", 403);
    }

    const circleContext = await getCircleContextOrThrow(scope, input.circleId);
    ensureManageCircle(scope, circleContext);
    ensureOperationalCircle(circleContext);

    const existing = await remoteRecitationRepository.findSettingByCircleId({
      circleId: input.circleId
    });
    const effective = resolveEffectiveSetting(existing, circleContext);

    const setting = await remoteRecitationRepository.upsertSetting({
      centerId: circleContext.centerId,
      circleId: circleContext.id,
      isEnabled: input.isEnabled ?? effective.isEnabled,
      slotDurationMinutes: input.slotDurationMinutes ?? effective.slotDurationMinutes,
      bookingLeadHours: input.bookingLeadHours ?? effective.bookingLeadHours,
      cancellationWindowHours:
        input.cancellationWindowHours ?? effective.cancellationWindowHours,
      maxAdvanceDays: input.maxAdvanceDays ?? effective.maxAdvanceDays
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: setting.centerId,
      circleId: setting.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REMOTE_RECITATION_SLOT,
      entityId: setting.id,
      summary: "Updated remote recitation settings",
      metadata: {
        circleId: setting.circleId,
        isEnabled: setting.isEnabled,
        slotDurationMinutes: setting.slotDurationMinutes,
        bookingLeadHours: setting.bookingLeadHours,
        cancellationWindowHours: setting.cancellationWindowHours,
        maxAdvanceDays: setting.maxAdvanceDays
      }
    });

    return serializeSetting(resolveEffectiveSetting(setting, circleContext));
  },

  async listSlots(scope: ScopeContext, query: ListRemoteRecitationSlotsInput) {
    const pagination = resolvePagination(query.page, query.pageSize);
    const range = resolveDateRange(query.from, query.to);

    if (query.circleId) {
      const circleContext = await getCircleContextOrThrow(scope, query.circleId);
      ensureScopeCanAccessCircle(scope, circleContext.id, circleContext.centerId);
    }

    const studentAvailabilityWhere: Prisma.RemoteRecitationSlotWhereInput =
      scope.role === Role.STUDENT
        ? {
            isActive: true,
            startsAt: {
              gte: new Date(),
              lte: range.to
            },
            bookings: {
              none: {
                status: {
                  in: [...ACTIVE_BOOKING_STATUSES]
                }
              }
            },
            OR: [
              {
                circle: {
                  remoteRecitationSetting: {
                    is: null
                  }
                }
              },
              {
                circle: {
                  remoteRecitationSetting: {
                    is: {
                      isEnabled: true
                    }
                  }
                }
              }
            ]
          }
        : {};

    const where: Prisma.RemoteRecitationSlotWhereInput = {
      startsAt: {
        gte: range.from,
        lte: range.to
      },
      circle: {
        isActive: true,
        center: {
          isActive: true
        }
      },
      ...(query.circleId ? { circleId: query.circleId } : {}),
      ...(scope.role === Role.TEACHER ? { teacherId: scope.userId } : {}),
      AND: [buildSlotScopeWhere(scope), studentAvailabilityWhere]
    };

    const result = await remoteRecitationRepository.listSlots(where, pagination.page, pagination.pageSize);

    return {
      data: result.data.map((slot) => serializeSlot(scope, slot)),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.total
    };
  },

  async createSlot(scope: ScopeContext, input: CreateRemoteRecitationSlotInput) {
    if (!MANAGER_ROLES.includes(scope.role)) {
      throw new AppError("Only managers can create remote recitation slots", 403);
    }

    const circleContext = await getCircleContextOrThrow(scope, input.circleId);
    ensureManageCircle(scope, circleContext);
    ensureOperationalCircle(circleContext);

    const effective = resolveEffectiveSetting(circleContext.remoteRecitationSetting, circleContext);
    assertFeatureEnabled(effective);

    const startsAt = safeDate(input.startsAt, "startsAt");
    const endsAt = safeDate(input.endsAt, "endsAt");
    assertSlotWindow(startsAt, endsAt, effective);

    const overlap = await remoteRecitationRepository.findOverlappingSlot({
      teacherId: circleContext.teacherId,
      startsAt,
      endsAt
    });

    if (overlap) {
      throw new AppError("Teacher already has another slot during this time", 409);
    }

    const join = parseJoinUrl(input.joinUrl);

    const slot = await prisma.$transaction(async (tx) => {
      const created = await remoteRecitationRepository.createSlot(
        {
          centerId: circleContext.centerId,
          circleId: circleContext.id,
          teacherId: circleContext.teacherId,
          startsAt,
          endsAt,
          joinUrl: join.joinUrl,
          providerHost: join.providerHost,
          note: normalizeText(input.note) ?? null
        },
        tx
      );

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          centerId: created.centerId,
          circleId: created.circleId,
          activityType: ActivityType.GENERIC,
          entityType: "remote_recitation_slot",
          entityId: created.id,
          message: "Created remote recitation slot",
          metadata: {
            startsAt: created.startsAt.toISOString(),
            endsAt: created.endsAt.toISOString(),
            providerHost: created.providerHost
          }
        }
      });

      return created;
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: slot.centerId,
      circleId: slot.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.REMOTE_RECITATION_SLOT,
      entityId: slot.id,
      summary: "Created remote recitation slot",
      metadata: {
        slotId: slot.id,
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        providerHost: slot.providerHost
      }
    });

    return serializeSlot(scope, slot);
  },

  async updateSlot(scope: ScopeContext, slotId: number, input: UpdateRemoteRecitationSlotInput) {
    if (!MANAGER_ROLES.includes(scope.role)) {
      throw new AppError("Only managers can update remote recitation slots", 403);
    }

    const existing = await remoteRecitationRepository.findSlotById(slotId);
    if (!existing) {
      throw new AppError("Slot not found", 404);
    }

    ensureScopeCanAccessCircle(scope, existing.circleId, existing.centerId);
    if (scope.role === Role.TEACHER && existing.teacherId !== scope.userId) {
      throw new AppError("Teachers can only update their own remote recitation slots", 403);
    }

    const circleContext = await getCircleContextOrThrow(scope, existing.circleId);
    ensureOperationalCircle(circleContext);
    const effective = resolveEffectiveSetting(circleContext.remoteRecitationSetting, circleContext);

    editLockPolicy.assertVersionMatch({
      resource: "Remote recitation slot",
      currentVersion: existing.lockVersion,
      expectedVersion: input.lockVersion
    });

    const nextStartsAt = input.startsAt ? safeDate(input.startsAt, "startsAt") : existing.startsAt;
    const nextEndsAt = input.endsAt ? safeDate(input.endsAt, "endsAt") : existing.endsAt;

    if (isSlotTimingTouched(input)) {
      assertSlotWindow(nextStartsAt, nextEndsAt, effective);
    }

    const blockingBooking = await remoteRecitationRepository.findBlockingBookingForSlot({
      slotId: existing.id
    });

    if (blockingBooking && (isSlotTimingTouched(input) || input.isActive === false)) {
      throw new AppError(
        "Slot timing cannot be changed or disabled while it has active bookings",
        409
      );
    }

    if (isSlotTimingTouched(input)) {
      const overlap = await remoteRecitationRepository.findOverlappingSlot({
        teacherId: existing.teacherId,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        excludeSlotId: existing.id
      });

      if (overlap) {
        throw new AppError("Teacher already has another slot during this time", 409);
      }
    }

    const join = input.joinUrl ? parseJoinUrl(input.joinUrl) : null;

    const updated = await prisma.$transaction(async (tx) => {
      const item = await remoteRecitationRepository.updateSlot(
        existing.id,
        {
          ...(input.startsAt ? { startsAt: nextStartsAt } : {}),
          ...(input.endsAt ? { endsAt: nextEndsAt } : {}),
          ...(join ? { joinUrl: join.joinUrl, providerHost: join.providerHost } : {}),
          ...(input.note !== undefined ? { note: normalizeText(input.note) ?? null } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
        },
        existing.lockVersion,
        tx
      );

      if (!item) {
        throw new AppError("Slot version conflict", 409, { id: slotId }, "VERSION_CONFLICT");
      }

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          centerId: item.centerId,
          circleId: item.circleId,
          activityType: ActivityType.GENERIC,
          entityType: "remote_recitation_slot",
          entityId: item.id,
          message: "Updated remote recitation slot",
          metadata: {
            startsAt: item.startsAt.toISOString(),
            endsAt: item.endsAt.toISOString(),
            providerHost: item.providerHost,
            isActive: item.isActive
          }
        }
      });

      return item;
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: updated.centerId,
      circleId: updated.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REMOTE_RECITATION_SLOT,
      entityId: updated.id,
      summary: "Updated remote recitation slot",
      metadata: {
        slotId: updated.id,
        startsAt: updated.startsAt.toISOString(),
        endsAt: updated.endsAt.toISOString(),
        providerHost: updated.providerHost,
        isActive: updated.isActive
      }
    });

    return serializeSlot(scope, updated);
  },

  async deleteSlot(scope: ScopeContext, slotId: number, lockVersion?: number) {
    if (!MANAGER_ROLES.includes(scope.role)) {
      throw new AppError("Only managers can remove remote recitation slots", 403);
    }

    const existing = await remoteRecitationRepository.findSlotById(slotId);
    if (!existing) {
      throw new AppError("Slot not found", 404);
    }

    ensureScopeCanAccessCircle(scope, existing.circleId, existing.centerId);
    if (scope.role === Role.TEACHER && existing.teacherId !== scope.userId) {
      throw new AppError("Teachers can only remove their own remote recitation slots", 403);
    }

    editLockPolicy.assertVersionMatch({
      resource: "Remote recitation slot",
      currentVersion: existing.lockVersion,
      expectedVersion: lockVersion
    });

    const blockingBooking = await remoteRecitationRepository.findBlockingBookingForSlot({
      slotId: existing.id
    });

    if (blockingBooking) {
      throw new AppError("Slot cannot be removed while it has active bookings", 409);
    }

    const removed = await prisma.$transaction(async (tx) => {
      const item = await remoteRecitationRepository.updateSlot(
        existing.id,
        { isActive: false },
        existing.lockVersion,
        tx
      );

      if (!item) {
        throw new AppError("Slot version conflict", 409, { id: slotId }, "VERSION_CONFLICT");
      }

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          centerId: item.centerId,
          circleId: item.circleId,
          activityType: ActivityType.GENERIC,
          entityType: "remote_recitation_slot",
          entityId: item.id,
          message: "Archived remote recitation slot",
          metadata: {
            startsAt: item.startsAt.toISOString(),
            endsAt: item.endsAt.toISOString()
          }
        }
      });

      return item;
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: removed.centerId,
      circleId: removed.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.REMOTE_RECITATION_SLOT,
      entityId: removed.id,
      summary: "Archived remote recitation slot",
      metadata: {
        slotId: removed.id,
        startsAt: removed.startsAt.toISOString(),
        endsAt: removed.endsAt.toISOString(),
        isActive: removed.isActive
      }
    });

    return serializeSlot(scope, removed);
  },

  async listBookings(scope: ScopeContext, query: ListRemoteRecitationBookingsInput) {
    const pagination = resolvePagination(query.page, query.pageSize);
    const range = resolveDateRange(query.from, query.to);

    if (query.circleId) {
      const circleContext = await getCircleContextOrThrow(scope, query.circleId);
      ensureScopeCanAccessCircle(scope, circleContext.id, circleContext.centerId);
    }

    const where: Prisma.RemoteRecitationBookingWhereInput = {
      ...(query.circleId ? { circleId: query.circleId } : {}),
      ...(query.status ? { status: query.status } : {}),
      slot: {
        startsAt: {
          gte: range.from,
          lte: range.to
        }
      },
      circle: {
        isActive: true,
        center: {
          isActive: true
        }
      },
      ...(scope.role === Role.TEACHER ? { teacherId: scope.userId } : {}),
      ...(scope.role === Role.STUDENT ? { studentId: scope.userId } : {}),
      AND: [buildBookingScopeWhere(scope)]
    };

    const orderBy: Prisma.RemoteRecitationBookingOrderByWithRelationInput[] =
      query.status === RemoteRecitationBookingStatus.APPROVED
        ? [{ slot: { startsAt: "asc" } }, { id: "asc" }]
        : query.status === RemoteRecitationBookingStatus.COMPLETED
          ? [{ completedAt: "desc" }, { id: "desc" }]
          : [{ requestedAt: "desc" }, { id: "desc" }];

    const result = await remoteRecitationRepository.listBookings(
      where,
      pagination.page,
      pagination.pageSize,
      orderBy
    );

    const data =
      query.status === RemoteRecitationBookingStatus.APPROVED
        ? [...result.data].sort(
            (left, right) => left.slot.startsAt.getTime() - right.slot.startsAt.getTime()
          )
        : query.status === RemoteRecitationBookingStatus.COMPLETED
          ? [...result.data].sort((left, right) => {
              const leftValue = left.completedAt?.getTime() ?? left.slot.startsAt.getTime();
              const rightValue = right.completedAt?.getTime() ?? right.slot.startsAt.getTime();
              return rightValue - leftValue;
            })
          : result.data;

    return {
      data: data.map((item) => serializeBooking(scope, item)),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.total
    };
  },

  async createBooking(scope: ScopeContext, input: CreateRemoteRecitationBookingInput) {
    if (scope.role !== Role.STUDENT) {
      throw new AppError("Only students can book remote recitation slots", 403);
    }

    const slot = await remoteRecitationRepository.findSlotById(input.slotId);
    if (!slot) {
      throw new AppError("Slot not found", 404);
    }

    ensureScopeCanAccessCircle(scope, slot.circleId, slot.centerId);

    if (!slot.isActive || !slot.circle.isActive || !slot.circle.center.isActive) {
      throw new AppError("Slot is not available", 409);
    }

    const circleContext = await getCircleContextOrThrow(scope, slot.circleId);
    const setting = resolveEffectiveSetting(circleContext.remoteRecitationSetting, circleContext);
    assertFeatureEnabled(setting);

    const minimumStart = new Date(Date.now() + setting.bookingLeadHours * 60 * 60 * 1000);
    if (slot.startsAt.getTime() < minimumStart.getTime()) {
      throw new AppError(
        `Booking must be made at least ${setting.bookingLeadHours} hours in advance`,
        409
      );
    }

    const enrollment = await remoteRecitationRepository.findActiveEnrollment({
      studentId: scope.userId,
      circleId: slot.circleId
    });

    if (!enrollment) {
      throw new AppError("Student is not actively enrolled in this circle", 400);
    }

    const blocking = await remoteRecitationRepository.findBlockingBookingForSlot({
      slotId: slot.id
    });

    if (blocking) {
      throw new AppError("This slot has already been booked", 409);
    }

    let booking: RemoteRecitationBookingItem;
    try {
      booking = await prisma.$transaction(async (tx) => {
        const created = await remoteRecitationRepository.createBooking(
          {
            centerId: slot.centerId,
            circleId: slot.circleId,
            slotId: slot.id,
            studentId: scope.userId,
            teacherId: slot.teacherId
          },
          tx
        );

        await tx.activityLog.create({
          data: {
            organizationId: scope.organizationId,
            userId: scope.userId,
            centerId: created.centerId,
            circleId: created.circleId,
            activityType: ActivityType.GENERIC,
            entityType: "remote_recitation_booking",
            entityId: created.id,
            message: "Requested remote recitation booking",
            metadata: {
              slotId: created.slotId,
              startsAt: created.slot.startsAt.toISOString()
            }
          }
        });

        return created;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError("This slot has already been booked", 409);
      }

      throw error;
    }

    await notifySafely({
      organizationId: scope.organizationId,
      centerId: booking.centerId,
      circleId: booking.circleId,
      recipientUserIds: [booking.teacherId],
      type: "REMOTE_RECITATION_REQUESTED",
      title: "Remote recitation request",
      body: `${booking.student.fullName} requested a remote recitation session.`,
      payload: {
        workflow: "REMOTE_RECITATION_REQUESTED",
        bookingId: booking.id,
        slotId: booking.slotId,
        startsAt: booking.slot.startsAt.toISOString(),
        status: booking.status
      },
      createdById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: booking.centerId,
      circleId: booking.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.REMOTE_RECITATION_BOOKING,
      entityId: booking.id,
      summary: "Requested remote recitation booking",
      metadata: {
        bookingId: booking.id,
        slotId: booking.slotId,
        startsAt: booking.slot.startsAt.toISOString(),
        status: booking.status
      }
    });

    return serializeBooking(scope, booking);
  },

  async approveBooking(
    scope: ScopeContext,
    bookingId: number,
    input: RemoteRecitationBookingDecisionInput
  ) {
    if (!MANAGER_ROLES.includes(scope.role)) {
      throw new AppError("Only managers can approve bookings", 403);
    }

    const booking = await remoteRecitationRepository.findBookingById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    ensureManageBooking(scope, booking);
    editLockPolicy.assertVersionMatch({
      resource: "Remote recitation booking",
      currentVersion: booking.lockVersion,
      expectedVersion: input.lockVersion
    });

    if (booking.status !== RemoteRecitationBookingStatus.REQUESTED) {
      throw new AppError("Only requested bookings can be approved", 409);
    }

    if (booking.slot.startsAt.getTime() <= Date.now()) {
      throw new AppError("Past bookings cannot be approved", 409);
    }

    const blocking = await remoteRecitationRepository.findBlockingBookingForSlot({
      slotId: booking.slotId,
      excludeBookingId: booking.id
    });

    if (blocking) {
      throw new AppError("Another active booking already exists for this slot", 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const item = await remoteRecitationRepository.updateBooking(
        booking.id,
        {
          status: RemoteRecitationBookingStatus.APPROVED,
          reviewedAt: new Date(),
          reviewNote: normalizeText(input.note) ?? null
        },
        booking.lockVersion,
        tx
      );

      if (!item) {
        throw new AppError("Booking version conflict", 409, { id: bookingId }, "VERSION_CONFLICT");
      }

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          centerId: item.centerId,
          circleId: item.circleId,
          activityType: ActivityType.GENERIC,
          entityType: "remote_recitation_booking",
          entityId: item.id,
          message: "Approved remote recitation booking",
          metadata: {
            slotId: item.slotId,
            startsAt: item.slot.startsAt.toISOString()
          }
        }
      });

      return item;
    });

    await notifySafely({
      organizationId: scope.organizationId,
      centerId: updated.centerId,
      circleId: updated.circleId,
      recipientUserIds: [updated.studentId],
      type: "REMOTE_RECITATION_APPROVED",
      title: "Remote recitation approved",
      body: "Your remote recitation request was approved.",
      payload: {
        workflow: "REMOTE_RECITATION_APPROVED",
        bookingId: updated.id,
        slotId: updated.slotId,
        startsAt: updated.slot.startsAt.toISOString(),
        status: updated.status
      },
      createdById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: updated.centerId,
      circleId: updated.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REMOTE_RECITATION_BOOKING,
      entityId: updated.id,
      summary: "Approved remote recitation booking",
      metadata: {
        bookingId: updated.id,
        slotId: updated.slotId,
        startsAt: updated.slot.startsAt.toISOString(),
        status: updated.status
      }
    });

    return serializeBooking(scope, updated);
  },

  async rejectBooking(
    scope: ScopeContext,
    bookingId: number,
    input: RemoteRecitationBookingDecisionInput
  ) {
    if (!MANAGER_ROLES.includes(scope.role)) {
      throw new AppError("Only managers can reject bookings", 403);
    }

    const booking = await remoteRecitationRepository.findBookingById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    ensureManageBooking(scope, booking);
    editLockPolicy.assertVersionMatch({
      resource: "Remote recitation booking",
      currentVersion: booking.lockVersion,
      expectedVersion: input.lockVersion
    });

    if (booking.status !== RemoteRecitationBookingStatus.REQUESTED) {
      throw new AppError("Only requested bookings can be rejected", 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const item = await remoteRecitationRepository.updateBooking(
        booking.id,
        {
          status: RemoteRecitationBookingStatus.REJECTED,
          reviewedAt: new Date(),
          reviewNote: normalizeText(input.note) ?? null
        },
        booking.lockVersion,
        tx
      );

      if (!item) {
        throw new AppError("Booking version conflict", 409, { id: bookingId }, "VERSION_CONFLICT");
      }

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          centerId: item.centerId,
          circleId: item.circleId,
          activityType: ActivityType.GENERIC,
          entityType: "remote_recitation_booking",
          entityId: item.id,
          message: "Rejected remote recitation booking",
          metadata: {
            slotId: item.slotId,
            startsAt: item.slot.startsAt.toISOString()
          }
        }
      });

      return item;
    });

    await notifySafely({
      organizationId: scope.organizationId,
      centerId: updated.centerId,
      circleId: updated.circleId,
      recipientUserIds: [updated.studentId],
      type: "REMOTE_RECITATION_REJECTED",
      title: "Remote recitation rejected",
      body: "Your remote recitation request was rejected.",
      payload: {
        workflow: "REMOTE_RECITATION_REJECTED",
        bookingId: updated.id,
        slotId: updated.slotId,
        startsAt: updated.slot.startsAt.toISOString(),
        status: updated.status
      },
      createdById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: updated.centerId,
      circleId: updated.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REMOTE_RECITATION_BOOKING,
      entityId: updated.id,
      summary: "Rejected remote recitation booking",
      metadata: {
        bookingId: updated.id,
        slotId: updated.slotId,
        startsAt: updated.slot.startsAt.toISOString(),
        status: updated.status
      }
    });

    return serializeBooking(scope, updated);
  },

  async cancelBooking(
    scope: ScopeContext,
    bookingId: number,
    input: RemoteRecitationBookingCancelInput
  ) {
    const booking = await remoteRecitationRepository.findBookingById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (scope.role === Role.STUDENT) {
      if (booking.studentId !== scope.userId) {
        throw new AppError("Students can only cancel their own bookings", 403);
      }
    } else if (MANAGER_ROLES.includes(scope.role)) {
      ensureManageBooking(scope, booking);
    } else {
      throw new AppError("Booking cancellation is restricted for your role", 403);
    }

    editLockPolicy.assertVersionMatch({
      resource: "Remote recitation booking",
      currentVersion: booking.lockVersion,
      expectedVersion: input.lockVersion
    });

    if (
      booking.status !== RemoteRecitationBookingStatus.REQUESTED &&
      booking.status !== RemoteRecitationBookingStatus.APPROVED
    ) {
      throw new AppError("Only requested or approved bookings can be cancelled", 409);
    }

    if (scope.role === Role.STUDENT) {
      const circleContext = await getCircleContextOrThrow(scope, booking.circleId);
      const setting = resolveEffectiveSetting(circleContext.remoteRecitationSetting, circleContext);
      const latestStudentCancellation = new Date(
        booking.slot.startsAt.getTime() - setting.cancellationWindowHours * 60 * 60 * 1000
      );

      if (Date.now() > latestStudentCancellation.getTime()) {
        throw new AppError(
          `Bookings can only be cancelled at least ${setting.cancellationWindowHours} hours before the session`,
          409
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const item = await remoteRecitationRepository.updateBooking(
        booking.id,
        {
          status: RemoteRecitationBookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: normalizeText(input.reason) ?? null
        },
        booking.lockVersion,
        tx
      );

      if (!item) {
        throw new AppError("Booking version conflict", 409, { id: bookingId }, "VERSION_CONFLICT");
      }

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          centerId: item.centerId,
          circleId: item.circleId,
          activityType: ActivityType.GENERIC,
          entityType: "remote_recitation_booking",
          entityId: item.id,
          message: "Cancelled remote recitation booking",
          metadata: {
            slotId: item.slotId,
            startsAt: item.slot.startsAt.toISOString()
          }
        }
      });

      return item;
    });

    await notifySafely({
      organizationId: scope.organizationId,
      centerId: updated.centerId,
      circleId: updated.circleId,
      recipientUserIds: scope.role === Role.STUDENT ? [updated.teacherId] : [updated.studentId],
      type: "REMOTE_RECITATION_CANCELLED",
      title: "Remote recitation cancelled",
      body: "A remote recitation booking was cancelled.",
      payload: {
        workflow: "REMOTE_RECITATION_CANCELLED",
        bookingId: updated.id,
        slotId: updated.slotId,
        startsAt: updated.slot.startsAt.toISOString(),
        status: updated.status
      },
      createdById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: updated.centerId,
      circleId: updated.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REMOTE_RECITATION_BOOKING,
      entityId: updated.id,
      summary: "Cancelled remote recitation booking",
      metadata: {
        bookingId: updated.id,
        slotId: updated.slotId,
        startsAt: updated.slot.startsAt.toISOString(),
        status: updated.status
      }
    });

    return serializeBooking(scope, updated);
  },

  async completeBooking(
    scope: ScopeContext,
    bookingId: number,
    input: CompleteRemoteRecitationBookingInput
  ) {
    if (!MANAGER_ROLES.includes(scope.role)) {
      throw new AppError("Only managers can complete remote recitation bookings", 403);
    }

    const booking = await remoteRecitationRepository.findBookingById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    ensureManageBooking(scope, booking);
    editLockPolicy.assertVersionMatch({
      resource: "Remote recitation booking",
      currentVersion: booking.lockVersion,
      expectedVersion: input.lockVersion
    });

    if (booking.status !== RemoteRecitationBookingStatus.APPROVED) {
      throw new AppError("Only approved bookings can be completed", 409);
    }

    if (booking.followUpRecordId) {
      throw new AppError("Booking has already been completed", 409);
    }

    const normalizedSurah = normalizeText(input.surah);
    const range = await resolveCreateQuranRange({
      surah: normalizedSurah,
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: input.toSurah,
      toAyah: input.toAyah
    });

    followUpDomain.validateFollowUpData(input.type, {
      surah: normalizedSurah,
      fromSurah: range.fromSurah ?? undefined,
      fromAyah: input.fromAyah,
      toSurah: range.toSurah ?? undefined,
      toAyah: input.toAyah,
      rating: input.rating,
      matnId: input.matnId,
      matnName: input.matnName
    });

    const recordDate = input.recordDate
      ? toDateOnly(safeDate(input.recordDate, "recordDate"))
      : toDateOnly(booking.slot.startsAt);

    const completed = await prisma.$transaction(async (tx) => {
      const followUp = await followUpsRepository.createRecord(
        {
          studentId: booking.studentId,
          teacherId: booking.teacherId,
          circleId: booking.circleId,
          recordDate,
          type: input.type,
          status: "FINAL",
          surah: normalizedSurah ?? undefined,
          fromSurah: range.fromSurah ?? undefined,
          fromAyah: range.fromAyah ?? undefined,
          toSurah: range.toSurah ?? undefined,
          toAyah: range.toAyah ?? undefined,
          ayahCount: range.ayahCount,
          fromPage: range.fromPage,
          toPage: range.toPage,
          pagesCount: range.pagesCount,
          rating: input.rating ?? undefined,
          matnId: input.matnId ?? null,
          matnName: normalizeText(input.matnName) ?? undefined,
          matnStatus: normalizeText(input.matnStatus) ?? undefined,
          notes: normalizeText(input.notes) ?? undefined,
          finalizedAt: new Date()
        },
        tx
      );

      const item = await remoteRecitationRepository.updateBooking(
        booking.id,
        {
          status: RemoteRecitationBookingStatus.COMPLETED,
          completedAt: new Date(),
          followUpRecordId: followUp.id
        },
        booking.lockVersion,
        tx
      );

      if (!item) {
        throw new AppError("Booking version conflict", 409, { id: bookingId }, "VERSION_CONFLICT");
      }

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          centerId: item.centerId,
          circleId: item.circleId,
          activityType: ActivityType.FOLLOW_UP_RECORDED,
          entityType: "remote_recitation_booking",
          entityId: item.id,
          message: "Completed remote recitation booking",
          metadata: {
            slotId: item.slotId,
            followUpRecordId: followUp.id,
            startsAt: item.slot.startsAt.toISOString()
          }
        }
      });

      return item;
    });

    await notifySafely({
      organizationId: scope.organizationId,
      centerId: completed.centerId,
      circleId: completed.circleId,
      recipientUserIds: [completed.studentId],
      type: "REMOTE_RECITATION_COMPLETED",
      title: "Remote recitation completed",
      body: "Your remote recitation session was completed and evaluated.",
      payload: {
        workflow: "REMOTE_RECITATION_COMPLETED",
        bookingId: completed.id,
        slotId: completed.slotId,
        followUpRecordId: completed.followUpRecordId,
        status: completed.status
      },
      createdById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: completed.centerId,
      circleId: completed.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.SCORE,
      entityType: AuditEntityType.REMOTE_RECITATION_BOOKING,
      entityId: completed.id,
      summary: "Completed remote recitation booking",
      metadata: {
        bookingId: completed.id,
        slotId: completed.slotId,
        followUpRecordId: completed.followUpRecordId,
        status: completed.status
      }
    });

    return serializeBooking(scope, completed);
  }
};
