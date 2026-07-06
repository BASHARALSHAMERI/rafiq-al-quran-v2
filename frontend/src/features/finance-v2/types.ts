export type InvoiceStatusV2 = "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
export type PaymentMethodV2 = "CASH" | "TRANSFER";
export type FundTransferStatusV2 =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "POSTED"
  | "CANCELLED";
export type VoucherStatusV2 =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "POSTED"
  | "VOID_REQUESTED"
  | "VOIDED"
  | "CANCELLED";
export type VoucherTypeV2 = "RECEIPT" | "DISBURSEMENT";
export type RewardCycleV2 = "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type RewardTypeV2 = "GENERAL" | "PERFORMANCE" | "ATTENDANCE" | "COMPETITION" | "OTHER";
export type RewardBeneficiaryRoleV2 = "TEACHER" | "STUDENT";
export type PayrollBatchStatusV2 =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CLOSED"
  | "CANCELLED";
export type RewardBatchStatusV2 = PayrollBatchStatusV2;
export type PayrollItemStatusV2 = "PENDING" | "PAID" | "FAILED" | "VOIDED";
export type RewardItemStatusV2 = "PENDING" | "PAID" | "FAILED" | "VOIDED";
export type DonorTypeV2 =
  | "CHARITY_FOUNDATION"
  | "CHARITY_ASSOCIATION"
  | "INDIVIDUAL_DONOR"
  | "MERCHANT"
  | "PARENT_DONOR"
  | "GOVERNMENT_ENTITY"
  | "CORPORATE_SPONSOR";
export type DonationStatusV2 = "PLEDGED" | "RECEIVED" | "CANCELLED";
export type FixedAssetStatusV2 =
  | "ACTIVE"
  | "UNDER_MAINTENANCE"
  | "DISPOSED"
  | "LOST"
  | "INACTIVE";

export type FinanceInvoiceV2 = {
  id: number;
  studentId: number;
  centerId: number;
  month: number;
  year: number;
  amount: number;
  status: InvoiceStatusV2;
  issuedAt: string;
  dueDate?: string | null;
  totalPaid: number;
  remainingAmount: number;
  paymentsCount: number;
  notes?: string;
  invoiceType?: string;
  payments?: any[];
  student?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  center?: {
    id: number;
    name: string;
    code: string;
  };
};

export type FinancePaymentV2 = {
  id: number;
  invoiceId: number;
  amount: number;
  method: PaymentMethodV2;
  voucherId?: number | null;
  receivedById: number;
  receivedAt: string;
  createdAt: string;
  receivedBy?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  voucher?: {
    id: number;
    voucherNo: string;
    status: VoucherStatusV2;
    voucherType: VoucherTypeV2;
  };
};

export type TuitionPlanKindV2 = "MONTHLY" | "ONE_TIME_REGISTRATION" | "TERM" | "QUARTERLY" | "SEMESTERLY" | "HALF_YEARLY" | "YEARLY";

export type TuitionPlanV2 = {
  id: number;
  organizationId: number;
  centerId: number;
  name: string;
  monthlyAmount: number;
  isActive: boolean;
  planKind: TuitionPlanKindV2;
  createdAt: string;
  updatedAt: string;
  center?: { id: number; name: string; code: string };
};

export type StudentFeeProfileV2 = {
  id: number;
  organizationId: number;
  centerId: number;
  studentId: number;
  feeMode: "FREE" | "SYMBOLIC_ONE_TIME" | "PLAN_MONTHLY";
  tuitionPlanId?: number | null;
  symbolicAmount?: number | null;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  center?: { id: number; name: string; code: string };
  student?: { id: number; fullName: string; role: string; email: string };
  tuitionPlan?: { id: number; name: string; monthlyAmount: number; planKind: string };
};

export type FinancePolicyProfileV2 = {
  feesEnabled?: boolean;
  requireTransferAttachment: boolean;
  requireApprovalDisbursement: boolean;
  requireApprovalReceipt: boolean;
  allowFreeStudents: boolean;
  allowSymbolicOneTimeFee: boolean;
  allowOverdraft: boolean;
};

