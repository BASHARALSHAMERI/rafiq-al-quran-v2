/**
 * ═══════════════════════════════════════════════════════════════
 * ROUTE META — Unified Navigation Registry
 * سجل التنقل الموحّد — مصدر واحد لجميع الأقسام والمسارات
 * ═══════════════════════════════════════════════════════════════
 */

import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarClock,
  CalendarDays,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  BellRing,
  BookOpen,
  Wallet,
  HandHeart,
  BarChart3,
  Settings,
  Table2,
  Scale,
  CircleDollarSign,
  PackageCheck,
  TrendingUp,
  Receipt,
  Fingerprint,
} from "lucide-react";
import { labels } from "../constants/labels";
import type { Role } from "../features/auth/types";

/* ─── Section IDs ─── */
/*
 * UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B:
 * "الشؤون المالية" الكبيرة (financeReports) تم تفكيكها إلى 3 أقسام وظيفية:
 *   financeRevenue      → الشؤون الإيرادية   (إيرادات + تحصيل)
 *   financeExpenditure  → الشؤون النفقية     (مصروفات + رواتب)
 *   financeLedger       → الخزينة والمحاسبة  (خزينة + أصول + محاسبة)
 * يُحتفظ بـ financeReports للـ routes القديمة (dashboard، center_funding، إلخ)
 * مع sidebar: false لضمان عدم ظهورها.
 */
export type AdminSectionId =
  | "home"
  | "institutional"
  | "users"
  | "operations"
  | "financeRevenue"
  | "financeExpenditure"
  | "financeLedger"
  | "financeReports"
  | "reports"
  | "system";

/* ─── Route IDs (fixed — no duplicates) ─── */

export type AdminRouteId =
  | "dashboard"
  | "notifications"
  | "centers"
  | "circles"
  | "students"
  | "center_admins"
  | "teachers"
  | "parents"
  | "supervisors"
  | "staff_attendance"
  | "self_attendance"
  | "exams"
  | "golden_records"
  | "library"
  | "finance_dashboard"
  | "finance_invoices"
  | "finance_vouchers"
  | "finance_donors"
  | "finance_treasury"
  | "finance_payroll"
  | "finance_rewards"
  | "finance_currencies"
  | "finance_expenses"
  | "finance_assets"
  | "finance_reports"
  | "finance_center_funding"
  | "finance_financial_position"
  | "finance_statement_of_activities"
  | "accounting_accounts"
  | "accounting_journal_entries"
  | "accounting_ledger"
  | "accounting_trial_balance"
  | "accounting_fiscal_periods"
  | "reports"
  | "finance_donations_report"
  | "finance_receipts_report"
  | "reports_student_monthly"
  | "audit"
  | "settings"
  | "graduation_candidates"
  | "accountants"
  | "finance_payroll_details";

/* ─── Meta Types ─── */

export type AdminRouteMeta = {
  id: AdminRouteId;
  path: string;
  label: string;
  routeIcon: ComponentType<{ className?: string }>;
  section: AdminSectionId;
  allowedRoles: Role[];
  sidebar: boolean;
};

export type AdminSectionMeta = {
  id: AdminSectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  routeIds: AdminRouteId[];
};

/* ─── Role Groups ─── */

const SUPER_ONLY: Role[] = ["SUPER_ADMIN"];
const SUPER_AND_CENTER: Role[] = ["SUPER_ADMIN", "CENTER_ADMIN"];
const CORE_ADMIN: Role[] = ["SUPER_ADMIN", "CENTER_ADMIN"];
const CORE_STAFF: Role[] = [...CORE_ADMIN];
const LIBRARY_ROLES: Role[] = [...CORE_ADMIN];
const FINANCE_WEB_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ACCOUNTANT",
  "FINANCE_MANAGER",
  "TREASURER",
  "AUDITOR"
];
// [PLATFORM POLICY] Mobile roles (TEACHER, SUPERVISOR, PARENT) removed from web routes
const REPORT_ROLES: Role[] = ["SUPER_ADMIN", "CENTER_ADMIN", "ACCOUNTANT", "FINANCE_MANAGER", "TREASURER", "AUDITOR"];
const SELF_ATTENDANCE_ROLES: Role[] = ["CENTER_ADMIN", "ACCOUNTANT", "FINANCE_MANAGER", "TREASURER", "AUDITOR"];
const NOTIFICATION_ROLES: Role[] = [...CORE_ADMIN];
const AUDIT_ROLES: Role[] = ["SUPER_ADMIN"];

