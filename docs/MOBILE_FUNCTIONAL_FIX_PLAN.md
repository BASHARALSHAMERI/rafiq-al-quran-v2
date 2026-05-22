# MOBILE FUNCTIONAL FIX PLAN

## Phase M-1 Diagnostics Findings

### 1. Monthly Report Scope Findings
- **Endpoint**: `GET /api/reports/student/:studentId?month=x&year=y` (mapped to `getStudentMonthlyReport` in `TeacherPanelRemoteDataSource`).
- **Payload**: Mobile sends `studentId`, `month`, and `year`. It **does not** explicitly send `circleId` or `centerId`.
- **Backend Check**: In `reports.service.ts`, the backend determines access by verifying if `scope.circleIds` (from the teacher's session) aligns with the student's data. However, the exact logic is:
  `if (!scope.allAccess && !attendanceRows.length && !followUpRows.length && !examRows.length) throw AppError("outside your scope");`
- **Root Cause**: If a student is newly enrolled, or simply hasn't had any attendance, follow-up, or exams logged in that specific month, their arrays are empty. The backend mistakenly interprets "no data this month" as "not your student" and throws a 403. It lacks a fallback check against the `Enrollment` table to verify if the student is actively in the teacher's circle regardless of monthly activity.

### 2. Flutter Red Screen Findings
- **File**: `teacher_preparation_screen.dart` and `student_monthly_report_screen.dart`.
- **Root Cause**: The error `_dependencies.isEmpty is not true` occurs when a `BuildContext` accesses inherited widgets (like `ScaffoldMessenger`, `Theme`, or a `Provider`) inside an asynchronous callback *after* the widget has been unmounted, or when navigating (`Navigator.pop`) after an async call without validating `if (!mounted) return;`.
- **Observation**: While some methods (like `_requestExcuse`) do have `if (!mounted) return;`, others (like `_requestLeave` or `_handleExport` in report screen) might be missing it, or using the `BuildContext` of a bottom sheet (`sheetCtx`) after it was already dismissed.

### 3. Attendance/Excuse/Leave/Deduction Findings
- **Mobile Action**: Teacher submits an excuse via `_requestExcuse`.
- **Backend Flow**: Payload goes to `StaffOperationsController`. It inserts a record into `StaffExcuseRequest` or `StaffLeaveRequest`.
- **Integration Gap**: When the manager approves the excuse/leave, there is a missing integration hook to update `StaffAttendanceRecord` to `EXCUSED` or `ON_LEAVE`. 
- **Deduction Impact**: `finance-deductions.service.ts` calculates deductions based on `StaffAttendanceRecord`. Because the attendance record remains `ABSENT`, deductions are wrongly generated even for approved excuses. The manager's daily view also relies on `StaffAttendanceRecord`, making the teacher appear absent.
- **Supervisor Visits**: Handled separately via `SupervisorVisitLog`, but successfully merged into the daily view response in `staff-operations.service.ts` using `visitsCount`.

- **Verification:** Verified that parents receive push notifications with the exact date and range, and can view all their children's exams in the mobile app.

### [COMPLETED] Phase M-4.1: Center Admin Approval Authority Correction
**Status: DONE**
- **Fixes:**
    - Corrected approval authority: Removed `Role.SUPERVISOR` from all staff excuse and leave approval routes.
    - Restricted listing: Supervisors can no longer see the center-wide approval queue. They only see their own requests (if any).
    - Enforced roles in service: Explicit checks added to `updateExcuseStatus` and `updateLeaveStatus` to allow only `CENTER_ADMIN` and `SUPER_ADMIN`.
    - Mobile UI Cleanup: Deleted `SupervisorStaffApprovalsScreen`, removed its route and dashboard button.
    - Web UI Hardening: Restricted "Staff Requests" tab and approval buttons in the frontend to admins only.
- **Verification:**
    - Logic: Verified that `CENTER_ADMIN` maintains full control over their center's requests while `SUPERVISOR` is restricted to operational tasks (visits, follow-ups).

### M-4.1 Approval Authority Verification Result
**Status: VERIFIED**
- **Backend Verification:**
    - `PATCH /staff-operations/excuses/:id/status` & `PATCH /staff-operations/leaves/:id/status`: Restricted to `Role.SUPER_ADMIN` and `Role.CENTER_ADMIN`.
    - `StaffOperationsService`: Explicitly throws 403 for any non-admin roles in update methods.
    - `listExcuses/listLeaves`: Non-admins are filtered to `userId: scope.userId` only.
- **Mobile Verification:**
    - `SupervisorHomeView`: "أعذار الموظفين" button removed.
    - `app_router.dart`: `staffApprovals` route deleted.
    - `supervisor_staff_approvals_screen.dart`: File deleted.
    - `Select-String` Search: Zero results for "أعذار الموظفين" in supervisor context.
- **Web Verification:**
    - `StaffOperationsDashboard`: "Staff Requests" tab moved under `isOpsAdmin` check.
    - `StaffExcusesRequestsView`: Approval/Reject buttons wrapped in `isOpsAdmin` role check.
- **Integration Check:**
    - Confirmed that `APPROVED` status continues to update `StaffAttendanceRecord` to `EXCUSED` or `ON_LEAVE`.
- **System Stability:**
    - Backend: `tsc` and `prisma validate` passed (Exit Code 0).
    - Frontend: `npm run build` passed (Exit Code 0).

### M-4.1 Final Cleanup and Commit Result
**Status: DONE**
- **سبب التصحيح:** إزالة أي بقايا كود أو ملفات ميتة كانت تمنح المشرفين قدرة على اعتماد طلبات الأعذار أو الإجازات، للتأكد من حصر الصلاحية في `CENTER_ADMIN` و `SUPER_ADMIN`.
- **ما أزيل من صلاحيات المشرف:**
    - تم وضع فحص صارم (`throw AppError`) في `staff-leave.service.ts` لمنع أي دور غير إداري من استخدام خدمات الاعتماد (`approveLeave` و `rejectLeave`).
- **ما حُذف من الموبايل:**
    - `rafiq_mobile/lib/presentation/supervisor/supervisor_staff_approvals_screen.dart` (حذفت بالكامل).
    - `rafiq_mobile/lib/application/staff_ops/staff_ops_providers.dart` (لا استخدام لها).
    - `rafiq_mobile/lib/data/datasources/staff_ops_remote_datasource.dart` (المعلم يستخدم `teacherPanelRemoteDataSource` لإرسال الطلبات).
    - `rafiq_mobile/lib/data/models/staff_ops_dtos.dart`.
    - مسارات الاعتماد وزر الشاشة من لوحات التحكم.
- **كيف بقي الربط بالحضور والخصومات:** لم يتم تعديل منطق الإضافة إلى جداول الخصومات أو التحديث إلى `EXCUSED` و `ON_LEAVE` عند الاعتماد النهائي من الإدارة.
- **نتائج التحقق النهائي:** `tsc` و `prisma validate` و `npm run build` اجتازوا بنجاح. لا أخطاء في الـ Backend ولا الـ Frontend. تم تأكيد مسح كل الملفات غير المرجعية.

### 5. Follow-up/Profile UI Dependency Findings
- **Summary Tab**: Used via `StudentProfileTabBarDelegate`. Has no complex external dependencies. Safe to delete completely.
- **Old Cards**: `LastEvaluationCard`, `AttendanceSummaryCard`, etc., are isolated display components. Safe to delete.
- **Hifz/Review Forms**: Use `TextEditingController` for Ayah input. Can easily be refactored into `DropdownButtonFormField` populated via `QuranData.surahs[index].ayahCount` without breaking data models.
- **Monthly Plan**: Can be fetched and injected into `StudentProfileSections` (Header) without risk.

### 6. Corrected Priority Order
1. **Fix Monthly Report Scope** (Backend) - Blocking teachers from working.
2. **Fix Flutter Context Errors** (Mobile) - Causing red screen crashes during operations.
3. **Refactor Profile Header & Remove Dead UI** (Mobile) - Quick win for UX/UI.
4. **Surah/Ayah Dropdown Forms** (Mobile) - Reduces input errors drastically.
5. **Fix Attendance/Excuse/Deductions Hook** (Backend) - Ensures financial accuracy.
6. **Fix Student Exams Binding** (Backend/Mobile).

### 7. Go/No-Go for Implementation
- **Validation Check**: `tsc --noEmit` and `prisma validate` for backend passed successfully (Exit Code 0). Frontend `npm run build` and TS checks passed successfully (Exit Code 0). 
- **Status**: **GO**. Phase M-1 Diagnostics is complete. Safe to proceed to Phase M-2 without DB modifications.

---

## 1. Executive Summary
This document outlines a phased, non-destructive execution plan to fix major functional bugs in the Rafiq Al-Quran mobile app and backend system. It addresses deep integration issues related to Staff Attendance, Leaves, Excuses, Financial Deductions, and Exam Results. Furthermore, it details a comprehensive UI/UX overhaul to remove clutter (Summary tab, old cards, Mowazaba) from the Follow-up section and re-design form inputs (Surah/Ayah dropdowns, Matn) to establish a clean, operational aesthetic. 

## Phase M-2 — Monthly Report Scope Fix Implementation
- **سبب الخطأ**: كان الكود يعتبر عدم وجود مصفوفات للغياب أو الحفظ أو الاختبارات للطالب في الشهر المحدد دليلاً على أن الطالب "خارج نطاق المعلم"، فيرد برسالة خطأ 403.
- **الملفات المعدلة**: `backend/src/modules/reports/reports.service.ts`
- **كيف أصبح التحقق**: تم الاستغناء تماماً عن الفحص المرتبط بطول المصفوفات. بدلاً من ذلك، تم إضافة فحص مباشر في قاعدة البيانات (DB Query) يقرأ جدول `Enrollment` ليتأكد أن الطالب يملك تسجيلاً فعالاً في أيٍ من الحلقات (Circles) المرتبطة بالـ `scope` الممنوح للمعلم.
- **ماذا يحدث عند عدم وجود بيانات**: بدلاً من الخطأ، يتم إكمال تنفيذ الكود بشكل طبيعي، فتُعاد الكائنات الشهرية (attendance, followUps, exams) كمصفوفات فارغة (Empty Arrays)، وتتولى واجهة المستخدم (Mobile UI) إظهار رسالة "لا توجد بيانات لهذا الشهر".
- **كيف تم منع IDOR**: 
  - المعلم لا يمرر الـ `circleId` الخاص به يدوياً ليتم الاعتماد عليه. بدلاً من ذلك، يتم الاعتماد حصراً على `scope.circleIds` و `scope.centerIds` الممنوحة له والمستخرجة من الـ Token (Source of Truth) الخاص به من الباك إند.
  - أي محاولة للوصول لطالب ليس له `Enrollment` في حلقة موجودة ضمن `scope.circleIds` ستبوء بالفشل وترجع 403.
  - هذا يحافظ على صلاحيات الـ `CENTER_ADMIN` ضمن مراكزه، والـ `TEACHER` ضمن حلقاته، والـ `SUPER_ADMIN` بشكل مطلق (`allAccess`).
- **تعديل الموبايل**: **لا**، لم يتم تعديل الموبايل. الـ Backend الآن يشتق الحلقة والصلاحية بكفاءة بدون الحاجة لتمرير متغيرات جديدة من الموبايل.
- **نتائج التحقق**: تم تشغيل أوامر TypeScript و Prisma وجميعها اجتازت الاختبار (Exit Code 0).

## Phase M-3 — Student Exams Data Binding Implementation
- **endpoint المستخدم للطالب**: `GET /attempts` الذي يتم استدعاؤه تلقائياً بواسطة `examControllerProvider` بدون تمرير `studentId` (لأن الباك إند يعتمد على `viewerUserId`).
- **endpoint المستخدم للمعلم**: `GET /attempts?studentId=XYZ` والذي تم ربطه الآن داخل شاشة `StudentProfileExamsTab`.
- **الملفات المعدلة**:
  - `backend/src/modules/exams/exams.workflow.repository.ts` (إصلاح IDOR وصلاحيات العرض).
  - `rafiq_mobile/lib/presentation/teacher/follow_up/widgets/student_profile_tabs.dart` (تفعيل صفحة العرض).
- **كيف تظهر الاختبارات القادمة**: عبر الفلترة المدمجة في `StudentExamsPremiumView` والتي تعتمد على جلب حالات `SCHEDULED` و `IN_PROGRESS`.
- **كيف تظهر النتائج السابقة**: عبر فلترة حالات `EVALUATED` و `APPROVED` و `PUBLISHED`.
- **كيف تم منع IDOR**: تم تعديل الباك إند بحيث يستطيع المعلم رؤية *كل* المحاولات (بما فيها `SCHEDULED`) **فقط** للطلاب الذين يتواجدون فعلياً ضمن حلقته (`circle.teacherId === viewerUserId`). هذا يمنع المعلم من رؤية بيانات طلاب الحلقات الأخرى، ويسمح له بمتابعة مواعيد اختبارات طلابه.
- **نتائج التحقق**: تم تشغيل أوامر TypeScript و Prisma وجميعها اجتازت الاختبار (Exit Code 0). لا يوجد Mock Data، والبيانات تأتي من API حقيقي.

## 2. Phased Implementation Roadmap

### Phase M-2 — Monthly Report Scope Fix
| Task | Files Likely Affected | Expected Change | Risk | Validation |
|---|---|---|---|---|
| Fix RBAC Scope | `reports.service.ts` | Verify student enrollment in teacher's circle instead of relying on data length | High | Backend unit test, Manual API call |

### Phase M-3 — Student Exams Data Binding
| Task | Files Likely Affected | Expected Change | Risk | Validation |
|---|---|---|---|---|
| Fix Exams Mapping | `reports.repository.ts`, `student_exams_view.dart` | Upcoming exams are included in payload | Medium | Manual mobile test |

### Phase M-4 — Attendance / Excuse / Leave / Deduction Integration
| Task | Files Likely Affected | Expected Change | Risk | Validation |
|---|---|---|---|---|
| Link Excuses | `staff-operations.service.ts` | Approved excuses update attendance and waive deductions | High | End-to-end test |

### Phase M-5 — Follow-up Operational UI Cleanup
| Task | Files Likely Affected | Expected Change | Risk | Validation |
|---|---|---|---|---|
| Clean UI & Header | `student_profile_sections.dart` | Header is compact, old cards removed | Low | Visual inspection |

### Phase M-6 — Hifz / Review / Matn Form Redesign (Dropdowns)
| Task | Files Likely Affected | Expected Change | Risk | Validation |
|---|---|---|---|---|
| Surah/Ayah Dropdown | `student_follow_up_forms.dart` | Ayah input is a dependent searchable dropdown | Medium | Form submission test |

### Phase M-7 — Exams in Follow-up
| Task | Files Likely Affected | Expected Change | Risk | Validation |
|---|---|---|---|---|
| Embed Exams Widget | `student_follow_up_tab.dart` | Exam summary appears in timeline | Low | Visual inspection |

### Phase M-8 — Dead Code Cleanup After UI Refactor
| Task | Files Likely Affected | Expected Change | Risk | Validation |
|---|---|---|---|---|
| Remove Summary Tab | `student_profile_tabs.dart` | Codebase is smaller, no dead paths | Low | `flutter analyze` |

### Phase M-9 — Final Validation
| Task | Files Likely Affected | Expected Change | Risk | Validation |
|---|---|---|---|---|
| Full System Test | All modified | System compiles and runs error-free | Medium | `tsc`, App build |
