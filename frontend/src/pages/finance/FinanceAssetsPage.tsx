import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Archive, ClipboardList, PackageCheck, Plus, Tags } from "lucide-react";
import { useI18n } from "../../app/i18n";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { 
  FinancePageShell, 
  FinancePageHeader,
  FinanceDataTable,
  FinanceMoney
} from "../../features/finance-v2/design";
import { Badge } from "../../components/ui/Badge";
import {
  useAssetCategoriesQuery,
  useAssetCustodyLogsQuery,
  useCreateAssetCategoryMutation,
  useCreateFixedAssetMutation,
  useAssignAssetCustodyMutation,
  useExpenseInvoicesQuery,
  useFixedAssetsQuery,
  useSuppliersQuery,
  usePostAssetAcquisitionMutation,
  usePostAssetDepreciationMutation,
  useFinanceV2AccountsQuery
} from "../../features/finance-v2/finance-v2.hooks";
import type { FixedAssetStatusV2, FixedAssetV2 } from "../../features/finance-v2/types";
import { useCentersQuery } from "../../features/org/org.hooks";
import { useUsersQuery } from "../../features/users/users.hooks";
import { useAccountingAccountsQuery } from "../accounting/accounting.hooks";
import { AnimatePresence, motion } from "framer-motion";

type TabId = "categories" | "assets" | "custody";

const statusOptions: Array<{ value: FixedAssetStatusV2; ar: string; en: string }> = [
  { value: "ACTIVE", ar: "نشط", en: "Active" },
  { value: "UNDER_MAINTENANCE", ar: "تحت الصيانة", en: "Under maintenance" },
  { value: "DISPOSED", ar: "مستبعد", en: "Disposed" },
  { value: "LOST", ar: "مفقود", en: "Lost" },
  { value: "INACTIVE", ar: "غير نشط", en: "Inactive" }
];

const today = () => new Date().toISOString().slice(0, 10);

const formatMoney = (value?: number | null) =>
  Number(value ?? 0).toLocaleString("ar-u-nu-latn", { maximumFractionDigits: 2 });

const displayDate = (value?: string | null) => (value ? value.slice(0, 10) : "-");

