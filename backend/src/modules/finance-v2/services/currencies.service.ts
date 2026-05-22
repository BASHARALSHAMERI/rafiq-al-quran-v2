/**
 * FA-UX-4: Currencies Lite Service
 * Safe integration with donations and vouchers.
 */
import { prisma } from "../../../shared/db/prisma";
import { AppError } from "../../../shared/errors/app-error";
import type { ScopeContext } from "../../../shared/types/auth.types";

interface CurrencyDef {
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  decimalPlaces: number;
}

const PREDEFINED_CURRENCIES: CurrencyDef[] = [
  { code: "YER", nameAr: "الريال اليمني", nameEn: "Yemeni Rial", symbol: "ر.ي", decimalPlaces: 0 },
  { code: "USD", nameAr: "الدولار الأمريكي", nameEn: "US Dollar", symbol: "$", decimalPlaces: 2 },
  { code: "SAR", nameAr: "الريال السعودي", nameEn: "Saudi Riyal", symbol: "ر.س", decimalPlaces: 2 },
  { code: "AED", nameAr: "الدرهم الإماراتي", nameEn: "UAE Dirham", symbol: "د.إ", decimalPlaces: 2 },
  { code: "QAR", nameAr: "الريال القطري", nameEn: "Qatari Riyal", symbol: "ر.ق", decimalPlaces: 2 },
  { code: "KWD", nameAr: "الدينار الكويتي", nameEn: "Kuwaiti Dinar", symbol: "د.ك", decimalPlaces: 3 },
  { code: "OMR", nameAr: "الريال العماني", nameEn: "Omani Rial", symbol: "ر.ع", decimalPlaces: 3 },
  { code: "BHD", nameAr: "الدينار البحريني", nameEn: "Bahraini Dinar", symbol: "د.ب", decimalPlaces: 3 },
  { code: "TRY", nameAr: "الليرة التركية", nameEn: "Turkish Lira", symbol: "₺", decimalPlaces: 2 },
  { code: "EUR", nameAr: "اليورو", nameEn: "Euro", symbol: "€", decimalPlaces: 2 }
];

export interface CreateCurrencyInput {
  code: string;
  nameAr?: string;
  nameEn?: string;
  symbol?: string;
  decimalPlaces?: number;
  isBase?: boolean;
  isActive?: boolean;
}

export interface CreateExchangeRateInput {
  currencyCode: string;
  rateToBase: number;
  effectiveDate: string;
  source?: string;
  notes?: string;
}

const normalizeCurrencyCode = (code: string) => code.trim().toUpperCase();

function getPredefinedCurrency(code: string) {
  return PREDEFINED_CURRENCIES.find((currency) => currency.code === code);
}

export async function listCurrencies(scope: ScopeContext) {
  return prisma.currency.findMany({
    where: { organizationId: scope.organizationId },
    orderBy: [{ isBase: "desc" }, { code: "asc" }]
  });
}

export async function getAvailablePredefinedCurrencies(scope: ScopeContext) {
  const existing = await prisma.currency.findMany({
    where: { organizationId: scope.organizationId },
    select: { code: true }
  });

  const existingCodes = new Set(existing.map((currency) => currency.code));
  return PREDEFINED_CURRENCIES.filter((currency) => !existingCodes.has(currency.code));
}

