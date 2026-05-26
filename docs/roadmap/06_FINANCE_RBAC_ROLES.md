# Finance RBAC Roles Roadmap

## Current Active Role
ACCOUNTANT is active.

Allowed:
- safe finance/accounting reads
- draft creation where allowed
- finance reports
- no approve/post/pay authority unless explicitly allowed

## Existing But Not Fully Active
- FINANCE_MANAGER
- TREASURER
- AUDITOR

## FIN-RBAC-AUDITOR-1
Goal:
Read-only role.

Allowed:
- view finance
- view accounting
- view reports
- export if approved

Forbidden:
- create
- approve
- post
- void
- pay
- settings

## FIN-RBAC-TREASURER-1
Goal:
Treasury role.

Allowed:
- cash/bank accounts view
- vouchers/payment handling only where safe
- treasury movement visibility

Forbidden:
- accounting chart management
- financial settings
- broad admin privileges

## FIN-RBAC-FM-1
Goal:
Finance manager.

Allowed:
- approval workflows
- finance oversight
- reports
- controlled write permissions

Forbidden:
- system admin privileges
- unsafe unrestricted access

## Activation Rules
- Backend permissions first.
- Frontend route visibility second.
- Tests third.
- No role activated broadly.
