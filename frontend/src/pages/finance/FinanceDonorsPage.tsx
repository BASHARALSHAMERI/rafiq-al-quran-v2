import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Plus, RefreshCw, AlertTriangle, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifySuccess } from "../../shared/ui/feedback";
import { fadeUp, stagger } from "../../shared/pageAnimations";
import { useCentersQuery } from "../../features/org/org.hooks";
import {
  useCreateFinanceV2DonationMutation,
  useCreateFinanceV2DonorMutation,
  useCurrenciesQuery,
  useFinanceV2DonationsQuery,
  useFinanceV2DonorsQuery,
  useLatestExchangeRateQuery,
  useReceiveFinanceV2DonationMutation,
  useUpdateFinanceV2DonorMutation
} from "../../features/finance-v2/finance-v2.hooks";
import type {
  DonationStatusV2,
  DonorTypeV2,
  FinanceDonationV2,
  FinanceDonorV2,
  PaymentMethodV2
} from "../../features/finance-v2/types";
import { money } from "../../features/finance-v2/components/FinanceShared";
import FinanceDonorsKpis from "../../features/finance-v2/components/FinanceDonorsKpis";
import DonorsToolbar from "../../features/finance-v2/components/DonorsToolbar";
import DonorCard from "../../features/finance-v2/components/DonorCard";
import DonorFormModal from "../../features/finance-v2/components/DonorFormModal";
import DonationFormModal from "../../features/finance-v2/components/DonationFormModal";
import Modal from "../../components/ui/Modal"; // For simple Receive Pledge modal

type TabId = "donors" | "donations" | "pledges";

type DonorFormState = {
  id?: number;
  centerId: string;
  name: string;
  donorType: DonorTypeV2;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  notes: string;
  isActive: boolean;
};

