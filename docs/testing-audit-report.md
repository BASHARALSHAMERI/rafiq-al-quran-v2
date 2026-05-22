# تقرير تدقيق وحدة الاختبارات

تاريخ المراجعة: 10 أبريل 2026
المسار المفحوص: `C:\dev\rafiq-al-quran-v2`

## 1. الملخص التنفيذي

الوضع الحالي لا يمثل "وحدة اختبارات" موحدة على مستوى المشروع كله، بل ثلاث طبقات منفصلة جدًا:

| الجزء | الحالة الحالية | نوع التغطية | النتيجة الفعلية |
|---|---|---|---|
| `backend` | توجد سكربتات تحقق تشغيلية | `smoke` و`integration` عبر HTTP حي | جزئيًا يعمل، وجزئيًا متعطل بسبب تغيّر قواعد المنصّة وتقادُم السكربتات |
| `frontend` | لا توجد اختبارات متتبعة | لا يوجد runner للاختبارات | لا توجد تغطية، والبناء نفسه يفشل |
| `rafiq_mobile` | توجد اختبارات فعلية منظمة | `flutter test` لوحدة التطبيق والواجهات | 14/14 اختبار نجح |

الخلاصة العملية:

- التغطية الفعلية الحية موجودة أساسًا في `rafiq_mobile`.
- `backend` يعتمد على سكربتات smoke/integration بدل إطار اختبار قياسي مثل Jest/Vitest.
- `frontend` لا يحتوي حاليًا أي اختبارات متتبعة في المشروع.
- خط الجودة العام ليس أخضر بالكامل:
  - `backend` يبني بنجاح.
  - `frontend` يفشل في البناء.
  - `rafiq_mobile` ينجح في الاختبارات لكنه يفشل في `flutter analyze` بسبب 17 ملاحظة analyzer.

## 2. الجرد الكامل للاختبارات والبوابات

### 2.1 الـ Backend

الملف المرجعي: `backend/package.json`

أوامر الاختبار/التحقق الموجودة فعليًا:

| الأمر | النوع | الغرض |
|---|---|---|
| `npm run test:integration:m2-users` | integration script | فحص دورة إدارة المستخدمين والصلاحيات والروابط |
| `npm run test:smoke:rbac` | smoke script | فحص صلاحيات الأدوار والنطاقات والـ masking |
| `npm run test:smoke:rbac:critical` | smoke script | فحص السيناريوهات الحرجة المرتبطة بالأدوار والاعتمادات والتعطيل |
| `npm run test:smoke:finance-v2` | smoke script | فحص تدفقات مالية متعددة المراحل |
| `npm run build` | build gate | يثبت أن TypeScript يبنى |

مهم:

- لا يوجد `npm test`.
- لا يوجد إطار unit tests تقليدي.
- لا توجد ملفات `*.test.ts` أو `*.spec.ts` متتبعة في `backend/src`.
- هذه الطبقة تختبر النظام عبر API حي مع قاعدة بيانات وبذور seed، لا عبر mocking داخلي.

### 2.2 الـ Frontend

الملف المرجعي: `frontend/package.json`

الأوامر المتاحة:

| الأمر | النوع | الغرض |
|---|---|---|
| `npm run check:xss` | حارس ثابت | فحص XSS guard |
| `npm run build` | build gate | فحص TypeScript + Vite build |

مهم:

- لا يوجد `test` script.
- لا توجد مكتبة اختبار واجهات مثل Vitest/Jest/RTL/Playwright/Cypress.
- لا توجد ملفات اختبارات متتبعة في `frontend/src`.

### 2.3 الـ Mobile

الملفان المرجعيان: `rafiq_mobile/pubspec.yaml` و`rafiq_mobile/README.md`

أدوات التحقق:

| الأمر | النوع | الغرض |
|---|---|---|
| `flutter test` | unit/widget tests | تنفيذ اختبارات التطبيق |
| `flutter analyze` | static quality gate | تحليل analyzer والـ lints |

ملفات الاختبار الفعلية:

