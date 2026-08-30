/**
 * Adapter: تحويل استجابة GET /reports/student/:id?month=&year=
 * إلى الشكل الطباعي StudentMonthlyDetailedReport.
 *
 * مبادئ صارمة:
 * - لا بيانات تجريبية / ثابتة / fallback وهمي.
 * - كل القيم مشتقة من بيانات الـ API الحقيقية فقط.
 * - أيام الغياب تظهر كصفوف بحقول إنجاز فارغة (لا تُحذف، لا تُملأ ببيانات وهمية).
 */

import type {
  GroupAchievementRow,
  GroupAchievementType,
  StudentApiActivityRow,
  StudentApiAttendanceRow,
  StudentApiFollowUpRow,
  StudentMonthlyApiResponse,
  StudentMonthlyDailyRow,
  StudentMonthlyDetailedReport,
  StudentMonthlySummary,
} from "./types";

const ARABIC_WEEKDAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/** مفتاح اليوم (YYYY-MM-DD) من سلسلة تاريخ ISO أو تاريخ منسّق. */
const dateKey = (value: string): string => (value ? value.slice(0, 10) : "");

/** بناء كائن Date ثابت زمنيًا من مفتاح YYYY-MM-DD (UTC لتجنّب إزاحة المنطقة الزمنية). */
const parseKey = (key: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};

const dayNameFromKey = (key: string): string => {
  const d = parseKey(key);
  return d ? ARABIC_WEEKDAYS[d.getUTCDay()] : "";
};

/** تنسيق التاريخ كـ dd-mm-yyyy. */
const formatDate = (key: string): string => {
  const d = parseKey(key);
  if (!d) return key;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
};

/** تحويل التقييم الرقمي إلى تقدير نصي. القيم غير الصالحة تُرجع undefined. */
export const ratingToGrade = (rating?: number | null): string | undefined => {
  if (rating == null || Number.isNaN(rating)) return undefined;
  const r = Math.round(rating);
  if (r >= 5) return "ممتاز";
  if (r === 4) return "جيد جدًا";
  if (r === 3) return "جيد";
  if (r === 2) return "مقبول";
  if (r === 1) return "يحتاج متابعة";
  return undefined;
};

const positionLabel = (
  ayah?: number | null,
  page?: number | null
): string | undefined => {
  if (typeof ayah === "number") return String(ayah);
  if (typeof page === "number") return `ص ${page}`;
  return undefined;
};

const num = (value?: number | null): number => (typeof value === "number" ? value : 0);

/** تصنيف نوع سجل المتابعة. */
const isMemorization = (type: string) => type === "NEW_MEMORIZATION";
const isRevision = (type: string) => type === "REVIEW";
const isMutun = (row: StudentApiFollowUpRow) => row.type === "MATN";

/** أعلى تقييم نصّي ضمن مجموعة سجلات (يُمثّل تقدير اليوم). */
const groupGrade = (rows: StudentApiFollowUpRow[]): string | undefined => {
  const ratings = rows
    .map((r) => r.rating)
    .filter((r): r is number => typeof r === "number");
  if (ratings.length === 0) return undefined;
  return ratingToGrade(Math.max(...ratings));
};

/** أول قيمة غير فارغة لحقل سورة (من البداية) مع مدى من الأقدم للأحدث. */
const buildSpanSection = (rows: StudentApiFollowUpRow[]) => {
  if (rows.length === 0) return undefined;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const pagesCount = rows.reduce((sum, r) => sum + num(r.pagesCount), 0);
  return {
    fromSurah: first.fromSurah ?? first.surah ?? undefined,
    fromPosition: positionLabel(first.fromAyah, first.fromPage),
    toSurah: last.toSurah ?? last.surah ?? first.fromSurah ?? undefined,
    toPosition: positionLabel(last.toAyah, last.toPage),
    pagesCount: pagesCount || undefined,
    grade: groupGrade(rows),
  };
};

const buildMutunSection = (rows: StudentApiFollowUpRow[]) => {
  if (rows.length === 0) return undefined;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const pagesCount = rows.reduce((sum, r) => sum + num(r.pagesCount), 0);
  const fromTo = [first.matnFromRef, last.matnToRef].filter(Boolean).join(" - ");
  return {
    matnName: first.matnName ?? first.matn?.titleAr ?? undefined,
    lessonOrChapter: fromTo || first.notes || undefined,
    pagesCount: pagesCount || undefined,
    grade: groupGrade(rows),
  };
};

const mapAttendanceStatus = (
  status?: StudentApiAttendanceRow["status"]
): StudentMonthlyDailyRow["attendanceStatus"] => {
  switch (status) {
    case "PRESENT":
      return "present";
    case "LATE":
      return "late";
    case "EXCUSED":
    case "ON_LEAVE":
      return "absent_excused";
    case "ABSENT":
      return "absent_unexcused";
    default:
      return "not_recorded";
  }
};

