import "dotenv/config";
import {
  AuditAction,
  AuditEntityType,
  FinanceAccountType,
  FinanceMovementDirection,
  FinanceMovementType,
  Prisma,
  PrismaClient,
  VoucherSourceType,
  VoucherStatus,
  VoucherType
} from "@prisma/client";

const prisma = new PrismaClient();

type BackfillOptions = {
  dryRun: boolean;
  batchSize: number;
  organizationId?: number;
  limit?: number;
};

type LegacyPaymentRow = {
  id: number;
  invoiceId: number;
  organizationId: number | null;
  centerId: number | null;
  voucherId: number | null;
  amount: Prisma.Decimal;
  method: "CASH" | "TRANSFER";
  attachmentStorageKey: string | null;
  externalTransferRef: string | null;
  receivedAt: Date;
  receivedById: number;
  createdAt: Date;
  invoice: {
    id: number;
    centerId: number;
    center: {
      id: number;
      code: string | null;
      organizationId: number;
    };
  };
};

const parseOptions = (): BackfillOptions => {
  const options: BackfillOptions = {
    dryRun: false,
    batchSize: 100
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value > 0 && value <= 500) {
        options.batchSize = Math.floor(value);
      }
      continue;
    }

    if (arg.startsWith("--organization-id=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value > 0) {
        options.organizationId = Math.floor(value);
      }
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value > 0) {
        options.limit = Math.floor(value);
      }
      continue;
    }
  }

  return options;
};

const pad = (value: number, width: number) => String(value).padStart(width, "0");

const voucherPrefix = (centerCode: string | null, at: Date) => {
  const centerSegment = centerCode?.trim() ? centerCode.trim().toUpperCase() : "CENTER";
  const yyyy = at.getUTCFullYear();
  const mm = pad(at.getUTCMonth() + 1, 2);
  return `RCPT-${centerSegment}-${yyyy}${mm}`;
};

const toMoney = (value: Prisma.Decimal) => Number(value.toFixed(2));

const resolveSystemActorIdTx = async (
  tx: Prisma.TransactionClient,
  organizationId: number,
  preferredUserId: number | null | undefined
) => {
  if (preferredUserId) {
    const existing = await tx.user.findFirst({
      where: { id: preferredUserId, organizationId },
      select: { id: true }
    });
    if (existing) {
      return existing.id;
    }
  }

  const superAdmin = await tx.user.findFirst({
    where: { organizationId, role: "SUPER_ADMIN", isActive: true },
    orderBy: [{ id: "asc" }],
    select: { id: true }
  });

  if (superAdmin) {
    return superAdmin.id;
  }

  const fallbackUser = await tx.user.findFirst({
    where: { organizationId, isActive: true },
    orderBy: [{ id: "asc" }],
    select: { id: true }
  });

  if (!fallbackUser) {
    throw new Error(`No active actor user found for organization ${organizationId}`);
  }

  return fallbackUser.id;
};

const ensureCenterFundAccountTx = async (
  tx: Prisma.TransactionClient,
  input: { organizationId: number; centerId: number }
) => {
  const existing = await tx.financeAccount.findFirst({
    where: {
      organizationId: input.organizationId,
      centerId: input.centerId,
      accountType: FinanceAccountType.CENTER_FUND,
      isActive: true
    },
    select: { id: true, currentBalance: true }
  });

  if (existing) {
    return existing;
  }

  try {
    return await tx.financeAccount.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        accountType: FinanceAccountType.CENTER_FUND,
        openingBalance: new Prisma.Decimal(0),
        currentBalance: new Prisma.Decimal(0),
        currencyCode: "YER",
        isActive: true
      },
      select: { id: true, currentBalance: true }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const retry = await tx.financeAccount.findFirst({
        where: {
          organizationId: input.organizationId,
          centerId: input.centerId,
          accountType: FinanceAccountType.CENTER_FUND,
          isActive: true
        },
        select: { id: true, currentBalance: true }
      });
      if (retry) {
        return retry;
      }
    }

    throw error;
  }
};

const nextVoucherNoTx = async (
  tx: Prisma.TransactionClient,
  input: {
    organizationId: number;
    centerCode: string | null;
    effectiveDate: Date;
  }
) => {
  const prefix = voucherPrefix(input.centerCode, input.effectiveDate);
  const existingCount = await tx.financeVoucher.count({
    where: {
      organizationId: input.organizationId,
      voucherNo: { startsWith: `${prefix}-` }
    }
  });
  const next = existingCount + 1;
  return `${prefix}-${pad(next, 6)}`;
};

const loadLegacyPayments = async (options: BackfillOptions, lastId: number, remaining?: number) => {
  const take = remaining ? Math.min(options.batchSize, remaining) : options.batchSize;
  return prisma.payment.findMany({
    where: {
      id: { gt: lastId },
      voucherId: null,
      ...(options.organizationId ? { invoice: { center: { organizationId: options.organizationId } } } : {})
    },
    orderBy: [{ id: "asc" }],
    take,
    select: {
      id: true,
      invoiceId: true,
      organizationId: true,
      centerId: true,
      voucherId: true,
      amount: true,
      method: true,
      attachmentStorageKey: true,
      externalTransferRef: true,
      receivedAt: true,
      receivedById: true,
      createdAt: true,
      invoice: {
        select: {
          id: true,
          centerId: true,
          center: {
            select: {
              id: true,
              code: true,
              organizationId: true
            }
          }
        }
      }
    }
  }) as Promise<LegacyPaymentRow[]>;
};

