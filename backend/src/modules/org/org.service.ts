import {
  AuditAction,
  AuditEntityType,
  Prisma,
  Role,
  type CircleScheduleMode,
  type CircleType,
  type Gender,
  type PrayerName,
  type Weekday
} from "@prisma/client";
import { auditLogger } from "../../shared/audit/audit-log";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { staffScheduleService } from "../staff-operations/staff-schedule.service";
import { orgDomain } from "./org.domain";
import { orgRepository } from "./org.repository";

type CreateCenterInput = {
  name?: string;
  nameAr?: string;
  gender: Gender;
  logoUrl?: string | null;
  mosqueName?: string;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  timezone?: string;
  centerAdminUserId: number;
  supervisorUserIds?: number[];
  centerAdminSchedule?: CircleScheduleWriteRow[];
  code?: string;
};

type UpdateCenterInput = {
  name?: string;
  nameAr?: string;
  gender?: Gender;
  logoUrl?: string | null;
  mosqueName?: string;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  timezone?: string;
  centerAdminUserId?: number;
  supervisorUserIds?: number[];
  centerAdminSchedule?: CircleScheduleWriteRow[];
  code?: string;
};

type UpdateOrgBrandingInput = {
  name?: string;
  logoUrl?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

type UpdateStatusInput = {
  isActive: boolean;
};

type CreateCircleInput = {
  centerId: number;
  name?: string;
  nameAr?: string;
  circleType: CircleType;
  teacherId?: number;
  primaryTeacherUserId?: number;
  mosqueName?: string;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  weeklySchedule?: CircleScheduleWriteRow[];
};

type UpdateCircleInput = {
  name?: string;
  nameAr?: string;
  circleType?: CircleType;
  teacherId?: number;
  primaryTeacherUserId?: number;
  mosqueName?: string;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  weeklySchedule?: CircleScheduleWriteRow[];
};

type CircleScheduleClockRow = {
  day: Weekday;
  mode: "CLOCK";
  fromTime: string;
  toTime: string;
};

type CircleSchedulePrayerRow = {
  day: Weekday;
  mode: "PRAYER";
  fromPrayer: PrayerName;
  toPrayer: PrayerName;
};

type CircleScheduleWriteRow = CircleScheduleClockRow | CircleSchedulePrayerRow;

type CircleScheduleRepoRow = {
  dayOfWeek: Weekday;
  mode: CircleScheduleMode;
  fromTime?: string | null;
  toTime?: string | null;
  fromPrayer?: PrayerName | null;
  toPrayer?: PrayerName | null;
};

type CircleScheduleSlotLike = {
  dayOfWeek: Weekday;
  mode: CircleScheduleMode;
  fromTime: string | null;
  toTime: string | null;
  fromPrayer: PrayerName | null;
  toPrayer: PrayerName | null;
};

const normalizeEntityName = (value: string) => value.replace(/�/g, "").replace(/\s+/g, " ").trim();

const normalizeRequiredName = (input: { name?: string; nameAr?: string }) => {
  const resolved = normalizeEntityName(input.nameAr ?? input.name ?? "");
  if (!resolved) {
    throw new AppError("الاسم العربي للمركز/الحلقة مطلوب", 400);
  }
  return resolved;
};

const normalizeOptionalString = (value?: string | null): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
};

const uniqueInts = (values?: number[]) => {
  if (!values?.length) return [];
  return [...new Set(values.filter((value) => Number.isInteger(value) && value > 0))];
};

