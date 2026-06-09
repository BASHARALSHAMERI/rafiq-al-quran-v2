import assert from "node:assert/strict";
import path from "node:path";
import { Role } from "@prisma/client";
import { Project } from "ts-morph";
import { financeV2Domain } from "../src/modules/finance-v2/finance-v2.domain";
import type { ScopeContext } from "../src/shared/types/auth.types";

type Check = {
  name: string;
  ok: boolean;
  detail?: unknown;
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

const scopedCenterAdmin: ScopeContext = {
  userId: 10,
  role: Role.CENTER_ADMIN,
  organizationId: 1,
  allAccess: false,
  centerIds: [1],
  circleIds: [],
  studentIds: []
};

const superAdmin: ScopeContext = {
  userId: 1,
  role: Role.SUPER_ADMIN,
  organizationId: 1,
  allAccess: true,
  centerIds: [],
  circleIds: [],
  studentIds: []
};

record("center_admin_denies_org_level_financial_record", () => {
  assert.throws(
    () => financeV2Domain.ensureScopedCenterRequired(scopedCenterAdmin, null),
    (error) => error instanceof Error && "statusCode" in error && error.statusCode === 403
  );
});

record("center_admin_denies_other_center_financial_record", () => {
  assert.throws(
    () => financeV2Domain.ensureScopedCenterRequired(scopedCenterAdmin, 2),
    (error) => error instanceof Error && "statusCode" in error && error.statusCode === 403
  );
});

record("center_admin_allows_own_center_financial_record", () => {
  assert.doesNotThrow(() => financeV2Domain.ensureScopedCenterRequired(scopedCenterAdmin, 1));
});

record("super_admin_allows_org_level_financial_record", () => {
  assert.doesNotThrow(() => financeV2Domain.ensureScopedCenterRequired(superAdmin, null));
});

const projectRoot = process.cwd();
const project = new Project({
  tsConfigFilePath: path.join(projectRoot, "tsconfig.json"),
  skipAddingFilesFromTsConfig: true
});

const expensesSource = project
  .addSourceFileAtPath(path.join(projectRoot, "src/modules/finance-v2/services/expenses.service.ts"))
  .getFullText();
const assetsSource = project
  .addSourceFileAtPath(path.join(projectRoot, "src/modules/finance-v2/services/assets.service.ts"))
  .getFullText();

record("expenses_list_uses_center_scope_filter", () => {
  assert.match(expensesSource, /resolveExpenseInvoiceCenterWhere\(scope,\s*query\.centerId\)/);
});

record("expenses_create_requires_scoped_center", () => {
  assert.match(expensesSource, /ensureScopedCenterRequired\(scope,\s*input\.centerId\)/);
});

record("expenses_approve_validates_loaded_invoice_center", () => {
  assert.match(expensesSource, /ensureExpenseInvoiceScope\(scope,\s*invoice\)/);
});

record("expenses_pay_validates_payment_account_center", () => {
  assert.match(expensesSource, /ensureFinanceAccountScope\(scope,\s*financeAccount\)/);
});

record("assets_create_requires_scoped_center", () => {
  assert.match(assetsSource, /ensureScopedCenterRequired\(scope,\s*centerId\)/);
});

record("assets_create_validates_linked_expense_invoice_center", () => {
  assert.match(assetsSource, /ensureScopedCenterRequired\(scope,\s*invoice\.centerId\)/);
});

record("assets_acquisition_validates_payment_account_center", () => {
  assert.match(assetsSource, /ensureCenterAllowed\(scope,\s*financeAccount\.centerId\)/);
});

const failed = checks.filter((check) => !check.ok);

console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      script: "finance-center-scope-regression",
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