const processSinglePayment = async (payment: LegacyPaymentRow, dryRun: boolean) => {
  const organizationId = payment.organizationId ?? payment.invoice.center.organizationId;
  const centerId = payment.centerId ?? payment.invoice.centerId;
  const effectiveDate = payment.receivedAt ?? payment.createdAt;

  if (dryRun) {
    return {
      paymentId: payment.id,
      voucherNo: voucherPrefix(payment.invoice.center.code, effectiveDate),
      dryRun: true as const
    };
  }

  return prisma.$transaction(async (tx) => {
    const locked = await tx.payment.findUnique({
      where: { id: payment.id },
      select: {
        id: true,
        voucherId: true,
        invoiceId: true,
        amount: true,
        method: true,
        attachmentStorageKey: true,
        externalTransferRef: true,
        receivedAt: true,
        receivedById: true,
        organizationId: true,
        centerId: true
      }
    });

    if (!locked) {
      return { paymentId: payment.id, skipped: "PAYMENT_NOT_FOUND" as const };
    }

    if (locked.voucherId) {
      return { paymentId: payment.id, skipped: "ALREADY_BACKFILLED" as const };
    }

    const actorId = await resolveSystemActorIdTx(tx, organizationId, locked.receivedById);
    const account = await ensureCenterFundAccountTx(tx, {
      organizationId,
      centerId
    });

    await tx.$queryRaw`
      SELECT id
      FROM "finance_accounts"
      WHERE id = ${account.id}
      FOR UPDATE
    `;

    const accountLocked = await tx.financeAccount.findUnique({
      where: { id: account.id },
      select: { id: true, currentBalance: true }
    });

    if (!accountLocked) {
      throw new Error(`Finance account ${account.id} was not found during lock`);
    }

    const voucherNo = await nextVoucherNoTx(tx, {
      organizationId,
      centerCode: payment.invoice.center.code,
      effectiveDate
    });

    const voucher = await tx.financeVoucher.create({
      data: {
        organizationId,
        centerId,
        accountId: account.id,
        voucherType: VoucherType.RECEIPT,
        voucherNo,
        sourceType: VoucherSourceType.PAYMENT,
        sourceId: locked.invoiceId,
        paymentMethod: locked.method,
        amount: locked.amount,
        status: VoucherStatus.POSTED,
        attachmentStorageKey: locked.attachmentStorageKey,
        externalTransferRef: locked.externalTransferRef,
        notes: "Legacy payment backfill",
        createdById: actorId,
        approvedById: actorId,
        postedById: actorId,
        submittedAt: effectiveDate,
        approvedAt: effectiveDate,
        postedAt: effectiveDate
      },
      select: { id: true, voucherNo: true, amount: true }
    });

    const balanceBefore = accountLocked.currentBalance;
    const balanceAfter = balanceBefore.plus(locked.amount);

    const movement = await tx.financeAccountMovement.create({
      data: {
        organizationId,
        accountId: account.id,
        voucherId: voucher.id,
        movementType: FinanceMovementType.LEGACY_BACKFILL,
        direction: FinanceMovementDirection.IN,
        amount: locked.amount,
        balanceBefore,
        balanceAfter,
        postedAt: effectiveDate
      },
      select: { id: true }
    });

    await tx.financeAccount.update({
      where: { id: account.id },
      data: { currentBalance: balanceAfter }
    });

    await tx.payment.update({
      where: { id: locked.id },
      data: {
        organizationId,
        centerId,
        voucherId: voucher.id
      }
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        centerId,
        actorUserId: null,
        actorRole: "SYSTEM",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.PAYMENT,
        entityId: locked.id,
        summary: "FINANCE_MIGRATION_BACKFILL",
        metadata: {
          paymentId: locked.id,
          voucherId: voucher.id,
          voucherNo: voucher.voucherNo,
          movementId: movement.id,
          amount: toMoney(voucher.amount),
          source: "backfill-finance-v2-script"
        } as Prisma.InputJsonValue
      }
    });

    return {
      paymentId: locked.id,
      voucherId: voucher.id,
      voucherNo: voucher.voucherNo,
      movementId: movement.id
    };
  });
};

const main = async () => {
  const startedAt = Date.now();
  const options = parseOptions();

  let totalScanned = 0;
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let lastId = 0;
  let remaining = options.limit;

  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "start",
        options
      },
      null,
      2
    )
  );

  while (remaining === undefined || remaining > 0) {
    const batch = await loadLegacyPayments(options, lastId, remaining);
    if (!batch.length) {
      break;
    }

    for (const payment of batch) {
      totalScanned += 1;
      lastId = payment.id;
      if (remaining !== undefined) {
        remaining -= 1;
      }

      try {
        const result = await processSinglePayment(payment, options.dryRun);
        if ("skipped" in result) {
          totalSkipped += 1;
        } else {
          totalProcessed += 1;
        }
      } catch (error) {
        totalFailed += 1;
        console.error(
          JSON.stringify(
            {
              ok: false,
              step: "payment_failed",
              paymentId: payment.id,
              error: error instanceof Error ? error.message : String(error)
            },
            null,
            2
          )
        );
      }

      if (remaining !== undefined && remaining <= 0) {
        break;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "done",
        dryRun: options.dryRun,
        totalScanned,
        totalProcessed,
        totalSkipped,
        totalFailed,
        durationMs: Date.now() - startedAt
      },
      null,
      2
    )
  );
};

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          step: "fatal",
          error: error instanceof Error ? error.message : String(error)
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