const parseCenterCodeSequence = (code: string): number | null => {
  const match = /^CTR-(\d{4,})$/i.exec(code.trim());
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const nextCenterCodeCandidate = async (organizationId: number, offset = 0) => {
  const codes = await orgRepository.listCenterCodesByOrganization(organizationId);
  let max = 0;
  for (const code of codes) {
    const parsed = parseCenterCodeSequence(code);
    if (parsed && parsed > max) {
      max = parsed;
    }
  }
  return `CTR-${String(max + 1 + offset).padStart(4, "0")}`;
};

const isKnownRequestError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError;

const isUniqueViolation = (error: unknown) =>
  isKnownRequestError(error) && error.code === "P2002";

const normalizeMetaTargets = (error: Prisma.PrismaClientKnownRequestError): string[] => {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  if (typeof target === "string") {
    return [target];
  }
  return [];
};

const ensureOrgUserActiveWithRole = async (
  scope: ScopeContext,
  userId: number,
  role: Role,
  label: string
) => {
  const user = await orgRepository.findOrgUserById({
    organizationId: scope.organizationId,
    userId,
    includeInactive: true
  });

  if (!user) {
    throw new AppError(`${label} غير موجود`, 404);
  }

  if (user.role !== role) {
    throw new AppError(`دور ${label} غير صالح`, 400);
  }

  if (!user.isActive) {
    throw new AppError(`${label} يجب أن يكون نشطاً`, 400);
  }

  return user;
};

const ensureTeacherAssignableToCenter = async (
  scope: ScopeContext,
  input: { teacherUserId: number; centerId: number }
) => {
  const teacher = await ensureOrgUserActiveWithRole(scope, input.teacherUserId, Role.TEACHER, "Teacher");

  const hasCenterAccess = teacher.centerAccesses.some((item) => item.centerId === input.centerId);
  const hasCircleAccessInCenter = teacher.circleAccesses.some(
    (item) => item.circle?.centerId === input.centerId
  );
  const teachesCircleInCenter = teacher.taughtCircles.some((item) => item.centerId === input.centerId);

  if (!hasCenterAccess && !hasCircleAccessInCenter && !teachesCircleInCenter) {
    // Circle create/update will attach a circle access link for the teacher. We still enforce role/org/active checks here.
    return teacher;
  }

  return teacher;
};

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const WEEKDAY_ORDER: Weekday[] = [
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY"
];

const PRAYER_ORDER: PrayerName[] = ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"];

const weekdayRank = new Map<Weekday, number>(WEEKDAY_ORDER.map((day, index) => [day, index]));
const prayerRank = new Map<PrayerName, number>(PRAYER_ORDER.map((name, index) => [name, index]));

const assertValidClockRange = (fromTime: string, toTime: string) => {
  if (!HHMM_RE.test(fromTime) || !HHMM_RE.test(toTime)) {
    throw new AppError("جداول نظام الساعة تتطلب قيم وقت HH:mm", 400);
  }
  if (fromTime >= toTime) {
    throw new AppError("نطاق الساعة في الجدول الأسبوعي يجب أن يكون في نفس اليوم و fromTime < toTime", 400);
  }
};

const assertValidPrayerRange = (fromPrayer: PrayerName, toPrayer: PrayerName) => {
  const fromIndex = prayerRank.get(fromPrayer);
  const toIndex = prayerRank.get(toPrayer);
  if (fromIndex === undefined || toIndex === undefined) {
    throw new AppError("قيم الصلاة في الجدول الأسبوعي غير صالحة", 400);
  }
  if (fromIndex >= toIndex) {
    throw new AppError("نطاق الصلاة في الجدول الأسبوعي يجب أن يكون في نفس اليوم ومرتباً", 400);
  }
};

const normalizeWeeklySchedule = (
  input?: CircleScheduleWriteRow[]
): CircleScheduleRepoRow[] | undefined => {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) {
    throw new AppError("الجدول الأسبوعي يجب أن يكون مصفوفة", 400);
  }
  if (input.length > 7) {
    throw new AppError("الجدول الأسبوعي لا يمكن أن يتجاوز 7 أيام", 400);
  }

  const seen = new Set<Weekday>();
  const normalized: CircleScheduleRepoRow[] = [];

  for (const row of input) {
    if (!row || typeof row !== "object") {
      throw new AppError("صف الجدول الأسبوعي غير صالح", 400);
    }

    if (seen.has(row.day)) {
      throw new AppError(`الجدول الأسبوعي يحتوي على يوم مكرر: ${row.day}`, 400);
    }
    seen.add(row.day);

    if (row.mode === "CLOCK") {
      const fromTime = String(row.fromTime ?? "").trim();
      const toTime = String(row.toTime ?? "").trim();
      assertValidClockRange(fromTime, toTime);
      normalized.push({
        dayOfWeek: row.day,
        mode: "CLOCK",
        fromTime,
        toTime,
        fromPrayer: null,
        toPrayer: null
      });
      continue;
    }

    if (row.mode === "PRAYER") {
      const fromPrayer = row.fromPrayer;
      const toPrayer = row.toPrayer;
      if (!fromPrayer || !toPrayer) {
        throw new AppError("جداول الصلاة تتطلب fromPrayer و toPrayer", 400);
      }
      assertValidPrayerRange(fromPrayer, toPrayer);
      normalized.push({
        dayOfWeek: row.day,
        mode: "PRAYER",
        fromTime: null,
        toTime: null,
        fromPrayer,
        toPrayer
      });
      continue;
    }

    throw new AppError("نمط الجدول الأسبوعي غير صالح", 400);
  }

  return normalized;
};