| الملف | النوع | عدد الاختبارات |
|---|---|---|
| `rafiq_mobile/test/widget_test.dart` | widget smoke | 1 |
| `rafiq_mobile/test/application/attendance/attendance_controller_test.dart` | unit/application | 2 |
| `rafiq_mobile/test/application/corrections/corrections_controller_test.dart` | unit/application | 3 |
| `rafiq_mobile/test/presentation/auth/forgot_password_screen_test.dart` | widget/UI | 1 |
| `rafiq_mobile/test/presentation/context/role_navigation_test.dart` | unit/navigation | 3 |
| `rafiq_mobile/test/presentation/notifications/notification_navigation_test.dart` | unit/navigation | 4 |

الإجمالي: 6 ملفات، 14 اختبارًا.

يوجد أيضًا ملف منصة macOS افتراضي:

- `rafiq_mobile/macos/RunnerTests/RunnerTests.swift`

لكنه مجرد placeholder، وليس ضمن تدفق `flutter test` الحالي.

## 3. وضع CI الحقيقي

الملف المرجعي: `.github/workflows/ci.yml`

| Job | ما الذي يشغله | الوضع الحالي بعد الفحص |
|---|---|---|
| `backend` | `npm ci` ثم `prisma validate` ثم `npm run build` | البناء نجح محليًا |
| `frontend` | `npm ci` ثم `npm run check:xss` ثم `npx tsc -b` ثم `vite build` | `check:xss` نجح، لكن البناء فشل |
| `mobile` | `flutter pub get` ثم `flutter analyze` ثم `flutter test` | الاختبارات نجحت، لكن `flutter analyze` فشل بملاحظات analyzer |

استنتاج مهم:

- حتى مع نجاح `flutter test`، فإن Job الموبايل في CI سيظل أحمر حاليًا لأن `flutter analyze` يرجع exit code غير صفري.
- Job الـ frontend أحمر حاليًا بسبب فشل البناء.
- لا يوجد Job يشغّل smoke scripts الخاصة بالـ backend داخل CI.

## 4. النتائج التنفيذية التي تم التحقق منها

### 4.1 ما تم تشغيله فعليًا

| الأمر | النتيجة |
|---|---|
| `flutter test` داخل `rafiq_mobile` | نجح: 14/14 |
| `flutter analyze` داخل `rafiq_mobile` | فشل: 17 info issues |
| `npm run build` داخل `backend` | نجح |
| `npm run test:smoke:rbac:critical` داخل `backend` | نجح: 24/24 check |
| `npm run test:smoke:rbac` داخل `backend` | فشل مبكرًا عند login |
| `npm run test:integration:m2-users` داخل `backend` | فشل مبكرًا عند login |
| `npm run test:smoke:finance-v2` داخل `backend` | فشل مبكرًا عند login |
| `npm run check:xss` داخل `frontend` | نجح |
| `npm run build` داخل `frontend` | فشل |

### 4.2 سبب فشل الـ frontend build

السبب المباشر:

- `frontend/src/features/exams/components/ExamRegistryTab.tsx` يستورد `ExamEvaluationWorkspace`.
- الملف `frontend/src/features/exams/components/ExamEvaluationWorkspace.tsx` موجود لكنه فارغ تمامًا وحجمه `0` بايت.
- نتيجة ذلك: TypeScript يرى import لعضو غير موجود، فيفشل البناء.

هذا الفشل يعني أن طبقة الواجهة لا تملك حتى الآن قاعدة مستقرة تسمح بإضافة اختبارات CI جدية فوقها.

### 4.3 سبب فشل بعض سكربتات الـ backend

#### أ. سكربتا `rbac-smoke` و`integration-m2-users`

المراجع:

- `backend/scripts/rbac-smoke.ts`
- `backend/scripts/integration-m2-users.ts`
- `backend/src/modules/auth/auth.controller.ts`

المشكلة:

- هذان السكربتان يسجلان دخول `superadmin@rafiq.local` بدون تمرير header `x-platform`.
- في `auth.controller` المنصّة الافتراضية تصبح `mobile` إذا لم تكن `x-platform` مساوية تمامًا لـ `web`.
- في `auth.service` دخول `SUPER_ADMIN` و`CENTER_ADMIN` من `mobile` مرفوض بـ `AUTH_FORBIDDEN_PLATFORM`.

