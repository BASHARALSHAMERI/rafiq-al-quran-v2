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

const BASE_URL = "http://127.0.0.1:4000";
const DEFAULT_PASSWORD = "Rafiq@1234";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    headers: Object.fromEntries(response.headers.entries())
  };
};

const authRequest = (token: string, path: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  return request(path, { ...init, headers });
};

const jsonAuthRequest = (token: string, path: string, method: string, body: unknown) => {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  return request(path, {
    method,
    headers,
    body: JSON.stringify(body)
  });
};

const waitForServer = async () => {
  for (let i = 0; i < 40; i += 1) {
    try {
      const health = await request("/system/health");
      if (health.status === 200) {
        return;
      }
    } catch {
      // ignore during startup
    }
    await sleep(350);
  }

  throw new Error("Server failed to start in expected time");
};

const login = async (email: string) => {
  const result = await request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password: DEFAULT_PASSWORD
    })
  });

  assert.equal(result.status, 200, `Login failed for ${email}`);
  return {
    token: result.body.data.accessToken as string,
    userId: result.body.data.user.id as number
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
    stdio: ["ignore", "pipe", "pipe"]
  });

  let serverLogs = "";
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

    const superAuth = await login("superadmin@rafiq.local");
    const centerAdminAuth = await login("center.admin@rafiq.local");
    const supervisorAuth = await login("supervisor@rafiq.local");
    const teacherAuth = await login("teacher.noor@rafiq.local");
    const parentAuth = await login("parent@rafiq.local");
    const studentAuth = await login("student.ahmed@rafiq.local");

    const superUsers = await authRequest(superAuth.token, "/users");
    checkStatus(checks, "super_list_users_200", superUsers.status, 200);

    const allUsers = superUsers.body.data as Array<{ id: number; email: string; role: string }>;
    const centerAdminUser = allUsers.find((item) => item.email === "center.admin@rafiq.local");
    const centerAdminSouthUser = allUsers.find((item) => item.email === "center.admin.south@rafiq.local");
    const supervisorUser = allUsers.find((item) => item.email === "supervisor@rafiq.local");
    const teacherUser = allUsers.find((item) => item.email === "teacher.noor@rafiq.local");
    const parentUser = allUsers.find((item) => item.email === "parent@rafiq.local");
    const studentUser = allUsers.find((item) => item.email === "student.ahmed@rafiq.local");

    checkBool(checks, "seed_center_admin_found_by_email", Boolean(centerAdminUser));
    checkBool(checks, "seed_center_admin_south_found_by_email", Boolean(centerAdminSouthUser));
    checkBool(checks, "seed_supervisor_found_by_email", Boolean(supervisorUser));
    checkBool(checks, "seed_teacher_found_by_email", Boolean(teacherUser));
    checkBool(checks, "seed_parent_found_by_email", Boolean(parentUser));
    checkBool(checks, "seed_student_found_by_email", Boolean(studentUser));

    const superCenters = await authRequest(superAuth.token, "/org/centers");
    checkStatus(checks, "super_list_centers_200", superCenters.status, 200);

    const centerAdminCenters = await authRequest(centerAdminAuth.token, "/org/centers");
    checkStatus(checks, "center_admin_list_centers_200", centerAdminCenters.status, 200);
    const centerAdminCenterIds = new Set(
      (centerAdminCenters.body.data as Array<{ id: number }>).map((item) => item.id)
    );

    const centerAdminCircles = await authRequest(centerAdminAuth.token, "/org/circles");
    checkStatus(checks, "center_admin_list_circles_200", centerAdminCircles.status, 200);
    const centerAdminCircleIds = new Set(
      (centerAdminCircles.body.data as Array<{ id: number }>).map((item) => item.id)
    );

    const tempSuffix = Date.now().toString();
    const tempSupervisorEmail = `rbac.temp.supervisor.${tempSuffix}@rafiq.local`;
    const createTempSupervisor = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: `RBAC Temp Supervisor ${tempSuffix}`,
      email: tempSupervisorEmail,
      role: "SUPERVISOR",
      password: DEFAULT_PASSWORD
    });
    checkStatus(checks, "super_create_temp_supervisor_201", createTempSupervisor.status, 201);
    const tempSupervisorId = createTempSupervisor.body.data.id as number;

    const createTempCenter = await jsonAuthRequest(superAuth.token, "/org/centers", "POST", {
      nameAr: `RBAC Temp Center ${tempSuffix}`,
      nameEn: `RBAC Temp Center ${tempSuffix}`,
      gender: "MALE",
      locationText: "RBAC Smoke Location",
      centerAdminUserId: centerAdminSouthUser!.id,
      supervisorUserIds: [tempSupervisorId]
    });
    checkStatus(checks, "super_create_temp_center_201", createTempCenter.status, 201);
    const tempCenterId = createTempCenter.body.data.id as number;

    const tempTeacherEmail = `rbac.temp.teacher.${tempSuffix}@rafiq.local`;
    const createTempTeacher = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: `RBAC Temp Teacher ${tempSuffix}`,
      email: tempTeacherEmail,
      role: "TEACHER",
      password: DEFAULT_PASSWORD
    });
    checkStatus(checks, "super_create_temp_teacher_201", createTempTeacher.status, 201);
    const tempTeacherId = createTempTeacher.body.data.id as number;

    const createTempCircle = await jsonAuthRequest(superAuth.token, "/org/circles", "POST", {
      centerId: tempCenterId,
      nameAr: `RBAC Temp Circle ${tempSuffix}`,
      nameEn: `RBAC Temp Circle ${tempSuffix}`,
      circleType: "HIFZ",
      primaryTeacherUserId: tempTeacherId,
      locationText: "RBAC Smoke Circle Room"
    });
    checkStatus(checks, "super_create_temp_circle_201", createTempCircle.status, 201);
    const tempCircleId = createTempCircle.body.data.id as number;

    const centerAdminCreateCenter = await jsonAuthRequest(
      centerAdminAuth.token,
      "/org/centers",
      "POST",
      {
        name: "Blocked Center",
        code: `BLK-${Date.now().toString().slice(-4)}`
      }
    );
    checkStatus(checks, "center_admin_create_center_403", centerAdminCreateCenter.status, 403);

    const centerAdminCreateForeignCircle = await jsonAuthRequest(
      centerAdminAuth.token,
      "/org/circles",
      "POST",
      {
        centerId: tempCenterId,
        nameAr: `Blocked Foreign Circle ${tempSuffix}`,
        nameEn: `Blocked Foreign Circle ${tempSuffix}`,
        circleType: "HIFZ",
        primaryTeacherUserId: tempTeacherId
      }
    );
    checkStatus(
      checks,
      "center_admin_create_foreign_circle_403",
      centerAdminCreateForeignCircle.status,
      403
    );

    const centerAdminPatchForeignCircle = await jsonAuthRequest(
      centerAdminAuth.token,
      `/org/circles/${tempCircleId}`,
      "PATCH",
      {
        name: `Blocked Foreign Patch ${Date.now()}`
      }
    );
    checkStatus(
      checks,
      "center_admin_patch_foreign_circle_masked_404",
      centerAdminPatchForeignCircle.status,
      404
    );

    checkBool(
      checks,
      "center_admin_foreign_patch_has_request_id",
      Boolean(
        centerAdminPatchForeignCircle.headers["x-request-id"] &&
          centerAdminPatchForeignCircle.body?.error?.requestId
      )
    );

    const supervisorCreateCircle = await jsonAuthRequest(
      supervisorAuth.token,
      "/org/circles",
      "POST",
      {
        centerId: tempCenterId,
        name: `Blocked Supervisor Create ${Date.now()}`
      }
    );
    checkStatus(checks, "supervisor_create_circle_403", supervisorCreateCircle.status, 403);

    const teacherCreateCircle = await jsonAuthRequest(teacherAuth.token, "/org/circles", "POST", {
      centerId: tempCenterId,
      name: `Blocked Teacher Create ${Date.now()}`
    });
    checkStatus(checks, "teacher_create_circle_403", teacherCreateCircle.status, 403);

    const supervisorCircles = await authRequest(supervisorAuth.token, "/org/circles");
    checkStatus(checks, "supervisor_list_circles_200", supervisorCircles.status, 200);
    const supervisorCircleIds = new Set(
      (supervisorCircles.body.data as Array<{ id: number }>).map((item) => item.id)
    );
    checkBool(
      checks,
      "supervisor_does_not_see_foreign_temp_circle",
      !supervisorCircleIds.has(tempCircleId),
      { tempCircleId }
    );

    const teacherCircles = await authRequest(teacherAuth.token, "/org/circles");
    checkStatus(checks, "teacher_list_circles_200", teacherCircles.status, 200);
    const teacherCircleIds = new Set(
      (teacherCircles.body.data as Array<{ id: number }>).map((item) => item.id)
    );
    checkBool(
      checks,
      "teacher_does_not_see_foreign_temp_circle",
      !teacherCircleIds.has(tempCircleId),
      { tempCircleId }
    );

    const centerAdminCirclesAfter = await authRequest(centerAdminAuth.token, "/org/circles");
    checkStatus(checks, "center_admin_list_circles_after_200", centerAdminCirclesAfter.status, 200);
    const centerAdminCircleIdsAfter = new Set(
      (centerAdminCirclesAfter.body.data as Array<{ id: number }>).map((item) => item.id)
    );
    checkBool(
      checks,
      "center_admin_does_not_see_temp_circle",
      !centerAdminCircleIdsAfter.has(tempCircleId),
      { tempCircleId }
    );

    const centerAdminCentersAfter = await authRequest(centerAdminAuth.token, "/org/centers");
    checkStatus(checks, "center_admin_list_centers_after_200", centerAdminCentersAfter.status, 200);
    const centerAdminCenterIdsAfter = new Set(
      (centerAdminCentersAfter.body.data as Array<{ id: number }>).map((item) => item.id)
    );
    checkBool(
      checks,
      "center_admin_does_not_see_temp_center",
      !centerAdminCenterIdsAfter.has(tempCenterId),
      { tempCenterId }
    );

    const parentUsers = await authRequest(parentAuth.token, "/users");
    checkStatus(checks, "parent_list_users_200", parentUsers.status, 200);
    const parentList = parentUsers.body.data as Array<{ id: number; role: string }>;
    const parentAllowedRoles = new Set(["PARENT", "STUDENT"]);
    checkBool(
      checks,
      "parent_users_roles_only_parent_student",
      parentList.every((item) => parentAllowedRoles.has(item.role)),
      { roles: parentList.map((item) => item.role) }
    );

    const parentGetTeacher = await authRequest(parentAuth.token, `/users/${teacherUser!.id}`);
    checkStatus(checks, "parent_get_teacher_masked_404", parentGetTeacher.status, 404);

    const studentUsers = await authRequest(studentAuth.token, "/users");
    checkStatus(checks, "student_list_users_200", studentUsers.status, 200);
    const studentList = studentUsers.body.data as Array<{ id: number }>;
    checkBool(
      checks,
      "student_list_users_only_self",
      studentList.length === 1 && studentList[0].id === studentAuth.userId,
      { studentIds: studentList.map((item) => item.id), expected: studentAuth.userId }
    );

    const studentGetParent = await authRequest(studentAuth.token, `/users/${parentUser!.id}`);
    checkStatus(checks, "student_get_parent_masked_404", studentGetParent.status, 404);

    const parentAudit = await authRequest(parentAuth.token, "/audit");
    checkStatus(checks, "parent_audit_forbidden_403", parentAudit.status, 403);

    const superCentersAfter = await authRequest(superAuth.token, "/org/centers");
    checkStatus(checks, "super_list_centers_after_200", superCentersAfter.status, 200);
    const superCenterIdsAfter = new Set(
      (superCentersAfter.body.data as Array<{ id: number }>).map((item) => item.id)
    );
    checkBool(
      checks,
      "super_sees_temp_center",
      superCenterIdsAfter.has(tempCenterId),
      { tempCenterId }
    );

    const superCirclesAfter = await authRequest(superAuth.token, "/org/circles");
    checkStatus(checks, "super_list_circles_after_200", superCirclesAfter.status, 200);
    const superCircleIdsAfter = new Set(
      (superCirclesAfter.body.data as Array<{ id: number }>).map((item) => item.id)
    );
    checkBool(
      checks,
      "super_sees_temp_circle",
      superCircleIdsAfter.has(tempCircleId),
      { tempCircleId }
    );

    checkBool(
      checks,
      "center_scope_consistent_before_after",
      centerAdminCenterIds.size === centerAdminCenterIdsAfter.size &&
        [...centerAdminCenterIds].every((id) => centerAdminCenterIdsAfter.has(id))
    );

    checkBool(
      checks,
      "circle_scope_consistent_before_after",
      centerAdminCircleIds.size === centerAdminCircleIdsAfter.size &&
        [...centerAdminCircleIds].every((id) => centerAdminCircleIdsAfter.has(id))
    );

    const openApi = await request("/openapi.json");
    checkStatus(checks, "openapi_json_200", openApi.status, 200);
    checkBool(checks, "openapi_contains_new_users_paths", Boolean(openApi.body?.paths?.["/users/{id}/status"]));

    const passed = checks.filter((item) => item.ok).length;
    console.log(
      JSON.stringify(
        {
          ok: true,
          script: "rbac-smoke",
          totalChecks: checks.length,
          passedChecks: passed,
          failedChecks: checks.length - passed,
          checks
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
          script: "rbac-smoke",
          error: error instanceof Error ? error.message : String(error),
          checks,
          serverLogsTail: serverLogs.slice(-4000)
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } finally {
    server.kill("SIGTERM");
    await sleep(700);
  }
};

void main();
