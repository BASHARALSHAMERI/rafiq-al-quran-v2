# Rafiq Mobile Reference Migration - Phase 1 Audit

Date: 2026-03-23
Status: Authoritative Phase 1 baseline for `rafiq_mobile`

## Goal

Build `rafiq_mobile` as the production app.

Use `quran-companions-app-main` only as a UX/UI and flow reference. Do not port its mock-data patterns, in-memory auth, or prototype shortcuts.

## Operating Rules

1. `rafiq_mobile` is the canonical product codebase.
2. `quran-companions-app-main` is a reference for layouts, hierarchy, wording, and interaction patterns only.
3. No migrated screen may ship with mock, static, or simulated data.
4. Each feature must have one canonical Flutter screen. Legacy duplicates should be retired after replacement.
5. Backend role/API mismatches must be resolved before or during UI migration, not hidden behind placeholders.
6. Existing working production paths stay in place until a better real-data replacement is ready.

## Status Legend

- `Live`: reads real backend data today and is already a valid product path.
- `Mixed`: routed and usable, but still contains demo-derived, inferred, or placeholder pieces.
- `Mock`: mostly static local data or fake flow.
- `Missing`: reference exists, but no production-grade Flutter implementation exists yet.

## Backend Fit-Gap Summary

| Area | Current state | Impact on migration | Required action |
| --- | --- | --- | --- |
| Dashboard | `backend/src/modules/dashboard/dashboard.routes.ts` allows only `SUPER_ADMIN`, `CENTER_ADMIN`, `SUPERVISOR`, `TEACHER` | `Student` and `Parent` homes cannot depend on dashboard endpoints safely | Add student/parent-safe dashboard endpoints or build dedicated aggregates for those roles |
| Notifications | `backend/src/modules/notifications/notifications.routes.ts` excludes `STUDENT` | Student home and student notifications cannot be treated as production-ready | Extend notification access for `STUDENT` or add a student-specific notification surface |
| Org centers | `backend/src/modules/org/org.routes.ts` excludes `TEACHER` from `/org/centers` | Flutter context bootstrap uses endpoint probing and fallback behavior | Normalize teacher center access in backend |
| Attendance | `backend/src/modules/attendance/attendance.routes.ts` is staff-only | Parent/student attendance views must not call teacher attendance endpoints directly | Use report/student-facing endpoints for read-only attendance history |
| Exams | `backend/src/modules/exams/exams.routes.ts` is staff-only | Student exam result screens cannot reuse staff exam dashboard routes | Add student result endpoint or use `/reports/student/:id` as the canonical student result source |
| Context bootstrap | `rafiq_mobile/lib/data/datasources/context_remote_datasource.dart` probes multiple endpoint families | Signals backend inconsistency by role and increases fragility | Replace probing with one normalized contract per role |
| Reports layer in mobile | No dedicated reports datasource/repository/controller exists in `rafiq_mobile` yet | Teacher/supervisor/parent report pages remain mock-heavy | Build a real reports data layer before migrating report screens |

## Canonical Screen Ownership

### Teacher

- `TeacherHome.tsx` -> keep [`rafiq_mobile/lib/presentation/teacher/pages/teacher_home_page.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/teacher/pages/teacher_home_page.dart) as canonical.
- `AttendancePage.tsx` -> keep the current production flow split between [`rafiq_mobile/lib/presentation/attendance/attendance_date_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/attendance/attendance_date_screen.dart) and [`rafiq_mobile/lib/presentation/attendance/attendance_mark_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/attendance/attendance_mark_screen.dart) until a unified real-data page replaces it.
- `HalqaPage.tsx` and `HalqaFollowUpPage.tsx` -> keep [`rafiq_mobile/lib/presentation/students/students_list_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/students/students_list_screen.dart) as the canonical list surface for both list and follow-up mode.
- `StudentFollowUpPage.tsx` and `StudentProfile.tsx` -> keep [`rafiq_mobile/lib/presentation/follow_up/student_profile_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/follow_up/student_profile_screen.dart) as canonical.
- Retire these legacy teacher mock pages after migration:
  - [`rafiq_mobile/lib/presentation/teacher/pages/student_follow_up_page.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/teacher/pages/student_follow_up_page.dart)
  - [`rafiq_mobile/lib/presentation/teacher/pages/student_monthly_report_page.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/teacher/pages/student_monthly_report_page.dart)
  - [`rafiq_mobile/lib/presentation/teacher/pages/teacher_halqa_report_page.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/teacher/pages/teacher_halqa_report_page.dart)

### Supervisor

