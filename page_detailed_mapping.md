# تفاصيل تحويل كل صفحة - دليل خطوة بخطوة

## صفحات المعلم (Teacher)

### 1. TeacherHome ⭐ أولوية عالية

**الملف المصدر (quran-companions):** `src/pages/teacher/TeacherHome.tsx`

**الملف الهدف (rafiq_mobile):** `lib/presentation/context/role_home_views.dart` (الجزء الخاص بـ TeacherHomeView)

**التغييرات المطلوبة:**

#### الهيكل الحالي في rafiq_mobile:
```dart
_DashboardTemplate(
  greeting: 'أهلًا، ${auth.user?.name}',
  subtitle: '${ctx.selectedCenterName} • ${ctx.selectedCircleName}',
  panelTitle: 'لوحة المعلم',
  metrics: [/* 4 عناصر */],
  actions: [/* 8 عناصر */],
  updates: [/* آخر التحديثات */],
)
```

#### الهيكل المطلوب (مطابق للويب):
```dart
Scaffold(
  body: Column(
    children: [
      // Header مع gradient-primary
      Container(
        decoration: BoxDecoration(gradient: AppGradients.hero),
        child: Column(
          children: [
            Text('السلام عليكم', style: small),
            Text(userName, style: large),
            Text(today, style: small),
          ],
        ),
      ),
      
      // Stats: 3 أعمدة (الطلاب, الحاضرون, الغائبون)
      GridView.count(
        crossAxisCount: 3,
        children: [
          StatCard(label: 'الطلاب', value: '18', icon: Icons.people, color: primary),
          StatCard(label: 'الحاضرون', value: '15', icon: Icons.check_circle, color: success),
          StatCard(label: 'الغائبون', value: '3', icon: Icons.warning, color: destructive),
        ],
      ),
      
      // Quick Actions: 6 أزرار
      GridView.count(
        crossAxisCount: 3,
        children: [
          QuickAction(label: 'الحضور', icon: Icons.fact_check),
          QuickAction(label: 'متابعة الحلقة', icon: Icons.people),
          QuickAction(label: 'الإنجاز الجماعي', icon: Icons.emoji_events),
          QuickAction(label: 'الخطة الشهرية', icon: Icons.calendar_month),
          QuickAction(label: 'التقارير', icon: Icons.bar_chart),
          QuickAction(label: 'ملاحظات', icon: Icons.message),
        ],
      ),
      
      // Needs Attention: قائمة الطلاب
      SectionHeader(title: 'يحتاجون متابعة', action: 'عرض الكل'),
      ListView.builder(
        itemBuilder: (context, index) => StudentCard(
          name: student.name,
          subtitle: student.memorization,
          status: student.attendance,
        ),
      ),
      
      // Today's Tasks
      SectionHeader(title: 'مهام اليوم'),
      ListView.builder(
        itemBuilder: (context, index) => TaskItem(
          text: task.text,
          done: task.done,
        ),
      ),
    ],
  ),
)
```

---

### 2. AttendancePage ⭐ أولوية عالية

**الملف المصدر:** `src/pages/teacher/AttendancePage.tsx`

**الملفات الحالية:** 
- `attendance_date_screen.dart` (اختيار التاريخ)
- `attendance_mark_screen.dart` (تسجيل الحضور)

**الملف المطلوب:** دمجها في `attendance_page.dart`

**المكونات:**
```dart
// Summary في الأعلى
GridView.count(
  crossAxisCount: 4,
  children: [
    CountBadge(label: 'حاضر', count: counts.present, color: success),
    CountBadge(label: 'بعذر', count: counts.absent_excused, color: warning),
    CountBadge(label: 'بلا عذر', count: counts.absent_unexcused, color: destructive),
    CountBadge(label: 'متأخر', count: counts.late, color: accent),
  ],
)

// زر تحديد الكل
TextButton(
  onPressed: markAllPresent,
  child: Text('تحديد الكل حاضرون ✓'),
)

// قائمة الطلاب
ListView.builder(
  itemBuilder: (context, index) => AttendanceStudentItem(
    student: students[index],
    onStatusChanged: (status) => setStatus(student.id, status),
  ),
)

// AttendanceStudentItem يسمح بـ:
// - الضغط على أحد الأيقونات الأربع
// - إظهار حقل سبب الغياب عند اختيار "غائب بعذر"
```

