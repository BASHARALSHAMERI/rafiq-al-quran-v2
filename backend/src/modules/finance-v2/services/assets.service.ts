import {
  AccountingAccountType,
  FixedAssetStatus,
  JournalSourceType,
  JournalEntryStatus,
  Prisma
} from "@prisma/client";
import { ensurePeriodOpenTx } from "../../accounting/accounting.service";
import { prisma } from "../../../shared/db/prisma";
import { AppError } from "../../../shared/errors/app-error";
import type { ScopeContext } from "../../../shared/types/auth.types";
import { financeV2Domain } from "../finance-v2.domain";

type CreateAssetCategoryInput = {
  name: string;
  assetAccountId?: number;
  depreciationExpenseAccountId?: number;
  accumulatedDepreciationAccountId?: number;
  usefulLifeMonths?: number;
  isActive?: boolean;
};

type CreateFixedAssetInput = {
  centerId?: number;
  categoryId: number;
  assetCode: string;
  name: string;
  description?: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue?: number;
  usefulLifeMonths?: number;
  status?: FixedAssetStatus;
  location?: string;
  custodianUserId?: number;
  supplierId?: number;
  expenseInvoiceId?: number;
  notes?: string;
};

type AssignAssetCustodyInput = {
  toUserId?: number;
  centerId?: number;
  assignedAt?: string;
  returnedAt?: string;
  notes?: string;
};

type PostAssetAcquisitionInput = {
  financeAccountId: number;
};

type PostAssetDepreciationInput = {
  periodYear: number;
  periodMonth: number;
};

const assetInclude = {
  category: true,
  center: { select: { id: true, name: true, code: true } },
  custodian: { select: { id: true, fullName: true, role: true, email: true } },
  supplier: { select: { id: true, name: true } },
  expenseInvoice: { select: { id: true, invoiceNo: true, description: true, amount: true, status: true } },
  acquisitionJournalEntry: { select: { id: true, entryNo: true } },
  depreciationEntries: { orderBy: { periodYear: 'desc', periodMonth: 'desc' }, take: 1 }
} satisfies Prisma.FixedAssetInclude;

const categoryInclude = {
  assetAccount: { select: { id: true, code: true, name: true, type: true } },
  depreciationExpenseAccount: { select: { id: true, code: true, name: true, type: true } },
  accumulatedDepreciationAccount: { select: { id: true, code: true, name: true, type: true } }
} satisfies Prisma.AssetCategoryInclude;

const custodyInclude = {
  asset: { select: { id: true, assetCode: true, name: true, status: true } },
  fromUser: { select: { id: true, fullName: true, role: true } },
  toUser: { select: { id: true, fullName: true, role: true } },
  center: { select: { id: true, name: true, code: true } },
  createdBy: { select: { id: true, fullName: true } }
} satisfies Prisma.AssetCustodyLogInclude;

const cleanString = (value: unknown, field: string, maxLength: number) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${field} مطلوب`, 400);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new AppError(`${field} طويل جداً`, 400);
  }
  return trimmed;
};

const optionalString = (value: unknown, maxLength: number) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new AppError("حقل نصي غير صالح", 400);
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) {
    throw new AppError("حقل نصي طويل جداً", 400);
  }
  return trimmed;
};

const optionalPositiveInt = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} يجب أن يكون رقماً صحيحاً موجباً`, 400);
  }
  return parsed;
};

const requiredPositiveInt = (value: unknown, field: string) => {
  const parsed = optionalPositiveInt(value, field);
  if (!parsed) {
    throw new AppError(`${field} مطلوب`, 400);
  }
  return parsed;
};

const positiveMoney = (value: unknown, field: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${field} يجب أن يكون أكبر من صفر`, 400);
  }
  return new Prisma.Decimal(parsed);
};

const optionalMoney = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`${field} يجب أن يكون صفراً أو أكبر`, 400);
  }
  return new Prisma.Decimal(parsed);
};

const parseDate = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value) {
    throw new AppError(`${field} مطلوب`, 400);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} غير صالح`, 400);
  }
  return date;
};

