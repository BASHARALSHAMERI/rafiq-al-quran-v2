import { useState, useMemo, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  HandHeart,
  Printer,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  Star,
  Table2,
  Trophy,
  Users,
  Wallet2,
  Activity,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { useI18n } from "../app/i18n";
import { useAuthStore } from "../features/auth/auth.store";
import { useCentersQuery } from "../features/org/org.hooks";
import { canReadCenters } from "../features/org/org.permissions";
import {
  useReportQuery,
  useCentersSummaryQuery,
  useCirclesSummaryQuery,
  useStudentsSummaryQuery,
  useGoldenRecordsSummaryQuery,
  useExportReportMutation,
} from "../features/reports/reports.hooks";
import { reportsApi } from "../features/reports/reports.api";
import { ErrorState } from "../components/ui/ErrorState";
import type { ReportFormat, ReportsFilters, ReportType } from "../features/reports/types";
import { MonthlyStaffReportView } from "../features/staff-attendance/components/MonthlyStaffReportView";

import "../styles/pages/reports-v5.css";
import "../styles/pages/reports-v6.css";

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
type SectionFilter = "all" | "admin" | "educational" | "attendance" | "exams" | "golden" | "finance" | "official";
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
    id: "admin", nameAr: "تقارير إدارية", nameEn: "Administrative Reports", color: "blue", icon: Building2,
    cards: [
      { id: "centers-summary", nameAr: "نظرة عامة على الجمعية", nameEn: "Organization Overview", descAr: "عدد المراكز والحلقات والموظفين", descEn: "Centers, circles and staff counts", icon: Building2, status: "ready", summaryKey: "centers", section: "admin", scope: "org", outputs: ["screen"], featured: true, visibility: "super" },
      { id: "circles-summary", nameAr: "تقرير الحلقات", nameEn: "Circles Report", descAr: "الحلقات حسب المركز والمعلم والطلاب", descEn: "Circles by center, teacher and students", icon: CircleDot, status: "ready", summaryKey: "circles", section: "admin", scope: "center", outputs: ["screen"], visibility: "all" },
      { id: "students-summary", nameAr: "تقرير الطلاب", nameEn: "Students Report", descAr: "الطلاب حسب المركز والحالة", descEn: "Students by center and status", icon: Users, status: "ready", summaryKey: "students", section: "admin", scope: "center", outputs: ["screen"], visibility: "all" },
      { id: "center-compare", nameAr: "مقارنة المراكز", nameEn: "Centers Comparison", descAr: "مقارنة أداء المراكز والحلقات", descEn: "Compare centers performance", icon: BarChart3, status: "coming-soon", section: "admin", scope: "org", outputs: ["screen"], featured: true, visibility: "super" },
      { id: "center-perf", nameAr: "أداء المراكز", nameEn: "Center Performance", descAr: "مؤشرات أداء كل مركز", descEn: "Performance metrics per center", icon: Activity, status: "coming-soon", section: "admin", scope: "center", outputs: ["screen"], visibility: "all" },
      { id: "teacher-perf", nameAr: "أداء المعلمين", nameEn: "Teachers Performance", descAr: "تقييم المعلمين وإنتاجيتهم", descEn: "Teacher evaluation and productivity", icon: Users, status: "coming-soon", section: "admin", scope: "center", outputs: ["screen"], visibility: "all" },
      { id: "struggling", nameAr: "الطلاب المتعثرون", nameEn: "Struggling Students", descAr: "الطلاب الذين يحتاجون متابعة خاصة", descEn: "Students needing special attention", icon: Users, status: "coming-soon", section: "admin", scope: "center", outputs: ["screen"], featured: true, visibility: "all" },
    ],
  },
  {
    id: "educational", nameAr: "تقارير تعليمية", nameEn: "Educational Reports", color: "violet", icon: BookOpen,
    cards: [
      { id: "circle-monthly", nameAr: "تقرير الحلقة الشهري", nameEn: "Monthly Circle Report", descAr: "أداء الحلقة الشهري الشامل", descEn: "Monthly circle performance", icon: CircleDot, status: "coming-soon", section: "educational", scope: "circle", outputs: ["screen", "print"], featured: true, visibility: "all" },
      { id: "student-monthly", nameAr: "تقرير الطالب الشهري", nameEn: "Monthly Student Report", descAr: "أداء الطالب الشهري في الحفظ والحضور", descEn: "Monthly student memorization & attendance", icon: Users, status: "coming-soon", section: "educational", scope: "student", outputs: ["screen", "print"], featured: true, visibility: "all" },
      { id: "follow-up", nameAr: "الحفظ والمراجعة", nameEn: "Memorization & Review", descAr: "سجل المتابعة والنشاطات", descEn: "Follow-up and activity log", icon: Activity, status: "ready", reportType: "FOLLOW_UP", section: "educational", scope: "circle", outputs: ["screen"], visibility: "all" },
      { id: "plan-exec", nameAr: "تنفيذ الخطة", nameEn: "Plan Execution", descAr: "نسب تنفيذ الخطة التعليمية", descEn: "Educational plan completion rates", icon: CheckCircle2, status: "coming-soon", section: "educational", scope: "circle", outputs: ["screen"], visibility: "all" },
      { id: "student-levels", nameAr: "مستويات الطلاب", nameEn: "Student Levels", descAr: "توزيع الطلاب حسب المستوى", descEn: "Students distribution by level", icon: BarChart3, status: "coming-soon", section: "educational", scope: "center", outputs: ["screen"], visibility: "all" },
    ],
  },
  {
    id: "attendance", nameAr: "تقارير الحضور والمتابعة", nameEn: "Attendance & Follow-up", color: "emerald", icon: CalendarDays,
    cards: [
      { id: "attendance", nameAr: "حضور الطلاب", nameEn: "Student Attendance", descAr: "سجل الحضور والغياب والتأخير", descEn: "Attendance, absence and late records", icon: ClipboardCheck, status: "ready", reportType: "ATTENDANCE", section: "attendance", scope: "circle", outputs: ["screen"], visibility: "all" },
      { id: "staff-report", nameAr: "حضور الكادر", nameEn: "Staff Attendance", descAr: "حضور الموظفين والإجازات والخصومات", descEn: "Staff attendance, leaves and deductions", icon: Users, status: "ready", section: "attendance", scope: "center", outputs: ["screen"], visibility: "all" },
      { id: "absence-late", nameAr: "الغياب والتأخير", nameEn: "Absence & Lateness", descAr: "إحصائيات الغياب والتأخير", descEn: "Absence and lateness statistics", icon: CalendarDays, status: "coming-soon", section: "attendance", scope: "center", outputs: ["screen"], visibility: "all" },
      { id: "daily-followup", nameAr: "المتابعة اليومية", nameEn: "Daily Follow-up", descAr: "سجل المتابعة اليومي", descEn: "Daily follow-up log", icon: FileText, status: "coming-soon", section: "attendance", scope: "circle", outputs: ["screen"], visibility: "all" },
    ],
  },
  {
    id: "exams", nameAr: "تقارير الاختبارات", nameEn: "Exams & Assessments", color: "amber", icon: FileCheck2,
    cards: [
      { id: "exams", nameAr: "نتائج الاختبارات", nameEn: "Exam Results", descAr: "النتائج والنجاح ومعدل الأداء", descEn: "Results, pass rates and performance", icon: FileCheck2, status: "ready", reportType: "EXAMS", section: "exams", scope: "center", outputs: ["screen"], visibility: "all" },
      { id: "exam-candidates", nameAr: "المرشحون", nameEn: "Exam Candidates", descAr: "قوائم المرشحين للاختبارات", descEn: "Candidates lists for exams", icon: Users, status: "coming-soon", section: "exams", scope: "center", outputs: ["screen"], visibility: "all" },
      { id: "pass-rates", nameAr: "نسب النجاح", nameEn: "Pass Rates", descAr: "إحصائيات النجاح حسب المركز", descEn: "Pass rates by center", icon: BarChart3, status: "coming-soon", section: "exams", scope: "org", outputs: ["screen"], visibility: "super" },
      { id: "mushaf-exams", nameAr: "اختبارات المصحف", nameEn: "Mushaf Exams", descAr: "اختبارات الحفظ الكامل", descEn: "Full memorization exams", icon: BookOpen, status: "coming-soon", section: "exams", scope: "org", outputs: ["screen"], visibility: "super" },
    ],
  },
  {
    id: "golden", nameAr: "تقارير السجل الذهبي", nameEn: "Golden Record Reports", color: "gold", icon: Trophy,
    cards: [
      { id: "golden-records", nameAr: "الخاتمون", nameEn: "Completers", descAr: "الخاتمون حسب المركز والرواية", descEn: "Completers by center and narration", icon: Trophy, status: "ready", summaryKey: "golden-records", section: "golden", scope: "org", outputs: ["screen"], visibility: "all" },
      { id: "huffaz", nameAr: "الحفاظ", nameEn: "Huffaz", descAr: "قائمة الحفاظ المعتمدين", descEn: "Certified Huffaz list", icon: Star, status: "coming-soon", section: "golden", scope: "org", outputs: ["screen", "print"], visibility: "all" },
      { id: "ijazat", nameAr: "الإجازات", nameEn: "Ijazat", descAr: "الإجازات الممنوحة", descEn: "Granted Ijazat", icon: FileText, status: "coming-soon", section: "golden", scope: "org", outputs: ["screen"], visibility: "super" },
      { id: "yearly-achievements", nameAr: "الإنجازات السنوية", nameEn: "Yearly Achievements", descAr: "ملخص الإنجازات السنوي", descEn: "Annual achievements summary", icon: Trophy, status: "coming-soon", section: "golden", scope: "org", outputs: ["screen"], visibility: "super" },
    ],
  },
  {
    id: "finance", nameAr: "تقارير مالية ومحاسبية", nameEn: "Financial & Accounting", color: "teal", icon: Wallet2,
    cards: [
      { id: "finance-invoices", nameAr: "الفواتير والتحصيل", nameEn: "Invoices & Collection", descAr: "الفواتير والمبالغ المستحقة والمحصلة", descEn: "Invoices, amounts due and collected", icon: FileText, status: "ready", reportType: "FINANCE", section: "finance", scope: "finance", outputs: ["screen"], visibility: "all" },
      { id: "fin-pos", nameAr: "قائمة المركز المالي", nameEn: "Financial Position", descAr: "الأصول والخصوم وصافي الأصول", descEn: "Assets, liabilities and net assets", icon: Scale, status: "ready", href: "/finance/reports/financial-position", section: "finance", scope: "finance", outputs: ["screen", "print"], featured: true, visibility: "all" },
      { id: "fin-activities", nameAr: "قائمة الأنشطة", nameEn: "Statement of Activities", descAr: "الإيرادات والمصروفات والفائض", descEn: "Revenue, expenses and surplus", icon: Activity, status: "ready", href: "/finance/reports/statement-of-activities", section: "finance", scope: "finance", outputs: ["screen", "print"], featured: true, visibility: "all" },
      { id: "fin-center-funding", nameAr: "تمويل وتكلفة المراكز", nameEn: "Center Funding & Cost", descAr: "فجوة التمويل لكل مركز", descEn: "Funding gap per center", icon: Building2, status: "ready", href: "/finance/reports/center-funding", section: "finance", scope: "finance", outputs: ["screen"], visibility: "all" },
      { id: "fin-coa", nameAr: "شجرة الحسابات", nameEn: "Chart of Accounts", descAr: "هيكل الحسابات المحاسبية", descEn: "Accounting structure", icon: Table2, status: "ready", href: "/finance/accounting/accounts", section: "finance", scope: "finance", outputs: ["screen"], visibility: "all" },
      { id: "fin-ledger", nameAr: "دفتر الأستاذ", nameEn: "General Ledger", descAr: "حركات الحسابات التفصيلية", descEn: "Detailed account movements", icon: BookOpen, status: "ready", href: "/finance/accounting/ledger", section: "finance", scope: "finance", outputs: ["screen"], visibility: "super" },
      { id: "fin-trial", nameAr: "ميزان المراجعة", nameEn: "Trial Balance", descAr: "أرصدة الحسابات الختامية", descEn: "Final account balances", icon: Scale, status: "ready", href: "/finance/accounting/trial-balance", section: "finance", scope: "finance", outputs: ["screen"], visibility: "super" },
      { id: "fin-vouchers", nameAr: "السندات", nameEn: "Vouchers", descAr: "سندات القبض والصرف", descEn: "Receipt and payment vouchers", icon: ClipboardCheck, status: "ready", href: "/finance/vouchers", section: "finance", scope: "finance", outputs: ["screen"], visibility: "all" },
      { id: "fin-expenses", nameAr: "المصروفات", nameEn: "Expenses", descAr: "المصروفات والموردون", descEn: "Expenses and suppliers", icon: FileText, status: "ready", href: "/finance/expenses", section: "finance", scope: "finance", outputs: ["screen"], visibility: "all" },
      { id: "fin-donations", nameAr: "التبرعات", nameEn: "Donations", descAr: "المتبرعون والحملات", descEn: "Donors and campaigns", icon: HandHeart, status: "ready", href: "/finance/donors", section: "finance", scope: "finance", outputs: ["screen"], visibility: "all" },
      { id: "fin-payroll", nameAr: "الرواتب", nameEn: "Payroll", descAr: "كشوف الرواتب والاستقطاعات", descEn: "Payroll sheets and deductions", icon: Users, status: "ready", href: "/finance/payroll", section: "finance", scope: "finance", outputs: ["screen"], visibility: "super" },
    ],
  },
  {
    id: "official", nameAr: "تقارير رسمية للطباعة", nameEn: "Official Printable Reports", color: "slate", icon: Printer,
    cards: [
      { id: "off-circle-monthly", nameAr: "تقرير أداء الحلقة الشهري الرسمي", nameEn: "Official Monthly Circle Report", descAr: "تقرير رسمي قابل للطباعة", descEn: "Official printable report", icon: Printer, status: "coming-soon", section: "official", scope: "circle", outputs: ["print", "pdf"], visibility: "all" },
      { id: "off-grades", nameAr: "كشف درجات الطلاب", nameEn: "Student Grades Sheet", descAr: "كشف درجات رسمي", descEn: "Official grades sheet", icon: FileText, status: "coming-soon", section: "official", scope: "circle", outputs: ["print", "pdf"], visibility: "all" },
      { id: "off-student-monthly", nameAr: "تقرير الطالب الشهري", nameEn: "Monthly Student Report", descAr: "تقرير طالب رسمي للطباعة", descEn: "Official student report", icon: Users, status: "coming-soon", section: "official", scope: "student", outputs: ["print", "pdf"], visibility: "all" },
      { id: "off-attendance", nameAr: "كشف الحضور والغياب", nameEn: "Attendance Sheet", descAr: "كشف حضور رسمي", descEn: "Official attendance sheet", icon: ClipboardCheck, status: "coming-soon", section: "official", scope: "circle", outputs: ["print", "pdf"], visibility: "all" },
      { id: "off-finance", nameAr: "التقارير المالية الرسمية", nameEn: "Official Financial Reports", descAr: "تقارير مالية رسمية للطباعة", descEn: "Official financial printable reports", icon: Scale, status: "coming-soon", section: "official", scope: "finance", outputs: ["print", "pdf"], visibility: "super" },
    ],
  },
];