**حالات الحضور:**
```dart
enum AttendanceStatus {
  present,          // حاضر - أخضر
  absent_excused,   // غائب بعذر - برتقالي
  absent_unexcused, // غائب بدون عذر - أحمر
  late,             // متأخر - ذهبي
}
```

---

### 3. HalqaFollowUpPage

**الملف المصدر:** `src/pages/teacher/HalqaFollowUpPage.tsx`

**الملف الحالي:** `halqa_follow_up_screen.dart`

**التغييرات:**
- إضافة شريط تقدم في الأعلى
- تغيير تصميم عناصر القائمة

**البنية:**
```dart
Column(
  children: [
    // Progress Card
    Card(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('تقدم المتابعة'),
              Text('$completed/$total طالب'),
            ],
          ),
          LinearProgressIndicator(value: progress),
        ],
      ),
    ),
    
    // Students List
    ListView.builder(
      itemBuilder: (context, index) => FollowUpStudentItem(
        student: students[index],
        onTap: () => navigateToStudent(student.id),
      ),
    ),
  ],
)
```

**حالات المتابعة:**
```dart
enum StudentStatus {
  pending,   // لم تتم المتابعة - رمادي
  hifz,      // تم تسجيل الحفظ - أخضر
  review,    // تم تسجيل المراجعة - أزرق
  mutoon,    // تم تسجيل المتون - بنفسجي
  complete,  // مكتمل - أخضر داكن
}
```

---

### 4. StudentFollowUpPage ⭐ جديد

**الملف المصدر:** `src/pages/teacher/StudentFollowUpPage.tsx`

**الملف المطلوب:** `student_follow_up_page.dart`

**المحتوى:**
```dart
Scaffold(
  appBar: AppBar(title: Text('متابعة الطالب')),
  body: Column(
    children: [
      // معلومات الطالب
      StudentInfoCard(student: student),
      
      // أزرار الإجراءات
      Row(
        children: [
          ActionButton(
            label: 'تسجيل حفظ',
            icon: Icons.menu_book,
            onTap: () => showMemorizationSheet(),
          ),
          ActionButton(
            label: 'تسجيل مراجعة',
            icon: Icons.refresh,
            onTap: () => showReviewSheet(),
          ),
          ActionButton(
            label: 'تسجيل متون',
            icon: Icons.library_books,
            onTap: () => showMutoonSheet(),
          ),
        ],
      ),
      
      // سجل المتابعات
      SectionHeader(title: 'سجل المتابعات'),
      FollowUpHistoryList(history: history),
      
      // ملاحظات
      SectionHeader(title: 'ملاحظات'),
      NotesInput(onSave: saveNote),
    ],
  ),
)
```

---

### 5. MemorizationPage

**الملف المصدر:** `src/pages/teacher/MemorizationPage.tsx`

**الملف الحالي:** `memorization_screen.dart`

**التغييرات:**
- إضافة اختيار السورة والآيات
- إضافة نوع التسميع (حفظ/مراجعة/متون)

---

### 6. MonthlyPlanPage

**الملف المصدر:** `src/pages/teacher/MonthlyPlanPage.tsx`

**الملف الحالي:** `monthly_plan_screen.dart`

**التغييرات:**
- عرض الخطة الشهرية للحلقة
- إمكانية تعديل الخطة

---

### 7. GroupAchievementPage

**الملف المصدر:** `src/pages/teacher/GroupAchievementPage.tsx`

**الملف الحالي:** `group_achievement_screen.dart`

**التغييرات:**
- إضافة إحصائيات الإنجاز الجماعي
- إضافة قائمة الإنجازات

---

### 8. RecordsPage

**الملف المصدر:** `src/pages/teacher/RecordsPage.tsx`

**الملف الحالي:** `records_screen.dart`

**التغييرات:**
- تنظيم السجلات حسب النوع
- إضافة بحث

---

### 9. HalqaPage (قائمة الطلاب)

**الملف المصدر:** `src/pages/teacher/HalqaPage.tsx`

**الملف الحالي:** `students_list_screen.dart`

**التغييرات:**
- إعادة تسمية إلى `halqa_page.dart`
- تغيير التصميم ليطابق الويب

---

### 10. TeacherHalqaReportPage ⭐ جديد

**الملف المصدر:** `src/pages/teacher/TeacherHalqaReportPage.tsx`

**الملف المطلوب:** `teacher_halqa_report_page.dart`