/* ─── Sections ─── */
/*
 * UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B:
 * القائمة الجانبية النهائية:
 *   🏠 الرئيسية
 *   🏛️ الإدارة المؤسسية
 *   👥 المستخدمون
 *   📅 التشغيل والمتابعة
 *   📥 الشؤون الإيرادية        ← جديد (4 عناصر)
 *   📤 الشؤون النفقية          ← جديد (3 عناصر)
 *   ⚖️  الخزينة والمحاسبة      ← جديد (3 عناصر + تفاصيل محاسبة مخفية)
 *   📊 التقارير والتحليلات      ← leaf مستقل
 *   🛡️ الحوكمة
 */
export const ADMIN_SECTIONS: AdminSectionMeta[] = [
  {
    id: "home",
    get label() { return labels.common.breadcrumbHome; },
    icon: LayoutDashboard,
    routeIds: ["dashboard"],
  },
  {
    id: "institutional",
    get label() { return labels.nav.organization; },
    icon: Building2,
    routeIds: ["centers", "circles"],
  },
  {
    id: "users",
    get label() { return labels.nav.users; },
    icon: Users,
    routeIds: ["students", "center_admins", "teachers", "supervisors", "parents", "accountants"],
  },
  {
    id: "operations",
    get label() { return labels.nav.operations; },
    icon: CalendarDays,
    routeIds: ["self_attendance", "staff_attendance", "exams", "graduation_candidates", "golden_records", "library"],
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: Revenue inflows — invoices, payments, vouchers, donors
    id: "financeRevenue",
    get label() { return labels.nav.financeRevenue; },
    icon: TrendingUp,
    routeIds: [
      "finance_invoices",
      "finance_vouchers",
      "finance_donors",
    ],
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: Expenditure outflows — expenses, payroll, rewards
    id: "financeExpenditure",
    get label() { return labels.nav.financeExpenditure; },
    icon: Receipt,
    routeIds: [
      "finance_expenses",
      "finance_payroll",
      "finance_rewards",
    ],
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: Balance & control — treasury, currencies, assets, accounting
    id: "financeLedger",
    get label() { return labels.nav.financeLedger; },
    icon: Scale,
    routeIds: [
      "finance_treasury",
      "finance_currencies",
      "finance_assets",
      "accounting_accounts",
      // accounting_journal_entries / ledger / trial_balance / fiscal_periods: sidebar=false → مخفية
      // accessible from AccountingShared internal tabs
      "accounting_journal_entries",
      "accounting_ledger",
      "accounting_trial_balance",
      "accounting_fiscal_periods",
    ],
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-1 + 2B: Reports center as standalone leaf
    id: "reports",
    get label() { return labels.nav.reportsCenter; },
    icon: BarChart3,
    routeIds: ["reports"],
  },
  {
    // Legacy section — keeps deprecated/hidden finance routes typed correctly
    // finance_dashboard, finance_center_funding, finance_reports: all sidebar=false
    id: "financeReports",
    get label() { return labels.nav.finance; },
    icon: Wallet,
    routeIds: [
      "finance_dashboard",
      "finance_center_funding",
      "finance_financial_position",
      "finance_statement_of_activities",
      "finance_reports",
    ],
  },
  {
    id: "system",
    get label() { return labels.nav.governance; },
    icon: ShieldCheck,
    routeIds: ["notifications", "audit", "settings"],
  },
];

/* ─── Routes ─── */

