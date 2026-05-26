# Master Remaining Tasks

## Current Major Tracks
1. Database hardening and cleanup
2. UX messages and notification standardization
3. Performance hardening
4. Reports and printable outputs
5. Finance RBAC roles
6. Flutter remaining cleanup
7. Web remaining cleanup
8. Final production readiness

## Recommended Order

Use this order:

1. Finish and merge active PRs:
   - `db-clean-auto-1`
   - `ux/mobile-messages-1-snackbar-helper`
   - `ux/mobile-messages-2-module-migration`
   - any current UX-MOBILE-MESSAGES-3 PR

2. UX messages:
   - UX-MOBILE-MESSAGES-3: Teacher module
   - UX-MOBILE-MESSAGES-4: Remote Recitation
   - UX-MOBILE-MESSAGES-5: Library / Attendance / Auth / Context
   - UX-WEB-MESSAGES-1: InlineAlert / Callout
   - UX-WEB-MESSAGES-2: Toast standardization
   - BACKEND-ERRORS-1: Arabic backend error contract

3. Database:
   - DB-CLEAN-1B: Payment NULL backfill + NOT NULL
   - DB-CLEAN-1C: JournalEntry fiscalPeriodId backfill + posting integration
   - DB-HARDEN-PROFILES-1: duplicate active profile constraints
   - DB-HARDEN-CASCADE-1: review dangerous cascade relations
   - DB-CLEAN-4: remove deprecated fields only after backup

4. Performance:
   - PERF-BATCH-1: Compression + pagination + indexes
   - PERF-BATCH-2: N+1 jobs + async email
   - PERF-BATCH-3: background report generation

5. Reports:
   - REPORTS-UX-1: reports page structure
   - REPORTS-PRINT-1: circle printable report
   - REPORTS-DONOR-1: donor impact report
   - REPORTS-FINANCE-1: finance reports readiness
   - REPORTS-EXECUTIVE-1: management dashboard/report package

6. Finance roles:
   - FIN-RBAC-AUDITOR-1
   - FIN-RBAC-TREASURER-1
   - FIN-RBAC-FM-1

## Do Not Do Yet
- Do not delete old schema fields before DB-CLEAN-4.
- Do not activate FINANCE_MANAGER/TREASURER/AUDITOR randomly.
- Do not convert all reports to PDF before print layout is stable.
- Do not run migrations on non-canonical databases.