export async function createCurrency(scope: ScopeContext, input: CreateCurrencyInput) {
  const organizationId = scope.organizationId;
  const code = normalizeCurrencyCode(input.code);
  const predefined = getPredefinedCurrency(code);

  if (!predefined) {
    throw new AppError("Currency code is not supported", 400, undefined, "INVALID_CURRENCY_CODE");
  }

  const existing = await prisma.currency.findUnique({
    where: { organizationId_code: { organizationId, code } }
  });
  if (existing) {
    throw new AppError("Currency already exists", 409, undefined, "DUPLICATE_CURRENCY_CODE");
  }

  if (input.isBase) {
    const existingBase = await prisma.currency.findFirst({
      where: { organizationId, isBase: true }
    });
    if (existingBase) {
      throw new AppError("A base currency already exists", 409, undefined, "BASE_CURRENCY_EXISTS");
    }
  }

  return prisma.currency.create({
    data: {
      organizationId,
      code,
      nameAr: input.nameAr || predefined.nameAr,
      nameEn: input.nameEn || predefined.nameEn,
      symbol: input.symbol || predefined.symbol,
      decimalPlaces: input.decimalPlaces ?? predefined.decimalPlaces,
      isBase: input.isBase ?? false,
      isActive: input.isActive ?? true
    }
  });
}

export async function updateCurrency(
  scope: ScopeContext,
  id: number,
  input: Partial<CreateCurrencyInput>
) {
  const organizationId = scope.organizationId;

  const currency = await prisma.currency.findFirst({
    where: { id, organizationId }
  });
  if (!currency) {
    throw new AppError("Currency not found", 404, undefined, "CURRENCY_NOT_FOUND");
  }

  if (input.isBase && !currency.isBase) {
    const existingBase = await prisma.currency.findFirst({
      where: { organizationId, isBase: true }
    });
    if (existingBase && existingBase.id !== id) {
      throw new AppError("A base currency already exists", 409, undefined, "BASE_CURRENCY_EXISTS");
    }
  }

  return prisma.currency.update({
    where: { id },
    data: {
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      symbol: input.symbol,
      decimalPlaces: input.decimalPlaces,
      isBase: input.isBase,
      isActive: input.isActive
    }
  });
}

export async function listExchangeRates(scope: ScopeContext, currencyCode?: string) {
  const code = currencyCode ? normalizeCurrencyCode(currencyCode) : undefined;

  return prisma.exchangeRate.findMany({
    where: {
      organizationId: scope.organizationId,
      ...(code ? { currencyCode: code } : {})
    },
    orderBy: [{ currencyCode: "asc" }, { effectiveDate: "desc" }],
    include: { currency: true }
  });
}

export async function getLatestExchangeRate(scope: ScopeContext, currencyCode: string) {
  return prisma.exchangeRate.findFirst({
    where: {
      organizationId: scope.organizationId,
      currencyCode: normalizeCurrencyCode(currencyCode)
    },
    orderBy: { effectiveDate: "desc" },
    include: { currency: true }
  });
}

export async function createExchangeRate(scope: ScopeContext, input: CreateExchangeRateInput) {
  const organizationId = scope.organizationId;
  const currencyCode = normalizeCurrencyCode(input.currencyCode);

  const currency = await prisma.currency.findFirst({
    where: { organizationId, code: currencyCode, isActive: true }
  });
  if (!currency) {
    throw new AppError("Currency not found or inactive", 404, undefined, "CURRENCY_NOT_FOUND");
  }

  if (currency.isBase && input.rateToBase !== 1) {
    throw new AppError(
      "Base currency rate must be 1",
      400,
      undefined,
      "BASE_CURRENCY_RATE_MUST_BE_ONE"
    );
  }

  if (input.rateToBase <= 0) {
    throw new AppError("Exchange rate must be greater than zero", 400, undefined, "INVALID_RATE");
  }

  return prisma.exchangeRate.create({
    data: {
      organizationId,
      currencyCode,
      rateToBase: input.rateToBase,
      effectiveDate: new Date(input.effectiveDate),
      source: input.source,
      notes: input.notes
    },
    include: { currency: true }
  });
}

export async function getBaseCurrency(scope: ScopeContext) {
  return prisma.currency.findFirst({
    where: { organizationId: scope.organizationId, isBase: true }
  });
}

export function calculateBaseAmount(originalAmount: number, exchangeRateToBase: number): number {
  return Number((originalAmount * exchangeRateToBase).toFixed(2));
}