بالتالي:

- السكربتان أصبحا غير متوافقين مع قواعد المصادقة الحالية بعد إدخال تقييد المنصّة.
- الفشل ليس "فشل بيئة" فقط، بل عدم مواءمة مباشرة مع عقدة API الحالية.

قيد إضافي:

- كلا السكربتين يستخدم `BASE_URL = http://127.0.0.1:4000`.
- أثناء الفحص كان يوجد أصلًا process يستمع على المنفذ `4000`.
- هذا يجعل السكربتين أكثر هشاشة، لأنهما غير معزولين عن أي خدمة محلية موجودة مسبقًا.

#### ب. سكربت `finance-v2-smoke`

المراجع:

- `backend/scripts/finance-v2-smoke.ts`
- `backend/src/modules/auth/auth.controller.ts`

المشكلة أدق هنا:

- السكربت يعرّف دالة `login` في موضع مبكر، لكنها لا تستقبل فعلًا المنصّة عند الاستدعاء الحالي.
- في `main` يتم استدعاؤها هكذا:
  - `login("superadmin@rafiq.local")`
  - `login("center.admin@rafiq.local")`
  - `login("supervisor@rafiq.local")`
- وبما أن `x-platform` لا يمرر، فيتم تفسير الطلب على أنه `mobile`.
- لذلك يفشل أول تسجيل دخول إداري بحالة `403 AUTH_FORBIDDEN_PLATFORM`.

هذا يعني أن سكربت المالية لا يصل أصلًا إلى فقرات التغطية المالية الثمانية رغم أنه يحتويها.

## 5. التوثيق التفصيلي لاختبارات الـ Mobile

## 5.1 اختبار بناء التطبيق الأساسي

الملف: `rafiq_mobile/test/widget_test.dart`

الواجهة/العقدة تحت الاختبار:

- `RafiqApp`
- `ProviderScope`
- تهيئة Hive المؤقتة للاختبار
- الواجهة الابتدائية `SplashScreen`

التدفق خطوة بخطوة:

1. ينشئ الاختبار مجلد Hive مؤقتًا في `setUpAll`.
2. يهيّئ Hive على هذا المسار المؤقت.
3. يبني التطبيق داخل `ProviderScope`.
4. يتأكد أن `SplashScreen` موجودة.
5. يضخ مدة زمنية `1200ms` للتأكد أن بناء التطبيق لا ينكسر بعد أول دورة render.
6. في `tearDownAll` يحذف بيانات Hive المؤقتة.

ما يغطيه:

- سلامة bootstrap الأساسية.
- عمل التطبيق داخل بيئة اختبار دون storage حقيقي دائم.

ما لا يغطيه:

- التوجيه بعد شاشة البداية.
- المصادقة.
- استدعاءات الشبكة.
- التنقل الفعلي بين الشاشات.

القيود:

- smoke test فقط.
- لا يتحقق من state لاحقة بعد splash.

## 5.2 Attendance Controller

الملف: `rafiq_mobile/test/application/attendance/attendance_controller_test.dart`

العقدة تحت الاختبار:

- `AttendanceController`
- `attendanceRepositoryProvider`
- عقدة repository: `AttendanceRepository`

المصادر المرتبطة:

- `rafiq_mobile/lib/application/attendance/attendance_controller.dart`
- `rafiq_mobile/lib/application/attendance/attendance_state.dart`
- `rafiq_mobile/lib/domain/entities/attendance.dart`
- `rafiq_mobile/lib/domain/repositories/attendance_repository.dart`

الواجهة التي يختبرها الملف:

- `loadForDate(circleId, date)`
- `updateStatus(studentId, status)`
- `collectValidationIssues()`
- `submit(circleId)`

التدفق الأول: التحقق من الأعذار بدون سبب

1. يحقن Fake Repository عبر `ProviderContainer`.
2. يستدعي `loadForDate` لدائرة محددة وتاريخ محدد.
3. يعيد الـ fake طالبًا واحدًا فقط.
4. يغيّر الحالة إلى `AttendanceStatus.excused`.
5. يستدعي `collectValidationIssues`.
6. يتأكد أن الرسالة التحذيرية الخاصة بغياب العذر المكتوب موجودة.

