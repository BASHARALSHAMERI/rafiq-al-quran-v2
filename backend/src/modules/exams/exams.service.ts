import {
  AttemptStatus,
  Prisma,
  Role,
  type ExamStatus,
  type ExamType
} from "@prisma/client";
import { AuditAction, AuditEntityType, ExamPurpose, ExamQuestionSource } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { auditLogger } from "../../shared/audit/audit-log";
import { AppError } from "../../shared/errors/app-error";
import { editLockPolicy } from "../../shared/policies/edit-lock.policy";
import { SURAH_AYAH_COUNTS, getSurahAyahCount } from "../../shared/quran/surah-ayah-counts";
import type { ScopeContext } from "../../shared/types/auth.types";
import { notificationsRepository } from "../notifications/notifications.repository";
import { quranService } from "../quran/quran.service";
import { examsDomain } from "./exams.domain";
import { examsRepository } from "./exams.repository";
import { createGradeScalesService } from "./grade-scales.service";

type ListExamsQuery = {
  centerId?: number;
  circleId?: number;
  purpose?: ExamPurpose;
  status?: ExamStatus;
  from?: string;
  to?: string;
};

type ListQuestionBankQuery = {
  fromSurah?: number;
  toSurah?: number;
  difficultyLevel?: number;
  source?: ExamQuestionSource;
  search?: string;
};

type CreateQuestionBankItemInput = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  pageNumber: number;
  lineCount: number;
  difficultyLevel: number;
  suggestedText?: string;
};

type GenerateQuestionBankInput = {
  fromSurah: number;
  toSurah: number;
  count?: number;
  pageNumber?: number;
  lineCount?: number;
  difficultyLevel?: number;
  suggestedTextPrefix?: string;
};

type ExamCriteriaInput = {
  memorizationScore: number;
  tajweedScore: number;
  theoreticalTajweedScore: number;
  performanceScore: number;
  promptingPenalty: number;
  remindingPenalty: number;
  tajweedPenalty: number;
  minQuestionCount: number;
  defaultQuestionCount: number;
  maxQuestionCount: number;
};

type CreateExamInput = {
  title: string;
  type: ExamType;
  examBranch?: string | null;
  purpose?: ExamPurpose;
  maxScore: number;
  passScore: number;
  criteria?: ExamCriteriaInput;
};

type UpdateExamInput = {
  title?: string;
  type?: ExamType;
  examBranch?: string | null;
  purpose?: ExamPurpose;
  maxScore?: number;
  passScore?: number;
  criteria?: ExamCriteriaInput;
};

type CreateAttemptInput = {
  studentId: number;
  circleId: number;
  examDate: string;
  fullQuranCompletedAt?: string | null;
  committeeMemberIds: number[];
};

type UpdateAttemptCommitteeInput = {
  examDate?: string;
  fullQuranCompletedAt?: string | null;
  committeeMemberIds?: number[];
  lockVersion?: number;
};

type GenerateAttemptQuestionsInput = {
  count?: number;
};

type CreateAttemptQuestionInput = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
};

type ScoreAttemptInput = {
  memorizationScore: number;
  tajweedScore: number;
  theoreticalTajweedScore: number;
  performanceScore: number;
  promptingDeductions: number;
  remindingDeductions: number;
  tajweedDeductions: number;
  committeeNotes?: string;
  strengthNotes?: string;
  weaknessNotes?: string;
  questions?: Array<{
    id: number;
    promptingDeductions: number;
    remindingDeductions: number;
    tajweedDeductions: number;
    isEvaluated: boolean;
  }>;
};

type QuestionRange = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
};

type JuzBoundary = QuestionRange;
type QuestionCountPolicy = {
  minQuestionCount: number;
  defaultQuestionCount: number;
  maxQuestionCount: number;
};

const gradeScalesService = createGradeScalesService(prisma);
const DEFAULT_QUESTION_COUNT_POLICY: QuestionCountPolicy = {
  minQuestionCount: 1,
  defaultQuestionCount: 5,
  maxQuestionCount: 10
};

const JUZ_BRANCH_LABELS = [
  "الجزء الأول",
  "الجزء الثاني",
  "الجزء الثالث",
  "الجزء الرابع",
  "الجزء الخامس",
  "الجزء السادس",
  "الجزء السابع",
  "الجزء الثامن",
  "الجزء التاسع",
  "الجزء العاشر",
  "الجزء الحادي عشر",
  "الجزء الثاني عشر",
  "الجزء الثالث عشر",
  "الجزء الرابع عشر",
  "الجزء الخامس عشر",
  "الجزء السادس عشر",
  "الجزء السابع عشر",
  "الجزء الثامن عشر",
  "الجزء التاسع عشر",
  "الجزء العشرون",
  "الجزء الحادي والعشرون",
  "الجزء الثاني والعشرون",
  "الجزء الثالث والعشرون",
  "الجزء الرابع والعشرون",
  "الجزء الخامس والعشرون",
  "الجزء السادس والعشرون",
  "الجزء السابع والعشرون",
  "الجزء الثامن والعشرون",
  "الجزء التاسع والعشرون",
  "الجزء الثلاثون"
] as const;

const JUZ_BOUNDARIES: JuzBoundary[] = [
  { fromSurah: 1, fromAyah: 1, toSurah: 2, toAyah: 141 },
  { fromSurah: 2, fromAyah: 142, toSurah: 2, toAyah: 252 },
  { fromSurah: 2, fromAyah: 253, toSurah: 3, toAyah: 92 },
  { fromSurah: 3, fromAyah: 93, toSurah: 4, toAyah: 23 },
  { fromSurah: 4, fromAyah: 24, toSurah: 4, toAyah: 147 },
  { fromSurah: 4, fromAyah: 148, toSurah: 5, toAyah: 81 },
  { fromSurah: 5, fromAyah: 82, toSurah: 6, toAyah: 110 },
  { fromSurah: 6, fromAyah: 111, toSurah: 7, toAyah: 87 },
  { fromSurah: 7, fromAyah: 88, toSurah: 8, toAyah: 40 },
  { fromSurah: 8, fromAyah: 41, toSurah: 9, toAyah: 92 },
  { fromSurah: 9, fromAyah: 93, toSurah: 11, toAyah: 5 },
  { fromSurah: 11, fromAyah: 6, toSurah: 12, toAyah: 52 },
  { fromSurah: 12, fromAyah: 53, toSurah: 14, toAyah: 52 },
  { fromSurah: 15, fromAyah: 1, toSurah: 16, toAyah: 128 },
  { fromSurah: 17, fromAyah: 1, toSurah: 18, toAyah: 74 },
  { fromSurah: 18, fromAyah: 75, toSurah: 20, toAyah: 135 },
  { fromSurah: 21, fromAyah: 1, toSurah: 22, toAyah: 78 },
  { fromSurah: 23, fromAyah: 1, toSurah: 25, toAyah: 20 },
  { fromSurah: 25, fromAyah: 21, toSurah: 27, toAyah: 55 },
  { fromSurah: 27, fromAyah: 56, toSurah: 29, toAyah: 45 },
  { fromSurah: 29, fromAyah: 46, toSurah: 33, toAyah: 30 },
  { fromSurah: 33, fromAyah: 31, toSurah: 36, toAyah: 27 },
  { fromSurah: 36, fromAyah: 28, toSurah: 39, toAyah: 31 },
  { fromSurah: 39, fromAyah: 32, toSurah: 41, toAyah: 46 },
  { fromSurah: 41, fromAyah: 47, toSurah: 45, toAyah: 37 },
  { fromSurah: 46, fromAyah: 1, toSurah: 51, toAyah: 30 },
  { fromSurah: 51, fromAyah: 31, toSurah: 57, toAyah: 29 },
  { fromSurah: 58, fromAyah: 1, toSurah: 66, toAyah: 12 },
  { fromSurah: 67, fromAyah: 1, toSurah: 77, toAyah: 50 },
  { fromSurah: 78, fromAyah: 1, toSurah: 114, toAyah: 6 }
];

