import { useState, useMemo, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  CircleDot,
  ClipboardCheck,
  FileCheck2,
  FileText,
  HandHeart,
  Printer,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  Star,
  Users,
  Wallet2,
  Activity,
  FileDown,
  ArrowLeft,
  Award
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { useI18n } from "../app/i18n";
import { useAuthStore } from "../features/auth/auth.store";
import { useCentersQuery, useCirclesQuery, useOrgBrandingQuery } from "../features/org/org.hooks";
import { printSummaryReport } from "../features/accounting/printAccounting";
import { canReadCenters } from "../features/org/org.permissions";
import {
  useReportQuery,
  useCentersSummaryQuery,
  useCirclesSummaryQuery,
  useStudentsSummaryQuery,
  useGoldenRecordsSummaryQuery,
  useExportReportMutation,
} from "../features/reports/reports.hooks";
import { ErrorState } from "../components/ui/ErrorState";
import type { ReportsFilters, ReportType } from "../features/reports/types";
import { ReportsSummaryCards } from "../features/reports/components/ReportsSummaryCards";
import { MonthlyStaffReportView } from "../features/staff-attendance/components/MonthlyStaffReportView";

import { UNIFIED_CATALOG } from "../features/reports/reports-catalog.unified";
import "../styles/pages/centers-modern.css";
import "../styles/pages/finance-premium.css";
import "../styles/pages/finance-v4.css";

/* ─── Animation helpers ─── */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/* ─── Defaults ─── */
const nowDate = new Date();
const defaultTo = nowDate.toISOString().slice(0, 10);
const defaultFrom = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 30)
  .toISOString()
  .slice(0, 10);

/* ─── Types ─── */
type ReportStatus = "ready" | "needs-data" | "coming-soon";
type ViewLevel = "CATALOG" | "UNIFIED" | "STAFF";
type SectionFilter = "all" | "admin" | "educational" | "attendance" | "exams" | "golden" | "finance" | "official" | "financial-reports" | "audit-reports" | "operational-sheets" | "donors-reports" | "receipts-reports";
type StatusFilter = "all" | "ready" | "coming-soon" | "needs-data";
type OutputFilter = "all" | "screen" | "print" | "pdf" | "excel";
type OutputTag = "screen" | "print" | "pdf" | "excel";
type ScopeTag = "org" | "center" | "circle" | "student" | "finance";
type RoleVisibility = "all" | "super" | "center";

type ReportCardDef = {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: ComponentType<{ className?: string; size?: number | string }>;
  status: ReportStatus;
  kind?: "report" | "inline-report" | "summary-report" | "external-route" | "operational-list" | "coming-soon";
  reportType?: ReportType;
  summaryKey?: "centers" | "circles" | "students" | "golden-records";
  href?: string;
  section: SectionFilter;
  scope: ScopeTag;
  outputs: OutputTag[];
  featured?: boolean;
  visibility: RoleVisibility;
};

type ReportGroupDef = {
  id: SectionFilter;
  nameAr: string;
  nameEn: string;
  color: string;
  icon: ComponentType<{ className?: string; size?: number | string }>;
  cards: ReportCardDef[];
};

/* ─── Report Catalog ─── */
const REPORT_GROUPS: ReportGroupDef[] = [
  {
    id: "admin", nameAr: "نظرة عامة وإدارة", nameEn: "Overview & Admin", color: "teal", icon: Building2,
    cards: [
      { id: "centers-summary", nameAr: "نظرة عامة على الجمعية", nameEn: "Organization Overview", descAr: "عدد المراكز والحلقات والموظفين", descEn: "Centers, circles and staff counts", icon: Building2, status: "ready", summaryKey: "centers", section: "admin", scope: "org", outputs: ["screen", "print", "excel"], featured: true, visibility: "super" },
      { id: "circles-summary", nameAr: "تقرير الحلقات", nameEn: "Circles Report", descAr: "الحلقات حسب المركز والمعلم والطلاب", descEn: "Circles by center, teacher and students", icon: CircleDot, status: "ready", summaryKey: "circles", section: "admin", scope: "center", outputs: ["screen", "print", "excel"], visibility: "all" },
      { id: "students-summary", nameAr: "تقرير الطلاب", nameEn: "Students Report", descAr: "الطلاب حسب المركز والحالة", descEn: "Students by center and status", icon: Users, status: "ready", summaryKey: "students", section: "admin", scope: "center", outputs: ["screen", "print", "excel"], visibility: "all" },
    ],
  },
  {
    id: "educational", nameAr: "تقارير تعليمية وحضور", nameEn: "Education & Attendance", color: "teal", icon: BookOpen,
    cards: [
      { id: "follow-up", nameAr: "التقرير الشهري التفصيلي للطالب", nameEn: "Student Monthly Detailed Report", descAr: "تقرير شهري تفصيلي للطالب (حفظ/مراجعة/متون/إنجاز جماعي) للطباعة و PDF", descEn: "Detailed monthly student report (memorization/review/mutun) for print & PDF", icon: Activity, status: "ready", href: "/reports/student-monthly", section: "educational", scope: "student", outputs: ["screen", "print", "pdf"], featured: true, visibility: "all" },
      { id: "attendance", nameAr: "حضور الطلاب", nameEn: "Student Attendance", descAr: "سجل الحضور والغياب والتأخير", descEn: "Attendance, absence and late records", icon: ClipboardCheck, status: "ready", reportType: "ATTENDANCE", section: "attendance", scope: "circle", outputs: ["screen", "print"], visibility: "all" },
      { id: "exams", nameAr: "نتائج الاختبارات", nameEn: "Exam Results", descAr: "النتائج والنجاح ومعدل الأداء", descEn: "Results, pass rates and performance", icon: FileCheck2, status: "ready", reportType: "EXAMS", section: "exams", scope: "center", outputs: ["screen", "print"], visibility: "all" },
      { id: "staff-report", nameAr: "حضور الكادر", nameEn: "Staff Attendance", descAr: "حضور الموظفين والإجازات والخصومات", descEn: "Staff attendance, leaves and deductions", icon: Users, status: "ready", section: "attendance", scope: "center", outputs: ["screen", "print"], visibility: "all" },
    ],
  },
  {
    id: "finance", nameAr: "تقارير مالية وللداعمين", nameEn: "Financial & Donors", color: "teal", icon: Wallet2,
    cards: [
      { id: "fin-pos", nameAr: "قائمة المركز المالي", nameEn: "Financial Position", descAr: "الأصول والخصوم وصافي الأصول للداعمين", descEn: "Assets, liabilities and net assets", icon: Scale, status: "ready", href: "/finance/reports/financial-position", section: "finance", scope: "finance", outputs: ["screen", "print", "pdf"], featured: true, visibility: "all" },
      { id: "fin-activities", nameAr: "قائمة الأنشطة", nameEn: "Statement of Activities", descAr: "الإيرادات والمصروفات والفائض", descEn: "Revenue, expenses and surplus", icon: Activity, status: "ready", href: "/finance/reports/statement-of-activities", section: "finance", scope: "finance", outputs: ["screen", "print", "pdf"], featured: true, visibility: "all" },
      { id: "fin-donations", nameAr: "التبرعات", nameEn: "Donations", descAr: "المتبرعون والحملات الداعمة", descEn: "Donors and campaigns", icon: HandHeart, status: "ready", href: "/finance/donors", section: "finance", scope: "finance", outputs: ["screen", "print"], visibility: "all" },
      { id: "fin-vouchers", nameAr: "السندات", nameEn: "Vouchers", descAr: "سندات القبض والصرف", descEn: "Receipt and payment vouchers", icon: ClipboardCheck, status: "ready", href: "/finance/vouchers", section: "finance", scope: "finance", outputs: ["screen", "print"], visibility: "all" },
      { id: "fin-expenses", nameAr: "المصروفات", nameEn: "Expenses", descAr: "المصروفات والموردون", descEn: "Expenses and suppliers", icon: FileText, status: "ready", href: "/finance/expenses", section: "finance", scope: "finance", outputs: ["screen", "print"], visibility: "all" },
      { id: "finance-invoices", nameAr: "الفواتير والتحصيل", nameEn: "Invoices & Collection", descAr: "الفواتير والمبالغ المستحقة والمحصلة", descEn: "Invoices, amounts due and collected", icon: FileText, status: "ready", reportType: "FINANCE", section: "finance", scope: "finance", outputs: ["screen", "print"], visibility: "all" },
    ],
  },
];

