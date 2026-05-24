import assert from "node:assert/strict";
import path from "node:path";
import { Role, ReportType } from "@prisma/client";
import { Project, Node, SyntaxKind, type Expression, type SourceFile } from "ts-morph";
import { reportsDomain } from "../src/modules/reports/reports.domain";

type RouteGuard = {
  method: string;
  path: string;
  roles: string[];
};

type Check = {
  name: string;
  ok: boolean;
  detail?: unknown;
};

const projectRoot = process.cwd();
const project = new Project({
  tsConfigFilePath: path.join(projectRoot, "tsconfig.json"),
  skipAddingFilesFromTsConfig: true
});

const roleName = (value: Role): string => value;

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

const getRoutePath = (filePath: string) => path.join(projectRoot, filePath);

const resolveRolesExpression = (
  expression: Expression,
  roleConstants: Map<string, string[]>
): string[] => {
  if (Node.isArrayLiteralExpression(expression)) {
    return expression.getElements().flatMap((element) => resolveRolesExpression(element, roleConstants));
  }

  if (Node.isPropertyAccessExpression(expression)) {
    const text = expression.getText();
    if (text.startsWith("Role.")) {
      return [text.slice("Role.".length)];
    }
  }

  if (Node.isIdentifier(expression)) {
    const roles = roleConstants.get(expression.getText());
    assert.ok(roles, `Unknown role constant: ${expression.getText()}`);
    return roles;
  }

  throw new Error(`Unsupported role expression: ${expression.getText()}`);
};

const collectRoleConstants = (sourceFile: SourceFile): Map<string, string[]> => {
  const roleConstants = new Map<string, string[]>();

  sourceFile.getVariableDeclarations().forEach((declaration) => {
    const initializer = declaration.getInitializer();
    if (!initializer || !Node.isArrayLiteralExpression(initializer)) return;

    const roles = initializer.getElements().flatMap((element) => {
      if (Node.isSpreadElement(element)) {
        const spreadExpression = element.getExpression();
        assert.ok(Node.isIdentifier(spreadExpression), `Unsupported spread: ${element.getText()}`);
        const spreadRoles = roleConstants.get(spreadExpression.getText());
        assert.ok(spreadRoles, `Unknown spread role constant: ${spreadExpression.getText()}`);
        return spreadRoles;
      }

      return resolveRolesExpression(element, roleConstants);
    });

    if (roles.length > 0) {
      roleConstants.set(declaration.getName(), roles);
    }
  });

  return roleConstants;
};

const collectRouteGuards = (filePath: string): RouteGuard[] => {
  const sourceFile = project.addSourceFileAtPath(getRoutePath(filePath));
  const roleConstants = collectRoleConstants(sourceFile);
  const routes: RouteGuard[] = [];

  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
    const expression = call.getExpression();
    if (!Node.isPropertyAccessExpression(expression)) return;

    const method = expression.getName().toUpperCase();
    if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(method)) return;

    const [pathArg, ...middlewareArgs] = call.getArguments();
    if (!pathArg || !Node.isStringLiteral(pathArg)) return;

    const requireRolesCall = middlewareArgs.find((arg) => {
      if (!Node.isCallExpression(arg)) return false;
      const innerExpression = arg.getExpression();
      return Node.isIdentifier(innerExpression) && innerExpression.getText() === "requireRoles";
    });

    assert.ok(requireRolesCall && Node.isCallExpression(requireRolesCall), `Missing requireRoles for ${method} ${pathArg.getLiteralText()}`);
    const rolesArg = requireRolesCall.getArguments()[0];
    assert.ok(rolesArg, `Missing roles argument for ${method} ${pathArg.getLiteralText()}`);

    routes.push({
      method,
      path: pathArg.getLiteralText(),
      roles: [...new Set(resolveRolesExpression(rolesArg, roleConstants))]
    });
  });

  return routes;
};

const routeMap = (routes: RouteGuard[]) => {
  const map = new Map<string, RouteGuard>();
  routes.forEach((route) => {
    map.set(`${route.method} ${route.path}`, route);
  });
  return map;
};

