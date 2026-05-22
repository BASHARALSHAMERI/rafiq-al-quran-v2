# خطة تنفيذ توحيد rafiq_mobile مع quran-companions-app-main

## تثبيت سطح إدارة المستخدمين في الويب

- تمت إضافة صفحة `frontend/src/pages/CenterAdminsPage.tsx` كصفحة رسمية لإدارة دور `CENTER_ADMIN`.
- المسار المعتمد في لوحة الويب: `/users/center-admins`.
- تظهر الصفحة ضمن قسم المستخدمين بجانب الطلاب، المعلمين، المشرفين، وأولياء الأمور.
- تعتمد الصفحة على `UserRolePage` ونموذج المستخدمين الحالي، لذلك تستخدم نفس API الموجود لإدارة `centerAdminProfile` وربط مدير المركز بالمراكز المسندة.

## المرحلة 1: تهيئة نظام التصميم (1-2 يوم)

### 1.1 تحديث ملف الألوان
**الملف:** `rafiq_mobile/lib/core/theme/app_colors.dart`

**التعديلات المطلوبة:**
```dart
abstract class AppColors {
  // الألوان الحالية...
  
  // إضافة تدرجات CSS variables المطابقة
  static const gradientPrimaryStart = Color(0xFF166534);
  static const gradientPrimaryEnd = Color(0xFF15803d);
  
  // ظلال
  static final shadowCard = BoxShadow(
    color: Colors.black.withOpacity(0.04),
    blurRadius: 8,
    offset: const Offset(0, 2),
  );
  
  static final shadowButton = BoxShadow(
    color: const Color(0xFF166534).withOpacity(0.3),
    blurRadius: 12,
    offset: const Offset(0, 4),
  );
}
```

### 1.2 إضافة دوال التدرجات
**الملف:** `rafiq_mobile/lib/core/theme/app_gradients.dart`

```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';

abstract class AppGradients {
  static LinearGradient get primary => const LinearGradient(
    colors: [AppColors.gradientPrimaryStart, AppColors.gradientPrimaryEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static LinearGradient get hero => const LinearGradient(
    colors: [AppColors.primaryLight, Color(0xFF14532d)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
```

---

## المرحلة 2: إنشاء/تحديث المكونات المشتركة (2-3 أيام)

### 2.1 تحديث DashboardStatCard
**الملف:** `rafiq_mobile/lib/presentation/shared/widgets/dashboard_stat_card.dart`

**التغييرات:**
- تغيير من تخطيط أفقي إلى تخطيط عمودي
- أيقونة مربعة في الأعلى
- رقم كبير في المنتصف
- label صغير في الأسفل

### 2.2 تحديث QuickActionCard
**الملف:** `rafiq_mobile/lib/presentation/shared/widgets/quick_action_card.dart`

**التغييرات:**
- تغيير إلى زر مربع/مستطيل
- أيقونة في الأعلى
- نص في الأسفل
- دعم variant (primary/secondary)

### 2.3 تحديث SectionHeader
**الملف:** `rafiq_mobile/lib/presentation/shared/widgets/section_header.dart`

**التغييرات:**
- إضافة خط عمودي أخضر على اليسار
- عنوان bold
- action button اختياري

### 2.4 إنشاء StudentCard جديد
**الملف:** `rafiq_mobile/lib/presentation/shared/widgets/student_card.dart`

```dart
class StudentCard extends StatelessWidget {
  final String id;
  final String name;
  final String subtitle; // حالة الحفظ أو الحضور
  final Widget? trailing;
  final VoidCallback? onTap;
  
  // التصميم: CircleAvatar + Name + Status + Chevron
}
```

### 2.5 إنشاء PageDataWrapper
**الملف:** `rafiq_mobile/lib/presentation/shared/widgets/page_data_wrapper.dart`

```dart
class PageDataWrapper extends StatelessWidget {
  final PageDataState state; // loading, error, empty, loaded
  final Widget child;
  final VoidCallback onRetry;
  final String loadingType; // cards, list
  
  // يعرض Loading, Error, Empty, أو الـ child
}
```

---

## المرحلة 3: إعادة بناء صفحات Teacher (3-4 أيام)

