import {
  AuditAction,
  AuditEntityType,
  EmploymentStatus,
  Gender,
  KhatmType,
  ParentProfileRelationType,
  ParentRelationType,
  Prisma,
  RiwayaType,
  Role,
  StudentLevel,
  StudentProfileStatus,
  SupervisorProfileStatus
} from "@prisma/client";
import { env } from "../../config/env";
import { auditLogger } from "../../shared/audit/audit-log";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { normalizePhoneForStorage } from "../../shared/utils/identifier";
import { hashPassword } from "../../shared/utils/password";
import { usersDomain } from "./users.domain";
import { usersRepository } from "./users.repository";
import { memoryCache } from "../../shared/cache/memory-cache";

import { randomBytes } from "crypto";
import { hashToken } from "../../shared/utils/token-hash";

type InvitationDelivery = {
  method: "ADMIN_LINK";
  activationLink: string;
  expiresAt: Date;
  issuedAt: Date;
};

type ListUsersQuery = { role?: Role; centerId?: number; circleId?: number };

type CreateUserInput = {
  fullName?: string;
  email: string;
  username?: string | null;
  role: Role;
  password?: string;
  isActive?: boolean;
  profile?: {
    fullName: string;
    gender?: Gender;
    birthDate?: Date | null;
    phone?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
  };
  teacherProfile?: {
    hireDate?: Date | null;
    khatmType?: KhatmType | null;
    riwaya?: RiwayaType | null;
    educationLevel?: string | null;
    yearsExperience?: number | null;
  };
  supervisorProfile?: {
    assignedAt?: Date | null;
    status?: SupervisorProfileStatus;
  };
  centerAdminProfile?: {
    assignedAt?: Date | null;
    employmentStatus?: EmploymentStatus;
  };
  studentProfile?: {
    nickname?: string | null;
    level?: StudentLevel;
    studentStatus?: StudentProfileStatus;
    joinDate?: Date | null;
  };
  parentProfile?: {
    relationType?: ParentProfileRelationType | null;
  };
  links?: {
    centerIds?: number[];
    circleIds?: number[];
    children?: Array<{ studentId: number; relationType?: ParentRelationType }>;
    enrollments?: Array<{ circleId: number; startDate?: Date }>;
  };
};

type UpdateUserInput = {
  fullName?: string;
  email?: string;
  username?: string | null;
  profile?: {
    fullName?: string;
    gender?: Gender;
    birthDate?: Date | null;
    phone?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
  };
  teacherProfile?: {
    hireDate?: Date | null;
    khatmType?: KhatmType | null;
    riwaya?: RiwayaType | null;
    educationLevel?: string | null;
    yearsExperience?: number | null;
  };
  supervisorProfile?: {
    assignedAt?: Date | null;
    status?: SupervisorProfileStatus;
  };
  centerAdminProfile?: {
    assignedAt?: Date | null;
    employmentStatus?: EmploymentStatus;
  };
  studentProfile?: {
    nickname?: string | null;
    level?: StudentLevel;
    studentStatus?: StudentProfileStatus;
    joinDate?: Date | null;
  };
  parentProfile?: {
    relationType?: ParentProfileRelationType | null;
  };
  links?: {
    centerIds?: number[];
    circleIds?: number[];
    children?: Array<{ studentId: number; relationType?: ParentRelationType }>;
    enrollments?: Array<{ circleId: number; startDate?: Date }>;
  };
};

type UpdateUserStatusInput = {
  isActive: boolean;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeOptionalString = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeRequiredString = (value?: string | null, label = "Value") => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    throw new AppError(`${label} is required`, 400);
  }
  return trimmed;
};