const JUZ_CATEGORICAL_BOUNDARIES: Record<string, JuzBoundary> = {
  "الجزأين الأخيرين (تبارك وعم)": { fromSurah: 67, fromAyah: 1, toSurah: 114, toAyah: 6 },
  "الثلاثة أجزاء الأخيرة (قد سمع - الناس)": { fromSurah: 58, fromAyah: 1, toSurah: 114, toAyah: 6 },
  "الخمسة أجزاء الأخيرة (الأحقاف - الناس)": { fromSurah: 46, fromAyah: 1, toSurah: 114, toAyah: 6 },
  "العشرة أجزاء الأخيرة (العنكبوت - الناس)": { fromSurah: 29, fromAyah: 46, toSurah: 114, toAyah: 6 },
  "الخمسة عشر جزءاً (مريم - الناس)": { fromSurah: 19, fromAyah: 1, toSurah: 114, toAyah: 6 }
};

const buildDefaultCriteria = (maxScore: number): ExamCriteriaInput => {
  const safeMax = Math.max(1, maxScore);
  const memorizationScore = Math.round(safeMax * 0.7);
  const tajweedScore = Math.round(safeMax * 0.2);

  return {
    memorizationScore,
    tajweedScore,
    theoreticalTajweedScore: 0,
    performanceScore: Math.max(0, safeMax - memorizationScore - tajweedScore),
    promptingPenalty: 1,
    remindingPenalty: 1,
    tajweedPenalty: 1,
    minQuestionCount: DEFAULT_QUESTION_COUNT_POLICY.minQuestionCount,
    defaultQuestionCount: DEFAULT_QUESTION_COUNT_POLICY.defaultQuestionCount,
    maxQuestionCount: DEFAULT_QUESTION_COUNT_POLICY.maxQuestionCount
  };
};

const ensureCriteriaHasPositiveScore = (criteria: ExamCriteriaInput) => {
  const totalCriteriaScore =
    criteria.memorizationScore +
    criteria.tajweedScore +
    criteria.theoreticalTajweedScore +
    criteria.performanceScore;

  if (totalCriteriaScore <= 0) {
    throw new AppError("معيار التقييم يجب أن يحتوي على درجة إيجابية واحدة على الأقل", 400);
  }

  const questionCountPolicyValues = [
    criteria.minQuestionCount,
    criteria.defaultQuestionCount,
    criteria.maxQuestionCount
  ];

  if (
    questionCountPolicyValues.some(
      (value) => !Number.isInteger(value) || value < 1 || value > 20
    )
  ) {
    throw new AppError("عدد الأسئلة يجب أن يكون بين 1 و 20", 400);
  }

  if (criteria.minQuestionCount > criteria.defaultQuestionCount) {
    throw new AppError(
      "عدد الأسئلة الافتراضي يجب أن يكون أكبر من أو يساوي الحد الأدنى",
      400
    );
  }

  if (criteria.defaultQuestionCount > criteria.maxQuestionCount) {
    throw new AppError(
      "عدد الأسئلة الافتراضي يجب أن يكون أقل من أو يساوي الحد الأقصى",
      400
    );
  }
};

const ensureAyahInSurah = (surah: number, ayah: number, fieldName: string) => {
  const maxAyah = getSurahAyahCount(surah);
  if (!maxAyah) {
    throw new AppError(`رقم سورة غير صحيح للحقل ${fieldName}`, 400);
  }

  if (!Number.isInteger(ayah) || ayah < 1 || ayah > maxAyah) {
    throw new AppError(`${fieldName} يجب أن يكون بين 1 و ${maxAyah}`, 400);
  }
};

const ensureQuestionRangeValid = (input: QuestionRange) => {
  ensureAyahInSurah(input.fromSurah, input.fromAyah, "fromAyah");
  ensureAyahInSurah(input.toSurah, input.toAyah, "toAyah");

  const isValidOrder =
    input.fromSurah < input.toSurah ||
    (input.fromSurah === input.toSurah && input.fromAyah <= input.toAyah);

  if (!isValidOrder) {
    throw new AppError("ترتيب نطاق الأسئلة غير صحيح", 400);
  }
};

const ensureQuestionMetadataValid = (input: {
  pageNumber: number;
  lineCount: number;
  difficultyLevel: number;
}) => {
  if (!Number.isInteger(input.pageNumber) || input.pageNumber < 1 || input.pageNumber > 604) {
    throw new AppError("رقم الصفحة يجب أن يكون بين 1 و 604", 400);
  }

  if (!Number.isInteger(input.lineCount) || input.lineCount < 1 || input.lineCount > 15) {
    throw new AppError("عدد الأسطر يجب أن يكون بين 1 و 15", 400);
  }

  if (
    !Number.isInteger(input.difficultyLevel) ||
    input.difficultyLevel < 1 ||
    input.difficultyLevel > 5
  ) {
    throw new AppError("مستوى الصعوبة يجب أن يكون بين 1 و 5", 400);
  }
};

const questionRangeKey = (range: QuestionRange): string =>
  `${range.fromSurah}:${range.fromAyah}-${range.toSurah}:${range.toAyah}`;

const buildGeneratedQuestionRanges = (
  fromSurah: number,
  toSurah: number,
  count: number
): QuestionRange[] => {
  const normalizedFrom = Math.min(fromSurah, toSurah);
  const normalizedTo = Math.max(fromSurah, toSurah);
  const totalCount = Math.max(1, Math.min(100, Math.round(count)));
  const surahs = Array.from(
    { length: normalizedTo - normalizedFrom + 1 },
    (_, index) => normalizedFrom + index
  );

  return Array.from({ length: totalCount }, (_, index) => {
    const surahIndex = Math.floor((index * surahs.length) / totalCount);
    const surahId = surahs[Math.min(surahIndex, surahs.length - 1)];
    const maxAyah = Math.max(1, getSurahAyahCount(surahId));
    const maxSegment = Math.min(12, Math.max(2, Math.floor(maxAyah / 6) + 1));
    const segmentLength = Math.min(maxAyah, 1 + ((index + surahId) % maxSegment));
    const startBound = Math.max(1, maxAyah - segmentLength + 1);
    const fromAyah = 1 + ((index * 13 + surahId * 7) % startBound);
    const toAyah = Math.min(maxAyah, fromAyah + segmentLength - 1);

    return {
      fromSurah: surahId,
      fromAyah,
      toSurah: surahId,
      toAyah
    };
  });
};

const buildSmartSingleQuestionRange = (fromSurah: number, toSurah: number): QuestionRange => {
  const start = Math.min(fromSurah, toSurah);
  const end = Math.max(fromSurah, toSurah);
  const surahId = Math.floor(Math.random() * (end - start + 1)) + start;
  const maxAyah = Math.max(1, getSurahAyahCount(surahId));
  const maxSegment = Math.min(15, Math.max(3, Math.floor(maxAyah / 4)));
  const segmentLength = Math.floor(Math.random() * maxSegment) + 1;
  const boundedLength = Math.min(maxAyah, Math.max(1, segmentLength));
  const startBound = Math.max(1, maxAyah - boundedLength + 1);
  const fromAyah = Math.floor(Math.random() * startBound) + 1;
  const toAyah = Math.min(maxAyah, fromAyah + boundedLength - 1);

  return {
    fromSurah: surahId,
    fromAyah,
    toSurah: surahId,
    toAyah
  };
};

const buildNonDuplicateSmartSingleQuestionRange = (
  fromSurah: number,
  toSurah: number,
  existingKeys: Set<string>
): QuestionRange => {
  let lastCandidate = buildSmartSingleQuestionRange(fromSurah, toSurah);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = buildSmartSingleQuestionRange(fromSurah, toSurah);
    lastCandidate = candidate;
    if (!existingKeys.has(questionRangeKey(candidate))) {
      return candidate;
    }
  }

  return lastCandidate;
};

const estimateAyahSpan = (range: QuestionRange): number => {
  if (range.fromSurah === range.toSurah) {
    return Math.max(1, range.toAyah - range.fromAyah + 1);
  }

  let span = getSurahAyahCount(range.fromSurah) - range.fromAyah + 1;

  for (let surah = range.fromSurah + 1; surah < range.toSurah; surah += 1) {
    span += getSurahAyahCount(surah);
  }

  span += range.toAyah;
  return Math.max(1, span);
};

