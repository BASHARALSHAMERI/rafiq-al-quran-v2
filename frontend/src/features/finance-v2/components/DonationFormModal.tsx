import { useCallback, useEffect, useMemo } from "react";
import {
  Heart,
  User,
  Building2,
  Coins,
  ArrowLeftRight,
  CreditCard,
  Calendar,
  StickyNote,
  AlertCircle,
  Target
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { notifyInfo } from "../../../shared/ui/feedback";
import type { CurrencyV2, PaymentMethodV2 } from "../types";
import { useLatestExchangeRateQuery } from "../finance-v2.hooks";

interface DonationFormState {
  donorId: string;
  centerId: string;
  originalAmount: string;
  originalCurrencyCode: string;
  exchangeRateToBase: string;
  donationDate: string;
  paymentMethod: PaymentMethodV2;
  purpose: string;
  mode: "RECEIVED" | "PLEDGED";
  pledgeDueDate: string;
  notes: string;
}

interface DonationFormModalProps {
  ar: boolean;
  isOpen: boolean;
  onClose: () => void;
  form: DonationFormState;
  setForm: React.Dispatch<React.SetStateAction<DonationFormState>>;
  pending: boolean;
  error: string | null;
  donors: Array<{ id: number; name: string }>;
  centers: Array<{ id: number; name: string }>;
  currencies: CurrencyV2[];
  onSave: (e: React.FormEvent) => void;
}

export default function DonationFormModal({
  ar,
  isOpen,
  onClose,
  form,
  setForm,
  pending,
  error,
  donors,
  centers,
  currencies,
  onSave
}: DonationFormModalProps) {
  const handleChange = useCallback(
    (field: keyof DonationFormState, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [setForm]
  );

  const currencyOptions = useMemo(() => {
    const active = currencies.filter((c) => c.isActive);
    if (active.some((c) => c.code === "YER")) return active;
    return [
      {
        id: 0,
        organizationId: 0,
        code: "YER",
        nameAr: "الريال اليمني",
        nameEn: "Yemeni Rial",
        symbol: "ر.ي",
        decimalPlaces: 0,
        isBase: true,
        isActive: true,
        createdAt: "",
        updatedAt: ""
      } as CurrencyV2,
      ...active
    ];
  }, [currencies]);

  const isYer = (form.originalCurrencyCode || "YER").toUpperCase() === "YER";

  const latestRateQ = useLatestExchangeRateQuery(isYer ? undefined : form.originalCurrencyCode);
  useEffect(() => {
    if (isYer) {
      if (form.exchangeRateToBase !== "1") {
        setForm((prev) => ({ ...prev, exchangeRateToBase: "1" }));
      }
      return;
    }
    if (form.exchangeRateToBase) return;
    const latest = latestRateQ.data?.rateToBase;
    if (latest && Number(latest) > 0) {
      setForm((prev) => ({ ...prev, exchangeRateToBase: String(latest) }));
    }
  }, [isYer, form.originalCurrencyCode, form.exchangeRateToBase, latestRateQ.data, setForm]);

  useEffect(() => {
    if (!isOpen) return;
    const t1 = setTimeout(() => {
      notifyInfo(ar
        ? "سيتم حفظ المبلغ الأصلي وسعر الصرف، بينما تُسجل القيود بالمبلغ المعادل بالريال اليمني."
        : "The original amount and exchange rate will be saved; journal entries are posted using the YER equivalent only.");
    }, 300);
    const t2 = setTimeout(() => {
      notifyInfo(form.mode === "RECEIVED"
        ? ar
          ? "سيتم إنشاء سند قبض كمسودة مرتبط بهذا التبرع. لن يظهر الأثر المحاسبي حتى يتم ترحيل السند من صفحة السندات."
          : "A draft receipt voucher will be created and linked to this donation. The accounting impact will not appear until the voucher is posted from the Vouchers page."
        : ar
          ? "لن يتم إنشاء سند قبض أو قيد محاسبي حتى يتم استلام التعهد لاحقًا."
          : "No receipt voucher or journal entry will be created until the pledge is received later.");
    }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isOpen, ar, form.mode]);

  const baseAmount = useMemo(() => {
    const amt = Number(form.originalAmount);
    const rate = Number(form.exchangeRateToBase || (isYer ? 1 : 0));
    if (!Number.isFinite(amt) || !Number.isFinite(rate) || amt <= 0 || rate <= 0) return null;
    return Math.round(amt * rate * 100) / 100;
  }, [form.originalAmount, form.exchangeRateToBase, isYer]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ar ? "إضافة تبرع أو تعهد جديد" : "Add New Donation or Pledge"}
      titleIcon={
        <div className="circlemod-head-icon">
          <Heart className="w-4 h-4" />
        </div>
      }
      size="lg"
      panelClassName="circlemod-panel"
      bodyClassName="circlemod-body"
      footerClassName="circlemod-footer-wrap"
      footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="primary" isLoading={pending} onClick={onSave}>
            {ar ? "حفظ العملية" : "Save Transaction"}
          </Button>
        </div>
      }
    >
      <div className="circlemod-form">

        {/* Section 1: Donor & Center */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <User size={15} className="circlemod-section-icon" />
            <span>{ar ? "المتبرع والمركز" : "Donor & Center"}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-donor">{ar ? "المتبرع *" : "Donor *"}</label>
              <select
                id="dn-donor"
                className="circlemod-select"
                value={form.donorId}
                onChange={(e) => handleChange("donorId", e.target.value)}
                required
              >
                <option value="">{ar ? "اختر المتبرع..." : "Select Donor..."}</option>
                {donors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-center">
                <Building2 size={12} className="inline-block ml-1 opacity-60" />
                {ar ? "المركز" : "Center"}
              </label>
              <select
                id="dn-center"
                className="circlemod-select"
                value={form.centerId}
                onChange={(e) => handleChange("centerId", e.target.value)}
              >
                <option value="">{ar ? "عام / حسب المتبرع" : "General / Donor scope"}</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Amount & Currency */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <Coins size={15} className="circlemod-section-icon" />
            <span>{ar ? "المبلغ والعملة" : "Amount & Currency"}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="dn-amount">{ar ? "المبلغ *" : "Amount *"}</label>
              <input
                id="dn-amount"
                className="circlemod-input"
                type="number"
                min={1}
                step="any"
                value={form.originalAmount}
                onChange={(e) => handleChange("originalAmount", e.target.value)}
                placeholder={ar ? "المبلغ" : "Amount"}
                required
              />
            </div>
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="dn-currency">{ar ? "العملة" : "Currency"}</label>
              <select
                id="dn-currency"
                className="circlemod-select"
                value={form.originalCurrencyCode || "YER"}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setForm((prev) => ({
                    ...prev,
                    originalCurrencyCode: code,
                    exchangeRateToBase: code === "YER" ? "1" : ""
                  }));
                }}
                required
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {ar ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>
            {!isYer && (
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="dn-rate">
                  <ArrowLeftRight size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "سعر الصرف" : "Exchange Rate"}
                </label>
                <input
                  id="dn-rate"
                  className="circlemod-input"
                  type="number"
                  min={0}
                  step="any"
                  value={form.exchangeRateToBase}
                  onChange={(e) => handleChange("exchangeRateToBase", e.target.value)}
                  placeholder={isYer ? "1" : (ar ? "سعر الصرف" : "Rate")}
                  disabled={isYer}
                  required={!isYer}
                />
              </div>
            )}
          </div>
          {baseAmount !== null && (
            <div className="text-[11px] opacity-70 mt-1 px-1" role="note">
              {ar
                ? `المبلغ المعادل: ${baseAmount.toLocaleString("ar-YE-u-nu-latn")} ر.ي`
                : `Equivalent: ${baseAmount.toLocaleString("en-US")} YER`}
            </div>
          )}
        </div>

        {/* Section 3: Payment & Date */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <CreditCard size={15} className="circlemod-section-icon" />
            <span>{ar ? "طريقة الدفع والتاريخ" : "Payment & Date"}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-method">{ar ? "طريقة الدفع" : "Payment Method"}</label>
              <select
                id="dn-method"
                className="circlemod-select"
                value={form.paymentMethod}
                onChange={(e) => handleChange("paymentMethod", e.target.value as PaymentMethodV2)}
              >
                <option value="CASH">{ar ? "نقدي" : "Cash"}</option>
                <option value="TRANSFER">{ar ? "تحويل بنكي" : "Bank Transfer"}</option>
              </select>
            </div>
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="dn-mode">
                <Target size={12} className="inline-block ml-1 opacity-60" />
                {ar ? "نوع العملية" : "Transaction Type"}
              </label>
              <select
                id="dn-mode"
                className="circlemod-select"
                value={form.mode}
                onChange={(e) => handleChange("mode", e.target.value)}
              >
                <option value="RECEIVED">{ar ? "مستلم الآن" : "Received Now"}</option>
                <option value="PLEDGED">{ar ? "تعهد" : "Pledge"}</option>
              </select>
            </div>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="dn-date">
                <Calendar size={12} className="inline-block ml-1 opacity-60" />
                {ar ? "تاريخ التبرع *" : "Donation Date *"}
              </label>
              <input
                id="dn-date"
                className="circlemod-input"
                type="date"
                value={form.donationDate}
                onChange={(e) => handleChange("donationDate", e.target.value)}
                required
              />
            </div>
            {form.mode === "PLEDGED" && (
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="dn-pledge-date">
                  <Calendar size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "تاريخ استحقاق التعهد *" : "Pledge Due Date *"}
                </label>
                <input
                  id="dn-pledge-date"
                  className="circlemod-input"
                  type="date"
                  value={form.pledgeDueDate}
                  onChange={(e) => handleChange("pledgeDueDate", e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Purpose & Notes */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <StickyNote size={15} className="circlemod-section-icon" />
            <span>{ar ? "الغرض والملاحظات" : "Purpose & Notes"}</span>
            <span className="circlemod-section-hint">{ar ? "اختياري" : "Optional"}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-purpose">{ar ? "الغرض من التبرع" : "Donation Purpose"}</label>
              <input
                id="dn-purpose"
                className="circlemod-input"
                value={form.purpose}
                onChange={(e) => handleChange("purpose", e.target.value)}
                placeholder={ar ? "الغرض من التبرع" : "Donation Purpose"}
              />
            </div>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-notes">{ar ? "ملاحظات إضافية" : "Additional Notes"}</label>
              <input
                id="dn-notes"
                className="circlemod-input"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder={ar ? "ملاحظات" : "Notes"}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="circlemod-error" role="alert">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
