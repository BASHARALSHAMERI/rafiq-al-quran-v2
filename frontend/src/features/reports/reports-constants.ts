import { type ComponentType } from "react";
import {
  Building2,
  BookOpen,
  CircleDot,
  Users,
  Activity,
  ClipboardCheck,
  FileCheck2,
  Scale,
  HandHeart,
  FileText,
  Wallet2
} from "lucide-react";
import type { ReportType } from "./types";
import { UNIFIED_CATALOG } from "./reports-catalog.unified";

export type ReportStatus = "ready" | "needs-data" | "coming-soon";
export type ViewLevel = "CATALOG" | "UNIFIED" | "STAFF";
export type SectionFilter = "all" | "admin" | "educational" | "attendance" | "exams" | "golden" | "finance" | "official" | "financial-reports" | "audit-reports" | "operational-sheets" | "donors-reports" | "receipts-reports";
export type StatusFilter = "all" | "ready" | "coming-soon" | "needs-data";
export type OutputFilter = "all" | "screen" | "print" | "pdf" | "excel";
export type OutputTag = "screen" | "print" | "pdf" | "excel";
export type ScopeTag = "org" | "center" | "circle" | "student" | "finance";
export type RoleVisibility = "all" | "super" | "center";

export type ReportCardDef = {
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

export type ReportGroupDef = {
  id: SectionFilter;
  nameAr: string;
  nameEn: string;
  color: string;
  icon: ComponentType<{ className?: string; size?: number | string }>;
  cards: ReportCardDef[];
};

export const REPORT_GROUPS: ReportGroupDef[] = [
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

export const ACTIVE_CATALOG: ReportGroupDef[] = UNIFIED_CATALOG.length > 0 ? (UNIFIED_CATALOG as unknown as ReportGroupDef[]) : REPORT_GROUPS;
export const ALL_CARDS = ACTIVE_CATALOG.flatMap((g) => g.cards);

export const toDisplay = (value: unknown): string => {
  if (value == null) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const humanize = (key: string) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();

export const statusBadge = (value: string): "default" | "success" | "warning" | "error" => {
  const upper = value.toUpperCase();
  if (["PAID", "COMPLETED", "PUBLISHED", "PASSED", "PRESENT", "SUCCESS", "APPROVED"].includes(upper)) return "success";
  if (["PARTIAL", "PENDING", "LATE", "IN_PROGRESS", "DRAFT"].includes(upper)) return "warning";
  if (["FAILED", "CANCELLED", "ABSENT", "ERROR", "REJECTED"].includes(upper)) return "error";
  return "default";
};

export const statusLabelAr: Record<ReportStatus, string> = { ready: "جاهز", "needs-data": "يحتاج بيانات", "coming-soon": "قريبًا" };
export const statusLabelEn: Record<ReportStatus, string> = { ready: "Ready", "needs-data": "Needs Data", "coming-soon": "Coming Soon" };

export const sectionLabelAr: Record<SectionFilter, string> = { all: "الكل", admin: "إداري", educational: "التعليمية والتربوية", attendance: "حضور", exams: "اختبارات", golden: "سجل ذهبي", finance: "مالي", official: "رسمي", "financial-reports": "التقارير المالية", "audit-reports": "الرقابة والمراجعة", "operational-sheets": "الكشوف التشغيلية", "donors-reports": "التبرعات والداعمين", "receipts-reports": "الإيصالات والسندات" };
export const sectionLabelEn: Record<SectionFilter, string> = { all: "All", admin: "Admin", educational: "Educational", attendance: "Attendance", exams: "Exams", golden: "Golden", finance: "Finance", official: "Official", "financial-reports": "Financial", "audit-reports": "Audit", "operational-sheets": "Operational", "donors-reports": "Donors", "receipts-reports": "Receipts" };
export const statusFilterAr: Record<StatusFilter, string> = { all: "الكل", ready: "جاهز", "coming-soon": "قريبًا", "needs-data": "يحتاج ربط" };
export const statusFilterEn: Record<StatusFilter, string> = { all: "All", ready: "Ready", "coming-soon": "Soon", "needs-data": "Needs Data" };
export const outputFilterAr: Record<OutputFilter, string> = { all: "الكل", screen: "شاشة", print: "طباعة", pdf: "PDF", excel: "Excel" };
export const outputFilterEn: Record<OutputFilter, string> = { all: "All", screen: "Screen", print: "Print", pdf: "PDF", excel: "Excel" };
export const scopeLabelAr: Record<ScopeTag, string> = { org: "جمعية", center: "مركز", circle: "حلقة", student: "طالب", finance: "مالي" };

export const financeSections = ["finance", "financial-reports", "audit-reports", "operational-sheets", "donors-reports", "receipts-reports"];

export const canSeeCard = (card: ReportCardDef, role: string | undefined): boolean => {
  if (role === "ACCOUNTANT") return financeSections.includes(card.section);
  if (card.visibility === "all") return true;
  if (card.visibility === "super" && role === "SUPER_ADMIN") return true;
  if (card.visibility === "center" && role === "CENTER_ADMIN") return true;
  return false;
};
