import { MonthlyPlanStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { getSurahAyahCount } from "../../shared/quran/surah-ayah-counts";
import { quranService } from "../quran/quran.service";
import type { ScopeContext } from "../../shared/types/auth.types";
import { monthlyPlansRepository } from "./monthly-plans.repository";
import {
  assertMonthlyPlanRangeValid
} from "./monthly-plans.validation";
import type {
  GenerateMonthlyPlansDto,
  ListMonthlyPlansDto,
  UpdateMonthlyPlanDto,
  UpdateReviewSettingsDto
} from "./monthly-plans.validation";

const WORKING_DAYS_PER_MONTH = 22;
const DEFAULT_HIFZ_DAILY_RATE = 0.5;
const REVIEW_REPETITIONS_PER_MONTH = 2;

const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

const nextAyahAfter = (
  surah: number | null | undefined,
  ayah: number | null | undefined
): { surah: number | null; ayah: number | null } => {
  if (!surah || !ayah) {
    return { surah: null, ayah: null };
  }

  const maxAyahs = getSurahAyahCount(surah);
  if (!maxAyahs) {
    return { surah: null, ayah: null };
  }

  if (ayah < maxAyahs) {
    return { surah, ayah: ayah + 1 };
  }

  if (surah >= 114) {
    return { surah: null, ayah: null };
  }

  return { surah: surah + 1, ayah: 1 };
};

const normalizePagesSample = (value: number): number => {
  const normalized = Math.round(value * 2) / 2;
  return Math.max(DEFAULT_HIFZ_DAILY_RATE, normalized);
};

const pickDominantDailyPages = (samples: number[], fallback: number): number => {
  if (!samples.length) {
    return normalizePagesSample(fallback);
  }

  const normalizedFallback = normalizePagesSample(fallback);
  const counts = new Map<number, number>();

  for (const sample of samples) {
    if (!Number.isFinite(sample) || sample <= 0) {
      continue;
    }

    const normalized = normalizePagesSample(sample);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  if (!counts.size) {
    return normalizedFallback;
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      const distanceA = Math.abs(a[0] - normalizedFallback);
      const distanceB = Math.abs(b[0] - normalizedFallback);
      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }

      return b[0] - a[0];
    })[0][0];
};

type PlanWithStudent = {
  id: number;
  studentId: number;
  circleId: number;
  teacherId: number;
  month: number;
  year: number;
  hifzFromSurah: number | null;
  hifzFromAyah: number | null;
  hifzToSurah: number | null;
  hifzToAyah: number | null;
  hifzTargetPages: unknown;
  hifzDailyRate: unknown;
  reviewFromSurah: number | null;
  reviewFromAyah: number | null;
  reviewToSurah: number | null;
  reviewToAyah: number | null;
  reviewTargetPages: unknown;
  reviewDailyRate: unknown;
  status: string;
  approvedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: number;
    fullName: string;
    studentProfile: { level: string; currentJuzz: number | null } | null;
    profile: { fullName: string } | null;
  };
};

type PlanProgressSummary = {
  hifzExecutedPages: number;
  reviewExecutedPages: number;
  hifzCompletionRate: number;
  reviewCompletionRate: number;
  memorizedPages: number | null;
  latestReached: {
    surah: string | null;
    toSurah: number;
    toAyah: number;
    toPage: number | null;
  } | null;
  attendance: {
    presentDays: number;
    totalDays: number;
  };
};

const emptyPlanProgress: PlanProgressSummary = {
  hifzExecutedPages: 0,
  reviewExecutedPages: 0,
  hifzCompletionRate: 0,
  reviewCompletionRate: 0,
  memorizedPages: null,
  latestReached: null,
  attendance: {
    presentDays: 0,
    totalDays: 0
  }
};

