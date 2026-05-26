# Database Hardening and Cleanup Roadmap

## Completed / In Progress
- ACCOUNTANT role migrations.
- ExpensePayment cascade restricted.
- Invoice uniqueness scoped by invoiceType.
- FinanceSettings relations added.
- JournalEntry fiscalPeriodId scaffold added as nullable.
- MonthlyPlan approvedById added.
- CHECK constraints added for safe numeric/date invariants.
- Deprecated fields annotated, not removed.

## Remaining DB Tasks

### DB-CLEAN-1B — Payment Backfill + NOT NULL
Goal:
Make `Payment.centerId` and `Payment.organizationId` required.

Current issue:
At least one dirty row had NULL values.

Required:
- SELECT-only precheck.
- Determine backfill source from Invoice/Center/Organization.
- Backfill safely.
- Add NOT NULL migration.
- Verify payment workflows.

### DB-CLEAN-1C — JournalEntry fiscalPeriodId Integration
Goal:
Make fiscal period linkage real.

Required:
- Backfill existing JournalEntry fiscalPeriodId from entryDate.
- Update posting services to store fiscalPeriodId.
- Add closed-period guard.
- Later make fiscalPeriodId required.

### DB-HARDEN-PROFILES-1 — Duplicate Active Profiles
Models:
- StudentFeeProfile
- FinancePolicyProfile
- PayrollProfile
- RewardProfile

Required:
- Duplicate active prechecks.
- Partial unique indexes if safe.
- Do not touch StudentCircleEnrollment here.

### DB-HARDEN-CASCADE-1 — Dangerous Cascade Review
Goal:
Review onDelete Cascade in historical/financial/audit tables.

Classify:
- Keep Cascade
- Restrict
- SetNull

No destructive changes without proof.

### DB-CLEAN-4 — Deprecated Schema Removal
Only after:
- backup
- no references
- data migration
- production approval

Potential future removals:
- FollowUpRecord legacy fields
- Donation.isPledge
- MatnProgressStatus
- FinanceMovementType.LEGACY_BACKFILL
- StudentTuitionAssignment if proven obsolete

## Canonical DB Rule
All DB tasks must use `rafiq_v2_clean_dev`.