export type FinancePolicyV2 = {
  organizationId: number;
  centerId: number | null;
  effective: FinancePolicyProfileV2;
  organizationPolicy: FinancePolicyProfileV2 | null;
  centerPolicy: FinancePolicyProfileV2 | null;
};

export type FinanceVoucherV2 = {
  id: number;
  accountId?: number;
  centerId?: number | null;
  voucherNo: string;
  voucherType: VoucherTypeV2;
  status: VoucherStatusV2;
  amount: number;
  // FA-UX-4B: optional currency fields. amount stays in YER base.
  originalAmount?: number | null;
  originalCurrencyCode?: string | null;
  exchangeRateToBase?: number | null;
  accountingCategory?: string | null;
  paymentMethod?: PaymentMethodV2 | null;
  externalTransferRef?: string | null;
  description?: string | null;
  beneficiary?: string | null;
  notes?: string | null;
  voucherDate?: string | null;
  createdAt: string;
  postedAt?: string | null;
  sourceType: "GENERAL" | "PAYMENT" | "PAYROLL" | "REWARD" | "TRANSFER";
  sourceId?: number | null;
  center?: {
    id: number;
    name: string;
    code: string;
  };
};

export type FinanceDonorV2 = {
  id: number;
  organizationId: number;
  centerId?: number | null;
  name: string;
  donorType: DonorTypeV2;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  center?: {
    id: number;
    name: string;
    code: string;
  } | null;
  donations?: Array<{
    id: number;
    amount: number;
    status: DonationStatusV2;
  }>;
};

export type FinanceDonationV2 = {
  id: number;
  organizationId: number;
  centerId?: number | null;
  donorId: number;
  amount: number;
  // FA-UX-4B: optional currency fields. amount stays in YER base.
  originalAmount?: number | null;
  originalCurrencyCode?: string | null;
  exchangeRateToBase?: number | null;
  donationDate: string;
  paymentMethod: PaymentMethodV2;
  purpose?: string | null;
  status: DonationStatusV2;
  isPledge: boolean;
  pledgeDueDate?: string | null;
  receivedDate?: string | null;
  voucherId?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  donor?: {
    id: number;
    name: string;
    donorType: DonorTypeV2;
    phone?: string | null;
  };
  center?: {
    id: number;
    name: string;
    code: string;
  } | null;
  voucher?: {
    id: number;
    voucherNo: string;
    status: VoucherStatusV2;
    voucherType: VoucherTypeV2;
    accountingCategory?: string | null;
  } | null;
};

export type FinanceFundTransferV2 = {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  fromCenterId?: number | null;
  toCenterId?: number | null;
  amount: number;
  status: FundTransferStatusV2;
  requestedById: number;
  approvedById?: number | null;
  voucherOutId?: number | null;
  voucherInId?: number | null;
  notes?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  postedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  fromAccount?: {
    id: number;
    accountType: "ORG_FUND" | "CENTER_FUND";
    centerId?: number | null;
    currentBalance: number;
    currencyCode: string;
  };
  toAccount?: {
    id: number;
    accountType: "ORG_FUND" | "CENTER_FUND";
    centerId?: number | null;
    currentBalance: number;
    currencyCode: string;
  };
  fromCenter?: {
    id: number;
    name: string;
    code: string;
  };
  toCenter?: {
    id: number;
    name: string;
    code: string;
  };
  requestedBy?: {
    id: number;
    fullName: string;
    role: string;
  };
  approvedBy?: {
    id: number;
    fullName: string;
    role: string;
  };
  voucherOut?: {
    id: number;
    voucherNo: string;
    status: VoucherStatusV2;
  };
  voucherIn?: {
    id: number;
    voucherNo: string;
    status: VoucherStatusV2;
  };
};

