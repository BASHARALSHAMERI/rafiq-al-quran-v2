import {
  FeeMode,
  DonationStatus,
  DonorType,
  FinanceAccountType,
  FinanceMovementType,
  FundTransferStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PayrollBatchStatus,
  RewardBatchStatus,
  RewardBeneficiaryRole,
  RewardCycle,
  RewardType,
  VoucherAccountingCategory,
  VoucherSourceType,
  VoucherStatus,
  VoucherType
} from "@prisma/client";
import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();
const optionalPositiveInt = positiveInt.optional();
const pageSchema = z.coerce.number().int().positive().optional();
const pageSizeSchema = z.coerce.number().int().positive().max(100).optional();

// FA-UX-4B: Optional currency fields shared by Donation/Voucher create payloads.
// All three remain optional for backward compatibility; cross-field validation
// (e.g. foreign currency requires originalAmount + exchangeRateToBase) happens
// in the service layer where the Currency table is consulted.
const currencyCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "رمز العملة يجب أن يكون 3 أحرف")
  .transform((value) => value.toUpperCase());
const optionalOriginalAmount = z.coerce.number().positive().max(100000000).optional();
const optionalCurrencyCode = currencyCodeSchema.optional();
const optionalExchangeRate = z.coerce.number().positive().max(1_000_000).optional();

export const financeV2EntityIdParamSchema = z
  .object({
    id: positiveInt
  })
  .strict();

export const policyEffectiveQuerySchema = z
  .object({
    centerId: optionalPositiveInt
  })
  .strict();

export const patchPolicyBodySchema = z
  .object({
    feesEnabled: z.boolean().optional(),
    requireTransferAttachment: z.boolean().optional(),
    requireApprovalDisbursement: z.boolean().optional(),
    requireApprovalReceipt: z.boolean().optional(),
    allowFreeStudents: z.boolean().optional(),
    allowSymbolicOneTimeFee: z.boolean().optional(),
    allowOverdraft: z.boolean().optional()
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "حقل سياسة واحد على الأقل مطلوب"
  });