- Current home remains [`rafiq_mobile/lib/presentation/context/role_home_views.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/context/role_home_views.dart) temporarily, but it should be replaced by a dedicated supervisor home page during migration.
- Keep [`rafiq_mobile/lib/presentation/supervisor/supervisor_circles_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/supervisor_circles_screen.dart) as the canonical circles list.
- Keep [`rafiq_mobile/lib/presentation/supervisor/supervisor_approvals_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/supervisor_approvals_screen.dart) as a product-only screen that stays in the app even though it does not exist in the reference.

### Student

- Current home is still the legacy shared dashboard in [`rafiq_mobile/lib/presentation/context/role_home_views.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/context/role_home_views.dart); it is not a safe final target because its data assumptions depend on backend routes that do not support `STUDENT`.
- Existing student detail/result features should be rebuilt on top of a dedicated student-facing data contract rather than staff-only screens.

### Parent

- Current home is still the legacy shared dashboard in [`rafiq_mobile/lib/presentation/context/role_home_views.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/context/role_home_views.dart); it should be replaced after parent aggregates are defined.
- Parent read-only child surfaces must use reporting/student history endpoints, not teacher operational endpoints.

## Migration Matrix

### Teacher

| Reference | Flutter target | Status | Decision |
| --- | --- | --- | --- |
| `TeacherHome.tsx` | [`rafiq_mobile/lib/presentation/teacher/pages/teacher_home_page.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/teacher/pages/teacher_home_page.dart) | Live | Keep and polish using shared foundation |
| `AttendancePage.tsx` | [`rafiq_mobile/lib/presentation/attendance/attendance_date_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/attendance/attendance_date_screen.dart) + [`rafiq_mobile/lib/presentation/attendance/attendance_mark_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/attendance/attendance_mark_screen.dart) | Live | Keep current real-data flow, unify shell later |
| `HalqaPage.tsx` | [`rafiq_mobile/lib/presentation/students/students_list_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/students/students_list_screen.dart) | Mixed | Keep canonical, replace demo follow-up status cycle with real aggregation |
| `HalqaFollowUpPage.tsx` | [`rafiq_mobile/lib/presentation/students/students_list_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/students/students_list_screen.dart) | Mixed | Keep canonical and retire unused legacy follow-up list |
| `StudentFollowUpPage.tsx` | [`rafiq_mobile/lib/presentation/follow_up/student_profile_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/follow_up/student_profile_screen.dart) | Live | Keep canonical |
| `StudentProfile.tsx` | [`rafiq_mobile/lib/presentation/follow_up/student_profile_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/follow_up/student_profile_screen.dart) | Live | Keep canonical |
| `MemorizationPage.tsx` | [`rafiq_mobile/lib/presentation/follow_up/memorization_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/follow_up/memorization_screen.dart) | Mock | Rebuild with real student list and follow-up submission |
| `MonthlyPlanPage.tsx` | [`rafiq_mobile/lib/presentation/follow_up/monthly_plan_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/follow_up/monthly_plan_screen.dart) | Mock | Rebuild against real planning/report data |
| `GroupAchievementPage.tsx` | [`rafiq_mobile/lib/presentation/follow_up/group_achievement_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/follow_up/group_achievement_screen.dart) | Mock | Rebuild with real activity capture |
| `RecordsPage.tsx` | [`rafiq_mobile/lib/presentation/follow_up/records_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/follow_up/records_screen.dart) | Mock | Rebuild on follow-up history |
| `TeacherHalqaReportPage.tsx` | [`rafiq_mobile/lib/presentation/teacher/teacher_halqa_report_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/teacher/teacher_halqa_report_screen.dart) | Mock | Rebuild after reports data layer is added |
| `StudentMonthlyReportPage.tsx` | [`rafiq_mobile/lib/presentation/teacher/student_monthly_report_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/teacher/student_monthly_report_screen.dart) | Mock | Rebuild on `/reports/student/:id` |

### Supervisor

| Reference | Flutter target | Status | Decision |
| --- | --- | --- | --- |
| `SupervisorHome.tsx` | [`rafiq_mobile/lib/presentation/context/role_home_views.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/context/role_home_views.dart) | Mixed | Replace with dedicated supervisor home page |
| `HalaqatListPage.tsx` | [`rafiq_mobile/lib/presentation/supervisor/supervisor_circles_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/supervisor_circles_screen.dart) | Live | Keep canonical and polish |
| `HalqaVisitPage.tsx` | [`rafiq_mobile/lib/presentation/supervisor/halqa_visit_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/halqa_visit_screen.dart) | Mock | Rebuild |
| `TeacherEvaluationPage.tsx` | [`rafiq_mobile/lib/presentation/supervisor/teacher_evaluation_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/teacher_evaluation_screen.dart) | Mock | Rebuild |
| `SupervisorNotesPage.tsx` | [`rafiq_mobile/lib/presentation/supervisor/supervisor_notes_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/supervisor_notes_screen.dart) | Mock | Rebuild |
| `SupervisorReportsPage.tsx` | [`rafiq_mobile/lib/presentation/supervisor/supervisor_reports_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/supervisor_reports_screen.dart) | Mock | Rebuild after reports data layer is added |
| `HalqaMonthlyReportPage.tsx` | [`rafiq_mobile/lib/presentation/supervisor/halqa_monthly_report_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/halqa_monthly_report_screen.dart) | Mock | Rebuild after reports data layer is added |
| Product-only | [`rafiq_mobile/lib/presentation/supervisor/supervisor_approvals_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/supervisor/supervisor_approvals_screen.dart) | Live | Keep and design-align |

