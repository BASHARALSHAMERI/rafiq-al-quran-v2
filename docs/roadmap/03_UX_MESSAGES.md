# UX Messages and Notifications Roadmap

## Completed
- UX-MOBILE-MESSAGES-1:
  - Created AppSnackBar.
  - Removed raw exception exposure in initial files.
- UX-MOBILE-MESSAGES-2:
  - Migrated Exams + Supervisor Visits.
  - Removed `$e` and `error.toString()` from user messages.

## Remaining Mobile Tasks

### UX-MOBILE-MESSAGES-3 — Teacher Module
Files:
- teacher_preparation_screen.dart
- teacher_monthly_plan_details_screen.dart
- monthly_plan_screen.dart
- group_achievement_screen.dart
- student_follow_up_tab.dart

Goal:
Migrate remaining Teacher raw SnackBars to AppSnackBar.

### UX-MOBILE-MESSAGES-4 — Remote Recitation
Goal:
Migrate Remote Recitation SnackBars.

### UX-MOBILE-MESSAGES-5 — Remaining Small Modules
Scope:
- Library
- Attendance
- Auth
- Context
- Any remaining raw SnackBars

## Remaining Web Tasks

### UX-WEB-MESSAGES-1 — InlineAlert / Callout
Create a shared web component:
- info
- success
- warning
- error

Design:
- RTL-first
- border accent
- soft background
- light/dark support
- tokens only, no hardcoded colors

### UX-WEB-MESSAGES-2 — Toast Standardization
Add:
- warning/info variants
- RTL-aware position
- optional progress bar
- close behavior

### BACKEND-ERRORS-1 — Backend Error Contract
Goal:
- Arabic user-friendly error messages.
- Stable codes.
- Hide technical details.
- Structured requestId handling.

## Message Rules
- Never show `$e`.
- Never show raw `error.toString()`.
- Messages must be short, Arabic, and actionable.
- Keep technical details in logs only.
