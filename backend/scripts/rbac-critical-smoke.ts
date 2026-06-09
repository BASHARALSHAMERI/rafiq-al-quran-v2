import { spawn } from "node:child_process";
import assert from "node:assert/strict";

type HttpResult = {
  status: number;
  body: any;
  headers: Record<string, string>;
};

type CheckResult = {
  name: string;
  ok: boolean;
  status?: number;
  detail?: unknown;
};

const SMOKE_PORT = Number(process.env.SMOKE_PORT ?? "4120");
const BASE_URL = process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${SMOKE_PORT}`;
const DEFAULT_PASSWORD = "Rafiq@1234";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

const daysAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return isoDay(date);
};

const request = async (path: string, init?: RequestInit): Promise<HttpResult> => {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const text = await response.text();
  let body: any = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  return {
    status: response.status,
    body,
    headers: Object.fromEntries(response.headers.entries()),
  };
};

const authRequest = (token: string, path: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  return request(path, { ...init, headers });
};

const jsonRequest = (
  path: string,
  method: string,
  payload: unknown,
  headersInit?: Record<string, string>
) => {
  const headers = new Headers(headersInit ?? {});
  headers.set("Content-Type", "application/json");
  return request(path, {
    method,
    headers,
    body: JSON.stringify(payload),
  });
};

const jsonAuthRequest = (
  token: string,
  path: string,
  method: string,
  payload: unknown,
  headersInit?: Record<string, string>
) => {
  const headers = new Headers(headersInit ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  return request(path, {
    method,
    headers,
    body: JSON.stringify(payload),
  });
};

const waitForServer = async () => {
  for (let i = 0; i < 200; i += 1) {
    try {
      const health = await request("/system/health");
      if (health.status === 200) {
        return;
      }
    } catch {
      // ignore retries during startup
    }
    await sleep(350);
  }

  throw new Error("Server failed to start in expected time");
};

const login = async (email: string, platform: "web" | "mobile") => {
  const result = await jsonRequest(
    "/auth/login",
    "POST",
    { email, password: DEFAULT_PASSWORD },
    { "x-platform": platform }
  );

  assert.equal(result.status, 200, `Login failed for ${email}`);
  return {
    token: result.body.data.accessToken as string,
    refreshToken: result.body.data.refreshToken as string,
    userId: result.body.data.user.id as number,
  };
};

const checkStatus = (
  checks: CheckResult[],
  name: string,
  actual: number,
  expected: number,
  detail?: unknown
) => {
  const ok = actual === expected;
  checks.push({ name, ok, status: actual, detail: ok ? undefined : detail ?? { expected } });
  assert.equal(actual, expected, `${name}: expected ${expected}, got ${actual}`);
};

const checkBool = (checks: CheckResult[], name: string, condition: boolean, detail?: unknown) => {
  checks.push({ name, ok: condition, detail: condition ? undefined : detail });
  assert.ok(condition, name);
};

const main = async () => {
  const server = spawn("node", ["dist/app/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(SMOKE_PORT),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverLogs = "";
  let superTokenForCleanup: string | null = null;
  let seededTeacherId: number | null = null;
  let seededTeacherWasDeactivated = false;
  server.stdout.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });

  const checks: CheckResult[] = [];

  try {
    await waitForServer();
    checks.push({ name: "server_ready", ok: true, status: 200 });

    const superAuth = await login("superadmin@rafiq.local", "web");
    superTokenForCleanup = superAuth.token;
    const centerAdminAuth = await login("center.admin@rafiq.local", "web");
    const supervisorAuth = await login("supervisor@rafiq.local", "mobile");
    const teacherAuth = await login("teacher.noor@rafiq.local", "mobile");
    seededTeacherId = teacherAuth.userId;

    const users = await authRequest(superAuth.token, "/users");
    checkStatus(checks, "super_list_users_200", users.status, 200);
    const userRows = users.body.data as Array<{ id: number; email: string }>;
    const seededSupervisor = userRows.find((item) => item.email === "supervisor@rafiq.local");
    const seededTeacher = userRows.find((item) => item.email === "teacher.noor@rafiq.local");
    checkBool(checks, "seed_supervisor_found", Boolean(seededSupervisor));
    checkBool(checks, "seed_teacher_found", Boolean(seededTeacher));

    const teacherCircles = await authRequest(teacherAuth.token, "/org/circles");
    checkStatus(checks, "teacher_circles_200", teacherCircles.status, 200);
    const teacherCircleRows = teacherCircles.body.data as Array<{ id: number; centerId: number }>;
    checkBool(checks, "teacher_has_visible_circle_scope", teacherCircleRows.length > 0);
    const centerId = teacherCircleRows[0].centerId;
    const tempTeacherId = teacherAuth.userId;

    const attendanceDate = "2001-01-11";
    const duplicateExcuseDate = "2001-01-12";
    const approvalExcuseDate = "2001-01-13";

    const seedAttendance = await jsonAuthRequest(superAuth.token, "/staff-operations", "POST", {
      date: attendanceDate,
      records: [
        { userId: tempTeacherId, centerId, status: "PRESENT" },
        { userId: seededSupervisor!.id, centerId, status: "PRESENT" },
      ],
    });
    checkStatus(checks, "seed_attendance_200", seedAttendance.status, 200);

    const teacherVisits = await authRequest(
      teacherAuth.token,
      "/staff-operations/visits?page=1&limit=20"
    );
    checkStatus(checks, "teacher_visits_forbidden_403", teacherVisits.status, 403);

    const teacherAttendance = await authRequest(
      teacherAuth.token,
      `/staff-operations?date=${attendanceDate}&page=1&limit=20`
    );
    checkStatus(checks, "teacher_attendance_list_200", teacherAttendance.status, 200);
    const attendanceRecords = (teacherAttendance.body.data.records ?? []) as Array<{ userId: number }>;
    checkBool(checks, "teacher_attendance_only_self", attendanceRecords.length === 1, {
      count: attendanceRecords.length,
    });
    checkBool(
      checks,
      "teacher_attendance_rows_match_self",
      attendanceRecords.every((record) => record.userId === tempTeacherId),
      { rows: attendanceRecords }
    );

    const teacherMarksOther = await jsonAuthRequest(teacherAuth.token, "/staff-operations", "POST", {
      date: attendanceDate,
      records: [{ userId: seededSupervisor!.id, centerId, status: "PRESENT" }],
    });
    checkStatus(checks, "teacher_mark_other_attendance_403", teacherMarksOther.status, 403);

    const firstDuplicateExcuse = await jsonAuthRequest(
      teacherAuth.token,
      "/staff-operations/excuses",
      "POST",
      {
        centerId,
        date: duplicateExcuseDate,
        reason: "Duplicate excuse smoke request",
      }
    );
    checkStatus(checks, "teacher_create_excuse_201", firstDuplicateExcuse.status, 201);

    const duplicateExcuse = await jsonAuthRequest(
      teacherAuth.token,
      "/staff-operations/excuses",
      "POST",
      {
        centerId,
        date: duplicateExcuseDate,
        reason: "Duplicate excuse smoke request retry",
      }
    );
    checkStatus(checks, "teacher_duplicate_excuse_409", duplicateExcuse.status, 409);

    const approvalExcuse = await jsonAuthRequest(
      teacherAuth.token,
      "/staff-operations/excuses",
      "POST",
      {
        centerId,
        date: approvalExcuseDate,
        reason: "Approval workflow smoke request",
      }
    );
    checkStatus(checks, "teacher_create_approval_excuse_201", approvalExcuse.status, 201);
    const approvalExcuseId = approvalExcuse.body.data.id as number;

    const supervisorApproveExcuse = await jsonAuthRequest(
      supervisorAuth.token,
      `/staff-operations/excuses/${approvalExcuseId}/status`,
      "PATCH",
      {
        status: "APPROVED",
        note: "Supervisor should be blocked",
      }
    );
    checkStatus(checks, "supervisor_approve_excuse_403", supervisorApproveExcuse.status, 403);

    const superApproveExcuse = await jsonAuthRequest(
      superAuth.token,
      `/staff-operations/excuses/${approvalExcuseId}/status`,
      "PATCH",
      {
        status: "APPROVED",
        note: "Approve smoke excuse",
      }
    );
    checkStatus(checks, "super_approve_excuse_200", superApproveExcuse.status, 200);

    const superReopenExcuse = await jsonAuthRequest(
      superAuth.token,
      `/staff-operations/excuses/${approvalExcuseId}/status`,
      "PATCH",
      {
        status: "PENDING",
        note: "Should be rejected",
      }
    );
    checkStatus(checks, "approved_excuse_cannot_return_pending_400", superReopenExcuse.status, 400);

    const centerAdminApproveVoucher = await jsonAuthRequest(
      centerAdminAuth.token,
      "/finance/v2/vouchers/1/approve",
      "POST",
      {
        comment: "Center admin should be blocked",
      }
    );
    checkStatus(checks, "center_admin_approve_voucher_403", centerAdminApproveVoucher.status, 403);

    const checkUser = await jsonRequest("/auth/check-user", "POST", {
      identifier: "teacher.noor@rafiq.local",
    });
    checkStatus(checks, "check_user_200", checkUser.status, 200);
    checkBool(
      checks,
      "check_user_does_not_expose_role",
      !Object.prototype.hasOwnProperty.call(checkUser.body?.data ?? {}, "role"),
      checkUser.body?.data
    );

    const deactivateTeacher = await jsonAuthRequest(
      superAuth.token,
      `/users/${tempTeacherId}/status`,
      "PATCH",
      { isActive: false }
    );
    checkStatus(checks, "super_deactivate_temp_teacher_200", deactivateTeacher.status, 200);
    seededTeacherWasDeactivated = true;

    const inactiveScopedRequest = await authRequest(
      teacherAuth.token,
      `/staff-operations?date=${attendanceDate}&page=1&limit=1`
    );
    checkStatus(checks, "inactive_user_scope_rejected_403", inactiveScopedRequest.status, 403);

    const refreshAfterDeactivate = await jsonRequest(
      "/auth/refresh",
      "POST",
      { refreshToken: teacherAuth.refreshToken },
      {
        "x-platform": "mobile",
        "x-requested-with": "XMLHttpRequest",
      }
    );
    checkStatus(checks, "deactivated_user_refresh_401", refreshAfterDeactivate.status, 401);

    const passed = checks.filter((item) => item.ok).length;
    console.log(
      JSON.stringify(
        {
          ok: true,
          script: "rbac-critical-smoke",
          totalChecks: checks.length,
          passedChecks: passed,
          failedChecks: checks.length - passed,
          checks,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          script: "rbac-critical-smoke",
          error: error instanceof Error ? error.message : String(error),
          checks,
          serverLogsTail: serverLogs.slice(-4000),
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } finally {
    if (seededTeacherWasDeactivated && seededTeacherId && superTokenForCleanup) {
      try {
        await jsonAuthRequest(
          superTokenForCleanup,
          `/users/${seededTeacherId}/status`,
          "PATCH",
          { isActive: true }
        );
      } catch {
        // Ignore cleanup failures; the smoke result already captures the primary failure.
      }
    }
    server.kill("SIGTERM");
    await sleep(700);
  }
};

void main();
