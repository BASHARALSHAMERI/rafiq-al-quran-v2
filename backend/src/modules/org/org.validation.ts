import { z } from "zod";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const nonEmptyNameSchema = z.string().trim().min(1).max(120);
const optionalMosqueNameSchema = z.string().trim().max(255).optional();
const optionalLocationTextSchema = z.string().trim().max(255).optional().nullable();
const optionalTimezoneSchema = z.string().trim().min(1).max(64).optional();
const optionalMediaUrlSchema = z.string().trim().max(500).optional().nullable();
const positiveInt = z.coerce.number().int().positive();
const latitudeSchema = z.coerce.number().min(-90).max(90);
const longitudeSchema = z.coerce.number().min(-180).max(180);

const genderSchema = z.enum(["MALE", "FEMALE"]);
const circleTypeSchema = z.enum(["HIFZ", "REVIEW", "HIFZ_REVIEW"]);
const weekdaySchema = z.enum([
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY"
]);
const prayerNameSchema = z.enum(["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"]);
const hhmmSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "صيغة الوقت غير صحيحة");

const circleScheduleRowSchema = z.discriminatedUnion("mode", [
  z
    .object({
      day: weekdaySchema,
      mode: z.literal("CLOCK"),
      fromTime: hhmmSchema,
      toTime: hhmmSchema
    })
    .strict(),
  z
    .object({
      day: weekdaySchema,
      mode: z.literal("PRAYER"),
      fromPrayer: prayerNameSchema,
      toPrayer: prayerNameSchema
    })
    .strict()
]);

const weeklyScheduleSchema = z
  .array(circleScheduleRowSchema)
  .max(7)
  .superRefine((rows, ctx) => {
    const seen = new Set<string>();
    rows.forEach((row, index) => {
      if (seen.has(row.day)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "day"],
          message: "اليوم المكرر غير مسموح"
        });
        return;
      }
      seen.add(row.day);
    });
  });

export const centersQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional()
  })
  .strict();

export const circlesQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional(),
    circleId: z.coerce.number().int().positive().optional(),
    approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional()
  })
  .strict();

export const orgEntityIdParamSchema = idParamSchema.strict();

const centerWriteShape = {
  nameAr: nonEmptyNameSchema.optional(),
  name: nonEmptyNameSchema.optional(), // legacy alias
  gender: genderSchema.optional(),
  logoUrl: optionalMediaUrlSchema,
  mosqueName: optionalMosqueNameSchema,
  locationText: optionalLocationTextSchema,
  latitude: latitudeSchema.optional().nullable(),
  longitude: longitudeSchema.optional().nullable(),
  allowedRadiusMeters: positiveInt.optional().nullable(),
  timezone: optionalTimezoneSchema,
  centerAdminUserId: positiveInt.optional(),
  supervisorUserIds: z.array(positiveInt).max(50).optional(),
  centerAdminSchedule: weeklyScheduleSchema.optional(),
  code: z.string().trim().min(1).max(60).optional() // accepted for backward compatibility, ignored
} satisfies z.ZodRawShape;

const validateGeoFields = (
  value: { latitude?: number | null; longitude?: number | null; allowedRadiusMeters?: number | null },
  ctx: z.RefinementCtx,
  options?: { allowExistingRadius?: boolean }
) => {
  const hasLatitude = value.latitude !== undefined && value.latitude !== null;
  const hasLongitude = value.longitude !== undefined && value.longitude !== null;
  const clearsLatitude = value.latitude === null;
  const clearsLongitude = value.longitude === null;
  const hasRadius = value.allowedRadiusMeters !== undefined && value.allowedRadiusMeters !== null;

  if (hasLatitude !== hasLongitude) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [hasLatitude ? "longitude" : "latitude"],
      message: "\u062e\u0637 \u0627\u0644\u0639\u0631\u0636 \u0648\u062e\u0637 \u0627\u0644\u0637\u0648\u0644 \u064a\u062c\u0628 \u0625\u062f\u062e\u0627\u0644\u0647\u0645\u0627 \u0645\u0639\u0627"
    });
  }

  if (clearsLatitude !== clearsLongitude) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [clearsLatitude ? "longitude" : "latitude"],
      message: "\u064a\u062c\u0628 \u0645\u0633\u062d\u0647\u0645\u0627 \u0645\u0639\u0627"
    });
  }

  if (
    (hasLatitude || hasLongitude) &&
    !hasRadius &&
    (value.allowedRadiusMeters !== undefined || !options?.allowExistingRadius)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["allowedRadiusMeters"],
      message: "\u0646\u0637\u0627\u0642 \u0627\u0644\u0633\u0645\u0627\u062d \u0628\u0627\u0644\u0623\u0645\u062a\u0627\u0631 \u0645\u0637\u0644\u0648\u0628 \u0639\u0646\u062f \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0625\u062d\u062f\u0627\u062b\u064a\u0627\u062a"
    });
  }
};