### Student

| Reference | Flutter target | Status | Decision |
| --- | --- | --- | --- |
| `StudentHome.tsx` | [`rafiq_mobile/lib/presentation/context/role_home_views.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/context/role_home_views.dart) | Mixed | Rebuild on student-safe backend aggregates |
| `AssignmentsPage.tsx` | [`rafiq_mobile/lib/presentation/student/assignments_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/student/assignments_screen.dart) | Mock | Rebuild on real assignments source |
| `ProgressPage.tsx` | [`rafiq_mobile/lib/presentation/student/progress_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/student/progress_screen.dart) | Mock | Rebuild on student report/progress aggregates |
| `MemorizationLogPage.tsx` | [`rafiq_mobile/lib/presentation/student/memorization_log_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/student/memorization_log_screen.dart) | Mock | Rebuild on real history |
| `ExamsPage.tsx` | [`rafiq_mobile/lib/presentation/exams/exams_list_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/exams/exams_list_screen.dart) | Live for staff, not student-safe | Build a dedicated student exam result screen |
| `StudentProfilePage.tsx` | Missing student-facing page | Missing | Build on student profile/report contract |

### Parent

| Reference | Flutter target | Status | Decision |
| --- | --- | --- | --- |
| `ParentHome.tsx` | [`rafiq_mobile/lib/presentation/context/role_home_views.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/context/role_home_views.dart) | Mixed | Rebuild on parent-safe aggregates |
| `ChildrenListPage.tsx` | [`rafiq_mobile/lib/presentation/parent/children_list_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/parent/children_list_screen.dart) | Mock | Rebuild on real children list |
| `ChildDetailPage.tsx` | [`rafiq_mobile/lib/presentation/parent/child_detail_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/parent/child_detail_screen.dart) | Mock | Rebuild on report/student detail aggregates |
| `ChildAttendancePage.tsx` | [`rafiq_mobile/lib/presentation/parent/child_attendance_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/parent/child_attendance_screen.dart) | Mock | Rebuild on read-only attendance history |
| `ChildResultsPage.tsx` | [`rafiq_mobile/lib/presentation/parent/child_results_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/parent/child_results_screen.dart) | Mock | Rebuild on report/exam result aggregates |
| `ParentReportsPage.tsx` | [`rafiq_mobile/lib/presentation/parent/parent_reports_screen.dart`](/c:/dev/rafiq-al-quran-v2/rafiq_mobile/lib/presentation/parent/parent_reports_screen.dart) | Mock | Rebuild after reports data layer is added |

## Immediate Migration Order

### Batch 0 - Completed in this phase

- Freeze the canonical ownership map.
- Freeze the backend fit-gap list.
- Identify every mock-heavy surface that must not be carried forward.

### Batch 1 - Shared Foundation

- Polish shared visual primitives already used by the modern teacher home:
  - `dashboard_stat_card.dart`
  - `quick_action_card.dart`
  - `section_header.dart`
- Do not start with a large page rewrite before the shared pieces are stable.

### Batch 2 - Teacher First

1. Keep `TeacherHomePage` as the anchor.
2. Replace teacher mock operational screens in this order:
   - `memorization_screen.dart`
   - `monthly_plan_screen.dart`
   - `group_achievement_screen.dart`
   - `records_screen.dart`
3. Add a real reports data layer.
4. Replace:
   - `teacher_halqa_report_screen.dart`
   - `student_monthly_report_screen.dart`
5. Remove legacy mock teacher pages once routing no longer depends on them.

### Batch 3 - Supervisor

- Replace supervisor mock forms and reports after the reports layer exists.
- Keep `SupervisorCirclesScreen` and `SupervisorApprovalsScreen` intact as real anchors.

### Batch 4 - Student and Parent

- Do not migrate these fully until backend support for student/parent dashboard and notifications is normalized.
- Build them on student/parent-safe aggregates instead of staff operational APIs.

## Notes

- The older root-level planning files were useful as exploratory notes, but this file supersedes them as the execution baseline.
- The first real implementation target after this audit is the shared foundation used by `TeacherHomePage`, because it improves the visible product immediately without locking us into mock flows.