const estimatePageNumber = (surah: number, ayah: number): number => {
  const totalAyahs = SURAH_AYAH_COUNTS.reduce((sum, count) => sum + count, 0);
  let ayahsBefore = 0;
  for (let index = 0; index < surah - 1; index += 1) {
    ayahsBefore += SURAH_AYAH_COUNTS[index] ?? 0;
  }
  const absoluteAyah = ayahsBefore + ayah;
  return Math.max(1, Math.min(604, Math.ceil((absoluteAyah / totalAyahs) * 604)));
};

const estimateLineCount = (ayahSpan: number): number => {
  return Math.max(1, Math.min(15, Math.ceil(ayahSpan / 2)));
};

const estimateDifficultyLevel = (ayahSpan: number, surahSpread: number): number => {
  let level = 1;
  if (ayahSpan >= 4) level += 1;
  if (ayahSpan >= 8) level += 1;
  if (ayahSpan >= 12) level += 1;
  if (surahSpread > 0) level += 1;
  return Math.max(1, Math.min(5, level));
};

const parseBranchIndex = (branch: string | null | undefined): number | null => {
  const normalized = branch?.trim();
  if (!normalized) {
    return null;
  }

  const directIndex = JUZ_BRANCH_LABELS.findIndex((label) => label === normalized);
  if (directIndex >= 0) {
    return directIndex + 1;
  }

  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const westernDigits = normalized.replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
  const matchedNumber = westernDigits.match(/\d+/)?.[0];
  if (!matchedNumber) {
    return null;
  }

  const parsed = Number(matchedNumber);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 30 ? parsed : null;
};

const normalizeTemplateType = (type: ExamType): "JUZ" | "FULL_QURAN" | "JUZ_RANGE" => {
  if (type !== "JUZ" && type !== "FULL_QURAN" && type !== "JUZ_RANGE") {
    throw new AppError("فقط نماذج اختبارات الجزء والفئات والمصحف كاملاً مدعومة", 400);
  }

  return type as "JUZ" | "FULL_QURAN" | "JUZ_RANGE";
};

/**
 * Parses a JUZ_RANGE examBranch string formatted as "من الجزء X إلى الجزء Y"
 * Returns { from, to } juz indices (1-30) or null if parsing fails.
 */
const parseJuzRangeBranch = (branch: string | null | undefined): { from: number; to: number } | null => {
  const normalized = branch?.trim();
  if (!normalized) return null;

  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const toWestern = (s: string) => s.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  const westernized = toWestern(normalized);

  // Format: "من الجزء X إلى الجزء Y"
  const match = westernized.match(/من\s+الجزء\s+(\d+)\s+إلى\s+الجزء\s+(\d+)/);
  if (!match) return null;

  const from = Number(match[1]);
  const to = Number(match[2]);

  if (
    !Number.isInteger(from) || from < 1 || from > 30 ||
    !Number.isInteger(to) || to < 1 || to > 30 ||
    from > to
  ) {
    return null;
  }

  return { from, to };
};

const resolveAttemptBoundary = (exam: { type: ExamType; examBranch?: string | null }): JuzBoundary => {
  if (exam.type === "FULL_QURAN") {
    return { fromSurah: 1, fromAyah: 1, toSurah: 114, toAyah: 6 };
  }

  const normalizedBranch = exam.examBranch?.trim();

  // JUZ_RANGE: من الجزء X إلى الجزء Y
  if (exam.type === "JUZ_RANGE") {
    const range = parseJuzRangeBranch(normalizedBranch);
    if (!range) {
      throw new AppError("نطاق الأجزاء غير صحيح. يجب أن يكون بالتنسيق: من الجزء X إلى الجزء Y", 400);
    }
    const fromBoundary = JUZ_BOUNDARIES[range.from - 1];
    const toBoundary = JUZ_BOUNDARIES[range.to - 1];
    return {
      fromSurah: fromBoundary.fromSurah,
      fromAyah: fromBoundary.fromAyah,
      toSurah: toBoundary.toSurah,
      toAyah: toBoundary.toAyah
    };
  }

  if (normalizedBranch && JUZ_CATEGORICAL_BOUNDARIES[normalizedBranch]) {
    return JUZ_CATEGORICAL_BOUNDARIES[normalizedBranch];
  }

  const branchIndex = parseBranchIndex(normalizedBranch);
  if (!branchIndex) {
    throw new AppError("نموذج اختبار الجزء يتطلب فرع اختبار صحيح", 400);
  }

  return JUZ_BOUNDARIES[branchIndex - 1];
};

const resolveAttemptBoundarySafe = (exam?: {
  type?: ExamType | null;
  examBranch?: string | null;
}): JuzBoundary | null => {
  if (!exam?.type) {
    return null;
  }

  if (exam.type !== "FULL_QURAN" && exam.type !== "JUZ") {
    return null;
  }

  try {
    return resolveAttemptBoundary({
      type: exam.type,
      examBranch: exam.examBranch ?? null
    });
  } catch {
    return null;
  }
};

const isRangeWithinBoundary = (boundary: JuzBoundary, range: QuestionRange): boolean => {
  const boundaryStartsBeforeOrAtRange =
    boundary.fromSurah < range.fromSurah ||
    (boundary.fromSurah === range.fromSurah && boundary.fromAyah <= range.fromAyah);
  const boundaryEndsAfterOrAtRange =
    boundary.toSurah > range.toSurah ||
    (boundary.toSurah === range.toSurah && boundary.toAyah >= range.toAyah);

  return boundaryStartsBeforeOrAtRange && boundaryEndsAfterOrAtRange;
};

const resolveQuestionCountPolicy = (
  criteria?: Partial<
    Pick<ExamCriteriaInput, "minQuestionCount" | "defaultQuestionCount" | "maxQuestionCount">
  > | null
): QuestionCountPolicy => {
  const policy = {
    minQuestionCount:
      criteria?.minQuestionCount ?? DEFAULT_QUESTION_COUNT_POLICY.minQuestionCount,
    defaultQuestionCount:
      criteria?.defaultQuestionCount ?? DEFAULT_QUESTION_COUNT_POLICY.defaultQuestionCount,
    maxQuestionCount:
      criteria?.maxQuestionCount ?? DEFAULT_QUESTION_COUNT_POLICY.maxQuestionCount
  };

  ensureCriteriaHasPositiveScore({
    memorizationScore: 1,
    tajweedScore: 0,
    theoreticalTajweedScore: 0,
    performanceScore: 0,
    promptingPenalty: 0,
    remindingPenalty: 0,
    tajweedPenalty: 0,
    ...policy
  });

  return policy;
};

const resolveRequestedQuestionCount = (
  requestedCount: number | undefined,
  policy: QuestionCountPolicy
) => {
  const count = requestedCount ?? policy.defaultQuestionCount;

  if (count < policy.minQuestionCount || count > policy.maxQuestionCount) {
      throw new AppError(
        `عدد الأسئلة يجب أن يكون بين ${policy.minQuestionCount} و ${policy.maxQuestionCount}`,
        400
      );
  }

  return count;
};

const shuffleArray = <T>(items: readonly T[]) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const selectQuestionBankRanges = (
  items: Array<{
    fromSurah: number;
    fromAyah: number;
    toSurah: number;
    toAyah: number;
  }>,
  count: number,
  boundary: JuzBoundary
) => {
  const uniqueCandidates = new Map<
    string,
    {
      fromSurah: number;
      fromAyah: number;
      toSurah: number;
      toAyah: number;
    }
  >();

  for (const item of shuffleArray(items)) {
    if (!isRangeWithinBoundary(boundary, item)) {
      continue;
    }

    const key = questionRangeKey(item);
    if (!uniqueCandidates.has(key)) {
      uniqueCandidates.set(key, item);
    }
  }

  return {
    selected: Array.from(uniqueCandidates.values()).slice(0, count),
    available: uniqueCandidates.size
  };
};