type DonationFormState = {
  donorId: string;
  centerId: string;
  // FA-UX-4B: amount is captured via the (originalAmount, originalCurrencyCode,
  // exchangeRateToBase) triple. The YER base equivalent is computed on the fly.
  originalAmount: string;
  originalCurrencyCode: string;
  exchangeRateToBase: string;
  donationDate: string;
  paymentMethod: PaymentMethodV2;
  purpose: string;
  mode: "RECEIVED" | "PLEDGED";
  pledgeDueDate: string;
  notes: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDonorForm = (): DonorFormState => ({
  centerId: "",
  name: "",
  donorType: "INDIVIDUAL_DONOR",
  phone: "",
  email: "",
  address: "",
  contactPerson: "",
  notes: "",
  isActive: true
});

const emptyDonationForm = (): DonationFormState => ({
  donorId: "",
  centerId: "",
  originalAmount: "",
  originalCurrencyCode: "YER",
  exchangeRateToBase: "1",
  donationDate: todayIso(),
  paymentMethod: "CASH",
  purpose: "",
  mode: "RECEIVED",
  pledgeDueDate: "",
  notes: ""
});

const donorTypeLabels: Record<DonorTypeV2, { ar: string; en: string }> = {
  CHARITY_FOUNDATION: { ar: "مؤسسة خيرية", en: "Charity Foundation" },
  CHARITY_ASSOCIATION: { ar: "جمعية خيرية", en: "Charity Association" },
  INDIVIDUAL_DONOR: { ar: "متبرع فرد", en: "Individual Donor" },
  MERCHANT: { ar: "تاجر", en: "Merchant" },
  PARENT_DONOR: { ar: "ولي أمر داعم", en: "Parent Donor" },
  GOVERNMENT_ENTITY: { ar: "جهة حكومية", en: "Government Entity" },
  CORPORATE_SPONSOR: { ar: "راعي مؤسسي", en: "Corporate Sponsor" }
};

const statusLabels: Record<DonationStatusV2, { ar: string; en: string }> = {
  PLEDGED: { ar: "تعهد", en: "Pledged" },
  RECEIVED: { ar: "مستلم", en: "Received" },
  CANCELLED: { ar: "ملغي", en: "Cancelled" }
};

const tabs: Array<{ id: TabId; ar: string; en: string }> = [
  { id: "donors", ar: "المتبرعون", en: "Donors" },
  { id: "donations", ar: "التبرعات", en: "Donations" },
  { id: "pledges", ar: "التعهدات", en: "Pledges" }
];

const toId = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const statusClass = (status: DonationStatusV2) => {
  if (status === "RECEIVED") return "fin-status-pill fin-status--success";
  if (status === "PLEDGED") return "fin-status-pill fin-status--warning";
  return "fin-status-pill fin-status--muted";
};

export default function FinanceDonorsPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canManageDonors = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN";

  const [centerId, setCenterId] = useState<number | undefined>();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<TabId>("donors");
  const [donorModalOpen, setDonorModalOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState<FinanceDonationV2 | null>(null);
  const [donorForm, setDonorForm] = useState<DonorFormState>(emptyDonorForm());
  const [donationForm, setDonationForm] = useState<DonationFormState>(emptyDonationForm());
  // FA-UX-4B: receive pledge form also tracks the (possibly updated) exchange rate
  // for foreign-currency pledges. The base amount is recomputed on the server.
  const [receiveForm, setReceiveForm] = useState({
    receivedDate: todayIso(),
    paymentMethod: "CASH" as PaymentMethodV2,
    exchangeRateToBase: "",
    notes: ""
  });
  const [formError, setFormError] = useState("");

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);

  // FA-UX-4B: list of organization currencies for the donation form's currency picker.
  const currenciesQ = useCurrenciesQuery();
  const currencies = useMemo(() => currenciesQ.data ?? [], [currenciesQ.data]);

  const donorsQ = useFinanceV2DonorsQuery({ centerId });
  const donationsQ = useFinanceV2DonationsQuery({ centerId });
  const donors = useMemo(() => donorsQ.data?.rows ?? [], [donorsQ.data?.rows]);
  const donations = useMemo(() => donationsQ.data?.rows ?? [], [donationsQ.data?.rows]);
  const pledges = useMemo(() => donations.filter((donation) => donation.status === "PLEDGED"), [donations]);

  const createDonorM = useCreateFinanceV2DonorMutation();
  const updateDonorM = useUpdateFinanceV2DonorMutation();
  const createDonationM = useCreateFinanceV2DonationMutation();
  const receiveDonationM = useReceiveFinanceV2DonationMutation();

  const isSavingDonor = createDonorM.isPending || updateDonorM.isPending;
  const isSavingDonation = createDonationM.isPending;
  const isReceiving = receiveDonationM.isPending;

  const filteredDonors = useMemo(() => {
    if (!q.trim()) return donors;
    const low = q.toLowerCase();
    return donors.filter((d) => 
      d.name.toLowerCase().includes(low) || 
      (d.phone || "").includes(low) ||
      (d.email || "").toLowerCase().includes(low)
    );
  }, [donors, q]);

  const kpis = useMemo(() => {
    const received = donations.filter((donation) => donation.status === "RECEIVED");
    const duePledges = pledges.filter((donation) => {
      if (!donation.pledgeDueDate) return false;
      return new Date(donation.pledgeDueDate) <= new Date();
    });
    return {
      donors: donors.length,
      receivedAmount: received.reduce((sum, donation) => sum + donation.amount, 0),
      pledgedAmount: pledges.reduce((sum, donation) => sum + donation.amount, 0),
      duePledges: duePledges.length
    };
  }, [donations, donors.length, pledges]);

  // FA-UX-2: count donations whose receipt voucher is still DRAFT (created but not yet posted).
  // Backend's donationSelect already returns voucher.status, so we can compute this client-side.
  const draftVoucherCount = useMemo(
    () => donations.filter((donation) => donation.voucher?.status === "DRAFT").length,
    [donations]
  );

  // FA-UX-2: classify a pledge by its due date for overdue / soon-due badges.
  const pledgeDueClass = (pledgeDueDate?: string | null): "overdue" | "soon" | null => {
    if (!pledgeDueDate) return null;
    const due = new Date(pledgeDueDate);
    if (Number.isNaN(due.getTime())) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);
    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "soon";
    return null;
  };

  const openCreateDonor = () => {
    setFormError("");
    setDonorForm({ ...emptyDonorForm(), centerId: centerId ? String(centerId) : "" });
    setDonorModalOpen(true);
  };

  const openEditDonor = (donor: FinanceDonorV2) => {
    setFormError("");
    setDonorForm({
      id: donor.id,
      centerId: donor.centerId ? String(donor.centerId) : "",
      name: donor.name,
      donorType: donor.donorType,
      phone: donor.phone ?? "",
      email: donor.email ?? "",
      address: donor.address ?? "",
      contactPerson: donor.contactPerson ?? "",
      notes: donor.notes ?? "",
      isActive: donor.isActive
    });
    setDonorModalOpen(true);
  };

  const openCreateDonation = () => {
    setFormError("");
    setDonationForm({ ...emptyDonationForm(), centerId: centerId ? String(centerId) : "" });
    setDonationModalOpen(true);
  };

  const handleSaveDonor = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    try {
      if (!donorForm.name.trim()) throw new Error(ar ? "اسم المتبرع مطلوب" : "Donor name is required");
      const payload = {
        centerId: toId(donorForm.centerId) ?? null,
        name: donorForm.name.trim(),
        donorType: donorForm.donorType,
        phone: donorForm.phone.trim() || undefined,
        email: donorForm.email.trim() || undefined,
        address: donorForm.address.trim() || undefined,
        contactPerson: donorForm.contactPerson.trim() || undefined,
        notes: donorForm.notes.trim() || undefined,
        isActive: donorForm.isActive
      };
      if (donorForm.id) {
        await updateDonorM.mutateAsync({ donorId: donorForm.id, payload });
        notifySuccess(ar ? "تم تعديل المتبرع" : "Donor updated");
      } else {
        await createDonorM.mutateAsync(payload);
        notifySuccess(ar ? "تم إضافة المتبرع" : "Donor created");
      }
      setDonorModalOpen(false);
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: error instanceof Error ? error.message : ar ? "تعذر حفظ المتبرع" : "Unable to save donor"
      });
      setFormError(message);
      notifyError(message);
    }
  };

  const handleCreateDonation = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    try {
      const donorId = toId(donationForm.donorId);
      // FA-UX-4B: validate the currency triple. The backend recomputes the YER
      // base amount, so we only send originalAmount + currency + rate.
      const originalAmount = Number(donationForm.originalAmount);
      const currencyCode = (donationForm.originalCurrencyCode || "YER").toUpperCase();
      const isYer = currencyCode === "YER";
      const exchangeRateToBase = isYer ? 1 : Number(donationForm.exchangeRateToBase);
      if (!donorId) throw new Error(ar ? "اختر المتبرع" : "Select donor");
      if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
        throw new Error(ar ? "المبلغ الأصلي غير صحيح" : "Invalid original amount");
      }
      if (!isYer && (!Number.isFinite(exchangeRateToBase) || exchangeRateToBase <= 0)) {
        throw new Error(ar ? "سعر الصرف غير صحيح" : "Invalid exchange rate");
      }
      if (!donationForm.donationDate) throw new Error(ar ? "تاريخ التبرع مطلوب" : "Donation date is required");
      if (donationForm.mode === "PLEDGED" && !donationForm.pledgeDueDate) {
        throw new Error(ar ? "تاريخ استحقاق التعهد مطلوب" : "Pledge due date is required");
      }

      const created = await createDonationM.mutateAsync({
        centerId: toId(donationForm.centerId) ?? null,
        donorId,
        originalAmount,
        originalCurrencyCode: currencyCode,
        exchangeRateToBase,
        donationDate: donationForm.donationDate,
        paymentMethod: donationForm.paymentMethod,
        purpose: donationForm.purpose.trim() || undefined,
        status: donationForm.mode === "RECEIVED" ? "RECEIVED" : "PLEDGED",
        isPledge: donationForm.mode === "PLEDGED",
        pledgeDueDate: donationForm.mode === "PLEDGED" ? donationForm.pledgeDueDate : undefined,
        receivedDate: donationForm.mode === "RECEIVED" ? donationForm.donationDate : undefined,
        notes: donationForm.notes.trim() || undefined
      });
      if (donationForm.mode === "RECEIVED") {
        const voucherNo = created?.voucher?.voucherNo;
        notifySuccess(
          ar
            ? `تم تسجيل التبرع وإنشاء سند قبض كمسودة${voucherNo ? ` (${voucherNo})` : ""}. يرجى مراجعة السند وترحيله حتى يظهر أثره في القيود والتقارير.`
            : `Donation recorded and a receipt voucher was created as draft${voucherNo ? ` (${voucherNo})` : ""}. Please review and post the voucher to reflect it in accounting reports.`
        );
      } else {
        notifySuccess(
          ar
            ? "تم حفظ التعهد. لن يُنشأ سند قبض أو قيد محاسبي حتى يتم استلام التعهد."
            : "Pledge saved. No receipt voucher or journal entry will be created until the pledge is received."
        );
      }
      setDonationModalOpen(false);
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: error instanceof Error ? error.message : ar ? "تعذر حفظ التبرع" : "Unable to save donation"
      });
      setFormError(message);
      notifyError(message);
    }
  };

  // FA-UX-4B: when a pledge in a foreign currency is being received, prefer the
  // most recent stored exchange rate (so cashier confirms today's rate, not the
  // pledge-time rate). The query is enabled only for non-YER selected pledges.
  const selectedPledgeCurrency =
    selectedPledge && (selectedPledge.originalCurrencyCode ?? "YER").toUpperCase() !== "YER"
      ? (selectedPledge.originalCurrencyCode ?? "").toUpperCase()
      : undefined;
  const latestPledgeRateQ = useLatestExchangeRateQuery(selectedPledgeCurrency);

  const openReceivePledge = (donation: FinanceDonationV2) => {
    setSelectedPledge(donation);
    // Pre-fill with the rate that was stored on the pledge; the latest-rate
    // effect below will override with a fresher rate when one is available.
    const pledgedCode = (donation.originalCurrencyCode ?? "YER").toUpperCase();
    const initialRate =
      pledgedCode !== "YER" && donation.exchangeRateToBase
        ? String(donation.exchangeRateToBase)
        : "";
    setReceiveForm({
      receivedDate: todayIso(),
      paymentMethod: donation.paymentMethod,
      exchangeRateToBase: initialRate,
      notes: ""
    });
    setFormError("");
    setReceiveModalOpen(true);
  };

  // Override with the latest stored rate once the API responds, but only if the
  // user has not yet entered/edited a rate for this open pledge.
  useEffect(() => {
    if (!receiveModalOpen || !selectedPledgeCurrency) return;
    const latest = latestPledgeRateQ.data?.rateToBase;
    if (!latest || Number(latest) <= 0) return;
    setReceiveForm((previous) =>
      previous.exchangeRateToBase
        ? previous
        : { ...previous, exchangeRateToBase: String(latest) }
    );
  }, [receiveModalOpen, selectedPledgeCurrency, latestPledgeRateQ.data]);

  const handleReceivePledge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPledge) return;
    setFormError("");
    try {
      // FA-UX-4B: only forward the rate when the pledge is in a foreign currency.
      const pledgedCode = (selectedPledge.originalCurrencyCode ?? "YER").toUpperCase();
      let exchangeRateToBase: number | undefined;
      if (pledgedCode !== "YER") {
        const parsed = Number(receiveForm.exchangeRateToBase);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(ar ? "سعر الصرف غير صحيح" : "Invalid exchange rate");
        }
        exchangeRateToBase = parsed;
      }
      const received = await receiveDonationM.mutateAsync({
        donationId: selectedPledge.id,
        receivedDate: receiveForm.receivedDate,
        paymentMethod: receiveForm.paymentMethod,
        exchangeRateToBase,
        notes: receiveForm.notes.trim() || undefined
      });
      const voucherNo = received?.voucher?.voucherNo;
      notifySuccess(
        ar
          ? `تم استلام التعهد وإنشاء سند قبض كمسودة${voucherNo ? ` (${voucherNo})` : ""}. يرجى مراجعة السند وترحيله حتى يظهر أثره في القيود والتقارير.`
          : `Pledge received and a receipt voucher was created as draft${voucherNo ? ` (${voucherNo})` : ""}. Please review and post the voucher to reflect it in accounting reports.`
      );
      setReceiveModalOpen(false);
      setSelectedPledge(null);
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر استلام التعهد" : "Unable to receive pledge"
      });
      setFormError(message);
      notifyError(message);
    }
  };

  const isLoading = donorsQ.isLoading || donationsQ.isLoading;

  return (
    <div className="page ctr-page-modern ctr-page-finance-donors relative z-10" dir={ar ? "rtl" : "ltr"}>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
        <motion.div variants={fadeUp}>
          <PageHeader
            title={ar ? "إدارة المتبرعين" : "Donors Management"}
            description={ar ? "إدارة بيانات الداعمين، التبرعات، والتعهدات المالية" : "Manage donors, donations, and financial pledges"}
            icon={<Gift className="w-6 h-6" />}
            actions={
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  variant="secondary"
                  className="glass-btn"
                  size="sm"
                  leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
                  onClick={() => {
                    void donorsQ.refetch();
                    void donationsQ.refetch();
                  }}
                  disabled={isLoading}
                >
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                {canManageDonors ? (
                  <>
                    <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateDonor}>
                      {ar ? "إضافة متبرع" : "Add Donor"}
                    </Button>
                    <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateDonation}>
                      {ar ? "إضافة تبرع" : "Add Donation"}
                    </Button>
                  </>
                ) : null}
              </div>
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <FinanceDonorsKpis
            isLoading={isLoading}
            donorsCount={kpis.donors}
            receivedAmount={kpis.receivedAmount}
            pledgedAmount={kpis.pledgedAmount}
            duePledges={kpis.duePledges}
            ar={ar}
          />
        </motion.div>

        {/* Real-state alert: only show when there are draft vouchers awaiting posting. */}
        {draftVoucherCount > 0 ? (
          <motion.div variants={fadeUp}>
            <div
              className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100"
              role="status"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
              <div className="flex-1 leading-relaxed">
                <div className="font-semibold mb-1">
                  {ar
                    ? `تبرعات بانتظار ترحيل السند: ${draftVoucherCount}`
                    : `Donations awaiting voucher posting: ${draftVoucherCount}`}
                </div>
              </div>
              <Link
                to="/finance/vouchers"
                className="hidden md:inline-flex shrink-0 items-center gap-1 rounded-lg border border-current/30 bg-white/70 px-3 py-1.5 text-xs font-semibold transition hover:bg-white dark:bg-white/10 dark:hover:bg-white/20"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden />
                {ar ? "صفحة السندات" : "Vouchers page"}
              </Link>
            </div>
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp} className="ctr-centers-shell">
          <DonorsToolbar
            ar={ar}
            q={q}
            setQ={setQ}
            view={view}
            setView={setView}
            selectedCenterId={centerId}
            centerOpts={centers.map(c => ({ id: c.id, label: c.name }))}
            setCenterId={(v) => setCenterId(v ? Number(v) : undefined)}
          />

          <div className="fin-tabs mt-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`fin-tab ${activeTab === tab.id ? "fin-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {ar ? tab.ar : tab.en}
              </button>
            ))}
          </div>

          <div className="ctr-centers-results">
            <AnimatePresence mode="wait">
              {activeTab === "donors" && (
                <motion.div
                  key="donors-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={view === "grid" ? "ctr-grid-modern" : "ctr-list-modern"}
                >
                  {filteredDonors.map((donor) => (
                    <DonorCard
                      key={donor.id}
                      donor={donor}
                      ar={ar}
                      view={view}
                      openEdit={openEditDonor}
                      canEdit={canManageDonors}
                    />
                  ))}
                </motion.div>
              )}

              {activeTab === "donations" && (
                <motion.div
                  key="donations-table"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden border border-border-subtle rounded-2xl bg-bg-surface"
                >
                  <table className="fin-premium-table">
                    <thead>
                      <tr>
                        <th>{ar ? "المتبرع" : "Donor"}</th>
                        <th>{ar ? "المبلغ" : "Amount"}</th>
                        <th>{ar ? "طريقة الدفع" : "Method"}</th>
                        <th>{ar ? "الغرض" : "Purpose"}</th>
                        <th>{ar ? "التاريخ" : "Date"}</th>
                        <th>{ar ? "الحالة" : "Status"}</th>
                        <th>{ar ? "حالة السند" : "Voucher"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map((donation) => {
                        // FA-UX-2: voucher-state cell — never claim "posted" if status unknown.
                        let voucherCell: React.ReactNode;
                        const voucher = donation.voucher;
                        if (voucher) {
                          const no = voucher.voucherNo;
                          if (voucher.status === "DRAFT") {
                            voucherCell = (
                              <span
                                className="fin-status-pill fin-status--warning"
                                title={ar ? "السند لم يُرحّل بعد" : "Voucher not yet posted"}
                              >
                                {ar ? `${no} — مسودة` : `${no} — Draft`}
                              </span>
                            );
                          } else if (voucher.status === "POSTED") {
                            voucherCell = (
                              <span className="fin-status-pill fin-status--success">
                                {ar ? `${no} — مرحّل` : `${no} — Posted`}
                              </span>
                            );
                          } else {
                            // APPROVED / VOIDED / VOID_REQUESTED / REJECTED — show neutral with voucherNo
                            voucherCell = (
                              <span className="fin-status-pill fin-status--muted">
                                {ar ? `${no} — راجع صفحة السندات` : `${no} — See Vouchers page`}
                              </span>
                            );
                          }
                        } else if (donation.status === "PLEDGED") {
                          voucherCell = (
                            <span className="fin-status-pill fin-status--muted">
                              {ar ? "لم يتم الاستلام بعد" : "Not yet received"}
                            </span>
                          );
                        } else if (donation.status === "CANCELLED") {
                          voucherCell = (
                            <span className="fin-status-pill fin-status--muted">
                              {ar ? "ملغي" : "Cancelled"}
                            </span>
                          );
                        } else {
                          voucherCell = "-";
                        }
                        return (
                          <tr key={donation.id}>
                            <td className="font-bold">{donation.donor?.name ?? donation.donorId}</td>
                            <td className="text-emerald-600 font-bold">
                              {money(donation.amount, ar)}
                              {/* FA-UX-4B: foreign-currency origination summary line */}
                              {donation.originalCurrencyCode &&
                              donation.originalCurrencyCode.toUpperCase() !== "YER" &&
                              donation.originalAmount &&
                              donation.exchangeRateToBase ? (
                                <div className="text-[10px] font-normal opacity-70">
                                  {Number(donation.originalAmount).toLocaleString(ar ? "ar-YE-u-nu-latn" : "en-US")}{" "}
                                  {donation.originalCurrencyCode} ×{" "}
                                  {Number(donation.exchangeRateToBase).toLocaleString(ar ? "ar-YE-u-nu-latn" : "en-US")}
                                </div>
                              ) : null}
                            </td>
                            <td>{donation.paymentMethod === "CASH" ? (ar ? "نقدي" : "Cash") : (ar ? "تحويل" : "Transfer")}</td>
                            <td>{donation.purpose || "-"}</td>
                            <td>{new Date(donation.donationDate).toLocaleDateString(ar ? "ar-YE-u-nu-latn" : "en-US")}</td>
                            <td>
                              <span className={statusClass(donation.status)}>
                                {statusLabels[donation.status][ar ? "ar" : "en"]}
                              </span>
                            </td>
                            <td>{voucherCell}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeTab === "pledges" && (
                <motion.div
                  key="pledges-table"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden border border-border-subtle rounded-2xl bg-bg-surface"
                >
                   <table className="fin-premium-table">
                    <thead>
                      <tr>
                        <th>{ar ? "المتبرع" : "Donor"}</th>
                        <th>{ar ? "المبلغ" : "Amount"}</th>
                        <th>{ar ? "تاريخ التعهد" : "Pledge Date"}</th>
                        <th>{ar ? "تاريخ الاستحقاق" : "Due Date"}</th>
                        <th>{ar ? "الحالة" : "Status"}</th>
                        <th>{ar ? "إجراءات" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pledges.map((donation) => {
                        const dueClass = pledgeDueClass(donation.pledgeDueDate);
                        return (
                          <tr key={donation.id}>
                            <td className="font-bold">{donation.donor?.name ?? donation.donorId}</td>
                            <td className="text-amber-600 font-bold">{money(donation.amount, ar)}</td>
                            <td>{new Date(donation.donationDate).toLocaleDateString(ar ? "ar-YE-u-nu-latn" : "en-US")}</td>
                            <td>
                              {donation.pledgeDueDate ? (
                                <div className="flex items-center gap-2">
                                  <span>{new Date(donation.pledgeDueDate).toLocaleDateString(ar ? "ar-YE-u-nu-latn" : "en-US")}</span>
                                  {dueClass === "overdue" && (
                                    <span className="fin-status-pill fin-status--danger">
                                      {ar ? "متأخر" : "Overdue"}
                                    </span>
                                  )}
                                  {dueClass === "soon" && (
                                    <span className="fin-status-pill fin-status--warning">
                                      {ar ? "قريب" : "Due soon"}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>
                              <span className={statusClass(donation.status)}>
                                {statusLabels[donation.status][ar ? "ar" : "en"]}
                              </span>
                            </td>
                            <td>
                              {canManageDonors && donation.status === "PLEDGED" && (
                                <Button size="sm" variant="primary" onClick={() => openReceivePledge(donation)}>
                                  {ar ? "استلام" : "Receive"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      <DonorFormModal
        ar={ar}
        isOpen={donorModalOpen}
        onClose={() => setDonorModalOpen(false)}
        form={donorForm}
        setForm={setDonorForm}
        pending={isSavingDonor}
        error={formError}
        centers={centers}
        donorTypeLabels={donorTypeLabels}
        onSave={handleSaveDonor}
      />

      <DonationFormModal
        ar={ar}
        isOpen={donationModalOpen}
        onClose={() => setDonationModalOpen(false)}
        form={donationForm}
        setForm={setDonationForm}
        pending={isSavingDonation}
        error={formError}
        donors={donors.map(d => ({ id: d.id, name: d.name }))}
        centers={centers}
        currencies={currencies}
        onSave={handleCreateDonation}
      />

      <Modal
        isOpen={receiveModalOpen}
        onClose={() => !isReceiving && setReceiveModalOpen(false)}
        title={ar ? "استلام التعهد" : "Receive Pledge"}
        description={ar
          ? "سيتم تحويل التعهد إلى تبرع مستلم وإنشاء سند قبض كمسودة. لن يظهر الأثر المحاسبي حتى يتم ترحيل السند من صفحة السندات."
          : "The pledge will be converted to a received donation and a draft receipt voucher will be created. The accounting impact will not appear until the voucher is posted from the Vouchers page."
        }
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setReceiveModalOpen(false)} disabled={isReceiving}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" form="finance-receive-pledge-form" isLoading={isReceiving}>{ar ? "استلام التعهد وإنشاء السند" : "Receive pledge & create voucher"}</Button>
          </div>
        }
      >
        <form id="finance-receive-pledge-form" className="fin-form fin-form--modal" onSubmit={handleReceivePledge}>
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1 opacity-60">{ar ? "تاريخ الاستلام" : "Received Date"}</label>
            <input className="fin-input" type="date" value={receiveForm.receivedDate} onChange={(event) => setReceiveForm((previous) => ({ ...previous, receivedDate: event.target.value }))} required />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1 opacity-60">{ar ? "طريقة الدفع" : "Payment Method"}</label>
            <select className="fin-input" value={receiveForm.paymentMethod} onChange={(event) => setReceiveForm((previous) => ({ ...previous, paymentMethod: event.target.value as PaymentMethodV2 }))}>
              <option value="CASH">{ar ? "نقدي" : "Cash"}</option>
              <option value="TRANSFER">{ar ? "تحويل" : "Transfer"}</option>
            </select>
          </div>

          {/* FA-UX-4B: when the pledge was made in a foreign currency, the user
              confirms (or updates) the exchange rate at receipt time. Equivalent
              YER amount is shown for transparency; the backend recomputes it. */}
          {selectedPledge && (selectedPledge.originalCurrencyCode ?? "YER").toUpperCase() !== "YER" ? (
            <div className="mb-4 rounded-xl border border-amber-200/60 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              <div className="mb-2 font-semibold">
                {ar ? "تعهد بعملة أجنبية" : "Foreign-currency pledge"}
              </div>
              <div className="mb-2">
                {ar ? "المبلغ الأصلي:" : "Original amount:"}{" "}
                <strong>
                  {new Intl.NumberFormat(ar ? "ar-YE-u-nu-latn" : "en-US", { maximumFractionDigits: 2 }).format(
                    Number(selectedPledge.originalAmount ?? selectedPledge.amount)
                  )}{" "}
                  {selectedPledge.originalCurrencyCode}
                </strong>
              </div>
              <label className="block text-[11px] font-bold mb-1 opacity-70">
                {ar ? "سعر الصرف عند الاستلام *" : "Exchange rate at receipt *"}
              </label>
              <input
                className="fin-input"
                type="number"
                min={0}
                step="any"
                value={receiveForm.exchangeRateToBase}
                onChange={(event) =>
                  setReceiveForm((previous) => ({ ...previous, exchangeRateToBase: event.target.value }))
                }
                placeholder="0.00"
                required
              />
              <div className="mt-2 text-[11px] opacity-80">
                {(() => {
                  const orig = Number(selectedPledge.originalAmount ?? selectedPledge.amount);
                  const rate = Number(receiveForm.exchangeRateToBase);
                  if (!Number.isFinite(orig) || !Number.isFinite(rate) || orig <= 0 || rate <= 0) return null;
                  const base = Math.round(orig * rate * 100) / 100;
                  return ar
                    ? `سيتم إنشاء سند القبض بالمبلغ المعادل: ${base.toLocaleString("ar-YE-u-nu-latn")} ر.ي`
                    : `Receipt voucher will be created with the YER equivalent: ${base.toLocaleString("en-US")} YER`;
                })()}
              </div>
            </div>
          ) : null}

          <div className="mb-4">
             <label className="block text-xs font-bold mb-1 opacity-60">{ar ? "ملاحظات" : "Notes"}</label>
            <textarea className="fin-input" value={receiveForm.notes} onChange={(event) => setReceiveForm((previous) => ({ ...previous, notes: event.target.value }))} placeholder={ar ? "ملاحظات..." : "Notes..."} />
          </div>
          {formError ? <p className="fin-error fin-error--modal">{formError}</p> : null}
        </form>
      </Modal>
    </div>
  );
}