const ACTIVITY_TYPE_MAP: Record<string, { type: GroupAchievementType; label: string }> = {
  TAJWEED: { type: "tajweed", label: "درس تجويد" },
  TAFSEER: { type: "tafseer", label: "تفسير" },
  TAFSIR: { type: "tafseer", label: "تفسير" },
  ACTIVITY: { type: "activity", label: "نشاط تربوي" },
  EDUCATIONAL: { type: "activity", label: "نشاط تربوي" },
  GROUP_REVIEW: { type: "group_revision", label: "مراجعة جماعية" },
  REVIEW: { type: "group_revision", label: "مراجعة جماعية" },
  EXAM: { type: "exam", label: "اختبار جماعي" },
  TEST: { type: "exam", label: "اختبار جماعي" },
};

const mapActivityType = (
  raw: string
): { type: GroupAchievementType; label: string } => {
  const key = (raw || "").toUpperCase();
  return ACTIVITY_TYPE_MAP[key] ?? { type: "other", label: raw || "إنجاز جماعي" };
};

/** اشتقاق اسم الحلقة من أول مصدر متاح في الحضور أو المتابعة. */
const resolveHalqah = (
  api: StudentMonthlyApiResponse
): { id: string; name: string } => {
  const fromAttendance = api.attendance.find((r) => r.circle?.name);
  if (fromAttendance?.circle) {
    return { id: String(fromAttendance.circle.id), name: fromAttendance.circle.name };
  }
  const fromFollowUp = api.followUps.find((r) => r.circle?.name);
  if (fromFollowUp?.circle) {
    return { id: String(fromFollowUp.circle.id), name: fromFollowUp.circle.name };
  }
  return { id: "", name: "—" };
};

const resolveCenter = (
  api: StudentMonthlyApiResponse
): { id: string; name: string; logoUrl?: string } | undefined => {
  const src =
    api.attendance.find((r) => r.circle?.center?.name)?.circle?.center ??
    api.followUps.find((r) => r.circle?.center?.name)?.circle?.center;
  return src ? { id: String(src.id), name: src.name, logoUrl: src.logoUrl ?? undefined } : undefined;
};

const resolveTeacher = (
  api: StudentMonthlyApiResponse
): { id: string; name: string } | undefined => {
  const src = api.followUps.find((r) => r.teacher?.fullName)?.teacher;
  return src ? { id: String(src.id), name: src.fullName } : undefined;
};

/**
 * تحويل الاستجابة الكاملة إلى التقرير الطباعي.
 */