const serializePlan = (plan: PlanWithStudent, progress: PlanProgressSummary = emptyPlanProgress) => ({
  id: plan.id,
  studentId: plan.studentId,
  circleId: plan.circleId,
  teacherId: plan.teacherId,
  month: plan.month,
  year: plan.year,
  status: plan.status,
  approvedAt: plan.approvedAt?.toISOString() ?? null,
  notes: plan.notes,
  hifz: {
    fromSurah: plan.hifzFromSurah,
    fromAyah: plan.hifzFromAyah,
    toSurah: plan.hifzToSurah,
    toAyah: plan.hifzToAyah,
    targetPages: plan.hifzTargetPages !== null ? Number(plan.hifzTargetPages) : null,
    dailyRate: plan.hifzDailyRate !== null ? Number(plan.hifzDailyRate) : null
  },
  review: {
    fromSurah: plan.reviewFromSurah,
    fromAyah: plan.reviewFromAyah,
    toSurah: plan.reviewToSurah,
    toAyah: plan.reviewToAyah,
    targetPages: plan.reviewTargetPages !== null ? Number(plan.reviewTargetPages) : null,
    dailyRate: plan.reviewDailyRate !== null ? Number(plan.reviewDailyRate) : null
  },
  student: plan.student
    ? {
        id: plan.student.id,
        fullName: plan.student.profile?.fullName ?? plan.student.fullName,
        level: plan.student.studentProfile?.level ?? null,
        currentJuzz: plan.student.studentProfile?.currentJuzz ?? null
      }
    : undefined,
  progress,
  createdAt: plan.createdAt.toISOString(),
  updatedAt: plan.updatedAt.toISOString()
});

const ensureCircleAccess = async (scope: ScopeContext, circleId: number) => {
  const circle = await monthlyPlansRepository.findCircleWithCenter(
    circleId,
    scope.organizationId
  );

  if (!circle) {
    throw new AppError("Circle not found", 404);
  }

  if (!scope.allAccess) {
    const hasAccess = scope.circleIds.includes(circleId) || scope.centerIds.includes(circle.centerId);
    if (!hasAccess) {
      throw new AppError("Access denied", 403);
    }
  }

  return circle;
};

const buildPlanProgress = async (
  plan: PlanWithStudent,
  periodStart: Date,
  periodEnd: Date
): Promise<PlanProgressSummary> => {
  const [progress, attendance] = await Promise.all([
    monthlyPlansRepository.summarizeMonthlyProgress(plan.studentId, plan.circleId, periodStart, periodEnd),
    monthlyPlansRepository.summarizeAttendance(plan.studentId, plan.circleId, periodStart, periodEnd)
  ]);

  const hifzTargetPages = plan.hifzTargetPages !== null ? Number(plan.hifzTargetPages) : 0;
  const reviewTargetPages = plan.reviewTargetPages !== null ? Number(plan.reviewTargetPages) : 0;
  const latestReached =
    progress.latestHifz?.toSurah && progress.latestHifz?.toAyah
      ? {
          surah: progress.latestHifz.surah,
          toSurah: progress.latestHifz.toSurah,
          toAyah: progress.latestHifz.toAyah,
          toPage: progress.latestHifz.toPage ?? null
        }
      : null;

  return {
    hifzExecutedPages: round2(progress.hifzPages),
    reviewExecutedPages: round2(progress.reviewPages),
    hifzCompletionRate:
      hifzTargetPages > 0 ? round2((progress.hifzPages / hifzTargetPages) * 100) : 0,
    reviewCompletionRate:
      reviewTargetPages > 0 ? round2((progress.reviewPages / reviewTargetPages) * 100) : 0,
    memorizedPages: progress.latestHifz?.toPage ?? null,
    latestReached,
    attendance: {
      presentDays: attendance.present,
      totalDays: attendance.total
    }
  };
};

