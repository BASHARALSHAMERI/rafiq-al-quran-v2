import { spawn } from "node:child_process";
import assert from "node:assert/strict";

type HttpResult = {
  status: number;
  body: any;
  headers: Record<string, string>;
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

const waitForServer = async () => {
  for (let i = 0; i < 30; i += 1) {
    try {
      const result = await request("/system/health");
      if (result.status === 200) {
        return result;
      }
    } catch {
      // ignore while booting
    }
    await sleep(400);
  }

  throw new Error("Server did not become ready");
};

const expectStatus = (
  results: Array<{ name: string; ok: boolean; status?: number; detail?: unknown }>,
  name: string,
  actual: number,
  expected: number
) => {
  const ok = actual === expected;
  results.push({ name, ok, status: actual, detail: ok ? undefined : { expected } });
  assert.equal(actual, expected, `${name}: expected ${expected}, got ${actual}`);
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

  const checks: Array<{ name: string; ok: boolean; status?: number; detail?: unknown }> = [];

  try {
    const health = await waitForServer();
    expectStatus(checks, "health_200", health.status, 200);

    const superAuth = await login("superadmin@rafiq.local");
    checks.push({ name: "super_login_200", ok: true, status: 200 });

    const centerAdminAuth = await login("center.admin@rafiq.local");
    checks.push({ name: "center_admin_login_200", ok: true, status: 200 });

    const parentAuth = await login("parent@rafiq.local");

    const centerAdminCenters = await authRequest(centerAdminAuth.token, "/org/centers");
    assert.equal(centerAdminCenters.status, 200);
    const ownCenterId = centerAdminCenters.body.data[0]?.id as number | undefined;
    assert.ok(ownCenterId, "Center admin should have at least one center");

    const centerAdminCircles = await authRequest(centerAdminAuth.token, "/org/circles");
    assert.equal(centerAdminCircles.status, 200);
    const ownCircleId = centerAdminCircles.body.data[0]?.id as number | undefined;
    assert.ok(ownCircleId, "Center admin should have at least one circle");

    const superUsers = await authRequest(superAuth.token, "/users");
    assert.equal(superUsers.status, 200);
    const allUsers = superUsers.body.data as Array<{ id: number; email: string; role: string }>;
    const seededCenterAdmin = allUsers.find((item) => item.email === "center.admin@rafiq.local");
    const seededSupervisor = allUsers.find((item) => item.email === "supervisor@rafiq.local");
    const seededTeacher = allUsers.find((item) => item.email === "teacher.noor@rafiq.local");
    assert.ok(seededCenterAdmin, "Seeded center admin must exist");
    assert.ok(seededSupervisor, "Seeded supervisor must exist");
    assert.ok(seededTeacher, "Seeded teacher.noor must exist");

    const parentSelfGet = await authRequest(parentAuth.token, `/users/${parentAuth.userId}`);
    expectStatus(checks, "parent_get_self_200", parentSelfGet.status, 200);

    const parentForeignGet = await authRequest(parentAuth.token, `/users/${seededTeacher.id}`);
    expectStatus(checks, "parent_get_foreign_masked_404", parentForeignGet.status, 404);
    checks.push({
      name: "parent_foreign_error_has_request_id",
      ok: Boolean(parentForeignGet.headers["x-request-id"] && parentForeignGet.body?.error?.requestId),
      status: parentForeignGet.status
    });
    assert.ok(parentForeignGet.headers["x-request-id"]);
    assert.ok(parentForeignGet.body?.error?.requestId);

    const centerAdminCreateUser = await jsonAuthRequest(centerAdminAuth.token, "/users", "POST", {
      fullName: "Blocked Center Admin",
      email: `blocked.center.${Date.now()}@rafiq.local`,
      role: "TEACHER",
      password: DEFAULT_PASSWORD
    });
    expectStatus(checks, "center_admin_create_user_forbidden_403", centerAdminCreateUser.status, 403);

    const tempTeacherEmail = `m2.teacher.${Date.now()}@rafiq.local`;
    const createTeacher = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: "M2 Temp Teacher",
      email: tempTeacherEmail,
      role: "TEACHER",
      password: DEFAULT_PASSWORD
    });
    expectStatus(checks, "super_create_user_teacher_201", createTeacher.status, 201);
    const tempTeacherId = createTeacher.body.data.id as number;

    const duplicateTeacher = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: "M2 Temp Teacher Dup",
      email: tempTeacherEmail,
      role: "TEACHER",
      password: DEFAULT_PASSWORD
    });
    expectStatus(checks, "duplicate_user_email_409", duplicateTeacher.status, 409);

    const updateTeacher = await jsonAuthRequest(superAuth.token, `/users/${tempTeacherId}`, "PATCH", {
      fullName: "M2 Temp Teacher Updated"
    });
    expectStatus(checks, "super_update_user_200", updateTeacher.status, 200);

    const centerAdminUpdateUnscoped = await jsonAuthRequest(
      centerAdminAuth.token,
      `/users/${tempTeacherId}`,
      "PATCH",
      { fullName: "Should Be Masked" }
    );
    expectStatus(checks, "center_admin_update_unscoped_user_404", centerAdminUpdateUnscoped.status, 404);

    const centerAdminScopedTeachers = await authRequest(centerAdminAuth.token, "/users?role=TEACHER");
    assert.equal(centerAdminScopedTeachers.status, 200);
    const scopedTeacher = (centerAdminScopedTeachers.body.data as Array<{ id: number }>)[0];
    assert.ok(scopedTeacher?.id, "Center admin should see at least one scoped teacher");

    const centerAdminUpdateScoped = await jsonAuthRequest(
      centerAdminAuth.token,
      `/users/${scopedTeacher.id}`,
      "PATCH",
      { fullName: `Scoped Teacher ${Date.now()}` }
    );
    expectStatus(checks, "center_admin_update_scoped_user_200", centerAdminUpdateScoped.status, 200);

    const tempSuper2Email = `m2.super.${Date.now()}@rafiq.local`;
    const createSuper2 = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: "M2 Temp Super",
      email: tempSuper2Email,
      role: "SUPER_ADMIN",
      password: DEFAULT_PASSWORD
    });
    assert.equal(createSuper2.status, 201);
    const tempSuper2Id = createSuper2.body.data.id as number;

    const superSelfDisableNotLast = await jsonAuthRequest(
      superAuth.token,
      `/users/${superAuth.userId}/status`,
      "PATCH",
      { isActive: false }
    );
    expectStatus(checks, "super_self_disable_not_last_400", superSelfDisableNotLast.status, 400);

    const disableTempSuper2 = await jsonAuthRequest(
      superAuth.token,
      `/users/${tempSuper2Id}/status`,
      "PATCH",
      { isActive: false }
    );
    expectStatus(checks, "super_disable_other_super_200", disableTempSuper2.status, 200);

    const superSelfDisableLast = await jsonAuthRequest(
      superAuth.token,
      `/users/${superAuth.userId}/status`,
      "PATCH",
      { isActive: false }
    );
    expectStatus(checks, "super_self_disable_last_super_409", superSelfDisableLast.status, 409);

    const tempSupervisorEmail = `m2.supervisor.${Date.now()}@rafiq.local`;
    const createSupervisor = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: "M2 Temp Supervisor",
      email: tempSupervisorEmail,
      role: "SUPERVISOR",
      password: DEFAULT_PASSWORD
    });
    assert.equal(createSupervisor.status, 201);
    const tempSupervisorId = createSupervisor.body.data.id as number;

    const addCenterAccess = await jsonAuthRequest(
      superAuth.token,
      `/users/${tempSupervisorId}/center-access`,
      "POST",
      { centerId: ownCenterId }
    );
    expectStatus(checks, "super_add_center_access_201", addCenterAccess.status, 201);

    const removeCenterAccess = await authRequest(
      superAuth.token,
      `/users/${tempSupervisorId}/center-access/${ownCenterId}`,
      { method: "DELETE" }
    );
    expectStatus(checks, "super_remove_center_access_200", removeCenterAccess.status, 200);

    const foreignSuffix = Date.now().toString();
    const createForeignCenter = await jsonAuthRequest(superAuth.token, "/org/centers", "POST", {
      nameAr: `M2 Foreign Center ${foreignSuffix}`,
      nameEn: `M2 Foreign Center ${foreignSuffix}`,
      gender: "MALE",
      centerAdminUserId: seededCenterAdmin!.id,
      supervisorUserIds: [seededSupervisor!.id]
    });
    assert.equal(createForeignCenter.status, 201);
    const foreignCenterId = createForeignCenter.body.data.id as number;

    const tempForeignTeacherEmail = `m2.foreign.teacher.${foreignSuffix}@rafiq.local`;
    const createForeignTeacher = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: "M2 Foreign Teacher",
      email: tempForeignTeacherEmail,
      role: "TEACHER",
      password: DEFAULT_PASSWORD
    });
    assert.equal(createForeignTeacher.status, 201);
    const tempForeignTeacherId = createForeignTeacher.body.data.id as number;

    const linkForeignTeacherCenter = await jsonAuthRequest(
      superAuth.token,
      `/users/${tempForeignTeacherId}/center-access`,
      "POST",
      { centerId: foreignCenterId }
    );
    assert.ok([200, 201].includes(linkForeignTeacherCenter.status));

    const createForeignCircle = await jsonAuthRequest(superAuth.token, "/org/circles", "POST", {
      centerId: foreignCenterId,
      nameAr: `M2 Foreign Circle ${foreignSuffix}`,
      nameEn: `M2 Foreign Circle ${foreignSuffix}`,
      circleType: "HIFZ",
      primaryTeacherUserId: tempForeignTeacherId
    });
    assert.equal(createForeignCircle.status, 201);
    const foreignCircleId = createForeignCircle.body.data.id as number;

    const tempScopedTeacherEmail = `m2.scoped.teacher.${Date.now()}@rafiq.local`;
    const createScopedTeacher = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: "M2 Scoped Teacher",
      email: tempScopedTeacherEmail,
      role: "TEACHER",
      password: DEFAULT_PASSWORD
    });
    assert.equal(createScopedTeacher.status, 201);
    const tempScopedTeacherId = createScopedTeacher.body.data.id as number;

    const attachTeacherToOwnCircle = await jsonAuthRequest(
      superAuth.token,
      `/users/${tempScopedTeacherId}/circle-access`,
      "POST",
      { circleId: ownCircleId }
    );
    assert.equal(attachTeacherToOwnCircle.status, 201);

    const centerAdminAddForeignCircle = await jsonAuthRequest(
      centerAdminAuth.token,
      `/users/${tempScopedTeacherId}/circle-access`,
      "POST",
      { circleId: foreignCircleId }
    );
    expectStatus(checks, "center_admin_add_foreign_circle_403", centerAdminAddForeignCircle.status, 403);

    const tempStudentEmail = `m2.student.${Date.now()}@rafiq.local`;
    const tempParentEmail = `m2.parent.${Date.now()}@rafiq.local`;

    const createStudent = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: "M2 Temp Student",
      email: tempStudentEmail,
      role: "STUDENT",
      password: DEFAULT_PASSWORD
    });
    assert.equal(createStudent.status, 201);
    const tempStudentId = createStudent.body.data.id as number;

    const createParent = await jsonAuthRequest(superAuth.token, "/users", "POST", {
      fullName: "M2 Temp Parent",
      email: tempParentEmail,
      role: "PARENT",
      password: DEFAULT_PASSWORD
    });
    assert.equal(createParent.status, 201);
    const tempParentId = createParent.body.data.id as number;

    const addEnrollment = await jsonAuthRequest(
      superAuth.token,
      `/users/${tempStudentId}/enrollments`,
      "POST",
      { circleId: ownCircleId }
    );
    expectStatus(checks, "super_add_student_enrollment_201", addEnrollment.status, 201);

    const addParentLink = await jsonAuthRequest(
      superAuth.token,
      `/users/${tempParentId}/parent-links`,
      "POST",
      { studentId: tempStudentId, relationType: "GUARDIAN" }
    );
    expectStatus(checks, "super_add_parent_student_link_201", addParentLink.status, 201);

    const removeParentLink = await authRequest(
      superAuth.token,
      `/users/${tempParentId}/parent-links/${tempStudentId}`,
      { method: "DELETE" }
    );
    expectStatus(checks, "super_remove_parent_student_link_200", removeParentLink.status, 200);

    const removeEnrollment = await authRequest(
      superAuth.token,
      `/users/${tempStudentId}/enrollments/${ownCircleId}`,
      { method: "DELETE" }
    );
    expectStatus(checks, "super_remove_student_enrollment_200", removeEnrollment.status, 200);

    const openApi = await request("/openapi.json");
    assert.equal(openApi.status, 200);
    const usersPathsPresent =
      Boolean(openApi.body?.paths?.["/users"]?.post) &&
      Boolean(openApi.body?.paths?.["/users/{id}"]?.patch) &&
      Boolean(openApi.body?.paths?.["/users/{id}/status"]?.patch) &&
      Boolean(openApi.body?.paths?.["/users/{id}/center-access"]?.post) &&
      Boolean(openApi.body?.paths?.["/users/{id}/circle-access"]?.post) &&
      Boolean(openApi.body?.paths?.["/users/{id}/parent-links"]?.post) &&
      Boolean(openApi.body?.paths?.["/users/{id}/enrollments"]?.post);
    checks.push({
      name: "openapi_users_paths_present",
      ok: usersPathsPresent,
      status: openApi.status
    });
    assert.ok(usersPathsPresent, "OpenAPI users paths missing");

    const passed = checks.filter((item) => item.ok).length;
    console.log(
      JSON.stringify(
        {
          ok: true,
          milestone: 2,
          totalChecks: checks.length,
          passedChecks: passed,
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
