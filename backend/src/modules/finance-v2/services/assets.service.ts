import {
  AccountingAccountType,
  AuditAction,
  AuditEntityType,
  FinanceMovementType,
  FixedAssetStatus,
  JournalSourceType,
  JournalEntryStatus,
  Prisma,
  VoucherSourceType,
  VoucherStatus,
  VoucherType
} from "@prisma/client";
import { ensurePeriodOpenTx } from "../../accounting/accounting.service";
import { prisma } from "../../../shared/db/prisma";
import { AppError } from "../../../shared/errors/app-error";
import type { ScopeContext } from "../../../shared/types/auth.types";
import { financeV2Domain } from "../finance-v2.domain";
import {
  addAudit,
  getEffectivePolicyTx,
  nextVoucherNoTx,
  postVoucherTx
} from "../finance-v2.internal";

type CreateAssetCategoryInput = {
  name: string;
  assetAccountId?: number;
  depreciationExpenseAccountId?: number;
  accumulatedDepreciationAccountId?: number;
  usefulLifeMonths?: number;
  isActive?: boolean;
};

type UpdateAssetCategoryInput = {
  name?: string;
  assetAccountId?: number | null;
  depreciationExpenseAccountId?: number | null;
  accumulatedDepreciationAccountId?: number | null;
  usefulLifeMonths?: number | null;
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
  supplierId?: number;
  expenseInvoiceId?: number;
  notes?: string;
};

type UpdateFixedAssetInput = {
  name?: string;
  description?: string;
  location?: string;
  notes?: string;
  usefulLifeMonths?: number | null;
};

type AssignAssetCustodyInput = {
  toUserId?: number;
  assignedAt?: string;
  notes?: string;
};

type ReleaseCustodyInput = {
  returnedAt: string;
  notes?: string;
};

