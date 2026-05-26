# Done History

## Finance RBAC
- FIN-RBAC-1: finance roles enum/type added.
- FIN-RBAC-2A: accountant backend permissions.
- FIN-RBAC-2B: runtime access fix.
- FIN-RBAC-3: accountant frontend access.
- FIN-RBAC-4: accountant E2E access verified.
- FIN-RBAC-5: accountant regression tests.
- FIN-RBAC-6: accountant users page.

## Finance/DB Fixes
- Expense/Asset center-scope BOLA fixed.
- RBAC path pollution fixed.
- Billing cancellation with payments blocked.
- ExpensePayment cascade restricted.
- Invoice uniqueness scoped by invoiceType.
- DB-CLEAN-AUTO-1 first cleanup constraints/relations.

## Mobile
- Unsupported mobile roles routed safely.
- AppSnackBar created.
- Exams/Supervisor visit SnackBars migrated.

## Important Decisions
- `rafiq_v2_clean_dev` is canonical development DB.
- `rafiq_v2` is not used for current development checks.
- Finance/admin roles are web-only in Flutter.
- StudentCircleEnrollment active-only uniqueness was reverted and deferred.