export const ADMIN_ROUTES: AdminRouteMeta[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    get label() { return labels.nav.dashboard; },
    routeIcon: LayoutDashboard,
    section: "home",
    allowedRoles: [...CORE_STAFF, "ACCOUNTANT", "FINANCE_MANAGER", "TREASURER", "AUDITOR"],
    sidebar: true,
  },
  {
    id: "notifications",
    path: "/notifications",
    get label() { return labels.nav.notifications; },
    routeIcon: BellRing,
    section: "system",
    allowedRoles: NOTIFICATION_ROLES,
    sidebar: false,
  },
  {
    id: "centers",
    path: "/org/centers",
    get label() { return labels.org.centersMenu; },
    routeIcon: Building2,
    section: "institutional",
    allowedRoles: SUPER_ONLY,
    sidebar: true,
  },
  {
    id: "circles",
    path: "/org/circles",
    get label() { return labels.org.circlesMenu; },
    routeIcon: Building2,
    section: "institutional",
    allowedRoles: CORE_ADMIN,
    sidebar: true,
  },
  {
    id: "students",
    path: "/users/students",
    get label() { return labels.org.studentsMenu; },
    routeIcon: Users,
    section: "institutional",
    allowedRoles: CORE_STAFF,
    sidebar: true,
  },
  {
    id: "center_admins",
    path: "/users/center-admins",
    get label() { return labels.org.centerAdminsMenu; },
    routeIcon: ShieldCheck,
    section: "users",
    allowedRoles: SUPER_ONLY,
    sidebar: true,
  },
  {
    id: "teachers",
    path: "/users/teachers",
    get label() { return labels.org.teachersMenu; },
    routeIcon: Users,
    section: "institutional",
    allowedRoles: SUPER_AND_CENTER,
    sidebar: true,
  },
  {
    id: "parents",
    path: "/users/parents",
    get label() { return labels.org.parentsMenu; },
    routeIcon: Users,
    section: "institutional",
    allowedRoles: SUPER_AND_CENTER,
    sidebar: true,
  },
  {
    id: "supervisors",
    path: "/users/supervisors",
    get label() { return labels.org.supervisorsMenu; },
    routeIcon: Users,
    section: "institutional",
    allowedRoles: SUPER_AND_CENTER,
    sidebar: true,
  },
  {
    id: "accountants",
    path: "/users/accountants",
    get label() { return labels.org.accountantsMenu; },
    routeIcon: Users,
    section: "users",
    allowedRoles: SUPER_ONLY,
    sidebar: true,
  },
  {
    id: "self_attendance",
    path: "/daily/self-attendance",
    get label() { return labels.org.selfAttendanceMenu; },
    routeIcon: Fingerprint,
    section: "operations",
    allowedRoles: SELF_ATTENDANCE_ROLES,
    sidebar: true,
  },
  {
    id: "staff_attendance",
    path: "/daily/staff-attendance",
    get label() { return labels.org.staffAttendanceMenu; },
    routeIcon: CalendarDays,
    section: "operations",
    allowedRoles: SUPER_AND_CENTER,
    sidebar: true,
  },
  {
    id: "exams",
    path: "/exams",
    get label() { return labels.nav.exams; },
    routeIcon: FileText,
    section: "operations",
    allowedRoles: CORE_STAFF,
    sidebar: true,
  },
  {
    id: "graduation_candidates",
    path: "/graduation-candidates",
    label: "مرشحو التخرج",
    routeIcon: ClipboardCheck,
    section: "operations",
    allowedRoles: SUPER_AND_CENTER,
    sidebar: false,
  },
  {
    id: "golden_records",
    path: "/golden-records",
    get label() { return labels.nav.goldenRecord; },
    routeIcon: ClipboardCheck,
    section: "operations",
    allowedRoles: SUPER_AND_CENTER,
    sidebar: true,
  },
  {
    id: "library",
    path: "/library",
    get label() { return labels.nav.library; },
    routeIcon: BookOpen,
    section: "operations",
    allowedRoles: LIBRARY_ROLES,
    sidebar: true,
  },
  {
    // FA-5.4: Redirected route — FinanceDashboardPage removed.
    id: "finance_dashboard",
    path: "/finance/dashboard",
    get label() { return labels.nav.financeDashboard; },
    routeIcon: LayoutDashboard,
    section: "financeReports",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeRevenue
    id: "finance_invoices",
    path: "/finance/invoices",
    get label() { return labels.nav.financeInvoices; },
    routeIcon: FileText,
    section: "financeRevenue",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeRevenue
    id: "finance_vouchers",
    path: "/finance/vouchers",
    get label() { return labels.nav.financeVouchers; },
    routeIcon: FileText,
    section: "financeRevenue",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeRevenue
    id: "finance_donors",
    path: "/finance/donors",
    get label() { return labels.nav.financeDonors; },
    routeIcon: HandHeart,
    section: "financeRevenue",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeLedger
    id: "finance_treasury",
    path: "/finance/treasury",
    get label() { return labels.nav.financeTreasury; },
    routeIcon: Building2,
    section: "financeLedger",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeExpenditure
    id: "finance_payroll",
    path: "/finance/payroll",
    get label() { return labels.nav.financePayroll; },
    routeIcon: Users,
    section: "financeExpenditure",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeExpenditure
    id: "finance_rewards",
    path: "/finance/rewards",
    get label() { return labels.nav.financeRewards; },
    routeIcon: Wallet,
    section: "financeExpenditure",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    id: "finance_payroll_details",
    path: "/finance/payroll/batches/:id",
    get label() { return document.documentElement.lang === "ar" ? "تفاصيل مسير الرواتب" : "Payroll Batch Details"; },
    routeIcon: Receipt,
    section: "financeExpenditure",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeLedger (أداة تشغيل للمدفوعات والرواتب)
    id: "finance_currencies",
    path: "/finance/currencies",
    get label() { return labels.nav.financeCurrencies; },
    routeIcon: CircleDollarSign,
    section: "financeLedger",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // FA-EXPENSES-AP-1 | UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeExpenditure
    id: "finance_expenses",
    path: "/finance/expenses",
    get label() { return labels.nav.financeExpenses; },
    routeIcon: Receipt,
    section: "financeExpenditure",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // FA-ASSETS-1 | UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: → financeLedger
    id: "finance_assets",
    path: "/finance/assets",
    get label() { return document.documentElement.lang === "ar" ? "الأصول والعهد" : "Assets & Custody"; },
    routeIcon: PackageCheck,
    section: "financeLedger",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // FA-CENTER-FUNDING-UI-1: hidden from sidebar — accessible via /reports or direct URL
    id: "finance_center_funding",
    path: "/finance/reports/center-funding",
    get label() { return document.documentElement.lang === "ar" ? "تمويل وتكلفة المراكز" : "Center Funding & Cost"; },
    routeIcon: Building2,
    section: "financeReports",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    id: "finance_donations_report",
    path: "/finance/reports/donations",
    get label() { return document.documentElement.lang === "ar" ? "تقرير التبرعات العامة" : "Donations Report"; },
    routeIcon: HandHeart,
    section: "financeReports",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    id: "finance_receipts_report",
    path: "/finance/reports/receipts",
    get label() { return document.documentElement.lang === "ar" ? "تقرير الإيصالات وسندات القبض" : "Receipts Report"; },
    routeIcon: FileText,
    section: "financeReports",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    id: "finance_financial_position",
    path: "/finance/reports/financial-position",
    get label() { return document.documentElement.lang === "ar" ? "قائمة المركز المالي" : "Financial Position"; },
    routeIcon: Scale,
    section: "financeReports",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    id: "finance_statement_of_activities",
    path: "/finance/reports/statement-of-activities",
    get label() { return document.documentElement.lang === "ar" ? "قائمة الأنشطة" : "Statement of Activities"; },
    routeIcon: TrendingUp,
    section: "financeReports",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: single accounting entry → financeLedger
    id: "accounting_accounts",
    path: "/finance/accounting/accounts",
    get label() { return document.documentElement.lang === "ar" ? "المحاسبة" : "Accounting"; },
    routeIcon: Table2,
    section: "financeLedger",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: true,
  },
  {
    // Hidden from sidebar — accessible via AccountingShared internal tabs
    id: "accounting_journal_entries",
    path: "/finance/accounting/journal-entries",
    get label() { return labels.nav.accountingJournalEntries; },
    routeIcon: FileText,
    section: "financeLedger",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    // Hidden from sidebar — accessible via AccountingShared internal tabs
    id: "accounting_ledger",
    path: "/finance/accounting/ledger",
    get label() { return labels.nav.accountingLedger; },
    routeIcon: BookOpen,
    section: "financeLedger",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    // Hidden from sidebar — accessible via AccountingShared internal tabs
    id: "accounting_trial_balance",
    path: "/finance/accounting/trial-balance",
    get label() { return labels.nav.accountingTrialBalance; },
    routeIcon: Scale,
    section: "financeLedger",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    // Hidden from sidebar — accessible via AccountingShared internal tabs
    id: "accounting_fiscal_periods",
    path: "/finance/accounting/fiscal-periods",
    get label() { return document.documentElement.lang === "ar" ? "الفترات المالية" : "Fiscal Periods"; },
    routeIcon: CalendarClock,
    section: "financeLedger",
    allowedRoles: FINANCE_WEB_ROLES,
    sidebar: false,
  },
  {
    // FA-5.4: /finance/reports → /reports redirect
    id: "finance_reports",
    path: "/finance/reports",
    get label() { return labels.nav.financeReports; },
    routeIcon: BarChart3,
    section: "financeReports",
    allowedRoles: REPORT_ROLES,
    sidebar: false,
  },
  {
    // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-1 + 2B: standalone reports leaf
    id: "reports",
    path: "/reports",
    get label() { return labels.nav.reportsCenter; },
    routeIcon: BarChart3,
    section: "reports",
    allowedRoles: REPORT_ROLES,
    sidebar: true,
  },
  {
    // التقرير الشهري التفصيلي للطالب — يُفتح من كتالوج التقارير (غير ظاهر في الشريط الجانبي)
    id: "reports_student_monthly",
    path: "/reports/student-monthly",
    get label() { return document.documentElement.lang === "ar" ? "التقرير الشهري التفصيلي للطالب" : "Student Monthly Detailed Report"; },
    routeIcon: BarChart3,
    section: "reports",
    allowedRoles: REPORT_ROLES,
    sidebar: false,
  },
  {
    id: "audit",
    path: "/audit",
    get label() { return labels.nav.audit; },
    routeIcon: ShieldCheck,
    section: "system",
    allowedRoles: AUDIT_ROLES,
    sidebar: true,
  },
  {
    id: "settings",
    path: "/settings",
    get label() { return labels.nav.settings; },
    routeIcon: Settings,
    section: "system",
    allowedRoles: SUPER_ONLY,
    sidebar: true,
  },
];

