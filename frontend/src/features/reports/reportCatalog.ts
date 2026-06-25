import type { ReportDefinition } from "./types";

export const REPORT_CATALOG: ReportDefinition[] = [
  {
    id: "financial_position",
    title: "قائمة المركز المالي",
    subtitle: "تعرض الأصول والخصوم وصافي الأصول",
    category: "finance",
    icon: "Scale",
    route: "/finance/reports/financial-position",
    status: "ready",
    tags: ["مالي", "مركز مالي", "ميزانية"],
    filters: [
      { id: "centerId", label: "المركز", type: "select", defaultValue: "all" },
      { id: "toDate", label: "حتى تاريخ", type: "date" },
    ],
    exports: ["pdf", "excel", "print"],
    permission: "reports.finance.view",
    dataSourceNote: "يعتمد على الحسابات وقيود اليومية المرحلة",
    printTemplate: "financial",
  },
  {
    id: "statement_of_activities",
    title: "قائمة الأنشطة",
    subtitle: "تعرض الإيرادات والمصروفات وفائض أو عجز الفترة",
    category: "finance",
    icon: "Activity",
    route: "/finance/reports/statement-of-activities",
    status: "ready",
    tags: ["مالي", "إيرادات", "مصروفات", "فائض"],
    filters: [
      { id: "centerId", label: "المركز", type: "select", defaultValue: "all" },
      { id: "fromDate", label: "من تاريخ", type: "date" },
      { id: "toDate", label: "إلى تاريخ", type: "date" },
    ],
    exports: ["pdf", "excel", "print"],
    permission: "reports.finance.view",
    dataSourceNote: "يعتمد على أرصدة حسابات الإيرادات والمصروفات خلال الفترة المحددة",
    printTemplate: "financial",
  },
  {
    id: "donations",
    title: "تقرير التبرعات العامة",
    subtitle: "جميع التبرعات الواردة حسب الفترة والفلاتر",
    category: "donors",
    icon: "HandHeart",
    route: "/finance/reports/donations",
    status: "ready",
    tags: ["داعمين", "تبرعات", "مالي"],
    filters: [
      { id: "centerId", label: "المركز", type: "select", defaultValue: "all" },
      { id: "donorId", label: "الداعم", type: "select", dependsOn: "centerId" },
      { id: "status", label: "الحالة", type: "select" },
      { id: "paymentMethod", label: "طريقة الدفع", type: "select" },
      { id: "search", label: "بحث", type: "search", placeholder: "بحث..." },
      { id: "fromDate", label: "من تاريخ", type: "date" },
      { id: "toDate", label: "إلى تاريخ", type: "date" },
    ],
    exports: ["pdf", "excel", "print"],
    permission: "reports.donations.view",
    printTemplate: "financial",
  },
  {
    id: "receipts_report",
    title: "تقرير الإيصالات وسندات القبض",
    subtitle: "جميع سندات القبض والإيصالات الواردة للجمعية",
    category: "finance",
    icon: "FileText",
    route: "/finance/reports/receipts",
    status: "ready",
    tags: ["مالي", "إيصالات", "سندات قبض"],
    filters: [
      { id: "centerId", label: "المركز", type: "select", defaultValue: "all" },
      { id: "accountId", label: "الحساب", type: "select", dependsOn: "centerId" },
      { id: "status", label: "الحالة", type: "select" },
      { id: "sourceType", label: "المصدر", type: "select" },
      { id: "paymentMethod", label: "طريقة الدفع", type: "select" },
      { id: "search", label: "بحث", type: "search", placeholder: "بحث..." },
      { id: "fromDate", label: "من تاريخ", type: "date" },
      { id: "toDate", label: "إلى تاريخ", type: "date" },
    ],
    exports: ["pdf", "excel", "print"],
    permission: "reports.vouchers.view",
    printTemplate: "financial",
  },
  {
    id: "center_funding",
    title: "تقرير تمويل وتكلفة المراكز",
    subtitle: "التمويل مقابل تكاليف التشغيل للمراكز",
    category: "finance",
    icon: "Building2",
    route: "/finance/reports/center-funding",
    status: "ready",
    tags: ["مالي", "مراكز", "تمويل", "تكلفة"],
    filters: [
      { id: "centerId", label: "المركز", type: "select", defaultValue: "all" },
      { id: "search", label: "بحث", type: "search", placeholder: "بحث بالمركز..." },
      { id: "fromDate", label: "من تاريخ", type: "date" },
      { id: "toDate", label: "إلى تاريخ", type: "date" },
    ],
    exports: ["pdf", "excel", "print"],
    permission: "reports.finance.view",
    printTemplate: "financial",
  },
];

export const REPORTS_BY_CATEGORY = REPORT_CATALOG.reduce((acc, report) => {
  if (!acc[report.category]) acc[report.category] = [];
  acc[report.category].push(report);
  return acc;
}, {} as Record<string, ReportDefinition[]>);

export const getReportStats = () => ({
  total: REPORT_CATALOG.length,
  ready: REPORT_CATALOG.filter((r) => r.status === "ready").length,
  finance: REPORT_CATALOG.filter((r) => r.category === "finance").length,
  needsBackend: REPORT_CATALOG.filter((r) => r.status === "needs_backend").length,
});

export const searchReports = (query: string) => {
  const q = query.toLowerCase();
  return REPORT_CATALOG.filter((r) =>
    r.title.toLowerCase().includes(q) ||
    r.subtitle.toLowerCase().includes(q) ||
    r.tags.some((tag) => tag.toLowerCase().includes(q))
  );
};

export const filterByCategory = (category: string) =>
  category === "all" ? REPORT_CATALOG : REPORT_CATALOG.filter((r) => r.category === category);