/* ─── Active Catalog (unified source, fallback to legacy REPORT_GROUPS) ─── */
const ACTIVE_CATALOG: ReportGroupDef[] = UNIFIED_CATALOG.length > 0 ? (UNIFIED_CATALOG as unknown as ReportGroupDef[]) : REPORT_GROUPS;
/* ─── Helpers ─── */
const ALL_CARDS = ACTIVE_CATALOG.flatMap((g) => g.cards);
const toDisplay = (value: unknown): string => {
  if (value == null) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
const humanize = (key: string) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
const statusBadge = (value: string): "default" | "success" | "warning" | "error" => {
  const upper = value.toUpperCase();
  if (["PAID", "COMPLETED", "PUBLISHED", "PASSED", "PRESENT", "SUCCESS", "APPROVED"].includes(upper)) return "success";
  if (["PARTIAL", "PENDING", "LATE", "IN_PROGRESS", "DRAFT"].includes(upper)) return "warning";
  if (["FAILED", "CANCELLED", "ABSENT", "ERROR", "REJECTED"].includes(upper)) return "error";
  return "default";
};

const statusLabelAr: Record<ReportStatus, string> = { ready: "جاهز", "needs-data": "يحتاج بيانات", "coming-soon": "قريبًا" };
const statusLabelEn: Record<ReportStatus, string> = { ready: "Ready", "needs-data": "Needs Data", "coming-soon": "Coming Soon" };

const sectionLabelAr: Record<SectionFilter, string> = { all: "الكل", admin: "إداري", educational: "التعليمية والتربوية", attendance: "حضور", exams: "اختبارات", golden: "سجل ذهبي", finance: "مالي", official: "رسمي", "financial-reports": "التقارير المالية", "audit-reports": "الرقابة والمراجعة", "operational-sheets": "الكشوف التشغيلية", "donors-reports": "التبرعات والداعمين", "receipts-reports": "الإيصالات والسندات" };
const sectionLabelEn: Record<SectionFilter, string> = { all: "All", admin: "Admin", educational: "Educational", attendance: "Attendance", exams: "Exams", golden: "Golden", finance: "Finance", official: "Official", "financial-reports": "Financial", "audit-reports": "Audit", "operational-sheets": "Operational", "donors-reports": "Donors", "receipts-reports": "Receipts" };
const statusFilterAr: Record<StatusFilter, string> = { all: "الكل", ready: "جاهز", "coming-soon": "قريبًا", "needs-data": "يحتاج ربط" };
const statusFilterEn: Record<StatusFilter, string> = { all: "All", ready: "Ready", "coming-soon": "Soon", "needs-data": "Needs Data" };
const outputFilterAr: Record<OutputFilter, string> = { all: "الكل", screen: "شاشة", print: "طباعة", pdf: "PDF", excel: "Excel" };
const outputFilterEn: Record<OutputFilter, string> = { all: "All", screen: "Screen", print: "Print", pdf: "PDF", excel: "Excel" };
const scopeLabelAr: Record<ScopeTag, string> = { org: "جمعية", center: "مركز", circle: "حلقة", student: "طالب", finance: "مالي" };

const financeSections = ["finance", "financial-reports", "audit-reports", "operational-sheets", "donors-reports", "receipts-reports"];

const canSeeCard = (card: ReportCardDef, role: string | undefined): boolean => {
  if (role === "ACCOUNTANT") return financeSections.includes(card.section);
  if (card.visibility === "all") return true;
  if (card.visibility === "super" && role === "SUPER_ADMIN") return true;
  if (card.visibility === "center" && role === "CENTER_ADMIN") return true;
  return false;
};

export default function ReportsPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const ar = language === "ar";
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canLoadCenters = canReadCenters(role);

  const [viewLevel, setViewLevel] = useState<ViewLevel>("CATALOG");
  const [activeReportType, setActiveReportType] = useState<ReportType>("ATTENDANCE");
  const [activeSummary, setActiveSummary] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const activeCard = useMemo(() => ALL_CARDS.find(c => c.id === activeCardId), [activeCardId]);
  const [filters, setFilters] = useState<ReportsFilters>({ from: defaultFrom, to: defaultTo, search: "" });
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const exportMut = useExportReportMutation();
  const brandingQ = useOrgBrandingQuery({ enabled: viewLevel === "UNIFIED" && !!activeSummary });

  /* catalog filters */
  const [searchQ, setSearchQ] = useState("");
  const [secFilter, setSecFilter] = useState<SectionFilter>("all");
  const [statusFlt, setStatusFlt] = useState<StatusFilter>("all");
  const [outputFlt, setOutputFlt] = useState<OutputFilter>("all");

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const circlesQ = useCirclesQuery(filters.centerId, { enabled: canLoadCenters && !!filters.centerId });

  /* Standard report queries */
  const unifiedQ = useReportQuery(activeReportType, filters, viewLevel === "UNIFIED" && !activeSummary);
  const centersSumQ = useCentersSummaryQuery(viewLevel === "UNIFIED" && activeSummary === "centers");
  const circlesSumQ = useCirclesSummaryQuery(filters.centerId, viewLevel === "UNIFIED" && activeSummary === "circles");
  const studentsSumQ = useStudentsSummaryQuery(
    { centerId: filters.centerId, circleId: filters.circleId },
    viewLevel === "UNIFIED" && activeSummary === "students"
  );
  const goldenSumQ = useGoldenRecordsSummaryQuery(filters.centerId, viewLevel === "UNIFIED" && activeSummary === "golden-records");

  const activeQuery = activeSummary === "centers" ? centersSumQ
    : activeSummary === "circles" ? circlesSumQ
    : activeSummary === "students" ? studentsSumQ
    : activeSummary === "golden-records" ? goldenSumQ
    : unifiedQ;

  /* visible cards for current role */
  const visibleCards = useMemo(() => ALL_CARDS.filter((c) => canSeeCard(c, role)), [role]);

  /* filtered catalog */
  const filteredGroups = useMemo(() => {
    const lq = searchQ.toLowerCase();
    return ACTIVE_CATALOG.map((g) => {
      const cards = g.cards.filter((c) => {
        if (!canSeeCard(c, role)) return false;
        if (secFilter !== "all" && c.section !== secFilter) return false;
        if (statusFlt !== "all" && c.status !== statusFlt) return false;
        if (outputFlt !== "all" && !c.outputs.includes(outputFlt as OutputTag)) return false;
        if (lq && !c.nameAr.toLowerCase().includes(lq) && !c.nameEn.toLowerCase().includes(lq)) return false;
        return true;
      });
      return { ...g, cards };
    }).filter((g) => g.cards.length > 0);
  }, [role, searchQ, secFilter, statusFlt, outputFlt]);

  /* stats computed from catalog */
  const stats = useMemo(() => {
    const total = visibleCards.length;
    const ready = visibleCards.filter((c) => c.status === "ready").length;
    const finance = visibleCards.filter((c) => financeSections.includes(c.section)).length;
    const printable = visibleCards.filter((c) => c.outputs.some((o) => o === "print" || o === "pdf")).length;
    const soon = visibleCards.filter((c) => c.status !== "ready").length;
    return { total, ready, finance, printable, soon };
  }, [visibleCards]);

  const featuredCards = useMemo(() => visibleCards.filter((c) => c.featured), [visibleCards]);

  const hasActiveFilters = searchQ || secFilter !== "all" || statusFlt !== "all" || outputFlt !== "all";
  const resetCatalogFilters = () => { setSearchQ(""); setSecFilter("all"); setStatusFlt("all"); setOutputFlt("all"); };

  /* unified table helpers */
  const activeQueryData = (activeQuery as any).data;
  const rawRows = useMemo(() => {
    if (!activeQueryData) return [];
    return (activeQueryData.rows ?? []) as Record<string, any>[];
  }, [activeQueryData]);

  const searchedRows = useMemo(() => {
    const s = (filters.search ?? "").trim().toLowerCase();
    if (!s) return rawRows;
    return rawRows.filter((row) => Object.values(row).some((val) => String(val ?? "").toLowerCase().includes(s)));
  }, [rawRows, filters.search]);

  const headers = useMemo(() => (searchedRows[0] ? Object.keys(searchedRows[0]) : []), [searchedRows]);
  const sortedRows = useMemo(() => {
    if (!sortKey) return searchedRows;
    return [...searchedRows].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av === bv) return 0;
      const res = av > bv ? 1 : -1;
      return sortDir === "asc" ? res : -res;
    });
  }, [searchedRows, sortKey, sortDir]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const colLabels: Record<string, string> = {
    id: ar ? "م" : "ID", name: ar ? "الاسم" : "Name", code: ar ? "الكود" : "Code",
    isActive: ar ? "نشط" : "Active", circlesCount: ar ? "عدد الحلقات" : "Circles",
    staffCount: ar ? "عدد الموظفين" : "Staff", centerName: ar ? "المركز" : "Center",
    teacherName: ar ? "المعلم" : "Teacher", studentCount: ar ? "عدد الطلاب" : "Students",
    level: ar ? "المستوى" : "Level", circleName: ar ? "الحلقة" : "Circle",
    attendanceDate: ar ? "التاريخ" : "Date", studentId: ar ? "رقم الطالب" : "Student ID",
    studentName: ar ? "الطالب" : "Student", status: ar ? "الحالة" : "Status",
    note: ar ? "ملاحظة" : "Note", attemptStatus: ar ? "حالة المحاولة" : "Attempt Status",
    score: ar ? "الدرجة" : "Score", isPassed: ar ? "ناجح" : "Passed",
    type: ar ? "النوع" : "Type", narration: ar ? "الرواية" : "Narration",
    completionDate: ar ? "تاريخ الإتمام" : "Completion Date",
    recordDate: ar ? "التاريخ" : "Date", surah: ar ? "السورة/المتن" : "Surah/Matn",
    pagesCount: ar ? "الصفحات" : "Pages", ayahCount: ar ? "الآيات" : "Ayahs",
    rating: ar ? "التقييم" : "Rating", notes: ar ? "ملاحظات" : "Notes"
  };

  /* تعريف أعمدة ثابتة لكل نوع ملخص (بدلاً من الديناميكية) */
  const SUMMARY_COLUMNS: Record<string, DataTableColumn<Record<string, any>>[]> = {
    centers: [
      { id: "index", header: ar ? "م" : "#", width: 40, align: "center", headerClassName: "text-center",
        cell: (_, i) => <span className="text-gray-400 text-xs font-bold tabular-nums">{i + 1 + (page - 1) * pageSize}</span> },
      { id: "name", header: ar ? "اسم المركز" : "Center Name",
        cell: (r) => <span className="font-semibold text-gray-800 dark:text-gray-200">{r.name}</span> },
      { id: "code", header: ar ? "الكود" : "Code", width: 80, align: "center", headerClassName: "text-center",
        cell: (r) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{r.code}</span> },
      { id: "isActive", header: ar ? "الحالة" : "Status", width: 100, align: "center", headerClassName: "text-center",
        cell: (r) => <span className={`fin-status-pill ${r.isActive ? "fin-status--success" : "fin-status--error"}`}>{r.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}</span> },
      { id: "circlesCount", header: ar ? "الحلقات" : "Circles", width: 80, align: "center", headerClassName: "text-center",
        cell: (r) => <span className="font-bold text-gray-700 dark:text-gray-300 tabular-nums">{r.circlesCount}</span> },
      { id: "staffCount", header: ar ? "الموظفين" : "Staff", width: 80, align: "center", headerClassName: "text-center",
        cell: (r) => <span className="font-bold text-gray-700 dark:text-gray-300 tabular-nums">{r.staffCount}</span> },
    ],
    circles: [
      { id: "index", header: ar ? "م" : "#", width: 40, align: "center", headerClassName: "text-center",
        cell: (_, i) => <span className="text-gray-400 text-xs font-bold tabular-nums">{i + 1 + (page - 1) * pageSize}</span> },
      { id: "name", header: ar ? "اسم الحلقة" : "Circle Name",
        cell: (r) => <span className="font-semibold text-gray-800 dark:text-gray-200">{r.name}</span> },
      { id: "isActive", header: ar ? "الحالة" : "Status", width: 100, align: "center", headerClassName: "text-center",
        cell: (r) => <span className={`fin-status-pill ${r.isActive ? "fin-status--success" : "fin-status--error"}`}>{r.isActive ? (ar ? "نشطة" : "Active") : (ar ? "غير نشطة" : "Inactive")}</span> },
      { id: "centerName", header: ar ? "المركز" : "Center", width: 150,
        cell: (r) => <span className="text-gray-600 dark:text-gray-400">{r.centerName}</span> },
      { id: "teacherName", header: ar ? "المعلم" : "Teacher", width: 150,
        cell: (r) => <span className="text-gray-600 dark:text-gray-400">{r.teacherName}</span> },
      { id: "studentCount", header: ar ? "الطلاب" : "Students", width: 80, align: "center", headerClassName: "text-center",
        cell: (r) => <Badge variant="default" className="font-bold tabular-nums">{r.studentCount}</Badge> },
    ],
    students: [
      { id: "index", header: ar ? "م" : "#", width: 40, align: "center", headerClassName: "text-center",
        cell: (_, i) => <span className="text-gray-400 text-xs font-bold tabular-nums">{i + 1 + (page - 1) * pageSize}</span> },
      { id: "name", header: ar ? "اسم الطالب" : "Student Name",
        cell: (r) => <span className="font-semibold text-gray-800 dark:text-gray-200">{r.name}</span> },
      { id: "isActive", header: ar ? "الحالة" : "Status", width: 100, align: "center", headerClassName: "text-center",
        cell: (r) => <span className={`fin-status-pill ${r.isActive ? "fin-status--success" : "fin-status--error"}`}>{r.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}</span> },
      { id: "level", header: ar ? "المستوى" : "Level", width: 100, align: "center", headerClassName: "text-center",
        cell: (r) => <span className="text-gray-500 dark:text-gray-400 text-sm">{r.level}</span> },
      { id: "circleName", header: ar ? "الحلقة" : "Circle", width: 150,
        cell: (r) => <span className="text-gray-600 dark:text-gray-400">{r.circleName}</span> },
      { id: "centerName", header: ar ? "المركز" : "Center", width: 150,
        cell: (r) => <span className="text-gray-600 dark:text-gray-400">{r.centerName}</span> },
    ],
    "golden-records": [
      { id: "index", header: ar ? "م" : "#", width: 40, align: "center", headerClassName: "text-center",
        cell: (_, i) => <span className="text-gray-400 text-xs font-bold tabular-nums">{i + 1 + (page - 1) * pageSize}</span> },
      { id: "studentName", header: ar ? "اسم الطالب" : "Student Name",
        cell: (r) => <span className="font-semibold text-gray-800 dark:text-gray-200">{r.studentName}</span> },
      { id: "type", header: ar ? "النوع" : "Type", width: 120, align: "center", headerClassName: "text-center",
        cell: (r) => <Badge variant="success">{r.type}</Badge> },
      { id: "narration", header: ar ? "الرواية" : "Narration", width: 120, align: "center", headerClassName: "text-center",
        cell: (r) => <span className="text-gray-600 dark:text-gray-400 font-medium">{r.narration}</span> },
      { id: "centerName", header: ar ? "المركز" : "Center", width: 150,
        cell: (r) => <span className="text-gray-600 dark:text-gray-400">{r.centerName}</span> },
      { id: "completionDate", header: ar ? "تاريخ الإتمام" : "Completion Date", width: 120, align: "center", headerClassName: "text-center",
        cell: (r) => <span className="text-gray-500 dark:text-gray-400 text-sm">{r.completionDate}</span> },
    ],
  };

  /* اختيار الأعمدة: ثابتة للملخصات، ديناميكية للتقارير العادية */
  const columns = useMemo<DataTableColumn<Record<string, any>>[]>(() => {
    if (activeSummary && SUMMARY_COLUMNS[activeSummary]) {
      return SUMMARY_COLUMNS[activeSummary];
    }
    /* fallback: أعمدة ديناميكية للتقارير العادية */
    return headers.map((h) => ({
      id: h,
      header: (
        <button className={`rpt-th-btn ${sortKey === h ? "rpt-th-btn--active" : ""}`} onClick={() => {
          if (sortKey === h) setSortDir((p) => (p === "asc" ? "desc" : "asc"));
          else { setSortKey(h); setSortDir("asc"); }
          setPage(1);
        }}>
          <span>{colLabels[h] ?? humanize(h)}</span>
          <ArrowUpDown className="w-3 h-3 mr-1 opacity-50" />
        </button>
      ),
      cell: (row) => {
        const val = row[h];
        if (val == null || val === "") return <span className="text-gray-300">-</span>;
        if (typeof val === "boolean") return <Badge variant={val ? "success" : "default"}>{val ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}</Badge>;
        if (typeof val === "string" && /status|state|isPassed/i.test(h)) return <Badge variant={statusBadge(val)}>{val}</Badge>;
        return <span className="text-gray-700 dark:text-gray-300">{toDisplay(val)}</span>;
      },
    }));
  }, [activeSummary, headers, sortKey, sortDir, page, pageSize, ar]);

  const reportTotals = useMemo(() => {
    if (!sortedRows || sortedRows.length === 0) return null;
    const totals: Record<string, number> = {};
    const count = sortedRows.length;
    let hasNumeric = false;

    const numericKeys = ["studentCount", "circlesCount", "staffCount", "score", "pagesCount", "ayahCount", "amount", "total", "count", "present", "absent", "late", "excused", "studentsCount"];

    if (activeSummary && SUMMARY_COLUMNS[activeSummary]) {
      /* summary totals: sum numeric fields from rows */
      const fieldMap: Record<string, string> = {
        centers: "circlesCount",
        circles: "studentCount",
      };
      const key = fieldMap[activeSummary];
      if (key) {
        const sum = sortedRows.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
        totals[key] = sum;
        if (sum > 0) hasNumeric = true;
      }
    } else {
      headers.forEach(h => {
        if (numericKeys.some(k => h.toLowerCase().includes(k.toLowerCase()))) {
          const sum = sortedRows.reduce((acc, row) => acc + (Number(row[h]) || 0), 0);
          totals[h] = sum;
          hasNumeric = true;
        }
      });
    }

    if (!hasNumeric && count === 0) return null;

    return (
      <tr>
        {(activeSummary && SUMMARY_COLUMNS[activeSummary]
          ? SUMMARY_COLUMNS[activeSummary].map((c) => c.id)
          : headers
        ).map((h: string, i: number) => {
          if (i === 0) return <td key={h} className="app-data-table__cell font-bold text-teal-700 dark:text-teal-400">{ar ? `الإجمالي (${count})` : `Total (${count})`}</td>;
          if (totals[h] !== undefined) return <td key={h} className="app-data-table__cell font-bold text-teal-700 dark:text-teal-400">{totals[h]}</td>;
          return <td key={h} className="app-data-table__cell text-gray-400">-</td>;
        })}
      </tr>
    );
  }, [sortedRows, headers, activeSummary, ar]);

  /* handlers */
  const handleBack = () => { setViewLevel("CATALOG"); setActiveSummary(null); };

  const openReport = (card: ReportCardDef) => {
    if (card.status !== "ready") return;
    if (card.href) { navigate(card.href); return; }
    if (card.id === "staff-report") { setViewLevel("STAFF"); return; }
    setActiveCardId(card.id);
    if (card.summaryKey) { setActiveSummary(card.summaryKey); setActiveReportType("ATTENDANCE"); }
    else if (card.reportType) { setActiveSummary(null); setActiveReportType(card.reportType); }
    setViewLevel("UNIFIED");
    setPage(1);
    setSortKey(null);
  };

  const refreshData = () => { void (activeQuery as any).refetch?.(); };

  const handlePrintCentersSummary = () => {
    const data = centersSumQ.data;
    if (!data) return;
    printSummaryReport({
      title: ar ? "نظرة عامة على الجمعية" : "Organization Overview",
      subtitle: ar ? "المراكز والإحصائيات" : "Centers & Statistics",
      kpis: [
        { label: ar ? "إجمالي المراكز" : "Total Centers", value: data.kpis.totalCenters },
        { label: ar ? "المراكز النشطة" : "Active Centers", value: data.kpis.activeCenters, color: "#2D9B7A" },
        { label: ar ? "المراكز غير النشطة" : "Inactive Centers", value: data.kpis.inactiveCenters, color: "#E85858" },
        { label: ar ? "إجمالي الحلقات" : "Total Circles", value: data.kpis.totalCircles },
        { label: ar ? "إجمالي الموظفين" : "Total Staff", value: data.kpis.totalStaff },
      ],
      rows: data.rows,
      columns: [
        { label: ar ? "م" : "#", render: (_: any, i: number) => i + 1, align: "center" },
        { label: ar ? "اسم المركز" : "Center Name", render: (r: any) => r.name },
        { label: ar ? "الكود" : "Code", render: (r: any) => r.code, align: "center" },
        { label: ar ? "الحالة" : "Status", render: (r: any) => r.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive"), align: "center" },
        { label: ar ? "عدد الحلقات" : "Circles", render: (r: any) => r.circlesCount, align: "center" },
        { label: ar ? "عدد الموظفين" : "Staff", render: (r: any) => r.staffCount, align: "center" },
      ],
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
    });
  };

  const handleExportExcelCentersSummary = () => {
    const data = centersSumQ.data;
    if (!data || !data.rows.length) return;
    const headers = [
      ar ? "م" : "#",
      ar ? "اسم المركز" : "Center Name",
      ar ? "الكود" : "Code",
      ar ? "الحالة" : "Status",
      ar ? "عدد الحلقات" : "Circles",
      ar ? "عدد الموظفين" : "Staff",
    ];
    const rows = data.rows.map((r: any, i: number) => [
      i + 1, r.name, r.code, r.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive"), r.circlesCount, r.staffCount,
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `centers-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintCirclesSummary = () => {
    const data = circlesSumQ.data;
    if (!data) return;
    printSummaryReport({
      title: ar ? "تقرير الحلقات" : "Circles Report",
      subtitle: ar ? "الحلقات حسب المركز والمعلم والطلاب" : "Circles by center, teacher and students",
      kpis: [
        { label: ar ? "إجمالي الحلقات" : "Total Circles", value: data.kpis.totalCircles },
        { label: ar ? "الحلقات النشطة" : "Active Circles", value: data.kpis.activeCircles, color: "#2D9B7A" },
        { label: ar ? "إجمالي الطلاب" : "Total Students", value: data.kpis.totalStudents },
      ],
      rows: data.rows,
      columns: [
        { label: ar ? "م" : "#", render: (_: any, i: number) => i + 1, align: "center" },
        { label: ar ? "اسم الحلقة" : "Circle Name", render: (r: any) => r.name },
        { label: ar ? "الحالة" : "Status", render: (r: any) => r.isActive ? (ar ? "نشطة" : "Active") : (ar ? "غير نشطة" : "Inactive"), align: "center" },
        { label: ar ? "المركز" : "Center", render: (r: any) => r.centerName },
        { label: ar ? "المعلم" : "Teacher", render: (r: any) => r.teacherName },
        { label: ar ? "الطلاب" : "Students", render: (r: any) => r.studentCount, align: "center" },
      ],
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
    });
  };

  const handlePrintStudentsSummary = () => {
    const data = studentsSumQ.data;
    if (!data) return;
    printSummaryReport({
      title: ar ? "تقرير الطلاب" : "Students Report",
      subtitle: ar ? "الطلاب حسب المركز والحالة" : "Students by center and status",
      kpis: [
        { label: ar ? "إجمالي الطلاب" : "Total Students", value: data.kpis.totalStudents },
        { label: ar ? "الطلاب النشطون" : "Active Students", value: data.kpis.activeStudents, color: "#2D9B7A" },
        { label: ar ? "الطلاب غير النشطين" : "Inactive Students", value: data.kpis.inactiveStudents, color: "#E85858" },
      ],
      rows: data.rows,
      columns: [
        { label: ar ? "م" : "#", render: (_: any, i: number) => i + 1, align: "center" },
        { label: ar ? "اسم الطالب" : "Student Name", render: (r: any) => r.name },
        { label: ar ? "الحالة" : "Status", render: (r: any) => r.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive"), align: "center" },
        { label: ar ? "المستوى" : "Level", render: (r: any) => r.level, align: "center" },
        { label: ar ? "الحلقة" : "Circle", render: (r: any) => r.circleName },
        { label: ar ? "المركز" : "Center", render: (r: any) => r.centerName },
      ],
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
    });
  };

  const handlePrintGoldenRecordsSummary = () => {
    const data = goldenSumQ.data;
    if (!data) return;
    const byTypeKpis = Object.entries(data.kpis.byType || {}).map(([type, count]) => ({
      label: type, value: count as number,
    }));
    printSummaryReport({
      title: ar ? "السجل الذهبي" : "Golden Records",
      subtitle: ar ? "الإجازات والأسانيد والروايات" : "Ijazah, Sanad and Riwaya",
      kpis: [
        { label: ar ? "إجمالي السجلات" : "Total Records", value: data.kpis.totalRecords },
        ...byTypeKpis,
      ],
      rows: data.rows,
      columns: [
        { label: ar ? "م" : "#", render: (_: any, i: number) => i + 1, align: "center" },
        { label: ar ? "اسم الطالب" : "Student Name", render: (r: any) => r.studentName },
        { label: ar ? "النوع" : "Type", render: (r: any) => r.type, align: "center" },
        { label: ar ? "الرواية" : "Narration", render: (r: any) => r.narration, align: "center" },
        { label: ar ? "المركز" : "Center", render: (r: any) => r.centerName },
        { label: ar ? "تاريخ الإتمام" : "Completion Date", render: (r: any) => r.completionDate, align: "center" },
      ],
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
    });
  };

  const handleExportExcelCirclesSummary = () => {
    const data = circlesSumQ.data;
    if (!data || !data.rows.length) return;
    const h = [ar ? "م" : "#", ar ? "اسم الحلقة" : "Circle Name", ar ? "الحالة" : "Status", ar ? "المركز" : "Center", ar ? "المعلم" : "Teacher", ar ? "الطلاب" : "Students"];
    const rows = data.rows.map((r: any, i: number) => [i + 1, r.name, r.isActive ? (ar ? "نشطة" : "Active") : (ar ? "غير نشطة" : "Inactive"), r.centerName, r.teacherName, r.studentCount]);
    const csv = [h, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `circles-summary-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcelStudentsSummary = () => {
    const data = studentsSumQ.data;
    if (!data || !data.rows.length) return;
    const h = [ar ? "م" : "#", ar ? "اسم الطالب" : "Student Name", ar ? "الحالة" : "Status", ar ? "المستوى" : "Level", ar ? "الحلقة" : "Circle", ar ? "المركز" : "Center"];
    const rows = data.rows.map((r: any, i: number) => [i + 1, r.name, r.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive"), r.level, r.circleName, r.centerName]);
    const csv = [h, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `students-summary-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcelGoldenRecordsSummary = () => {
    const data = goldenSumQ.data;
    if (!data || !data.rows.length) return;
    const h = [ar ? "م" : "#", ar ? "اسم الطالب" : "Student Name", ar ? "النوع" : "Type", ar ? "الرواية" : "Narration", ar ? "المركز" : "Center", ar ? "تاريخ الإتمام" : "Completion Date"];
    const rows = data.rows.map((r: any, i: number) => [i + 1, r.studentName, r.type, r.narration, r.centerName, r.completionDate]);
    const csv = [h, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `golden-records-summary-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintSummary = () => {
    if (activeSummary === "centers") handlePrintCentersSummary();
    else if (activeSummary === "circles") handlePrintCirclesSummary();
    else if (activeSummary === "students") handlePrintStudentsSummary();
    else if (activeSummary === "golden-records") handlePrintGoldenRecordsSummary();
  };

  const handleExportExcelSummary = () => {
    if (activeSummary === "centers") handleExportExcelCentersSummary();
    else if (activeSummary === "circles") handleExportExcelCirclesSummary();
    else if (activeSummary === "students") handleExportExcelStudentsSummary();
    else if (activeSummary === "golden-records") handleExportExcelGoldenRecordsSummary();
  };

  /* عرض بطاقات KPI حسب نوع الملخص */
  const renderSummaryKpis = () => {
    if (activeSummary === "centers" && centersSumQ.data?.kpis) {
      const k = centersSumQ.data.kpis;
      return (
        <div className="fin-premium-kpis mb-6" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {[
            { label: ar ? "إجمالي المراكز" : "Total Centers", value: k.totalCenters, icon: Building2, cls: "blue" },
            { label: ar ? "نشطة" : "Active", value: k.activeCenters, icon: Building2, cls: "emerald" },
            { label: ar ? "غير نشطة" : "Inactive", value: k.inactiveCenters, icon: Building2, cls: "rose" },
            { label: ar ? "الحلقات" : "Circles", value: k.totalCircles, icon: CircleDot, cls: "blue" },
            { label: ar ? "الموظفين" : "Staff", value: k.totalStaff, icon: Users, cls: "amber" },
          ].map((card) => (
            <div key={card.label} className="fin-kpi-card">
              <div className={`fin-kpi-card__icon fin-kpi-icon--${card.cls}`}><card.icon size={20} /></div>
              <div className="fin-kpi-card__content">
                <span className="fin-kpi-card__value">{card.value}</span>
                <span className="fin-kpi-card__label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (activeSummary === "circles" && circlesSumQ.data?.kpis) {
      const k = circlesSumQ.data.kpis;
      return (
        <div className="fin-premium-kpis mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { label: ar ? "إجمالي الحلقات" : "Total Circles", value: k.totalCircles, icon: CircleDot, cls: "blue" },
            { label: ar ? "نشطة" : "Active", value: k.activeCircles, icon: CircleDot, cls: "emerald" },
            { label: ar ? "الطلاب" : "Students", value: k.totalStudents, icon: Users, cls: "amber" },
          ].map((card) => (
            <div key={card.label} className="fin-kpi-card">
              <div className={`fin-kpi-card__icon fin-kpi-icon--${card.cls}`}><card.icon size={20} /></div>
              <div className="fin-kpi-card__content">
                <span className="fin-kpi-card__value">{card.value}</span>
                <span className="fin-kpi-card__label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (activeSummary === "students" && studentsSumQ.data?.kpis) {
      const k = studentsSumQ.data.kpis;
      return (
        <div className="fin-premium-kpis mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { label: ar ? "إجمالي الطلاب" : "Total Students", value: k.totalStudents, icon: Users, cls: "blue" },
            { label: ar ? "نشط" : "Active", value: k.activeStudents, icon: Users, cls: "emerald" },
            { label: ar ? "غير نشط" : "Inactive", value: k.inactiveStudents, icon: Users, cls: "rose" },
          ].map((card) => (
            <div key={card.label} className="fin-kpi-card">
              <div className={`fin-kpi-card__icon fin-kpi-icon--${card.cls}`}><card.icon size={20} /></div>
              <div className="fin-kpi-card__content">
                <span className="fin-kpi-card__value">{card.value}</span>
                <span className="fin-kpi-card__label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (activeSummary === "golden-records" && goldenSumQ.data?.kpis) {
      const k = goldenSumQ.data.kpis;
      const byTypeEntries = Object.entries(k.byType || {});
      return (
        <div className="fin-premium-kpis mb-6" style={{ gridTemplateColumns: `repeat(${Math.min(byTypeEntries.length + 1, 5)}, 1fr)` }}>
          {[
            { label: ar ? "إجمالي السجلات" : "Total Records", value: k.totalRecords, icon: Award, cls: "blue" },
            ...byTypeEntries.map(([type, count]) => ({
              label: type, value: count as number, icon: Award, cls: "emerald" as const,
            })),
          ].map((card) => (
            <div key={card.label} className="fin-kpi-card">
              <div className={`fin-kpi-card__icon fin-kpi-icon--${card.cls}`}><card.icon size={20} /></div>
              <div className="fin-kpi-card__content">
                <span className="fin-kpi-card__value">{card.value}</span>
                <span className="fin-kpi-card__label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  /* ─── Render helpers ─── */
  const renderCard = (card: ReportCardDef, idx: number) => {
    const disabled = card.status !== "ready";
    return (
      <motion.button
        key={card.id}
        className={`ctr-card-modern ${disabled ? "is-inactive" : ""} !p-3 !gap-2`}
        onClick={() => openReport(card)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05, duration: 0.3 }}
      >
        <div className="ctr-card-header !gap-2.5">
          <div className="ctr-card-icon-box !w-10 !h-10 !rounded-lg !shadow-sm">
            <card.icon size={20} />
          </div>
          <div className="ctr-card-title-wrap">
            <h3 className="ctr-card-title !text-[0.95rem]">{ar ? card.nameAr : card.nameEn}</h3>
            <span className="ctr-card-subtitle text-start !text-[0.7rem] !mt-0.5">{ar ? card.descAr : card.descEn}</span>
          </div>
        </div>
        <div className="ctr-card-status-row mt-1">
          <span className={`ctr-card-status !text-[0.65rem] !py-0.5 !px-1.5 ${disabled ? "inactive" : ""}`}>
            {ar ? statusLabelAr[card.status] : statusLabelEn[card.status]}
          </span>
          <div className="flex gap-1">
             <span className="ctr-card-gender male !text-[0.65rem] !py-0.5 !px-1.5">{ar ? sectionLabelAr[card.section] : card.section}</span>
             <span className="ctr-card-gender female !text-[0.65rem] !py-0.5 !px-1.5">{ar ? scopeLabelAr[card.scope] : card.scope}</span>
          </div>
        </div>
        <div className="ctr-card-actions w-full !pt-2 !mt-1">
          <div className={`ctr-card-btn w-full !h-8 !text-[0.75rem] ${disabled ? "" : "primary"}`}>
            {disabled
              ? (ar ? "قريبًا" : "Coming Soon")
              : (ar ? "فتح التقرير" : "Open Report")
            }
          </div>
        </div>
      </motion.button>
    );
  };

  /* ════════════════ JSX ════════════════ */
  return (
    <div className="fin-premium-container ctr-page-modern p-4" dir={ar ? "rtl" : "ltr"}>
      <AnimatePresence mode="wait">
        {viewLevel === "CATALOG" ? (
          <motion.div key="catalog" variants={stagger} initial="hidden" animate="visible" className="flex flex-col" style={{ gap: "var(--rcc-gap)" }}>

            {/* ── 1. HEADER ── */}
            <motion.header variants={fadeUp} className="mb-4">
              <PageHeader
                title={ar ? "التقارير والتحليلات" : "Reports & Analytics"}
                description={ar ? "مركز موحد لمتابعة أداء الجمعية والمراكز والحلقات والمالية." : "Unified center for monitoring organization, centers, circles and finance performance."}
                icon={<BarChart3 className="w-6 h-6" />}
                actions={
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<Wallet2 className="w-4 h-4" />} onClick={() => setSecFilter("finance")}>
                      {ar ? "المالية" : "Finance"}
                    </Button>
                    <Button variant="primary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => setSecFilter("admin")}>
                      {ar ? "التقارير الإدارية" : "Admin Reports"}
                    </Button>
                  </div>
                }
              />
            </motion.header>

            {/* ── 2. STATS BAR ── */}
            <motion.section variants={fadeUp} className="mb-4">
              <ReportsSummaryCards
                stats={{
                  total: stats.total,
                  ready: stats.ready,
                  finance: stats.finance,
                  needsBackend: stats.soon,
                }}
              />
            </motion.section>

            {/* ── 3. FILTER BAR ── */}
            <motion.div variants={fadeUp} className="ctr-centers-shell mb-10">
              <div className="ctr-controls">
                <div className="ctr-filters-group">
                  <select className="ctr-filter-select" value={secFilter} onChange={(e) => setSecFilter(e.target.value as SectionFilter)}>
                    {(Object.keys(sectionLabelAr) as SectionFilter[]).map((k) => <option key={k} value={k}>{ar ? sectionLabelAr[k] : sectionLabelEn[k]}</option>)}
                  </select>
                  <select className="ctr-filter-select" value={statusFlt} onChange={(e) => setStatusFlt(e.target.value as StatusFilter)}>
                    {(Object.keys(statusFilterAr) as StatusFilter[]).map((k) => <option key={k} value={k}>{ar ? statusFilterAr[k] : statusFilterEn[k]}</option>)}
                  </select>
                  <select className="ctr-filter-select" value={outputFlt} onChange={(e) => setOutputFlt(e.target.value as OutputFilter)}>
                    {(Object.keys(outputFilterAr) as OutputFilter[]).map((k) => <option key={k} value={k}>{ar ? outputFilterAr[k] : outputFilterEn[k]}</option>)}
                  </select>
                  {hasActiveFilters && (
                    <button className="flex items-center justify-center w-[38px] h-[38px] rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors" onClick={resetCatalogFilters} title={ar ? "إعادة ضبط" : "Reset"}>
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>

                <div className="ctr-search-wrap">
                  <Search className="ctr-search-icon" size={16} />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="ctr-search-input"
                    placeholder={ar ? "بحث باسم التقرير..." : "Search reports..."}
                  />
                </div>
              </div>
            </motion.div>

            {/* ── 4. FEATURED ── */}
            {!hasActiveFilters && featuredCards.length > 0 && (
              <motion.section variants={fadeUp}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-1.5 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`}><Star size={16} /></div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{ar ? "التقارير الأكثر استخدامًا" : "Most Used Reports"}</h2>
                </div>
                <div className="grid gap-3 mb-10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {featuredCards.map((card, i) => {
                    return renderCard(card, i);
                  })}
                </div>
              </motion.section>
            )}

            {/* ── 5. CATALOG ── */}
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <motion.section key={group.id} variants={fadeUp}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-1.5 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400`}><group.icon size={16} /></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{ar ? group.nameAr : group.nameEn}</h2>
                    <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full text-[0.7rem] font-bold mr-auto">{group.cards.length} {ar ? "تقارير" : "reports"}</span>
                  </div>
                  <div className="grid gap-3 mb-10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                    {group.cards.map((card, i) => renderCard(card, i))}
                  </div>
                </motion.section>
              ))
            ) : (
              <div className="rcc-empty">
                <div className="rcc-empty__ico"><Search size={24} /></div>
                <p className="rcc-empty__title">{ar ? "لا توجد تقارير مطابقة" : "No matching reports"}</p>
                <p className="rcc-empty__desc">{ar ? "جرّب تغيير البحث أو الفلاتر." : "Try adjusting search or filters."}</p>
                <button className="rcc-empty__btn" onClick={resetCatalogFilters}>
                  <RotateCcw size={14} />
                  <span>{ar ? "إعادة ضبط الفلاتر" : "Reset Filters"}</span>
                </button>
              </div>
            )}
          </motion.div>
        ) : viewLevel === "STAFF" ? (
          <motion.div key="staff" variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col" style={{ gap: "var(--rcc-gap)" }}>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />} onClick={handleBack}>
                {ar ? "رجوع للفهرس" : "Back to Catalog"}
              </Button>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{ar ? "تقرير حضور الكادر" : "Staff Attendance Report"}</h2>
            </div>
            <MonthlyStaffReportView />
          </motion.div>
        ) : (
          <motion.div key="unified" variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-5">
            {/* ── 1. UNIFIED HEADER (FINANCIAL POSITION STYLE) ── */}
            <div>
              <button
                onClick={handleBack}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
              >
                <ArrowLeft className={`w-4 h-4 mr-1 ${ar ? "rotate-180 ml-1 mr-0" : ""}`} />
                {ar ? "العودة للتقارير" : "Back to Reports"}
              </button>

              <PageHeader
                title={activeCard ? (ar ? activeCard.nameAr : activeCard.nameEn) : ""}
                description={activeCard ? (ar ? activeCard.descAr : activeCard.descEn) : ""}
                icon={activeCard ? <activeCard.icon className="w-6 h-6 text-indigo-600" /> : undefined}
                actions={
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {activeSummary ? (
                      <>
                        <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<RefreshCw className={(activeQuery as any).isFetching ? "animate-spin" : ""} />} onClick={refreshData}>
                          {ar ? "تحديث" : "Refresh"}
                        </Button>
                        <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<Printer className="text-teal-600" />} onClick={handlePrintSummary}>
                          {ar ? "طباعة" : "Print"}
                        </Button>
                        <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<FileDown className="text-emerald-600" />} onClick={handleExportExcelSummary}>
                          {ar ? "تصدير Excel" : "Export Excel"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<RefreshCw className={(activeQuery as any).isFetching ? "animate-spin" : ""} />} onClick={refreshData}>
                          {ar ? "تحديث" : "Refresh"}
                        </Button>
                        <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<FileDown className="text-emerald-600" />} onClick={() => exportMut.mutate({ reportType: activeReportType as any, format: "XLSX", filters })} disabled={exportMut.isPending}>
                          {ar ? "تصدير Excel" : "Export Excel"}
                        </Button>
                      </>
                    )}
                  </div>
                }
              />
            </div>

            {/* ── 2. UNIFIED FILTERS (Premium style, contextual) ── */}
            <div className="fin-filters-container">
              <div className="fin-filters-scroll">
                {canLoadCenters && (
                  <div className="fin-filter-item">
                    <Building2 className="fin-filter-icon" size={16} />
                    <select value={filters.centerId || ""} onChange={(e) => { setFilters({ ...filters, centerId: Number(e.target.value) || undefined, circleId: undefined }); setPage(1); }}>
                      <option value="">{ar ? "المركز: الكل" : "Center: All"}</option>
                      {centersQ.data?.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                {filters.centerId && activeSummary !== "centers" && (
                  <div className="fin-filter-item">
                    <CircleDot className="fin-filter-icon" size={16} />
                    <select value={filters.circleId || ""} onChange={(e) => { setFilters({ ...filters, circleId: Number(e.target.value) || undefined }); setPage(1); }}>
                      <option value="">{ar ? "الحلقة: الكل" : "Circle: All"}</option>
                      {circlesQ.data?.items.filter(c => c.centerId === filters.centerId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                {!activeSummary && (
                  <>
                    <div className="fin-filter-item">
                      <CalendarDays className="fin-filter-icon" size={16} />
                      <input type="date" value={filters.from} onChange={(e) => { setFilters({ ...filters, from: e.target.value }); setPage(1); }} title={ar ? "من" : "From"} />
                    </div>
                    <div className="fin-filter-item">
                      <CalendarDays className="fin-filter-icon" size={16} />
                      <input type="date" value={filters.to} onChange={(e) => { setFilters({ ...filters, to: e.target.value }); setPage(1); }} title={ar ? "إلى" : "To"} />
                    </div>
                  </>
                )}
                <div className="fin-filter-item" style={{ minWidth: 200 }}>
                  <Search className="fin-filter-icon" size={16} />
                  <input type="text" placeholder={ar ? "بحث..." : "Search..."} value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
                </div>
              </div>
              {((filters.centerId || filters.circleId || filters.search) || (!activeSummary && (filters.from !== defaultFrom || filters.to !== defaultTo))) && (
                <button className="fin-filter-reset" onClick={() => { setFilters({ from: defaultFrom, to: defaultTo, search: "", centerId: undefined, circleId: undefined }); setPage(1); }}>
                  <RotateCcw size={14} />
                  {ar ? "إعادة ضبط" : "Reset"}
                </button>
              )}
            </div>

            {/* ── 3. KPI CARDS (للملخصات فقط) ── */}
            {activeSummary && renderSummaryKpis()}

            {/* ── 4. UNIFIED TABLE ── */}
            {(activeQuery as any).isLoading ? (
              <div className="flex flex-col gap-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">{[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 animate-pulse rounded-xl" />)}</div>
            ) : (activeQuery as any).isError ? (
              <ErrorState title={ar ? "تعذر تحميل بيانات التقرير" : "Unable to load report data"} onRetry={() => void (activeQuery as any).refetch()} />
            ) : (
              <div className="fin-premium-panel">
                <DataTable
                  columns={columns}
                  rows={pagedRows}
                  rowKey={(_, i) => i}
                  footer={reportTotals}
                  emptyState={
                    <div className="rcc-empty !py-16">
                      <div className="rcc-empty__ico !w-16 !h-16 !bg-gray-50 !text-gray-300"><Search size={32} /></div>
                      <p className="rcc-empty__title !text-xl">{ar ? "لا توجد بيانات مطابقة" : "No matching data"}</p>
                      <p className="rcc-empty__desc">{ar ? "حاول تغيير فلاتر البحث أو النطاق الزمني." : "Try adjusting the search filters or date range."}</p>
                    </div>
                  }
                  pagination={{
                    totalItems: sortedRows.length,
                    pageSize,
                    currentPage: page,
                    totalPages: Math.max(1, Math.ceil(sortedRows.length / pageSize)),
                    onPageChange: setPage,
                    onPageSizeChange: setPageSize,
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