export default function FinanceAssetsPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const [activeTab, setActiveTab] = useState<TabId>("assets");

  // Lifted Modal States
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [custodyModalOpen, setCustodyModalOpen] = useState(false);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "categories", label: ar ? "تصنيفات الأصول" : "Categories",    icon: <Tags        size={16} /> },
    { id: "assets",     label: ar ? "سجل الأصول"    : "Asset register", icon: <Archive      size={16} /> },
    { id: "custody",    label: ar ? "العهد والتسليم" : "Custody",         icon: <ClipboardList size={16} /> },
  ];

  // Header Actions based on active tab
  const headerActions = (
    <div className="flex items-center gap-3">
      {activeTab === "categories" && (
        <Button onClick={() => setCatModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          {ar ? "إضافة تصنيف" : "Add category"}
        </Button>
      )}
      {activeTab === "assets" && (
        <Button onClick={() => setAssetModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          {ar ? "تسجيل أصل" : "Register asset"}
        </Button>
      )}
      {activeTab === "custody" && (
        <Button onClick={() => setCustodyModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          {ar ? "تسجيل تسليم عهدة" : "Assign Custody"}
        </Button>
      )}
    </div>
  );

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "الأصول والعهد" : "Assets & Custody"}
            subtitle={ar ? "تصنيفات الأصول، سجل الأصول، وسجل التسليم" : "Asset categories, register, and custody handovers"}
            icon={<PackageCheck className="w-6 h-6 text-brand-600" />}
            actions={headerActions}
          />
          <nav className="exams-tabs-bar mt-6" aria-label={ar ? "تبويبات الأصول" : "Assets tabs"}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`exams-tab-btn ${activeTab === tab.id ? "exams-tab-btn--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      }
    >
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: ar ? 15 : -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: ar ? -15 : 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {activeTab === "categories" ? (
              <AssetCategoriesTab 
                ar={ar} 
                modalOpen={catModalOpen} 
                setModalOpen={setCatModalOpen} 
              />
            ) : null}
            {activeTab === "assets" ? (
              <AssetRegisterTab 
                ar={ar} 
                modalOpen={assetModalOpen} 
                setModalOpen={setAssetModalOpen} 
              />
            ) : null}
            {activeTab === "custody" ? (
              <AssetCustodyTab 
                ar={ar} 
                modalOpen={custodyModalOpen} 
                setModalOpen={setCustodyModalOpen} 
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </FinancePageShell>
  );
}

function AssetCategoriesTab({ 
  ar, 
  modalOpen, 
  setModalOpen 
}: { 
  ar: boolean; 
  modalOpen: boolean; 
  setModalOpen: (open: boolean) => void; 
}) {
  const categoriesQ = useAssetCategoriesQuery();
  const accountsQ = useAccountingAccountsQuery();
  const createM = useCreateAssetCategoryMutation();
  const [form, setForm] = useState({
    name: "",
    assetAccountId: "",
    depreciationExpenseAccountId: "",
    accumulatedDepreciationAccountId: "",
    usefulLifeMonths: ""
  });

  const accounts = accountsQ.data ?? [];
  const parentAccountIds = new Set(accounts.map((account) => account.parentId).filter((id): id is number => Boolean(id)));
  const assetAccounts = accounts.filter((account) => account.type === "ASSET" && account.isActive && !parentAccountIds.has(account.id));
  const expenseAccounts = accounts.filter((account) => account.type === "EXPENSE" && account.isActive && !parentAccountIds.has(account.id));

  const [searchTerm, setSearchTerm] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await createM.mutateAsync({
      name: form.name,
      assetAccountId: form.assetAccountId ? Number(form.assetAccountId) : undefined,
      depreciationExpenseAccountId: form.depreciationExpenseAccountId
        ? Number(form.depreciationExpenseAccountId)
        : undefined,
      accumulatedDepreciationAccountId: form.accumulatedDepreciationAccountId
        ? Number(form.accumulatedDepreciationAccountId)
        : undefined,
      usefulLifeMonths: form.usefulLifeMonths ? Number(form.usefulLifeMonths) : undefined
    });
    setForm({
      name: "",
      assetAccountId: "",
      depreciationExpenseAccountId: "",
      accumulatedDepreciationAccountId: "",
      usefulLifeMonths: ""
    });
    setModalOpen(false);
  };

  const filtered = useMemo(() => {
    const list = categoriesQ.data ?? [];
    if (!searchTerm) return list;
    return list.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [categoriesQ.data, searchTerm]);

  return (
    <div className="fin-premium-panel animate-premium">
      <div className="fin-premium-panel__content p-0">
        <div className="ctr-controls p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="ctr-search-wrap">
            <Tags className="ctr-search-icon" size={18} />
            <input
              className="ctr-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={ar ? "بحث في التصنيفات..." : "Search categories..."}
            />
          </div>
        </div>

        <FinanceDataTable
          columns={[
            { id: "name", header: ar ? "التصنيف" : "Category", cell: (row: any) => <strong className="text-slate-800 dark:text-slate-200">{row.name}</strong> },
            {
              id: "assetAccount",
              header: ar ? "حساب الأصل" : "Asset account",
              cell: (row: any) => row.assetAccount ? (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{row.assetAccount.code}</span>
                  <span className="text-xs text-slate-400">{row.assetAccount.name}</span>
                </div>
              ) : "-"
            },
            {
              id: "life",
              header: ar ? "العمر (أشهر)" : "Life (m)",
              align: "center",
              cell: (row: any) => row.usefulLifeMonths ? (
                <Badge variant="secondary" size="sm" dot>
                  {row.usefulLifeMonths} {ar ? "شهر" : "m"}
                </Badge>
              ) : "-"
            },
            {
              id: "active",
              header: ar ? "الحالة" : "Status",
              align: "center",
              cell: (row: any) => (
                <span className={`fin-status-pill ${row.isActive ? "fin-status--success" : "fin-status--warning"}`}>
                  {row.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}
                </span>
              )
            }
          ]}
          rows={filtered}
          rowKey="id"
          density="dense"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={ar ? "إضافة تصنيف أصل" : "Add Asset Category"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Tags className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="asset-cat-form" isLoading={createM.isPending}>
              {ar ? "حفظ" : "Save"}
            </Button>
          </div>
        }
      >
        <form id="asset-cat-form" className="circlemod-form" onSubmit={submit}>
          <div className="circlemod-section">
            <div className="circlemod-form-grid">
              <Field label={ar ? "اسم التصنيف" : "Category name"} required>
                <input
                  className="circlemod-input"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </Field>
              <Field label={ar ? "العمر بالأشهر" : "Useful life months"}>
                <input
                  type="number"
                  min="1"
                  className="circlemod-input"
                  value={form.usefulLifeMonths}
                  onChange={(event) => setForm((current) => ({ ...current, usefulLifeMonths: event.target.value }))}
                />
              </Field>
              <Field label={ar ? "حساب الأصل" : "Asset account"}>
                <select
                  className="circlemod-input"
                  value={form.assetAccountId}
                  onChange={(event) => setForm((current) => ({ ...current, assetAccountId: event.target.value }))}
                >
                  <option value="">{ar ? "بدون ربط" : "Not linked"}</option>
                  {assetAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={ar ? "حساب مصروف الاستهلاك" : "Depreciation expense"}>
                <select
                  className="circlemod-input"
                  value={form.depreciationExpenseAccountId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, depreciationExpenseAccountId: event.target.value }))
                  }
                >
                  <option value="">{ar ? "بدون ربط" : "Not linked"}</option>
                  {expenseAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={ar ? "مجمع الاستهلاك" : "Accumulated depreciation"}>
                <select
                  className="circlemod-input"
                  value={form.accumulatedDepreciationAccountId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, accumulatedDepreciationAccountId: event.target.value }))
                  }
                >
                  <option value="">{ar ? "بدون ربط" : "Not linked"}</option>
                  {assetAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AssetRegisterTab({ 
  ar, 
  modalOpen, 
  setModalOpen 
}: { 
  ar: boolean; 
  modalOpen: boolean; 
  setModalOpen: (open: boolean) => void; 
}) {
  const categoriesQ = useAssetCategoriesQuery();
  const assetsQ = useFixedAssetsQuery();
  const centersQ = useCentersQuery();
  const suppliersQ = useSuppliersQuery();
  const expensesQ = useExpenseInvoicesQuery({});
  const usersQ = useUsersQuery({ page: 1, pageSize: 200 }, true);
  const createM = useCreateFixedAssetMutation();
  const [userSearch, setUserSearch] = useState("");
  const centers = centersQ.data?.items ?? [];
  const [form, setForm] = useState({
    categoryId: "",
    centerId: "",
    assetCode: "",
    name: "",
    description: "",
    purchaseDate: today(),
    purchaseCost: "",
    currentValue: "",
    usefulLifeMonths: "",
    status: "ACTIVE" as FixedAssetStatusV2,
    location: "",
    custodianUserId: "",
    supplierId: "",
    expenseInvoiceId: "",
    notes: ""
  });
  const [acqModal, setAcqModal] = useState<FixedAssetV2 | null>(null);
  const [acqForm, setAcqForm] = useState({ financeAccountId: "" });
  const [depModal, setDepModal] = useState<FixedAssetV2 | null>(null);
  const [depForm, setDepForm] = useState({ periodYear: new Date().getFullYear(), periodMonth: new Date().getMonth() + 1 });

  const postAcqM = usePostAssetAcquisitionMutation();
  const postDepM = usePostAssetDepreciationMutation();
  const accountsQ = useFinanceV2AccountsQuery();

  const users = useFilteredUsers(usersQ.data?.items ?? [], userSearch);

  const [searchTerm, setSearchTerm] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await createM.mutateAsync({
      categoryId: Number(form.categoryId),
      centerId: form.centerId ? Number(form.centerId) : undefined,
      assetCode: form.assetCode,
      name: form.name,
      description: form.description || undefined,
      purchaseDate: form.purchaseDate,
      purchaseCost: Number(form.purchaseCost),
      currentValue: form.currentValue ? Number(form.currentValue) : undefined,
      usefulLifeMonths: form.usefulLifeMonths ? Number(form.usefulLifeMonths) : undefined,
      status: form.status,
      location: form.location || undefined,
      custodianUserId: form.custodianUserId ? Number(form.custodianUserId) : undefined,
      supplierId: form.supplierId ? Number(form.supplierId) : undefined,
      expenseInvoiceId: form.expenseInvoiceId ? Number(form.expenseInvoiceId) : undefined,
      notes: form.notes || undefined
    });
    setForm((current) => ({
      ...current,
      assetCode: "",
      name: "",
      description: "",
      purchaseCost: "",
      currentValue: "",
      location: "",
      notes: ""
    }));
    setModalOpen(false);
  };

  const filtered = useMemo(() => {
    const list = assetsQ.data ?? [];
    if (!searchTerm) return list;
    return list.filter((item) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.assetCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assetsQ.data, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content p-0">
          <div className="ctr-controls p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="ctr-search-wrap">
              <Archive className="ctr-search-icon" size={18} />
              <input
                className="ctr-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={ar ? "بحث بالكود أو اسم الأصل..." : "Search assets..."}
              />
            </div>
          </div>

          <FinanceDataTable
            columns={[
              { id: "code", header: ar ? "الكود" : "Code", cell: (row: FixedAssetV2) => <strong className="text-slate-800 dark:text-slate-200">{row.assetCode}</strong> },
              { 
                id: "name", 
                header: ar ? "الأصل" : "Asset", 
                cell: (row: FixedAssetV2) => (
                  <div className="flex flex-col">
                    <span className="font-bold">{row.name}</span>
                    <span className="text-[10px] text-slate-400">{row.category?.name ?? "-"}</span>
                  </div>
                ) 
              },
              { id: "center", header: ar ? "المركز" : "Center", cell: (row: FixedAssetV2) => <span className="opacity-70">{row.center?.name ?? "-"}</span> },
              { 
                id: "cost", 
                header: ar ? "التكلفة" : "Cost", 
                align: "end", 
                cell: (row: FixedAssetV2) => (
                  <div className="font-bold text-brand-600">
                    <FinanceMoney amount={row.purchaseCost} baseCurrency="YER" />
                  </div>
                ) 
              },
              {
                id: "custodian",
                header: ar ? "العهدة" : "Custodian",
                cell: (row: FixedAssetV2) => (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {(row.custodian?.fullName ?? "?").slice(0, 1)}
                    </div>
                    <span className="text-xs font-medium">{row.custodian?.fullName ?? "-"}</span>
                  </div>
                )
              },
              {
                id: "status",
                header: ar ? "الحالة" : "Status",
                align: "center",
                cell: (row: FixedAssetV2) => {
                  const label = statusOptions.find((status) => status.value === row.status)?.[ar ? "ar" : "en"] ?? row.status;
                  const isSuccess = row.status === 'ACTIVE';
                  const isWarning = row.status === 'UNDER_MAINTENANCE';
                  return (
                    <span className={`fin-status-pill ${isSuccess ? 'fin-status--success' : isWarning ? 'fin-status--warning' : 'fin-status--danger'}`}>
                      {label}
                    </span>
                  );
                }
              },
              {
                id: "actions",
                header: ar ? "إجراءات" : "Actions",
                align: "center",
                cell: (row: FixedAssetV2) => (
                  <div className="flex gap-2 justify-center">
                    {row.expenseInvoiceId ? (
                      <Badge variant="warning" size="sm">
                        {ar ? "فاتورة" : "Invoice"}
                      </Badge>
                    ) : !row.acquisitionJournalEntryId ? (
                      <Button
                        size="sm"
                        variant="primary"
                        className="h-7 text-[10px] px-2"
                        onClick={() => {
                          if (row.expenseInvoiceId) return;
                          setAcqModal(row);
                        }}
                      >
                        {ar ? "قيد شراء" : "Post Acq."}
                      </Button>
                    ) : (
                      <Badge variant="success" size="sm" dot>
                        {ar ? "مرحل" : "Posted"}
                      </Badge>
                    )}
                    {row.acquisitionJournalEntryId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[10px] px-2"
                        onClick={() => setDepModal(row)}
                      >
                        {ar ? "إهلاك" : "Dep."}
                      </Button>
                    )}
                  </div>
                )
              }
            ]}
            rows={filtered}
            rowKey="id"
            density="dense"
          />
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={ar ? "تسجيل أصل جديد" : "Register New Asset"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Archive className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="asset-reg-form" isLoading={createM.isPending}>
              {ar ? "حفظ" : "Save"}
            </Button>
          </div>
        }
      >
        <form id="asset-reg-form" className="circlemod-form" onSubmit={submit}>
          <div className="circlemod-section">
            <div className="circlemod-form-grid">
            <Field label={ar ? "التصنيف" : "Category"} required>
              <select
                className="circlemod-input"
                value={form.categoryId}
                onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                required
              >
                <option value="">{ar ? "اختر التصنيف" : "Select category"}</option>
                {(categoriesQ.data ?? []).filter((category) => category.isActive).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "المركز" : "Center"}>
              <select
                className="circlemod-input"
                value={form.centerId}
                onChange={(event) => setForm((current) => ({ ...current, centerId: event.target.value }))}
              >
                <option value="">{ar ? "على مستوى الجمعية" : "Organization level"}</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "كود الأصل" : "Asset code"} required>
              <input
                className="circlemod-input"
                value={form.assetCode}
                onChange={(event) => setForm((current) => ({ ...current, assetCode: event.target.value }))}
                required
              />
            </Field>
            <Field label={ar ? "اسم الأصل" : "Asset name"} required>
              <input
                className="circlemod-input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </Field>
            <Field label={ar ? "تاريخ الشراء" : "Purchase date"} required>
              <input
                type="date"
                className="circlemod-input"
                value={form.purchaseDate}
                onChange={(event) => setForm((current) => ({ ...current, purchaseDate: event.target.value }))}
                required
              />
            </Field>
            <Field label={ar ? "تكلفة الشراء" : "Purchase cost"} required>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="circlemod-input"
                value={form.purchaseCost}
                onChange={(event) => setForm((current) => ({ ...current, purchaseCost: event.target.value }))}
                required
              />
            </Field>
            <Field label={ar ? "القيمة الحالية" : "Current value"}>
              <input
                type="number"
                min="0"
                step="0.01"
                className="circlemod-input"
                value={form.currentValue}
                onChange={(event) => setForm((current) => ({ ...current, currentValue: event.target.value }))}
              />
            </Field>
            <Field label={ar ? "الحالة" : "Status"}>
              <select
                className="circlemod-input"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FixedAssetStatusV2 }))}
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>{ar ? status.ar : status.en}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "بحث الموظف" : "Employee search"}>
              <input
                className="circlemod-input"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />
            </Field>
            <Field label={ar ? "العهدة/الموظف" : "Custodian"}>
              <select
                className="circlemod-input"
                value={form.custodianUserId}
                onChange={(event) => setForm((current) => ({ ...current, custodianUserId: event.target.value }))}
              >
                <option value="">{ar ? "بدون عهدة" : "No custodian"}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.fullName}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "المورد" : "Supplier"}>
              <select
                className="circlemod-input"
                value={form.supplierId}
                onChange={(event) => setForm((current) => ({ ...current, supplierId: event.target.value }))}
              >
                <option value="">{ar ? "بدون مورد" : "No supplier"}</option>
                {(suppliersQ.data ?? []).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "فاتورة مصروف مرتبطة" : "Linked expense invoice"}>
              <select
                className="circlemod-input"
                value={form.expenseInvoiceId}
                onChange={(event) => setForm((current) => ({ ...current, expenseInvoiceId: event.target.value }))}
              >
                <option value="">{ar ? "بدون فاتورة" : "No invoice"}</option>
                {(expensesQ.data ?? []).map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNo || `#${invoice.id}`} - {invoice.description} - {formatMoney(invoice.amount)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "الموقع" : "Location"}>
              <input
                className="circlemod-input"
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              />
            </Field>
            <Field label={ar ? "العمر بالأشهر" : "Useful life months"}>
              <input
                type="number"
                min="1"
                className="circlemod-input"
                value={form.usefulLifeMonths}
                onChange={(event) => setForm((current) => ({ ...current, usefulLifeMonths: event.target.value }))}
              />
            </Field>
            <Field label={ar ? "الوصف" : "Description"}>
              <input
                className="circlemod-input"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </Field>
            <Field label={ar ? "ملاحظات" : "Notes"}>
              <input
                className="circlemod-input"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </Field>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!acqModal}
        onClose={() => setAcqModal(null)}
        title={ar ? "إنشاء قيد اقتناء الأصل" : "Post Asset Acquisition"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Archive className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setAcqModal(null)} type="button">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="acq-form" isLoading={postAcqM.isPending}>
              {ar ? "تأكيد" : "Confirm"}
            </Button>
          </div>
        }
      >
        <form
          id="acq-form"
          className="circlemod-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!acqModal) return;
            await postAcqM.mutateAsync({
              id: acqModal.id,
              payload: { financeAccountId: Number(acqForm.financeAccountId) }
            });
            setAcqModal(null);
            setAcqForm({ financeAccountId: "" });
          }}
        >
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Archive size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الدفع والقيد" : "Payment & Journal"}</span>
            </div>

            <div className="p-3 bg-slate-50 text-xs text-slate-600 rounded border border-slate-200 mb-4">
              {ar ? "سيتم إنشاء قيد محاسبي بشراء الأصل من الحساب المالي المحدد." : "An acquisition journal entry will be created using the selected finance account."}
            </div>
            
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "الحساب المالي (للدفع)" : "Finance Account (for payment)"} *</label>
                <select
                  className="circlemod-input"
                  value={acqForm.financeAccountId}
                  onChange={(e) => setAcqForm({ financeAccountId: e.target.value })}
                  required
                >
                  <option value="">{ar ? "اختر الحساب المالي" : "Select finance account"}</option>
                  {(accountsQ.data ?? []).filter((a: any) => a.isActive).map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name || `Account #${a.id}`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!depModal}
        onClose={() => setDepModal(null)}
        title={ar ? "إهلاك الأصل للشهر" : "Run Asset Depreciation"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Archive className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setDepModal(null)} type="button">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="dep-form" isLoading={postDepM.isPending}>
              {ar ? "تشغيل الإهلاك" : "Run Depreciation"}
            </Button>
          </div>
        }
      >
        <form
          id="dep-form"
          className="circlemod-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!depModal) return;
            await postDepM.mutateAsync({
              id: depModal.id,
              payload: { periodYear: depForm.periodYear, periodMonth: depForm.periodMonth }
            });
            setDepModal(null);
          }}
        >
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Archive size={15} className="circlemod-section-icon" />
              <span>{ar ? "الفترة المالية للإهلاك" : "Depreciation Fiscal Period"}</span>
            </div>
            
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "السنة المالية" : "Fiscal Year"} *</label>
                <input
                  type="number"
                  className="circlemod-input"
                  value={depForm.periodYear}
                  onChange={(e) => setDepForm({ ...depForm, periodYear: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "الشهر" : "Month"} *</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  className="circlemod-input"
                  value={depForm.periodMonth}
                  onChange={(e) => setDepForm({ ...depForm, periodMonth: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AssetCustodyTab({ 
  ar, 
  modalOpen, 
  setModalOpen 
}: { 
  ar: boolean; 
  modalOpen: boolean; 
  setModalOpen: (open: boolean) => void; 
}) {
  const assetsQ = useFixedAssetsQuery();
  const custodyQ = useAssetCustodyLogsQuery();
  const centersQ = useCentersQuery();
  const usersQ = useUsersQuery({ page: 1, pageSize: 200 }, true);
  const assignM = useAssignAssetCustodyMutation();
  const [userSearch, setUserSearch] = useState("");
  const centers = centersQ.data?.items ?? [];
  const [form, setForm] = useState({
    assetId: "",
    toUserId: "",
    centerId: "",
    assignedAt: today(),
    returnedAt: "",
    notes: ""
  });
  const users = useFilteredUsers(usersQ.data?.items ?? [], userSearch);

  const [searchTerm, setSearchTerm] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await assignM.mutateAsync({
      assetId: Number(form.assetId),
      payload: {
        toUserId: form.toUserId ? Number(form.toUserId) : undefined,
        centerId: form.centerId ? Number(form.centerId) : undefined,
        assignedAt: form.assignedAt,
        returnedAt: form.returnedAt || undefined,
        notes: form.notes || undefined
      }
    });
    setForm((current) => ({ ...current, toUserId: "", notes: "" }));
    setModalOpen(false);
  };

  const filtered = useMemo(() => {
    const list = custodyQ.data ?? [];
    if (!searchTerm) return list;
    return list.filter((item) => 
      item.asset?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.toUser?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fromUser?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [custodyQ.data, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content p-0">
          <div className="ctr-controls p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="ctr-search-wrap">
              <ClipboardList className="ctr-search-icon" size={18} />
              <input
                className="ctr-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={ar ? "بحث في العهد..." : "Search custody..."}
              />
            </div>
          </div>

          <FinanceDataTable
            columns={[
              { id: "asset", header: ar ? "الأصل" : "Asset", cell: (row: any) => row.asset ? (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{row.asset.assetCode}</span>
                  <span className="text-[10px] text-slate-400">{row.asset.name}</span>
                </div>
              ) : "-" },
              { id: "from", header: ar ? "من" : "From", cell: (row: any) => (
                <span className="text-slate-500">{row.fromUser?.fullName ?? (ar ? "المخزن" : "Inventory")}</span>
              )},
              { id: "to", header: ar ? "إلى" : "To", cell: (row: any) => (
                row.toUser ? (
                  <Badge variant="info" size="sm" dot>
                    {row.toUser.fullName}
                  </Badge>
                ) : "-"
              )},
              { id: "center", header: ar ? "المركز" : "Center", cell: (row: any) => <span className="text-slate-500">{row.center?.name ?? "-"}</span> },
              { id: "assigned", header: ar ? "تاريخ التسليم" : "Assigned", cell: (row: any) => <span className="font-medium">{displayDate(row.assignedAt)}</span> },
              { id: "returned", header: ar ? "تاريخ الإرجاع" : "Returned", cell: (row: any) => row.returnedAt ? <Badge variant="success" size="sm">{displayDate(row.returnedAt)}</Badge> : <span className="text-slate-300 italic text-[10px]">{ar ? "لم يتم" : "Not yet"}</span> },
              { id: "notes", header: ar ? "ملاحظات" : "Notes", cell: (row: any) => <span className="text-xs text-slate-400 italic line-clamp-1 max-w-[120px]">{row.notes ?? "-"}</span> }
            ]}
            rows={filtered}
            rowKey="id"
            density="dense"
          />
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={ar ? "تسجيل تسليم عهدة" : "Assign Custody"}
        titleIcon={
          <div className="circlemod-head-icon">
            <ClipboardList className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="custody-form" isLoading={assignM.isPending}>
              {ar ? "حفظ" : "Save"}
            </Button>
          </div>
        }
      >
        <form id="custody-form" className="circlemod-form" onSubmit={submit}>
          <div className="circlemod-section">
            <div className="circlemod-form-grid">
            <Field label={ar ? "الأصل" : "Asset"} required>
              <select
                className="circlemod-input"
                value={form.assetId}
                onChange={(event) => setForm((current) => ({ ...current, assetId: event.target.value }))}
                required
              >
                <option value="">{ar ? "اختر الأصل" : "Select asset"}</option>
                {(assetsQ.data ?? []).map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.assetCode} - {asset.name}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "بحث الموظف" : "Employee search"}>
              <input
                className="circlemod-input"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />
            </Field>
            <Field label={ar ? "العهدة/الموظف" : "Custodian"}>
              <select
                className="circlemod-input"
                value={form.toUserId}
                onChange={(event) => setForm((current) => ({ ...current, toUserId: event.target.value }))}
              >
                <option value="">{ar ? "إخلاء العهدة" : "Clear custody"}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.fullName}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "المركز" : "Center"}>
              <select
                className="circlemod-input"
                value={form.centerId}
                onChange={(event) => setForm((current) => ({ ...current, centerId: event.target.value }))}
              >
                <option value="">{ar ? "يبقى كما هو" : "Keep current"}</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "تاريخ التسليم" : "Assigned at"} required>
              <input
                type="date"
                className="circlemod-input"
                value={form.assignedAt}
                onChange={(event) => setForm((current) => ({ ...current, assignedAt: event.target.value }))}
                required
              />
            </Field>
            <Field label={ar ? "تاريخ الإرجاع" : "Returned at"}>
              <input
                type="date"
                className="circlemod-input"
                value={form.returnedAt}
                onChange={(event) => setForm((current) => ({ ...current, returnedAt: event.target.value }))}
              />
            </Field>
            <Field label={ar ? "ملاحظات" : "Notes"}>
              <input
                className="circlemod-input"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </Field>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="circlemod-field">
      <label>{label}{required ? " *" : ""}</label>
      {children}
    </div>
  );
}

function useFilteredUsers(users: Array<{ id: number; fullName: string; role?: string; email?: string }>, search: string) {
  return useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const activeUsers = users.filter((user) => user.role !== "STUDENT" && user.role !== "PARENT");
    if (!normalized) return activeUsers.slice(0, 80);
    return activeUsers
      .filter((user) =>
        `${user.fullName} ${user.email ?? ""} ${user.role ?? ""}`.toLowerCase().includes(normalized)
      )
      .slice(0, 80);
  }, [users, search]);
}
