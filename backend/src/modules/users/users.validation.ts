import {
  EmploymentStatus,
  Gender,
  KhatmType,
  ParentProfileRelationType,
  ParentRelationType,
  RiwayaType,
  Role,
  StudentLevel,
  StudentProfileStatus,
  SupervisorProfileStatus
} from "@prisma/client";
import { z } from "zod";

export const usersQuerySchema = z
  .object({
    role: z.union([
      z.nativeEnum(Role),
      z.string().transform((val) => {
        const roles = val.split(',').map((r) => r.trim());
        const validRoles = Object.values(Role);
        return roles.filter((r) => validRoles.includes(r as Role)) as Role[];
      })
    ]).optional(),
    centerId: z.coerce.number().int().positive().optional(),
    circleId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

const positiveId = z.coerce.number().int().positive();
const nonEmptyString = (max: number) => z.string().trim().min(1).max(max);
const fullNameString = (max: number) => z.string().trim().min(1).max(max).refine((val) => {
  const parts = val.split(/\s+/);
  if (parts.length < 3) return false;
  if (parts.some(p => p.length < 2)) return false;
  return true;
}, { message: "الاسم الرباعي يجب أن يتكون من 3 أسماء على الأقل، وكل اسم حرفين على الأقل" });
const optionalTrimmedString = (max: number) => z.string().trim().max(max).optional().nullable();
const optionalDate = z.coerce.date().optional().nullable();
const khatmTypeInputSchema = z
  .union([z.nativeEnum(KhatmType), z.enum(["KHATIM", "MUJAZ"])])
  .transform((value): KhatmType => {
    if (value === "KHATIM") {
      return KhatmType.KHATEM;
    }

    if (value === "MUJAZ") {
      return KhatmType.IJAZAH;
    }

    return value;
  });

const commonProfileCreateSchema = z
  .object({
    fullName: fullNameString(160).optional(),
    gender: z.nativeEnum(Gender).optional().nullable(),
    birthDate: z.coerce.date(),
    phone: optionalTrimmedString(32),
    address: optionalTrimmedString(255),
    avatarUrl: optionalTrimmedString(500)
  })
  .strict();

const commonProfileUpdateSchema = commonProfileCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "حقل ملف تعريف واحد على الأقل مطلوب" }
);

const teacherProfileCreateSchema = z
  .object({
    hireDate: optionalDate,
    khatmType: khatmTypeInputSchema.optional().nullable(),
    riwaya: z.nativeEnum(RiwayaType).optional().nullable(),
    educationLevel: optionalTrimmedString(120),
    yearsExperience: z.coerce.number().int().min(0).max(80).optional().nullable()
  })
  .strict();

const teacherProfileUpdateSchema = teacherProfileCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "حقل ملف تعريف معلم واحد على الأقل مطلوب" }
);

const supervisorProfileCreateSchema = z
  .object({
    assignedAt: optionalDate,
    status: z.nativeEnum(SupervisorProfileStatus).optional(),
    educationLevel: optionalTrimmedString(120),
    yearsExperience: z.coerce.number().int().min(0).max(80).optional().nullable(),
    quranQualification: khatmTypeInputSchema.optional().nullable(),
    professionalNotes: optionalTrimmedString(500)
  })
  .strict();

const supervisorProfileUpdateSchema = supervisorProfileCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "حقل ملف تعريف مشرف واحد على الأقل مطلوب" }
);

const centerAdminProfileCreateSchema = z
  .object({
    assignedAt: optionalDate,
    employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
    educationLevel: optionalTrimmedString(120),
    yearsExperience: z.coerce.number().int().min(0).max(80).optional().nullable(),
    administrativeExperienceYears: z.coerce.number().int().min(0).max(80).optional().nullable(),
    professionalNotes: optionalTrimmedString(500)
  })
  .strict();

const centerAdminProfileUpdateSchema = centerAdminProfileCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "حقل ملف تعريف مدير مركز واحد على الأقل مطلوب" }
);

const studentProfileCreateSchema = z
  .object({
    nickname: optionalTrimmedString(80),
    level: z.nativeEnum(StudentLevel).optional(),
    studentStatus: z.nativeEnum(StudentProfileStatus).optional(),
    joinDate: z.coerce.date()
  })
  .strict();

const studentProfileUpdateSchema = studentProfileCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "حقل ملف تعريف طالب واحد على الأقل مطلوب" }
);

