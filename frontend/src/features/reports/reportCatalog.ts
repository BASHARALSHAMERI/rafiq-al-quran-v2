import type { ReportDefinition } from './types';

/**
 * Report Catalog — المصدر الوحيد لتعريفات التقارير
 * كل تقرير يُعرّف مرة واحدة هنا ويُستخدم في كل مكان.
 */
export const REPORT_CATALOG: ReportDefinition[] = [
  {
    id: 'org_overview',
    title: 'نظرة عامة على الجمعية',
    subtitle: 'عدد المراكز والحلقات والموظفين',
    category: 'overview',
    icon: 'Building2',
    route: '/reports/org-overview',
    status: 'ready',
    tags: ['إداري', 'مركز'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'search', label: 'بحث', type: 'search', placeholder: 'بحث...' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.overview.view',
    printTemplate: 'default',
  },
  {
    id: 'financial_position',
    title: 'قائمة المركز المالي',
    subtitle: 'تعرض الأصول والخصوم وصافي الأصول',
    category: 'finance',
    icon: 'Scale',
    route: '/finance/reports/financial-position',
    status: 'ready',
    tags: ['مالي', 'مركز', 'ميزانية'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'toDate', label: 'حتى تاريخ', type: 'date' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.finance.view',
    dataSourceNote: 'يعتمد على الحسابات وقيود اليومية (journal_entry_lines)',
    printTemplate: 'financial',
  },
  {
    id: 'memorization_revision',
    title: 'الحفظ والمراجعة',
    subtitle: 'سجل الحفظ والمراجعة للطلاب والحلقات',
    category: 'education',
    icon: 'BookOpen',
    route: '/reports/memorization-revision',
    status: 'ready',
    tags: ['تعليمي', 'حلقة', 'طالب'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'halqahId', label: 'الحلقة', type: 'select', dependsOn: 'centerId' },
      { id: 'studentId', label: 'الطالب', type: 'select', dependsOn: 'halqahId' },
      { id: 'month', label: 'الشهر', type: 'month' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.education.view',
    printTemplate: 'default',
  },
  {
    id: 'halqah_report',
    title: 'تقرير الحلقات',
    subtitle: 'الحلقات حسب المركز والمعلم والطلاب',
    category: 'education',
    icon: 'CircleDot',
    route: '/reports/halqahs',
    status: 'ready',
    tags: ['تعليمي', 'حلقة', 'معلم'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'halqahId', label: 'الحلقة', type: 'select', dependsOn: 'centerId' },
      { id: 'teacherId', label: 'المعلم', type: 'select', dependsOn: 'centerId' },
      { id: 'month', label: 'الشهر', type: 'month' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.halqahs.view',
    printTemplate: 'default',
  },
  {
    id: 'student_report',
    title: 'تقرير الطالب',
    subtitle: 'الطالب حسب المركز والحلقة والحضور والإنجاز',
    category: 'education',
    icon: 'Users',
    route: '/reports/students',
    status: 'ready',
    tags: ['تعليمي', 'طالب', 'حضور'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'halqahId', label: 'الحلقة', type: 'select', dependsOn: 'centerId' },
      { id: 'studentId', label: 'الطالب', type: 'select', dependsOn: 'halqahId' },
      { id: 'month', label: 'الشهر', type: 'month' },
    ],
    exports: ['pdf', 'print'],
    permission: 'reports.students.view',
    printTemplate: 'default',
  },
  {
    id: 'student_attendance',
    title: 'حضور الطلاب',
    subtitle: 'حضور الطلاب والغياب والتأخير',
    category: 'education',
    icon: 'ClipboardCheck',
    route: '/reports/student-attendance',
    status: 'ready',
    tags: ['تعليمي', 'حضور', 'طالب'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'halqahId', label: 'الحلقة', type: 'select', dependsOn: 'centerId' },
      { id: 'studentId', label: 'الطالب', type: 'select', dependsOn: 'halqahId' },
      { id: 'fromDate', label: 'من تاريخ', type: 'date' },
      { id: 'toDate', label: 'إلى تاريخ', type: 'date' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.attendance.view',
    printTemplate: 'default',
  },
  {
    id: 'exam_results',
    title: 'نتائج الاختبارات',
    subtitle: 'النتائج حسب الحلقة والطالب والاختبار',
    category: 'education',
    icon: 'FileCheck2',
    route: '/reports/exam-results',
    status: 'ready',
    tags: ['تعليمي', 'اختبارات', 'نتائج'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'halqahId', label: 'الحلقة', type: 'select', dependsOn: 'centerId' },
      { id: 'examId', label: 'الاختبار', type: 'select', dependsOn: 'halqahId' },
      { id: 'month', label: 'الشهر', type: 'month' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.exams.view',
    printTemplate: 'default',
  },
  {
    id: 'staff_attendance',
    title: 'حضور الكادر',
    subtitle: 'حضور المعلمين والموظفين',
    category: 'operations',
    icon: 'CalendarDays',
    route: '/reports/staff-attendance',
    status: 'ready',
    tags: ['تشغيلي', 'حضور', 'كادر'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'staffId', label: 'الموظف', type: 'select', dependsOn: 'centerId' },
      { id: 'fromDate', label: 'من تاريخ', type: 'date' },
      { id: 'toDate', label: 'إلى تاريخ', type: 'date' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.staff.view',
    printTemplate: 'default',
  },
  {
    id: 'donations',
    title: 'التبرعات',
    subtitle: 'المتبرعون والحملات العامة',
    category: 'donors',
    icon: 'HandHeart',
    route: '/reports/donations',
    status: 'needs_backend',
    tags: ['داعمين', 'تبرعات', 'مالي'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'donorId', label: 'المتبرع', type: 'select', dependsOn: 'centerId' },
      { id: 'donationType', label: 'نوع التبرع', type: 'select' },
      { id: 'fromDate', label: 'من تاريخ', type: 'date' },
      { id: 'toDate', label: 'إلى تاريخ', type: 'date' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.donations.view',
    dataSourceNote: 'يحتاج API مخصص للتبرعات',
    printTemplate: 'default',
  },
  {
    id: 'vouchers',
    title: 'السندات',
    subtitle: 'سندات القبض والصرف',
    category: 'finance',
    icon: 'FileText',
    route: '/reports/vouchers',
    status: 'needs_backend',
    tags: ['مالي', 'سندات', 'قبض', 'صرف'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'voucherType', label: 'نوع السند', type: 'select' },
      { id: 'status', label: 'الحالة', type: 'select' },
      { id: 'fromDate', label: 'من تاريخ', type: 'date' },
      { id: 'toDate', label: 'إلى تاريخ', type: 'date' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.vouchers.view',
    dataSourceNote: 'يحتاج API مخصص للسندات',
    printTemplate: 'default',
  },
  {
    id: 'expenses',
    title: 'المصروفات',
    subtitle: 'المصروفات والبنود',
    category: 'finance',
    icon: 'Wallet2',
    route: '/reports/expenses',
    status: 'needs_backend',
    tags: ['مالي', 'مصروفات', 'بنود'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'expenseCategory', label: 'التصنيف', type: 'select' },
      { id: 'fromDate', label: 'من تاريخ', type: 'date' },
      { id: 'toDate', label: 'إلى تاريخ', type: 'date' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.expenses.view',
    dataSourceNote: 'يحتاج API مخصص للمصروفات',
    printTemplate: 'default',
  },
  {
    id: 'invoices_collection',
    title: 'الفواتير والتحصيل',
    subtitle: 'الفواتير المستحقة والمحصلة',
    category: 'finance',
    icon: 'FileText',
    route: '/reports/invoices-collection',
    status: 'needs_backend',
    tags: ['مالي', 'فواتير', 'تحصيل'],
    filters: [
      { id: 'centerId', label: 'المركز', type: 'select', defaultValue: 'all' },
      { id: 'studentId', label: 'الطالب', type: 'select', dependsOn: 'centerId' },
      { id: 'status', label: 'الحالة', type: 'select' },
      { id: 'fromDate', label: 'من تاريخ', type: 'date' },
      { id: 'toDate', label: 'إلى تاريخ', type: 'date' },
    ],
    exports: ['pdf', 'excel', 'print'],
    permission: 'reports.invoices.view',
    dataSourceNote: 'يحتاج API مخصص للفواتير والتحصيل',
    printTemplate: 'default',
  },
];

/** تجميع التقارير حسب التصنيف */
export const REPORTS_BY_CATEGORY = REPORT_CATALOG.reduce((acc, report) => {
  if (!acc[report.category]) acc[report.category] = [];
  acc[report.category].push(report);
  return acc;
}, {} as Record<string, ReportDefinition[]>);

/** إحصائيات سريعة عن التقارير */
export const getReportStats = () => ({
  total: REPORT_CATALOG.length,
  ready: REPORT_CATALOG.filter(r => r.status === 'ready').length,
  finance: REPORT_CATALOG.filter(r => r.category === 'finance').length,
  needsBackend: REPORT_CATALOG.filter(r => r.status === 'needs_backend').length,
});

/** البحث في الكتالوج */
export const searchReports = (query: string) => {
  const q = query.toLowerCase();
  return REPORT_CATALOG.filter(r =>
    r.title.includes(q) || r.subtitle.includes(q) || r.tags.some(t => t.includes(q))
  );
};

/** فلترة حسب التصنيف */
export const filterByCategory = (category: string) =>
  category === 'all' ? REPORT_CATALOG : REPORT_CATALOG.filter(r => r.category === category);