export type FinanceAccountV2 = {
  id: number;
  centerId?: number | null;
  accountingAccountId?: number | null;
  accountType: "ORG_FUND" | "CENTER_FUND" | "ORG_BANK" | "CENTER_BANK";
  currentBalance: number;
  balance?: number;
  name?: string;
  openingBalance: number;
  currencyCode: string;
  isActive: boolean;
  center?: {
    id: number;
    name: string;
    code: string;
  };
  accountingAccount?: {
    id: number;
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "NET_ASSET" | "REVENUE" | "EXPENSE";
  } | null;
};

export type PayrollBatchV2 = {
  id: number;
  centerId?: number | null;
  periodYear: number;
  periodMonth: number;
  status: PayrollBatchStatusV2;
  totalItems: number;
  totalNetAmount: number;
  approvedById?: number | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: PayrollItemV2[];
  center?: {
    id: number;
    name: string;
    code: string;
  };
  approvedBy?: { id: number; fullName: string; role: string } | null;
};

export type PayrollItemV2 = {
  id: number;
  beneficiaryUserId: number;
  baseAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  deductionEventIds?: number[] | null;
  netAmount: number;
  originalAmount?: number | null;
  originalCurrencyCode?: string | null;
  exchangeRateToBase?: number | null;
  status: PayrollItemStatusV2;
  paymentMethod?: PaymentMethodV2 | null;
  paymentReference?: string | null;
  failureReason?: string | null;
  notes?: string | null;
  voucherId?: number | null;
  paidAt?: string | null;
  beneficiary?: {
    id: number;
    fullName: string;
    role: string;
  };
  voucher?: {
    id: number;
    voucherNo: string;
    status: string;
  } | null;
};

export type SalarySourceV2 = "GRADE" | "OVERRIDE";

export type PayrollProfileV2 = {
  id: number;
  centerId?: number | null;
  userId: number;
  salaryGradeId?: number | null;
  salarySource?: SalarySourceV2;
  overrideReason?: string | null;
  approvedById?: number | null;
  approvedAt?: string | null;
  monthlyBaseAmount: number;
  salaryCurrencyCode: string;
  paymentMethodDefault?: PaymentMethodV2 | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  iban?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  center?: { id: number; name: string; code: string } | null;
  user?: { id: number; fullName: string; role: string; email: string };
  salaryGrade?: SalaryGradeV2 | null;
  approvedBy?: { id: number; fullName: string } | null;
};

export type RewardBatchV2 = {
  id: number;
  centerId?: number | null;
  cycle: RewardCycleV2;
  rewardType?: RewardTypeV2 | null;
  periodYear: number;
  periodMonth?: number | null;
  periodQuarter?: number | null;
  status: RewardBatchStatusV2;
  totalItems: number;
  totalAmount: number;
  approvedById?: number | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: RewardItemV2[];
  center?: {
    id: number;
    name: string;
    code: string;
  };
  approvedBy?: { id: number; fullName: string; role: string } | null;
};

export type RewardItemV2 = {
  id: number;
  beneficiaryUserId: number;
  beneficiaryRole: RewardBeneficiaryRoleV2;
  centerId: number;
  circleId?: number | null;
  amount: number;
  rankInCircle?: number | null;
  rewardType?: RewardTypeV2 | null;
  status: RewardItemStatusV2;
  paymentMethod?: PaymentMethodV2 | null;
  paymentReference?: string | null;
  failureReason?: string | null;
  notes?: string | null;
  voucherId?: number | null;
  paidAt?: string | null;
  beneficiary?: {
    id: number;
    fullName: string;
    role: string;
  };
  center?: {
    id: number;
    name: string;
    code: string;
  };
  circle?: {
    id: number;
    name: string;
  };
  voucher?: {
    id: number;
    voucherNo: string;
    status: string;
  } | null;
};

export type RewardProfileV2 = {
  id: number;
  centerId?: number | null;
  beneficiaryUserId: number;
  beneficiaryRole: RewardBeneficiaryRoleV2;
  cycle: RewardCycleV2;
  rewardType?: RewardTypeV2 | null;
  defaultAmount: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  notes?: string | null;
  center?: {
    id: number;
    name: string;
    code: string;
  };
  beneficiary?: {
    id: number;
    fullName: string;
    role: string;
    email: string;
  };
};