/* ─── Lookup Helpers ─── */

export const ADMIN_ROUTE_BY_ID: Record<AdminRouteId, AdminRouteMeta> =
  ADMIN_ROUTES.reduce(
    (acc, route) => {
      acc[route.id] = route;
      return acc;
    },
    {} as Record<AdminRouteId, AdminRouteMeta>
  );

export const getRouteMetaByPath = (
  pathname: string
): AdminRouteMeta | undefined => {
  return ADMIN_ROUTES.find((route) => route.path === pathname);
};

export const roleCanAccessRoute = (
  role: Role,
  routeId: AdminRouteId
): boolean => {
  return ADMIN_ROUTE_BY_ID[routeId].allowedRoles.includes(role);
};

export const getVisibleSidebarRoutes = (role: Role): AdminRouteMeta[] => {
  return ADMIN_ROUTES.filter(
    (route) => route.sidebar && route.allowedRoles.includes(role)
  );
};

/* ─── Unified Section-by-Role Helper ─── */

export type ResolvedSection = {
  id: AdminSectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  routes: AdminRouteMeta[];
};

/**
 * Returns the sidebar sections visible to a given role.
 * Each section contains only the routes the role can access.
 * Sections with zero visible routes are excluded.
 *
 * This is the SINGLE SOURCE for sidebar rendering — no more
 * dual-path logic or hardcoded per-role layouts.
 */