const buildAttemptQuestionRanges = (boundary: JuzBoundary, count: number): QuestionRange[] => {
  const totalCount = Math.max(1, Math.min(20, Math.round(count)));
  const surahIds = Array.from(
    { length: boundary.toSurah - boundary.fromSurah + 1 },
    (_, index) => boundary.fromSurah + index
  );

  return Array.from({ length: totalCount }, (_, index) => {
    const surahId = surahIds[(index + Math.floor(Math.random() * surahIds.length)) % surahIds.length];
    const maxAyah = getSurahAyahCount(surahId);
    const minAyah = surahId === boundary.fromSurah ? boundary.fromAyah : 1;
    const maxAllowedAyah = surahId === boundary.toSurah ? boundary.toAyah : maxAyah;
    const safeMaxAyah = Math.max(minAyah, maxAllowedAyah);
    const spanLength = Math.min(8, Math.max(2, 2 + ((index + surahId) % 5)));
    const startBound = Math.max(minAyah, safeMaxAyah - spanLength + 1);
    const fromAyah =
      startBound === minAyah
        ? minAyah
        : minAyah + ((index * 11 + surahId * 3) % (startBound - minAyah + 1));
    const toAyah = Math.min(safeMaxAyah, fromAyah + spanLength - 1);

    return {
      fromSurah: surahId,
      fromAyah,
      toSurah: surahId,
      toAyah
    };
  });
};

const serializeAttempt = <T extends Record<string, unknown> & {
  examDate?: Date | string | null;
  fullQuranCompletedAt?: Date | string | null;
}>(attempt: T) => {
  const examDate = attempt.examDate ? new Date(attempt.examDate) : null;
  const fullQuranCompletedAt = attempt.fullQuranCompletedAt
    ? new Date(attempt.fullQuranCompletedAt)
    : null;
  const exam = (attempt as {
    exam?: {
      type?: ExamType | null;
      examBranch?: string | null;
    } | null;
  }).exam;
  const examRange = resolveAttemptBoundarySafe(exam ?? undefined);

  return {
    ...attempt,
    stabilizationDays: examsDomain.computeStabilizationDays(fullQuranCompletedAt, examDate),
    examRange
  };
};

const ensureCenterExistsAndVisible = async (scope: ScopeContext, centerId: number) => {
  examsDomain.ensureCenterVisible(scope, centerId);

  const center = await examsRepository.findCenterById({
    centerId,
    organizationId: scope.organizationId
  });

  if (!center) {
    throw new AppError("المركز غير موجود", 404);
  }

  return center;
};

const ensureCircleExistsAndVisible = async (
  scope: ScopeContext,
  circleId: number,
  expectedCenterId?: number
) => {
  examsDomain.ensureCircleVisible(scope, circleId);

  const circle = await examsRepository.findCircleById({
    circleId,
    organizationId: scope.organizationId
  });

  if (!circle) {
    throw new AppError("الحلقة غير موجودة", 404);
  }

  if (expectedCenterId && circle.centerId !== expectedCenterId) {
    throw new AppError("الحلقة لا تنتمي إلى المركز المحدد", 400);
  }

  return circle;
};

const getExamInScope = async (scope: ScopeContext, examId: number) => {
  const exam = await examsRepository.findExamById({
    examId,
    organizationId: scope.organizationId
  });

  if (!exam) {
    throw new AppError("الاختبار غير موجود", 404);
  }

  examsDomain.ensureTemplateVisible(scope, {
    centerId: exam.centerId,
    circleId: exam.circleId
  });

  return exam;
};

const getAttemptInScope = async (scope: ScopeContext, attemptId: number) => {
  const attempt = await examsRepository.findAttemptById({
    attemptId,
    organizationId: scope.organizationId
  });

  if (!attempt) {
    throw new AppError("محاولة الاختبار غير موجودة", 404);
  }

  examsDomain.ensureAttemptVisibility({
    scope,
    centerId: attempt.circle.centerId,
    circleTeacherId: attempt.circle.teacherId,
    committeeUserIds: attempt.committeeMembers.map((member) => member.userId),
    status: attempt.status
  });

  return attempt;
};

const validateCommitteeMembers = async (
  scope: ScopeContext,
  centerId: number,
  committeeMemberIds: number[]
) => {
  const uniqueMemberIds = examsDomain.uniqueIds(committeeMemberIds);
  const users = await examsRepository.findCommitteeUsers({
    organizationId: scope.organizationId,
    centerId,
    userIds: uniqueMemberIds
  });

  if (users.length !== uniqueMemberIds.length) {
    throw new AppError("واحد أو أكثر من أعضاء اللجنة المختارين غير صالحين لهذا المركز", 400);
  }

  examsDomain.assertCommitteeRoles(users.map((user) => user.role));

  return users.map((user) => ({
    userId: user.id,
    roleAtAssignment: user.role,
    assignedById: scope.userId
  }));
};

const assertAttemptCanBeConducted = (attempt: Awaited<ReturnType<typeof examsRepository.findAttemptById>>) => {
  if (!attempt) {
    throw new AppError("محاولة الاختبار غير موجودة", 404);
  }

  if (attempt.reviewedAt) {
    editLockPolicy.assertEditable({
      resource: "Exam attempt",
      baseAt: attempt.reviewedAt
    });
  }

  if (attempt.exam.status !== "PUBLISHED") {
    throw new AppError("فعاليات الاختبارات المنشورة فقط يمكن العمل عليها", 400);
  }

  if (
    attempt.status !== AttemptStatus.SCHEDULED &&
    attempt.status !== AttemptStatus.IN_PROGRESS
  ) {
    throw new AppError("محاولة الاختبار لا يمكن العمل عليها من حالتها الحالية", 400);
  }
};

const buildScheduleNotificationBody = (input: {
  studentName: string;
  examTitle: string;
  examDate: Date;
  centerName: string;
  circleName: string;
}) => {
  const dateLabel = input.examDate.toISOString().slice(0, 10);
  return `تم تحديد موعد اختبار ${input.studentName} في ${input.circleName} بمركز ${input.centerName} يوم ${dateLabel} للاختبار: ${input.examTitle}.`;
};

const buildResultNotificationBody = (input: {
  studentName: string;
  examTitle: string;
  totalScore: number | null;
  gradeLabel: string | null;
}) => {
  const scoreLabel = input.totalScore === null ? "غير محدد" : `${input.totalScore}`;
  const gradeLabel = input.gradeLabel ?? "غير محدد";
  return `تم اعتماد نتيجة اختبار ${input.studentName} في ${input.examTitle}. الدرجة: ${scoreLabel}. التقدير: ${gradeLabel}.`;
};

const notifyAttemptSchedule = async (scope: ScopeContext, attemptId: number) => {
  const context = await examsRepository.findAttemptNotificationContext({
    attemptId,
    organizationId: scope.organizationId
  });

  if (!context) {
    return { createdCount: 0 };
  }

  const recipientUserIds = examsDomain.uniqueIds([
    context.student.id,
    context.circle.teacherId,
    ...context.student.childLinks.map((link) => link.parentId)
  ]);
  const title = "موعد اختبار جديد";
  const body = buildScheduleNotificationBody({
    studentName: context.student.fullName,
    examTitle: context.exam.title,
    examDate: context.examDate,
    centerName: context.circle.center.name,
    circleName: context.circle.name
  });

  await prisma.notification.deleteMany({
    where: {
      organizationId: scope.organizationId,
      type: "EXAM_ATTEMPT_SCHEDULED",
      recipientUserId: {
        in: recipientUserIds
      },
      body
    }
  });

  const result = await notificationsRepository.createMany({
    data: recipientUserIds.map((recipientUserId) => ({
      organizationId: scope.organizationId,
      centerId: context.circle.centerId,
      circleId: context.circle.id,
      type: "EXAM_ATTEMPT_SCHEDULED",
      title,
      body,
      payload: {
        workflow: "EXAM_ATTEMPT_SCHEDULED",
        attemptId: context.id,
        examId: context.exam.id,
        examDate: context.examDate.toISOString().slice(0, 10)
      },
      recipientUserId,
      createdById: scope.userId
    }))
  });

  return {
    createdCount: result.count
  };
};

const notifyAttemptResultShared = async (scope: ScopeContext, attemptId: number) => {
  const context = await examsRepository.findAttemptNotificationContext({
    attemptId,
    organizationId: scope.organizationId
  });

  if (!context) {
    return { createdCount: 0 };
  }

  const recipientUserIds = examsDomain.uniqueIds([
    context.student.id,
    context.circle.teacherId,
    ...context.student.childLinks.map((link) => link.parentId)
  ]);
  const title = "نتيجة اختبار الطالب";
  const body = buildResultNotificationBody({
    studentName: context.student.fullName,
    examTitle: context.exam.title,
    totalScore: context.totalScore,
    gradeLabel: context.gradeLabel
  });

  await prisma.notification.deleteMany({
    where: {
      organizationId: scope.organizationId,
      type: "EXAM_RESULT_SHARED",
      recipientUserId: {
        in: recipientUserIds
      },
      body
    }
  });

  const result = await notificationsRepository.createMany({
    data: recipientUserIds.map((recipientUserId) => ({
      organizationId: scope.organizationId,
      centerId: context.circle.centerId,
      circleId: context.circle.id,
      type: "EXAM_RESULT_SHARED",
      title,
      body,
      payload: {
        workflow: "EXAM_RESULT_SHARED",
        attemptId: context.id,
        examId: context.exam.id,
        totalScore: context.totalScore,
        gradeLabel: context.gradeLabel
      },
      recipientUserId,
      createdById: scope.userId
    }))
  });

  return {
    createdCount: result.count
  };
};