export type PendingApprovalsV2 = {
  counts: {
    vouchers: number;
    transfers: number;
    payrollBatches: number;
    rewardBatches: number;
    total: number;
  };
  vouchers?: FinanceVoucherV2[];
  transfers?: FinanceFundTransferV2[];
  payrollBatches?: PayrollBatchV2[];
  rewardBatches?: RewardBatchV2[];
};

export type PaginatedRows<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type FinanceInvoicesV2Query = {
  centerId?: number;
  studentId?: number;
  month?: number;
  year?: number;
  status?: InvoiceStatusV2;
  page?: number;
  pageSize?: number;
};

export type FinanceDonorsV2Query = {
  centerId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
};

export type FinanceDonationsV2Query = {
  centerId?: number;
  donorId?: number;
  status?: DonationStatusV2;
  page?: number;
  pageSize?: number;
};

export type CreateFinanceDonorV2Payload = {
  centerId?: number | null;
  name: string;
  donorType: DonorTypeV2;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive?: boolean;
};

export type CreateFinanceDonationV2Payload = {
  centerId?: number | null;
  donorId: number;
  amount?: number;
  // FA-UX-4B: optional currency fields.
  originalAmount?: number;
  originalCurrencyCode?: string;
  exchangeRateToBase?: number;
  donationDate: string;
  paymentMethod: PaymentMethodV2;
  purpose?: string;
  status?: DonationStatusV2;
  isPledge?: boolean;
  pledgeDueDate?: string;
  receivedDate?: string;
  notes?: string;
};

export type ReceiveFinanceDonationV2Payload = {
  paymentMethod?: PaymentMethodV2;
  receivedDate?: string;
  // FA-UX-4B: optional override of the rate at receipt time for a foreign-currency pledge.
  exchangeRateToBase?: number;
  notes?: string;
};

export type CreateFinanceInvoiceV2Payload = {
  studentId: number;
  centerId: number;
  month: number;
  year: number;
  amount: number;
  invoiceType?: "TUITION_MONTHLY" | "REGISTRATION_ONE_TIME" | "OTHER";
  issuedAt?: string;
  dueDate?: string;
  notes?: string;
};

export type CreateFinancePaymentV2Payload = {
  invoiceId: number;
  amount: number;
  method: PaymentMethodV2;
  manualReferenceNo?: string;
  notes?: string;
  receivedAt?: string;
  attachmentStorageKey?: string;
  externalTransferRef?: string;
  idempotencyKey?: string;
};

export type CreateFinanceVoucherV2Payload = {
  centerId?: number;
  accountId: number;
  voucherType: VoucherTypeV2;
  manualReferenceNo?: string;
  amount: number;
  // FA-UX-4B: optional currency fields. amount stays in YER base.
  originalAmount?: number;
  originalCurrencyCode?: string;
  exchangeRateToBase?: number;
  paymentMethod?: PaymentMethodV2;
  accountingCategory?: "DONATION" | "STUDENT_CONTRIBUTION" | "OTHER_INCOME" | "OPERATING_EXPENSE" | "EDUCATIONAL_EXPENSE" | "CENTER_EXPENSE" | "REWARD";
  attachmentStorageKey?: string;
  externalTransferRef?: string;
  description?: string;
  beneficiary?: string;
  voucherDate?: string;
  notes?: string;
};

export type CreateFundTransferV2Payload = {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  notes?: string;
};

export type CreatePayrollProfileV2Payload = {
  centerId?: number;
  userId: number;
  salaryGradeId?: number | null;
  salarySource?: SalarySourceV2;
  overrideReason?: string;
  monthlyBaseAmount: number;
  salaryCurrencyCode?: string;
  paymentMethodDefault?: PaymentMethodV2;
  bankAccountNumber?: string;
  bankName?: string;
  iban?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
  notes?: string;
};

export type CreatePayrollBatchV2Payload = {
  centerId?: number;
  periodYear: number;
  periodMonth: number;
};