const assertAccount = async (
  organizationId: number,
  accountId: number | undefined,
  expectedType: AccountingAccountType,
  field: string
) => {
  if (!accountId) return;
  const account = await prisma.accountingAccount.findFirst({
    where: {
      id: accountId,
      organizationId,
      type: expectedType,
      isActive: true,
      children: { none: { isActive: true } }
    }
  });
  if (!account) {
    throw new AppError(`حساب ترحيل ${field} غير موجود`, 404);
  }
};

const assertCenter = async (scope: ScopeContext, centerId?: number) => {
  if (!centerId) return;
  financeV2Domain.ensureCenterAllowed(scope, centerId);
  const center = await prisma.center.findFirst({
    where: { id: centerId, organizationId: scope.organizationId }
  });
  if (!center) {
    throw new AppError("المركز غير موجود", 404);
  }
};

const assertUser = async (organizationId: number, userId?: number) => {
  if (!userId) return;
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId, isActive: true }
  });
  if (!user) {
    throw new AppError("الموجوداتي غير موجود", 404);
  }
};

export const assetsService = {
  async listAssetCategories(scope: ScopeContext) {
    return prisma.assetCategory.findMany({
      where: { organizationId: scope.organizationId },
      include: categoryInclude,
      orderBy: [{ isActive: "desc" }, { name: "asc" }]
    });
  },

  async createAssetCategory(scope: ScopeContext, input: CreateAssetCategoryInput) {
    const assetAccountId = optionalPositiveInt(input.assetAccountId, "assetAccountId");
    const depreciationExpenseAccountId = optionalPositiveInt(
      input.depreciationExpenseAccountId,
      "depreciationExpenseAccountId"
    );
    const accumulatedDepreciationAccountId = optionalPositiveInt(
      input.accumulatedDepreciationAccountId,
      "accumulatedDepreciationAccountId"
    );
    const usefulLifeMonths = optionalPositiveInt(input.usefulLifeMonths, "usefulLifeMonths");

    await assertAccount(scope.organizationId, assetAccountId, AccountingAccountType.ASSET, "Asset");
    await assertAccount(
      scope.organizationId,
      depreciationExpenseAccountId,
      AccountingAccountType.EXPENSE,
      "Depreciation expense"
    );
    await assertAccount(
      scope.organizationId,
      accumulatedDepreciationAccountId,
      AccountingAccountType.ASSET,
      "Accumulated depreciation"
    );

    return prisma.assetCategory.create({
      data: {
        organizationId: scope.organizationId,
        name: cleanString(input.name, "name", 120),
        assetAccountId,
        depreciationExpenseAccountId,
        accumulatedDepreciationAccountId,
        usefulLifeMonths,
        isActive: input.isActive ?? true
      },
      include: categoryInclude
    });
  },

  async listFixedAssets(scope: ScopeContext, query: { centerId?: number; categoryId?: number; status?: FixedAssetStatus }) {
    const centerId = optionalPositiveInt(query.centerId, "centerId");
    const categoryId = optionalPositiveInt(query.categoryId, "categoryId");
    await assertCenter(scope, centerId);

    return prisma.fixedAsset.findMany({
      where: {
        organizationId: scope.organizationId,
        ...(centerId ? { centerId } : scope.allAccess ? {} : { centerId: { in: scope.centerIds } }),
        ...(categoryId ? { categoryId } : {}),
        ...(query.status ? { status: query.status } : {})
      },
      include: assetInclude,
      orderBy: { createdAt: "desc" }
    });
  },

  async createFixedAsset(scope: ScopeContext, input: CreateFixedAssetInput) {
    const centerId = optionalPositiveInt(input.centerId, "centerId");
    const categoryId = requiredPositiveInt(input.categoryId, "categoryId");
    const custodianUserId = optionalPositiveInt(input.custodianUserId, "custodianUserId");
    const supplierId = optionalPositiveInt(input.supplierId, "supplierId");
    const expenseInvoiceId = optionalPositiveInt(input.expenseInvoiceId, "expenseInvoiceId");
    const usefulLifeMonths = optionalPositiveInt(input.usefulLifeMonths, "usefulLifeMonths");
    const status = input.status ?? FixedAssetStatus.ACTIVE;

    financeV2Domain.ensureScopedCenterRequired(scope, centerId);
    await assertCenter(scope, centerId);
    await assertUser(scope.organizationId, custodianUserId);

    const category = await prisma.assetCategory.findFirst({
      where: { id: categoryId, organizationId: scope.organizationId, isActive: true }
    });
    if (!category) {
      throw new AppError("تصنيف الأصل غير موجود", 404);
    }

    if (supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, organizationId: scope.organizationId, isActive: true }
      });
      if (!supplier) throw new AppError("المورد غير موجود", 404);
    }

    if (expenseInvoiceId) {
      const invoice = await prisma.expenseInvoice.findFirst({
        where: { id: expenseInvoiceId, organizationId: scope.organizationId }
      });
      if (!invoice) throw new AppError("فاتورة المصروف غير موجودة", 404);
      financeV2Domain.ensureScopedCenterRequired(scope, invoice.centerId);
    }

    const purchaseDate = parseDate(input.purchaseDate, "purchaseDate");

    return prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.create({
        data: {
          organizationId: scope.organizationId,
          centerId,
          categoryId,
          assetCode: cleanString(input.assetCode, "assetCode", 80),
          name: cleanString(input.name, "name", 160),
          description: optionalString(input.description, 500),
          purchaseDate,
          purchaseCost: positiveMoney(input.purchaseCost, "purchaseCost"),
          currentValue: optionalMoney(input.currentValue, "currentValue"),
          usefulLifeMonths,
          status,
          location: optionalString(input.location, 255),
          custodianUserId,
          supplierId,
          expenseInvoiceId,
          notes: optionalString(input.notes, 500)
        },
        include: assetInclude
      });

      if (custodianUserId) {
        await tx.assetCustodyLog.create({
          data: {
            organizationId: scope.organizationId,
            assetId: asset.id,
            toUserId: custodianUserId,
            centerId,
            assignedAt: new Date(),
            notes: "Initial asset custody",
            createdById: scope.userId
          }
        });
      }

      // TODO FA-ASSETS-2: asset acquisition and depreciation posting.
      // This register intentionally does not post a fixed-asset acquisition entry yet,
      // so an expense invoice link cannot double-post the same amount as both expense and asset.
      
      // TODO: Add audit log for FIXED_ASSET creation (AUDIT-TRAIL-FINANCE-1)
      
      return asset;
    });
  },

  async listCustodyLogs(scope: ScopeContext, query: { assetId?: number }) {
    const assetId = optionalPositiveInt(query.assetId, "assetId");
    if (assetId) {
      const asset = await prisma.fixedAsset.findFirst({
        where: { id: assetId, organizationId: scope.organizationId }
      });
      if (!asset) throw new AppError("الأصل غير موجود", 404);
      financeV2Domain.ensureCenterAllowed(scope, asset.centerId);
    }

    return prisma.assetCustodyLog.findMany({
      where: {
        organizationId: scope.organizationId,
        ...(assetId ? { assetId } : {}),
        ...(scope.allAccess ? {} : { centerId: { in: scope.centerIds } })
      },
      include: custodyInclude,
      orderBy: { assignedAt: "desc" }
    });
  },

  async assignCustody(scope: ScopeContext, assetId: number, input: AssignAssetCustodyInput) {
    const toUserId = optionalPositiveInt(input.toUserId, "toUserId");
    const centerId = optionalPositiveInt(input.centerId, "centerId");
    await assertCenter(scope, centerId);
    await assertUser(scope.organizationId, toUserId);

    return prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.findFirst({
        where: { id: assetId, organizationId: scope.organizationId }
      });
      if (!asset) throw new AppError("الأصل غير موجود", 404);
      financeV2Domain.ensureCenterAllowed(scope, asset.centerId);

      const assignedAt = input.assignedAt ? parseDate(input.assignedAt, "assignedAt") : new Date();
      const returnedAt = input.returnedAt ? parseDate(input.returnedAt, "returnedAt") : null;

      await tx.assetCustodyLog.updateMany({
        where: { assetId, returnedAt: null },
        data: { returnedAt: assignedAt }
      });

      const custody = await tx.assetCustodyLog.create({
        data: {
          organizationId: scope.organizationId,
          assetId,
          fromUserId: asset.custodianUserId,
          toUserId,
          centerId: centerId ?? asset.centerId,
          assignedAt,
          returnedAt,
          notes: optionalString(input.notes, 500),
          createdById: scope.userId
        },
        include: custodyInclude
      });

      await tx.fixedAsset.update({
        where: { id: assetId },
        data: {
          custodianUserId: toUserId ?? null,
          centerId: centerId ?? asset.centerId
        }
      });

      return custody;
    });
  },

  async postAssetAcquisition(scope: ScopeContext, assetId: number, input: PostAssetAcquisitionInput) {
    const financeAccountId = requiredPositiveInt(input.financeAccountId, "financeAccountId");

    return prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.findFirst({
        where: { id: assetId, organizationId: scope.organizationId },
        include: { category: true }
      });
      if (!asset) throw new AppError("الأصل غير موجود", 404);
      financeV2Domain.ensureCenterAllowed(scope, asset.centerId);

      if (asset.expenseInvoiceId) {
        // TODO FA-ASSETS-3: capital purchase invoice classification and asset-link posting.
        throw new AppError("هذا الأصل مرتبط بفاتورة شراء/مصروف، ويتم ترحيله من خلال الفاتورة لتجنب تكرار القيد.", 400);
      }

      if (asset.acquisitionJournalEntryId) {
        throw new AppError("تم ترحيل اكتساب الأصل بالفعل", 409);
      }

      if (!asset.category.assetAccountId) {
        throw new AppError("تصنيف الأصل ليس لديه حساب أصول مُعد", 400);
      }

      const debitAccount = await tx.accountingAccount.findFirst({
        where: { id: asset.category.assetAccountId, organizationId: scope.organizationId, isActive: true, children: { none: { isActive: true } } }
      });
      if (!debitAccount) throw new AppError("حساب الأصل مفقود أو هو حساب أب", 400);

      const financeAccount = await tx.financeAccount.findFirst({
        where: { id: financeAccountId, organizationId: scope.organizationId },
        include: { accountingAccount: { include: { children: { where: { isActive: true } } } } }
      });

      if (!financeAccount || !financeAccount.accountingAccount || !financeAccount.accountingAccount.isActive || financeAccount.accountingAccount.children.length > 0) {
         throw new AppError("الحساب المالي ليس لديه حساب أستاذ ترحيل صالح", 400);
      }
      financeV2Domain.ensureCenterAllowed(scope, financeAccount.centerId);
      
      const creditAccount = financeAccount.accountingAccount;

      const fiscalPeriod = await ensurePeriodOpenTx(tx, scope.organizationId, asset.purchaseDate);

      const amount = asset.purchaseCost;

      const entry = await tx.journalEntry.create({
        data: {
          organizationId: scope.organizationId,
          centerId: asset.centerId,
          entryNo: `ASSET-ACQ-${asset.id}`,
          entryDate: asset.purchaseDate,
          sourceType: JournalSourceType.ASSET_ACQUISITION,
          sourceId: asset.id,
          status: JournalEntryStatus.POSTED,
          fiscalPeriodId: fiscalPeriod?.id ?? null,
          description: `Acquisition of asset ${asset.assetCode} - ${asset.name}`,
          postedById: scope.userId,
          postedAt: new Date(),
          lines: {
            create: [
              {
                organizationId: scope.organizationId,
                accountId: debitAccount.id,
                centerId: asset.centerId,
                debit: amount,
                credit: 0,
                memo: `Asset acquisition: ${asset.name}`
              },
              {
                organizationId: scope.organizationId,
                accountId: creditAccount.id,
                centerId: asset.centerId,
                debit: 0,
                credit: amount,
                memo: `Asset payment: ${creditAccount.name}`
              }
            ]
          }
        }
      });

      await tx.fixedAsset.update({
        where: { id: asset.id },
        data: { acquisitionJournalEntryId: entry.id }
      });

      // TODO: Add audit log for FIXED_ASSET acquisition (AUDIT-TRAIL-FINANCE-1)

      return tx.fixedAsset.findUnique({
        where: { id: asset.id },
        include: assetInclude
      });
    });
  },

  async postAssetDepreciation(scope: ScopeContext, assetId: number, input: PostAssetDepreciationInput) {
    const periodYear = requiredPositiveInt(input.periodYear, "periodYear");
    const periodMonth = requiredPositiveInt(input.periodMonth, "periodMonth");
    if (periodMonth > 12) {
      throw new AppError("شهر الإهلاك غير صالح", 400);
    }

    return prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.findFirst({
        where: { id: assetId, organizationId: scope.organizationId },
        include: { category: true }
      });
      if (!asset) throw new AppError("الأصل غير موجود", 404);
      financeV2Domain.ensureCenterAllowed(scope, asset.centerId);

      if (asset.status !== FixedAssetStatus.ACTIVE) {
        throw new AppError("لا يمكن إهلاك أصل غير نشط أو تم التخلص منه", 400);
      }

      if (!asset.usefulLifeMonths || asset.usefulLifeMonths <= 0) {
        throw new AppError("الأصل ليس له عمر افتراضي محدد", 400);
      }

      if (!asset.category.depreciationExpenseAccountId || !asset.category.accumulatedDepreciationAccountId) {
        throw new AppError("تصنيف الأصل يفتقد حسابات الإهلاك", 400);
      }

      const existing = await tx.assetDepreciationEntry.findFirst({
        where: { assetId, periodYear, periodMonth }
      });
      if (existing) {
        throw new AppError("إهلاك هذه الفترة مرحل بالفعل", 409);
      }

      const expenseAccount = await tx.accountingAccount.findFirst({
        where: { id: asset.category.depreciationExpenseAccountId, organizationId: scope.organizationId, isActive: true, children: { none: { isActive: true } } }
      });
      const accumulatedAccount = await tx.accountingAccount.findFirst({
        where: { id: asset.category.accumulatedDepreciationAccountId, organizationId: scope.organizationId, isActive: true, children: { none: { isActive: true } } }
      });

      if (!expenseAccount || !accumulatedAccount) {
        throw new AppError("حسابات الإهلاك غير صالحة أو حسابات أب", 400);
      }

      const amountPerMonth = Number(asset.purchaseCost) / asset.usefulLifeMonths;
      const amount = new Prisma.Decimal(amountPerMonth.toFixed(2));

      const previous = await tx.assetDepreciationEntry.aggregate({
        where: { assetId },
        _sum: { amount: true }
      });
      
      const totalSoFar = Number(previous._sum.amount || 0);
      if (totalSoFar + amountPerMonth > Number(asset.purchaseCost)) {
        throw new AppError("إجمالي الإهلاك سيتجاوز تكلفة الشراء", 400);
      }

      const entryDate = new Date(periodYear, periodMonth, 0);
      const fiscalPeriod = await ensurePeriodOpenTx(tx, scope.organizationId, entryDate);

      const entry = await tx.journalEntry.create({
        data: {
          organizationId: scope.organizationId,
          centerId: asset.centerId,
          entryNo: `DEP-${asset.id}-${periodYear}-${periodMonth}`,
          entryDate,
          sourceType: JournalSourceType.ASSET_DEPRECIATION,
          sourceId: null,
          status: JournalEntryStatus.POSTED,
          fiscalPeriodId: fiscalPeriod?.id ?? null,
          description: `Depreciation for ${asset.name} - ${periodMonth}/${periodYear}`,
          postedById: scope.userId,
          postedAt: new Date(),
        }
      });

      const depEntry = await tx.assetDepreciationEntry.create({
        data: {
          organizationId: scope.organizationId,
          assetId: asset.id,
          periodYear,
          periodMonth,
          amount,
          journalEntryId: entry.id,
          notes: `Monthly depreciation ${periodMonth}/${periodYear}`
        }
      });

      await tx.journalEntry.update({
        where: { id: entry.id },
        data: { sourceId: depEntry.id }
      });

      await tx.journalEntryLine.createMany({
        data: [
          {
            organizationId: scope.organizationId,
            journalEntryId: entry.id,
            accountId: expenseAccount.id,
            centerId: asset.centerId,
            debit: amount,
            credit: 0,
            memo: `Depreciation expense: ${asset.name}`
          },
          {
            organizationId: scope.organizationId,
            journalEntryId: entry.id,
            accountId: accumulatedAccount.id,
            centerId: asset.centerId,
            debit: 0,
            credit: amount,
            memo: `Accumulated depreciation: ${asset.name}`
          }
        ]
      });

      // TODO: Add audit log for FIXED_ASSET depreciation (AUDIT-TRAIL-FINANCE-1)

      return tx.fixedAsset.findUnique({
        where: { id: asset.id },
        include: assetInclude
      });
    });
  }
};