export const createCenterBodySchema = z
  .object(centerWriteShape)
  .strict()
  .refine((value) => Boolean(value.nameAr ?? value.name), {
    message: "الاسم بالعربية مطلوب"
  })
  .refine((value) => value.gender !== undefined, {
    message: "الجنس مطلوب"
  })
  .refine((value) => value.centerAdminUserId !== undefined, {
    message: "معرف مدير المركز مطلوب"
  })
  .superRefine((value, ctx) => validateGeoFields(value, ctx));

export const updateCenterBodySchema = z
  .object(centerWriteShape)
  .strict()
  .refine(
    (value) =>
      value.nameAr !== undefined ||
      value.name !== undefined ||
      value.gender !== undefined ||
      value.logoUrl !== undefined ||
      value.mosqueName !== undefined ||
      value.locationText !== undefined ||
      value.latitude !== undefined ||
      value.longitude !== undefined ||
      value.allowedRadiusMeters !== undefined ||
      value.timezone !== undefined ||
      value.centerAdminUserId !== undefined ||
      value.supervisorUserIds !== undefined ||
      value.centerAdminSchedule !== undefined ||
      value.code !== undefined,
    {
      message: "حقل واحد على الأقل مطلوب"
    }
  )
  .superRefine((value, ctx) => validateGeoFields(value, ctx, { allowExistingRadius: true }));

export const centerStatusBodySchema = z
  .object({
    isActive: z.boolean()
  })
  .strict();

const circleWriteShape = {
  centerId: positiveInt.optional(),
  nameAr: nonEmptyNameSchema.optional(),
  name: nonEmptyNameSchema.optional(), // legacy alias
  circleType: circleTypeSchema.optional(),
  primaryTeacherUserId: positiveInt.optional(),
  teacherId: positiveInt.optional(), // legacy alias
  mosqueName: optionalMosqueNameSchema,
  locationText: optionalLocationTextSchema,
  latitude: latitudeSchema.optional().nullable(),
  longitude: longitudeSchema.optional().nullable(),
  allowedRadiusMeters: positiveInt.optional().nullable(),
  weeklySchedule: weeklyScheduleSchema.optional()
} satisfies z.ZodRawShape;

export const createCircleBodySchema = z
  .object(circleWriteShape)
  .strict()
  .refine((value) => value.centerId !== undefined, {
    message: "معرف المركز مطلوب"
  })
  .refine((value) => Boolean(value.nameAr ?? value.name), {
    message: "الاسم بالعربية مطلوب"
  })
  .refine((value) => value.circleType !== undefined, {
    message: "نوع الحلقة مطلوب"
  })
  .refine((value) => value.primaryTeacherUserId !== undefined || value.teacherId !== undefined, {
    message: "معرف المعلم الأساسي مطلوب"
  })
  .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined && value.latitude !== null;
    const hasLongitude = value.longitude !== undefined && value.longitude !== null;
    const hasRadius = value.allowedRadiusMeters !== undefined && value.allowedRadiusMeters !== null;

    if (hasLatitude != hasLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasLatitude ? "longitude" : "latitude"],
        message: "خط العرض وخط الطول يجب إدخالهما معاً"
      });
    }

    if ((hasLatitude || hasLongitude) && !hasRadius) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedRadiusMeters"],
        message: "نطاق السماح (بالأمتار) مطلوب عند إدخال خط العرض/الطول"
      });
    }
  });