export const getSectionsByRole = (role: Role): ResolvedSection[] => {
  const visibleRoutes = getVisibleSidebarRoutes(role);
  const routeMap = new Map(visibleRoutes.map((r) => [r.id, r]));

  return ADMIN_SECTIONS
    .map((section) => ({
      id: section.id,
      label: section.label,
      icon: section.icon,
      routes: section.routeIds
        .map((rid) => routeMap.get(rid))
        .filter((r): r is AdminRouteMeta => Boolean(r)),
    }))
    .filter((section) => section.routes.length > 0);
};

/* ─── Breadcrumb Helper ─── */

export type BreadcrumbTrail = {
  sectionLabel: string;
  pageLabel: string;
  sectionIcon: ComponentType<{ className?: string }>;
} | null;

/**
 * Given a pathname, returns the section label + page label
 * for breadcrumb rendering (e.g. "الإدارة المؤسسية › الحلقات").
 */
export const getBreadcrumb = (pathname: string): BreadcrumbTrail => {
  const route = getRouteMetaByPath(pathname);
  if (!route) return null;

  const section = ADMIN_SECTIONS.find((s) => s.id === route.section);
  if (!section) return null;

  return {
    sectionLabel: section.label,
    pageLabel: route.label,
    sectionIcon: section.icon,
  };
};
