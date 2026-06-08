import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { financeSettingsService } from "./services/finance-settings.service";
import { billingService } from "./services/billing.service";
import { accountingService } from "./services/accounting.service";
import { payrollService } from "./services/payroll.service";
import { rewardsService } from "./services/rewards.service";
import { financeReportsService } from "./services/finance-reports.service";
import { donorsService } from "./services/donors.service";
import * as currenciesService from "./services/currencies.service";

export const financeV2Controller = {
  getEffectivePolicy: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const query = res.locals.validatedQuery as { centerId?: number };
      const data = await financeSettingsService.getEffectivePolicy(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  patchOrganizationPolicy: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeSettingsService.patchOrganizationPolicy(req.scope, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  patchCenterPolicy: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await financeSettingsService.patchCenterPolicy(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listStudentFeeProfiles: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const query = res.locals.validatedQuery as {
        centerId?: number;
        studentId?: number;
        feeMode?: import("@prisma/client").FeeMode;
        isActive?: boolean;
        page?: number;
        pageSize?: number;
      };
      const data = await billingService.listStudentFeeProfiles(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createStudentFeeProfile: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await billingService.createStudentFeeProfile(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateStudentFeeProfile: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await billingService.updateStudentFeeProfile(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listInvoices: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await billingService.listInvoices(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createInvoice: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await billingService.createInvoice(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  cancelInvoice: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await billingService.cancelInvoice(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listInvoicePayments: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await billingService.listInvoicePayments(req.scope, params.id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createPayment: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const key = req.header("X-Idempotency-Key") ?? req.header("x-idempotency-key");
      const data = await billingService.createPayment(req.scope, req.body, key);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listVouchers: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await accountingService.listVouchers(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createVoucher: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await accountingService.createVoucher(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  submitVoucher: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.submitVoucher(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveVoucher: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.approveVoucher(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  rejectVoucher: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.rejectVoucher(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  postVoucher: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.postVoucher(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  requestVoucherVoid: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.requestVoucherVoid(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveVoucherVoid: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.approveVoucherVoid(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listDonors: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await donorsService.listDonors(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createDonor: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await donorsService.createDonor(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getDonor: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await donorsService.getDonor(req.scope, params.id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateDonor: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await donorsService.updateDonor(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listDonations: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await donorsService.listDonations(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createDonation: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await donorsService.createDonation(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  receiveDonation: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await donorsService.receiveDonation(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listAccounts: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await accountingService.listAccounts(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listAccountMovements: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.listAccountMovements(
        req.scope,
        params.id,
        res.locals.validatedQuery
      );
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateAccountLedgerAccount: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.updateAccountLedgerAccount(
        req.scope,
        params.id,
        req.body
      );
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listFundTransfers: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await accountingService.listFundTransfers(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createFundTransfer: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await accountingService.createFundTransfer(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  submitFundTransfer: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.submitFundTransfer(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveFundTransfer: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.approveFundTransfer(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  postFundTransfer: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.postFundTransfer(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listPayrollProfiles: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await payrollService.listPayrollProfiles(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createPayrollProfile: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await payrollService.createPayrollProfile(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updatePayrollProfile: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await payrollService.updatePayrollProfile(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listPayrollBatches: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await payrollService.listPayrollBatches(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createPayrollBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await payrollService.createPayrollBatch(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  submitPayrollBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await payrollService.submitPayrollBatch(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approvePayrollBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await payrollService.approvePayrollBatch(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  rejectPayrollBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await payrollService.rejectPayrollBatch(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  payPayrollBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await payrollService.payPayrollBatch(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  failPayrollItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await payrollService.failPayrollItem(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listRewardProfiles: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await rewardsService.listRewardProfiles(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createRewardProfile: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await rewardsService.createRewardProfile(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listRewardBatches: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await rewardsService.listRewardBatches(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createRewardBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await rewardsService.createRewardBatch(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  submitRewardBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await rewardsService.submitRewardBatch(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveRewardBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await rewardsService.approveRewardBatch(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  rejectRewardBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await rewardsService.rejectRewardBatch(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  payRewardBatch: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await rewardsService.payRewardBatch(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  failRewardItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await rewardsService.failRewardItem(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listPendingApprovals: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.listPendingApprovals(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reportDashboard: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportDashboard(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reportCashflow: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportCashflow(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reportPayroll: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportPayroll(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reportRewards: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportRewards(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reportVouchers: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportVouchers(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reportInvoiceAging: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportInvoiceAging(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reportFinancialPosition: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportFinancialPosition(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reportStatementOfActivities: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportStatementOfActivities(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  // FA-UX-4: Currencies
  listCurrencies: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await currenciesService.listCurrencies(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getAvailablePredefinedCurrencies: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await currenciesService.getAvailablePredefinedCurrencies(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createCurrency: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await currenciesService.createCurrency(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateCurrency: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const params = res.locals.validatedParams as { id: number };
      const data = await currenciesService.updateCurrency(req.scope, params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  // FA-UX-4: Exchange Rates
  listExchangeRates: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const query = res.locals.validatedQuery as { currencyCode?: string };
      const data = await currenciesService.listExchangeRates(req.scope, query.currencyCode);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getLatestExchangeRate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const query = res.locals.validatedQuery as { currencyCode: string };
      const data = await currenciesService.getLatestExchangeRate(req.scope, query.currencyCode);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createExchangeRate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await currenciesService.createExchangeRate(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getBaseCurrency: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await currenciesService.getBaseCurrency(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listSalaryGrades: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const data = await payrollService.listSalaryGrades(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createSalaryGrade: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const data = await payrollService.createSalaryGrade(req.scope, req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateSalaryGrade: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const data = await payrollService.updateSalaryGrade(
        req.scope,
        Number(req.params.id),
        req.body
      );
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  // HR-PAYROLL-UX-COMPLETE: eligible employees for payroll profile creation
  getEligibleEmployees: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = req.query as { centerId?: string; search?: string };
      const data = await payrollService.getEligibleEmployees(req.scope, {
        centerId: query.centerId ? Number(query.centerId) : undefined,
        search: query.search
      });
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  // FA-CENTER-FINANCIAL-TRACKING-1: ملخص تمويل وتكلفة المراكز
  reportCenterFundingSummary: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }
      const data = await financeReportsService.reportCenterFundingSummary(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