const buildGeneratedPlan = async (input: {
  organizationId: number;
  centerId: number;
  circleId: number;
  studentId: number;
  teacherId: number;
  month: number;
  year: number;
  planStartDate: Date;
  prevMonthStart: Date;
  prevMonthEnd: Date;
}) => {
  const existing = await monthlyPlansRepository.findPlanByStudentMonth({
    organizationId: input.organizationId,
    studentId: input.studentId,
    circleId: input.circleId,
    month: input.month,
    year: input.year
  });

  if (
    existing &&
    (existing.status === MonthlyPlanStatus.MODIFIED ||
      existing.status === MonthlyPlanStatus.APPROVED)
  ) {
    return { plan: existing, preserved: true } as const;
  }

  const [lastHifz, hifzStats, attendanceDays] = await Promise.all([
    monthlyPlansRepository.findLastHifzFollowUp(
      input.studentId,
      input.circleId,
      input.planStartDate
    ),
    monthlyPlansRepository.calcMonthlyHifzStats(
      input.studentId,
      input.circleId,
      input.prevMonthStart,
      input.prevMonthEnd
    ),
    monthlyPlansRepository.countAttendanceDays(
      input.studentId,
      input.circleId,
      input.prevMonthStart,
      input.prevMonthEnd
    )
  ]);

  const fallbackDailyRate =
    attendanceDays > 0
      ? hifzStats.totalPages / attendanceDays
      : hifzStats.dailyRate > 0
        ? hifzStats.dailyRate
        : DEFAULT_HIFZ_DAILY_RATE;
  const hifzDailyRate = pickDominantDailyPages(hifzStats.pageSamples, fallbackDailyRate);
  const hifzTargetPages = round1(hifzDailyRate * WORKING_DAYS_PER_MONTH);
  const nextHifzStart = nextAyahAfter(lastHifz?.toSurah, lastHifz?.toAyah);
  const generatedHifzStart =
    nextHifzStart.surah && nextHifzStart.ayah
      ? nextHifzStart
      : lastHifz
        ? { surah: null, ayah: null }
        : { surah: 1, ayah: 1 };

  let generatedHifzRange:
    | {
        fromSurah: number;
        fromAyah: number;
        toSurah: number;
        toAyah: number;
        pagesCount: number;
      }
    | null = null;

  if (generatedHifzStart.surah && generatedHifzStart.ayah && hifzTargetPages > 0) {
    try {
      generatedHifzRange = await quranService.resolveRangeByTargetPages({
        fromSurah: generatedHifzStart.surah,
        fromAyah: generatedHifzStart.ayah,
        targetPages: hifzTargetPages
      });
    } catch {
      generatedHifzRange = null;
    }
  }

  const reviewTargetPages = generatedHifzRange
    ? round1(generatedHifzRange.pagesCount * REVIEW_REPETITIONS_PER_MONTH)
    : 0;
  const reviewDailyRate =
    reviewTargetPages > 0 ? round2(reviewTargetPages / WORKING_DAYS_PER_MONTH) : 0;

  const plan = await monthlyPlansRepository.upsertPlan({
    organizationId: input.organizationId,
    centerId: input.centerId,
    circleId: input.circleId,
    studentId: input.studentId,
    teacherId: input.teacherId,
    month: input.month,
    year: input.year,
    hifzFromSurah: generatedHifzRange?.fromSurah ?? generatedHifzStart.surah,
    hifzFromAyah: generatedHifzRange?.fromAyah ?? generatedHifzStart.ayah,
    hifzToSurah: generatedHifzRange?.toSurah ?? null,
    hifzToAyah: generatedHifzRange?.toAyah ?? null,
    hifzTargetPages,
    hifzDailyRate: round2(hifzDailyRate),
    reviewFromSurah: generatedHifzRange?.fromSurah ?? null,
    reviewFromAyah: generatedHifzRange?.fromAyah ?? null,
    reviewToSurah: generatedHifzRange?.toSurah ?? null,
    reviewToAyah: generatedHifzRange?.toAyah ?? null,
    reviewTargetPages: round1(reviewTargetPages),
    reviewDailyRate
  });

  return { plan, preserved: false } as const;
};