export const adaptStudentMonthlyReport = (
  api: StudentMonthlyApiResponse,
  options?: { printedAt?: string }
): StudentMonthlyDetailedReport => {
  // فهرسة الحضور حسب التاريخ.
  const attendanceByDate = new Map<string, StudentApiAttendanceRow>();
  for (const row of api.attendance) {
    const key = dateKey(row.attendanceDate);
    if (key && !attendanceByDate.has(key)) attendanceByDate.set(key, row);
  }

  // تجميع المتابعة حسب التاريخ (FINAL فقط).
  const finalFollowUps = api.followUps.filter((r) => r.status === "FINAL");
  const followUpsByDate = new Map<string, StudentApiFollowUpRow[]>();
  for (const row of finalFollowUps) {
    const key = dateKey(row.recordDate);
    if (!key) continue;
    const list = followUpsByDate.get(key) ?? [];
    list.push(row);
    followUpsByDate.set(key, list);
  }

  // قائمة الأيام = اتحاد تواريخ الحضور وتواريخ المتابعة، مرتبة تصاعديًا.
  const allDates = Array.from(
    new Set<string>([
      ...attendanceByDate.keys(),
      ...followUpsByDate.keys(),
      ...api.activities.map((activity) => dateKey(activity.activityDate)),
    ])
  )
    .filter(Boolean)
    .sort();

  const dailyRows: StudentMonthlyDailyRow[] = allDates.map((key, idx) => {
    const attendance = attendanceByDate.get(key);
    const status = mapAttendanceStatus(attendance?.status);
    const isAbsent = status === "absent_excused" || status === "absent_unexcused";

    const dayFollowUps = [...(followUpsByDate.get(key) ?? [])].sort((a, b) => a.id - b.id);
    const memoRows = dayFollowUps.filter((r) => isMemorization(r.type));
    const revRows = dayFollowUps.filter((r) => isRevision(r.type));
    const mutunRows = dayFollowUps.filter((r) => isMutun(r));

    return {
      index: idx + 1,
      dayName: dayNameFromKey(key),
      date: formatDate(key),
      attendanceStatus: status,
      // في يوم الغياب تبقى حقول الإنجاز فارغة.
      memorization: isAbsent ? undefined : buildSpanSection(memoRows),
      revision: isAbsent ? undefined : buildSpanSection(revRows),
      mutun: isAbsent ? undefined : buildMutunSection(mutunRows),
      note: attendance?.note ?? undefined,
    };
  });

  // جدول الإنجاز الجماعي.
  const groupAchievements: GroupAchievementRow[] = [...api.activities]
    .sort((a, b) => dateKey(a.activityDate).localeCompare(dateKey(b.activityDate)))
    .map((activity: StudentApiActivityRow, idx) => {
      const mapped = mapActivityType(activity.activityType);
      const key = dateKey(activity.activityDate);
      return {
        index: idx + 1,
        dayName: dayNameFromKey(key),
        date: formatDate(key),
        type: mapped.type,
        typeLabel: mapped.label,
        lessonTitle: activity.title,
        note: activity.description ?? undefined,
      };
    });

  // الملخص — يُحسب من بيانات الـ API الحقيقية فقط (FINAL).
  const memorizationPages = finalFollowUps
    .filter((r) => isMemorization(r.type))
    .reduce((sum, r) => sum + num(r.pagesCount), 0);
  const revisionPages = finalFollowUps
    .filter((r) => isRevision(r.type))
    .reduce((sum, r) => sum + num(r.pagesCount), 0);
  const mutunPages = finalFollowUps
    .filter((r) => isMutun(r))
    .reduce((sum, r) => sum + num(r.pagesCount), 0);

  const kpiAttendance = api.kpis?.attendance;
  const excusedAbsences =
    kpiAttendance?.excused ??
    dailyRows.filter((r) => r.attendanceStatus === "absent_excused").length;
  const unexcusedAbsences =
    kpiAttendance?.absent ??
    dailyRows.filter((r) => r.attendanceStatus === "absent_unexcused").length;
  const presentDays =
    (kpiAttendance?.present ??
      dailyRows.filter((r) => r.attendanceStatus === "present").length) +
    (kpiAttendance?.late ??
      dailyRows.filter((r) => r.attendanceStatus === "late").length);
  const lateDays =
    kpiAttendance?.late ??
    dailyRows.filter((r) => r.attendanceStatus === "late").length;

  const summary: StudentMonthlySummary = {
    memorizationPages,
    revisionPages,
    mutunPages,
    excusedAbsences,
    unexcusedAbsences,
    totalDays: dailyRows.length,
    presentDays,
    lateDays,
    attendanceRate:
      typeof kpiAttendance?.presentRate === "number"
        ? kpiAttendance.presentRate
        : undefined,
    averageGrade: ratingToGrade(api.kpis?.followUp?.averageRating),
  };

  const monthNumber = api.period.month;
  const monthLabel = `${ARABIC_MONTHS[Math.max(0, Math.min(11, monthNumber - 1))]} ${api.period.year}`;

  return {
    student: {
      id: String(api.student.id),
      name: api.student.fullName,
      code: api.student.code ?? undefined,
    },
    center: resolveCenter(api),
    halqah: resolveHalqah(api),
    teacher: resolveTeacher(api),
    report: {
      month: String(monthNumber).padStart(2, "0"),
      year: api.period.year,
      monthLabel,
      printedAt: options?.printedAt ?? new Date().toISOString(),
    },
    dailyRows,
    groupAchievements,
    summary,
  };
};

/**
 * بناء تقرير فارغ مبني على معلومات الفلاتر فقط.
 * يُستخدم عند فشل API أو عندما لا توجد أيام مسجلة،
 * لضمان إمكانية طباعة / تصدير التقرير دائمًا.
 */
export const buildEmptyStudentMonthlyReport = (opts: {
  studentId: string;
  studentName: string;
  month: number;
  year: number;
}): StudentMonthlyDetailedReport => {
  const monthLabel = `${ARABIC_MONTHS[Math.max(0, Math.min(11, opts.month - 1))]} ${opts.year}`;
  return {
    student: {
      id: opts.studentId,
      name: opts.studentName,
    },
    halqah: { id: "", name: "—" },
    report: {
      month: String(opts.month).padStart(2, "0"),
      year: opts.year,
      monthLabel,
      printedAt: new Date().toISOString(),
    },
    dailyRows: [],
    groupAchievements: [],
    summary: {
      memorizationPages: 0,
      revisionPages: 0,
      mutunPages: 0,
      excusedAbsences: 0,
      unexcusedAbsences: 0,
      totalDays: 0,
    },
  };
};