export type CreateRewardProfileV2Payload = {
  centerId?: number;
  beneficiaryUserId: number;
  beneficiaryRole: RewardBeneficiaryRoleV2;
  cycle: RewardCycleV2;
  rewardType?: RewardTypeV2;
  defaultAmount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
  notes?: string;
};

export type CreateRewardBatchV2Payload = {
  centerId?: number;
  cycle: RewardCycleV2;
  rewardType?: RewardTypeV2;
  periodYear: number;
  periodMonth?: number;
  periodQuarter?: number;
};

export type FinanceReportDashboardV2 = {
  range?: { from: string; to: string } | null;
  kpis: {
    totalInvoicesCount: number;
    totalInvoiced: number;
    totalCollected: number;
    outstanding: number;
    collectionRate: number;
    totalCashBalance: number;
  };
};

export type FinanceReportCashflowV2 = {
  range?: { from: string; to: string } | null;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  rows: Array<{
    id: number;
    accountId: number;
    voucherId: number;
    movementType: string;
    direction: "IN" | "OUT";
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    postedAt: string;
  }>;
};

export type FinanceReportPayrollV2 = {
  rows: PayrollBatchV2[];
  kpis: {
    totalBatches: number;
    approvedPayroll: number;
    paidPayroll: number;
    executionRate: number;
  };
};

export type FinanceReportRewardsV2 = {
  rows: RewardBatchV2[];
  kpis: {
    totalBatches: number;
    approvedRewards: number;
    paidRewards: number;
    executionRate: number;
  };
};

export type FinanceReportVouchersV2 = {
  rows: FinanceVoucherV2[];
  kpis: {
    totalVouchers: number;
    receipts: number;
    disbursements: number;
  };
};

export type FinanceReportInvoiceAgingV2 = {
  asOf: string;
  rows: Array<FinanceInvoiceV2 & { daysPastDue: number; bucket: "0_30" | "31_60" | "61_PLUS" }>;
  kpis: {
    totalOutstanding: number;
    bucket0to30: number;
    bucket31to60: number;
    bucket61Plus: number;
  };
};

export type FinanceReportCenterFundingV2 = {
  rows: Array<{
    centerId: number;
    centerName: string;
    studentFees: number;
    donations: number;
    totalFunding: number;
    payrollCosts: number;
    operatingCosts: number;
    educationalCosts: number;
    totalCosts: number;
    fundingGap: number;
  }>;
  kpis: {
    totalFunding: number;
    totalCosts: number;
    netFundingGap: number;
  };
};

