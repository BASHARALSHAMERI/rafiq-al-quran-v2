// @ts-nocheck
import { Prisma } from "@prisma/client";

/**
 * Prisma select objects for finance-v2 queries.
 * Extracted from finance-v2.service.ts for maintainability.
 */

const centerCoreSelect = {
  id: true,
  name: true,
  code: true,
  organizationId: true,
  isActive: true
} satisfies Prisma.CenterSelect;

const studentCoreSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  organizationId: true,
  isActive: true
} satisfies Prisma.UserSelect;

const invoiceSelect = {
  id: true,
  studentId: true,
  centerId: true,
  month: true,
  year: true,
  invoiceType: true,
  amount: true,
  status: true,
  issuedAt: true,
  dueDate: true,
  notes: true,
  cancelReason: true,
  cancelledAt: true,
  cancelledById: true,
  lockVersion: true,
  createdAt: true,
  student: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  cancelledBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  payments: {
    select: {
      id: true,
      amount: true,
      method: true,
      receivedAt: true,
      voucherId: true
    }
  }
} satisfies Prisma.InvoiceSelect;

const paymentSelect = {
  id: true,
  invoiceId: true,
  organizationId: true,
  centerId: true,
  voucherId: true,
  amount: true,
  method: true,
  idempotencyKey: true,
  attachmentStorageKey: true,
  externalTransferRef: true,
  receivedById: true,
  receivedAt: true,
  createdAt: true,
  voucher: {
    select: {
      id: true,
      voucherNo: true,
      voucherType: true,
      status: true
    }
  },
  receivedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  }
} satisfies Prisma.PaymentSelect;

const accountSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  accountingAccountId: true,
  accountType: true,
  openingBalance: true,
  currentBalance: true,
  currencyCode: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  accountingAccount: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  }
} satisfies Prisma.FinanceAccountSelect;

const voucherSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  accountId: true,
  voucherType: true,
  voucherNo: true,
  sourceType: true,
  sourceId: true,
  paymentMethod: true,
  amount: true,
  status: true,
  attachmentStorageKey: true,
  externalTransferRef: true,
  notes: true,
  createdById: true,
  approvedById: true,
  postedById: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  postedAt: true,
  voidRequestedAt: true,
  voidedAt: true,
  voucherDate: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  account: {
    select: {
      id: true,
      accountType: true,
      centerId: true,
      accountingAccountId: true,
      currentBalance: true,
      currencyCode: true,
      accountingAccount: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true
        }
      }
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  approvedBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  postedBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  movement: {
    select: {
      id: true,
      movementType: true,
      direction: true,
      amount: true,
      balanceBefore: true,
      balanceAfter: true,
      postedAt: true,
      reversalOfMovementId: true
    }
  }
} satisfies Prisma.FinanceVoucherSelect;

const movementSelect = {
  id: true,
  organizationId: true,
  accountId: true,
  voucherId: true,
  movementType: true,
  direction: true,
  amount: true,
  balanceBefore: true,
  balanceAfter: true,
  postedAt: true,
  reversalOfMovementId: true,
  createdAt: true,
  account: {
    select: {
      id: true,
      accountType: true,
      centerId: true,
      accountingAccountId: true,
      currencyCode: true
    }
  },
  voucher: {
    select: {
      id: true,
      voucherNo: true,
      voucherType: true,
      status: true
    }
  }
} satisfies Prisma.FinanceAccountMovementSelect;

const payrollProfileSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  userId: true,
  monthlyBaseAmount: true,
  salaryCurrencyCode: true,
  paymentMethodDefault: true,
  bankAccountNumber: true,
  bankName: true,
  iban: true,
  salaryGradeId: true,
  salarySource: true,
  overrideReason: true,
  approvedById: true,
  approvedAt: true,
  effectiveFrom: true,
  effectiveTo: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: { id: true, name: true, code: true }
  },
  user: {
    select: { id: true, fullName: true, role: true, email: true }
  },
  salaryGrade: {
    select: { id: true, jobTitle: true, gradeLevel: true, baseSalary: true }
  }
} satisfies Prisma.PayrollProfileSelect;

const payrollBatchSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  periodYear: true,
  periodMonth: true,
  status: true,
  totalItems: true,
  totalNetAmount: true,
  approvedById: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: { id: true, name: true, code: true }
  },
  approvedBy: {
    select: { id: true, fullName: true, role: true }
  },
  items: {
    select: {
      id: true,
      beneficiaryUserId: true,
      baseAmount: true,
      bonusAmount: true,
      deductionAmount: true,
      deductionEventIds: true,
      netAmount: true,
      status: true,
      paymentMethod: true,
      paymentReference: true,
      failureReason: true,
      voucherId: true,
      notes: true,
      paidAt: true,
      beneficiary: {
        select: { id: true, fullName: true, role: true }
      },
      voucher: {
        select: { id: true, voucherNo: true, status: true }
      }
    }
  }
} satisfies Prisma.PayrollBatchSelect;

const rewardProfileSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  beneficiaryUserId: true,
  beneficiaryRole: true,
  cycle: true,
  rewardType: true,
  defaultAmount: true,
  effectiveFrom: true,
  effectiveTo: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: { id: true, name: true, code: true }
  },
  beneficiary: {
    select: { id: true, fullName: true, role: true, email: true }
  }
} satisfies Prisma.RewardProfileSelect;

const rewardBatchSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  cycle: true,
  rewardType: true,
  periodYear: true,
  periodMonth: true,
  periodQuarter: true,
  status: true,
  totalAmount: true,
  totalItems: true,
  approvedById: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: { id: true, name: true, code: true }
  },
  approvedBy: {
    select: { id: true, fullName: true, role: true }
  },
  items: {
    select: {
      id: true,
      beneficiaryUserId: true,
      beneficiaryRole: true,
      centerId: true,
      circleId: true,
      amount: true,
      rankInCircle: true,
      rewardType: true,
      status: true,
      paymentMethod: true,
      paymentReference: true,
      failureReason: true,
      voucherId: true,
      notes: true,
      paidAt: true,
      beneficiary: {
        select: { id: true, fullName: true, role: true }
      },
      center: {
        select: { id: true, name: true, code: true }
      },
      circle: {
        select: { id: true, name: true }
      },
      voucher: {
        select: { id: true, voucherNo: true, status: true }
      }
    }
  }
} satisfies Prisma.RewardBatchSelect;

const fundTransferSelect = {
  id: true,
  organizationId: true,
  fromAccountId: true,
  toAccountId: true,
  fromCenterId: true,
  toCenterId: true,
  amount: true,
  status: true,
  requestedById: true,
  approvedById: true,
  voucherOutId: true,
  voucherInId: true,
  notes: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  postedAt: true,
  createdAt: true,
  updatedAt: true,
  fromAccount: {
    select: {
      id: true,
      accountType: true,
      centerId: true,
      currentBalance: true,
      currencyCode: true
    }
  },
  toAccount: {
    select: {
      id: true,
      accountType: true,
      centerId: true,
      currentBalance: true,
      currencyCode: true
    }
  },
  fromCenter: {
    select: { id: true, name: true, code: true }
  },
  toCenter: {
    select: { id: true, name: true, code: true }
  },
  requestedBy: {
    select: { id: true, fullName: true, role: true }
  },
  approvedBy: {
    select: { id: true, fullName: true, role: true }
  },
  voucherOut: {
    select: { id: true, voucherNo: true, status: true }
  },
  voucherIn: {
    select: { id: true, voucherNo: true, status: true }
  }
} satisfies Prisma.FinanceFundTransferSelect;

const studentFeeProfileSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  studentId: true,
  feeMode: true,
  tuitionPlanId: true,
  symbolicAmount: true,
  isActive: true,
  startDate: true,
  endDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  student: {
    select: {
      id: true,
      fullName: true,
      role: true,
      email: true
    }
  },
  tuitionPlan: {
    select: {
      id: true,
      name: true,
      monthlyAmount: true,
      planKind: true
    }
  }
} satisfies Prisma.StudentFeeProfileSelect;

export const tuitionPlanSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  name: true,
  monthlyAmount: true,
  isActive: true,
  planKind: true,
  createdAt: true,
  center: {
    select: { id: true, name: true, code: true }
  }
} satisfies Prisma.TuitionPlanSelect;

