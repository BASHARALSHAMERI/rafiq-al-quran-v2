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
const hhmmSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format");

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
          message: "Duplicate day is not allowed"
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
    circleId: z.coerce.number().int().positive().optional()
  })
  .strict();

export const orgEntityIdParamSchema = idParamSchema.strict();

const centerWriteShape = {
  nameAr: nonEmptyNameSchema.optional(),
  name: nonEmptyNameSchema.optional(), // legacy alias
  gender: genderSchema.optional(),
  logoUrl: optionalMediaUrlSchema,
  mosqueName: optionalMosqueNameSchema,
  timezone: optionalTimezoneSchema,
  centerAdminUserId: positiveInt.optional(),
  supervisorUserIds: z.array(positiveInt).max(50).optional(),
  centerAdminSchedule: weeklyScheduleSchema.optional(),
  code: z.string().trim().min(1).max(60).optional() // accepted for backward compatibility, ignored
} satisfies z.ZodRawShape;

export const createCenterBodySchema = z
  .object(centerWriteShape)
  .strict()
  .refine((value) => Boolean(value.nameAr ?? value.name), {
    message: "nameAr is required"
  })
  .refine((value) => value.gender !== undefined, {
    message: "gender is required"
  })
  .refine((value) => value.centerAdminUserId !== undefined, {
    message: "centerAdminUserId is required"
  });

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
      value.timezone !== undefined ||
      value.centerAdminUserId !== undefined ||
      value.supervisorUserIds !== undefined ||
      value.centerAdminSchedule !== undefined ||
      value.code !== undefined,
    {
      message: "At least one field is required"
    }
  );

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
    message: "centerId is required"
  })
  .refine((value) => Boolean(value.nameAr ?? value.name), {
    message: "nameAr is required"
  })
  .refine((value) => value.circleType !== undefined, {
    message: "circleType is required"
  })
  .refine((value) => value.primaryTeacherUserId !== undefined || value.teacherId !== undefined, {
    message: "primaryTeacherUserId is required"
  })
  .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined && value.latitude !== null;
    const hasLongitude = value.longitude !== undefined && value.longitude !== null;
    const hasRadius = value.allowedRadiusMeters !== undefined && value.allowedRadiusMeters !== null;

    if (hasLatitude != hasLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasLatitude ? "longitude" : "latitude"],
        message: "latitude and longitude must be provided together"
      });
    }

    if ((hasLatitude || hasLongitude) && !hasRadius) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedRadiusMeters"],
        message: "allowedRadiusMeters is required when latitude/longitude are provided"
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
      message: "At least one field is required"
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
        message: "latitude and longitude must be provided together"
      });
    }

    if (clearsLatitude != clearsLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [clearsLatitude ? "longitude" : "latitude"],
        message: "latitude and longitude must be cleared together"
      });
    }

    if ((hasLatitude || hasLongitude) && !hasRadius && value.allowedRadiusMeters === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedRadiusMeters"],
        message: "allowedRadiusMeters is required when updating latitude/longitude"
      });
    }
  }
  );

export const circleStatusBodySchema = centerStatusBodySchema;

export const orgBrandingUpdateBodySchema = z
  .object({
    name: nonEmptyNameSchema.optional(),
    logoUrl: optionalMediaUrlSchema
  })
  .strict()
  .refine((value) => value.name !== undefined || value.logoUrl !== undefined, {
    message: "At least one field is required"
  });

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
