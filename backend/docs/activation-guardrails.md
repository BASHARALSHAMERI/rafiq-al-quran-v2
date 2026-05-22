# Activation Guardrails (Pre-Milestone 1)

This document is the mandatory contract for the phase:
**Role-Based E2E Activation**.

No new endpoints are implemented before this contract is in place.

## 1) Scoping Contract (Final)

- `SUPER_ADMIN`: organization-wide scope.
- `CENTER_ADMIN`: center-wide scope for assigned centers and their circles.
- `SUPERVISOR` / `TEACHER`: assigned circles scope (plus derived centers).
- `PARENT`: linked students scope only.
- `STUDENT`: own identity + own active enrollments.

### Resource-level scope rules for this phase

- `centers` / `circles`
  - `SUPER_ADMIN`: full management.
  - `CENTER_ADMIN`: manage circles inside owned centers, no cross-center actions.
  - Other roles: read-only (if allowed) or forbidden.
- `users`
  - `SUPER_ADMIN`: org-wide management.
  - `CENTER_ADMIN`: manage users only inside owned centers/circles.
  - Other roles: no management.

## 2) 403 vs 404 Rule

- Return `403` when role/operation itself is forbidden.
- Return `403` when explicit scope filters are outside caller scope (for example a foreign `centerId` query filter).
- Return `404` (masked) on `:id` resources when not found or out of scope.
- Return `409` on unique conflicts.
- Return `400` on validation/domain input errors.

## 3) Response Contract for New Write Operations

### Success

- Create: `201`
- Update/status changes: `200`

Body:

```json
{
  "ok": true,
  "data": {}
}
```

### Error

Body (kept aligned with current global error middleware):

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "requestId": "uuid",
    "details": {}
  },
  "message": "Human readable message",
  "details": {}
}
```

`X-Request-Id` header must be present on the response.

## 4) Safety Policies (Mandatory)

- Role change policy: role is immutable after creation in this phase.
- Self-disable policy: a user cannot disable their own account.
- Last super-admin policy: disabling the last active `SUPER_ADMIN` is forbidden.
- Link update policy: all user-link edits run inside a single DB transaction.
- Unlink policy for this phase: unlink is `delete + audit` (no soft lifecycle columns added).

## 5) Central Active-Read Policy

- Reads on `users`, `centers`, and `circles` must exclude `isActive=false` by default.
- Central helper is mandatory and is implemented in:
  - `backend/src/shared/policies/active-read.policy.ts`
- Explicit inclusion of inactive rows is only allowed when documented and justified.

## 6) Unique Constraints Verification (DB-level)

The following constraints are required and must exist in DB (not app-only checks):

- `users.email` unique
- `centers (organizationId, code)` unique
- `circles (centerId, name)` unique

Verification command result during guardrails phase:

```json
{
  "ok": true,
  "database": "rafiq_v2_fresh",
  "results": [
    {
      "table": "users",
      "expectedConstraint": "users_email_key",
      "expectedColumns": "email",
      "found": true
    },
    {
      "table": "centers",
      "expectedConstraint": "centers_organizationId_code_key",
      "expectedColumns": "organizationId,code",
      "found": true
    },
    {
      "table": "circles",
      "expectedConstraint": "circles_centerId_name_key",
      "expectedColumns": "centerId,name",
      "found": true
    }
  ]
}
```

Decision: no migration is needed for these three unique constraints.

## 7) OpenAPI Alignment Rule

- Only endpoints introduced in upcoming milestones are added/updated.
- Existing endpoints keep their behavior and response semantics.