/* ─── Helpers ─── */
const ALL_CARDS = REPORT_GROUPS.flatMap((g) => g.cards);
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
const statusColorCls: Record<ReportStatus, string> = { ready: "rcc-badge--green", "needs-data": "rcc-badge--amber", "coming-soon": "rcc-badge--gray" };

const sectionLabelAr: Record<SectionFilter, string> = { all: "الكل", admin: "إداري", educational: "تعليمي", attendance: "حضور", exams: "اختبارات", golden: "سجل ذهبي", finance: "مالي", official: "رسمي" };
const sectionLabelEn: Record<SectionFilter, string> = { all: "All", admin: "Admin", educational: "Education", attendance: "Attendance", exams: "Exams", golden: "Golden", finance: "Finance", official: "Official" };
const statusFilterAr: Record<StatusFilter, string> = { all: "الكل", ready: "جاهز", "coming-soon": "قريبًا", "needs-data": "يحتاج ربط" };
const statusFilterEn: Record<StatusFilter, string> = { all: "All", ready: "Ready", "coming-soon": "Soon", "needs-data": "Needs Data" };
const outputFilterAr: Record<OutputFilter, string> = { all: "الكل", screen: "شاشة", print: "طباعة", pdf: "PDF", excel: "Excel" };
const outputFilterEn: Record<OutputFilter, string> = { all: "All", screen: "Screen", print: "Print", pdf: "PDF", excel: "Excel" };
const scopeLabelAr: Record<ScopeTag, string> = { org: "جمعية", center: "مركز", circle: "حلقة", student: "طالب", finance: "مالي" };
const outputLabelAr: Record<OutputTag, string> = { screen: "شاشة", print: "طباعة", pdf: "PDF", excel: "Excel" };
const sectionBadgeCls: Record<string, string> = { admin: "rcc-badge--blue", educational: "rcc-badge--violet", attendance: "rcc-badge--green", exams: "rcc-badge--amber", golden: "rcc-badge--amber", finance: "rcc-badge--teal", official: "rcc-badge--slate" };