const toStaffScheduleSlots = (rows: CircleScheduleRepoRow[]) =>
  rows.map((row) => ({
    dayOfWeek: row.dayOfWeek,
    mode: row.mode,
    fromTime: row.fromTime ?? null,
    toTime: row.toTime ?? null,
    fromPrayer: row.fromPrayer ?? null,
    toPrayer: row.toPrayer ?? null,
    fromPrayerOffsetMinutes: 0,
    toPrayerOffsetMinutes: 0,
    defaultDurationMinutes: null
  }));

const serializeWeeklySchedule = (rows?: CircleScheduleSlotLike[] | null): CircleScheduleWriteRow[] => {
  if (!rows?.length) return [];

  const sorted = [...rows].sort(
    (a, b) => (weekdayRank.get(a.dayOfWeek) ?? 999) - (weekdayRank.get(b.dayOfWeek) ?? 999)
  );
  const serialized: CircleScheduleWriteRow[] = [];

  for (const row of sorted) {
    if (row.mode === "CLOCK") {
      if (!row.fromTime || !row.toTime) continue;
      serialized.push({
        day: row.dayOfWeek,
        mode: "CLOCK",
        fromTime: row.fromTime,
        toTime: row.toTime
      });
      continue;
    }

    if (row.mode === "PRAYER") {
      if (!row.fromPrayer || !row.toPrayer) continue;
      serialized.push({
        day: row.dayOfWeek,
        mode: "PRAYER",
        fromPrayer: row.fromPrayer,
        toPrayer: row.toPrayer
      });
    }
  }

  return serialized;
};

const toCircleResponse = <TCircle extends object>(
  circle: TCircle
): Omit<TCircle, "weeklyScheduleSlots"> & { weeklySchedule: CircleScheduleWriteRow[] } => {
  const { weeklyScheduleSlots, ...rest } = circle as TCircle & { weeklyScheduleSlots?: CircleScheduleSlotLike[] | null };
  return {
    ...rest,
    weeklySchedule: serializeWeeklySchedule(weeklyScheduleSlots ?? [])
  };
};

const toCenterResponse = <TCenter extends { centerAdminUserId?: number | null; staffSchedules?: any[] }>(
  center: TCenter
) => {
  const activeAssignment = center.staffSchedules?.find(
    (s: any) => s.isActive && s.userId === center.centerAdminUserId
  );
  const slots = activeAssignment?.slots ?? [];
  const centerAdminSchedule = serializeWeeklySchedule(slots);

  const { staffSchedules, ...rest } = center;
  return {
    ...rest,
    centerAdminSchedule
  };
};

const validateCenterAssignments = async (
  scope: ScopeContext,
  input: { centerAdminUserId: number; supervisorUserIds: number[] }
) => {
  const centerAdmin = await ensureOrgUserActiveWithRole(
    scope,
    input.centerAdminUserId,
    Role.CENTER_ADMIN,
    "Center admin"
  );

  const supervisorUsers = [];
  for (const supervisorUserId of input.supervisorUserIds) {
    const supervisor = await ensureOrgUserActiveWithRole(
      scope,
      supervisorUserId,
      Role.SUPERVISOR,
      "Supervisor"
    );
    supervisorUsers.push(supervisor);
  }

  return { centerAdmin, supervisors: supervisorUsers };
};