// FA-UX-4: Currencies
export type CurrencyV2 = {
  id: number;
  organizationId: number;
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PredefinedCurrencyV2 = {
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  decimalPlaces: number;
};

export type CreateCurrencyV2Payload = {
  code: string;
  nameAr?: string;
  nameEn?: string;
  symbol?: string;
  decimalPlaces?: number;
  isBase: boolean;
  isActive?: boolean;
};

export type ExchangeRateV2 = {
  id: number;
  organizationId: number;
  currencyCode: string;
  rateToBase: number;
  effectiveDate: string;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  currency?: CurrencyV2;
};

export type CreateExchangeRateV2Payload = {
  currencyCode: string;
  rateToBase: number;
  effectiveDate: string;
  source?: string;
  notes?: string;
};

export type SalaryGradeV2 = {
  id: number;
  organizationId: number;
  centerId?: number | null;
  jobTitle: string;
  gradeLevel: string;
  baseSalary: number;
  currencyCode: string;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSalaryGradeV2Payload = {
  centerId?: number;
  jobTitle: string;
  gradeLevel: string;
  baseSalary: number;
  currencyCode?: string;
  isActive?: boolean;
  notes?: string;
};

export type UpdateSalaryGradeV2Payload = Partial<CreateSalaryGradeV2Payload>;

// HR-PAYROLL-UX-COMPLETE: eligible employees for payroll profile creation
export type EligibleEmployeeV2 = {
  id: number;
  fullName: string;
  role: "TEACHER" | "SUPERVISOR" | "CENTER_ADMIN";
  phone?: string | null;
  username?: string | null;
  center?: { id: number; name: string } | null;
};

export type UpdatePayrollProfileV2Payload = {
  salaryGradeId?: number | null;
  salarySource?: SalarySourceV2;
  overrideReason?: string | null;
  monthlyBaseAmount?: number;
  salaryCurrencyCode?: string;
  paymentMethodDefault?: PaymentMethodV2;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  iban?: string | null;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  notes?: string | null;
};


export type SupplierV2 = {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
};

export type ExpenseCategoryV2 = {
  id: number;
  name: string;
  type?: string | null;
  accountingAccountId?: number | null;
  isActive: boolean;
  accountingAccount?: { id: number; name: string; code: string } | null;
};

export type ExpenseInvoiceV2 = {
  id: number;
  centerId?: number | null;
  supplierId?: number | null;
  categoryId: number;
  invoiceNo?: string | null;
  invoiceDate: string;
  dueDate?: string | null;
  description: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "PARTIALLY_PAID" | "PAID" | "VOIDED";
  supplier?: SupplierV2 | null;
  category?: ExpenseCategoryV2 | null;
  center?: { id: number; name: string } | null;
};

export type AssetCategoryV2 = {
  id: number;
  name: string;
  assetAccountId?: number | null;
  depreciationExpenseAccountId?: number | null;
  accumulatedDepreciationAccountId?: number | null;
  usefulLifeMonths?: number | null;
  isActive: boolean;
  assetAccount?: { id: number; code: string; name: string; type: string } | null;
  depreciationExpenseAccount?: { id: number; code: string; name: string; type: string } | null;
  accumulatedDepreciationAccount?: { id: number; code: string; name: string; type: string } | null;
};

export type FixedAssetV2 = {
  id: number;
  centerId?: number | null;
  categoryId: number;
  assetCode: string;
  name: string;
  description?: string | null;
  purchaseDate: string;
  purchaseCost: number;
  currentValue?: number | null;
  usefulLifeMonths?: number | null;
  status: FixedAssetStatusV2;
  location?: string | null;
  custodianUserId?: number | null;
  supplierId?: number | null;
  expenseInvoiceId?: number | null;
  acquisitionJournalEntryId?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: AssetCategoryV2;
  center?: { id: number; name: string; code?: string } | null;
  custodian?: { id: number; fullName: string; role: string; email?: string } | null;
  supplier?: { id: number; name: string } | null;
  expenseInvoice?: { id: number; invoiceNo?: string | null; description: string; amount: number; status: string } | null;
  acquisitionJournalEntry?: { id: number; entryNo: string } | null;
  depreciationEntries?: Array<{
    id: number;
    periodYear: number;
    periodMonth: number;
    amount: number;
    journalEntryId?: number | null;
  }>;
};

export type AssetCustodyLogV2 = {
  id: number;
  assetId: number;
  fromUserId?: number | null;
  toUserId?: number | null;
  centerId?: number | null;
  assignedAt: string;
  returnedAt?: string | null;
  notes?: string | null;
  createdById?: number | null;
  asset?: { id: number; assetCode: string; name: string; status: FixedAssetStatusV2 };
  fromUser?: { id: number; fullName: string; role: string } | null;
  toUser?: { id: number; fullName: string; role: string } | null;
  center?: { id: number; name: string; code?: string } | null;
  createdBy?: { id: number; fullName: string } | null;
};

export type CreateAssetCategoryV2Payload = {
  name: string;
  assetAccountId?: number;
  depreciationExpenseAccountId?: number;
  accumulatedDepreciationAccountId?: number;
  usefulLifeMonths?: number;
  isActive?: boolean;
};

export type CreateFixedAssetV2Payload = {
  centerId?: number;
  categoryId: number;
  assetCode: string;
  name: string;
  description?: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue?: number;
  usefulLifeMonths?: number;
  status?: FixedAssetStatusV2;
  location?: string;
  custodianUserId?: number;
  supplierId?: number;
  expenseInvoiceId?: number;
  notes?: string;
};

export type AssignAssetCustodyV2Payload = {
  toUserId?: number;
  centerId?: number;
  assignedAt?: string;
  returnedAt?: string;
  notes?: string;
};

// REPORTS-FINANCIAL-STATEMENTS-1: Financial Reports Types
export type FinancialPositionItemV2 = {
  accountId: number;
  code: string;
  name: string;
  balance: number;
};

export type FinanceReportFinancialPositionV2 = {
  asOf: string;
  assets: {
    current: FinancialPositionItemV2[];
    fixed: FinancialPositionItemV2[];
    totalCurrent: number;
    totalFixed: number;
    totalAssets: number;
  };
  liabilities: {
    rows: FinancialPositionItemV2[];
    totalLiabilities: number;
  };
  netAssets: {
    unrestricted: FinancialPositionItemV2[];
    restricted: FinancialPositionItemV2[];
    totalUnrestricted: number;
    totalRestricted: number;
    totalNetAssets: number;
  };
  isBalanced: boolean;
};

export type FinanceReportStatementOfActivitiesV2 = {
  range?: { from: string; to: string } | null;
  revenue: {
    studentContributions: FinancialPositionItemV2[];
    donations: FinancialPositionItemV2[];
    other: FinancialPositionItemV2[];
    totalRevenue: number;
  };
  expenses: {
    payroll: FinancialPositionItemV2[];
    operating: FinancialPositionItemV2[];
    educational: FinancialPositionItemV2[];
    centers: FinancialPositionItemV2[];
    depreciation: FinancialPositionItemV2[];
    other: FinancialPositionItemV2[];
    totalExpenses: number;
  };
  surplusOrDeficit: number;
};

// ─── Donation Report ───
export type DonationReportQuery = {
  dateFrom?: string;
  dateTo?: string;
  centerId?: number;
  donorId?: number;
  status?: DonationStatusV2;
  paymentMethod?: PaymentMethodV2;
  currencyCode?: string;
  search?: string;
};

export type DonationReportSummary = {
  totalAmount: number;
  totalCount: number;
  receivedAmount: number;
  receivedCount: number;
  pledgedCount: number;
  lastDonationDate: string | null;
};

export type DonationReportResponse = {
  rows: FinanceDonationV2[];
  total: number;
  summary: DonationReportSummary;
};

export type ReceiptReportQuery = {
  dateFrom?: string;
  dateTo?: string;
  centerId?: number;
  accountId?: number;
  status?: VoucherStatusV2;
  sourceType?: string;
  paymentMethod?: PaymentMethodV2;
  search?: string;
  voucherNo?: string;
};

export type ReceiptReportSummary = {
  totalCount: number;
  totalAmount: number;
  postedCount: number;
  postedAmount: number;
  cancelledCount: number;
  lastReceiptDate: string | null;
  bySource: Record<string, { count: number; amount: number }>;
};

export type ReceiptReportResponse = {
  rows: ReceiptReportVoucher[];
  summary: ReceiptReportSummary;
};

export type ReceiptReportVoucher = FinanceVoucherV2 & {
  account?: {
    id: number;
    accountType: string;
    centerId?: number | null;
    accountingAccountId?: number | null;
    currentBalance: number;
    currencyCode: string;
    accountingAccount?: { id: number; code: string; name: string; type: string } | null;
  } | null;
  createdBy?: { id: number; fullName: string; role: string } | null;
  approvedBy?: { id: number; fullName: string; role: string } | null;
  postedBy?: { id: number; fullName: string; role: string } | null;
  movement?: {
    id: number;
    movementType: string;
    direction: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    postedAt: string | null;
    reversalOfMovementId?: number | null;
  } | null;
  donation?: {
    id: number;
    donor?: { id: number; name: string; donorType: string } | null;
    purpose?: string | null;
  } | null;
  payment?: {
    id: number;
    invoice?: {
      id: number;
      month: number;
      year: number;
      student?: { id: number; fullName: string } | null;
    } | null;
  } | null;
  manualReferenceNo?: string | null;
  accountingCategory?: string | null;
};