### 3.1 TeacherHomeView
**الملف:** `rafiq_mobile/lib/presentation/context/role_home_views.dart`

**التغييرات المطلوبة:**
```dart
// حذف: _DashboardTemplate الحالي
// إضافة: تصميم مطابق لـ quran-companions

class TeacherHomeView extends ConsumerWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Header: gradient-hero
          // Stats: 3 أعمدة (الطلاب, الحاضرون, الغائبون)
          // QuickActions: 6 أزرار في grid
          // NeedsAttention: قائمة الطلاب
          // Today'sTasks: قائمة المهام
        ],
      ),
    );
  }
}
```

**البيانات المطلوبة:**
```dart
{
  stats: [
    { label: "الطلاب", value: 18, icon: Icons.people, color: "primary" },
    { label: "الحاضرون", value: 15, icon: Icons.check_circle, color: "success" },
    { label: "الغائبون", value: 3, icon: Icons.warning, color: "destructive" },
  ],
  needAttention: [
    { id: "1", name: "عبدالله", memorization: "لم يسمّع", attendance: "absent" },
  ],
  tasks: [
    { text: "تسجيل حضور", done: true },
    { text: "إدخال تسميع", done: false },
  ],
}
```

### 3.2 دمج AttendanceDateScreen و AttendanceMarkScreen
**الملف الجديد:** `rafiq_mobile/lib/presentation/attendance/attendance_page.dart`

**التصميم:** مطابق لـ quran-companions `AttendancePage.tsx`
- قائمة الطلاب مع أزرار الحضور
- 4 حالات: حاضر، غائب بعذر، غائب بدون عذر، متأخر
- حقل سبب الغياب (يظهر عند اختيار "غائب بعذر")
- زر "تحديد الكل حاضرون"
- زر "حفظ الحضور"

### 3.3 تحديث HalqaFollowUpScreen
**الملف:** `rafiq_mobile/lib/presentation/follow_up/halqa_follow_up_screen.dart`

**التغييرات:**
- إضافة شريط تقدم في الأعلى
- تغيير تصميم عناصر القائمة
- إضافة animation عند الظهور

### 3.4 إنشاء صفحات جديدة

#### StudentFollowUpPage (متابعة طالب فردي)
**الملف:** `rafiq_mobile/lib/presentation/follow_up/student_follow_up_page.dart`

**المحتوى:**
- معلومات الطالب
- تسجيل الحفظ الجديد
- تسجيل المراجعة
- تسجيل المتون
- ملاحظات

#### TeacherHalqaReportPage
**الملف:** `rafiq_mobile/lib/presentation/teacher/teacher_halqa_report_page.dart`

**المحتوى:** مطابق لـ quran-companions
- إحصائيات الحلقة
- جدول الحضور
- ملخص الإنجاز

#### StudentMonthlyReportPage
**الملف:** `rafiq_mobile/lib/presentation/teacher/student_monthly_report_page.dart`

**المحتوى:**
- معلومات الطالب
- إحصائيات الشهر
- تفاصيل الحفظ والمراجعة

---

## المرحلة 4: إعادة بناء صفحات Supervisor (2-3 أيام)

### 4.1 SupervisorHomeView
**التغييرات:**
- تبسيط التصميم
- 3 إحصائيات: الحلقات، المعلمون، التنبيهات
- 4 إجراءات سريعة
- قائمة الحلقات التي تحتاج متابعة

### 4.2 تحديث HalaqatListPage
**الملف:** `rafiq_mobile/lib/presentation/supervisor/supervisor_circles_screen.dart`

**التغييرات:**
- إعادة تسمية إلى `halaqat_list_page.dart`
- تصميم بطاقات للحلقات
- معلومات: اسم الحلقة، المعلم، عدد الطلاب

### 4.3 إنشاء HalqaMonthlyReportPage
**الملف:** `rafiq_mobile/lib/presentation/supervisor/halqa_monthly_report_page.dart`

**المحتوى:** مطابق لـ quran-companions

---

## المرحلة 5: إعادة بناء صفحات Student (2 أيام)

### 5.1 StudentHomeView
**التغييرات:**
- إضافة قسم "واجب اليوم"
- إضافة قسم "آخر الإنجازات"
- 4 إجراءات سريعة

