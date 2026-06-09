# Flutter Remaining Tasks

## Current Focus
- Complete AppSnackBar migration.
- Keep finance/admin roles web-only.
- Maintain supported roles:
  - TEACHER
  - SUPERVISOR
  - STUDENT
  - PARENT

## Remaining Areas
- Teacher module SnackBars
- Remote Recitation SnackBars
- Library/Attendance/Auth SnackBars
- PageStateView polish
- AppOfflineBanner token alignment
- Review role navigation after each UX change

## Mobile Rules
- Do not expose raw exceptions.
- Do not change navigation unless task requires it.
- Do not allow ACCOUNTANT/finance/admin roles into mobile shell.
- Always run:
  - flutter analyze
  - flutter test
