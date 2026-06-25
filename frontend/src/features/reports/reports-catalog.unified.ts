import type { ComponentType } from "react";
import {
  Activity,
  BookOpen,
  Building2,
  CircleDot,
  ClipboardCheck,
  FileCheck2,
  FileText,
  HandHeart,
  Scale,
  ShieldCheck,
  Users,
  Wallet2,
} from "lucide-react";

export type SectionFilterId =
  | "educational"
  | "financial-reports"
  | "audit-reports"
  | "operational-sheets"
  | "donors-reports"
  | "receipts-reports";

export type CatalogCardDef = {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: ComponentType<{ className?: string; size?: number | string }>;
  status: "ready" | "needs-data" | "coming-soon";
  kind: "report" | "inline-report" | "summary-report" | "external-route" | "operational-list" | "coming-soon";
  reportType?: "ATTENDANCE" | "FOLLOW_UP" | "EXAMS" | "FINANCE";
  summaryKey?: "centers" | "circles" | "students" | "golden-records";
  href?: string;
  section: SectionFilterId;
  scope: "org" | "center" | "circle" | "student" | "finance";
  outputs: ("screen" | "print" | "pdf" | "excel")[];
  featured?: boolean;
  visibility: "all" | "super" | "center";
};

export type CatalogGroupDef = {
  id: SectionFilterId;
  nameAr: string;
  nameEn: string;
  color: string;
  icon: ComponentType<{ className?: string; size?: number | string }>;
  cards: CatalogCardDef[];
};

