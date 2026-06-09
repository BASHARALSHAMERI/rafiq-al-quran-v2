import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Role } from "@prisma/client";
import type { Request, Response } from "express";
import { requireRoles } from "../src/shared/middleware/rbac.middleware";

type Check = {
  name: string;
  ok: boolean;
  detail?: unknown;
};

type MiddlewareResult = {
  allowed: boolean;
  statusCode?: number;
  allowedRoles?: string[];
};

const checks: Check[] = [];

const record = (name: string, assertion: () => void) => {
  try {
    assertion();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

const runRequireRoles = (input: {
  configuredRoles: Role[];
  currentRole: Role;
  method: string;
  requestPath: string;
}): MiddlewareResult => {
  const handler = requireRoles(input.configuredRoles);
  let result: MiddlewareResult = { allowed: false };

  const req = {
    auth: {
      userId: 1,
      role: input.currentRole,
      organizationId: 1
    },
    method: input.method,
    path: input.requestPath
  } as unknown as Request;

  handler(req, {} as Response, (error?: unknown) => {
    if (!error) {
      result = { allowed: true };
      return;
    }

    const details =
      typeof error === "object" && error !== null && "details" in error
        ? (error as { details?: { allowedRoles?: string[] } }).details
        : undefined;

    result = {
      allowed: false,
      statusCode:
        typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : undefined,
      allowedRoles: details?.allowedRoles
    };
  });

  return result;
};

const assertAllowed = (result: MiddlewareResult) => {
  assert.equal(result.allowed, true, JSON.stringify(result));
};

const assertForbidden = (result: MiddlewareResult) => {
  assert.equal(result.allowed, false, JSON.stringify(result));
  assert.equal(result.statusCode, 403, JSON.stringify(result));
};

record("safe_monthly_plan_route_still_allows_teacher_fallback", () => {
  assertAllowed(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN],
      currentRole: Role.TEACHER,
      method: "GET",
      requestPath: "/monthly-plans/123"
    })
  );
});

record("fake_monthly_plan_subroute_does_not_inherit_teacher_fallback", () => {
  assertForbidden(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN],
      currentRole: Role.TEACHER,
      method: "GET",
      requestPath: "/monthly-plans/admin/export"
    })
  );
});

record("safe_notifications_route_still_allows_student_fallback", () => {
  assertAllowed(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN],
      currentRole: Role.STUDENT,
      method: "GET",
      requestPath: "/notifications/unread-count"
    })
  );
});

record("fake_notifications_subroute_does_not_inherit_student_fallback", () => {
  assertForbidden(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN],
      currentRole: Role.STUDENT,
      method: "GET",
      requestPath: "/notifications/admin/export"
    })
  );
});

record("attendance_teacher_behavior_remains_allowed", () => {
  assertAllowed(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER],
      currentRole: Role.TEACHER,
      method: "GET",
      requestPath: "/attendance"
    })
  );
});

record("attendance_student_behavior_remains_denied", () => {
  assertForbidden(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER],
      currentRole: Role.STUDENT,
      method: "GET",
      requestPath: "/attendance"
    })
  );
});

record("finance_route_does_not_gain_teacher_fallback", () => {
  assertForbidden(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN],
      currentRole: Role.TEACHER,
      method: "POST",
      requestPath: "/finance/v2/vouchers/1/approve"
    })
  );
});

record("accounting_route_does_not_gain_teacher_fallback", () => {
  assertForbidden(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN],
      currentRole: Role.TEACHER,
      method: "POST",
      requestPath: "/accounting/accounts"
    })
  );
});

record("reports_route_does_not_gain_teacher_fallback", () => {
  assertForbidden(
    runRequireRoles({
      configuredRoles: [Role.SUPER_ADMIN],
      currentRole: Role.TEACHER,
      method: "GET",
      requestPath: "/reports/admin/export"
    })
  );
});

record("rbac_middleware_no_longer_uses_path_startswith_fallbacks", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/shared/middleware/rbac.middleware.ts"),
    "utf8"
  );
  assert.equal(source.includes("path.startsWith("), false);
});

const failed = checks.filter((check) => !check.ok);

console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      script: "rbac-path-pollution-regression",
      totalChecks: checks.length,
      passedChecks: checks.length - failed.length,
      failedChecks: failed.length,
      checks
    },
    null,
    2
  )
);

if (failed.length > 0) {
  process.exitCode = 1;
}
