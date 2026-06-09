# Performance Hardening Roadmap

## Audit Sources
Performance issues classified under:
1. Network
2. Database
3. Code / CPU-bound tasks

## PERF-BATCH-1 — Safe Quick Wins
Scope:
- Enable compression by default if safe.
- Add pagination to heavy report queries.
- Add safe indexes.

Targets:
- backend/src/config/env.ts
- backend/src/modules/reports/reports.repository.ts
- backend/prisma/schema.prisma

Indexes to review:
- FollowUpRecord.teacherId
- Notification.centerId
- Notification.circleId

Rules:
- Any index requires migration.
- Confirm query usage before adding.

## PERF-BATCH-2 — Jobs and External Latency
Scope:
- Fix N+1 in staff-shift-reminder.job.ts.
- Make password reset email non-blocking or queued.

Targets:
- backend/src/jobs/staff-shift-reminder.job.ts
- backend/src/modules/auth/auth.service.ts

Rules:
- Do not fire-and-forget without logging errors.
- Queue is preferred long-term.

## PERF-BATCH-3 — Heavy Report Generation
Goal:
Move PDF/Excel generation to background job.

Targets:
- backend/src/modules/reports/reports.service.ts

Important:
This is architecture-level. Do not implement casually.

## Performance Rules
- Measure/verify before and after.
- Do not add indexes blindly.
- Avoid huge payloads.
- Paginate heavy report endpoints.