const financeRoutes = routeMap(collectRouteGuards("src/modules/finance-v2/finance-v2.routes.ts"));
const accountingRoutes = routeMap(collectRouteGuards("src/modules/accounting/accounting.routes.ts"));
const reportsRoutes = routeMap(collectRouteGuards("src/modules/reports/reports.routes.ts"));

const assertAllowsAccountant = (routes: Map<string, RouteGuard>, routeKey: string) => {
  const route = routes.get(routeKey);
  assert.ok(route, `Route not found: ${routeKey}`);
  assert.ok(
    route.roles.includes(roleName(Role.ACCOUNTANT)),
    `${routeKey} should allow ACCOUNTANT; got ${route.roles.join(", ")}`
  );
};

const assertDeniesAccountant = (routes: Map<string, RouteGuard>, routeKey: string) => {
  const route = routes.get(routeKey);
  assert.ok(route, `Route not found: ${routeKey}`);
  assert.ok(
    !route.roles.includes(roleName(Role.ACCOUNTANT)),
    `${routeKey} should deny ACCOUNTANT; got ${route.roles.join(", ")}`
  );
};

const allowedRoutes: Array<[Map<string, RouteGuard>, string]> = [
  [financeRoutes, "GET /finance/v2/vouchers"],
  [financeRoutes, "GET /finance/v2/invoices"],
  [financeRoutes, "GET /finance/v2/accounts"],
  [financeRoutes, "GET /finance/v2/fund-transfers"],
  [accountingRoutes, "GET /accounting/accounts"],
  [accountingRoutes, "GET /accounting/journal-entries"],
  [accountingRoutes, "GET /accounting/trial-balance"],
  [accountingRoutes, "GET /accounting/ledger"],
  [reportsRoutes, "GET /reports/catalog"],
  [reportsRoutes, "GET /reports/finance"]
];

const deniedRoutes: Array<[Map<string, RouteGuard>, string]> = [
  [financeRoutes, "POST /finance/v2/vouchers/:id/approve"],
  [financeRoutes, "POST /finance/v2/vouchers/:id/post"],
  [financeRoutes, "POST /finance/v2/vouchers/:id/void-approve"],
  [financeRoutes, "POST /finance/v2/payments"],
  [financeRoutes, "POST /finance/v2/payroll/batches/:id/approve"],
  [financeRoutes, "POST /finance/v2/payroll/batches/:id/pay"],
  [financeRoutes, "POST /finance/v2/reward/batches/:id/approve"],
  [financeRoutes, "POST /finance/v2/reward/batches/:id/pay"],
  [financeRoutes, "POST /finance/v2/expenses/:id/approve"],
  [accountingRoutes, "POST /accounting/accounts"],
  [accountingRoutes, "POST /accounting/journal-entries/:id/post"],
  [reportsRoutes, "GET /reports/attendance"]
];

allowedRoutes.forEach(([routes, routeKey]) => {
  record(`allow_accountant_${routeKey}`, () => assertAllowsAccountant(routes, routeKey));
});

deniedRoutes.forEach(([routes, routeKey]) => {
  record(`deny_accountant_${routeKey}`, () => assertDeniesAccountant(routes, routeKey));
});

const accountantScope = {
  userId: 1,
  role: Role.ACCOUNTANT,
  organizationId: 1,
  centerIds: [1],
  circleIds: [],
  studentIds: [],
  allAccess: false
};

record("allow_accountant_finance_report_domain", () => {
  assert.doesNotThrow(() => reportsDomain.assertReportAccess(accountantScope, ReportType.FINANCE));
});

record("deny_accountant_non_finance_report_domain", () => {
  assert.throws(
    () => reportsDomain.assertReportAccess(accountantScope, ReportType.ATTENDANCE),
    (error) => error instanceof Error && "statusCode" in error && error.statusCode === 403
  );
});

const failed = checks.filter((check) => !check.ok);

console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      script: "accountant-access-regression",
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