export const listStudentFeeProfilesQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    studentId: optionalPositiveInt,
    feeMode: z.nativeEnum(FeeMode).optional(),
    isActive: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((value) => (typeof value === "boolean" ? value : value === "true"))
      .optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const createStudentFeeProfileBodySchema = z
  .object({
    centerId: positiveInt,
    studentId: positiveInt,
    feeMode: z.nativeEnum(FeeMode),
    tuitionPlanId: optionalPositiveInt,
    symbolicAmount: z.coerce.number().positive().max(100000000).optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().trim().min(1),
    endDate: z.string().trim().min(1).optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict();

export const updateStudentFeeProfileBodySchema = z
  .object({
    feeMode: z.nativeEnum(FeeMode).optional(),
    tuitionPlanId: positiveInt.nullable().optional(),
    symbolicAmount: z.coerce.number().positive().max(100000000).nullable().optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().trim().min(1).optional(),
    endDate: z.string().trim().min(1).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional()
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "حقل واحد على الأقل مطلوب"
  });

export const listInvoicesV2QuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    studentId: optionalPositiveInt,
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
    invoiceType: z.nativeEnum(InvoiceType).optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const createInvoiceV2BodySchema = z
  .object({
    studentId: positiveInt,
    centerId: positiveInt,
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
    invoiceType: z.nativeEnum(InvoiceType).optional(),
    amount: z.coerce.number().positive().max(100000000),
    issuedAt: z.string().trim().min(1).optional(),
    dueDate: z.string().trim().min(1).optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict();

export const cancelInvoiceV2BodySchema = z
  .object({
    reason: z.string().trim().min(3).max(500)
  })
  .strict();

export const createPaymentV2BodySchema = z
  .object({
    invoiceId: positiveInt,
    amount: z.coerce.number().positive().max(100000000),
    method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
    receivedAt: z.string().trim().min(1).optional(),
    attachmentStorageKey: z.string().trim().max(255).optional(),
    externalTransferRef: z.string().trim().max(120).optional()
  })
  .strict();

export const listVouchersQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    accountId: optionalPositiveInt,
    status: z.nativeEnum(VoucherStatus).optional(),
    voucherType: z.nativeEnum(VoucherType).optional(),
    sourceType: z.nativeEnum(VoucherSourceType).optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

const RECEIPT_CATEGORIES: VoucherAccountingCategory[] = [
  VoucherAccountingCategory.DONATION,
  VoucherAccountingCategory.STUDENT_CONTRIBUTION,
  VoucherAccountingCategory.OTHER_INCOME
];

const DISBURSEMENT_CATEGORIES: VoucherAccountingCategory[] = [
  VoucherAccountingCategory.OPERATING_EXPENSE,
  VoucherAccountingCategory.EDUCATIONAL_EXPENSE,
  VoucherAccountingCategory.CENTER_EXPENSE,
  VoucherAccountingCategory.REWARD
];

export const createVoucherBodySchema = z
  .object({
    centerId: optionalPositiveInt,
    accountId: positiveInt,
    voucherType: z.nativeEnum(VoucherType),
    sourceType: z.nativeEnum(VoucherSourceType).optional(),
    sourceId: optionalPositiveInt,
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    amount: z.coerce.number().positive().max(100000000),
    // FA-UX-4B: optional currency fields. amount must remain the YER base amount.
    originalAmount: optionalOriginalAmount,
    originalCurrencyCode: optionalCurrencyCode,
    exchangeRateToBase: optionalExchangeRate,
    accountingCategory: z.nativeEnum(VoucherAccountingCategory).optional(),
    voucherDate: z.coerce.date().optional(),
    attachmentStorageKey: z.string().trim().max(255).optional(),
    externalTransferRef: z.string().trim().max(120).optional(),
    manualReferenceNo: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict()
  .refine(
    (data) => {
      if (!data.accountingCategory) return true;
      if (data.voucherType === VoucherType.RECEIPT) {
        return RECEIPT_CATEGORIES.includes(data.accountingCategory);
      }
      if (data.voucherType === VoucherType.DISBURSEMENT) {
        return DISBURSEMENT_CATEGORIES.includes(data.accountingCategory);
      }
      return true;
    },
    { message: "التصنيف المحاسبي لا يتطابق مع نوع السند", path: ["accountingCategory"] }
  );

export const listDonorsQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    isActive: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((value) => (typeof value === "boolean" ? value : value === "true"))
      .optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const createDonorBodySchema = z
  .object({
    centerId: optionalPositiveInt.nullable(),
    name: z.string().trim().min(2).max(180),
    donorType: z.nativeEnum(DonorType),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email().max(180).optional(),
    address: z.string().trim().max(255).optional(),
    contactPerson: z.string().trim().max(180).optional(),
    notes: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const updateDonorBodySchema = createDonorBodySchema.partial().strict();

export const listDonationsQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    donorId: optionalPositiveInt,
    status: z.nativeEnum(DonationStatus).optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const createDonationBodySchema = z
  .object({
    centerId: optionalPositiveInt.nullable(),
    donorId: positiveInt,
    amount: z.coerce.number().positive().max(100000000).optional(),
    // FA-UX-4B: optional currency fields. amount (when provided) must equal the YER base amount.
    originalAmount: optionalOriginalAmount,
    originalCurrencyCode: optionalCurrencyCode,
    exchangeRateToBase: optionalExchangeRate,
    donationDate: z.string().trim().min(1),
    paymentMethod: z.nativeEnum(PaymentMethod),
    purpose: z.string().trim().max(255).optional(),
    status: z.nativeEnum(DonationStatus).optional(),
    isPledge: z.boolean().optional(),
    pledgeDueDate: z.string().trim().min(1).optional(),
    receivedDate: z.string().trim().min(1).optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict()
  .refine(
    (data) => data.amount !== undefined || data.originalAmount !== undefined,
    { message: "المبلغ أو المبلغ الأصلي مطلوب", path: ["amount"] }
  );

export const receiveDonationBodySchema = z
  .object({
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    receivedDate: z.string().trim().min(1).optional(),
    // FA-UX-4B: optional override of the exchange rate when the pledge was made
    // in a foreign currency and the rate at receipt time differs.
    exchangeRateToBase: optionalExchangeRate,
    notes: z.string().trim().max(500).optional()
  })
  .strict();

export const transitionCommentBodySchema = z
  .object({
    comment: z.string().trim().max(500).optional(),
    reason: z.string().trim().max(500).optional()
  })
  .strict();

export const listAccountsQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    accountType: z.nativeEnum(FinanceAccountType).optional(),
    isActive: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((value) => (typeof value === "boolean" ? value : value === "true"))
      .optional()
  })
  .strict();

export const listAccountMovementsQuerySchema = z
  .object({
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    movementType: z.nativeEnum(FinanceMovementType).optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const updateFinanceAccountLedgerBodySchema = z
  .object({
    accountingAccountId: positiveInt
  })
  .strict();

export const createFundTransferBodySchema = z
  .object({
    fromAccountId: positiveInt,
    toAccountId: positiveInt,
    amount: z.coerce.number().positive().max(100000000),
    notes: z.string().trim().max(500).optional()
  })
  .strict();

export const listFundTransfersQuerySchema = z
  .object({
    status: z.nativeEnum(FundTransferStatus).optional(),
    centerId: optionalPositiveInt,
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const listPayrollProfilesQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    userId: optionalPositiveInt,
    isActive: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((value) => (typeof value === "boolean" ? value : value === "true"))
      .optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const createPayrollProfileBodySchema = z
  .object({
    centerId: optionalPositiveInt,
    userId: positiveInt,
    salaryGradeId: optionalPositiveInt,
    salarySource: z.enum(["GRADE", "OVERRIDE"]).optional(),
    overrideReason: z.string().trim().max(500).optional(),
    monthlyBaseAmount: z.coerce.number().positive().max(100000000),
    salaryCurrencyCode: currencyCodeSchema.optional(),
    paymentMethodDefault: z.nativeEnum(PaymentMethod).optional(),
    bankAccountNumber: z.string().trim().min(3).max(80).optional(),
    bankName: z.string().trim().min(2).max(120).optional(),
    iban: z.string().trim().min(5).max(34).optional(),
    effectiveFrom: z.string().trim().min(1),
    effectiveTo: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict();

export const updatePayrollProfileBodySchema = z
  .object({
    salaryGradeId: optionalPositiveInt,
    salarySource: z.enum(["GRADE", "OVERRIDE"]).optional(),
    overrideReason: z.string().trim().max(500).nullable().optional(),
    monthlyBaseAmount: z.coerce.number().positive().max(100000000).optional(),
    salaryCurrencyCode: currencyCodeSchema.optional(),
    paymentMethodDefault: z.nativeEnum(PaymentMethod).optional(),
    bankAccountNumber: z.string().trim().min(3).max(80).nullable().optional(),
    bankName: z.string().trim().min(2).max(120).nullable().optional(),
    iban: z.string().trim().min(5).max(34).nullable().optional(),
    effectiveFrom: z.string().trim().min(1).optional(),
    effectiveTo: z.string().trim().min(1).nullable().optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(500).nullable().optional()
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "حقل واحد على الأقل مطلوب"
  });

export const listPayrollBatchesQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    periodYear: z.coerce.number().int().min(2000).max(2100).optional(),
    periodMonth: z.coerce.number().int().min(1).max(12).optional(),
    status: z.nativeEnum(PayrollBatchStatus).optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const createPayrollBatchBodySchema = z
  .object({
    centerId: optionalPositiveInt,
    periodYear: z.coerce.number().int().min(2000).max(2100),
    periodMonth: z.coerce.number().int().min(1).max(12)
  })
  .strict();

export const payPayrollBatchBodySchema = z
  .object({
    payments: z.array(
      z
        .object({
          itemId: positiveInt,
          method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
          manualReferenceNo: z.string().trim().max(120).optional(),
          attachmentStorageKey: z.string().trim().max(255).optional(),
          externalTransferRef: z.string().trim().max(120).optional()
        })
        .strict()
    )
      .min(1)
      .max(500)
  })
  .strict();

export const failPayrollItemBodySchema = z
  .object({
    failureReason: z.string().trim().min(1).max(500)
  })
  .strict();

export const listRewardProfilesQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    beneficiaryUserId: optionalPositiveInt,
    cycle: z.nativeEnum(RewardCycle).optional(),
    rewardType: z.nativeEnum(RewardType).optional(),
    isActive: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((value) => (typeof value === "boolean" ? value : value === "true"))
      .optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const createRewardProfileBodySchema = z
  .object({
    centerId: optionalPositiveInt,
    beneficiaryUserId: positiveInt,
    beneficiaryRole: z.nativeEnum(RewardBeneficiaryRole),
    cycle: z.nativeEnum(RewardCycle),
    rewardType: z.nativeEnum(RewardType).optional(),
    defaultAmount: z.coerce.number().positive().max(100000000),
    effectiveFrom: z.string().trim().min(1),
    effectiveTo: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict();

export const listRewardBatchesQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    cycle: z.nativeEnum(RewardCycle).optional(),
    rewardType: z.nativeEnum(RewardType).optional(),
    periodYear: z.coerce.number().int().min(2000).max(2100).optional(),
    periodMonth: z.coerce.number().int().min(1).max(12).optional(),
    periodQuarter: z.coerce.number().int().min(1).max(4).optional(),
    status: z.nativeEnum(RewardBatchStatus).optional(),
    page: pageSchema,
    pageSize: pageSizeSchema
  })
  .strict();

export const createRewardBatchBodySchema = z
  .object({
    centerId: optionalPositiveInt,
    cycle: z.nativeEnum(RewardCycle),
    rewardType: z.nativeEnum(RewardType).optional(),
    periodYear: z.coerce.number().int().min(2000).max(2100),
    periodMonth: z.coerce.number().int().min(1).max(12).optional(),
    periodQuarter: z.coerce.number().int().min(1).max(4).optional()
  })
  .strict();

export const payRewardBatchBodySchema = z
  .object({
    payments: z.array(
      z
        .object({
          itemId: positiveInt,
          method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
          manualReferenceNo: z.string().trim().max(120).optional(),
          attachmentStorageKey: z.string().trim().max(255).optional(),
          externalTransferRef: z.string().trim().max(120).optional()
        })
        .strict()
    )
      .min(1)
      .max(500)
  })
  .strict();

export const failRewardItemBodySchema = z
  .object({
    failureReason: z.string().trim().min(1).max(500)
  })
  .strict();

export const reportsDashboardQuerySchema = z
  .object({
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    centerId: optionalPositiveInt
  })
  .strict();

export const cashflowReportQuerySchema = z
  .object({
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    centerId: optionalPositiveInt,
    accountId: optionalPositiveInt,
    movementType: z.nativeEnum(FinanceMovementType).optional()
  })
  .strict();

export const payrollReportQuerySchema = z
  .object({
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    centerId: optionalPositiveInt,
    status: z.nativeEnum(PayrollBatchStatus).optional()
  })
  .strict();

export const rewardsReportQuerySchema = z
  .object({
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    centerId: optionalPositiveInt,
    status: z.nativeEnum(RewardBatchStatus).optional()
  })
  .strict();

export const vouchersReportQuerySchema = z
  .object({
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    centerId: optionalPositiveInt,
    status: z.nativeEnum(VoucherStatus).optional(),
    voucherType: z.nativeEnum(VoucherType).optional()
  })
  .strict();

export const invoiceAgingReportQuerySchema = z
  .object({
    asOf: z.string().trim().min(1).optional(),
    centerId: optionalPositiveInt
  })
  .strict();

export const createCurrencyBodySchema = z
  .object({
    code: currencyCodeSchema,
    nameAr: z.string().trim().min(1).max(60).optional(),
    nameEn: z.string().trim().min(1).max(60).optional(),
    symbol: z.string().trim().min(1).max(10).optional(),
    decimalPlaces: z.coerce.number().int().min(0).max(6).optional(),
    isBase: z.boolean().optional().default(false),
    isActive: z.boolean().optional()
  })
  .strict();

export const updateCurrencyBodySchema = z
  .object({
    nameAr: z.string().trim().min(1).max(60).optional(),
    nameEn: z.string().trim().min(1).max(60).optional(),
    symbol: z.string().trim().min(1).max(10).optional(),
    decimalPlaces: z.coerce.number().int().min(0).max(6).optional(),
    isBase: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "حقل عملة واحد على الأقل مطلوب"
  });

export const listExchangeRatesQuerySchema = z
  .object({
    currencyCode: optionalCurrencyCode
  })
  .strict();

export const latestExchangeRateQuerySchema = z
  .object({
    currencyCode: currencyCodeSchema
  })
  .strict();

export const createExchangeRateBodySchema = z
  .object({
    currencyCode: currencyCodeSchema,
    rateToBase: z.coerce.number().positive().max(1_000_000),
    effectiveDate: z.string().trim().min(1),
    source: z.string().trim().max(60).optional(),
    notes: z.string().trim().max(255).optional()
  })
  .strict();

export const listSalaryGradesQuerySchema = z
  .object({
    centerId: optionalPositiveInt,
    isActive: z.coerce.boolean().optional()
  })
  .strict();

export const createSalaryGradeBodySchema = z
  .object({
    centerId: optionalPositiveInt,
    jobTitle: z.string().trim().min(1).max(120),
    gradeLevel: z.string().trim().min(1).max(60),
    baseSalary: z.coerce.number().positive().max(100000000),
    currencyCode: currencyCodeSchema.optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict();

export const updateSalaryGradeBodySchema = z
  .object({
    jobTitle: z.string().trim().min(1).max(120).optional(),
    gradeLevel: z.string().trim().min(1).max(60).optional(),
    baseSalary: z.coerce.number().positive().max(100000000).optional(),
    currencyCode: currencyCodeSchema.optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict();