**المحتوى:**
```dart
Scaffold(
  appBar: AppBar(title: Text('تقرير الحلقة')),
  body: SingleChildScrollView(
    child: Column(
      children: [
        // الإحصائيات
        StatsSection(),
        
        // جدول الحضور
        AttendanceTable(),
        
        // ملخص الإنجاز
        AchievementSummary(),
        
        // زر التصدير
        PrimaryButton(
          label: 'تصدير التقرير',
          onTap: exportReport,
        ),
      ],
    ),
  ),
)
```

---

### 11. StudentMonthlyReportPage ⭐ جديد

**الملف المصدر:** `src/pages/teacher/StudentMonthlyReportPage.tsx`

**الملف المطلوب:** `student_monthly_report_page.dart`

**المحتوى:**
```dart
Scaffold(
  appBar: AppBar(title: Text('التقرير الشهري')),
  body: SingleChildScrollView(
    child: Column(
      children: [
        // معلومات الطالب
        StudentInfoCard(),
        
        // إحصائيات الشهر
        MonthlyStats(),
        
        // تفاصيل الحفظ
        MemorizationDetails(),
        
        // تفاصيل المراجعة
        ReviewDetails(),
        
        // التقييم
        EvaluationSection(),
      ],
    ),
  ),
)
```

---

## صفحات المشرف (Supervisor)

### 1. SupervisorHome

**التغييرات:**
```dart
Column(
  children: [
    // Header
    GradientHeader(title: userName, subtitle: 'مشرف - مركز النور'),
    
    // Stats: 3 أعمدة
    GridView.count(
      crossAxisCount: 3,
      children: [
        StatCard(label: 'الحلقات', value: '6'),
        StatCard(label: 'المعلمون', value: '6'),
        StatCard(label: 'تنبيهات', value: '3'),
      ],
    ),
    
    // Quick Actions: 4 أزرار
    GridView.count(
      crossAxisCount: 2,
      children: [
        QuickAction(label: 'زيارة حلقة', icon: Icons.visibility),
        QuickAction(label: 'تقييم معلم', icon: Icons.star),
        QuickAction(label: 'ملاحظة إشرافية', icon: Icons.message),
        QuickAction(label: 'التقارير', icon: Icons.bar_chart),
      ],
    ),
    
    // حلقات تحتاج متابعة
    SectionHeader(title: 'حلقات تحتاج متابعة'),
    ListView.builder(
      itemBuilder: (context, index) => HalqaAlertCard(
        name: halqa.name,
        teacher: halqa.teacher,
        issue: halqa.issue,
        severity: halqa.severity, // warning | destructive
      ),
    ),
  ],
)
```

---

### 2. HalaqatListPage

**التغييرات:**
```dart
ListView.builder(
  itemBuilder: (context, index) => HalqaCard(
    name: halqa.name,
    teacher: halqa.teacher,
    studentCount: halqa.studentCount,
    onTap: () => navigateToHalqa(halqa.id),
  ),
)
```

---

### 3. HalqaVisitPage, TeacherEvaluationPage, SupervisorNotesPage, SupervisorReportsPage

**التغييرات:** تحديث التصميم ليطابق نمط الويب

---

### 4. HalqaMonthlyReportPage ⭐ جديد

**الملف المطلوب:** `halqa_monthly_report_page.dart`

---

## صفحات الطالب (Student)

### 1. StudentHome

**التغييرات:**
```dart
Column(
  children: [
    // Header
    GradientHeader(title: userName, subtitle: 'حلقة الفجر - مسجد النور'),
    
    // Stats: 2 أعمدة
    GridView.count(
      crossAxisCount: 2,
      children: [
        StatCard(label: 'الحفظ الكلي', value: '3 أجزاء'),
        StatCard(label: 'نسبة الحضور', value: '92%'),
      ],
    ),
    
    // Quick Actions: 4 أزرار
    GridView.count(
      crossAxisCount: 4,
      children: [
        QuickAction(label: 'واجبي', icon: Icons.assignment),
        QuickAction(label: 'تقدمي', icon: Icons.trending_up),
        QuickAction(label: 'الحفظ', icon: Icons.menu_book),
        QuickAction(label: 'اختبارات', icon: Icons.quiz),
      ],
    ),
    
    // واجب اليوم
    SectionHeader(title: 'واجب اليوم', action: 'عرض الكل'),
    TodayAssignmentCard(
      hifz: Assignment(type: 'حفظ جديد', content: 'سورة البقرة - آية 51 إلى 55'),
      review: Assignment(type: 'مراجعة', content: 'سورة الفاتحة + البقرة 1-20'),
      progress: 0.33,
    ),
    
    // آخر الإنجازات
    SectionHeader(title: 'آخر الإنجازات'),
    ListView.builder(
      itemBuilder: (context, index) => AchievementItem(
        icon: achievement.icon,
        text: achievement.text,
        time: achievement.time,
        color: achievement.color,
      ),
    ),
  ],
)
```