export const monthlyPlansService = {
  async generate(scope: ScopeContext, input: GenerateMonthlyPlansDto) {
    const circle = await ensureCircleAccess(scope, input.circleId);
    const students = await monthlyPlansRepository.findActiveStudents(input.circleId);

    if (!students.length) {
      throw new AppError("لا يوجد طلاب نشطون في هذه الحلقة", 400);
    }

    const planStartDate = new Date(input.year, input.month - 1, 1);
    const prevMonthEnd = new Date(input.year, input.month - 1, 0);
    const prevMonthStart = new Date(input.year, input.month - 2, 1);
    const periodStart = new Date(input.year, input.month - 1, 1);
    const periodEnd = new Date(input.year, input.month, 0, 23, 59, 59, 999);

    const plans: Array<ReturnType<typeof serializePlan>> = [];
    let generated = 0;
    let preserved = 0;

    for (const enrollment of students) {
      const result = await buildGeneratedPlan({
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        circleId: input.circleId,
        studentId: enrollment.studentId,
        teacherId: scope.userId,
        month: input.month,
        year: input.year,
        planStartDate,
        prevMonthStart,
        prevMonthEnd
      });

      if (result.preserved) {
        preserved += 1;
      } else {
        generated += 1;
      }

      plans.push(
        serializePlan(
          result.plan as PlanWithStudent,
          await buildPlanProgress(result.plan as PlanWithStudent, periodStart, periodEnd)
        )
      );
    }

    return {
      generated,
      preserved,
      month: input.month,
      year: input.year,
      circleId: input.circleId,
      plans
    };
  },

  async list(scope: ScopeContext, query: ListMonthlyPlansDto) {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();

    let circleIds: number[] = [];

    if (query.circleId) {
      await ensureCircleAccess(scope, query.circleId);
      circleIds = [query.circleId];
    } else if (!scope.allAccess) {
      circleIds = scope.circleIds;
    }

    const where = {
      organizationId: scope.organizationId,
      month,
      year,
      ...(circleIds.length ? { circleId: { in: circleIds } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(scope.role === "TEACHER" ? { teacherId: scope.userId } : {})
    };

    const plans = await monthlyPlansRepository.listPlans(where);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const summary = {
      total: plans.length,
      approved: plans.filter((p) => p.status === MonthlyPlanStatus.APPROVED).length,
      pending: plans.filter((p) => p.status === MonthlyPlanStatus.PENDING).length,
      modified: plans.filter((p) => p.status === MonthlyPlanStatus.MODIFIED).length
    };

    const serializedPlans = await Promise.all(
      plans.map(async (plan) =>
        serializePlan(
          plan as PlanWithStudent,
          await buildPlanProgress(plan as PlanWithStudent, periodStart, periodEnd)
        )
      )
    );

    return { plans: serializedPlans, summary, month, year };
  },

  async getById(scope: ScopeContext, id: number) {
    const plan = await monthlyPlansRepository.findPlanById(id, scope.organizationId);
    if (!plan) {
      throw new AppError("Plan not found", 404);
    }
    const periodStart = new Date(plan.year, plan.month - 1, 1);
    const periodEnd = new Date(plan.year, plan.month, 0, 23, 59, 59, 999);
    return serializePlan(
      plan as PlanWithStudent,
      await buildPlanProgress(plan as PlanWithStudent, periodStart, periodEnd)
    );
  },

  async update(scope: ScopeContext, id: number, input: UpdateMonthlyPlanDto) {
    const plan = await monthlyPlansRepository.findPlanById(id, scope.organizationId);
    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    if (plan.status === MonthlyPlanStatus.APPROVED) {
      throw new AppError("لا يمكن تعديل خطة تم اعتمادها", 409);
    }

    // Validate ayah bounds per surah and range order
    assertMonthlyPlanRangeValid(input);

    // Auto-calculate page counts when a full Quran range is provided
    let hifzTargetPages = input.hifzTargetPages;
    let hifzDailyRate = input.hifzDailyRate;
    let reviewTargetPages = input.reviewTargetPages;
    let reviewDailyRate = input.reviewDailyRate;

    if (
      input.hifzFromSurah !== undefined &&
      input.hifzFromAyah !== undefined &&
      input.hifzToSurah !== undefined &&
      input.hifzToAyah !== undefined &&
      hifzTargetPages === undefined
    ) {
      try {
        const calc = await quranService.calculateRange({
          fromSurah: input.hifzFromSurah,
          fromAyah: input.hifzFromAyah,
          toSurah: input.hifzToSurah,
          toAyah: input.hifzToAyah
        });
        hifzTargetPages = calc.pagesCount;
        hifzDailyRate = round2(calc.pagesCount / WORKING_DAYS_PER_MONTH);
      } catch {
        // Provider unavailable – keep manual value if provided, else leave unchanged
      }
    }

    if (
      input.reviewFromSurah !== undefined &&
      input.reviewFromAyah !== undefined &&
      input.reviewToSurah !== undefined &&
      input.reviewToAyah !== undefined &&
      reviewTargetPages === undefined
    ) {
      try {
        const calc = await quranService.calculateRange({
          fromSurah: input.reviewFromSurah,
          fromAyah: input.reviewFromAyah,
          toSurah: input.reviewToSurah,
          toAyah: input.reviewToAyah
        });
        reviewTargetPages = calc.pagesCount;
        reviewDailyRate = round2(calc.pagesCount / WORKING_DAYS_PER_MONTH);
      } catch {
        // Provider unavailable – keep manual value if provided, else leave unchanged
      }
    }

    await monthlyPlansRepository.updatePlan(id, {
      hifzFromSurah: input.hifzFromSurah ?? undefined,
      hifzFromAyah: input.hifzFromAyah ?? undefined,
      hifzToSurah: input.hifzToSurah ?? undefined,
      hifzToAyah: input.hifzToAyah ?? undefined,
      hifzTargetPages: hifzTargetPages ?? undefined,
      hifzDailyRate: hifzDailyRate ?? undefined,
      reviewFromSurah: input.reviewFromSurah ?? undefined,
      reviewFromAyah: input.reviewFromAyah ?? undefined,
      reviewToSurah: input.reviewToSurah ?? undefined,
      reviewToAyah: input.reviewToAyah ?? undefined,
      reviewTargetPages: reviewTargetPages ?? undefined,
      reviewDailyRate: reviewDailyRate ?? undefined,
      notes: input.notes ?? undefined,
      status: MonthlyPlanStatus.MODIFIED
    });

    const reloadedPlan = await monthlyPlansRepository.findPlanById(id, scope.organizationId);
    if (!reloadedPlan) {
      throw new AppError("Plan not found", 404);
    }

    const periodStart = new Date(reloadedPlan.year, reloadedPlan.month - 1, 1);
    const periodEnd = new Date(reloadedPlan.year, reloadedPlan.month, 0, 23, 59, 59, 999);
    return serializePlan(
      reloadedPlan as PlanWithStudent,
      await buildPlanProgress(reloadedPlan as PlanWithStudent, periodStart, periodEnd)
    );
  },

  async approve(scope: ScopeContext, id: number) {
    const plan = await monthlyPlansRepository.findPlanById(id, scope.organizationId);
    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    if (plan.status === MonthlyPlanStatus.APPROVED) {
      const periodStart = new Date(plan.year, plan.month - 1, 1);
      const periodEnd = new Date(plan.year, plan.month, 0, 23, 59, 59, 999);
      return serializePlan(
        plan as PlanWithStudent,
        await buildPlanProgress(plan as PlanWithStudent, periodStart, periodEnd)
      );
    }

    await monthlyPlansRepository.approvePlan(id);
    const reloadedPlan = await monthlyPlansRepository.findPlanById(id, scope.organizationId);
    if (!reloadedPlan) {
      throw new AppError("Plan not found", 404);
    }

    const periodStart = new Date(reloadedPlan.year, reloadedPlan.month - 1, 1);
    const periodEnd = new Date(reloadedPlan.year, reloadedPlan.month, 0, 23, 59, 59, 999);
    return serializePlan(
      reloadedPlan as PlanWithStudent,
      await buildPlanProgress(reloadedPlan as PlanWithStudent, periodStart, periodEnd)
    );
  },

  async approveAll(scope: ScopeContext, circleId: number, month: number, year: number) {
    await ensureCircleAccess(scope, circleId);
    const result = await monthlyPlansRepository.approveAllInCircle(circleId, month, year);
    return { approved: result.count };
  },

  async updateReviewSettings(scope: ScopeContext, input: UpdateReviewSettingsDto) {
    const updated = await monthlyPlansRepository.upsertReviewSettings({
      organizationId: scope.organizationId,
      teacherId: scope.userId,
      circleId: input.circleId,
      juzThreshold5: input.juzThreshold5,
      juzThreshold10: input.juzThreshold10,
      juzThreshold20: input.juzThreshold20,
      juzThreshold30: input.juzThreshold30
    });
    return updated;
  },

  async getReviewSettings(scope: ScopeContext, circleId?: number) {
    const settings = await monthlyPlansRepository.findReviewSettings(
      scope.userId,
      circleId ?? 0,
      scope.organizationId
    );

    return (
      settings ?? {
        juzThreshold5: 10,
        juzThreshold10: 15,
        juzThreshold20: 20,
        juzThreshold30: 30
      }
    );
  }
};