export type UpdateCustodyInput = {
  toUserId?: number;
  assignedAt?: string;
  returnedAt?: string | null;
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
  custodian: { select: { id: true, fullName: true, role: true, email: true } }, // Keep for legacy / transition
  custodyLogs: {
    where: { returnedAt: null },
    include: { toUser: { select: { id: true, fullName: true, role: true, email: true } } },
    take: 1
  },
  supplier: { select: { id: true, name: true } },
  expenseInvoice: { select: { id: true, invoiceNo: true, description: true, amount: true, status: true } },
  acquisitionJournalEntry: { select: { id: true, entryNo: true } },
  depreciationEntries: {
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    take: 1
  }
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

/** الحالات التي تسمح بالإهلاك والتسليم */
const ACTIVE_STATES: FixedAssetStatus[] = [FixedAssetStatus.ACTIVE, FixedAssetStatus.IN_CUSTODY];

/** الحالات التي لا تسمح بتسليم عهدة جديدة */
const BLOCKED_STATES: FixedAssetStatus[] = [
  FixedAssetStatus.DISPOSED,
  FixedAssetStatus.LOST,
  FixedAssetStatus.INACTIVE
];

export const assetsService = {
  // ─── Asset Categories ───────────────────────────────────────────────────────

  async listAssetCategories(scope: ScopeContext) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    return prisma.assetCategory.findMany({
      where: { organizationId: scope.organizationId },
      include: categoryInclude,
      orderBy: [{ isActive: "desc" }, { name: "asc" }]
    });
  },

  async createAssetCategory(scope: ScopeContext, input: CreateAssetCategoryInput) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);
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

    if (
      assetAccountId &&
      accumulatedDepreciationAccountId &&
      assetAccountId === accumulatedDepreciationAccountId
    ) {
      throw new AppError("لا يمكن أن يكون حساب مجمع الإهلاك هو نفسه حساب الأصل", 400);
    }

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

  async updateAssetCategory(scope: ScopeContext, categoryId: number, input: UpdateAssetCategoryInput) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);

    const category = await prisma.assetCategory.findFirst({
      where: { id: categoryId, organizationId: scope.organizationId }
    });
    if (!category) throw new AppError("التصنيف غير موجود", 404);

    const assetAccountId =
      input.assetAccountId !== undefined
        ? optionalPositiveInt(input.assetAccountId ?? undefined, "assetAccountId") ?? null
        : undefined;
    const depreciationExpenseAccountId =
      input.depreciationExpenseAccountId !== undefined
        ? optionalPositiveInt(input.depreciationExpenseAccountId ?? undefined, "depreciationExpenseAccountId") ?? null
        : undefined;
    const accumulatedDepreciationAccountId =
      input.accumulatedDepreciationAccountId !== undefined
        ? optionalPositiveInt(input.accumulatedDepreciationAccountId ?? undefined, "accumulatedDepreciationAccountId") ?? null
        : undefined;
    const usefulLifeMonths =
      input.usefulLifeMonths !== undefined
        ? optionalPositiveInt(input.usefulLifeMonths ?? undefined, "usefulLifeMonths") ?? null
        : undefined;

    if (assetAccountId) {
      await assertAccount(scope.organizationId, assetAccountId, AccountingAccountType.ASSET, "Asset");
    }
    if (depreciationExpenseAccountId) {
      await assertAccount(scope.organizationId, depreciationExpenseAccountId, AccountingAccountType.EXPENSE, "Depreciation expense");
    }
    if (accumulatedDepreciationAccountId) {
      await assertAccount(scope.organizationId, accumulatedDepreciationAccountId, AccountingAccountType.ASSET, "Accumulated depreciation");
    }

    const finalAssetAccountId = assetAccountId !== undefined ? assetAccountId : category.assetAccountId;
    const finalAccumulatedDepreciationAccountId =
      accumulatedDepreciationAccountId !== undefined ? accumulatedDepreciationAccountId : category.accumulatedDepreciationAccountId;

    if (
      finalAssetAccountId &&
      finalAccumulatedDepreciationAccountId &&
      finalAssetAccountId === finalAccumulatedDepreciationAccountId
    ) {
      throw new AppError("لا يمكن أن يكون حساب مجمع الإهلاك هو نفسه حساب الأصل", 400);
    }

    return prisma.assetCategory.update({
      where: { id: categoryId },
      data: {
        ...(input.name !== undefined ? { name: cleanString(input.name, "name", 120) } : {}),
        ...(assetAccountId !== undefined ? { assetAccountId } : {}),
        ...(depreciationExpenseAccountId !== undefined ? { depreciationExpenseAccountId } : {}),
        ...(accumulatedDepreciationAccountId !== undefined ? { accumulatedDepreciationAccountId } : {}),
        ...(usefulLifeMonths !== undefined ? { usefulLifeMonths } : {})
      },
      include: categoryInclude
    });
  },

  async deactivateAssetCategory(scope: ScopeContext, categoryId: number) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);

    const category = await prisma.assetCategory.findFirst({
      where: { id: categoryId, organizationId: scope.organizationId }
    });
    if (!category) throw new AppError("التصنيف غير موجود", 404);
    if (!category.isActive) throw new AppError("التصنيف غير نشط بالفعل", 409);

    // منع تعطيل تصنيف مرتبط بأصول نشطة
    const activeAssets = await prisma.fixedAsset.count({
      where: {
        categoryId,
        organizationId: scope.organizationId,
        status: { in: ACTIVE_STATES }
      }
    });
    if (activeAssets > 0) {
      throw new AppError(
        `لا يمكن تعطيل التصنيف — يوجد ${activeAssets} أصل نشط مرتبط به`,
        409
      );
    }

    return prisma.assetCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
      include: categoryInclude
    });
  },

  // ─── Fixed Assets ────────────────────────────────────────────────────────────

  async listFixedAssets(scope: ScopeContext, query: { centerId?: number; categoryId?: number; status?: FixedAssetStatus }) {
    const centerId = optionalPositiveInt(query.centerId, "centerId");
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
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

  async getFixedAsset(scope: ScopeContext, assetId: number) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: assetId, organizationId: scope.organizationId },
      include: assetInclude
    });
    if (!asset) throw new AppError("الأصل غير موجود", 404);
    financeV2Domain.ensureCenterAllowed(scope, asset.centerId);
    return asset;
  },

  async createFixedAsset(scope: ScopeContext, input: CreateFixedAssetInput) {
    const centerId = optionalPositiveInt(input.centerId, "centerId");
    const categoryId = requiredPositiveInt(input.categoryId, "categoryId");
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    const supplierId = optionalPositiveInt(input.supplierId, "supplierId");
    const expenseInvoiceId = optionalPositiveInt(input.expenseInvoiceId, "expenseInvoiceId");
    const usefulLifeMonths = optionalPositiveInt(input.usefulLifeMonths, "usefulLifeMonths");
    const status = input.status ?? FixedAssetStatus.ACTIVE;

    financeV2Domain.ensureScopedCenterRequired(scope, centerId);
    await assertCenter(scope, centerId);

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
      if (!invoice) throw new AppError("فاتورة الشراء غير موجودة", 404);
      financeV2Domain.ensureScopedCenterRequired(scope, invoice.centerId);
    }

    const purchaseDate = parseDate(input.purchaseDate, "purchaseDate");

    // منع تاريخ الشراء المستقبلي
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (purchaseDate > today) {
      throw new AppError("تاريخ الشراء لا يمكن أن يكون في المستقبل", 400);
    }

    const purchaseCostDecimal = positiveMoney(input.purchaseCost, "purchaseCost");
    // القيمة الحالية = تكلفة الشراء تلقائياً إذا لم تُحدَّد
    const currentValueDecimal = input.currentValue !== undefined
      ? optionalMoney(input.currentValue, "currentValue") ?? purchaseCostDecimal
      : purchaseCostDecimal;

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
          purchaseCost: purchaseCostDecimal,
          currentValue: currentValueDecimal,
          usefulLifeMonths,
          status,
          location: optionalString(input.location, 255),
          supplierId,
          expenseInvoiceId,
          notes: optionalString(input.notes, 500)
        },
        include: assetInclude
      });

      // TODO FA-ASSETS-2: asset acquisition and depreciation posting.
      // This register intentionally does not post a fixed-asset acquisition entry yet,
      // so an expense invoice link cannot double-post the same amount as both expense and asset.
      
      await addAudit({
        scope,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.FIXED_ASSET,
        entityId: asset.id,
        centerId: asset.centerId,
        summary: "تم إنشاء أصل ثابت"
      });
      
      return asset;
    });
  },

  async updateFixedAsset(scope: ScopeContext, assetId: number, input: UpdateFixedAssetInput) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: assetId, organizationId: scope.organizationId }
    });
    if (!asset) throw new AppError("الأصل غير موجود", 404);
    financeV2Domain.ensureCenterAllowed(scope, asset.centerId);

    const usefulLifeMonths =
      input.usefulLifeMonths !== undefined
        ? optionalPositiveInt(input.usefulLifeMonths ?? undefined, "usefulLifeMonths") ?? null
        : undefined;

    const updated = await prisma.fixedAsset.update({
      where: { id: assetId },
      data: {
        ...(input.name !== undefined ? { name: cleanString(input.name, "name", 160) } : {}),
        ...(input.description !== undefined ? { description: optionalString(input.description, 500) ?? null } : {}),
        ...(input.location !== undefined ? { location: optionalString(input.location, 255) ?? null } : {}),
        ...(input.notes !== undefined ? { notes: optionalString(input.notes, 500) ?? null } : {}),
        ...(usefulLifeMonths !== undefined ? { usefulLifeMonths } : {})
      },
      include: assetInclude
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FIXED_ASSET,
      entityId: assetId,
      centerId: asset.centerId,
      summary: "تم تعديل بيانات أصل ثابت"
    });

    return updated;
  },

  async deactivateFixedAsset(scope: ScopeContext, assetId: number) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: assetId, organizationId: scope.organizationId }
    });
    if (!asset) throw new AppError("الأصل غير موجود", 404);
    financeV2Domain.ensureCenterAllowed(scope, asset.centerId);

    if (asset.status === FixedAssetStatus.INACTIVE) {
      throw new AppError("الأصل غير نشط بالفعل", 409);
    }

    // منع تعطيل أصل بعهدة نشطة
    const activeCustody = await prisma.assetCustodyLog.findFirst({
      where: { assetId, returnedAt: null }
    });
    if (activeCustody) {
      throw new AppError("لا يمكن تعطيل أصل له عهدة نشطة — أخلِ العهدة أولاً", 409);
    }

    const updated = await prisma.fixedAsset.update({
      where: { id: assetId },
      data: { status: FixedAssetStatus.INACTIVE },
      include: assetInclude
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FIXED_ASSET,
      entityId: assetId,
      centerId: asset.centerId,
      summary: "تم تعطيل أصل ثابت"
    });

    return updated;
  },

  async reactivateFixedAsset(scope: ScopeContext, assetId: number) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: assetId, organizationId: scope.organizationId }
    });
    if (!asset) throw new AppError("الأصل غير موجود", 404);
    financeV2Domain.ensureCenterAllowed(scope, asset.centerId);

    if (asset.status !== FixedAssetStatus.INACTIVE) {
      throw new AppError("الأصل نشط بالفعل", 409);
    }

    const updated = await prisma.fixedAsset.update({
      where: { id: assetId },
      data: { status: FixedAssetStatus.ACTIVE },
      include: assetInclude
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FIXED_ASSET,
      entityId: assetId,
      centerId: asset.centerId,
      summary: "تم إعادة تفعيل أصل ثابت"
    });

    return updated;
  },

  // ─── Custody Logs ────────────────────────────────────────────────────────────

  async listCustodyLogs(scope: ScopeContext, query: { assetId?: number }) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
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
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    await assertUser(scope.organizationId, toUserId);

    return prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.findFirst({
        where: { id: assetId, organizationId: scope.organizationId }
      });
      if (!asset) throw new AppError("الأصل غير موجود", 404);
      financeV2Domain.ensureCenterAllowed(scope, asset.centerId);

      // منع تسليم أصل تالف / مستبعد / غير نشط
      if (BLOCKED_STATES.includes(asset.status)) {
        throw new AppError(
          `لا يمكن تسليم أصل بحالة "${asset.status}" — يجب أن يكون نشطاً أو بعهدة`,
          409
        );
      }

      // منع تسليم أصل له عهدة نشطة (returnedAt IS NULL)
      const existingCustody = await tx.assetCustodyLog.findFirst({
        where: { assetId, returnedAt: null }
      });
      if (existingCustody) {
        throw new AppError(
          "هذا الأصل له عهدة نشطة بالفعل — أخلِ العهدة الحالية قبل التسليم لشخص آخر",
          409
        );
      }

      const assignedAt = input.assignedAt ? parseDate(input.assignedAt, "assignedAt") : new Date();

      if (assignedAt < asset.purchaseDate) {
        throw new AppError("تاريخ التسليم لا يمكن أن يكون قبل تاريخ شراء الأصل", 400);
      }
      
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (assignedAt > today) {
        throw new AppError("تاريخ التسليم لا يمكن أن يكون في المستقبل", 400);
      }

      const custody = await tx.assetCustodyLog.create({
        data: {
          organizationId: scope.organizationId,
          assetId,
          fromUserId: null, // Since we don't rely on custodianUserId anymore, this could be queried from the last log, but it's okay to be null for now as per logic
          toUserId,
          centerId: asset.centerId,
          assignedAt,
          notes: optionalString(input.notes, 500),
          createdById: scope.userId
        },
        include: custodyInclude
      });

      // تحديث حالة الأصل إلى IN_CUSTODY إذا كان هناك مستلم
      await tx.fixedAsset.update({
        where: { id: assetId },
        data: {
          status: toUserId ? FixedAssetStatus.IN_CUSTODY : asset.status
        }
      });

      return custody;
    });
  },

  async releaseCustody(scope: ScopeContext, custodyId: number, input: ReleaseCustodyInput) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    if (!input.returnedAt) throw new AppError("تاريخ الإرجاع مطلوب", 400);
    const returnedAt = parseDate(input.returnedAt, "returnedAt");

    return prisma.$transaction(async (tx) => {
      const custody = await tx.assetCustodyLog.findFirst({
        where: { id: custodyId },
        include: { asset: true }
      });

      if (!custody) throw new AppError("سجل العهدة غير موجود", 404);
      if (!custody.asset || custody.asset.organizationId !== scope.organizationId) {
        throw new AppError("سجل العهدة غير موجود", 404);
      }
      financeV2Domain.ensureCenterAllowed(scope, custody.asset.centerId);

      if (custody.returnedAt) {
        throw new AppError("هذه العهدة تم إخلاؤها بالفعل", 409);
      }

      if (returnedAt < custody.assignedAt) {
        throw new AppError("تاريخ الإرجاع لا يمكن أن يكون قبل تاريخ التسليم", 400);
      }

      // تحديث سجل العهدة بتاريخ الإرجاع
      const updatedCustody = await tx.assetCustodyLog.update({
        where: { id: custodyId },
        data: {
          returnedAt,
          notes: input.notes ? optionalString(input.notes, 500) : custody.notes
        },
        include: custodyInclude
      });

      // إعادة الأصل إلى الحالة ACTIVE ومسح الموجوداتي
      await tx.fixedAsset.update({
        where: { id: custody.assetId },
        data: {
          status: FixedAssetStatus.ACTIVE,
          custodianUserId: null
        }
      });

      await addAudit({
        scope,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.FIXED_ASSET,
        entityId: custody.assetId,
        centerId: custody.asset.centerId,
        summary: "تم إخلاء عهدة أصل ثابت"
      });

      return updatedCustody;
    });
  },

  // ─── Acquisition & Depreciation ──────────────────────────────────────────────

  async postAssetAcquisition(scope: ScopeContext, assetId: number, input: PostAssetAcquisitionInput) {
    const financeAccountId = requiredPositiveInt(input.financeAccountId, "financeAccountId");

    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);
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
      const policy = await getEffectivePolicyTx(tx, {
        organizationId: scope.organizationId,
        centerId: asset.centerId
      });
      const voucherNo = await nextVoucherNoTx(tx, "DV", scope.organizationId);
      const voucher = await tx.financeVoucher.create({
        data: {
          organizationId: scope.organizationId,
          centerId: asset.centerId,
          accountId: financeAccount.id,
          voucherType: VoucherType.DISBURSEMENT,
          voucherNo,
          sourceType: VoucherSourceType.EXPENSE,
          sourceId: asset.id,
          amount,
          status: VoucherStatus.APPROVED,
          voucherDate: asset.purchaseDate,
          notes: `سداد اقتناء الأصل ${asset.assetCode}`,
          createdById: scope.userId,
          approvedById: scope.userId,
          approvedAt: new Date()
        }
      });

      await postVoucherTx(tx, {
        voucherId: voucher.id,
        postedById: scope.userId,
        movementType: FinanceMovementType.VOUCHER_DISBURSEMENT,
        allowOverdraft: policy.allowOverdraft
      });

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
          description: `اقتناء الأصل ${asset.assetCode} - ${asset.name}`,
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
                memo: `إثبات اقتناء الأصل: ${asset.name}`
              },
              {
                organizationId: scope.organizationId,
                accountId: creditAccount.id,
                centerId: asset.centerId,
                debit: 0,
                credit: amount,
                memo: `سداد قيمة الأصل من: ${creditAccount.name}`
              }
            ]
          }
        }
      });

      await tx.fixedAsset.update({
        where: { id: asset.id },
        data: { acquisitionJournalEntryId: entry.id }
      });

      await addAudit({
        scope,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.FIXED_ASSET,
        entityId: asset.id,
        centerId: asset.centerId,
        summary: "تم ترحيل اكتساب أصل ثابت"
      });

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

    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);
    return prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.findFirst({
        where: { id: assetId, organizationId: scope.organizationId },
        include: { category: true }
      });
      if (!asset) throw new AppError("الأصل غير موجود", 404);
      financeV2Domain.ensureCenterAllowed(scope, asset.centerId);

      // يُقبل الإهلاك للأصول النشطة وكذلك الأصول بعهدة
      if (!ACTIVE_STATES.includes(asset.status)) {
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

      await addAudit({
        scope,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.FIXED_ASSET,
        entityId: asset.id,
        centerId: asset.centerId,
        summary: "تم ترحيل إهلاك أصل ثابت"
      });

      return tx.fixedAsset.findUnique({
        where: { id: asset.id },
        include: assetInclude
      });
    });
  },

  async updateCustodyLog(scope: ScopeContext, custodyId: number, input: UpdateCustodyInput) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    return prisma.$transaction(async (tx) => {
      const custody = await tx.assetCustodyLog.findFirst({
        where: { id: custodyId },
        include: { asset: true }
      });
      if (!custody) throw new AppError("سجل العهدة غير موجود", 404);
      if (!custody.asset || custody.asset.organizationId !== scope.organizationId) {
        throw new AppError("سجل العهدة غير موجود", 404);
      }
      financeV2Domain.ensureCenterAllowed(scope, custody.asset.centerId);

      const assignedAt = input.assignedAt ? parseDate(input.assignedAt, "assignedAt") : custody.assignedAt;
      let returnedAt = custody.returnedAt;
      if (input.returnedAt !== undefined) {
        returnedAt = input.returnedAt ? parseDate(input.returnedAt, "returnedAt") : null;
      }

      if (assignedAt < custody.asset.purchaseDate) {
        throw new AppError("تاريخ التسليم لا يمكن أن يكون قبل تاريخ شراء الأصل", 400);
      }
      if (returnedAt && returnedAt < assignedAt) {
        throw new AppError("تاريخ الإرجاع لا يمكن أن يكون قبل تاريخ التسليم", 400);
      }

      const updatedCustody = await tx.assetCustodyLog.update({
        where: { id: custodyId },
        data: {
          toUserId: input.toUserId ? optionalPositiveInt(input.toUserId, "toUserId") : custody.toUserId,
          assignedAt,
          returnedAt,
          notes: input.notes !== undefined ? optionalString(input.notes, 500) : custody.notes,
        },
        include: custodyInclude
      });

      // Update asset status based on the active custody if it changed
      if (custody.returnedAt !== returnedAt) {
        // If we removed returnedAt, check if another custody is active
        if (!returnedAt) {
          const otherActive = await tx.assetCustodyLog.findFirst({
            where: { assetId: custody.assetId, returnedAt: null, id: { not: custodyId } }
          });
          if (otherActive) {
            throw new AppError("لا يمكن تفعيل هذه العهدة لأن الأصل بحوزة موظف آخر حالياً", 409);
          }
          await tx.fixedAsset.update({
            where: { id: custody.assetId },
            data: { status: FixedAssetStatus.IN_CUSTODY }
          });
        } else {
          // If we set returnedAt, make it ACTIVE
          await tx.fixedAsset.update({
            where: { id: custody.assetId },
            data: { status: FixedAssetStatus.ACTIVE, custodianUserId: null }
          });
        }
      }

      await addAudit({
        scope,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.FIXED_ASSET,
        entityId: custody.assetId,
        centerId: custody.asset.centerId,
        summary: "تم تعديل بيانات سجل عهدة الأصل"
      });

      return updatedCustody;
    });
  },

  async deleteCustodyLog(scope: ScopeContext, custodyId: number) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    return prisma.$transaction(async (tx) => {
      const custody = await tx.assetCustodyLog.findFirst({
        where: { id: custodyId },
        include: { asset: true }
      });
      if (!custody) throw new AppError("سجل العهدة غير موجود", 404);
      if (!custody.asset || custody.asset.organizationId !== scope.organizationId) {
        throw new AppError("سجل العهدة غير موجود", 404);
      }
      financeV2Domain.ensureCenterAllowed(scope, custody.asset.centerId);

      await tx.assetCustodyLog.delete({
        where: { id: custodyId }
      });

      // If we just deleted an active custody, the asset might need to be ACTIVE
      if (!custody.returnedAt) {
        await tx.fixedAsset.update({
          where: { id: custody.assetId },
          data: { status: FixedAssetStatus.ACTIVE, custodianUserId: null }
        });
      }

      await addAudit({
        scope,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.FIXED_ASSET,
        entityId: custody.assetId,
        centerId: custody.asset.centerId,
        summary: "تم حذف سجل عهدة الأصل نهائياً"
      });

      return { success: true };
    });
  }
};