---

### 2. AssignmentsPage, ProgressPage, MemorizationLogPage

**التغييرات:** تحديث التصميم

---

### 3. ExamsPage ⭐ جديد

**الملف المطلوب:** `exams_page.dart`

**المحتوى:** قائمة الاختبارات مع النتائج

---

### 4. StudentProfilePage ⭐ جديد

**الملف المطلوب:** `student_profile_page.dart`

**المحتوى:** الملف الشخصي للطالب

---

## صفحات ولي الأمر (Parent)

### 1. ParentHome

**التغييرات:**
```dart
Column(
  children: [
    // Header
    GradientHeader(title: userName, subtitle: 'ولي أمر'),
    
    // Children Tabs
    Row(
      children: children.map((child) => 
        ChildTab(
          name: child.name,
          isSelected: selectedChild.id == child.id,
          onTap: () => selectChild(child),
        ),
      ).toList(),
    ),
    
    // Stats للابن المختار
    GridView.count(
      crossAxisCount: 2,
      children: [
        StatCard(label: 'الحضور', value: selectedChild.attendance),
        StatCard(label: 'آخر حفظ', value: '5 آيات'),
      ],
    ),
    
    // Quick Actions
    GridView.count(
      crossAxisCount: 4,
      children: [
        QuickAction(label: 'الأبناء', icon: Icons.people),
        QuickAction(label: 'الحضور', icon: Icons.calendar_today),
        QuickAction(label: 'النتائج', icon: Icons.emoji_events),
        QuickAction(label: 'التقارير', icon: Icons.bar_chart),
      ],
    ),
    
    // حالة اليوم
    SectionHeader(title: 'حالة اليوم'),
    TodayStatusCard(
      halqa: selectedChild.halqa,
      memorization: selectedChild.memorization,
      attendance: selectedChild.attendance,
      onTap: () => navigateToChildDetail(selectedChild.id),
    ),
    
    // آخر التنبيهات
    SectionHeader(title: 'آخر التنبيهات'),
    ListView.builder(
      itemBuilder: (context, index) => NotificationItem(
        icon: notification.icon,
        text: notification.text,
        time: notification.time,
      ),
    ),
  ],
)
```

---

### 2. ChildrenListPage, ChildDetailPage

**التغييرات:** تحديث التصميم

---

### 3. ChildAttendancePage ⭐ جديد

**الملف المطلوب:** `child_attendance_page.dart`

**المحتوى:** عرض حضور الابن

---

### 4. ChildResultsPage ⭐ جديد

**الملف المطلوب:** `child_results_page.dart`

**المحتوى:** عرض نتائج الابن

---

### 5. ParentReportsPage ⭐ جديد

**الملف المطلوب:** `parent_reports_page.dart`

**المحتوى:** التقارير الخاصة بالأبناء

---

## ملخص المكونات المطلوبة

### مكونات مشتركة جديدة:
1. `CountBadge` - شارة العدد (للحضور)
2. `TaskItem` - عنصر مهمة
3. `FollowUpStudentItem` - عنصر متابعة طالب
4. `HalqaAlertCard` - بطاقة تنبيه حلقة
5. `HalqaCard` - بطاقة حلقة
6. `TodayAssignmentCard` - بطاقة واجب اليوم
7. `AchievementItem` - عنصر إنجاز
8. `ChildTab` - تبويب ابن
9. `TodayStatusCard` - بطاقة حالة اليوم
10. `NotificationItem` - عنصر تنبيه

### مكونات موجودة تحتاج تعديل:
1. `DashboardStatCard` - تغيير للتخطيط العمودي
2. `QuickActionCard` - تغيير للتخطيط المربع
3. `SectionHeader` - إضافة الخط العمودي
4. `StudentCard` - إعادة تصميم
