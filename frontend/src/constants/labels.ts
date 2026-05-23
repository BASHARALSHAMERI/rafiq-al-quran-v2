import type { Role } from "../features/auth/types";

export type AppLanguage = "ar" | "en";

let currentLanguage: AppLanguage = "ar";

const labelsByLanguage = {
  ar: {
    appName: "رفقاء القرآن - لوحة الإدارة",
    appShortName: "رفقاء القرآن",
    nav: {
      dashboard: "لوحة التحكم",
      organization: "الإدارة المؤسسية",
      users: "المستخدمون",
      operations: "التشغيل والمتابعة",
      governance: "الحوكمة",
      daily: "المتابعة اليومية",
      exams: "الاختبارات",
      goldenRecord: "السجل الذهبي",
      notifications: "الإشعارات",
      audit: "سجل التدقيق",
      library: "المكتبة الإلكترونية",
      finance: "الشؤون المالية",
      financeDashboard: "لوحة المؤشرات المالية",
      financeInvoices: "الفواتير والرسوم",
      financePayments: "المدفوعات والتحصيل",
      financeVouchers: "السندات",
      financeDonors: "المتبرعون والتبرعات",
      financeTreasury: "الخزينة والصندوق",
      financePayroll: "الرواتب والاستقطاعات",
      financeRewards: "المكافآت",
      financeCurrencies: "العملات وأسعار الصرف",
      financeExpenses: "المصروفات والموردون",
      accountingAccounts: "شجرة الحسابات",
      accountingJournalEntries: "القيود اليومية",
      accountingLedger: "دفتر الأستاذ",
      accountingTrialBalance: "ميزان المراجعة",
      financeReports: "التقارير المالية",
      reports: "التقارير",
      // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: new functional finance sections
      financeRevenue: "الشؤون الإيرادية",
      financeExpenditure: "الشؤون النفقية",
      financeLedger: "الخزينة والمحاسبة",
      reportsCenter: "التقارير والتحليلات",
      settings: "الإعدادات"
    },
    common: {
      developing: "هذه الصفحة قيد التطوير",
      centerFilter: "فلتر المركز",
      circleFilter: "فلتر الحلقة",
      comingSoon: "سيتم ربط البيانات الفعلية في المرحلة التالية",
      logout: "تسجيل الخروج",
      themeLight: "الوضع النهاري",
      themeDark: "الوضع الداكن",
      collapseSidebar: "طي القائمة",
      expandSidebar: "توسيع القائمة",
      breadcrumbHome: "الرئيسية",
      retry: "إعادة المحاولة",
      refresh: "تحديث",
      search: "بحث",
      noData: "لا توجد بيانات",
      language: "اللغة",
      arabic: "العربية",
      english: "الإنجليزية",
      filters: "فلاتر"
    },
    auth: {
      loginTitle: "مرحباً بعودتك",
      loginHint: "أدخل بياناتك لمواصلة الأثر ومتابعة مسيرتك.",
      loginHeroTagline: "تسجيل الدخول إلى نظام الحلقات",
      welcomeTitle: "أهلاً بك",
      welcomeHint: "يرجى تسجيل الدخول للمتابعة",
      identifier: "البريد الإلكتروني أو رقم الهاتف",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      rememberMe: "تذكرني",
      forgotPassword: "نسيت كلمة المرور؟",
      forgotPasswordTitle: "استعادة كلمة المرور",
      forgotPasswordHint: "أدخل البريد أو الرقم المرتبط بحسابك.",
      forgotPasswordSubmit: "إرسال رابط الاستعادة",
      forgotPasswordSuccess:
        "إذا كانت بيانات الحساب صحيحة، فسيتم إرسال رابط إعادة التعيين.",
      forgotPasswordError: "تعذر إرسال طلب الاستعادة",
      resetPasswordTitle: "تعيين كلمة مرور جديدة",
      resetPasswordHint: "أدخل كلمة مرور جديدة لإكمال العملية.",
      resetPasswordSubmit: "حفظ كلمة المرور الجديدة",
      resetPasswordSuccess: "تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
      resetPasswordError: "تعذر إعادة تعيين كلمة المرور",
      resetLinkInvalid: "رابط إعادة التعيين غير صالح.",
      passwordMinLength: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
      passwordMismatch: "تأكيد كلمة المرور غير مطابق.",
      invalidCredentials: "خطأ في البريد/الهاتف أو كلمة المرور",
      webAdminOnly: "نسخة الويب مخصّصة للمدير العام ومدير المركز فقط.",
      backendUnavailable: "تعذر الاتصال بالخادم. تأكد من تشغيل الواجهة الخلفية على المنفذ 4000.",
      loginFailed: "تعذر تسجيل الدخول حالياً.",
      hidePassword: "إخفاء كلمة المرور",
      showPassword: "إظهار كلمة المرور",
      backToLogin: "العودة إلى تسجيل الدخول",
      termsNotice: "بالدخول أنت توافق على شروط الاستخدام وسياسة الخصوصية",
      login: "دخول",
      loggingIn: "جاري تسجيل الدخول...",
      cookieMode:
        "نمط المصادقة: Access Token في الذاكرة فقط + تلميح جلسة في SessionStorage + Refresh عبر Cookie آمن",
      accountNotActive: "يلزم تفعيل الحساب أولاً قبل تسجيل الدخول. يرجى مراجعة بريدك أو التواصل مع الإدارة."
    },
    states: {
      checkingSession: "جاري التحقق من الجلسة",
      loadingProfile: "جاري تحميل الملف الشخصي",
      pleaseWait: "يرجى الانتظار...",
      forbiddenTitle: "403 - غير مصرح",
      forbiddenDescription: "ليس لديك الصلاحية للوصول إلى هذه الصفحة.",
      notFoundTitle: "404 - الصفحة غير موجودة",
      notFoundDescription: "المسار المطلوب غير متوفر.",
      backToDashboard: "العودة للوحة التحكم"
    },
    org: {
      centersTitle: "إدارة المراكز",
      centersDescription: "عرض المراكز المتاحة ضمن نطاق صلاحياتك.",
      circlesTitle: "إدارة الحلقات",
      circlesDescription: "عرض الحلقات والتصفية حسب المركز.",
      centersMenu: "المراكز",
      circlesMenu: "الحلقات",
      studentsMenu: "الطلاب",
      centerAdminsMenu: "مديرو المراكز",
      teachersMenu: "المعلمون",
      parentsMenu: "أولياء الأمور",
      supervisorsMenu: "المشرفون",
      attendanceMenu: "الحضور",
      excusesMenu: "إدارة الأعذار",
      staffAttendanceMenu: "حضور الموظفين",
      followUpMenu: "الحفظ/المراجعة",
      searchCenterPlaceholder: "ابحث باسم المركز أو الكود",
      searchCirclePlaceholder: "ابحث باسم الحلقة",
      emptyCenters: "لا توجد مراكز متاحة حاليًا.",
      emptyCircles: "لا توجد حلقات متاحة حاليًا.",
      openCircles: "فتح الحلقات",
      allCenters: "كل المراكز",
      allCircles: "كل الحلقات"
    },
    table: {
      name: "الاسم",
      code: "الكود",
      circlesCount: "عدد الحلقات",
      createdAt: "تاريخ الإنشاء",
      center: "المركز",
      teacher: "المعلم",
      status: "الحالة",
      email: "البريد",
      phone: "الهاتف",
      circle: "الحلقة"
    },
    pagination: {
      pageSize: "حجم الصفحة",
      page: "صفحة",
      previous: "السابق",
      next: "التالي",
      sortBy: "ترتيب حسب"
    },
    users: {
      studentsTitle: "إدارة الطلاب",
      studentsDescription: "إدارة بيانات الطلاب",
      centerAdminsTitle: "إدارة مديري المراكز",
      centerAdminsDescription: "إدارة حسابات مديري المراكز وربطهم بالمراكز المسندة.",
      teachersTitle: "إدارة المعلمين",
      teachersDescription: "إدارة بيانات المعلمين",
      parentsTitle: "إدارة أولياء الأمور",
      parentsDescription: "إدارة بيانات أولياء الأمور",
      supervisorsTitle: "إدارة المشرفين",
      supervisorsDescription: "إدارة بيانات المشرفين",
      empty: "لا توجد بيانات مستخدمين مطابقة.",
      active: "نشط",
      inactive: "غير نشط",
      detailsSoon: "تفاصيل الطالب قريبًا",
      totalUsers: "إجمالي المستخدمين",
      addUser: "إضافة مستخدم",
      addStudent: "إضافة طالب",
      addTeacher: "إضافة معلم",
      addParent: "إضافة ولي أمر",
      addSupervisor: "إضافة مشرف",
      addSoon: "شاشة الإضافة قيد التجهيز",
      statusAll: "الحالة: الكل",
      statusActiveOnly: "النشطون فقط",
      statusInactiveOnly: "غير النشطين فقط",
      sortNewest: "الترتيب: الأحدث أولًا",
      sortOldest: "الأقدم أولًا",
      sortNameAsc: "الاسم (أ-ي)",
      sortNameDesc: "الاسم (ي-أ)",
      actions: "الإجراءات",
      resultWord: "نتيجة",
      resetFilters: "إعادة ضبط"
    }
  },
  en: {
    appName: "Rufaqaa Al-Quran - Admin Panel",
    appShortName: "Rufaqaa Al-Quran",
    nav: {
      dashboard: "Dashboard",
      organization: "Organization",
      users: "Users",
      operations: "Operations",
      governance: "Governance",
      daily: "Daily Follow-up",
      exams: "Exams",
      goldenRecord: "Golden Record",
      notifications: "Notifications",
      audit: "Audit Log",
      library: "Library",
      finance: "Finance",
      financeDashboard: "Finance Dashboard",
      financeInvoices: "Invoices & Fees",
      financePayments: "Payments & Collections",
      financeVouchers: "Vouchers",
      financeDonors: "Donors & Donations",
      financeTreasury: "Treasury & Cash",
      financePayroll: "Payroll & Deductions",
      financeRewards: "Rewards",
      financeCurrencies: "Currencies & Exchange Rates",
      financeExpenses: "Expenses & Suppliers",
      accountingAccounts: "Chart of Accounts",
      accountingJournalEntries: "Journal Entries",
      accountingLedger: "General Ledger",
      accountingTrialBalance: "Trial Balance",
      financeReports: "Financial Reports",
      reports: "Reports",
      // UI-NAV-FINANCE-SIDEBAR-RESTRUCTURE-2B: new functional finance sections
      financeRevenue: "Revenue & Collections",
      financeExpenditure: "Expenses & HR",
      financeLedger: "Treasury & Accounting",
      reportsCenter: "Reports & Analytics",
      settings: "Settings"
    },
    common: {
      developing: "This page is under development",
      centerFilter: "Center Filter",
      circleFilter: "Circle Filter",
      comingSoon: "Live data wiring will be added in the next phase",
      logout: "Logout",
      themeLight: "Light Mode",
      themeDark: "Dark Mode",
      collapseSidebar: "Collapse Sidebar",
      expandSidebar: "Expand Sidebar",
      breadcrumbHome: "Home",
      retry: "Retry",
      refresh: "Refresh",
      search: "Search",
      noData: "No data",
      language: "Language",
      arabic: "Arabic",
      english: "English",
      filters: "Filters"
    },
    auth: {
      loginTitle: "Welcome back",
      loginHint: "Enter your details to continue your journey and impact.",
      loginHeroTagline: "Sign in to the circles system",
      welcomeTitle: "Welcome back",
      welcomeHint: "Please sign in to continue",
      identifier: "Email or phone number",
      password: "Password",
      confirmPassword: "Confirm password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      forgotPasswordTitle: "Recover Password",
      forgotPasswordHint: "Enter your account email or phone number.",
      forgotPasswordSubmit: "Send reset link",
      forgotPasswordSuccess:
        "If the account details are valid, a reset link will be sent.",
      forgotPasswordError: "Unable to submit reset request",
      resetPasswordTitle: "Set a New Password",
      resetPasswordHint: "Enter your new password to complete reset.",
      resetPasswordSubmit: "Save New Password",
      resetPasswordSuccess: "Password updated successfully. You can sign in now.",
      resetPasswordError: "Unable to reset password",
      resetLinkInvalid: "Reset password link is invalid.",
      passwordMinLength: "Password must be at least 8 characters.",
      passwordMismatch: "Password confirmation does not match.",
      invalidCredentials: "Invalid email/phone or password",
      webAdminOnly: "The web app is for General Manager and Center Admin accounts only.",
      backendUnavailable: "Unable to reach the server. Make sure the backend is running on port 4000.",
      loginFailed: "Unable to sign in right now.",
      hidePassword: "Hide password",
      showPassword: "Show password",
      backToLogin: "Back to login",
      termsNotice: "By signing in, you agree to the terms and privacy policy",
      login: "Login",
      loggingIn: "Signing in...",
      cookieMode:
        "Auth mode: Access Token in memory only + sessionStorage refresh hint + secure Cookie refresh",
      accountNotActive: "Account activation is required before login. Please check your invitation or contact support."
    },
    states: {
      checkingSession: "Checking session",
      loadingProfile: "Loading profile",
      pleaseWait: "Please wait...",
      forbiddenTitle: "403 - Forbidden",
      forbiddenDescription: "You do not have permission to access this page.",
      notFoundTitle: "404 - Not Found",
      notFoundDescription: "The requested route is not available.",
      backToDashboard: "Back to dashboard"
    },
    org: {
      centersTitle: "Centers Management",
      centersDescription: "View available centers within your scope.",
      circlesTitle: "Circles Management",
      circlesDescription: "View circles and filter by center.",
      centersMenu: "Centers",
      circlesMenu: "Circles",
      studentsMenu: "Students",
      centerAdminsMenu: "Center Admins",
      teachersMenu: "Teachers",
      parentsMenu: "Parents",
      supervisorsMenu: "Supervisors",
      attendanceMenu: "Attendance",
      excusesMenu: "Excuses",
      staffAttendanceMenu: "Staff Attendance",
      followUpMenu: "Memorization/Review",
      searchCenterPlaceholder: "Search by center name or code",
      searchCirclePlaceholder: "Search by circle name",
      emptyCenters: "No centers available.",
      emptyCircles: "No circles available.",
      openCircles: "Open circles",
      allCenters: "All centers",
      allCircles: "All circles"
    },
    table: {
      name: "Name",
      code: "Code",
      circlesCount: "Circles",
      createdAt: "Created At",
      center: "Center",
      teacher: "Teacher",
      status: "Status",
      email: "Email",
      circle: "Circle"
    },
    pagination: {
      pageSize: "Page size",
      page: "Page",
      previous: "Previous",
      next: "Next",
      sortBy: "Sort by"
    },
    users: {
      studentsTitle: "Students Management",
      studentsDescription: "View students within your scope with filtering.",
      centerAdminsTitle: "Center Admins Management",
      centerAdminsDescription: "Manage center admin accounts and their assigned center scope.",
      teachersTitle: "Teachers Management",
      teachersDescription: "View teachers within your scope with filtering.",
      parentsTitle: "Parents Management",
      parentsDescription: "View parents within your scope.",
      supervisorsTitle: "Supervisors Management",
      supervisorsDescription: "View supervisors within your scope.",
      empty: "No matching users found.",
      active: "Active",
      inactive: "Inactive",
      detailsSoon: "Student details coming soon",
      totalUsers: "Total users",
      addUser: "Add User",
      addStudent: "Add Student",
      addTeacher: "Add Teacher",
      addParent: "Add Parent",
      addSupervisor: "Add Supervisor",
      addSoon: "Create screen is coming soon",
      statusAll: "Status: All",
      statusActiveOnly: "Active only",
      statusInactiveOnly: "Inactive only",
      sortNewest: "Sort: Newest first",
      sortOldest: "Oldest first",
      sortNameAsc: "Name (A-Z)",
      sortNameDesc: "Name (Z-A)",
      actions: "Actions",
      resultWord: "Result",
      resetFilters: "Reset"
    }
  }
} as const;