export const UNIFIED_CATALOG: CatalogGroupDef[] = [
  /* ════════════════════════════════════════════
     القسم الأول: التقارير التعليمية والتربوية
     ════════════════════════════════════════════ */
  {
    id: "educational",
    nameAr: "التقارير التعليمية والتربوية",
    nameEn: "Educational Reports",
    color: "teal",
    icon: BookOpen,
    cards: [
      {
        id: "centers-summary",
        kind: "summary-report",
        nameAr: "نظرة عامة على الجمعية",
        nameEn: "Organization Overview",
        descAr: "عدد المراكز والحلقات والموظفين",
        descEn: "Centers, circles and staff counts",
        icon: Building2,
        status: "ready",
        summaryKey: "centers",
        section: "educational",
        scope: "org",
        outputs: ["screen", "print", "excel"],
        featured: true,
        visibility: "super",
      },
      {
        id: "circles-summary",
        kind: "summary-report",
        nameAr: "تقرير الحلقات",
        nameEn: "Circles Report",
        descAr: "الحلقات حسب المركز والمعلم والطلاب",
        descEn: "Circles by center, teacher and students",
        icon: CircleDot,
        status: "ready",
        summaryKey: "circles",
        section: "educational",
        scope: "center",
        outputs: ["screen", "print", "excel"],
        visibility: "all",
      },
      {
        id: "students-summary",
        kind: "summary-report",
        nameAr: "تقرير الطلاب",
        nameEn: "Students Report",
        descAr: "الطلاب حسب المركز والحالة",
        descEn: "Students by center and status",
        icon: Users,
        status: "ready",
        summaryKey: "students",
        section: "educational",
        scope: "center",
        outputs: ["screen", "print", "excel"],
        visibility: "all",
      },
      {
        id: "follow-up",
        kind: "report",
        nameAr: "التقرير الشهري التفصيلي للطالب",
        nameEn: "Student Monthly Detailed Report",
        descAr: "تقرير شهري تفصيلي للطالب (حفظ/مراجعة/متون/إنجاز جماعي) للطباعة و PDF",
        descEn: "Detailed monthly student report (memorization/review/mutun) for print & PDF",
        icon: Activity,
        status: "ready",
        href: "/reports/student-monthly",
        section: "educational",
        scope: "student",
        outputs: ["screen", "print", "pdf"],
        featured: true,
        visibility: "all",
      },
      {
        id: "attendance",
        kind: "inline-report",
        nameAr: "حضور الطلاب",
        nameEn: "Student Attendance",
        descAr: "سجل الحضور والغياب والتأخير",
        descEn: "Attendance, absence and late records",
        icon: ClipboardCheck,
        status: "ready",
        reportType: "ATTENDANCE",
        section: "educational",
        scope: "circle",
        outputs: ["screen", "print"],
        visibility: "all",
      },
      {
        id: "exams",
        kind: "inline-report",
        nameAr: "نتائج الاختبارات",
        nameEn: "Exam Results",
        descAr: "النتائج والنجاح ومعدل الأداء",
        descEn: "Results, pass rates and performance",
        icon: FileCheck2,
        status: "ready",
        reportType: "EXAMS",
        section: "educational",
        scope: "center",
        outputs: ["screen", "print"],
        visibility: "all",
      },
      {
        id: "staff-report",
        kind: "inline-report",
        nameAr: "حضور الكادر",
        nameEn: "Staff Attendance",
        descAr: "حضور الموظفين والإجازات والخصومات",
        descEn: "Staff attendance, leaves and deductions",
        icon: Users,
        status: "ready",
        section: "educational",
        scope: "center",
        outputs: ["screen", "print"],
        visibility: "all",
      },
    ],
  },

  /* ════════════════════════════════════════════
     القسم الثاني: التقارير المالية الرسمية
     ════════════════════════════════════════════ */
  {
    id: "financial-reports",
    nameAr: "التقارير المالية الرسمية",
    nameEn: "Financial Reports",
    color: "teal",
    icon: Scale,
    cards: [
      {
        id: "fin-pos",
        kind: "report",
        nameAr: "قائمة المركز المالي",
        nameEn: "Financial Position",
        descAr: "الأصول والخصوم وصافي الأصول للداعمين",
        descEn: "Assets, liabilities and net assets",
        icon: Scale,
        status: "ready",
        href: "/finance/reports/financial-position",
        section: "financial-reports",
        scope: "finance",
        outputs: ["screen", "print", "pdf", "excel"],
        featured: true,
        visibility: "all",
      },
      {
        id: "fin-activities",
        kind: "report",
        nameAr: "قائمة الأنشطة",
        nameEn: "Statement of Activities",
        descAr: "الإيرادات والمصروفات والفائض",
        descEn: "Revenue, expenses and surplus",
        icon: Activity,
        status: "ready",
        href: "/finance/reports/statement-of-activities",
        section: "financial-reports",
        scope: "finance",
        outputs: ["screen", "print", "pdf", "excel"],
        featured: true,
        visibility: "all",
      },
      {
        id: "center-funding",
        kind: "report",
        nameAr: "تمويل وتكلفة المراكز",
        nameEn: "Center Funding & Cost",
        descAr: "تمويل وتكاليف تشغيل المراكز",
        descEn: "Center funding and operating costs",
        icon: Building2,
        status: "ready",
        href: "/finance/reports/center-funding",
        section: "financial-reports",
        scope: "finance",
        outputs: ["screen", "print", "pdf", "excel"],
        visibility: "all",
      },
      {
        id: "finance-invoices",
        kind: "inline-report",
        nameAr: "الفواتير والتحصيل",
        nameEn: "Invoices & Collection",
        descAr: "الفواتير والمبالغ المستحقة والمحصلة",
        descEn: "Invoices, amounts due and collected",
        icon: FileText,
        status: "ready",
        reportType: "FINANCE",
        section: "financial-reports",
        scope: "finance",
        outputs: ["screen", "print"],
        visibility: "all",
      },
    ],
  },

  /* ════════════════════════════════════════════
     القسم الثالث: تقارير الرقابة والمراجعة
     ════════════════════════════════════════════ */
  {
    id: "audit-reports",
    nameAr: "تقارير الرقابة والمراجعة",
    nameEn: "Audit & Control Reports",
    color: "teal",
    icon: ShieldCheck,
    cards: [
      {
        id: "accounting-ledger",
        kind: "external-route",
        nameAr: "دفتر الأستاذ",
        nameEn: "General Ledger",
        descAr: "سجل تفصيلي لجميع الحركات المحاسبية",
        descEn: "Detailed record of all accounting transactions",
        icon: BookOpen,
        status: "ready",
        href: "/finance/accounting/ledger",
        section: "audit-reports",
        scope: "finance",
        outputs: ["screen", "print", "pdf"],
        visibility: "all",
      },
      {
        id: "accounting-trial-balance",
        kind: "external-route",
        nameAr: "ميزان المراجعة",
        nameEn: "Trial Balance",
        descAr: "ملخص أرصدة الحسابات قبل إعداد القوائم المالية",
        descEn: "Summary of account balances before financial statements",
        icon: Scale,
        status: "ready",
        href: "/finance/accounting/trial-balance",
        section: "audit-reports",
        scope: "finance",
        outputs: ["screen", "print", "pdf"],
        visibility: "all",
      },
    ],
  },

  /* ════════════════════════════════════════════
     القسم الرابع: الكشوف التشغيلية
     ════════════════════════════════════════════ */
  {
    id: "operational-sheets",
    nameAr: "الكشوف التشغيلية",
    nameEn: "Operational Sheets",
    color: "teal",
    icon: FileText,
    cards: [
      {
        id: "operational-invoices",
        kind: "operational-list",
        nameAr: "كشف الفواتير والتحصيل",
        nameEn: "Invoices & Collection",
        descAr: "الفواتير والمبالغ المستحقة والمحصلة",
        descEn: "Invoices, amounts due and collected",
        icon: FileText,
        status: "ready",
        href: "/finance/invoices",
        section: "operational-sheets",
        scope: "finance",
        outputs: ["screen", "print"],
        visibility: "all",
      },
      {
        id: "operational-payments",
        kind: "operational-list",
        nameAr: "كشف المدفوعات",
        nameEn: "Payments",
        descAr: "المدفوعات والمبالغ المصروفة",
        descEn: "Payments and disbursed amounts",
        icon: Wallet2,
        status: "ready",
        href: "/finance/payments",
        section: "operational-sheets",
        scope: "finance",
        outputs: ["screen", "print"],
        visibility: "all",
      },
      {
        id: "fin-vouchers",
        kind: "operational-list",
        nameAr: "كشف السندات",
        nameEn: "Vouchers",
        descAr: "سندات القبض والصرف",
        descEn: "Receipt and payment vouchers",
        icon: ClipboardCheck,
        status: "ready",
        href: "/finance/vouchers",
        section: "operational-sheets",
        scope: "finance",
        outputs: ["screen", "print"],
        visibility: "all",
      },
      {
        id: "fin-expenses",
        kind: "operational-list",
        nameAr: "كشف المصروفات",
        nameEn: "Expenses",
        descAr: "المصروفات والموردون",
        descEn: "Expenses and suppliers",
        icon: Wallet2,
        status: "ready",
        href: "/finance/expenses",
        section: "operational-sheets",
        scope: "finance",
        outputs: ["screen", "print"],
        visibility: "all",
      },
      {
        id: "operational-treasury",
        kind: "operational-list",
        nameAr: "كشف الخزينة",
        nameEn: "Treasury",
        descAr: "حركة الخزينة والأرصدة النقدية",
        descEn: "Treasury movements and cash balances",
        icon: Wallet2,
        status: "ready",
        href: "/finance/treasury",
        section: "operational-sheets",
        scope: "finance",
        outputs: ["screen", "print"],
        visibility: "all",
      },
      {
        id: "fin-donors",
        kind: "operational-list",
        nameAr: "سجل المتبرعين والتبرعات",
        nameEn: "Donors & Donations",
        descAr: "المتبرعون وسجل التبرعات",
        descEn: "Donors and donations record",
        icon: HandHeart,
        status: "ready",
        href: "/finance/donors",
        section: "operational-sheets",
        scope: "finance",
        outputs: ["screen", "print"],
        visibility: "all",
      },
    ],
  },

  /* ════════════════════════════════════════════
     القسم الخامس: تقارير التبرعات والداعمين
     ════════════════════════════════════════════ */
  {
    id: "donors-reports",
    nameAr: "تقارير التبرعات والداعمين",
    nameEn: "Donors & Donations Reports",
    color: "teal",
    icon: HandHeart,
    cards: [
      {
        id: "donations-report",
        kind: "report",
        nameAr: "تقرير التبرعات العامة",
        nameEn: "Donations Report",
        descAr: "عرض جميع التبرعات العامة الواردة للجمعية مع تحليل وتصنيف حسب الفترة والفلاتر",
        descEn: "View all general donations received with analysis and filtering",
        icon: HandHeart,
        status: "ready",
        href: "/finance/reports/donations",
        section: "donors-reports",
        scope: "finance",
        outputs: ["screen", "print", "pdf", "excel"],
        featured: true,
        visibility: "all",
      },
    ],
  },

  /* ════════════════════════════════════════════
     القسم السادس: تقارير الإيصالات والسندات
     ════════════════════════════════════════════ */
  {
    id: "receipts-reports",
    nameAr: "تقارير الإيصالات والسندات",
    nameEn: "Receipts & Vouchers Reports",
    color: "indigo",
    icon: FileText,
    cards: [
      {
        id: "receipts-report",
        kind: "report",
        nameAr: "تقرير الإيصالات وسندات القبض",
        nameEn: "Receipts & Revenue Vouchers Report",
        descAr: "جميع سندات القبض والإيصالات التي دخلت إلى الجمعية مع إمكانية التصفية والطباعة",
        descEn: "All receipts and revenue vouchers received by the organization",
        icon: FileText,
        status: "ready",
        href: "/finance/reports/receipts",
        section: "receipts-reports",
        scope: "finance",
        outputs: ["screen", "print", "pdf", "excel"],
        featured: true,
        visibility: "all",
      },
    ],
  },
];
