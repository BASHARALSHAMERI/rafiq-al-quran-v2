import { AppError } from "../../shared/errors/app-error";
import { SURAH_AYAH_COUNTS, getSurahAyahCount } from "../../shared/quran/surah-ayah-counts";

export type QuestionRange = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
};

export type JuzBoundary = QuestionRange;

type SupportedExam = {
  type: string;
  examBranch?: string | null;
};

export const JUZ_BRANCH_LABELS = [
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

export const JUZ_BOUNDARIES: JuzBoundary[] = [
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

export const JUZ_CATEGORICAL_BOUNDARIES: Record<string, JuzBoundary> = {
  "الجزأين الأخيرين (تبارك وعم)": { fromSurah: 67, fromAyah: 1, toSurah: 114, toAyah: 6 },
  "الثلاثة أجزاء الأخيرة (قد سمع - الناس)": {
    fromSurah: 58,
    fromAyah: 1,
    toSurah: 114,
    toAyah: 6
  },
  "الخمسة أجزاء الأخيرة (الأحقاف - الناس)": {
    fromSurah: 46,
    fromAyah: 1,
    toSurah: 114,
    toAyah: 6
  },
  "العشرة أجزاء الأخيرة (العنكبوت - الناس)": {
    fromSurah: 29,
    fromAyah: 46,
    toSurah: 114,
    toAyah: 6
  },
  "الخمسة عشر جزءًا (مريم - الناس)": {
    fromSurah: 19,
    fromAyah: 1,
    toSurah: 114,
    toAyah: 6
  }
};

export const questionRangeKey = (range: QuestionRange) =>
  `${range.fromSurah}:${range.fromAyah}-${range.toSurah}:${range.toAyah}`;

export const buildGeneratedQuestionRanges = (
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

export const buildSmartSingleQuestionRange = (
  fromSurah: number,
  toSurah: number
): QuestionRange => {
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

export const buildNonDuplicateSmartSingleQuestionRange = (
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

export const estimateAyahSpan = (range: QuestionRange): number => {
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

export const estimatePageNumber = (surah: number, ayah: number): number => {
  const totalAyahs = SURAH_AYAH_COUNTS.reduce((sum, count) => sum + count, 0);
  let ayahsBefore = 0;

  for (let index = 0; index < surah - 1; index += 1) {
    ayahsBefore += SURAH_AYAH_COUNTS[index] ?? 0;
  }

  const absoluteAyah = ayahsBefore + ayah;
  return Math.max(1, Math.min(604, Math.ceil((absoluteAyah / totalAyahs) * 604)));
};

export const estimateLineCount = (ayahSpan: number): number =>
  Math.max(1, Math.min(15, Math.ceil(ayahSpan / 2)));

export const estimateDifficultyLevel = (ayahSpan: number, surahSpread: number): number => {
  let level = 1;
  if (ayahSpan >= 4) level += 1;
  if (ayahSpan >= 8) level += 1;
  if (ayahSpan >= 12) level += 1;
  if (surahSpread > 0) level += 1;
  return Math.max(1, Math.min(5, level));
};

export const parseBranchIndex = (branch?: string | null): number | null => {
  const normalized = branch?.trim();
  if (!normalized) {
    return null;
  }

  const directIndex = JUZ_BRANCH_LABELS.findIndex((label) => label === normalized);
  if (directIndex >= 0) {
    return directIndex + 1;
  }

  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const westernDigits = normalized.replace(/[٠-٩]/g, (digit) =>
    String(arabicDigits.indexOf(digit))
  );
  const matchedNumber = westernDigits.match(/\d+/)?.[0];
  if (!matchedNumber) {
    return null;
  }

  const parsed = Number(matchedNumber);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 30 ? parsed : null;
};

export const resolveAttemptBoundary = (exam: SupportedExam): JuzBoundary => {
  if (exam.type === "FULL_QURAN") {
    return { fromSurah: 1, fromAyah: 1, toSurah: 114, toAyah: 6 };
  }

  const normalizedBranch = exam.examBranch?.trim();
  if (normalizedBranch && JUZ_CATEGORICAL_BOUNDARIES[normalizedBranch]) {
    return JUZ_CATEGORICAL_BOUNDARIES[normalizedBranch];
  }

  const branchIndex = parseBranchIndex(normalizedBranch);
  if (!branchIndex) {
    throw new AppError("JUZ template is missing a valid examBranch", 400);
  }

  return JUZ_BOUNDARIES[branchIndex - 1];
};

export const resolveAttemptBoundarySafe = (
  exam?: { type?: string | null; examBranch?: string | null } | null
): JuzBoundary | null => {
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

export const isRangeWithinBoundary = (
  boundary: JuzBoundary,
  range: QuestionRange
): boolean => {
  const boundaryStartsBeforeOrAtRange =
    boundary.fromSurah < range.fromSurah ||
    (boundary.fromSurah === range.fromSurah && boundary.fromAyah <= range.fromAyah);
  const boundaryEndsAfterOrAtRange =
    boundary.toSurah > range.toSurah ||
    (boundary.toSurah === range.toSurah && boundary.toAyah >= range.toAyah);

  return boundaryStartsBeforeOrAtRange && boundaryEndsAfterOrAtRange;
};

export const buildAttemptQuestionRanges = (
  boundary: JuzBoundary,
  count: number
): QuestionRange[] => {
  const totalCount = Math.max(1, Math.min(20, Math.round(count)));
  const surahIds = Array.from(
    { length: boundary.toSurah - boundary.fromSurah + 1 },
    (_, index) => boundary.fromSurah + index
  );

  return Array.from({ length: totalCount }, (_, index) => {
    const randomOffset = Math.floor(Math.random() * surahIds.length);
    const surahId = surahIds[(index + randomOffset) % surahIds.length];
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