export const examsService = {
  async listExams(scope: ScopeContext, query: ListExamsQuery) {
    examsDomain.assertCanAccessExams(scope);
    examsDomain.assertScopeFilters(scope, {
      centerId: query.centerId,
      circleId: query.circleId
    });

    if (!scope.allAccess && !scope.centerIds.length && !scope.circleIds.length) {
      return [];
    }

    const range = examsDomain.resolveDateRange(query.from, query.to);

    const centerIds =
      scope.role === Role.SUPER_ADMIN
        ? query.centerId
          ? [query.centerId]
          : undefined
        : query.centerId
          ? [query.centerId]
          : scope.centerIds;

    const circleIds =
      query.circleId !== undefined
        ? [query.circleId]
        : scope.role === Role.SUPER_ADMIN
          ? undefined
          : scope.circleIds.length
            ? scope.circleIds
            : undefined;

    return examsRepository.listExams({
      organizationId: scope.organizationId,
      centerIds,
      circleIds,
      purpose: query.purpose,
      status: query.status,
      range
    });
  },

  async createExam(scope: ScopeContext, input: CreateExamInput) {
    examsDomain.assertCanManageTemplates(scope);

    const type = normalizeTemplateType(input.type);

    if (input.passScore > input.maxScore) {
      throw new AppError("درجة النجاح لا يمكن أن تتجاوز الدرجة القصوى", 400);
    }

    if (type === "JUZ" && !input.examBranch?.trim()) {
      throw new AppError("فرع الاختبار مطلوب لاختبارات الجزء", 400);
    }

    if (type === "FULL_QURAN" && input.examBranch?.trim()) {
      throw new AppError("فرع الاختبار يجب أن يكون فارغاً لاختبارات المصحف كاملاً", 400);
    }

    const criteria = input.criteria ?? buildDefaultCriteria(input.maxScore);
    ensureCriteriaHasPositiveScore(criteria);

    const duplicate = await examsRepository.findExamByTitle({
      title: input.title.trim(),
      organizationId: scope.organizationId
    });
    if (duplicate) {
      throw new AppError(`يوجد قالب اختبار مسبقاً بنفس الاسم "${input.title.trim()}"`, 400);
    }

    const exam = await examsRepository.createExam({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      title: input.title,
      type,
      examBranch: input.examBranch ?? null,
      purpose: input.purpose ?? ExamPurpose.NORMAL,
      maxScore: input.maxScore,
      passScore: input.passScore,
      scheduledAt: null,
      createdById: scope.userId,
      criteria
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.EXAM,
      entityId: exam.id,
      summary: "تم إنشاء قالب اختبار مركزي",
      metadata: {
        title: exam.title,
        type: exam.type,
        examBranch: exam.examBranch,
        purpose: exam.purpose,
        maxScore: exam.maxScore,
        passScore: exam.passScore
      }
    });

    return exam;
  },

  async updateExam(scope: ScopeContext, examId: number, input: UpdateExamInput) {
    examsDomain.assertCanManageTemplates(scope);

    const existingExam = await getExamInScope(scope, examId);

    // If the template has attempts, we enforce immutability for scoring/type fields
    // to preserve historical data integrity. Only the title and purpose can be changed.
    const hasAttempts = (existingExam._count?.attempts ?? 0) > 0;
    if (hasAttempts) {
      if (
        (input.maxScore !== undefined && input.maxScore !== existingExam.maxScore) ||
        (input.passScore !== undefined && input.passScore !== existingExam.passScore) ||
        (input.type !== undefined && input.type !== existingExam.type) ||
        (input.examBranch !== undefined && input.examBranch !== existingExam.examBranch) ||
        input.criteria !== undefined
      ) {
        throw new AppError(
          "لا يمكن تعديل معايير التقييم أو نوع الاختبار لقالب مستخدم مسبقاً. الرجاء إنشاء نسخة جديدة من القالب لتعديل المعايير.",
          400
        );
      }
      
      // Forcefully strip them to be safe
      input.maxScore = undefined;
      input.passScore = undefined;
      input.type = undefined;
      input.examBranch = undefined;
      input.criteria = undefined;
    }

    // If the template is published, revert it to DRAFT automatically
    // so it can be edited and then re-published after review.
    const wasPublished = existingExam.status === "PUBLISHED";
    if (wasPublished) {
      await examsRepository.unpublishExam(examId);
    }

    if (input.title !== undefined && input.title.trim() !== existingExam.title) {
      const duplicate = await examsRepository.findExamByTitle({
        title: input.title.trim(),
        organizationId: scope.organizationId
      });
      if (duplicate && duplicate.id !== examId) {
        throw new AppError(`يوجد قالب اختبار مسبقاً بنفس الاسم "${input.title.trim()}"`, 400);
      }
    }

    const nextType = normalizeTemplateType(input.type ?? existingExam.type);
    const nextExamBranch =
      input.examBranch !== undefined ? input.examBranch : existingExam.examBranch ?? null;
    const nextMaxScore = input.maxScore ?? existingExam.maxScore;
    const nextPassScore = input.passScore ?? existingExam.passScore;

    if (nextPassScore > nextMaxScore) {
      throw new AppError("درجة النجاح لا يمكن أن تتجاوز الدرجة القصوى", 400);
    }

    if (nextType === "JUZ" && !nextExamBranch?.trim()) {
      throw new AppError("فرع الاختبار مطلوب لاختبارات الجزء", 400);
    }

    if (nextType === "FULL_QURAN" && nextExamBranch?.trim()) {
      throw new AppError("فرع الاختبار يجب أن يكون فارغاً لاختبارات المصحف كاملاً", 400);
    }

    const existingCriteria: ExamCriteriaInput | undefined = existingExam.criteria
      ? {
          memorizationScore: existingExam.criteria.memorizationScore,
          tajweedScore: existingExam.criteria.tajweedScore,
          theoreticalTajweedScore: existingExam.criteria.theoreticalTajweedScore,
          performanceScore: existingExam.criteria.performanceScore,
          promptingPenalty: existingExam.criteria.promptingPenalty,
          remindingPenalty: existingExam.criteria.remindingPenalty,
          tajweedPenalty: existingExam.criteria.tajweedPenalty,
          minQuestionCount: existingExam.criteria.minQuestionCount,
          defaultQuestionCount: existingExam.criteria.defaultQuestionCount,
          maxQuestionCount: existingExam.criteria.maxQuestionCount
        }
      : undefined;

    const nextCriteria = input.criteria ?? existingCriteria ?? buildDefaultCriteria(nextMaxScore);
    ensureCriteriaHasPositiveScore(nextCriteria);

    const exam = await examsRepository.updateExam({
      examId,
      title: input.title,
      type: input.type,
      examBranch: input.examBranch,
      purpose: input.purpose,
      maxScore: input.maxScore,
      passScore: input.passScore,
      centerId: null,
      circleId: null,
      scheduledAt: null,
      criteria: nextCriteria
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM,
      entityId: exam.id,
      summary: "تم تحديث قالب اختبار",
      metadata: {
        before: {
          title: existingExam.title,
          type: existingExam.type,
          examBranch: existingExam.examBranch
        },
        after: {
          title: exam.title,
          type: exam.type,
          examBranch: exam.examBranch
        }
      }
    });

    return exam;
  },

  async deleteExam(scope: ScopeContext, examId: number) {
    examsDomain.assertCanManageTemplates(scope);

    const existingExam = await getExamInScope(scope, examId);

    // Block deletion only if there are linked attempts (historical data integrity)
    const attemptCount = existingExam._count?.attempts ?? 0;
    if (attemptCount > 0) {
      throw new AppError(
        `لا يمكن حذف هذا القالب لأنه مرتبط بـ ${attemptCount} محاولة اختبار. أوقف تفعيله بدلاً من ذلك.`,
        400
      );
    }

    const deletedExam = await examsRepository.deleteExam(examId);

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.EXAM,
      entityId: existingExam.id,
      summary: "تم حذف قالب اختبار",
      metadata: {
        title: existingExam.title,
        status: existingExam.status
      }
    });

    return deletedExam;
  },

  async publishExam(scope: ScopeContext, examId: number) {
    examsDomain.assertCanManageTemplates(scope);

    const existingExam = await getExamInScope(scope, examId);

    if (existingExam.status !== "DRAFT") {
      throw new AppError("فقط الاختبارات المسودة يمكن نشرها", 400);
    }

    const exam = await examsRepository.publishExam(examId);

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.PUBLISH,
      entityType: AuditEntityType.EXAM,
      entityId: exam.id,
      summary: "تم نشر قالب اختبار",
      metadata: {
        previousStatus: existingExam.status,
        status: exam.status
      }
    });

    return exam;
  },

  async listQuestionBank(scope: ScopeContext, query: ListQuestionBankQuery) {
    examsDomain.assertCanManageTemplates(scope);

    return examsRepository.listQuestionBank({
      organizationId: scope.organizationId,
      fromSurah: query.fromSurah,
      toSurah: query.toSurah,
      difficultyLevel: query.difficultyLevel,
      source: query.source,
      search: query.search
    });
  },

  async createQuestionBankItem(scope: ScopeContext, input: CreateQuestionBankItemInput) {
    examsDomain.assertCanManageTemplates(scope);

    ensureQuestionRangeValid({
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: input.toSurah,
      toAyah: input.toAyah
    });

    await quranService.calculateRange({
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: input.toSurah,
      toAyah: input.toAyah
    });

    ensureQuestionMetadataValid({
      pageNumber: input.pageNumber,
      lineCount: input.lineCount,
      difficultyLevel: input.difficultyLevel
    });

    const item = await examsRepository.createQuestionBankItem({
      organizationId: scope.organizationId,
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: input.toSurah,
      toAyah: input.toAyah,
      pageNumber: input.pageNumber,
      lineCount: input.lineCount,
      difficultyLevel: input.difficultyLevel,
      suggestedText: input.suggestedText,
      source: ExamQuestionSource.MANUAL,
      createdById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.EXAM,
      entityId: item.id,
      summary: "تمت إضافة سؤال إلى بنك الأسئلة",
      metadata: {
        fromSurah: item.fromSurah,
        fromAyah: item.fromAyah,
        toSurah: item.toSurah,
        toAyah: item.toAyah,
        pageNumber: item.pageNumber,
        lineCount: item.lineCount,
        difficultyLevel: item.difficultyLevel,
        source: item.source
      }
    });

    return item;
  },

  async updateQuestionBankItem(
    scope: ScopeContext,
    itemId: number,
    input: CreateQuestionBankItemInput
  ) {
    examsDomain.assertCanManageTemplates(scope);
    ensureQuestionRangeValid(input);
    ensureQuestionMetadataValid(input);

    const existing = await examsRepository.findQuestionBankItemById({
      itemId,
      organizationId: scope.organizationId
    });

    if (!existing) {
      throw new AppError("عنصر بنك الأسئلة غير موجود", 404);
    }

    const item = await examsRepository.updateQuestionBankItem({
      itemId,
      organizationId: scope.organizationId,
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: input.toSurah,
      toAyah: input.toAyah,
      pageNumber: input.pageNumber,
      lineCount: input.lineCount,
      difficultyLevel: input.difficultyLevel,
      suggestedText: input.suggestedText?.trim() || null
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM,
      entityId: item.id,
      summary: "تم تحديث سؤال في بنك الأسئلة",
      metadata: {
        itemId: item.id,
        fromSurah: item.fromSurah,
        fromAyah: item.fromAyah,
        toSurah: item.toSurah,
        toAyah: item.toAyah,
        difficultyLevel: item.difficultyLevel
      }
    });

    return item;
  },

  async generateQuestionBankItems(scope: ScopeContext, input: GenerateQuestionBankInput) {
    examsDomain.assertCanManageTemplates(scope);

    const normalizedFromSurah = Math.min(input.fromSurah, input.toSurah);
    const normalizedToSurah = Math.max(input.fromSurah, input.toSurah);
    const requestedCount = Math.max(1, Math.min(100, Math.round(input.count ?? 1)));
    let ranges: QuestionRange[];

    if (requestedCount === 1) {
      const existingItems = await examsRepository.listQuestionBank({
        organizationId: scope.organizationId,
        fromSurah: normalizedFromSurah,
        toSurah: normalizedToSurah
      });
      const existingKeys = new Set(
        existingItems.map((item) =>
          questionRangeKey({
            fromSurah: item.fromSurah,
            fromAyah: item.fromAyah,
            toSurah: item.toSurah,
            toAyah: item.toAyah
          })
        )
      );
      ranges = [
        buildNonDuplicateSmartSingleQuestionRange(
          normalizedFromSurah,
          normalizedToSurah,
          existingKeys
        )
      ];
    } else {
      ranges = buildGeneratedQuestionRanges(
        normalizedFromSurah,
        normalizedToSurah,
        requestedCount
      );
    }

    const suggestedPrefix = input.suggestedTextPrefix?.trim();

    const generatedPayload = await Promise.all(
      ranges.map(async (range, index) => {
        const calculated = await quranService.calculateRange({
          fromSurah: range.fromSurah,
          fromAyah: range.fromAyah,
          toSurah: range.toSurah,
          toAyah: range.toAyah
        });

        const ayahSpan = estimateAyahSpan(range);
        const resolvedPageNumber =
          input.pageNumber ?? calculated.fromPage ?? estimatePageNumber(range.fromSurah, range.fromAyah);
        const resolvedLineCount = input.lineCount ?? estimateLineCount(ayahSpan);
        const resolvedDifficultyLevel =
          input.difficultyLevel ??
          estimateDifficultyLevel(ayahSpan, Math.max(0, range.toSurah - range.fromSurah));

        ensureQuestionMetadataValid({
          pageNumber: resolvedPageNumber,
          lineCount: resolvedLineCount,
          difficultyLevel: resolvedDifficultyLevel
        });

        return {
          organizationId: scope.organizationId,
          fromSurah: range.fromSurah,
          fromAyah: range.fromAyah,
          toSurah: range.toSurah,
          toAyah: range.toAyah,
          pageNumber: resolvedPageNumber,
          lineCount: resolvedLineCount,
          difficultyLevel: resolvedDifficultyLevel,
          suggestedText: suggestedPrefix
            ? requestedCount === 1
              ? suggestedPrefix
              : `${suggestedPrefix} ${index + 1}`
            : null,
          source: ExamQuestionSource.AUTO,
          createdById: scope.userId
        };
      })
    );

    const items = await examsRepository.createQuestionBankItems({
      items: generatedPayload
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.EXAM,
      entityId: items[0]?.id ?? 0,
      summary: "تم توليد أسئلة تلقائيًا في بنك الأسئلة",
      metadata: {
        count: items.length,
        fromSurah: normalizedFromSurah,
        toSurah: normalizedToSurah,
        metadataMode:
          input.pageNumber || input.lineCount || input.difficultyLevel ? "manual" : "auto"
      }
    });

    return items;
  },

  async deleteQuestionBankItem(scope: ScopeContext, itemId: number) {
    examsDomain.assertCanManageTemplates(scope);

    const existing = await examsRepository.findQuestionBankItemById({
      itemId,
      organizationId: scope.organizationId
    });

    if (!existing) {
      throw new AppError("عنصر بنك الأسئلة غير موجود", 404);
    }

    const deleted = await examsRepository.deleteQuestionBankItem(itemId);

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: null,
      circleId: null,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.EXAM,
      entityId: existing.id,
      summary: "تم حذف سؤال من بنك الأسئلة",
      metadata: {
        fromSurah: existing.fromSurah,
        fromAyah: existing.fromAyah,
        toSurah: existing.toSurah,
        toAyah: existing.toAyah
      }
    });

    return deleted;
  },

  async listExamAttempts(scope: ScopeContext, examId: number) {
    examsDomain.assertCanAccessExams(scope);

    await getExamInScope(scope, examId);

    const centerIds =
      scope.role === Role.CENTER_ADMIN
        ? scope.centerIds
        : scope.role === Role.SUPER_ADMIN
          ? undefined
          : undefined;
    const committeeUserId =
      scope.role === Role.TEACHER || scope.role === Role.SUPERVISOR ? scope.userId : undefined;

    const attempts = await examsRepository.listExamAttempts({
      examId,
      organizationId: scope.organizationId,
      centerIds,
      committeeUserId
    });

    return attempts.map((attempt) => serializeAttempt(attempt));
  },

  async listAllAttempts(
    scope: ScopeContext,
    query: { centerId?: number; circleId?: number; studentId?: number; purpose?: ExamPurpose }
  ) {
    examsDomain.assertCanAccessExams(scope);
    examsDomain.assertScopeFilters(scope, {
      centerId: query.centerId,
      circleId: query.circleId
    });

    if (!scope.allAccess && !scope.centerIds.length && !scope.circleIds.length) {
      return [];
    }

    const centerIds =
      scope.role === Role.SUPER_ADMIN
        ? query.centerId
          ? [query.centerId]
          : undefined
        : scope.role === Role.CENTER_ADMIN
          ? query.centerId
            ? [query.centerId]
            : scope.centerIds
          : scope.role === Role.STUDENT
            ? query.centerId
              ? [query.centerId]
              : scope.centerIds
          : query.centerId
            ? [query.centerId]
            : undefined;

    const circleIds =
      query.circleId !== undefined
        ? [query.circleId]
        : scope.role === Role.STUDENT
          ? scope.circleIds
          : undefined;
    const committeeUserId =
      scope.role === Role.TEACHER || scope.role === Role.SUPERVISOR ? scope.userId : undefined;
    const studentId = scope.role === Role.STUDENT ? scope.userId : query.studentId;

    const attempts = await examsRepository.listAllAttempts({
      organizationId: scope.organizationId,
      centerIds,
      circleIds,
      studentId,
      purpose: query.purpose,
      committeeUserId
    });

    return attempts.map((attempt) => serializeAttempt(attempt));
  },

  async createExamAttempt(scope: ScopeContext, examId: number, input: CreateAttemptInput) {
    examsDomain.assertCanNominate(scope);

    const exam = await getExamInScope(scope, examId);
    const normalizedType = normalizeTemplateType(exam.type);

    if (exam.status !== "PUBLISHED") {
      throw new AppError("محاولات الاختبار يمكن إنشاؤها فقط للاختبارات المنشورة", 400);
    }

    const circle = await ensureCircleExistsAndVisible(scope, input.circleId);
    await ensureCenterExistsAndVisible(scope, circle.centerId);

    const student = await examsRepository.findStudentById({
      studentId: input.studentId,
      organizationId: scope.organizationId
    });

    if (!student || student.role !== Role.STUDENT || !student.isActive) {
      throw new AppError("الطالب غير موجود أو غير نشط", 400);
    }

    const enrollment = await examsRepository.findActiveEnrollment({
      studentId: input.studentId,
      circleId: input.circleId,
      organizationId: scope.organizationId
    });

    if (!enrollment) {
      throw new AppError("الطالب غير مسجل في الحلقة المحددة", 400);
    }

    const activeAttempt = await examsRepository.findActiveStudentAttemptForExam({
      examId,
      studentId: input.studentId
    });

    if (activeAttempt) {
      throw new AppError("يوجد محاولة اختبار نشطة أو مجدولة مسبقاً لهذا الطالب لنفس الاختبار", 400);
    }

    const examDate = examsDomain.resolveRequiredDate(input.examDate, "examDate");
    const fullQuranCompletedAt = examsDomain.resolveOptionalDate(
      input.fullQuranCompletedAt,
      "fullQuranCompletedAt"
    );

    examsDomain.assertAttemptSchedule({
      examType: normalizedType,
      examDate,
      fullQuranCompletedAt
    });

    const committeeMembers = await validateCommitteeMembers(
      scope,
      circle.centerId,
      input.committeeMemberIds
    );

    try {
      const attempt = await examsRepository.createExamAttempt({
        examId,
        studentId: input.studentId,
        circleId: input.circleId,
        examDate,
        fullQuranCompletedAt: fullQuranCompletedAt ?? null,
        committeeMembers
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        circleId: circle.id,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.EXAM_ATTEMPT,
        entityId: attempt.id,
        summary: "تم إنشاء ترشيح طالب للاختبار",
        metadata: {
          examId,
          studentId: input.studentId,
          circleId: input.circleId,
          examDate: examDate.toISOString().slice(0, 10),
          committeeMemberIds: committeeMembers.map((member) => member.userId)
        }
      });

      await notifyAttemptSchedule(scope, attempt.id);

      return serializeAttempt(attempt);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("ترشيح موجود مسبقاً لهذا الطالب والنموذج وتاريخ الاختبار", 409);
      }

      throw error;
    }
  },

  async updateAttemptCommittee(
    scope: ScopeContext,
    attemptId: number,
    input: UpdateAttemptCommitteeInput
  ) {
    examsDomain.assertCanNominate(scope);

    const attempt = await getAttemptInScope(scope, attemptId);
    examsDomain.ensureAttemptCenterScope(scope, attempt.circle.centerId);

    if (attempt.reviewedAt) {
      editLockPolicy.assertEditable({
        resource: "Exam attempt",
        baseAt: attempt.reviewedAt
      });
    }

    editLockPolicy.assertVersionMatch({
      resource: "Exam attempt",
      currentVersion: attempt.lockVersion,
      expectedVersion: input.lockVersion
    });

    const nextExamDate =
      input.examDate !== undefined
        ? examsDomain.resolveRequiredDate(input.examDate, "examDate")
        : attempt.examDate;
    const nextFullQuranCompletedAt =
      input.fullQuranCompletedAt !== undefined
        ? examsDomain.resolveOptionalDate(input.fullQuranCompletedAt, "fullQuranCompletedAt")
        : attempt.fullQuranCompletedAt;

    examsDomain.assertAttemptSchedule({
      examType: normalizeTemplateType(attempt.exam.type),
      examDate: nextExamDate,
      fullQuranCompletedAt: nextFullQuranCompletedAt
    });

    const committeeMembers = input.committeeMemberIds
      ? await validateCommitteeMembers(scope, attempt.circle.centerId, input.committeeMemberIds)
      : undefined;

    const updatedAttempt = await examsRepository.replaceAttemptCommittee({
      attemptId,
      lockVersion: attempt.lockVersion,
      examDate: input.examDate !== undefined ? nextExamDate : undefined,
      fullQuranCompletedAt:
        input.fullQuranCompletedAt !== undefined ? nextFullQuranCompletedAt ?? null : undefined,
      committeeMembers
    });

    if (!updatedAttempt) {
      throw new AppError("تعارض في إصدار محاولة الاختبار", 409, { attemptId }, "VERSION_CONFLICT");
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: attempt.circle.centerId,
      circleId: attempt.circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attempt.id,
      summary: "تم تحديث موعد الاختبار أو اللجنة",
      metadata: {
        examId: attempt.examId,
        studentId: attempt.studentId,
        examDate: updatedAttempt.examDate.toISOString().slice(0, 10),
        committeeMemberIds: updatedAttempt.committeeMembers.map((member) => member.userId)
      }
    });

    await notifyAttemptSchedule(scope, updatedAttempt.id);

    return serializeAttempt(updatedAttempt);
  },

  async generateAttemptQuestions(
    scope: ScopeContext,
    attemptId: number,
    input: GenerateAttemptQuestionsInput
  ) {
    examsDomain.assertCanGenerateAttemptQuestions(scope);

    const attempt = await getAttemptInScope(scope, attemptId);

    if (scope.role === Role.CENTER_ADMIN) {
      examsDomain.ensureAttemptCenterScope(scope, attempt.circle.centerId);
    }

    if (attempt.reviewedAt) {
      editLockPolicy.assertEditable({
        resource: "Exam attempt",
        baseAt: attempt.reviewedAt
      });
    }

    const boundary = resolveAttemptBoundary({
      type: attempt.exam.type,
      examBranch: attempt.exam.examBranch
    });
    const questionCountPolicy = resolveQuestionCountPolicy(attempt.exam.criteria ?? undefined);
    const requestedCount = resolveRequestedQuestionCount(input.count, questionCountPolicy);
    const bankItems = await examsRepository.listQuestionBank({
      organizationId: scope.organizationId,
      fromSurah: boundary.fromSurah,
      toSurah: boundary.toSurah
    });
    const { selected: questions, available } = selectQuestionBankRanges(
      bankItems.map((item) => ({
        fromSurah: item.fromSurah,
        fromAyah: item.fromAyah,
        toSurah: item.toSurah,
        toAyah: item.toAyah
      })),
      requestedCount,
      boundary
    );

    if (questions.length < requestedCount) {
      throw new AppError(
        `بنك الأسئلة يحتوي فقط على ${available} سؤال فريد ضمن نطاق الاختبار؛ لا يمكن توليد ${requestedCount} أسئلة`,
        400
      );
    }

    const updatedAttempt = await examsRepository.replaceAttemptQuestions({
      attemptId,
      questions: questions.map((question, index) => ({
        orderIndex: index + 1,
        source: ExamQuestionSource.AUTO,
        fromSurah: question.fromSurah,
        fromAyah: question.fromAyah,
        toSurah: question.toSurah,
        toAyah: question.toAyah
      }))
    });

    if (!updatedAttempt) {
      throw new AppError("فشل في توليد أسئلة الاختبار", 500);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: attempt.circle.centerId,
      circleId: attempt.circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attempt.id,
      summary: "تم توليد أسئلة محاولة الاختبار",
      metadata: {
        attemptId: attempt.id,
        count: updatedAttempt.questions.length,
        requestedCount,
        questionBankAvailableCount: available
      }
    });

    return serializeAttempt(updatedAttempt);
  },

  async createAttemptQuestion(
    scope: ScopeContext,
    attemptId: number,
    input: CreateAttemptQuestionInput
  ) {
    examsDomain.assertCanScoreAttempt(scope);

    const attempt = await getAttemptInScope(scope, attemptId);
    assertAttemptCanBeConducted(attempt);

    ensureQuestionRangeValid(input);

    const boundary = resolveAttemptBoundary({
      type: attempt.exam.type,
      examBranch: attempt.exam.examBranch
    });

    if (!isRangeWithinBoundary(boundary, input)) {
      throw new AppError("السؤال اليدوي يجب أن يكون ضمن نطاق الاختبار", 400);
    }

    await quranService.calculateRange(input);

    const updatedAttempt = await examsRepository.createAttemptQuestion({
      attemptId,
      source: ExamQuestionSource.MANUAL,
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: input.toSurah,
      toAyah: input.toAyah
    });

    if (!updatedAttempt) {
      throw new AppError("فشل في إنشاء السؤال اليدوي", 500);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: attempt.circle.centerId,
      circleId: attempt.circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attempt.id,
      summary: "تمت إضافة سؤال يدوي إلى محاولة الاختبار",
      metadata: {
        questionSource: ExamQuestionSource.MANUAL,
        fromSurah: input.fromSurah,
        fromAyah: input.fromAyah,
        toSurah: input.toSurah,
        toAyah: input.toAyah,
        questionCount: updatedAttempt.questions.length
      }
    });

    return serializeAttempt(updatedAttempt);
  },

  async deleteAttemptQuestion(scope: ScopeContext, attemptId: number, questionId: number) {
    examsDomain.assertCanScoreAttempt(scope);

    const attempt = await getAttemptInScope(scope, attemptId);
    assertAttemptCanBeConducted(attempt);

    const updatedAttempt = await examsRepository.deleteAttemptQuestion({
      attemptId,
      questionId
    });

    if (!updatedAttempt) {
      throw new AppError("السؤال غير موجود في هذه المحاولة", 404);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: attempt.circle.centerId,
      circleId: attempt.circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attempt.id,
      summary: "تم حذف سؤال من محاولة الاختبار",
      metadata: {
        questionId,
        questionCount: updatedAttempt.questions.length
      }
    });

    return serializeAttempt(updatedAttempt);
  },

  async scoreAttempt(scope: ScopeContext, attemptId: number, input: ScoreAttemptInput) {
    examsDomain.assertCanScoreAttempt(scope);

    const attempt = await getAttemptInScope(scope, attemptId);
    assertAttemptCanBeConducted(attempt);

    const questionPayloadMap = new Map(
      (input.questions ?? []).map((question) => [question.id, question])
    );
    const mergedQuestions = attempt.questions.map((question) => {
      const incoming = questionPayloadMap.get(question.id);
      if (!incoming) {
        return question;
      }

      return {
        ...question,
        promptingDeductions: incoming.promptingDeductions,
        remindingDeductions: incoming.remindingDeductions,
        tajweedDeductions: incoming.tajweedDeductions,
        isEvaluated: incoming.isEvaluated
      };
    });

    if (mergedQuestions.length === 0) {
      throw new AppError("سؤال اختبار واحد على الأقل مطلوب قبل التقييم", 400);
    }

    if (mergedQuestions.some((question) => !question.isEvaluated)) {
      throw new AppError("جميع الأسئلة المولدة يجب تقييمها قبل اعتماد النتيجة", 400);
    }

    const promptingDeductions = mergedQuestions.reduce(
      (sum, question) => sum + question.promptingDeductions,
      0
    );
    const remindingDeductions = mergedQuestions.reduce(
      (sum, question) => sum + question.remindingDeductions,
      0
    );
    const tajweedDeductions = mergedQuestions.reduce(
      (sum, question) => sum + question.tajweedDeductions,
      0
    );

    const totalScore = examsDomain.computeTotalScore({
      memorizationScore: input.memorizationScore,
      tajweedScore: input.tajweedScore + input.theoreticalTajweedScore,
      performanceScore: input.performanceScore,
      promptingDeductions,
      remindingDeductions,
      tajweedDeductions,
      maxScore: attempt.exam.maxScore
    });
    const percentage = attempt.exam.maxScore
      ? (totalScore / attempt.exam.maxScore) * 100
      : 0;
    const gradeLabel = await gradeScalesService.resolveLabel(scope.organizationId, percentage);

    const scoredAttempt = await examsRepository.scoreAttempt({
      attemptId,
      evaluatedById: scope.userId,
      totalScore,
      gradeLabel,
      committeeNotes: input.committeeNotes,
      strengthNotes: input.strengthNotes,
      weaknessNotes: input.weaknessNotes,
      memorizationScore: input.memorizationScore,
      tajweedScore: input.tajweedScore,
      theoreticalTajweedScore: input.theoreticalTajweedScore,
      performanceScore: input.performanceScore,
      promptingDeductions,
      remindingDeductions,
      tajweedDeductions,
      questionUpdates: mergedQuestions.map((question) => ({
        id: question.id,
        promptingDeductions: question.promptingDeductions,
        remindingDeductions: question.remindingDeductions,
        tajweedDeductions: question.tajweedDeductions,
        isEvaluated: question.isEvaluated
      }))
    });

    if (!scoredAttempt) {
      throw new AppError("فشل في تقييم محاولة الاختبار", 500);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: attempt.circle.centerId,
      circleId: attempt.circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.SCORE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attempt.id,
      summary: "تم اعتماد نتيجة محاولة اختبار",
      metadata: {
        examId: attempt.examId,
        studentId: attempt.studentId,
        totalScore,
        gradeLabel
      }
    });

    return serializeAttempt(scoredAttempt);
  },

  async shareAttemptResult(scope: ScopeContext, attemptId: number) {
    examsDomain.assertCanShareResult(scope);

    const attempt = await getAttemptInScope(scope, attemptId);

    if (!attempt.reviewedAt) {
      throw new AppError("النتيجة يمكن مشاركتها فقط بعد مراجعة الاختبار", 400);
    }

    const result = await notifyAttemptResultShared(scope, attemptId);

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: attempt.circle.centerId,
      circleId: attempt.circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attempt.id,
      summary: "تم إرسال نتيجة الاختبار للمستفيدين",
      metadata: {
        examId: attempt.examId,
        studentId: attempt.studentId,
        createdCount: result.createdCount
      }
    });

    return result;
  }
};
