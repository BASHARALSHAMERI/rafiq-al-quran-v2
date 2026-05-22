import { z } from "zod";
import { MonthlyPlanStatus } from "@prisma/client";
import { getSurahAyahCount } from "../../shared/quran/surah-ayah-counts";
import { AppError } from "../../shared/errors/app-error";

export const generateMonthlyPlansSchema = z
  .object({
    circleId: z.coerce.number().int().positive(),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2020).max(2100)
  })
  .strict();

export const listMonthlyPlansSchema = z
  .object({
    circleId: z.coerce.number().int().positive().optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    status: z.nativeEnum(MonthlyPlanStatus).optional()
  })
  .strict();

export const updateMonthlyPlanSchema = z
  .object({
    hifzFromSurah: z.number().int().min(1).max(114).optional(),
    hifzFromAyah: z.number().int().min(1).optional(),
    hifzToSurah: z.number().int().min(1).max(114).optional(),
    hifzToAyah: z.number().int().min(1).optional(),
    hifzTargetPages: z.number().min(0).optional(),
    hifzDailyRate: z.number().min(0).optional(),
    reviewFromSurah: z.number().int().min(1).max(114).optional(),
    reviewFromAyah: z.number().int().min(1).optional(),
    reviewToSurah: z.number().int().min(1).max(114).optional(),
    reviewToAyah: z.number().int().min(1).optional(),
    reviewTargetPages: z.number().min(0).optional(),
    reviewDailyRate: z.number().min(0).optional(),
    notes: z.string().trim().max(500).optional().nullable()
  })
  .strict();

/**
 * Validates that ayah numbers respect the surah's actual ayah count,
 * and that range order is correct (from ≤ to).
 */
export const assertMonthlyPlanRangeValid = (input: UpdateMonthlyPlanDto): void => {
  const checkAyah = (surahNum: number | undefined, ayahNum: number | undefined, label: string) => {
    if (surahNum === undefined || ayahNum === undefined) return;
    const maxAyahs = getSurahAyahCount(surahNum);
    if (maxAyahs === 0) {
      throw new AppError(`${label}: رقم السورة غير صحيح`, 422, undefined, "VALIDATION_FAILED");
    }
    if (ayahNum > maxAyahs) {
      throw new AppError(
        `${label}: رقم الآية ${ayahNum} يتجاوز عدد آيات السورة (${maxAyahs})`,
        422,
        undefined,
        "VALIDATION_FAILED"
      );
    }
  };

  const checkOrder = (
    fromSurah: number | undefined,
    fromAyah: number | undefined,
    toSurah: number | undefined,
    toAyah: number | undefined,
    label: string
  ) => {
    if (!fromSurah || !toSurah) return;
    const isOrdered =
      fromSurah < toSurah || (fromSurah === toSurah && (fromAyah ?? 1) <= (toAyah ?? 1));
    if (!isOrdered) {
      throw new AppError(
        `${label}: نطاق السورة من→إلى غير صحيح`,
        422,
        undefined,
        "VALIDATION_FAILED"
      );
    }
  };

  // Hifz segment
  checkAyah(input.hifzFromSurah, input.hifzFromAyah, "الحفظ (من آية)");
  checkAyah(input.hifzToSurah, input.hifzToAyah, "الحفظ (إلى آية)");
  checkOrder(input.hifzFromSurah, input.hifzFromAyah, input.hifzToSurah, input.hifzToAyah, "خطة الحفظ");

  // Review segment
  checkAyah(input.reviewFromSurah, input.reviewFromAyah, "المراجعة (من آية)");
  checkAyah(input.reviewToSurah, input.reviewToAyah, "المراجعة (إلى آية)");
  checkOrder(input.reviewFromSurah, input.reviewFromAyah, input.reviewToSurah, input.reviewToAyah, "خطة المراجعة");
};

export const updateReviewSettingsSchema = z
  .object({
    circleId: z.coerce.number().int().positive().optional(),
    juzThreshold5: z.number().min(0).max(60),
    juzThreshold10: z.number().min(0).max(60),
    juzThreshold20: z.number().min(0).max(60),
    juzThreshold30: z.number().min(0).max(60)
  })
  .strict();

export type GenerateMonthlyPlansDto = z.infer<typeof generateMonthlyPlansSchema>;
export type ListMonthlyPlansDto = z.infer<typeof listMonthlyPlansSchema>;
export type UpdateMonthlyPlanDto = z.infer<typeof updateMonthlyPlanSchema>;
export type UpdateReviewSettingsDto = z.infer<typeof updateReviewSettingsSchema>;