### 5.2 إنشاء ExamsPage
**الملف:** `rafiq_mobile/lib/presentation/student/exams_page.dart`

### 5.3 إنشاء StudentProfilePage
**الملف:** `rafiq_mobile/lib/presentation/student/student_profile_page.dart`

---

## المرحلة 6: إعادة بناء صفحات Parent (2-3 أيام)

### 6.1 ParentHomeView
**التغييرات:**
- إضافة Tabs للأبناء
- عرض بيانات الابن المختار

### 6.2 إنشاء ChildAttendancePage
**الملف:** `rafiq_mobile/lib/presentation/parent/child_attendance_page.dart`

### 6.3 إنشاء ChildResultsPage
**الملف:** `rafiq_mobile/lib/presentation/parent/child_results_page.dart`

### 6.4 إنشاء ParentReportsPage
**الملف:** `rafiq_mobile/lib/presentation/parent/parent_reports_page.dart`

---

## المرحلة 7: إنشاء بيانات Mock (1 يوم)

### 7.1 إنشاء ملفات البيانات
```
lib/data/mock/
├── monthly_plan_data.dart
├── quran_surahs.dart
├── report_data.dart
└── students_data.dart
```

### 7.2 توحيد هياكل البيانات
```dart
// مثال: StudentFollowUp
class StudentFollowUp {
  final String id;
  final String name;
  final StudentStatus status; // pending, hifz, review, mutoon, complete
}

// مثال: AttendanceStudent
class AttendanceStudent {
  final String id;
  final String name;
  final AttendanceStatus? status; // present, absent_excused, absent_unexcused, late
  final String? excuseReason;
}
```

---

## المرحلة 8: تحديث التوجيه (1 يوم)

### 8.1 تحديث app_router.dart
إضافة المسارات الجديدة:
```dart
// Teacher new routes
GoRoute(path: '/teacher/student-report/:id', builder: ...),
GoRoute(path: '/teacher/halqa-report', builder: ...),

// Supervisor new route
GoRoute(path: '/supervisor/halqa-report/:id', builder: ...),

// Student new routes
GoRoute(path: '/student/exams', builder: ...),
GoRoute(path: '/student/profile', builder: ...),

// Parent new routes
GoRoute(path: '/parent/child/:id/attendance', builder: ...),
GoRoute(path: '/parent/child/:id/results', builder: ...),
GoRoute(path: '/parent/reports', builder: ...),
```

---

## جدول زمني مقترح

| المرحلة | المدة | المخرجات |
|---------|-------|---------|
| 1: نظام التصميم | 1-2 يوم | ألوان وتدرجات موحدة |
| 2: المكونات المشتركة | 2-3 أيام | 5 مكونات مشتركة |
| 3: صفحات Teacher | 3-4 أيام | 11 صفحة متطابقة |
| 4: صفحات Supervisor | 2-3 أيام | 7 صفحات متطابقة |
| 5: صفحات Student | 2 أيام | 6 صفحات متطابقة |
| 6: صفحات Parent | 2-3 أيام | 6 صفحات متطابقة |
| 7: بيانات Mock | 1 يوم | 4 ملفات بيانات |
| 8: التوجيه | 1 يوم | مسارات كاملة |
| **المجموع** | **14-19 يوم** | **32 صفحة** |

---

## قائمة المهام حسب الأولوية

### أولوية عالية (أسبوع 1):
- [ ] تحديث نظام الألوان والتدرجات
- [ ] إنشاء المكونات المشتركة
- [ ] إعادة بناء TeacherHomeView
- [ ] دمج صفحات Attendance
- [ ] تحديث HalqaFollowUpScreen

### أولوية متوسطة (أسبوع 2):
- [ ] إنشاء صفحات Teacher الجديدة
- [ ] إعادة بناء SupervisorHomeView
- [ ] تحديث صفحات Supervisor
- [ ] إعادة بناء StudentHomeView

### أولوية منخفضة (أسبوع 3):
- [ ] إنشاء صفحات Student الجديدة
- [ ] إعادة بناء ParentHomeView
- [ ] إنشاء صفحات Parent الجديدة
- [ ] إنشاء بيانات Mock
- [ ] تحديث التوجيه