const parentProfileCreateSchema = z
  .object({
    relationType: z.nativeEnum(ParentProfileRelationType).optional().nullable()
  })
  .strict();

const parentProfileUpdateSchema = parentProfileCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "حقل ملف تعريف ولي أمر واحد على الأقل مطلوب" }
);

const userLinksCreateSchema = z
  .object({
    centerIds: z.array(positiveId).max(100).optional(),
    circleIds: z.array(positiveId).max(200).optional(),
    children: z
      .array(
        z
          .object({
            studentId: positiveId,
            relationType: z.nativeEnum(ParentRelationType).optional()
          })
          .strict()
      )
      .max(200)
      .optional(),
    enrollments: z
      .array(
        z
          .object({
            circleId: positiveId,
            startDate: z.coerce.date()
          })
          .strict()
      )
      .max(200)
      .optional()
  })
  .strict();

const userLinksUpdateSchema = userLinksCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "حقل روابط واحد على الأقل مطلوب" }
);

export const userIdParamSchema = z
  .object({
    id: positiveId
  })
  .strict();

export const createUserBodySchema = z
  .object({
    fullName: fullNameString(120).optional(), // legacy compatibility
    email: z.string().trim().email().max(191),
    username: optionalTrimmedString(80),
    role: z.nativeEnum(Role),
    isActive: z.boolean().optional(),
    profile: commonProfileCreateSchema.optional(),
    teacherProfile: teacherProfileCreateSchema.optional(),
    supervisorProfile: supervisorProfileCreateSchema.optional(),
    centerAdminProfile: centerAdminProfileCreateSchema.optional(),
    studentProfile: studentProfileCreateSchema.optional(),
    parentProfile: parentProfileCreateSchema.optional(),
    links: userLinksCreateSchema.optional()
  })
  .strict()
  .refine((value) => Boolean(value.profile?.fullName || value.fullName), {
    message: "الاسم الكامل (أو profile.fullName) مطلوب"
  });

export const updateUserBodySchema = z
  .object({
    fullName: fullNameString(120).optional(), // legacy compatibility
    email: z.string().trim().email().max(191).optional(),
    username: optionalTrimmedString(80),
    role: z.nativeEnum(Role).optional(),
    profile: commonProfileUpdateSchema.optional(),
    teacherProfile: teacherProfileUpdateSchema.optional(),
    supervisorProfile: supervisorProfileUpdateSchema.optional(),
    centerAdminProfile: centerAdminProfileUpdateSchema.optional(),
    studentProfile: studentProfileUpdateSchema.optional(),
    parentProfile: parentProfileUpdateSchema.optional(),
    links: userLinksUpdateSchema.optional()
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "حقل واحد على الأقل مطلوب"
  });

export const updateUserStatusBodySchema = z
  .object({
    isActive: z.boolean()
  })
  .strict();

export const createUserCenterAccessBodySchema = z
  .object({
    centerId: positiveId
  })
  .strict();

export const createUserCircleAccessBodySchema = z
  .object({
    circleId: positiveId
  })
  .strict();

export const createParentStudentLinkBodySchema = z
  .object({
    studentId: positiveId,
    relationType: z.nativeEnum(ParentRelationType).optional()
  })
  .strict();

export const createStudentEnrollmentBodySchema = z
  .object({
    circleId: positiveId,
    startDate: z.coerce.date()
  })
  .strict();

export const userCenterLinkParamsSchema = z
  .object({
    id: positiveId,
    centerId: positiveId
  })
  .strict();

export const userCircleLinkParamsSchema = z
  .object({
    id: positiveId,
    circleId: positiveId
  })
  .strict();

export const userStudentLinkParamsSchema = z
  .object({
    id: positiveId,
    studentId: positiveId
  })
  .strict();

// ==========================================
// DTO Types inferred from Zod Schemas
// ==========================================
export type UsersQueryDto = z.infer<typeof usersQuerySchema>;
export type CreateUserDto = z.infer<typeof createUserBodySchema>;
export type UpdateUserDto = z.infer<typeof updateUserBodySchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusBodySchema>;
export type CreateUserCenterAccessDto = z.infer<typeof createUserCenterAccessBodySchema>;
export type CreateUserCircleAccessDto = z.infer<typeof createUserCircleAccessBodySchema>;
export type CreateParentStudentLinkDto = z.infer<typeof createParentStudentLinkBodySchema>;
export type CreateStudentEnrollmentDto = z.infer<typeof createStudentEnrollmentBodySchema>;
