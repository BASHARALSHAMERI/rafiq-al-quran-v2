export const TAIZ_FINANCE_FIXTURE = {
  organization: {
    name: "مؤسسة رفيق القرآن التعليمية - تعز",
    code: "TEST-TAIZ-FINANCE"
  },
  centers: [
    { code: "TEST-RAWDAH", name: "مركز الروضة", locationText: "تعز - الروضة" },
    { code: "TEST-OSAIFIRAH", name: "مركز عصيفرة", locationText: "تعز - عصيفرة" },
    { code: "TEST-MASBAH", name: "مركز المسبح", locationText: "تعز - المسبح" }
  ],
  people: {
    financeManager: "سالم أحمد الاختباري",
    accountant: "مروان علي الاختباري",
    treasurer: "فؤاد محمد الاختباري",
    auditor: "نجيب حسن الاختباري",
    supervisor: "عبدالرحمن صالح الاختباري",
    teacher: "يحيى عبدالله الاختباري",
    parent: "أمجد محمود الاختباري",
    student: "أنس أمجد الاختباري"
  },
  suppliers: [
    "مورد كهرباء تعز الاختباري",
    "مكتبة القرطاسية الاختبارية",
    "مؤجر مركز الروضة الاختباري",
    "ورشة الصيانة الاختبارية"
  ],
  assets: ["حاسوب تعليمي اختباري", "لوح شمسي اختباري", "بطارية اختباريّة", "أثاث فصل اختباري", "مكتبة اختباريّة"],
  currency: {
    base: "YER",
    foreign: "USD",
    usdRateToYer: 530
  },
  dates: {
    fiscalYear: 2031,
    openPeriod: "2031-01-15T12:00:00.000Z",
    closedPeriod: "2100-01-15T12:00:00.000Z"
  }
} as const;