const resolveFrontendBaseUrl = () => {
  const base = env.FRONTEND_BASE_URL ?? env.CORS_ORIGIN;
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const buildActivationLink = (activationToken: string) => {
  const encodedToken = encodeURIComponent(activationToken);
  return `${resolveFrontendBaseUrl()}/activate?token=${encodedToken}`;
};

const buildInvitationDelivery = (input: {
  activationToken: string;
  expiresAt: Date;
  issuedAt: Date;
}): InvitationDelivery => ({
  method: "ADMIN_LINK",
  activationLink: buildActivationLink(input.activationToken),
  expiresAt: input.expiresAt,
  issuedAt: input.issuedAt
});

const normalizeOptionalPhone = (value?: string | null) => {
  if (value === undefined) {
    return {
      phone: undefined as string | null | undefined,
      phoneNormalized: undefined as string | null | undefined
    };
  }

  const phone = normalizeOptionalString(value);
  if (phone === undefined) {
    return {
      phone: undefined as string | null | undefined,
      phoneNormalized: undefined as string | null | undefined
    };
  }

  if (phone === null) {
    return {
      phone: null,
      phoneNormalized: null
    };
  }

  return {
    phone,
    phoneNormalized: normalizePhoneForStorage(phone)
  };
};

const uniquePositiveIds = (values?: number[]) =>
  [...new Set((values ?? []).filter((value) => Number.isInteger(value) && value > 0))];

const mapPrismaValidationError = (error: Prisma.PrismaClientValidationError): AppError => {
  const msg = error.message;

  const fieldNameMap: Record<string, string> = {
    email: "البريد الإلكتروني",
    fullName: "الاسم الكامل",
    username: "اسم المستخدم",
    role: "الدور",
    isActive: "حالة التفعيل",
    passwordHash: "كلمة المرور",
    organizationId: "المؤسسة",
    profile: "الملف الشخصي",
    "profile.fullName": "الاسم الكامل في الملف الشخصي",
    "profile.gender": "الجنس",
    "profile.birthDate": "تاريخ الميلاد",
    "profile.phone": "رقم الهاتف",
    "profile.address": "العنوان",
    "profile.avatarUrl": "صورة الملف الشخصي",
    teacherProfile: "ملف المعلم",
    supervisorProfile: "ملف المشرف",
    centerAdminProfile: "ملف مدير المركز",
    studentProfile: "ملف الطالب",
    "studentProfile.nationalId": "رقم الهوية في ملف الطالب",
    nationalId: "رقم الهوية",
    parentProfile: "ملف ولي الأمر",
    links: "الروابط والارتباطات",
    "links.centerIds": "مراكز المستخدم",
    "links.circleIds": "حلقات المستخدم",
    "links.children": "أبناء ولي الأمر",
    "links.enrollments": "تسجيلات الطالب"
  };

  const extractField = (text: string): { name: string; type: "missing" | "invalid" | "unknown" | "other" } | null => {
    // 1. Unknown argument
    const unknownMatch = text.match(/Unknown argument [`'](\w+(?:\.\w+)?)[`']/);
    if (unknownMatch) return { name: unknownMatch[1], type: "unknown" };

    // 2. Missing argument (supports both old and new formats)
    const missingMatch = text.match(/Argument [`'](\w+(?:\.\w+)?)[`'].*is missing/);
    if (missingMatch) return { name: missingMatch[1], type: "missing" };

    // 3. Invalid value
    const invalidMatch = text.match(/Invalid value for argument [`'](\w+(?:\.\w+)?)[`']/);
    if (invalidMatch) return { name: invalidMatch[1], type: "invalid" };

    // 4. Required field
    const requiredMatch = text.match(/Required field [`'](\w+(?:\.\w+)?)[`']/);
    if (requiredMatch) return { name: requiredMatch[1], type: "missing" };

    // General fallback
    const argMatch = text.match(/Argument [`'](\w+(?:\.\w+)?)[`']/);
    if (argMatch) return { name: argMatch[1], type: "other" };

    return null;
  };

  const extracted = extractField(msg);
  if (extracted) {
    const fieldAr = fieldNameMap[extracted.name] ?? extracted.name;
    if (extracted.type === "missing" || msg.includes("is missing") || msg.includes("Required")) {
      return new AppError(`حقل "${fieldAr}" إجباري ولم يتم إدخاله.`, 400, { field: extracted.name }, "USER_VALIDATION_ERROR");
    }
    if (extracted.type === "invalid" || msg.includes("Invalid value")) {
      return new AppError(`قيمة حقل "${fieldAr}" غير صالحة. يرجى التحقق منها.`, 400, { field: extracted.name }, "USER_VALIDATION_ERROR");
    }
    if (extracted.type === "unknown" || msg.includes("Unknown argument")) {
      return new AppError(`حقل غير مدعوم في النظام: "${fieldAr}".`, 400, { field: extracted.name }, "USER_VALIDATION_ERROR");
    }
    return new AppError(`خطأ في حقل "${fieldAr}": البيانات المدخلة غير متوافقة مع متطلبات النظام.`, 400, { field: extracted.name }, "USER_VALIDATION_ERROR");
  }

  return new AppError("بيانات المستخدم غير صالحة. يرجى التحقق من الحقول المطلوبة.", 400, undefined, "USER_VALIDATION_ERROR");
};

const mapUserUniqueError = (error: Prisma.PrismaClientKnownRequestError) => {
  const target = error.meta?.target;
  const text = Array.isArray(target) ? target.join(",") : String(target ?? "");

  if (text.includes("email")) {
    return new AppError("البريد الإلكتروني مستخدم مسبقاً.", 409);
  }
  if (text.includes("username")) {
    return new AppError("اسم المستخدم مستخدم مسبقاً.", 409);
  }
  if (text.includes("phone")) {
    return new AppError("رقم الهاتف مستخدم مسبقاً.", 409);
  }
  if (text.includes("nationalId")) {
    return new AppError("رقم الهوية مستخدم مسبقاً.", 409);
  }

  return new AppError("تعارض في البيانات الفريدة.", 409);
};

const ensureKnownScopedCenter = async (scope: ScopeContext, centerId: number) => {
  usersDomain.assertCenterAllowedForManagement(scope, centerId);
  const center = await usersRepository.findCenterById({
    organizationId: scope.organizationId,
    centerId
  });
  if (!center) {
    throw new AppError("المركز غير موجود.", 404);
  }
  return center;
};

const ensureKnownScopedCircle = async (scope: ScopeContext, circleId: number) => {
  usersDomain.assertCircleAllowedForManagement(scope, circleId);
  const circle = await usersRepository.findCircleById({
    organizationId: scope.organizationId,
    circleId
  });
  if (!circle) {
    throw new AppError("الحلقة غير موجودة.", 404);
  }
  return circle;
};

const assertRoleSpecificPayloadMatchesRole = (
  role: Role,
  input: Pick<
    CreateUserInput & UpdateUserInput,
    | "teacherProfile"
    | "supervisorProfile"
    | "centerAdminProfile"
    | "studentProfile"
    | "parentProfile"
    | "links"
  >
) => {
  if (input.teacherProfile && role !== Role.TEACHER) {
    throw new AppError("ملف المعلم متاح فقط لدور المعلم.", 400);
  }
  if (input.supervisorProfile && role !== Role.SUPERVISOR) {
    throw new AppError("ملف المشرف متاح فقط لدور المشرف.", 400);
  }
  if (input.centerAdminProfile && role !== Role.CENTER_ADMIN) {
    throw new AppError("ملف مدير المركز متاح فقط لدور مدير المركز.", 400);
  }
  if (input.studentProfile && role !== Role.STUDENT) {
    throw new AppError("ملف الطالب متاح فقط لدور الطالب.", 400);
  }
  if (input.parentProfile && role !== Role.PARENT) {
    throw new AppError("ملف ولي الأمر متاح فقط لدور ولي الأمر.", 400);
  }

  if (!input.links) return;
  if (
    input.links.centerIds &&
    !([Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER] as Role[]).includes(role)
  ) {
    throw new AppError("ربط المراكز غير مسموح به لهذا الدور.", 400);
  }
  if (input.links.circleIds && !([Role.SUPERVISOR, Role.TEACHER] as Role[]).includes(role)) {
    throw new AppError("ربط الحلقات غير مسموح به لهذا الدور.", 400);
  }
  if (input.links.children && role !== Role.PARENT) {
    throw new AppError("ربط الأبناء متاح فقط لدور ولي الأمر.", 400);
  }
  if (input.links.enrollments && role !== Role.STUDENT) {
    throw new AppError("التسجيلات متاحة فقط لدور الطالب.", 400);
  }
};

const normalizeLinksInput = (links?: CreateUserInput["links"] | UpdateUserInput["links"]) => {
  if (!links) return undefined;

  return {
    ...(links.centerIds !== undefined ? { centerIds: uniquePositiveIds(links.centerIds) } : {}),
    ...(links.circleIds !== undefined ? { circleIds: uniquePositiveIds(links.circleIds) } : {}),
    ...(links.children !== undefined
      ? {
          children: links.children.map((item) => ({
            studentId: item.studentId,
            relationType: item.relationType ?? ParentRelationType.GUARDIAN
          }))
        }
      : {}),
    ...(links.enrollments !== undefined
      ? {
          enrollments: links.enrollments.map((item) => ({
            circleId: item.circleId,
            ...(item.startDate ? { startDate: item.startDate } : {})
          }))
        }
      : {})
  };
};

const validateLinksWithinScope = async (
  scope: ScopeContext,
  role: Role,
  links?: ReturnType<typeof normalizeLinksInput>
) => {
  if (!links) return;

  // [FIX] Optimized: bulk lookup for centers to avoid N+1.
  if (links.centerIds?.length) {
    links.centerIds.forEach((id) =>
      usersDomain.assertCenterAllowedForManagement(scope, id)
    );
    const centers = await usersRepository.findCentersByIds({
      organizationId: scope.organizationId,
      centerIds: links.centerIds
    });
    if (centers.length !== links.centerIds.length) {
      throw new AppError("مركز أو أكثر غير موجود.", 404);
    }
  }

  // [FIX] Optimized: bulk lookup for circles to avoid N+1.
  if (links.circleIds?.length) {
    links.circleIds.forEach((id) =>
      usersDomain.assertCircleAllowedForManagement(scope, id)
    );
    const circles = await usersRepository.findCirclesByIds({
      organizationId: scope.organizationId,
      circleIds: links.circleIds
    });
    if (circles.length !== links.circleIds.length) {
      throw new AppError("حلقة أو أكثر غير موجودة.", 404);
    }
  }

  // [FIX] Optimized: bulk lookup for parent-student links to avoid N+1.
  if (role === Role.PARENT && links.children?.length) {
    const studentIds = links.children.map((child) => child.studentId);
    const students = await usersRepository.findUsersByIds({
      organizationId: scope.organizationId,
      userIds: studentIds,
      includeInactive: true
    });

    if (students.length !== studentIds.length) {
      throw new AppError("طالب أو أكثر غير موجود.", 404);
    }

    students.forEach((studentUser) => {
      usersDomain.assertRoleManageable(scope, studentUser.role);
      usersDomain.assertParentLinkAllowed(Role.PARENT, studentUser.role);
    });
  }

  // [FIX] Optimized: bulk lookup for student enrollments to avoid N+1.
  if (role === Role.STUDENT && links.enrollments?.length) {
    const enrollCircleIds = links.enrollments.map((e) => e.circleId);
    enrollCircleIds.forEach((id) =>
      usersDomain.assertCircleAllowedForManagement(scope, id)
    );
    const circles = await usersRepository.findCirclesByIds({
      organizationId: scope.organizationId,
      circleIds: enrollCircleIds
    });
    if (circles.length !== enrollCircleIds.length) {
      throw new AppError("حلقة تسجيل أو أكثر غير موجودة.", 404);
    }
  }
};

/* 
// 💡 [ملاحظة للمهندس]: الدوال المضافة حديثاً المطلوبة في `users.repository.ts` لتشغيل الميزة أعلاه بشكل صحيح:
// 1. usersRepository.findCentersByIds({ organizationId: number, centerIds: number[] }) => Promise<Center[]>
// 2. usersRepository.findCirclesByIds({ organizationId: number, circleIds: number[] }) => Promise<Circle[]>
// 3. usersRepository.findUsersByIds({ organizationId: number, userIds: number[], includeInactive: boolean }) => Promise<User[]>
*/

const normalizeCreateUserPayload = (input: CreateUserInput) => {
  const profileFullName = normalizeRequiredString(input.profile?.fullName ?? input.fullName, "fullName");
  const profileGender = input.profile?.gender ?? Gender.MALE;
  const normalizedPhone = normalizeOptionalPhone(input.profile?.phone);

  return {
    email: normalizeEmail(input.email),
    username: normalizeOptionalString(input.username),
    fullName: profileFullName,
    role: input.role,
    isActive: input.isActive ?? true,
    profile: {
      fullName: profileFullName,
      gender: profileGender,
      birthDate: input.profile?.birthDate ?? null,
      phone: normalizedPhone.phone ?? null,
      phoneNormalized: normalizedPhone.phoneNormalized ?? null,
      address: normalizeOptionalString(input.profile?.address),
      avatarUrl: normalizeOptionalString(input.profile?.avatarUrl)
    },
    teacherProfile: input.teacherProfile
      ? {
          ...input.teacherProfile,
          educationLevel: normalizeOptionalString(input.teacherProfile.educationLevel),
          yearsExperience: input.teacherProfile.yearsExperience ?? null
        }
      : undefined,
    supervisorProfile: input.supervisorProfile,
    centerAdminProfile: input.centerAdminProfile,
    studentProfile: input.studentProfile
      ? {
          ...input.studentProfile,
          nickname: normalizeOptionalString(input.studentProfile.nickname)
        }
      : undefined,
    parentProfile: input.parentProfile,
    links: normalizeLinksInput(input.links)
  };
};

const normalizeUpdateUserPayload = (input: UpdateUserInput) => {
  const normalizedPhone =
    input.profile?.phone !== undefined ? normalizeOptionalPhone(input.profile.phone) : undefined;
  const profilePatch = input.profile
    ? {
        ...(input.profile.fullName !== undefined ? { fullName: normalizeRequiredString(input.profile.fullName, "fullName") } : {}),
        ...(input.profile.gender !== undefined ? { gender: input.profile.gender } : {}),
        ...(input.profile.birthDate !== undefined ? { birthDate: input.profile.birthDate } : {}),
        ...(input.profile.phone !== undefined
          ? {
              phone: normalizedPhone?.phone,
              phoneNormalized: normalizedPhone?.phoneNormalized
            }
          : {}),
        ...(input.profile.address !== undefined ? { address: normalizeOptionalString(input.profile.address) } : {}),
        ...(input.profile.avatarUrl !== undefined ? { avatarUrl: normalizeOptionalString(input.profile.avatarUrl) } : {})
      }
    : undefined;

  const mergedProfilePatch =
    input.fullName !== undefined
      ? {
          ...(profilePatch ?? {}),
          fullName: normalizeRequiredString(input.fullName, "fullName")
        }
      : profilePatch;

  return {
    email: input.email !== undefined ? normalizeEmail(input.email) : undefined,
    username: input.username !== undefined ? normalizeOptionalString(input.username) : undefined,
    fullName: input.fullName !== undefined ? normalizeRequiredString(input.fullName, "fullName") : undefined,
    profile: mergedProfilePatch && Object.keys(mergedProfilePatch).length ? mergedProfilePatch : undefined,
    teacherProfile: input.teacherProfile
      ? {
          ...input.teacherProfile,
          educationLevel:
            input.teacherProfile.educationLevel !== undefined
              ? normalizeOptionalString(input.teacherProfile.educationLevel)
              : undefined,
          yearsExperience:
            input.teacherProfile.yearsExperience !== undefined
              ? input.teacherProfile.yearsExperience ?? null
              : undefined
        }
      : undefined,
    supervisorProfile: input.supervisorProfile,
    centerAdminProfile: input.centerAdminProfile,
    studentProfile: input.studentProfile
      ? {
          ...input.studentProfile,
          nickname:
            input.studentProfile.nickname !== undefined
              ? normalizeOptionalString(input.studentProfile.nickname)
              : undefined
        }
      : undefined,
    parentProfile: input.parentProfile,
    links: normalizeLinksInput(input.links)
  };
};

const getManagedUserOr404 = async (
  scope: ScopeContext,
  userId: number,
  options?: { includeInactive?: boolean }
) => {
  if (scope.role === Role.SUPER_ADMIN) {
    const user = await usersRepository.findUserById({
      organizationId: scope.organizationId,
      userId,
      includeInactive: options?.includeInactive
    });

    if (!user) {
      throw new AppError("المستخدم غير موجود.", 404);
    }

    return user;
  }

  const user = await usersRepository.findScopedUserById({
    organizationId: scope.organizationId,
    userId,
    centerIds: scope.centerIds,
    circleIds: scope.circleIds,
    actorUserId: scope.userId,
    includeInactive: options?.includeInactive
  });

  if (!user) {
    throw new AppError("المستخدم غير موجود.", 404);
  }

  return user;
};

const getReadableUserOr404 = async (
  scope: ScopeContext,
  userId: number,
  options?: { includeInactive?: boolean }
) => {
  if (scope.allAccess) {
    const user = await usersRepository.findUserById({
      organizationId: scope.organizationId,
      userId,
      includeInactive: options?.includeInactive
    });

    if (!user) {
      throw new AppError("المستخدم غير موجود.", 404);
    }

    return user;
  }

  const selfScopedIds = usersDomain.resolveSelfScopedUserIds(scope);

  if (selfScopedIds) {
    if (!selfScopedIds.includes(userId)) {
      throw new AppError("المستخدم غير موجود.", 404);
    }

    const user = await usersRepository.findUserById({
      organizationId: scope.organizationId,
      userId,
      includeInactive: options?.includeInactive
    });

    if (!user) {
      throw new AppError("المستخدم غير موجود.", 404);
    }

    return user;
  }

  const user = await usersRepository.findScopedUserById({
    organizationId: scope.organizationId,
    userId,
    centerIds: scope.centerIds,
    circleIds: scope.circleIds,
    actorUserId: scope.userId,
    includeInactive: options?.includeInactive
  });

  if (!user) {
    throw new AppError("المستخدم غير موجود.", 404);
  }

  return user;
};

export const usersService = {
  async listUsers(scope: ScopeContext, query: ListUsersQuery) {
    usersDomain.assertFinanceUserReadFilter(scope, query.role);
    usersDomain.assertScopeFilter(scope, query);

    const selfScopedIds = usersDomain.resolveSelfScopedUserIds(scope);

    if (selfScopedIds) {
      return usersRepository.findUsers({
        organizationId: scope.organizationId,
        role: query.role,
        userIds: selfScopedIds,
        includeInactive: true
      });
    }

    if (scope.allAccess) {
      if (!query.centerId && !query.circleId) {
        return usersRepository.findUsers({
          organizationId: scope.organizationId,
          role: query.role,
          includeInactive: true
        });
      }

      const centerIds = query.centerId ? [query.centerId] : [];
      const circleIds = query.circleId
        ? [query.circleId]
        : centerIds.length
          ? await usersRepository.findCircleIdsByCenterIds(centerIds)
          : [];

      const relatedUserIds = await usersRepository.collectRelatedUserIds({
        organizationId: scope.organizationId,
        centerIds,
        circleIds,
        includeInactive: true
      });

      return usersRepository.findUsers({
        organizationId: scope.organizationId,
        role: query.role,
        userIds: usersDomain.uniqueIds(relatedUserIds),
        includeInactive: true
      });
    }

    const centerIds = query.centerId ? [query.centerId] : scope.centerIds;

    const circleIds = query.circleId
      ? [query.circleId]
      : query.centerId
        ? await usersRepository.findCircleIdsByCenterIds(centerIds)
        : scope.circleIds;

    const relatedUserIds = await usersRepository.collectRelatedUserIds({
      organizationId: scope.organizationId,
      centerIds,
      circleIds,
      includeInactive: true
    });

    const visibleIds = usersDomain.uniqueIds([scope.userId, ...relatedUserIds]);

    return usersRepository.findUsers({
      organizationId: scope.organizationId,
      role: query.role,
      userIds: visibleIds,
      includeInactive: true
    });
  },

  async getUserById(scope: ScopeContext, userId: number) {
    return getReadableUserOr404(scope, userId);
  },

  async getStudentProfile(scope: ScopeContext, userId: number) {
    const user = await getReadableUserOr404(scope, userId);
    if (user.role !== Role.STUDENT) {
      throw new AppError("المستخدم ليس طالباً.", 400);
    }
    
    return usersRepository.getStudentProfileData(scope.organizationId, userId);
  },

  async createUser(scope: ScopeContext, input: CreateUserInput) {
    usersDomain.assertCanManageUsers(scope);
    usersDomain.assertRoleCreatable(scope, input.role);
    assertRoleSpecificPayloadMatchesRole(input.role, input);

    const normalized = normalizeCreateUserPayload(input);

    if (input.role !== Role.STUDENT && !normalized.profile?.phone) {
      throw new AppError("رقم الهاتف مطلوب لهذا الدور.", 400);
    }

    const duplicateName = await usersRepository.findUserByExactName(scope.organizationId, normalized.fullName);
    if (duplicateName) {
      throw new AppError("الاسم الرباعي مسجل مسبقاً لمستخدم آخر. يرجى التحقق من الاسم.", 409);
    }

    // Enforce center binding for CENTER_ADMIN-created STUDENT/PARENT users
    if (
      scope.role === Role.CENTER_ADMIN &&
      (input.role === Role.STUDENT || input.role === Role.PARENT) &&
      (!normalized.links || !normalized.links.centerIds || normalized.links.centerIds.length === 0)
    ) {
      if (!scope.centerIds.length) {
        throw new AppError("لا يمكن إنشاء مستخدم بدون مركز مرتبط.", 400);
      }
      normalized.links = {
        ...(normalized.links ?? {}),
        centerIds: scope.centerIds
      };
    }

    await validateLinksWithinScope(scope, input.role, normalized.links);
    
    const activationToken = randomBytes(32).toString("hex");
    const activationTokenHash = hashToken(activationToken);
    const activationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const activationSentAt = new Date();
    
    try {
      const user = await usersRepository.createUserWithDetails({
        organizationId: scope.organizationId,
        createdByUserId: scope.userId,
        fullName: normalized.fullName,
        email: normalized.email,
        username: normalized.username,
        role: normalized.role,
        passwordHash: null,
        isActive: normalized.isActive,
        accountStatus: "INVITED",
        activationTokenHash,
        activationTokenExpiresAt,
        activationSentAt,
        profile: normalized.profile,
        teacherProfile: normalized.teacherProfile,
        supervisorProfile: normalized.supervisorProfile,
        centerAdminProfile: normalized.centerAdminProfile,
        studentProfile: normalized.studentProfile,
        parentProfile: normalized.parentProfile,
        links: normalized.links
      });

      if (!user) {
        throw new AppError("لم يتم العثور على المستخدم بعد الإنشاء.", 500);
      }

      await auditLogger.log({
        organizationId: scope.organizationId,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        summary: `إنشاء مستخدم: ${user.fullName}`,
        metadata: {
          userId: user.id,
          role: user.role,
          email: user.email
        }
      });

      return {
        ...user,
        invitation: buildInvitationDelivery({
          activationToken,
          expiresAt: activationTokenExpiresAt,
          issuedAt: activationSentAt
        })
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw mapUserUniqueError(error);
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        throw mapPrismaValidationError(error);
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppError(
          "حدث خطأ أثناء إنشاء المستخدم. يرجى المحاولة مرة أخرى.",
          500,
          { prismaCode: error.code, prismaMessage: error.message },
          "USER_CREATE_DB_ERROR"
        );
      }

      throw error;
    }
  },

  async updateUser(scope: ScopeContext, userId: number, input: UpdateUserInput) {
    usersDomain.assertCanManageUsers(scope);

    const existingUser = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, existingUser.role);
    assertRoleSpecificPayloadMatchesRole(existingUser.role, input);

    const normalized = normalizeUpdateUserPayload(input);

    if (existingUser.role !== Role.STUDENT && normalized.profile && normalized.profile.phone === null) {
      throw new AppError("رقم الهاتف مطلوب لهذا الدور.", 400);
    }

    if (normalized.fullName && normalized.fullName !== existingUser.fullName) {
      const duplicateName = await usersRepository.findUserByExactName(scope.organizationId, normalized.fullName, existingUser.id);
      if (duplicateName) {
        throw new AppError("الاسم الرباعي مسجل مسبقاً لمستخدم آخر. يرجى التحقق من الاسم.", 409);
      }
    }

    await validateLinksWithinScope(scope, existingUser.role, normalized.links);

    try {
      const user = await usersRepository.updateUserWithDetails({
        userId,
        fullName: normalized.fullName,
        email: normalized.email,
        username: normalized.username,
        profile: normalized.profile,
        teacherProfile: normalized.teacherProfile,
        supervisorProfile: normalized.supervisorProfile,
        centerAdminProfile: normalized.centerAdminProfile,
        studentProfile: normalized.studentProfile,
        parentProfile: normalized.parentProfile,
        links: normalized.links
      });

      if (!user) {
        throw new AppError("المستخدم غير موجود.", 404);
      }

      await auditLogger.log({
        organizationId: scope.organizationId,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        summary: `تحديث مستخدم: ${user.fullName}`,
        metadata: {
          userId: user.id,
          before: {
            fullName: existingUser.fullName,
            email: existingUser.email,
            username: (existingUser as { username?: string | null }).username ?? null
          },
          after: {
            fullName: user.fullName,
            email: user.email,
            username: (user as { username?: string | null }).username ?? null
          }
        }
      });

      memoryCache.invalidatePrefix(`scope:${userId}:`);

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw mapUserUniqueError(error);
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        throw mapPrismaValidationError(error);
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppError(
          "حدث خطأ أثناء تحديث المستخدم. يرجى المحاولة مرة أخرى.",
          500,
          { prismaCode: error.code, prismaMessage: error.message },
          "USER_UPDATE_DB_ERROR"
        );
      }

      throw error;
    }
  },

  async updateUserStatus(scope: ScopeContext, userId: number, input: UpdateUserStatusInput) {
    usersDomain.assertCanManageUsers(scope);

    const existingUser = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, existingUser.role);

    const activeSuperAdminsCount = await usersRepository.countActiveSuperAdmins(scope.organizationId);
    usersDomain.assertCanToggleUserStatus({
      actorUserId: scope.userId,
      targetUserId: existingUser.id,
      nextIsActive: input.isActive,
      targetRole: existingUser.role,
      activeSuperAdminsCount,
      currentIsActive: existingUser.isActive
    });

    const user = await usersRepository.updateUser({
      userId,
      isActive: input.isActive
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      summary: `${input.isActive ? "تفعيل" : "تعطيل"} مستخدم: ${user.fullName}`,
      metadata: {
        userId: user.id,
        before: { isActive: existingUser.isActive },
        after: { isActive: user.isActive }
      }
    });

    if (input.isActive) {
      memoryCache.invalidatePrefix(`scope:${userId}:`);
    } else {
      memoryCache.delete(`scope:${userId}:${scope.organizationId}`);
    }

    return user;
  },

  async deleteUser(scope: ScopeContext, userId: number) {
    usersDomain.assertCanManageUsers(scope);

    const existingUser = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, existingUser.role);

    if (!existingUser.isActive) {
      throw new AppError("المستخدم معطل بالفعل.", 400, undefined, "USER_ALREADY_INACTIVE");
    }

    const activeSuperAdminsCount = await usersRepository.countActiveSuperAdmins(scope.organizationId);
    usersDomain.assertCanToggleUserStatus({
      actorUserId: scope.userId,
      targetUserId: existingUser.id,
      nextIsActive: false,
      targetRole: existingUser.role,
      activeSuperAdminsCount,
      currentIsActive: existingUser.isActive
    });

    const user = await usersRepository.updateUser({
      userId,
      isActive: false
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      summary: `تعطيل مستخدم: ${user.fullName}`,
      metadata: {
        userId: user.id,
        before: { isActive: true },
        after: { isActive: false }
      }
    });

    memoryCache.delete(`scope:${userId}:${scope.organizationId}`);

    return user;
  },

  async addCenterAccess(scope: ScopeContext, userId: number, input: { centerId: number }) {
    usersDomain.assertCanManageUsers(scope);
    usersDomain.assertCenterAllowedForManagement(scope, input.centerId);

    const user = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, user.role);
    usersDomain.assertCenterAccessLinkAllowed(user.role);

    const center = await usersRepository.findCenterById({
      organizationId: scope.organizationId,
      centerId: input.centerId
    });

    if (!center) {
      throw new AppError("المركز غير موجود.", 404);
    }

    try {
      const updatedUser = await usersRepository.addCenterAccess({
        userId: user.id,
        centerId: input.centerId
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: input.centerId,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        summary: `ربط مستخدم بمركز`,
        metadata: {
          userId: user.id,
          centerId: input.centerId
        }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("المستخدم مرتبط بهذا المركز مسبقاً.", 409);
      }

      throw error;
    }
  },

  async removeCenterAccess(scope: ScopeContext, userId: number, centerId: number) {
    usersDomain.assertCanManageUsers(scope);
    usersDomain.assertCenterAllowedForManagement(scope, centerId);

    const user = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, user.role);
    usersDomain.assertCenterAccessLinkAllowed(user.role);

    const result = await usersRepository.removeCenterAccess({
      userId: user.id,
      centerId
    });

    if (result.deletedCount === 0) {
      throw new AppError("ارتباط المركز غير موجود.", 404);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      summary: `فك ربط مستخدم من مركز`,
      metadata: {
        userId: user.id,
        centerId
      }
    });

    return result.user;
  },

  async addCircleAccess(scope: ScopeContext, userId: number, input: { circleId: number }) {
    usersDomain.assertCanManageUsers(scope);
    usersDomain.assertCircleAllowedForManagement(scope, input.circleId);

    const user = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, user.role);
    usersDomain.assertCircleAccessLinkAllowed(user.role);

    const circle = await usersRepository.findCircleById({
      organizationId: scope.organizationId,
      circleId: input.circleId
    });

    if (!circle) {
      throw new AppError("الحلقة غير موجودة.", 404);
    }

    try {
      const updatedUser = await usersRepository.addCircleAccess({
        userId: user.id,
        circleId: input.circleId
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        circleId: circle.id,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        summary: `ربط مستخدم بحلقة`,
        metadata: {
          userId: user.id,
          circleId: circle.id
        }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("المستخدم مرتبط بهذه الحلقة مسبقاً.", 409);
      }

      throw error;
    }
  },

  async removeCircleAccess(scope: ScopeContext, userId: number, circleId: number) {
    usersDomain.assertCanManageUsers(scope);
    usersDomain.assertCircleAllowedForManagement(scope, circleId);

    const user = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, user.role);
    usersDomain.assertCircleAccessLinkAllowed(user.role);

    const existingCircle = await usersRepository.findCircleById({
      organizationId: scope.organizationId,
      circleId
    });

    if (!existingCircle) {
      throw new AppError("الحلقة غير موجودة.", 404);
    }

    const result = await usersRepository.removeCircleAccess({
      userId: user.id,
      circleId
    });

    if (result.deletedCount === 0) {
      throw new AppError("ارتباط الحلقة غير موجود.", 404);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: existingCircle.centerId,
      circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      summary: `فك ربط مستخدم من حلقة`,
      metadata: {
        userId: user.id,
        circleId
      }
    });

    return result.user;
  },

  async addParentStudentLink(
    scope: ScopeContext,
    userId: number,
    input: { studentId: number; relationType?: ParentRelationType }
  ) {
    usersDomain.assertCanManageUsers(scope);

    const parentUser = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, parentUser.role);

    const studentUser = await getManagedUserOr404(scope, input.studentId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, studentUser.role);
    usersDomain.assertParentLinkAllowed(parentUser.role, studentUser.role);

    try {
      const updatedUser = await usersRepository.addParentStudentLink({
        parentId: parentUser.id,
        studentId: studentUser.id,
        relationType: input.relationType,
        createdByUserId: scope.userId
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.USER,
        entityId: parentUser.id,
        summary: `ربط ولي أمر بطالب`,
        metadata: {
          parentId: parentUser.id,
          studentId: studentUser.id,
          relationType: input.relationType ?? ParentRelationType.GUARDIAN
        }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("ولي الأمر مرتبط بهذا الطالب مسبقاً.", 409);
      }

      throw error;
    }
  },

  async removeParentStudentLink(scope: ScopeContext, userId: number, studentId: number) {
    usersDomain.assertCanManageUsers(scope);

    const parentUser = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, parentUser.role);

    const studentUser = await getManagedUserOr404(scope, studentId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, studentUser.role);
    usersDomain.assertParentLinkAllowed(parentUser.role, studentUser.role);

    const result = await usersRepository.removeParentStudentLink({
      parentId: parentUser.id,
      studentId: studentUser.id
    });

    if (result.deletedCount === 0) {
      throw new AppError("ارتباط ولي الأمر والطالب غير موجود.", 404);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.USER,
      entityId: parentUser.id,
      summary: `فك ربط ولي أمر من طالب`,
      metadata: {
        parentId: parentUser.id,
        studentId: studentUser.id
      }
    });

    return result.user;
  },

  async addStudentEnrollment(
    scope: ScopeContext,
    userId: number,
    input: { circleId: number; startDate?: Date }
  ) {
    usersDomain.assertCanManageUsers(scope);
    usersDomain.assertCircleAllowedForManagement(scope, input.circleId);

    const studentUser = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, studentUser.role);
    usersDomain.assertEnrollmentLinkAllowed(studentUser.role);

    const circle = await usersRepository.findCircleById({
      organizationId: scope.organizationId,
      circleId: input.circleId
    });

    if (!circle) {
      throw new AppError("الحلقة غير موجودة.", 404);
    }

    try {
      const updatedUser = await usersRepository.addStudentEnrollment({
        studentId: studentUser.id,
        circleId: input.circleId,
        startDate: input.startDate
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        circleId: circle.id,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.USER,
        entityId: studentUser.id,
        summary: `ربط طالب بحلقة`,
        metadata: {
          studentId: studentUser.id,
          circleId: circle.id
        }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("الطالب مسجل في هذه الحلقة مسبقاً.", 409);
      }

      throw error;
    }
  },

  async removeStudentEnrollment(scope: ScopeContext, userId: number, circleId: number) {
    usersDomain.assertCanManageUsers(scope);
    usersDomain.assertCircleAllowedForManagement(scope, circleId);

    const studentUser = await getManagedUserOr404(scope, userId, { includeInactive: true });
    usersDomain.assertRoleManageable(scope, studentUser.role);
    usersDomain.assertEnrollmentLinkAllowed(studentUser.role);

    const circle = await usersRepository.findCircleById({
      organizationId: scope.organizationId,
      circleId
    });

    if (!circle) {
      throw new AppError("الحلقة غير موجودة.", 404);
    }

    const result = await usersRepository.removeStudentEnrollment({
      studentId: studentUser.id,
      circleId
    });

    if (result.deletedCount === 0) {
      throw new AppError("ارتباط التسجيل غير موجود.", 404);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: circle.centerId,
      circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.USER,
      entityId: studentUser.id,
      summary: `فك ربط طالب من حلقة`,
      metadata: {
        studentId: studentUser.id,
        circleId
      }
    });

    return result.user;
  },

  async resendActivation(scope: ScopeContext, userId: number) {
    usersDomain.assertCanManageUsers(scope);
    const existingUser = await getManagedUserOr404(scope, userId, { includeInactive: true });
    
    if (existingUser.accountStatus === "ACTIVE") {
      throw new AppError("لا يمكن إعادة إرسال التفعيل لحساب مفعل.", 400);
    }

    if (existingUser.accountStatus === "SUSPENDED") {
      throw new AppError("لا يمكن إعادة إرسال التفعيل لحساب معلق.", 400);
    }
    
    const activationToken = randomBytes(32).toString("hex");
    const activationTokenHash = hashToken(activationToken);
    const activationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const activationSentAt = new Date();
    
    await usersRepository.updateUser({
      userId,
      accountStatus: "INVITED",
      activationTokenHash,
      activationTokenExpiresAt,
      activationSentAt
    });

    return {
      message: "Activation invitation is ready for delivery",
      invitation: buildInvitationDelivery({
        activationToken,
        expiresAt: activationTokenExpiresAt,
        issuedAt: activationSentAt
      })
    };
  }
};
