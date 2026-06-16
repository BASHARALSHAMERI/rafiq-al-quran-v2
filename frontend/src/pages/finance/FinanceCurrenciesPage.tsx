import { useEffect, useMemo, useState } from "react";
import { 
  AlertCircle, 
  CircleDollarSign, 
  Coins, 
  Plus, 
  RefreshCw, 
  TrendingUp,
  Search,
  Filter
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import {
  useCreateCurrencyMutation,
  useCreateExchangeRateMutation,
  useCurrenciesQuery,
  useExchangeRatesQuery,
  usePredefinedCurrenciesQuery
} from "../../features/finance-v2/finance-v2.hooks";
import { 
  FinancePageShell, 
  FinancePageHeader,
  FinanceDataTable,
  FinanceEmptyState,
  FinanceTableFooter
} from "../../features/finance-v2/design";
import type { CurrencyV2, ExchangeRateV2 } from "../../features/finance-v2/types";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifyInfo, notifySuccess } from "../../shared/ui/feedback";
import useClientPagination from "../../shared/ui/useClientPagination";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";
import { motion } from "framer-motion";

type TabType = "currencies" | "exchange-rates";

function VouchersKpi({
  icon: Icon,
  cls,
  val,
  label
}: {
  icon: React.ElementType;
  cls: string;
  val: React.ReactNode;
  label: string;
}) {
  return (
    <motion.div
      className={`ctr-kpi-modern ${cls}`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
    >
      <div className="ctr-kpi-icon-wrap">
        <Icon size={24} />
      </div>
      <div className="ctr-kpi-content">
        <span className="ctr-kpi-val">{val}</span>
        <span className="ctr-kpi-label">{label}</span>
      </div>
    </motion.div>
  );
}

export default function FinanceCurrenciesPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canManageCurrencies = user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";

  useEffect(() => {
    if (sessionStorage.getItem("currencies-guide-shown")) return;
    sessionStorage.setItem("currencies-guide-shown", "1");
    notifyInfo(ar
      ? "أضف العملات التي تستخدمها الجمعية، وحدد العملة الأساسية للتقارير (عادة YER)، ثم سجل أسعار الصرف المعتمدة يدويًا، واستخدم العملات في التبرعات والسندات."
      : "Add currencies used by your organization, set the base currency for reports (usually YER), record approved exchange rates manually, then use currencies in donations and vouchers.");
  }, [ar]);
  const [activeTab, setActiveTab] = useState<TabType>("currencies");
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [currencyCode, setCurrencyCode] = useState("");
  const [rateForm, setRateForm] = useState({
    currencyCode: "",
    rateToBase: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    source: "",
    notes: ""
  });

  const currenciesQ = useCurrenciesQuery();
  const predefinedQ = usePredefinedCurrenciesQuery();
  const exchangeRatesQ = useExchangeRatesQuery();
  const createCurrencyM = useCreateCurrencyMutation();
  const createRateM = useCreateExchangeRateMutation();

  const currencies = currenciesQ.data ?? [];
  const predefined = predefinedQ.data ?? [];
  const exchangeRates = exchangeRatesQ.data ?? [];
  const baseCurrency = currencies.find((currency) => currency.isBase);
  const activeCurrencies = currencies.filter((currency) => currency.isActive);
  const foreignCurrencies = activeCurrencies.filter((currency) => !currency.isBase && currency.code !== "YER");
  const numberLocale = ar ? "ar-YE-u-nu-latn" : "en-US";

  const latestRates = useMemo(() => {
    const map = new Map<string, ExchangeRateV2>();
    for (const rate of exchangeRates) {
      if (!map.has(rate.currencyCode)) map.set(rate.currencyCode, rate);
    }
    return Array.from(map.values());
  }, [exchangeRates]);

  const availablePredefined = useMemo(
    () => predefined.filter((item) => !currencies.some((currency) => currency.code === item.code)),
    [currencies, predefined]
  );

  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) return currencies;
    return currencies.filter(c => 
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nameAr.includes(searchTerm) ||
      c.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currencies, searchTerm]);

  const filteredRates = useMemo(() => {
    if (!searchTerm) return latestRates;
    return latestRates.filter(r => 
      r.currencyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.source?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [latestRates, searchTerm]);
  const currenciesPagination = useClientPagination(filteredCurrencies, { initialPageSize: 10, resetKey: searchTerm });
  const ratesPagination = useClientPagination(filteredRates, { initialPageSize: 10, resetKey: searchTerm });
  const activePagination = activeTab === "currencies" ? currenciesPagination : ratesPagination;

  const isLoading = currenciesQ.isLoading || predefinedQ.isLoading || exchangeRatesQ.isLoading;
  const isError = currenciesQ.isError || predefinedQ.isError || exchangeRatesQ.isError;

  const refreshAll = () => {
    void currenciesQ.refetch();
    void predefinedQ.refetch();
    void exchangeRatesQ.refetch();
  };

  const handleCreateCurrency = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currencyCode) return;
    const selected = predefined.find((currency) => currency.code === currencyCode);
    if (!selected) return;

    try {
      await createCurrencyM.mutateAsync({
        code: selected.code,
        nameAr: selected.nameAr,
        nameEn: selected.nameEn,
        symbol: selected.symbol,
        decimalPlaces: selected.decimalPlaces,
        isBase: currencies.length === 0 && selected.code === "YER",
        isActive: true
      });
      setCurrencyCode("");
      setCurrencyModalOpen(false);
      notifySuccess(ar ? "تمت إضافة العملة بنجاح" : "Currency added successfully");
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: ar ? "تعذر إضافة العملة" : "Unable to add currency"
        })
      );
    }
  };

  const handleCreateRate = async (event: React.FormEvent) => {
    event.preventDefault();
    const rate = Number(rateForm.rateToBase);
    if (!rateForm.currencyCode || !Number.isFinite(rate) || rate <= 0) {
      notifyError(ar ? "أدخل العملة وسعر صرف صحيح" : "Enter a valid currency and rate");
      return;
    }

    try {
      await createRateM.mutateAsync({
        currencyCode: rateForm.currencyCode,
        rateToBase: rate,
        effectiveDate: rateForm.effectiveDate,
        source: rateForm.source.trim() || undefined,
        notes: rateForm.notes.trim() || undefined
      });
      setRateForm((previous) => ({ ...previous, rateToBase: "", source: "", notes: "" }));
      setRateModalOpen(false);
      notifySuccess(ar ? "تم حفظ سعر الصرف بنجاح" : "Exchange rate saved successfully");
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: ar ? "تعذر حفظ سعر الصرف" : "Unable to save exchange rate"
        })
      );
    }
  };

  const currencyColumns = useMemo(() => [
    {
      id: "currency",
      header: ar ? "العملة" : "Currency",
      width: "42%",
      cell: (currency: CurrencyV2) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-base font-bold text-brand-700">
            {currency.symbol}
          </span>
          <div>
            <div className="font-semibold text-slate-900">{ar ? currency.nameAr : currency.nameEn}</div>
            <div className="text-xs text-slate-500 font-mono">{currency.code}</div>
          </div>
        </div>
      )
    },
    {
      id: "decimalPlaces",
      header: ar ? "الخانات" : "Decimals",
      width: 110,
      align: "center" as const,
      cell: (currency: CurrencyV2) => <span className="tabular-nums font-medium text-slate-700">{currency.decimalPlaces}</span>
    },
    {
      id: "type",
      header: ar ? "النوع" : "Type",
      width: 150,
      align: "center" as const,
      cell: (currency: CurrencyV2) => currency.isBase
        ? <span className="acc-chip acc-chip--success px-3">{ar ? "أساسية" : "Base"}</span>
        : <span className="acc-chip acc-chip--muted px-3">{ar ? "تشغيلية" : "Operating"}</span>
    },
    {
      id: "status",
      header: ar ? "الحالة" : "Status",
      width: 150,
      align: "center" as const,
      cell: (currency: CurrencyV2) => (
        <span className={`acc-chip ${currency.isActive ? 'acc-chip--success' : 'acc-chip--muted'} px-3`}>
          {currency.isActive ? (ar ? "نشطة" : "Active") : (ar ? "غير نشطة" : "Inactive")}
        </span>
      )
    }
  ], [ar]);

  const rateColumns = useMemo(() => [
    {
      id: "currency",
      header: ar ? "العملة" : "Currency",
      width: "34%",
      cell: (rate: ExchangeRateV2) => {
        const currency = currencies.find((item) => item.code === rate.currencyCode);
        return (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
              {currency?.symbol ?? rate.currencyCode.slice(0, 2)}
            </span>
            <div>
              <div className="font-semibold text-slate-900">{rate.currencyCode}</div>
              <div className="text-xs text-slate-500">{currency ? (ar ? currency.nameAr : currency.nameEn) : "-"}</div>
            </div>
          </div>
        );
      }
    },
    {
      id: "rateToBase",
      header: ar ? "سعر الصرف" : "Exchange Rate",
      width: 210,
      align: "end" as const,
      cell: (rate: ExchangeRateV2) => (
        <span className="font-bold tabular-nums text-brand-700 bg-brand-50 px-2 py-1 rounded-md border border-brand-100 whitespace-nowrap">
          {rate.rateToBase.toLocaleString(numberLocale)} <small className="text-[10px] text-slate-500 uppercase ms-1">YER</small>
        </span>
      )
    },
    {
      id: "effectiveDate",
      header: ar ? "تاريخ السريان" : "Effective Date",
      width: 160,
      align: "center" as const,
      cell: (rate: ExchangeRateV2) => <span className="text-slate-600 font-medium">{rate.effectiveDate.slice(0, 10)}</span>
    },
    {
      id: "source",
      header: ar ? "المصدر" : "Source",
      width: "28%",
      cell: (rate: ExchangeRateV2) => rate.source || <span className="text-slate-400">-</span>
    }
  ], [ar, currencies, numberLocale]);

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir="rtl"
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "العملات وأسعار الصرف" : "Currencies & Exchange Rates"}
            subtitle={ar ? "إدارة العملات التشغيلية وسعر التحويل إلى العملة الأساسية" : "Manage operating currencies and conversion rates"}
            icon={<CircleDollarSign className="h-6 w-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="glass-btn"
                  onClick={refreshAll}
                  leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />}
                >
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                {canManageCurrencies && activeTab === "currencies" ? (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="shadow-lg shadow-brand-500/20" 
                    onClick={() => setCurrencyModalOpen(true)} 
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {ar ? "إضافة عملة" : "Add Currency"}
                  </Button>
                ) : canManageCurrencies ? (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="shadow-lg shadow-brand-500/20" 
                    onClick={() => setRateModalOpen(true)} 
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {ar ? "تسجيل سعر صرف" : "Save Rate"}
                  </Button>
                ) : null}
              </div>
            }
          />
          <nav className="exams-tabs-bar mt-6" aria-label={ar ? "تبويبات العملات" : "Currency tabs"}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "currencies"}
              className={`exams-tab-btn ${activeTab === "currencies" ? "exams-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("currencies")}
            >
              <Coins size={16} />
              <span>{ar ? "العملات" : "Currencies"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "exchange-rates"}
              className={`exams-tab-btn ${activeTab === "exchange-rates" ? "exams-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("exchange-rates")}
            >
              <TrendingUp size={16} />
              <span>{ar ? "أسعار الصرف" : "Exchange Rates"}</span>
            </button>
          </nav>
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          <VouchersKpi 
            icon={CircleDollarSign} 
            cls="brand" 
            val={baseCurrency?.code ?? "YER"} 
            label={ar ? "العملة الأساسية" : "Base Currency"} 
          />
          <VouchersKpi 
            icon={Coins} 
            cls="emerald" 
            val={activeCurrencies.length.toLocaleString(numberLocale)} 
            label={ar ? "عملات نشطة" : "Active Currencies"} 
          />
          <VouchersKpi 
            icon={TrendingUp} 
            cls="amber" 
            val={foreignCurrencies.length.toLocaleString(numberLocale)} 
            label={ar ? "عملات أجنبية" : "Foreign Currencies"} 
          />
          <VouchersKpi 
            icon={TrendingUp} 
            cls="violet" 
            val={exchangeRates.length.toLocaleString(numberLocale)} 
            label={ar ? "أسعار محفوظة" : "Saved Rates"} 
          />
        </div>
      }
      toolbar={
        <div className="ctr-controls">
          <div className="ctr-search-wrap">
            <Search className="ctr-search-icon" size={18} />
            <input 
              className="ctr-search-input"
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder={ar ? "بحث بالكود أو الاسم..." : "Search code or name..."} 
            />
          </div>
          <div className="ctr-filters-group">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border-none shadow-sm">
              <Filter size={16} className="text-slate-400 ms-2" />
              <div className="text-xs font-semibold text-slate-500 px-2 uppercase">
                {activeTab === "currencies" ? (ar ? "قائمة العملات" : "Currencies List") : (ar ? "سجل الأسعار" : "Rates Log")}
              </div>
            </div>
            {searchTerm && (
              <button 
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline px-2"
                onClick={() => setSearchTerm("")}
              >
                {ar ? "تصفير" : "Clear"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {isError ? (
        <FinanceEmptyState
          variant="filtered"
          icon={<AlertCircle className="finance-empty-state__icon text-rose-500" />}
          title={ar ? "تعذر تحميل بيانات العملات" : "Unable to load currency data"}
          description={ar ? "حاول التحديث أو راجع الاتصال بالخادم." : "Refresh or check the server connection."}
          action={
            <Button variant="secondary" size="sm" onClick={refreshAll} leftIcon={<RefreshCw className="h-4 w-4" />}>
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          }
        />
      ) : (
        <div className="mt-6 animate-premium">
          <div className="fin-premium-panel">
            <div className="fin-premium-panel__content p-0">
              {activeTab === "currencies" ? (
                <FinanceDataTable<CurrencyV2>
                  rows={currenciesPagination.pagedRows}
                  columns={currencyColumns}
                  rowKey="id"
                  loading={isLoading}
                  density="dense"
                  className="fin-premium-table"
                  rowClassName={() => "receipt"}
                />
              ) : (
                <FinanceDataTable<ExchangeRateV2>
                  rows={ratesPagination.pagedRows}
                  columns={rateColumns}
                  rowKey="id"
                  loading={isLoading}
                  density="dense"
                  className="fin-premium-table"
                  rowClassName={() => "receipt"}
                />
              )}
            </div>
          </div>
          <FinanceTableFooter
            ar={ar}
            pageSize={activePagination.pageSize}
            setPageSize={activePagination.setPageSize}
            currentPage={activePagination.currentPage}
            setPage={activePagination.setCurrentPage}
            totalFilteredCount={activePagination.totalItems}
            pages={activePagination.totalPages}
          />
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={Boolean(currencyModalOpen && canManageCurrencies)}
        onClose={() => setCurrencyModalOpen(false)}
        title={ar ? "إضافة عملة تشغيلية" : "Add Operating Currency"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Coins className="w-4 h-4" />
          </div>
        }
        size="sm"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setCurrencyModalOpen(false)} type="button">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="currency-form" isLoading={createCurrencyM.isPending}>
              {ar ? "إضافة العملة" : "Add Currency"}
            </Button>
          </div>
        }
      >
        <form id="currency-form" className="circlemod-form" onSubmit={handleCreateCurrency}>
          <div className="circlemod-section">
            <div className="circlemod-field">
              <label className="circlemod-label">{ar ? "اختر العملة من القائمة المعيارية" : "Select Standard Currency"}</label>
              <select
                className="circlemod-input"
                value={currencyCode}
                onChange={(event) => setCurrencyCode(event.target.value)}
                required
              >
                <option value="">{ar ? "اختر عملة..." : "Select currency..."}</option>
                {availablePredefined.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {ar ? currency.nameAr : currency.nameEn} ({currency.code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-2">
                {ar ? "* سيتم إضافة العملة بكافة تفاصيلها المعيارية تلقائياً." : "* Currency details will be added automatically."}
              </p>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(rateModalOpen && canManageCurrencies)}
        onClose={() => setRateModalOpen(false)}
        title={ar ? "تسجيل سعر صرف جديد" : "Save New Exchange Rate"}
        titleIcon={
          <div className="circlemod-head-icon">
            <TrendingUp className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setRateModalOpen(false)} type="button">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="rate-form" isLoading={createRateM.isPending}>
              {ar ? "حفظ السعر" : "Save Rate"}
            </Button>
          </div>
        }
      >
        <form id="rate-form" className="circlemod-form" onSubmit={handleCreateRate}>
          <div className="circlemod-section">
            <div className="circlemod-form-grid">
              <div className="circlemod-field">
                <label className="circlemod-label">{ar ? "العملة الأجنبية" : "Foreign Currency"}</label>
                <select
                  className="circlemod-input"
                  value={rateForm.currencyCode}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, currencyCode: event.target.value }))}
                  required
                >
                  <option value="">{ar ? "اختر العملة..." : "Select..."}</option>
                  {foreignCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>{currency.code} - {ar ? currency.nameAr : currency.nameEn}</option>
                  ))}
                </select>
              </div>
              <div className="circlemod-field">
                <label className="circlemod-label">{ar ? "سعر الصرف (YER)" : "Exchange Rate (YER)"}</label>
                <input
                  className="circlemod-input"
                  type="number"
                  step="any"
                  min="0"
                  value={rateForm.rateToBase}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, rateToBase: event.target.value }))}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="circlemod-field">
                <label className="circlemod-label">{ar ? "تاريخ السريان" : "Effective Date"}</label>
                <input
                  className="circlemod-input"
                  type="date"
                  value={rateForm.effectiveDate}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, effectiveDate: event.target.value }))}
                  required
                />
              </div>
              <div className="circlemod-field">
                <label className="circlemod-label">{ar ? "المصدر" : "Source"}</label>
                <input
                  className="circlemod-input"
                  value={rateForm.source}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, source: event.target.value }))}
                  placeholder={ar ? "مثلاً: البنك المركزي" : "e.g. Central Bank"}
                />
              </div>
              <div className="circlemod-field md:col-span-2">
                <label className="circlemod-label">{ar ? "ملاحظات إضافية" : "Additional Notes"}</label>
                <input
                  className="circlemod-input"
                  value={rateForm.notes}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </FinancePageShell>
  );
}
