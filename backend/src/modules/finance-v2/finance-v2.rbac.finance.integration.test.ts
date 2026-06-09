import { AccountingAccountType, JournalSourceType, Role } from "@prisma/client";
import { accountingService } from "../accounting/accounting.service";
import { orgService } from "../org/org.service";
import { centerReadRoles } from "../org/org.routes";
import { usersService } from "../users/users.service";
import { usersReadRoles } from "../users/users.routes";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { financeV2Domain } from "./finance-v2.domain";
import { disableConditionalCache } from "./finance-v2.cache";
import { financeV2Controller } from "./finance-v2.controller";
import { payrollService } from "./services/payroll.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("finance and accounting RBAC integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("permits finance roles and center-scoped supervisor reads", async () => {
    const context = await createTaizFinanceContext();
    await expect(accountingService.getChartOfAccounts(context.scopes.manager, {})).resolves.not.toHaveLength(0);
    await expect(accountingService.getChartOfAccounts(context.scopes.auditor, {})).resolves.not.toHaveLength(0);
    await expect(
      accountingService.getTrialBalance(context.scopes.supervisor, {
        centerId: context.centers[0].id
      })
    ).resolves.toMatchObject({ totals: { balanced: true } });
    await expect(
      accountingService.getChartOfAccounts(context.scopes.supervisor, {
        centerId: context.centers[1].id,
        type: AccountingAccountType.ASSET
      })
    ).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
    expect(() => financeV2Domain.assertCanRead(context.scopes.supervisor)).not.toThrow();
    expect(() => financeV2Domain.assertCanWrite(context.scopes.supervisor)).toThrow("Finance scope denied");
    await expect(
      accountingService.closeFiscalPeriod(context.scopes.supervisor, context.periods.openPeriod.id)
    ).rejects.toMatchObject({ code: "ACCOUNTING_SCOPE_DENIED" });
    await expect(accountingService.getChartOfAccounts(context.scopes.teacher, {})).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
  });

  test("prevents a scoped accountant from reading another center", async () => {
    const context = await createTaizFinanceContext();
    await expect(
      accountingService.getChartOfAccounts(context.scopes.accountant, {
        centerId: context.centers[1].id,
        type: AccountingAccountType.ASSET
      })
    ).rejects.toMatchObject({ code: "ACCOUNTING_SCOPE_DENIED" });
  });

  test("limits supervisor accounting data to the assigned center by default", async () => {
    const context = await createTaizFinanceContext();
    const cash = context.accounts.bySystemKey.get("MAIN_CASH")!;
    const donations = context.accounts.bySystemKey.get("DONATIONS_REVENUE")!;

    for (const [centerId, amount] of [
      [context.centers[0].id, 100],
      [context.centers[1].id, 300]
    ] as const) {
      const entry = await accountingService.createJournalEntry(context.scopes.manager, {
        centerId,
        entryDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        sourceType: JournalSourceType.MANUAL,
        lines: [
          { accountId: cash.id, centerId, debit: amount, credit: 0 },
          { accountId: donations.id, centerId, debit: 0, credit: amount }
        ]
      });
      await accountingService.postJournalEntry(context.scopes.manager, entry!.id);
    }

    const trialBalance = await accountingService.getTrialBalance(context.scopes.supervisor, {});
    expect(trialBalance.totals).toEqual({ debit: 100, credit: 100, balanced: true });
  });

  test("parents and students cannot perform administrative finance writes", async () => {
    const context = await createTaizFinanceContext();
    expect(() => financeV2Domain.assertCanWrite(context.scopes.parent)).toThrow("Finance scope denied");
    expect(() => financeV2Domain.assertCanWrite(context.scopes.student)).toThrow("Finance scope denied");
    await expect(accountingService.getChartOfAccounts(context.scopes.parent, {})).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
    await expect(accountingService.getChartOfAccounts(context.scopes.student, {})).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
  });

  test("uses validated boolean filters when listing salary grades", async () => {
    const context = await createTaizFinanceContext();
    const listSpy = jest.spyOn(payrollService, "listSalaryGrades").mockResolvedValue([]);
    const json = jest.fn();
    const next = jest.fn();

    await financeV2Controller.listSalaryGrades(
      {
        scope: context.scopes.manager,
        query: { isActive: "true" }
      } as never,
      {
        locals: { validatedQuery: { isActive: true } },
        json
      } as never,
      next
    );

    expect(listSpy).toHaveBeenCalledWith(context.scopes.manager, { isActive: true });
    expect(json).toHaveBeenCalledWith({ ok: true, data: [] });
    expect(next).not.toHaveBeenCalled();
    listSpy.mockRestore();
  });

  test("allows finance manager reference reads while preserving role and center scope", async () => {
    const context = await createTaizFinanceContext();
    const secondTeacher = await financeTestPrisma.user.create({
      data: {
        organizationId: context.organization.id,
        role: Role.TEACHER,
        email: "second-teacher@finance-test.invalid",
        username: "finance_test_second_teacher",
        fullName: "معلم المركز الثاني",
        isActive: true
      }
    });
    await financeTestPrisma.userCenterAccess.create({
      data: { userId: secondTeacher.id, centerId: context.centers[1].id }
    });

    await expect(orgService.listCenters(context.scopes.manager, {})).resolves.toHaveLength(
      context.centers.length
    );
    await expect(orgService.listCenters(context.scopes.supervisor, {})).resolves.toEqual([
      expect.objectContaining({ id: context.centers[0].id })
    ]);

    await expect(
      usersService.listUsers(context.scopes.manager, { role: Role.TEACHER })
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: context.users.teacher.id }),
        expect.objectContaining({ id: secondTeacher.id })
      ])
    );
    await expect(usersService.listUsers(context.scopes.manager, {})).rejects.toMatchObject({
      code: "FINANCE_USER_READ_SCOPE_DENIED"
    });
    await expect(
      usersService.listUsers(context.scopes.supervisor, { role: Role.TEACHER })
    ).resolves.toEqual([expect.objectContaining({ id: context.users.teacher.id })]);
  });

  test("finance reference routes allow managers and deny parents and students", () => {
    const invoke = (roles: Role[], role: Role) => {
      const next = jest.fn();
      requireRoles(roles)(
        { auth: { role }, path: "/reference", method: "GET" } as never,
        {} as never,
        next
      );
      return next;
    };

    expect(invoke(centerReadRoles, Role.FINANCE_MANAGER)).toHaveBeenCalledWith();
    expect(invoke(usersReadRoles, Role.FINANCE_MANAGER)).toHaveBeenCalledWith();

    for (const role of [Role.PARENT, Role.STUDENT]) {
      expect(invoke(centerReadRoles, role).mock.calls[0][0]).toMatchObject({ statusCode: 403 });
      expect(invoke(usersReadRoles, role).mock.calls[0][0]).toMatchObject({ statusCode: 403 });
    }
  });

  test("center funding responses disable conditional browser caching", () => {
    const headers: Record<string, string> = {};
    const req: {
      headers: Record<string, string>;
    } = {
      headers: {
        "if-none-match": "cached-etag",
        "if-modified-since": "Mon, 01 Jan 2024 00:00:00 GMT"
      }
    };
    const res = {
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      }
    } as never;
    const next = jest.fn();

    disableConditionalCache(req as never, res, next);

    expect(req.headers).not.toHaveProperty("if-none-match");
    expect(req.headers).not.toHaveProperty("if-modified-since");
    expect(headers["Cache-Control"]).toBe("no-store, no-cache, must-revalidate");
    expect(next).toHaveBeenCalledWith();
  });
});