export const orgService = {
  async getBranding(scope: ScopeContext) {
    const branding = await orgRepository.getOrganizationBranding(scope.organizationId);
    if (!branding) {
      throw new AppError("المنظمة غير موجودة", 404);
    }
    return branding;
  },

  async updateBranding(scope: ScopeContext, input: UpdateOrgBrandingInput) {
    orgDomain.assertCanManageCenters(scope);

    const existing = await orgRepository.getOrganizationBranding(scope.organizationId);
    if (!existing) {
      throw new AppError("المنظمة غير موجودة", 404);
    }

    const name =
      input.name !== undefined
        ? normalizeRequiredName({ nameAr: input.name })
        : undefined;
    const logoUrl = input.logoUrl !== undefined ? normalizeOptionalString(input.logoUrl) ?? null : undefined;
    const description = input.description !== undefined ? normalizeOptionalString(input.description) ?? null : undefined;
    const address = input.address !== undefined ? normalizeOptionalString(input.address) ?? null : undefined;
    const phone = input.phone !== undefined ? normalizeOptionalString(input.phone) ?? null : undefined;
    const email = input.email !== undefined ? normalizeOptionalString(input.email) ?? null : undefined;

    const branding = await orgRepository.updateOrganizationBranding({
      organizationId: scope.organizationId,
      name,
      logoUrl,
      description,
      address,
      phone,
      email
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.SETTINGS,
      entityId: branding.id,
      summary: `تحديث بيانات الجمعية: ${branding.name}`,
      metadata: {
        organizationId: branding.id,
        before: {
          name: existing.name,
          logoUrl: existing.logoUrl,
          description: existing.description,
          address: existing.address,
          phone: existing.phone,
          email: existing.email
        },
        after: {
          name: branding.name,
          logoUrl: branding.logoUrl,
          description: branding.description,
          address: branding.address,
          phone: branding.phone,
          email: branding.email
        }
      }
    });

    return branding;
  },

  async listCenters(scope: ScopeContext, query: { centerId?: number }) {
    const centerIds = orgDomain.resolveCenterScope(scope, query.centerId);

    const centers = await orgRepository.listCenters({
      organizationId: scope.organizationId,
      centerIds
    });
    return centers.map((center) => toCenterResponse(center));
  },

  async listCircles(scope: ScopeContext, query: { centerId?: number; circleId?: number }) {
    const centerIds = orgDomain.resolveCenterScope(scope, query.centerId);
    const circleIds = orgDomain.resolveCircleScope(scope, query.circleId, query.centerId);

    const circles = await orgRepository.listCircles({
      organizationId: scope.organizationId,
      centerIds,
      circleIds
    });
    return circles.map((circle) => toCircleResponse(circle));
  },

  async createCenter(scope: ScopeContext, input: CreateCenterInput) {
    orgDomain.assertCanManageCenters(scope);

    const name = normalizeRequiredName(input);
    const logoUrl = normalizeOptionalString(input.logoUrl);
    const mosqueName = normalizeOptionalString(input.mosqueName);
    const timezone = normalizeOptionalString(input.timezone);
    const supervisorUserIds = uniqueInts(input.supervisorUserIds);
    const centerAdminSchedule = normalizeWeeklySchedule(input.centerAdminSchedule);

    await validateCenterAssignments(scope, {
      centerAdminUserId: input.centerAdminUserId,
      supervisorUserIds
    });

    let lastError: unknown;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const generatedCode = await nextCenterCodeCandidate(scope.organizationId, attempt);

      try {
        const center = await orgRepository.createCenter({
          organizationId: scope.organizationId,
          name,
          gender: input.gender,
          logoUrl: logoUrl ?? null,
          mosqueName: mosqueName ?? null,
          locationText: input.locationText ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          allowedRadiusMeters: input.allowedRadiusMeters ?? null,
          timezone: timezone ?? "Asia/Aden",
          centerAdminUserId: input.centerAdminUserId,
          supervisorUserIds,
          code: generatedCode
        });

        await auditLogger.log({
          organizationId: scope.organizationId,
          centerId: center.id,
          actorUserId: scope.userId,
          actorRole: scope.role,
          action: AuditAction.CREATE,
          entityType: AuditEntityType.CENTER,
          entityId: center.id,
          summary: `إنشاء مركز: ${center.name}`,
          metadata: {
            centerId: center.id,
            nameAr: center.name,
            logoUrl: center.logoUrl,
            mosqueName: center.mosqueName,
            timezone: center.timezone,
            code: center.code,
            gender: center.gender,
            centerAdminUserId: center.centerAdminUserId,
            supervisorUserIds: center.centerSupervisors.map((item) => item.supervisorUserId)
          }
        });

        if (centerAdminSchedule !== undefined) {
          await staffScheduleService.syncCenterAdminScheduleFromCenter({
            organizationId: scope.organizationId,
            centerId: center.id,
            userId: center.centerAdminUserId,
            slots: toStaffScheduleSlots(centerAdminSchedule),
            effectiveFrom: new Date()
          });
        }

        return center;
      } catch (error) {
        if (isUniqueViolation(error)) {
          const targets = normalizeMetaTargets(error as Prisma.PrismaClientKnownRequestError);
          if (targets.includes("name_ar") || targets.includes("name")) {
            throw new AppError("يوجد مركز بنفس الاسم مسبقاً في هذه المنظمة", 400);
          }
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    if (isUniqueViolation(lastError)) {
      throw new AppError("تعذر إنشاء كود فريد للمركز", 409);
    }

    throw lastError;
  },

  async updateCenter(scope: ScopeContext, centerId: number, input: UpdateCenterInput) {
    orgDomain.assertCanManageCenters(scope);

    const existingCenter = await orgRepository.findCenterById({
      centerId,
      organizationId: scope.organizationId,
      includeInactive: true
    });

    if (!existingCenter) {
      throw new AppError("المركز غير موجود", 404);
    }

    const name =
      input.nameAr !== undefined || input.name !== undefined
        ? normalizeRequiredName({ nameAr: input.nameAr, name: input.name })
        : undefined;
    const logoUrl = input.logoUrl !== undefined ? normalizeOptionalString(input.logoUrl) ?? null : undefined;
    const mosqueName =
      input.mosqueName !== undefined ? normalizeOptionalString(input.mosqueName) ?? null : undefined;
    const timezone = input.timezone !== undefined ? normalizeOptionalString(input.timezone) ?? null : undefined;
    const supervisorUserIds =
      input.supervisorUserIds !== undefined ? uniqueInts(input.supervisorUserIds) : undefined;
    const centerAdminSchedule = normalizeWeeklySchedule(input.centerAdminSchedule);

    if (input.centerAdminUserId !== undefined || supervisorUserIds !== undefined) {
      await validateCenterAssignments(scope, {
        centerAdminUserId: input.centerAdminUserId ?? existingCenter.centerAdminUserId,
        supervisorUserIds:
          supervisorUserIds ??
          existingCenter.centerSupervisors.map((item) => item.supervisorUserId)
      });
    }

    try {
      const center = await orgRepository.updateCenter({
        centerId,
        name,
        gender: input.gender,
        logoUrl,
        mosqueName,
        locationText: input.locationText,
        latitude: input.latitude,
        longitude: input.longitude,
        allowedRadiusMeters: input.allowedRadiusMeters,
        timezone,
        centerAdminUserId: input.centerAdminUserId,
        supervisorUserIds,
        isActive: undefined
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: center.id,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CENTER,
        entityId: center.id,
        summary: `تحديث مركز: ${center.name}`,
          metadata: {
            centerId: center.id,
            before: {
              nameAr: existingCenter.name,
              gender: existingCenter.gender,
              logoUrl: existingCenter.logoUrl,
              mosqueName: existingCenter.mosqueName,
              timezone: existingCenter.timezone,
              centerAdminUserId: existingCenter.centerAdminUserId,
              supervisorUserIds: existingCenter.centerSupervisors.map((item) => item.supervisorUserId)
            },
            after: {
              nameAr: center.name,
              gender: center.gender,
              logoUrl: center.logoUrl,
              mosqueName: center.mosqueName,
              timezone: center.timezone,
              centerAdminUserId: center.centerAdminUserId,
              supervisorUserIds: center.centerSupervisors.map((item) => item.supervisorUserId)
            }
          }
        });

      if (existingCenter.centerAdminUserId !== center.centerAdminUserId) {
        await staffScheduleService.handleCenterAdminChanged({
          organizationId: scope.organizationId,
          centerId: center.id,
          oldAdminUserId: existingCenter.centerAdminUserId,
          newAdminUserId: center.centerAdminUserId
        });
      }

      if (centerAdminSchedule !== undefined) {
        await staffScheduleService.syncCenterAdminScheduleFromCenter({
          organizationId: scope.organizationId,
          centerId: center.id,
          userId: center.centerAdminUserId,
          slots: toStaffScheduleSlots(centerAdminSchedule),
          effectiveFrom: new Date()
        });
      }

      return center;
    } catch (error) {
      if (isUniqueViolation(error)) {
        const targets = normalizeMetaTargets(error as Prisma.PrismaClientKnownRequestError);
        if (targets.includes("name_ar") || targets.includes("name")) {
          throw new AppError("يوجد مركز بنفس الاسم مسبقاً في هذه المنظمة", 400);
        }
        throw new AppError("تتعارض بيانات تحديث المركز مع بيانات موجودة مسبقاً", 409);
      }
      throw error;
    }
  },

  async updateCenterStatus(scope: ScopeContext, centerId: number, input: UpdateStatusInput) {
    orgDomain.assertCanManageCenters(scope);

    const existingCenter = await orgRepository.findCenterById({
      centerId,
      organizationId: scope.organizationId,
      includeInactive: true
    });

    if (!existingCenter) {
      throw new AppError("المركز غير موجود", 404);
    }

    const center = await orgRepository.updateCenter({
      centerId,
      isActive: input.isActive
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: center.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CENTER,
      entityId: center.id,
      summary: `${input.isActive ? "تفعيل" : "تعطيل"} مركز: ${center.name}`,
      metadata: {
        centerId: center.id,
        before: { isActive: existingCenter.isActive },
        after: { isActive: center.isActive }
      }
    });

    return center;
  },

  async createCircle(scope: ScopeContext, input: CreateCircleInput) {
    orgDomain.assertCanManageCircles(scope);
    orgDomain.ensureCenterManageable(scope, input.centerId);

    const center = await orgRepository.findCenterCoreById({
      centerId: input.centerId,
      organizationId: scope.organizationId
    });

    if (!center) {
      throw new AppError("المركز غير موجود", 404);
    }

    const teacherUserId = input.primaryTeacherUserId ?? input.teacherId;
    if (!teacherUserId) {
      throw new AppError("المعلم الأساسي مطلوب", 400);
    }

    await ensureTeacherAssignableToCenter(scope, {
      teacherUserId,
      centerId: center.id
    });

    const weeklySchedule = normalizeWeeklySchedule(input.weeklySchedule);

    try {
      const circle = await orgRepository.createCircle({
        centerId: input.centerId,
        name: normalizeRequiredName(input),
        gender: center.gender,
        circleType: input.circleType,
        teacherId: teacherUserId,
        mosqueName: normalizeOptionalString(input.mosqueName) ?? null,
        locationText: normalizeOptionalString(input.locationText) ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        allowedRadiusMeters: input.allowedRadiusMeters ?? null,
        weeklySchedule
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        circleId: circle.id,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CIRCLE,
        entityId: circle.id,
        summary: `إنشاء حلقة: ${circle.name}`,
        metadata: {
          circleId: circle.id,
          centerId: circle.centerId,
          nameAr: circle.name,
          gender: circle.gender,
          circleType: circle.circleType,
          primaryTeacherUserId: circle.teacherId,
          mosqueName: circle.mosqueName,
          locationText: circle.locationText,
          latitude: circle.latitude,
          longitude: circle.longitude,
          allowedRadiusMeters: circle.allowedRadiusMeters,
          weeklySchedule: serializeWeeklySchedule(circle.weeklyScheduleSlots)
        }
        });

      await staffScheduleService.syncTeacherScheduleFromCircle(circle.id);

      return toCircleResponse(circle);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError("الاسم العربي للحلقة موجود مسبقاً في هذا المركز", 409);
      }
      throw error;
    }
  },

  async updateCircle(scope: ScopeContext, circleId: number, input: UpdateCircleInput) {
    orgDomain.assertCanManageCircles(scope);

    const existingCircle = await orgRepository.findCircleById({
      circleId,
      organizationId: scope.organizationId,
      centerIds: orgDomain.managedCenterScope(scope),
      circleIds: orgDomain.managedCircleScope(scope),
      includeInactive: true
    });

    if (!existingCircle) {
      throw new AppError("الحلقة غير موجودة", 404);
    }

    const nextTeacherUserId = input.primaryTeacherUserId ?? input.teacherId;
    if (nextTeacherUserId !== undefined) {
      await ensureTeacherAssignableToCenter(scope, {
        teacherUserId: nextTeacherUserId,
        centerId: existingCircle.centerId
      });
    }

    const weeklySchedule = normalizeWeeklySchedule(input.weeklySchedule);

    try {
      const circle = await orgRepository.updateCircle({
        circleId,
        name:
          input.nameAr !== undefined || input.name !== undefined
            ? normalizeRequiredName({ nameAr: input.nameAr, name: input.name })
            : undefined,
        circleType: input.circleType,
        teacherId: nextTeacherUserId,
        mosqueName:
          input.mosqueName !== undefined ? normalizeOptionalString(input.mosqueName) ?? null : undefined,
        locationText:
          input.locationText !== undefined
            ? normalizeOptionalString(input.locationText) ?? null
            : undefined,
        latitude: input.latitude,
        longitude: input.longitude,
        allowedRadiusMeters: input.allowedRadiusMeters,
        weeklySchedule
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        circleId: circle.id,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CIRCLE,
        entityId: circle.id,
        summary: `تحديث حلقة: ${circle.name}`,
        metadata: {
          circleId: circle.id,
          centerId: circle.centerId,
          before: {
            nameAr: existingCircle.name,
            circleType: existingCircle.circleType,
            primaryTeacherUserId: existingCircle.teacherId,
            mosqueName: existingCircle.mosqueName,
            locationText: existingCircle.locationText,
            latitude: existingCircle.latitude,
            longitude: existingCircle.longitude,
            allowedRadiusMeters: existingCircle.allowedRadiusMeters,
            weeklySchedule: serializeWeeklySchedule(existingCircle.weeklyScheduleSlots)
          },
          after: {
            nameAr: circle.name,
            circleType: circle.circleType,
            primaryTeacherUserId: circle.teacherId,
            mosqueName: circle.mosqueName,
            locationText: circle.locationText,
            latitude: circle.latitude,
            longitude: circle.longitude,
            allowedRadiusMeters: circle.allowedRadiusMeters,
            weeklySchedule: serializeWeeklySchedule(circle.weeklyScheduleSlots)
          }
        }
        });

      if (existingCircle.teacherId !== circle.teacherId) {
        await staffScheduleService.handleTeacherChanged(
          circle.id,
          existingCircle.teacherId,
          circle.teacherId
        );
      } else {
        await staffScheduleService.syncTeacherScheduleFromCircle(circle.id);
      }

      return toCircleResponse(circle);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError("الاسم العربي للحلقة موجود مسبقاً في هذا المركز", 409);
      }
      throw error;
    }
  },

  async updateCircleStatus(scope: ScopeContext, circleId: number, input: UpdateStatusInput) {
    orgDomain.assertCanManageCircles(scope);

    const existingCircle = await orgRepository.findCircleById({
      circleId,
      organizationId: scope.organizationId,
      centerIds: orgDomain.managedCenterScope(scope),
      circleIds: orgDomain.managedCircleScope(scope),
      includeInactive: true
    });

    if (!existingCircle) {
      throw new AppError("الحلقة غير موجودة", 404);
    }

    const circle = await orgRepository.updateCircle({
      circleId,
      isActive: input.isActive
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: circle.centerId,
      circleId: circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CIRCLE,
      entityId: circle.id,
      summary: `${input.isActive ? "تفعيل" : "تعطيل"} حلقة: ${circle.name}`,
      metadata: {
        circleId: circle.id,
        centerId: circle.centerId,
        before: { isActive: existingCircle.isActive },
        after: { isActive: circle.isActive }
      }
    });

    await staffScheduleService.syncCircleScheduleState(circle.id, circle.isActive);

    return toCircleResponse(circle);
  }
};
