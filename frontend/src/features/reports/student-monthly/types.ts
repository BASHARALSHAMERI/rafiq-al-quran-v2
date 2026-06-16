/**
 * أنواع "التقرير الشهري التفصيلي للطالب" (طباعة / PDF)
 * ─────────────────────────────────────────────────────────
 * - `StudentMonthlyDetailedReport` هو الشكل الذي يستهلكه مكوّن الطباعة.
 * - `StudentMonthlyApiResponse` يصف الشكل الحقيقي لاستجابة:
 *     GET /reports/student/:id?month=&year=
 *   (نوع `StudentReportPayload` في types.ts العام مبسّط ولا يغطي كل الحقول،
 *    لذا نُعرّف هنا نوعًا أدق للاستخدام داخل الـ Adapter — دون تعديل Backend).
 */

/* ─── الشكل النهائي للتقرير الطباعي ─── */

export type StudentMonthlyAttendanceStatus =
  | "present"
  | "absent_excused"
  | "absent_unexcused"
  | "late"
  | "not_recorded";

export type StudentMonthlyDailyRow = {
  index: number;
  dayName: string;
  date: string;
  attendanceStatus: StudentMonthlyAttendanceStatus;
  memorization?: {
    fromSurah?: string;
    fromPosition?: string;
    toSurah?: string;
    toPosition?: string;
    pagesCount?: number;
    grade?: string;
  };
  revision?: {
    fromSurah?: string;
    fromPosition?: string;
    toSurah?: string;
    toPosition?: string;
    pagesCount?: number;
    grade?: string;
  };
  mutun?: {
    matnName?: string;
    lessonOrChapter?: string;
    pagesCount?: number;
    grade?: string;
  };
  note?: string;
};

export type GroupAchievementType =
  | "tajweed"
  | "tafseer"
  | "activity"
  | "group_revision"
  | "exam"
  | "other";

export type GroupAchievementRow = {
  index: number;
  dayName: string;
  date: string;
  type: GroupAchievementType;
  typeLabel: string;
  lessonTitle: string;
  note?: string;
};

export type StudentMonthlySummary = {
  memorizationPages: number;
  revisionPages: number;
  mutunPages: number;
  excusedAbsences: number;
  unexcusedAbsences: number;
  totalDays: number;
  presentDays?: number;
  lateDays?: number;
  attendanceRate?: number;
  averageGrade?: string;
};

export type StudentMonthlyDetailedReport = {
  student: {
    id: string;
    name: string;
    code?: string;
  };
  center?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  halqah: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
  report: {
    month: string;
    year: number;
    monthLabel: string;
    printedAt: string;
    printedBy?: string;
    reportNumber?: string;
  };
  dailyRows: StudentMonthlyDailyRow[];
  groupAchievements: GroupAchievementRow[];
  summary: StudentMonthlySummary;
  notes?: {
    teacherNote?: string;
    supervisorRecommendation?: string;
  };
};

/* ─── شكل استجابة الـ API الحقيقية (GET /reports/student/:id) ─── */

export type StudentApiAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type StudentApiAttendanceRow = {
  id: number;
  attendanceDate: string;
  status: StudentApiAttendanceStatus;
  note?: string | null;
  circle?: {
    id: number;
    name: string;
    center?: { id: number; name: string; logoUrl?: string | null } | null;
  } | null;
};

export type StudentApiFollowUpRow = {
  id: number;
  recordDate: string;
  type: string;
  status?: string | null;
  surah?: string | null;
  fromSurah?: string | null;
  fromAyah?: number | null;
  toSurah?: string | null;
  toAyah?: number | null;
  ayahCount?: number | null;
  fromPage?: number | null;
  toPage?: number | null;
  pagesCount?: number | null;
  rating?: number | null;
  matnId?: number | null;
  matnName?: string | null;
  matnStatus?: string | null;
  notes?: string | null;
  teacher?: { id: number; fullName: string } | null;
  circle?: {
    id: number;
    name: string;
    center?: { id: number; name: string; logoUrl?: string | null } | null;
  } | null;
};

export type StudentApiActivityRow = {
  id: number;
  title: string;
  activityType: string;
  activityDate: string;
  description?: string | null;
  circleName?: string | null;
};

export type StudentMonthlyApiResponse = {
  student: {
    id: number;
    fullName: string;
    code?: string | null;
  };
  period: {
    month: number;
    year: number;
    from: string;
    to: string;
  };
  kpis?: {
    attendance?: {
      total?: number;
      present?: number;
      absent?: number;
      late?: number;
      excused?: number;
      presentRate?: number;
    };
    followUp?: {
      total?: number;
      averageRating?: number;
    };
  };
  attendance: StudentApiAttendanceRow[];
  followUps: StudentApiFollowUpRow[];
  activities: StudentApiActivityRow[];
};