const roleLabelsByLanguage: Record<AppLanguage, Record<Role, string>> = {
  ar: {
    SUPER_ADMIN: "المدير العام",
    CENTER_ADMIN: "مدير مركز",
    SUPERVISOR: "مشرف",
    TEACHER: "معلم",
    PARENT: "ولي أمر",
    STUDENT: "طالب",
    ACCOUNTANT: "محاسب",
    FINANCE_MANAGER: "مدير المالية",
    TREASURER: "أمين الصندوق",
    AUDITOR: "مدقق"
  },
  en: {
    SUPER_ADMIN: "General Manager",
    CENTER_ADMIN: "Center Admin",
    SUPERVISOR: "Supervisor",
    TEACHER: "Teacher",
    PARENT: "Parent",
    STUDENT: "Student",
    ACCOUNTANT: "Accountant",
    FINANCE_MANAGER: "Finance Manager",
    TREASURER: "Treasurer",
    AUDITOR: "Auditor"
  }
};

const valueAtPath = (path: string[]): unknown => {
  return path.reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }

    return (acc as Record<string, unknown>)[key];
  }, labelsByLanguage[currentLanguage]);
};

const createDynamicProxy = (path: string[] = []): unknown => {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== "string") {
          return undefined;
        }

        const nextPath = [...path, prop];
        const value = valueAtPath(nextPath);

        if (value && typeof value === "object") {
          return createDynamicProxy(nextPath);
        }

        return value;
      }
    }
  );
};

export const setLabelsLanguage = (language: AppLanguage) => {
  currentLanguage = language;
};

export const getCurrentLanguage = (): AppLanguage => currentLanguage;

export const labels = createDynamicProxy() as (typeof labelsByLanguage)["ar"];

export const roleLabels = new Proxy({} as Record<Role, string>, {
  get(_target, prop) {
    if (typeof prop !== "string") {
      return undefined;
    }

    return roleLabelsByLanguage[currentLanguage][prop as Role];
  }
}) as Record<Role, string>;