الهدف السلوكي:

- منع إرسال غياب بعذر دون ملاحظة نصية.

التدفق الثاني: منع submit قبل الوصول إلى repository

1. يحمّل نفس السياق.
2. يضبط الطالب على `excused`.
3. يستدعي `submit`.
4. يتوقع النتيجة `AttendanceSubmitOutcome.failed`.
5. يتأكد أن `submitBulkAttendance` لم تُستدع أصلًا (`submitCalls == 0`).

القيود التي تكشفها الاختبارات:

- التحقق الحالي يغطي حالة business واحدة فقط: `excused` بلا note.
- لا توجد اختبارات لمسار offline queue.
- لا توجد اختبارات لمسارات `404` أو `409` أو `DioException`.
- لا يوجد اختبار لـ `markAllPresent`.
- لا يوجد اختبار لبناء records قبل الإرسال.

## 5.3 Corrections Controller

الملف: `rafiq_mobile/test/application/corrections/corrections_controller_test.dart`

العقدة تحت الاختبار:

- `CorrectionsController`
- `CorrectionsRepository`
- `CorrectionsState`

المصدر المرتبط:

- `rafiq_mobile/lib/application/corrections/corrections_controller.dart`

الواجهات المختبرة:

- `load(centerId, circleId)`
- `approve(correctionId, applyChanges, reviewNote)`
- `reject(correctionId, reviewNote)`

التدفقات المغطاة:

التدفق الأول: تحميل قائمة التصحيحات

1. يجهز fake repository لإرجاع عنصر واحد.
2. يستدعي `load(centerId: 10, circleId: 11)`.
3. يتأكد من تمرير المعرّفات الصحيحة إلى repository.
4. يتحقق من امتلاء `state.items`.
5. يتحقق من خلو `state.error`.

التدفق الثاني: الموافقة على تصحيح

1. يحمّل state أولية فيها عنصر `PENDING`.
2. يجهز fake repo لإرجاع نسخة `APPROVED`.
3. يستدعي `approve`.
4. يتحقق من حفظ id المستهدف.
5. يتحقق من استبدال العنصر داخل state.
6. يتحقق من خلو `actionError`.

التدفق الثالث: الرفض مع خطأ صادر من repository

1. يضع عنصرًا `PENDING` داخل state.
2. يجهز fake repo ليرمي `Exception`.
3. يستدعي `reject`.
4. يتوقع `throwsException`.
5. يتحقق من تخزين النص داخل `state.actionError`.
6. يتحقق من إعادة `isActing` إلى `false`.

ما الذي تثبته هذه الاختبارات:

- إدارة state محليًا تعمل كما هو متوقع.
- الأخطاء تعاد إلى واجهة state ولا تضيع.
- replace-in-place للعناصر داخل القائمة يعمل.

الفجوات:

- لا يوجد اختبار لتحليل رسائل `DioException.response.data`.
- لا يوجد اختبار لـ `clearActionError`.
- لا يوجد اختبار لمسار `approve` عند الفشل.

## 5.4 Forgot Password Screen

الملف: `rafiq_mobile/test/presentation/auth/forgot_password_screen_test.dart`

العقدة تحت الاختبار:

- `ForgotPasswordScreen`
- `authRepositoryProvider`
- عقدة repository: `AuthRepository.forgotPassword`

المصدر المرتبط:

- `rafiq_mobile/lib/presentation/auth/forgot_password_screen.dart`

التدفق المغطى:

1. يبني الشاشة داخل `MaterialApp` و`ProviderScope`.
2. يحقن fake repository.
3. يبحث عن حقل الإدخال.
4. يدخل البريد `teacher@example.com`.
5. يضغط زر الإرسال.
6. يترك الإطار يصل إلى settle.
7. يتحقق أن fake repository استقبل نفس المعرف.
8. يتحقق من ظهور success state.
9. يتحقق من اختفاء `TextFormField`.
10. يتحقق من ظهور زر العودة لتسجيل الدخول.

ما يغطيه:

- الربط بين الواجهة وrepository.
- الانتقال من form state إلى success state.
- السلوك المرئي بعد النجاح.

ما لا يغطيه:

- فشل الشبكة.
- رسائل الأخطاء.
- التحقق من الإدخال الفارغ.
- سلوك `mounted` بعد التخلص من الشاشة.

قيد مهم:

- الاختبار لا يثبت نص الرسالة الراجع من API، بل فقط الانتقال إلى success state.

## 5.5 Role Navigation

الملف: `rafiq_mobile/test/presentation/context/role_navigation_test.dart`

العقدة تحت الاختبار:

- `navigationItemsForRole`
- `navigationIndexForLocation`
- `RouteNames`

المصادر المرتبطة:

- `rafiq_mobile/lib/presentation/context/role_navigation.dart`
- `rafiq_mobile/lib/core/router/route_names.dart`

التدفقات المغطاة:

1. دور المعلم:
   - يضمن تسلسل tabs المتوقع.
   - يضمن ربط `student profile` بتبويب الحلقة.
   - يضمن ربط شاشة تحضير الحضور بتبويب الحلقة.
   - يضمن ربط `teacherHalqaReport` بتبويب السجل.
2. دور المشرف:
   - يضمن تسلسل tabs المتوقع.
   - يضمن ربط `approvals` بتبويب الحلقات.
   - يضمن ربط `supervisorHalqaReport` بتبويب التقارير.
3. دور ولي الأمر:
   - يضمن أن child detail وattendance وresults تبقي تبويب الأبناء محددًا.

القيمة الفعلية:

- هذا الملف يثبت contract التنقل لا الـ UI نفسها.
- أي تغيير في `RouteNames` أو `matchPrefixes` سيُلتقط مباشرة.

الفجوات:

- لا يوجد اختبار لدوري `STUDENT` و`CENTER_ADMIN` و`SUPER_ADMIN`.
- لا يوجد اختبار للحالات غير المعروفة أو role فارغ.

## 5.6 Notification Navigation

الملف: `rafiq_mobile/test/presentation/notifications/notification_navigation_test.dart`

العقدة تحت الاختبار:

- `resolveNotificationPrimaryRoute`
- `NotificationDto`
- `RoleGuards`
- `RouteNames`

المصادر المرتبطة:

- `rafiq_mobile/lib/presentation/notifications/notification_navigation.dart`
- `rafiq_mobile/lib/core/enums/user_role.dart`
- `rafiq_mobile/lib/core/router/route_names.dart`

التدفقات المغطاة:

1. عند وجود `studentId` في metadata:
   - يجب إعادة route ملف الطالب.
2. عند وجود `attemptId`:
   - يجب إعادة route الامتحانات.
3. عند وجود `circleId`:
   - يجب إعادة route الحلقات.
4. عند metadata غير كافية:
   - يجب إعادة `null`.

ما يغطيه:

- تحويل metadata إلى مسار ملاحي صحيح.
- احترام صلاحيات الدور عبر `RoleGuards.canAccess`.

الفجوات:

- لا يوجد اختبار عند role غير صالح.
- لا يوجد اختبار لمسار `studentIds` القائمة.
- لا يوجد اختبار عندما route صالح لكن الدور غير مخوّل.

## 6. التوثيق التفصيلي لسكربتات الـ Backend

## 6.1 `rbac-critical-smoke.ts`

النوع: smoke script حي على API

النتيجة الفعلية: نجح بالكامل، 24 من 24 check

التدفق العام:

1. يشغّل السيرفر على منفذ معزول (`SMOKE_PORT`).
2. ينتظر `GET /system/health`.
3. يسجل دخول عدة أدوار.
4. يستخرج نطاق حلقات المعلم.
5. يزرع attendance يدويًا عبر `/staff-operations`.
6. يتحقق أن المعلم لا يرى زيارات غير مسموح بها.
7. يتحقق أن المعلم يرى حضوره فقط.
8. يتحقق أن المعلم لا يستطيع تسجيل حضور مستخدم آخر.
9. ينشئ عذرًا.
10. يتحقق من رفض العذر المكرر.
11. ينشئ عذرًا يحتاج موافقة.
12. يتحقق أن المشرف لا يستطيع اعتماد العذر.
13. يتحقق أن المشرف العام يستطيع اعتماد العذر.
14. يتحقق أن العذر المعتمد لا يعود إلى `PENDING`.
15. يتحقق أن مدير المركز لا يوافق على voucher.
16. يتحقق أن `check-user` لا يسرّب role.
17. يعطّل معلمًا.
18. يتحقق أن المستخدم المعطل يفشل في الوصول للنطاق.
19. يتحقق أن refresh token لمستخدم معطل يُرفض.
20. يعيد تفعيل المستخدم في cleanup.

هذا السكربت هو أقوى طبقة backend حاليًا لأنه:

- معزول على منفذ مستقل.
- يختبر authorization حقيقيًا.
- يختبر business rules حرجة.
- يحتوي cleanup لحالة التعطيل.

## 6.2 `rbac-smoke.ts`

النوع: smoke script حي على API

الهدف الوظيفي من الشيفرة:

- فحص رؤية المستخدمين والبذور حسب الأدوار.
- فحص إنشاء supervisor/center/circle مؤقت.
- فحص منع center admin من إنشاء أو تعديل نطاقات أجنبية.
- فحص رؤية parent وstudent للبيانات المسموحة فقط.
- فحص masking إلى `404`.
- فحص اتساق scope قبل/بعد الإنشاءات.
- فحص وجود paths داخل OpenAPI.

تسلسل الفحص المقصود:

1. health.
2. logins متعددة.
3. جمع المستخدمين والبذور.
4. قراءة المراكز والحلقات حسب الأدوار.
5. إنشاء كيانات مؤقتة.
6. التحقق من القيود على center admin/supervisor/teacher.
7. التحقق من حدود parent/student.
8. التحقق من اتساق scope.
9. التحقق من OpenAPI.

وضعه الحالي:

- لا يعمل حاليًا بسبب عدم تمرير `x-platform` مع logins الإدارية.

## 6.3 `integration-m2-users.ts`

النوع: integration script حي على API

الهدف الوظيفي:

- فحص milestone المستخدمين.
- CRUD جزئي للمستخدمين.
- duplicate email.
- تحديث scoped/unscoped.
- حماية last super admin من التعطيل.
- center access وcircle access.
- enrollments.
- parent-student links.
- فحص OpenAPI لواجهات المستخدمين.

التدفق المقصود:

1. health.
2. login super admin وcenter admin وparent.
3. استخراج center/circle scoped.
4. إنشاء مستخدمين مؤقتين.
5. التحقق من duplicate email.
6. التحقق من تحديث scoped مقابل unscoped.
7. فحص status rules للـ super admins.
8. إضافة/إزالة center access.
9. إضافة دائرة لمدرس scoped ومنع الدائرة الأجنبية.
10. إنشاء طالب وولي أمر وربط enrollment.
11. إضافة parent link ثم حذفه.
12. حذف enrollment.
13. التحقق من OpenAPI paths.

وضعه الحالي:

- متوقف لنفس سبب `rbac-smoke`: login إداري بدون `x-platform`.

## 6.4 `finance-v2-smoke.ts`

النوع: smoke script حي على API

التغطية المقصودة من الشيفرة نفسها:

1. `transfer attachment validation + idempotency`
2. `concurrent payments race condition`
3. `locate accounts after payment operations`
4. `voucher workflow + void workflow`
5. `fund transfer workflow`
6. `payroll flow`
7. `reward flow`
8. `approvals queue + role guard smoke`

هذا السكربت نظريًا أوسع سكربت domain في الـ backend.

لكن حالته الفعلية الآن:

- لا يتجاوز مرحلة تسجيل الدخول.
- السبب المباشر خلل في الاستدعاء، لا في domain المالي نفسه.

بالتالي:

- التغطية المالية المكتوبة موجودة في الشيفرة.
- التغطية المالية المنفذة فعليًا = صفر في الوضع الحالي.

## 7. القيود الهيكلية الحالية

### 7.1 قيود على مستوى التصميم