export const updateCircleBodySchema = z
  .object(circleWriteShape)
  .strict()
  .refine(
    (value) =>
      value.nameAr !== undefined ||
      value.name !== undefined ||
      value.circleType !== undefined ||
      value.primaryTeacherUserId !== undefined ||
      value.teacherId !== undefined ||
      value.mosqueName !== undefined ||
      value.locationText !== undefined ||
      value.latitude !== undefined ||
      value.longitude !== undefined ||
      value.allowedRadiusMeters !== undefined ||
      value.weeklySchedule !== undefined,
    {
      message: "حقل واحد على الأقل مطلوب"
    }
  )
  .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined && value.latitude !== null;
    const hasLongitude = value.longitude !== undefined && value.longitude !== null;
    const clearsLatitude = value.latitude === null;
    const clearsLongitude = value.longitude === null;
    const hasRadius = value.allowedRadiusMeters !== undefined && value.allowedRadiusMeters !== null;

    if (hasLatitude != hasLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasLatitude ? "longitude" : "latitude"],
        message: "خط العرض وخط الطول يجب إدخالهما معاً"
      });
    }

    if (clearsLatitude != clearsLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [clearsLatitude ? "longitude" : "latitude"],
        message: "يجب مسحهما معاً"
      });
    }

    if ((hasLatitude || hasLongitude) && !hasRadius && value.allowedRadiusMeters === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedRadiusMeters"],
        message: "نطاق السماح (بالأمتار) مطلوب عند تحديث خط العرض/الطول"
      });
    }
  }
  );

export const updateCircleApprovalStatusBodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"])
}).strict();

export const circleStatusBodySchema = centerStatusBodySchema;

export const orgBrandingUpdateBodySchema = z
  .object({
    name: nonEmptyNameSchema.optional(),
    logoUrl: optionalMediaUrlSchema,
    description: z.string().trim().max(500).optional().nullable(),
    address: z.string().trim().max(255).optional().nullable(),
    phone: z.string().trim().max(32).optional().nullable(),
    email: z.union([z.string().trim().email("البريد الإلكتروني غير صالح"), z.literal("")]).optional().nullable(),
    associationLocationName: z.string().trim().max(255).optional().nullable(),
    associationAddress: z.string().trim().max(255).optional().nullable(),
    associationLatitude: latitudeSchema.optional().nullable(),
    associationLongitude: longitudeSchema.optional().nullable(),
    associationGeoRadiusMeters: positiveInt.optional().nullable()
  })
  .strict()
  .refine(
    (value) =>
      value.name !== undefined ||
      value.logoUrl !== undefined ||
      value.description !== undefined ||
      value.address !== undefined ||
      value.phone !== undefined ||
      value.email !== undefined ||
      value.associationLocationName !== undefined ||
      value.associationAddress !== undefined ||
      value.associationLatitude !== undefined ||
      value.associationLongitude !== undefined ||
      value.associationGeoRadiusMeters !== undefined,
    {
      message: "حقل واحد على الأقل مطلوب"
    }
  );

// ==========================================
// DTO Types inferred from Zod Schemas
// ==========================================
export type CentersQueryDto = z.infer<typeof centersQuerySchema>;
export type CirclesQueryDto = z.infer<typeof circlesQuerySchema>;
export type CreateCenterDto = z.infer<typeof createCenterBodySchema>;
export type UpdateCenterDto = z.infer<typeof updateCenterBodySchema>;
export type CenterStatusDto = z.infer<typeof centerStatusBodySchema>;
export type CreateCircleDto = z.infer<typeof createCircleBodySchema>;
export type UpdateCircleDto = z.infer<typeof updateCircleBodySchema>;
export type CircleStatusDto = z.infer<typeof circleStatusBodySchema>;
export type OrgBrandingUpdateDto = z.infer<typeof orgBrandingUpdateBodySchema>;
export type UpdateCircleApprovalStatusDto = z.infer<typeof updateCircleApprovalStatusBodySchema>;
