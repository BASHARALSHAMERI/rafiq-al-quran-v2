import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import dotenv from "dotenv";

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

const SMOKE_PORT = Number(process.env.SMOKE_PORT ?? "4110");
const BASE_URL = process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${SMOKE_PORT}`;
const DEFAULT_PASSWORD = "Rafiq@1234";
const localEnv = dotenv.config({ path: ".env" }).parsed ?? {};

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

const jsonAuthRequest = (
  token: string,
  path: string,
  method: string,
  payload: unknown,
  extraHeaders?: Record<string, string>
) => {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  for (const [key, value] of Object.entries(extraHeaders ?? {})) {
    headers.set(key, value);
  }

  return request(path, {
    method,
    headers,
    body: JSON.stringify(payload)
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
      // ignore startup retries
    }
    await sleep(350);
  }

  throw new Error("Server failed to start in expected time");
};

const login = async (email: string, platform: "web" | "mobile" = "mobile") => {
  const result = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-platform": platform },
    body: JSON.stringify({ email, password: DEFAULT_PASSWORD })
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

const makeSequencer = () => {
  const seed = Date.now().toString(36);
  let seq = 0;
  return (prefix: string) => {
    seq += 1;
    return `${prefix}-${seed}-${String(seq).padStart(4, "0")}`;
  };
};

const nextPeriod = (used: Set<string>, startYear = 2030) => {
  for (let year = startYear; year <= 2100; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const key = `${year}-${month}`;
      if (!used.has(key)) {
        used.add(key);
        return { year, month };
      }
    }
  }

  throw new Error("No available period slot");
};

const createInvoiceWithRetry = async (args: {
  token: string;
  studentId: number;
  centerId: number;
  amount: number;
  usedPeriods: Set<string>;
}) => {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const period = nextPeriod(args.usedPeriods);
    const result = await jsonAuthRequest(args.token, "/finance/v2/invoices", "POST", {
      studentId: args.studentId,
      centerId: args.centerId,
      month: period.month,
      year: period.year,
      amount: args.amount,
      invoiceType: "TUITION_MONTHLY"
    });

    if (result.status === 201) {
      return result;
    }

    if (result.status !== 409) {
      return result;
    }
  }

  throw new Error("Failed to create unique invoice after retries");
};

const createPayrollBatchWithRetry = async (args: {
  token: string;
  centerId: number;
  usedPeriods: Set<string>;
}) => {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const period = nextPeriod(args.usedPeriods, 2030);
    const result = await jsonAuthRequest(args.token, "/finance/v2/payroll/batches", "POST", {
      centerId: args.centerId,
      periodYear: period.year,
      periodMonth: period.month
    });
    if (result.status === 201) {
      return result;
    }
    if (result.status !== 409) {
      return result;
    }
  }

  throw new Error("Failed to create unique payroll batch after retries");
};

const ensureCircleForCenter = async (args: {
  token: string;
  centerId: number;
  nextId: (prefix: string) => string;
  checks: CheckResult[];
  label: string;
}) => {
  const circles = await authRequest(args.token, `/org/circles?centerId=${args.centerId}`);
  checkStatus(args.checks, `${args.label}_circles_list_200`, circles.status, 200);
  const rows = circles.body.data as Array<{ id: number }>;
  if (rows.length > 0) {
    return rows[0].id;
  }

  const teacherEmail = `${args.label}.circle.teacher.${Date.now()}@rafiq.local`;
  const teacherCreate = await jsonAuthRequest(args.token, "/users", "POST", {
    fullName: `Finance Smoke ${args.label} Circle Teacher`,
    email: teacherEmail,
    role: "TEACHER",
    password: DEFAULT_PASSWORD,
    links: {
      centerIds: [args.centerId]
    }
  });
  checkStatus(args.checks, `${args.label}_circle_teacher_create_201`, teacherCreate.status, 201);
  const teacherId = teacherCreate.body.data.id as number;

  const circleCreate = await jsonAuthRequest(args.token, "/org/circles", "POST", {
    centerId: args.centerId,
    nameAr: `ط­ظ„ظ‚ط© Smoke ${args.label} ${args.nextId("c")}`,
    nameEn: `Smoke ${args.label} Circle ${args.nextId("c")}`,
    circleType: "HIFZ",
    primaryTeacherUserId: teacherId,
    locationText: "Finance smoke auto circle"
  });
  checkStatus(args.checks, `${args.label}_circle_create_201`, circleCreate.status, 201);
  return circleCreate.body.data.id as number;
};

const ensureStudentForCenter = async (args: {
  token: string;
  centerId: number;
  nextId: (prefix: string) => string;
  checks: CheckResult[];
  label: string;
}) => {
  const existing = await authRequest(args.token, `/users?role=STUDENT&centerId=${args.centerId}`);
  checkStatus(args.checks, `${args.label}_students_list_200`, existing.status, 200);
  const rows = existing.body.data as Array<{ id: number }>;
  if (rows.length > 0) {
    return rows[0].id;
  }

  const circleId = await ensureCircleForCenter({
    token: args.token,
    centerId: args.centerId,
    nextId: args.nextId,
    checks: args.checks,
    label: args.label
  });

  const studentEmail = `${args.label}.student.${Date.now()}@rafiq.local`;
  const studentCreate = await jsonAuthRequest(args.token, "/users", "POST", {
    fullName: `Finance Smoke ${args.label} Student`,
    email: studentEmail,
    role: "STUDENT",
    password: DEFAULT_PASSWORD
  });
  checkStatus(args.checks, `${args.label}_student_create_201`, studentCreate.status, 201);
  const studentId = studentCreate.body.data.id as number;

  const enroll = await jsonAuthRequest(args.token, `/users/${studentId}/enrollments`, "POST", {
    circleId
  });
  checkStatus(args.checks, `${args.label}_student_enroll_201`, enroll.status, 201);

  return studentId;
};

const ensureTeacherForCenter = async (args: {
  token: string;
  centerId: number;
  nextId: (prefix: string) => string;
  checks: CheckResult[];
  label: string;
}) => {
  const existing = await authRequest(args.token, `/users?role=TEACHER&centerId=${args.centerId}`);
  checkStatus(args.checks, `${args.label}_teachers_list_200`, existing.status, 200);
  const rows = existing.body.data as Array<{ id: number }>;
  if (rows.length > 0) {
    return rows[0].id;
  }

  const teacherEmail = `${args.label}.teacher.${Date.now()}@rafiq.local`;
  const teacherCreate = await jsonAuthRequest(args.token, "/users", "POST", {
    fullName: `Finance Smoke ${args.label} Teacher`,
    email: teacherEmail,
    role: "TEACHER",
    password: DEFAULT_PASSWORD,
    links: {
      centerIds: [args.centerId]
    }
  });
  checkStatus(args.checks, `${args.label}_teacher_create_201`, teacherCreate.status, 201);
  return teacherCreate.body.data.id as number;
};

const main = async () => {
  const server = spawn("node", ["dist/app/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...localEnv,
      PORT: String(SMOKE_PORT)
    },
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
  const nextId = makeSequencer();

  try {
    await waitForServer();
    checks.push({ name: "server_ready", ok: true, status: 200 });

    const superAuth = await login("superadmin@rafiq.local", "web");
    const centerAdminAuth = await login("center.admin@rafiq.local", "web");
    const supervisorAuth = await login("supervisor@rafiq.local");

    const centers = await authRequest(superAuth.token, "/org/centers");
    checkStatus(checks, "super_list_centers_200", centers.status, 200);
    const centerRows = centers.body.data as Array<{ id: number; code?: string }>;
    checkBool(checks, "centers_count_at_least_2", centerRows.length >= 2, { count: centerRows.length });

    const centerAdminCenters = await authRequest(centerAdminAuth.token, "/org/centers");
    checkStatus(checks, "center_admin_centers_200", centerAdminCenters.status, 200);
    const centerAdminRows = centerAdminCenters.body.data as Array<{ id: number }>;
    checkBool(checks, "center_admin_has_center", centerAdminRows.length > 0);

    const centerPrimaryId = centerAdminRows[0].id;
    const centerSecondaryId =
      centerRows.find((row) => row.id !== centerPrimaryId)?.id ?? centerPrimaryId;
    checkBool(checks, "secondary_center_exists", centerSecondaryId !== centerPrimaryId, {
      centerPrimaryId,
      centerSecondaryId
    });

    const northInvoices = await authRequest(
      superAuth.token,
      `/finance/v2/invoices?centerId=${centerPrimaryId}&pageSize=100`
    );
    checkStatus(checks, "north_invoices_list_200", northInvoices.status, 200);
    const northInvoiceRows = (northInvoices.body.data.rows ?? []) as Array<{
      id: number;
      studentId: number;
      month: number;
      year: number;
    }>;
    let northStudentId: number;
    let usedNorthInvoicePeriods = new Set<string>();
    if (northInvoiceRows.length > 0) {
      northStudentId = northInvoiceRows[0].studentId;
      usedNorthInvoicePeriods = new Set(
        northInvoiceRows
          .filter((row) => row.studentId === northStudentId)
          .map((row) => `${row.year}-${row.month}`)
      );
      checks.push({ name: "north_student_from_invoice_seed", ok: true });
    } else {
      northStudentId = await ensureStudentForCenter({
        token: superAuth.token,
        centerId: centerPrimaryId,
        nextId,
        checks,
        label: "north"
      });
      checks.push({ name: "north_student_from_users_scope", ok: true });
    }

    const southInvoices = await authRequest(
      superAuth.token,
      `/finance/v2/invoices?centerId=${centerSecondaryId}&pageSize=100`
    );
    checkStatus(checks, "south_invoices_list_200", southInvoices.status, 200);
    const southInvoiceRows = (southInvoices.body.data.rows ?? []) as Array<{
      id: number;
      studentId: number;
      month: number;
      year: number;
    }>;
    let southStudentId: number;
    let usedSouthInvoicePeriods = new Set<string>();
    if (southInvoiceRows.length > 0) {
      southStudentId = southInvoiceRows[0].studentId;
      usedSouthInvoicePeriods = new Set(
        southInvoiceRows
          .filter((row) => row.studentId === southStudentId)
          .map((row) => `${row.year}-${row.month}`)
      );
      checks.push({ name: "south_student_from_invoice_seed", ok: true });
    } else {
      southStudentId = await ensureStudentForCenter({
        token: superAuth.token,
        centerId: centerSecondaryId,
        nextId,
        checks,
        label: "south"
      });
      checks.push({ name: "south_student_from_users_scope", ok: true });
    }

    // 1) transfer attachment validation + idempotency
    const invoiceForTransfer = await createInvoiceWithRetry({
      token: centerAdminAuth.token,
      studentId: northStudentId,
      centerId: centerPrimaryId,
      amount: 1200,
      usedPeriods: usedNorthInvoicePeriods
    });
    checkStatus(checks, "create_invoice_for_transfer_201", invoiceForTransfer.status, 201);
    const invoiceForTransferId = invoiceForTransfer.body.data.id as number;

    const transferWithoutAttachment = await jsonAuthRequest(
      centerAdminAuth.token,
      "/finance/v2/payments",
      "POST",
      {
        invoiceId: invoiceForTransferId,
        amount: 1200,
        method: "TRANSFER",
        voucherNo: nextId("RCPT-TFR-MISS")
      }
    );
    checkStatus(
      checks,
      "payment_transfer_without_attachment_400",
      transferWithoutAttachment.status,
      400
    );
    checkBool(
      checks,
      "payment_transfer_without_attachment_code",
      transferWithoutAttachment.body?.error?.code === "ATTACHMENT_REQUIRED_FOR_TRANSFER",
      transferWithoutAttachment.body?.error
    );

    const paymentIdempotencyKey = `fin-v2-pay-${nextId("idem")}`;
    const transferWithAttachmentPayload = {
      invoiceId: invoiceForTransferId,
      amount: 1200,
      method: "TRANSFER",
      voucherNo: nextId("RCPT-TFR"),
      attachmentStorageKey: `finance/transfers/smoke/${nextId("att")}.pdf`,
      externalTransferRef: nextId("trx")
    };

    const transferPaymentFirst = await jsonAuthRequest(
      centerAdminAuth.token,
      "/finance/v2/payments",
      "POST",
      transferWithAttachmentPayload,
      { "X-Idempotency-Key": paymentIdempotencyKey }
    );
    checkStatus(checks, "payment_transfer_with_attachment_201", transferPaymentFirst.status, 201);
    const firstPaymentId = transferPaymentFirst.body.data.payment.id as number;

    const transferPaymentSecond = await jsonAuthRequest(
      centerAdminAuth.token,
      "/finance/v2/payments",
      "POST",
      transferWithAttachmentPayload,
      { "X-Idempotency-Key": paymentIdempotencyKey }
    );
    checkStatus(
      checks,
      "payment_transfer_idempotent_repeat_201",
      transferPaymentSecond.status,
      201
    );
    checkBool(
      checks,
      "payment_transfer_idempotent_same_payment_id",
      transferPaymentSecond.body.data.payment.id === firstPaymentId,
      {
        first: firstPaymentId,
        second: transferPaymentSecond.body.data.payment.id
      }
    );

    // 2) concurrent payments race condition
    const raceInvoice = await createInvoiceWithRetry({
      token: centerAdminAuth.token,
      studentId: northStudentId,
      centerId: centerPrimaryId,
      amount: 1000,
      usedPeriods: usedNorthInvoicePeriods
    });
    checkStatus(checks, "create_invoice_for_race_201", raceInvoice.status, 201);
    const raceInvoiceId = raceInvoice.body.data.id as number;

    const racePayloadA = {
      invoiceId: raceInvoiceId,
      amount: 700,
      method: "CASH",
      voucherNo: nextId("RCPT-RACE-A")
    };
    const racePayloadB = {
      invoiceId: raceInvoiceId,
      amount: 700,
      method: "CASH",
      voucherNo: nextId("RCPT-RACE-B")
    };

    const [raceA, raceB] = await Promise.all([
      jsonAuthRequest(centerAdminAuth.token, "/finance/v2/payments", "POST", racePayloadA, {
        "X-Idempotency-Key": `race-a-${nextId("idem")}`
      }),
      jsonAuthRequest(centerAdminAuth.token, "/finance/v2/payments", "POST", racePayloadB, {
        "X-Idempotency-Key": `race-b-${nextId("idem")}`
      })
    ]);

    const statuses = [raceA.status, raceB.status].sort((a, b) => a - b);
    checkBool(checks, "race_statuses_201_409", statuses[0] === 201 && statuses[1] === 409, {
      raceA: raceA.status,
      raceB: raceB.status
    });
    const raceConflict =
      raceA.status === 409 ? raceA.body?.error?.code : raceB.status === 409 ? raceB.body?.error?.code : null;
    checkBool(
      checks,
      "race_conflict_code_over_remaining",
      raceConflict === "PAYMENT_OVER_REMAINING",
      { raceA: raceA.body?.error, raceB: raceB.body?.error }
    );

    const racePayments = await authRequest(
      centerAdminAuth.token,
      `/finance/v2/invoices/${raceInvoiceId}/payments`
    );
    checkStatus(checks, "race_invoice_payments_200", racePayments.status, 200);
    const racePaidTotal = (racePayments.body.data as Array<{ amount: number }>).reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );
    checkBool(checks, "race_paid_total_not_exceed_invoice", racePaidTotal <= 1000, { racePaidTotal });

    // 3) locate accounts after payment operations
    const northAccounts = await authRequest(
      superAuth.token,
      `/finance/v2/accounts?centerId=${centerPrimaryId}`
    );
    checkStatus(checks, "north_accounts_200", northAccounts.status, 200);
    const northAccount = (northAccounts.body.data as Array<{ id: number }>)[0];
    checkBool(checks, "north_account_exists", Boolean(northAccount));

    // ensure south account by collecting one payment
    const southInvoiceForAccount = await createInvoiceWithRetry({
      token: superAuth.token,
      studentId: southStudentId,
      centerId: centerSecondaryId,
      amount: 1000,
      usedPeriods: usedSouthInvoicePeriods
    });
    checkStatus(checks, "create_south_invoice_for_account_201", southInvoiceForAccount.status, 201);
    const southInvoiceForAccountId = southInvoiceForAccount.body.data.id as number;

    const southPayment = await jsonAuthRequest(superAuth.token, "/finance/v2/payments", "POST", {
      invoiceId: southInvoiceForAccountId,
      amount: 1000,
      method: "CASH",
      voucherNo: nextId("RCPT-SOUTH")
    });
    checkStatus(checks, "create_south_payment_201", southPayment.status, 201);

    const southAccounts = await authRequest(
      superAuth.token,
      `/finance/v2/accounts?centerId=${centerSecondaryId}`
    );
    checkStatus(checks, "south_accounts_200", southAccounts.status, 200);
    const southAccount = (southAccounts.body.data as Array<{ id: number }>)[0];
    checkBool(checks, "south_account_exists", Boolean(southAccount));

    // 4) voucher workflow + void workflow
    const topUpVoucherCreate = await jsonAuthRequest(centerAdminAuth.token, "/finance/v2/vouchers", "POST", {
      centerId: centerPrimaryId,
      accountId: northAccount.id,
      voucherType: "RECEIPT",
      voucherNo: nextId("VOC-TOPUP"),
      sourceType: "MANUAL",
      paymentMethod: "CASH",
      amount: 25000
    });
    checkStatus(checks, "voucher_topup_create_201", topUpVoucherCreate.status, 201);
    const topUpVoucherId = topUpVoucherCreate.body.data.id as number;

    checkStatus(
      checks,
      "voucher_topup_submit_200",
      (
        await jsonAuthRequest(
          centerAdminAuth.token,
          `/finance/v2/vouchers/${topUpVoucherId}/submit`,
          "POST",
          { comment: "submit topup" }
        )
      ).status,
      200
    );

    checkStatus(
      checks,
      "voucher_topup_approve_200",
      (
        await jsonAuthRequest(superAuth.token, `/finance/v2/vouchers/${topUpVoucherId}/approve`, "POST", {
          comment: "approve topup"
        })
      ).status,
      200
    );

    checkStatus(
      checks,
      "voucher_topup_post_200",
      (
        await jsonAuthRequest(
          centerAdminAuth.token,
          `/finance/v2/vouchers/${topUpVoucherId}/post`,
          "POST",
          { comment: "post topup" }
        )
      ).status,
      200
    );

    const disbVoucherCreate = await jsonAuthRequest(
      centerAdminAuth.token,
      "/finance/v2/vouchers",
      "POST",
      {
        centerId: centerPrimaryId,
        accountId: northAccount.id,
        voucherType: "DISBURSEMENT",
        voucherNo: nextId("VOC-DISB"),
        sourceType: "MANUAL",
        paymentMethod: "CASH",
        amount: 500
      }
    );
    checkStatus(checks, "voucher_disb_create_201", disbVoucherCreate.status, 201);
    const disbVoucherId = disbVoucherCreate.body.data.id as number;

    checkStatus(
      checks,
      "voucher_disb_submit_200",
      (
        await jsonAuthRequest(
          centerAdminAuth.token,
          `/finance/v2/vouchers/${disbVoucherId}/submit`,
          "POST",
          { comment: "submit disb" }
        )
      ).status,
      200
    );

    checkStatus(
      checks,
      "voucher_disb_approve_200",
      (
        await jsonAuthRequest(superAuth.token, `/finance/v2/vouchers/${disbVoucherId}/approve`, "POST", {
          comment: "approve disb"
        })
      ).status,
      200
    );

    checkStatus(
      checks,
      "voucher_disb_post_200",
      (
        await jsonAuthRequest(
          centerAdminAuth.token,
          `/finance/v2/vouchers/${disbVoucherId}/post`,
          "POST",
          { comment: "post disb" }
        )
      ).status,
      200
    );

    checkStatus(
      checks,
      "voucher_disb_void_request_200",
      (
        await jsonAuthRequest(
          centerAdminAuth.token,
          `/finance/v2/vouchers/${disbVoucherId}/void-request`,
          "POST",
          { reason: "test reverse" }
        )
      ).status,
      200
    );

    const disbVoidApprove = await jsonAuthRequest(
      superAuth.token,
      `/finance/v2/vouchers/${disbVoucherId}/void-approve`,
      "POST",
      { reason: "approved reverse" }
    );
    checkStatus(checks, "voucher_disb_void_approve_200", disbVoidApprove.status, 200);
    checkBool(
      checks,
      "voucher_disb_voided_status",
      disbVoidApprove.body.data.voucher.status === "VOIDED",
      disbVoidApprove.body.data.voucher
    );
    checkBool(
      checks,
      "voucher_disb_reversal_posted",
      disbVoidApprove.body.data.reversalVoucher.status === "POSTED",
      disbVoidApprove.body.data.reversalVoucher
    );

    // 5) fund transfer workflow
    const transferCreate = await jsonAuthRequest(superAuth.token, "/finance/v2/fund-transfers", "POST", {
      fromAccountId: northAccount.id,
      toAccountId: southAccount.id,
      amount: 300,
      notes: "smoke transfer"
    });
    checkStatus(checks, "fund_transfer_create_201", transferCreate.status, 201);
    const transferId = transferCreate.body.data.id as number;

    checkStatus(
      checks,
      "fund_transfer_submit_200",
      (
        await jsonAuthRequest(superAuth.token, `/finance/v2/fund-transfers/${transferId}/submit`, "POST", {
          comment: "submit transfer"
        })
      ).status,
      200
    );

    checkStatus(
      checks,
      "fund_transfer_approve_200",
      (
        await jsonAuthRequest(superAuth.token, `/finance/v2/fund-transfers/${transferId}/approve`, "POST", {
          comment: "approve transfer"
        })
      ).status,
      200
    );

    const transferPost = await jsonAuthRequest(
      superAuth.token,
      `/finance/v2/fund-transfers/${transferId}/post`,
      "POST",
      { comment: "post transfer" }
    );
    checkStatus(checks, "fund_transfer_post_200", transferPost.status, 200);
    checkBool(
      checks,
      "fund_transfer_posted_status",
      transferPost.body.data.transfer.status === "POSTED",
      transferPost.body.data.transfer
    );

    // 6) payroll flow
    const teacherId = await ensureTeacherForCenter({
      token: superAuth.token,
      centerId: centerPrimaryId,
      nextId,
      checks,
      label: "north"
    });

    const payrollProfile = await jsonAuthRequest(
      centerAdminAuth.token,
      "/finance/v2/payroll/profiles",
      "POST",
      {
        centerId: centerPrimaryId,
        userId: teacherId,
        monthlyBaseAmount: 900,
        paymentMethodDefault: "CASH",
        effectiveFrom: "2026-01-01"
      }
    );
    checkStatus(checks, "payroll_profile_create_201", payrollProfile.status, 201);

    const payrollBatches = await authRequest(
      centerAdminAuth.token,
      `/finance/v2/payroll/batches?centerId=${centerPrimaryId}&pageSize=100`
    );
    checkStatus(checks, "payroll_batches_list_200", payrollBatches.status, 200);
    const usedPayrollPeriods = new Set(
      (payrollBatches.body.data.rows as Array<{ periodYear: number; periodMonth: number }>).map(
        (row) => `${row.periodYear}-${row.periodMonth}`
      )
    );

    const payrollBatch = await createPayrollBatchWithRetry({
      token: centerAdminAuth.token,
      centerId: centerPrimaryId,
      usedPeriods: usedPayrollPeriods
    });
    checkStatus(checks, "payroll_batch_create_201", payrollBatch.status, 201);
    const payrollBatchId = payrollBatch.body.data.id as number;

    checkStatus(
      checks,
      "payroll_batch_submit_200",
      (
        await jsonAuthRequest(
          centerAdminAuth.token,
          `/finance/v2/payroll/batches/${payrollBatchId}/submit`,
          "POST",
          { comment: "submit payroll" }
        )
      ).status,
      200
    );

    const payrollApprove = await jsonAuthRequest(
      superAuth.token,
      `/finance/v2/payroll/batches/${payrollBatchId}/approve`,
      "POST",
      { comment: "approve payroll" }
    );
    checkStatus(checks, "payroll_batch_approve_200", payrollApprove.status, 200);
    const payrollItems = payrollApprove.body.data.items as Array<{ id: number }>;
    checkBool(checks, "payroll_batch_has_items", payrollItems.length > 0);

    const payrollPay = await jsonAuthRequest(
      centerAdminAuth.token,
      `/finance/v2/payroll/batches/${payrollBatchId}/pay`,
      "POST",
      {
        payments: payrollItems.map((item) => ({
          itemId: item.id,
          voucherNo: nextId("PAYROLL"),
          method: "CASH"
        }))
      }
    );
    checkStatus(checks, "payroll_batch_pay_200", payrollPay.status, 200);
    checkBool(
      checks,
      "payroll_batch_paid_or_partial",
      ["PAID", "PARTIALLY_PAID", "IN_PROGRESS"].includes(payrollPay.body.data.status),
      payrollPay.body.data
    );

    // 7) reward flow
    const rewardProfile = await jsonAuthRequest(
      centerAdminAuth.token,
      "/finance/v2/reward/profiles",
      "POST",
      {
        centerId: centerPrimaryId,
        beneficiaryUserId: teacherId,
        beneficiaryRole: "TEACHER",
        cycle: "MONTHLY",
        defaultAmount: 250,
        effectiveFrom: "2026-01-01"
      }
    );
    checkStatus(checks, "reward_profile_create_201", rewardProfile.status, 201);

    const now = new Date();
    const rewardCreate = await jsonAuthRequest(
      centerAdminAuth.token,
      "/finance/v2/reward/batches",
      "POST",
      {
        centerId: centerPrimaryId,
        cycle: "MONTHLY",
        periodYear: 2080 + (now.getUTCFullYear() % 10),
        periodMonth: ((now.getUTCMonth() + 1 + 5) % 12) + 1
      }
    );
    checkStatus(checks, "reward_batch_create_201", rewardCreate.status, 201);
    const rewardBatchId = rewardCreate.body.data.id as number;

    checkStatus(
      checks,
      "reward_batch_submit_200",
      (
        await jsonAuthRequest(
          centerAdminAuth.token,
          `/finance/v2/reward/batches/${rewardBatchId}/submit`,
          "POST",
          { comment: "submit reward" }
        )
      ).status,
      200
    );

    const rewardApprove = await jsonAuthRequest(
      superAuth.token,
      `/finance/v2/reward/batches/${rewardBatchId}/approve`,
      "POST",
      { comment: "approve reward" }
    );
    checkStatus(checks, "reward_batch_approve_200", rewardApprove.status, 200);
    const rewardItems = rewardApprove.body.data.items as Array<{ id: number }>;
    checkBool(checks, "reward_batch_has_items", rewardItems.length > 0);

    const rewardPay = await jsonAuthRequest(
      centerAdminAuth.token,
      `/finance/v2/reward/batches/${rewardBatchId}/pay`,
      "POST",
      {
        payments: rewardItems.map((item) => ({
          itemId: item.id,
          voucherNo: nextId("REWARD"),
          method: "CASH"
        }))
      }
    );
    checkStatus(checks, "reward_batch_pay_200", rewardPay.status, 200);
    checkBool(
      checks,
      "reward_batch_paid_or_partial",
      ["PAID", "PARTIALLY_PAID", "IN_PROGRESS"].includes(rewardPay.body.data.status),
      rewardPay.body.data
    );

    // 8) approvals queue + role guard smoke
    const approvalsPending = await authRequest(superAuth.token, "/finance/v2/approvals/pending");
    checkStatus(checks, "approvals_pending_200", approvalsPending.status, 200);

    const supervisorCreateVoucher = await jsonAuthRequest(
      supervisorAuth.token,
      "/finance/v2/vouchers",
      "POST",
      {
        centerId: centerPrimaryId,
        accountId: northAccount.id,
        voucherType: "RECEIPT",
        voucherNo: nextId("VOC-SUP-BLOCK"),
        amount: 10
      }
    );
    checkStatus(checks, "supervisor_create_voucher_403", supervisorCreateVoucher.status, 403);

    const passed = checks.filter((item) => item.ok).length;
    console.log(
      JSON.stringify(
        {
          ok: true,
          script: "finance-v2-smoke",
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
          script: "finance-v2-smoke",
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