- لا توجد طبقة unit tests في `backend` للخدمات أو الـ repositories أو validators.
- لا توجد اختبارات للـ `frontend` أصلًا.
- لا توجد اختبارات end-to-end حقيقية تغطي رحلة المستخدم كاملة عبر الويب.
- لا توجد تقارير coverage أو thresholds.
- لا توجد snapshots أو golden tests في Flutter.

### 7.2 قيود على مستوى التشغيل

- سكربتات backend تعتمد على:
  - قاعدة بيانات seeded.
  - كلمات مرور ثابتة.
  - API حي.
  - بيانات mutable قابلة للتغيير.
- جزء من smoke scripts غير معزول على منفذ خاص.
- تغيّر سياسة login حسب المنصّة كسر سكربتات قديمة ولم تُحدّث.

### 7.3 قيود على مستوى الحوكمة

- `rafiq_mobile/` ظاهر في هذه الـ workspace كمسار غير متتبع في Git.
- هذا يعني أن أقوى طبقة اختبارات موجودة حاليًا ليست مضمونة الإدراج ضمن تاريخ المستودع إذا لم تُضم لاحقًا.

## 8. الفجوات حسب الواجهة والعملية والتدفق

| المجال | مغطى حاليًا | غير مغطى حاليًا |
|---|---|---|
| Bootstrap الموبايل | بناء التطبيق وظهور splash | دورة التهيئة الكاملة بعد splash |
| حضور الطلاب | validation أساسي + منع submit غير الصحيح | success path، offline queue، mapping للأخطاء، retry |
| التصحيحات | load / approve / reject state | فشل approve، parsing أخطاء Dio، pagination |
| استعادة كلمة المرور | success UI path | validation الفاشل، network failure، loading edge cases |
| ملاحة الأدوار | عقود route selection لبعض الأدوار | أدوار أخرى، fallback، unauthorized routes |
| ملاحة الإشعارات | mapping metadata إلى route | denial cases كاملة، arrays متعددة، malformed metadata |
| Backend RBAC | جزء حرج واحد منفذ بنجاح | معظم smoke scripts القديمة متعطلة |
| Finance V2 | تغطية مكتوبة في السكربت | لا توجد تغطية منفذة الآن |
| Frontend Exams UI | لا شيء | كل شيء تقريبًا |

## 9. الأولويات العملية المقترحة

1. إصلاح `frontend` ليعود البناء أخضر أولًا، لأن غياب build سليم يجعل أي استراتيجية اختبار لاحقة غير مستقرة.
2. تحديث `backend/scripts/rbac-smoke.ts` و`backend/scripts/integration-m2-users.ts` لتمرير `x-platform: web` للحسابات الإدارية.
3. إصلاح `backend/scripts/finance-v2-smoke.ts` بتمرير المنصّة صراحة في استدعاءات `login`.
4. إدخال smoke scripts الأساسية في CI للـ backend بدل الاكتفاء بالبناء.
5. خفض ضوضاء `flutter analyze` إلى صفر أو مستوى مقبول حتى يصبح Job الموبايل أخضر فعليًا.
6. إنشاء أول طبقة اختبار للـ frontend على الأقل حول شاشات `exams` و`auth`.
7. إضافة coverage reporting حتى يصبح التقرير الكمي للتغطية متاحًا بدل الاعتماد على الجرد اليدوي فقط.

## 10. الحكم النهائي

إذا كان المقصود بـ "وحدة الاختبارات بالكامل" منظومة قابلة للاعتماد عبر جميع أجزاء المشروع، فالإجابة الحالية هي:

- الموبايل: موجودة وجيدة كبداية، لكنها محدودة النطاق وتحتاج توسيعًا.
- الـ backend: موجودة كسكربتات تحقق قوية الفكرة، لكنها غير موحدة وبعضها متعطل بسبب تغيّر contract المصادقة.
- الـ frontend: لا توجد وحدة اختبارات فعلية حاليًا.

وعليه فإن المنظومة الاختبارية للمشروع ككل ليست مكتملة بعد، بل غير متوازنة: قوية نسبيًا في `rafiq_mobile`، جزئية ومهترئة في `backend`، وغائبة في `frontend`.