const canSeeCard = (card: ReportCardDef, role: string | undefined): boolean => {
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
  const [activeTitle, setActiveTitle] = useState("");
  const [filters, setFilters] = useState<ReportsFilters>({ from: defaultFrom, to: defaultTo, search: "" });
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* catalog filters */
  const [searchQ, setSearchQ] = useState("");
  const [secFilter, setSecFilter] = useState<SectionFilter>("all");
  const [statusFlt, setStatusFlt] = useState<StatusFilter>("all");
  const [outputFlt, setOutputFlt] = useState<OutputFilter>("all");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const centersQ = useCentersQuery({ enabled: canLoadCenters });

  /* Standard report queries */
  const unifiedQ = useReportQuery(activeReportType, filters, viewLevel === "UNIFIED" && !activeSummary);
  const centersSumQ = useCentersSummaryQuery(viewLevel === "UNIFIED" && activeSummary === "centers");
  const circlesSumQ = useCirclesSummaryQuery(filters.centerId, viewLevel === "UNIFIED" && activeSummary === "circles");
  const studentsSumQ = useStudentsSummaryQuery(
    { centerId: filters.centerId, circleId: filters.circleId },
    viewLevel === "UNIFIED" && activeSummary === "students"
  );
  const goldenSumQ = useGoldenRecordsSummaryQuery(filters.centerId, viewLevel === "UNIFIED" && activeSummary === "golden-records");
  const exportMutation = useExportReportMutation();

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
    return REPORT_GROUPS.map((g) => {
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
    const finance = visibleCards.filter((c) => c.section === "finance").length;
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

  const columns = useMemo<DataTableColumn<Record<string, any>>[]>(
    () => headers.map((h) => ({
      id: h,
      header: (
        <button className={`rpt-th-btn ${sortKey === h ? "rpt-th-btn--active" : ""}`} onClick={() => {
          if (sortKey === h) setSortDir((p) => (p === "asc" ? "desc" : "asc"));
          else { setSortKey(h); setSortDir("asc"); }
          setPage(1);
        }}>
          <span>{colLabels[h] ?? humanize(h)}</span>
          <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />
        </button>
      ),
      cell: (row) => {
        const val = row[h];
        if (val == null || val === "") return <span className="rpt-muted">-</span>;
        if (typeof val === "boolean") return <Badge variant={val ? "success" : "default"}>{val ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}</Badge>;
        if (typeof val === "string" && /status|state|isPassed/i.test(h)) return <Badge variant={statusBadge(val)}>{val}</Badge>;
        return <span className="rpt-cell-text">{toDisplay(val)}</span>;
      },
    })),
    [headers, sortKey, sortDir, ar]
  );

  /* handlers */
  const handleBack = () => { setViewLevel("CATALOG"); setActiveSummary(null); };

  const openReport = (card: ReportCardDef) => {
    if (card.status !== "ready") return;
    if (card.href) { navigate(card.href); return; }
    if (card.id === "staff-report") { setViewLevel("STAFF"); return; }
    setActiveTitle(ar ? card.nameAr : card.nameEn);
    if (card.summaryKey) { setActiveSummary(card.summaryKey); setActiveReportType("ATTENDANCE"); }
    else if (card.reportType) { setActiveSummary(null); setActiveReportType(card.reportType); }
    setExportError(null);
    setExportSuccess(null);
    setViewLevel("UNIFIED");
    setPage(1);
    setSortKey(null);
  };

  const refreshData = () => { void (activeQuery as any).refetch?.(); };

  const handleExport = async (format: ReportFormat) => {
    setExportError(null);
    setExportSuccess(null);
    setExportLoading(true);
    try {
      const result = await exportMutation.mutateAsync({
        reportType: activeReportType,
        format,
        filters,
      });
      const blob = await reportsApi.downloadExport(result.fileId);
      const ext = format === "PDF" ? "pdf" : "xlsx";
      const fileName = `report-${activeReportType.toLowerCase()}-${filters.from}-${filters.to}.${ext}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportSuccess(ar ? "تم التصدير. ملاحظة: سينتهي صلاحية الملف خلال 7 أيام." : "Export ready. Note: file expires in 7 days.");
    } catch {
      setExportError(ar ? "تعذر تصدير التقرير. يرجى المحاولة مجدداً." : "Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  /* ─── Render helpers ─── */
  const renderBadges = (card: ReportCardDef) => (
    <div className="rcc-card__badges">
      <span className={`rcc-badge ${sectionBadgeCls[card.section] ?? "rcc-badge--gray"}`}>{ar ? sectionLabelAr[card.section] : card.section}</span>
      <span className={`rcc-badge ${statusColorCls[card.status]}`}>{ar ? statusLabelAr[card.status] : statusLabelEn[card.status]}</span>
      <span className="rcc-badge rcc-badge--gray">{ar ? scopeLabelAr[card.scope] : card.scope}</span>
      {card.outputs.map((o) => (
        <span key={o} className="rcc-badge rcc-badge--slate">{ar ? outputLabelAr[o] : o}</span>
      ))}
    </div>
  );

  const renderCard = (card: ReportCardDef, group: ReportGroupDef, idx: number) => {
    const disabled = card.status !== "ready";
    return (
      <motion.button
        key={card.id}
        className={`rcc-card ${disabled ? "rcc-card--disabled" : ""}`}
        onClick={() => openReport(card)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05, duration: 0.3 }}
        whileHover={disabled ? undefined : { y: -4, scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
      >
        <div className="rcc-card__top">
          <div className={`rcc-card__ico rcc-sec__ico--${group.color}`}>
            <card.icon size={18} />
          </div>
          <div className="rcc-card__info">
            <span className="rcc-card__name">{ar ? card.nameAr : card.nameEn}</span>
            <span className="rcc-card__desc">{ar ? card.descAr : card.descEn}</span>
          </div>
        </div>
        {renderBadges(card)}
        <div className="rcc-card__cta">
          {disabled
            ? <span>{ar ? "قريبًا" : "Coming Soon"}</span>
            : <>
                <span>{ar ? "فتح التقرير" : "Open Report"}</span>
                {card.href
                  ? <ExternalLink size={13} />
                  : <ChevronRight size={13} className={ar ? "rotate-180" : ""} />
                }
              </>
          }
        </div>
      </motion.button>
    );
  };

  /* ════════════════ JSX ════════════════ */
  return (
    <div className="rcc" dir={ar ? "rtl" : "ltr"}>
      <AnimatePresence mode="wait">
        {viewLevel === "CATALOG" ? (
          <motion.div key="catalog" variants={stagger} initial="hidden" animate="visible" className="flex flex-col" style={{ gap: "var(--rcc-gap)" }}>

            {/* ── 1. HEADER ── */}
            <motion.header variants={fadeUp} className="rcc-header">
              <div className="rcc-header__blob rcc-header__blob--1" />
              <div className="rcc-header__blob rcc-header__blob--2" />
              <div className="rcc-header__start">
                <div className="rcc-header__icon-box"><BarChart3 size={20} /></div>
                <div className="rcc-header__text">
                  <h1 className="rcc-header__title">{ar ? "التقارير والتحليلات" : "Reports & Analytics"}</h1>
                  <p className="rcc-header__desc">{ar ? "مركز موحد لمتابعة أداء الجمعية والمراكز والحلقات والمالية." : "Unified center for monitoring organization, centers, circles and finance performance."}</p>
                </div>
              </div>
              <div className="rcc-header__actions">
                <button className="rcc-header__btn" onClick={() => setSecFilter("finance")}>
                  <Wallet2 size={14} />
                  <span>{ar ? "التقارير المالية" : "Financial Reports"}</span>
                </button>
                <button className="rcc-header__btn" onClick={() => setSecFilter("official")}>
                  <Printer size={14} />
                  <span>{ar ? "التقارير الرسمية" : "Official Reports"}</span>
                </button>
              </div>
            </motion.header>

            {/* ── 2. STATS BAR ── */}
            <motion.section variants={fadeUp} className="rcc-stats">
              {[
                { label: ar ? "إجمالي التقارير" : "Total Reports", value: stats.total, icon: BarChart3, cls: "rcc-stat--blue" },
                { label: ar ? "التقارير الجاهزة" : "Ready Reports", value: stats.ready, icon: CheckCircle2, cls: "rcc-stat--emerald" },
                { label: ar ? "التقارير المالية" : "Financial Reports", value: stats.finance, icon: Wallet2, cls: "rcc-stat--teal" },
                { label: ar ? "قابلة للطباعة" : "Printable", value: stats.printable, icon: Printer, cls: "rcc-stat--violet" },
                { label: ar ? "قريبًا / قيد الربط" : "Coming Soon", value: stats.soon, icon: Star, cls: "rcc-stat--amber" },
              ].map((s) => (
                <div key={s.label} className={`rcc-stat ${s.cls}`}>
                  <div className="rcc-stat__blob rcc-stat__blob--tl" />
                  <div className="rcc-stat__blob rcc-stat__blob--br" />
                  <div className="rcc-stat__body">
                    <div className="rcc-stat__icon-wrap"><s.icon size={16} /></div>
                    <div className="rcc-stat__text">
                      <span className="rcc-stat__value">{s.value}</span>
                      <span className="rcc-stat__label">{s.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.section>

            {/* ── 3. FILTER BAR ── */}
            <motion.div variants={fadeUp} className="rcc-fbar">
              <label className="rcc-fbar__pill" style={{ minWidth: 200 }}>
                <Search size={14} className="rcc-fbar__icon" />
                <input className="rcc-fbar__input" placeholder={ar ? "بحث باسم التقرير..." : "Search reports..."} value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
              </label>
              <label className="rcc-fbar__pill">
                <Filter size={14} className="rcc-fbar__icon" />
                <select className="rcc-fbar__select" value={secFilter} onChange={(e) => setSecFilter(e.target.value as SectionFilter)}>
                  {(Object.keys(sectionLabelAr) as SectionFilter[]).map((k) => <option key={k} value={k}>{ar ? sectionLabelAr[k] : sectionLabelEn[k]}</option>)}
                </select>
              </label>
              <label className="rcc-fbar__pill">
                <Filter size={14} className="rcc-fbar__icon" />
                <select className="rcc-fbar__select" value={statusFlt} onChange={(e) => setStatusFlt(e.target.value as StatusFilter)}>
                  {(Object.keys(statusFilterAr) as StatusFilter[]).map((k) => <option key={k} value={k}>{ar ? statusFilterAr[k] : statusFilterEn[k]}</option>)}
                </select>
              </label>
              <label className="rcc-fbar__pill">
                <Printer size={14} className="rcc-fbar__icon" />
                <select className="rcc-fbar__select" value={outputFlt} onChange={(e) => setOutputFlt(e.target.value as OutputFilter)}>
                  {(Object.keys(outputFilterAr) as OutputFilter[]).map((k) => <option key={k} value={k}>{ar ? outputFilterAr[k] : outputFilterEn[k]}</option>)}
                </select>
              </label>
              <div className="rcc-fbar__spacer" />
              {hasActiveFilters && (
                <button className="rcc-fbar__reset" onClick={resetCatalogFilters} title={ar ? "إعادة ضبط" : "Reset"}>
                  <RotateCcw size={14} />
                </button>
              )}
            </motion.div>

            {/* ── 4. FEATURED ── */}
            {!hasActiveFilters && featuredCards.length > 0 && (
              <motion.section variants={fadeUp}>
                <div className="rcc-sec__head">
                  <div className="rcc-sec__ico rcc-sec__ico--blue"><Star size={14} /></div>
                  <h2 className="rcc-sec__title">{ar ? "التقارير الأكثر استخدامًا" : "Most Used Reports"}</h2>
                </div>
                <div className="rcc-featured">
                  {featuredCards.map((card, i) => {
                    const group = REPORT_GROUPS.find((g) => g.id === card.section)!;
                    return renderCard(card, group, i);
                  })}
                </div>
              </motion.section>
            )}

            {/* ── 5. CATALOG ── */}
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <motion.section key={group.id} variants={fadeUp}>
                  <div className="rcc-sec__head">
                    <div className={`rcc-sec__ico rcc-sec__ico--${group.color}`}><group.icon size={14} /></div>
                    <h2 className="rcc-sec__title">{ar ? group.nameAr : group.nameEn}</h2>
                    <span className="rcc-sec__count">{group.cards.length} {ar ? "تقارير" : "reports"}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.cards.map((card, i) => renderCard(card, group, i))}
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
          <motion.div key="unified" variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />} onClick={handleBack}>
                {ar ? "رجوع للفهرس" : "Back"}
              </Button>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{activeTitle}</h2>
              <div className="flex-1" />
              <Button variant="secondary" size="sm" leftIcon={<RefreshCw className={`w-4 h-4 ${(activeQuery as any).isFetching ? "animate-spin" : ""}`} />} onClick={refreshData}>
                {ar ? "تحديث" : "Refresh"}
              </Button>
              {!activeSummary && (
                <>
                  <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => void handleExport("PDF")} disabled={exportLoading} isLoading={exportLoading}>
                    {ar ? "PDF تصدير" : "Export PDF"}
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />} onClick={() => void handleExport("XLSX")} disabled={exportLoading} isLoading={exportLoading}>
                    {ar ? "Excel تصدير" : "Export Excel"}
                  </Button>
                </>
              )}
            </div>

            <div className="rcc-fbar">
              <label className="rcc-fbar__pill" style={{ minWidth: 240 }}>
                <Search size={14} className="rcc-fbar__icon" />
                <input className="rcc-fbar__input" placeholder={ar ? "بحث في التقرير..." : "Search report..."} value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
              </label>
              {canLoadCenters && (
                <label className="rcc-fbar__pill">
                  <Building2 size={14} className="rcc-fbar__icon" />
                  <select className="rcc-fbar__select" value={filters.centerId || ""} onChange={(e) => { setFilters({ ...filters, centerId: Number(e.target.value) || undefined }); setPage(1); }}>
                    <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
                    {centersQ.data?.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              )}
              {!activeSummary && (
                <>
                  <label className="rcc-fbar__pill">
                    <CalendarDays size={14} className="rcc-fbar__icon" />
                    <input type="date" className="rcc-fbar__input" style={{ width: 130 }} value={filters.from} onChange={(e) => { setFilters({ ...filters, from: e.target.value }); setPage(1); }} />
                  </label>
                  <label className="rcc-fbar__pill">
                    <CalendarDays size={14} className="rcc-fbar__icon" />
                    <input type="date" className="rcc-fbar__input" style={{ width: 130 }} value={filters.to} onChange={(e) => { setFilters({ ...filters, to: e.target.value }); setPage(1); }} />
                  </label>
                </>
              )}
              <div className="rcc-fbar__spacer" />
              <button className="rcc-fbar__reset" onClick={() => { setFilters({ from: defaultFrom, to: defaultTo, search: "" }); setPage(1); }} title={ar ? "تصفير" : "Reset"}>
                <RotateCcw size={14} />
              </button>
            </div>

            {!activeSummary && exportError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {exportError}
              </p>
            )}
            {!activeSummary && exportSuccess && (
              <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {exportSuccess}
              </p>
            )}

            {(activeQuery as any).isLoading ? (
              <div className="flex flex-col gap-3">{[1, 2, 3].map((i) => <div key={i} className="rcc-skel" />)}</div>
            ) : (activeQuery as any).isError ? (
              <ErrorState title={ar ? "تعذر تحميل بيانات التقرير" : "Unable to load report data"} onRetry={() => void (activeQuery as any).refetch()} />
            ) : (
              <DataTable
                columns={columns}
                rows={pagedRows}
                rowKey={(_, i) => i}
                dense
                emptyState={
                  <div className="rcc-empty">
                    <div className="rcc-empty__ico"><Search size={24} /></div>
                    <p className="rcc-empty__title">{ar ? "لا توجد بيانات" : "No data found"}</p>
                    <p className="rcc-empty__desc">{ar ? "جرّب تعديل الفلاتر." : "Try adjusting filters."}</p>
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
