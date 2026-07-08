import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Archive, ClipboardList, Edit2, Info, PackageCheck, Plus, RotateCcw, Tags, Trash2, XCircle } from "lucide-react";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  FinancePageShell,
  FinancePageHeader,
  FinanceDataTable,
  FinanceTableFooter,
  FinanceMoney
} from "../../features/finance-v2/design";
import { Badge } from "../../components/ui/Badge";
import { ErrorState } from "../../components/ui/ErrorState";
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
  useFinanceV2AccountsQuery,
  useUpdateAssetCategoryMutation,
  useDeactivateAssetCategoryMutation,
  useUpdateFixedAssetMutation,
  useDeactivateFixedAssetMutation,
  useReactivateFixedAssetMutation,
  useReleaseCustodyMutation,
  useUpdateAssetCustodyMutation,
  useDeleteAssetCustodyMutation
} from "../../features/finance-v2/finance-v2.hooks";
import type { AssetCategoryV2, AssetCustodyLogV2, FixedAssetStatusV2, FixedAssetV2 } from "../../features/finance-v2/types";
import { useCentersQuery } from "../../features/org/org.hooks";
import { useUsersQuery } from "../../features/users/users.hooks";
import { useAccountingAccountsQuery } from "../accounting/accounting.hooks";
import { AnimatePresence, motion } from "framer-motion";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import {
  focusFirstInvalidField,
  notifyError,
  notifyRequiredFields,
  notifySuccess
} from "../../shared/ui/feedback";
import useClientPagination from "../../shared/ui/useClientPagination";

type TabId = "categories" | "assets" | "custody";

const statusOptions: Array<{ value: FixedAssetStatusV2; ar: string; en: string }> = [
  { value: "ACTIVE",            ar: "نشط",           en: "Active" },
  { value: "IN_CUSTODY",        ar: "بعهدة",          en: "In custody" },
  { value: "UNDER_MAINTENANCE", ar: "تحت الصيانة",    en: "Under maintenance" },
  { value: "DISPOSED",          ar: "مستبعد",         en: "Disposed" },
  { value: "LOST",              ar: "مفقود",          en: "Lost" },
  { value: "INACTIVE",          ar: "غير نشط",        en: "Inactive" }
];

const getStatusStyle = (status: FixedAssetStatusV2) => {
  switch (status) {
    case "ACTIVE":            return "fin-status--success";
    case "IN_CUSTODY":        return "fin-status--info";
    case "UNDER_MAINTENANCE": return "fin-status--warning";
    default:                  return "fin-status--danger";
  }
};

const today = () => new Date().toISOString().slice(0, 10);

const formatMoney = (value?: number | null) =>
  Number(value ?? 0).toLocaleString("ar-u-nu-latn", { maximumFractionDigits: 2 });

const displayDate = (value?: string | null) => (value ? value.slice(0, 10) : "-");

const rejectInvalidForm = (form: HTMLFormElement, ar: boolean) => {
  if (!focusFirstInvalidField(form)) return false;
  notifyRequiredFields(ar);
  return true;
};

export default function FinanceAssetsPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canManageAssetSettings = user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const canRegisterAsset =
    user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTANT" || user?.role === "FINANCE_MANAGER";
  const canAcquireAsset =
    user?.role === "SUPER_ADMIN" || user?.role === "TREASURER";
  const canDepreciateAsset =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const [activeTab, setActiveTab] = useState<TabId>("assets");

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [custodyModalOpen, setCustodyModalOpen] = useState(false);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "categories", label: ar ? "تصنيفات الأصول" : "Categories",    icon: <Tags        size={16} /> },
    { id: "assets",     label: ar ? "سجل الأصول"    : "Asset register", icon: <Archive      size={16} /> },
    { id: "custody",    label: ar ? "العهد والتسليم" : "Custody",         icon: <ClipboardList size={16} /> },
  ];

  const headerActions = (
    <div className="flex items-center gap-3">
      {activeTab === "categories" && canManageAssetSettings && (
        <Button onClick={() => setCatModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          {ar ? "إضافة تصنيف" : "Add category"}
        </Button>
      )}
      {activeTab === "assets" && canRegisterAsset && (
        <Button onClick={() => setAssetModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          {ar ? "تسجيل أصل" : "Register asset"}
        </Button>
      )}
      {activeTab === "custody" && canRegisterAsset && (
        <Button onClick={() => setCustodyModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          {ar ? "تسليم عهدة" : "Assign Custody"}
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
                canManage={canManageAssetSettings}
              />
            ) : null}
            {activeTab === "assets" ? (
              <AssetRegisterTab
                ar={ar}
                modalOpen={assetModalOpen}
                setModalOpen={setAssetModalOpen}
                canRegister={canRegisterAsset}
                canAcquire={canAcquireAsset}
                canDepreciate={canDepreciateAsset}
              />
            ) : null}
            {activeTab === "custody" ? (
              <AssetCustodyTab
                ar={ar}
                modalOpen={custodyModalOpen}
                setModalOpen={setCustodyModalOpen}
                canManage={canRegisterAsset}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </FinancePageShell>
  );
}

function CategoryFormFields({ 
  ar,
  formState, 
  onChange,
  assetAccounts,
  expenseAccounts
}: {
  ar: boolean;
  formState: { name: string; usefulLifeMonths: string; assetAccountId: string; depreciationExpenseAccountId: string; accumulatedDepreciationAccountId: string; };
  onChange: (key: string, value: string) => void;
  assetAccounts: Array<any>;
  expenseAccounts: Array<any>;
}) {
  return (
    <div className="circlemod-form-grid">
      <Field 
        label={ar ? "اسم التصنيف" : "Category name"} 
        required
        tooltip={ar ? "أدخل اسم التصنيف (مثال: أجهزة حاسوب)" : "Enter category name (e.g., Computers)"}
      >
        <input className="circlemod-input" value={formState.name} onChange={(e) => onChange("name", e.target.value)} required />
      </Field>
      <Field 
        label={ar ? "العمر بالأشهر" : "Useful life months"} 
        required
        tooltip={ar ? "العمر الافتراضي للأصل بالأشهر لحساب الاستهلاك" : "Expected useful life in months for depreciation"}
      >
        <input type="number" min="1" className="circlemod-input" value={formState.usefulLifeMonths} onChange={(e) => onChange("usefulLifeMonths", e.target.value)} required />
      </Field>
      <Field 
        label={ar ? "حساب الأصل" : "Asset account"} 
        required
        tooltip={ar ? "حساب الأصول في الدليل المحاسبي لربط المشتريات" : "Asset account in the chart of accounts"}
      >
        <select className="circlemod-input" value={formState.assetAccountId} onChange={(e) => onChange("assetAccountId", e.target.value)} required>
          <option value="">{ar ? "اختر الحساب" : "Select account"}</option>
          {assetAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
        </select>
      </Field>
      <Field 
        label={ar ? "حساب مصروف الاستهلاك" : "Depreciation expense"} 
        required
        tooltip={ar ? "حساب مصروف الاستهلاك لتسجيل قيد الإهلاك" : "Expense account for recording depreciation"}
      >
        <select className="circlemod-input" value={formState.depreciationExpenseAccountId} onChange={(e) => onChange("depreciationExpenseAccountId", e.target.value)} required>
          <option value="">{ar ? "اختر الحساب" : "Select account"}</option>
          {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
        </select>
      </Field>
      <Field 
        label={ar ? "مجمع الاستهلاك" : "Accumulated depreciation"} 
        required
        tooltip={ar ? "حساب مجمع الاستهلاك لتخفيض القيمة الدفترية" : "Accumulated depreciation account"}
      >
        <select className="circlemod-input" value={formState.accumulatedDepreciationAccountId} onChange={(e) => onChange("accumulatedDepreciationAccountId", e.target.value)} required>
          <option value="">{ar ? "اختر الحساب" : "Select account"}</option>
          {assetAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
        </select>
      </Field>
    </div>
  );
}

// ─── Asset Categories Tab ─────────────────────────────────────────────────────

function AssetCategoriesTab({
  ar,
  modalOpen,
  setModalOpen,
  canManage = true
}: {
  ar: boolean;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  canManage?: boolean;
}) {
  const categoriesQ = useAssetCategoriesQuery();
  const accountsQ = useAccountingAccountsQuery();
  const createM = useCreateAssetCategoryMutation();
  const updateM = useUpdateAssetCategoryMutation();
  const deactivateM = useDeactivateAssetCategoryMutation();

  const [form, setForm] = useState({
    name: "",
    assetAccountId: "",
    depreciationExpenseAccountId: "",
    accumulatedDepreciationAccountId: "",
    usefulLifeMonths: ""
  });

  const [editModal, setEditModal] = useState<AssetCategoryV2 | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    assetAccountId: "",
    depreciationExpenseAccountId: "",
    accumulatedDepreciationAccountId: "",
    usefulLifeMonths: ""
  });

  const [searchTerm, setSearchTerm] = useState("");

  const accounts = accountsQ.data ?? [];
  const parentAccountIds = new Set(accounts.map((a) => a.parentId).filter((id): id is number => Boolean(id)));
  const assetAccounts = accounts.filter((a) => a.type === "ASSET" && a.isActive && !parentAccountIds.has(a.id));
  const expenseAccounts = accounts.filter((a) => a.type === "EXPENSE" && a.isActive && !parentAccountIds.has(a.id));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rejectInvalidForm(event.currentTarget, ar)) return;
    try {
      await createM.mutateAsync({
        name: form.name,
        assetAccountId: form.assetAccountId ? Number(form.assetAccountId) : undefined,
        depreciationExpenseAccountId: form.depreciationExpenseAccountId ? Number(form.depreciationExpenseAccountId) : undefined,
        accumulatedDepreciationAccountId: form.accumulatedDepreciationAccountId ? Number(form.accumulatedDepreciationAccountId) : undefined,
        usefulLifeMonths: form.usefulLifeMonths ? Number(form.usefulLifeMonths) : undefined
      });
      notifySuccess(ar ? "تمت إضافة تصنيف الأصل بنجاح" : "Asset category added successfully");
      setForm({ name: "", assetAccountId: "", depreciationExpenseAccountId: "", accumulatedDepreciationAccountId: "", usefulLifeMonths: "" });
      setModalOpen(false);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر إضافة تصنيف الأصل." : "Unable to add the asset category." }));
    }
  };

  const openEdit = (cat: AssetCategoryV2) => {
    setEditForm({
      name: cat.name,
      assetAccountId: cat.assetAccountId ? String(cat.assetAccountId) : "",
      depreciationExpenseAccountId: cat.depreciationExpenseAccountId ? String(cat.depreciationExpenseAccountId) : "",
      accumulatedDepreciationAccountId: cat.accumulatedDepreciationAccountId ? String(cat.accumulatedDepreciationAccountId) : "",
      usefulLifeMonths: cat.usefulLifeMonths ? String(cat.usefulLifeMonths) : ""
    });
    setEditModal(cat);
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editModal) return;
    if (rejectInvalidForm(event.currentTarget, ar)) return;
    try {
      await updateM.mutateAsync({
        id: editModal.id,
        payload: {
          name: editForm.name,
          assetAccountId: editForm.assetAccountId ? Number(editForm.assetAccountId) : null,
          depreciationExpenseAccountId: editForm.depreciationExpenseAccountId ? Number(editForm.depreciationExpenseAccountId) : null,
          accumulatedDepreciationAccountId: editForm.accumulatedDepreciationAccountId ? Number(editForm.accumulatedDepreciationAccountId) : null,
          usefulLifeMonths: editForm.usefulLifeMonths ? Number(editForm.usefulLifeMonths) : null
        }
      });
      notifySuccess(ar ? "تم تحديث التصنيف بنجاح" : "Category updated successfully");
      setEditModal(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تحديث التصنيف." : "Unable to update the category." }));
    }
  };

  const handleDeactivate = async (cat: AssetCategoryV2) => {
    try {
      await deactivateM.mutateAsync(cat.id);
      notifySuccess(ar ? "تم تعطيل التصنيف" : "Category deactivated");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تعطيل التصنيف." : "Unable to deactivate." }));
    }
  };

  const filtered = useMemo(() => {
    const list = categoriesQ.data ?? [];
    if (!searchTerm) return list;
    return list.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [categoriesQ.data, searchTerm]);
  const pagination = useClientPagination(filtered, { initialPageSize: 10, resetKey: searchTerm });



  return (
    <div className="fin-premium-panel animate-premium">
      <div className="fin-premium-panel__content p-0">
        <div className="ctr-controls mb-4">
          <div className="ctr-search-wrap">
            <Tags className="ctr-search-icon" size={18} />
            <input className="ctr-search-input" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={ar ? "بحث في التصنيفات..." : "Search categories..."} />
          </div>
        </div>

        {categoriesQ.isError ? (
          <ErrorState className="m-4" title={ar ? "فشل تحميل التصنيفات" : "Failed to load categories"} description={getLocalizedApiErrorMessage(categoriesQ.error, { ar, fallback: ar ? "تعذر تحميل تصنيفات الأصول." : "Unable to load asset categories." })} onRetry={() => void categoriesQ.refetch()} />
        ) : (
          <FinanceDataTable
            className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
            columns={[
              { id: "name", header: ar ? "التصنيف" : "Category", cell: (row: AssetCategoryV2) => <strong className="text-slate-800 dark:text-slate-200">{row.name}</strong> },
              { id: "assetAccount", header: ar ? "حساب الأصل" : "Asset account", cell: (row: AssetCategoryV2) => row.assetAccount ? (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{row.assetAccount.code}</span>
                  <span className="text-xs text-slate-400">{row.assetAccount.name}</span>
                </div>
              ) : "-" },
              { id: "depAccount", header: ar ? "مجمع الاستهلاك" : "Accum. depr.", cell: (row: AssetCategoryV2) => row.accumulatedDepreciationAccount ? (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{row.accumulatedDepreciationAccount.code}</span>
                  <span className="text-xs text-slate-400">{row.accumulatedDepreciationAccount.name}</span>
                </div>
              ) : "-" },
              { id: "life", header: ar ? "العمر (أشهر)" : "Life (m)", align: "center", cell: (row: AssetCategoryV2) => row.usefulLifeMonths ? (
                <Badge variant="secondary" size="sm">{row.usefulLifeMonths} {ar ? "شهر" : "m"}</Badge>
              ) : "-" },
              { id: "active", header: ar ? "الحالة" : "Status", align: "center", cell: (row: AssetCategoryV2) => (
                <span className={`fin-status-pill ${row.isActive ? "fin-status--success" : "fin-status--warning"}`}>
                  {row.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}
                </span>
              )},
              ...(canManage ? [{
                id: "actions", header: ar ? "إجراءات" : "Actions", align: "center" as const,
                cell: (row: AssetCategoryV2) => (
                  <div className="flex gap-1 justify-center">
                    <button type="button" className="fin-action-btn view" onClick={() => openEdit(row)} title={ar ? "تعديل" : "Edit"}>
                      <Edit2 size={16} />
                    </button>
                    {row.isActive && (
                      <button type="button" className="fin-action-btn delete" onClick={() => handleDeactivate(row)} title={ar ? "تعطيل" : "Deactivate"} disabled={deactivateM.isPending}>
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                )
              }] : [])
            ]}
            rows={pagination.pagedRows}
            rowKey="id"
            density="dense"
          />
        )}
      </div>
      <FinanceTableFooter ar={ar} pageSize={pagination.pageSize} setPageSize={pagination.setPageSize} currentPage={pagination.currentPage} setPage={pagination.setCurrentPage} totalFilteredCount={pagination.totalItems} pages={pagination.totalPages} />

      {/* مودال إضافة تصنيف */}
      <Modal isOpen={Boolean(modalOpen && canManage)} onClose={() => setModalOpen(false)} title={ar ? "إضافة تصنيف أصل" : "Add Asset Category"} titleIcon={<div className="circlemod-head-icon"><Tags className="w-4 h-4" /></div>} size="md" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="asset-cat-form" isLoading={createM.isPending}>{ar ? "حفظ" : "Save"}</Button>
        </div>
      }>
        <form id="asset-cat-form" className="circlemod-form" onSubmit={submit} noValidate>
          <div className="circlemod-section">
            <CategoryFormFields ar={ar} formState={form} onChange={(k, v) => setForm((c) => ({ ...c, [k]: v }))} assetAccounts={assetAccounts} expenseAccounts={expenseAccounts} />
          </div>
        </form>
      </Modal>

      {/* مودال تعديل تصنيف */}
      <Modal isOpen={Boolean(editModal)} onClose={() => setEditModal(null)} title={ar ? "تعديل تصنيف أصل" : "Edit Asset Category"} titleIcon={<div className="circlemod-head-icon"><Edit2 className="w-4 h-4" /></div>} size="md" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setEditModal(null)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="asset-cat-edit-form" isLoading={updateM.isPending}>{ar ? "حفظ التعديلات" : "Save changes"}</Button>
        </div>
      }>
        <form id="asset-cat-edit-form" className="circlemod-form" onSubmit={submitEdit} noValidate>
          <div className="circlemod-section">
            <CategoryFormFields ar={ar} formState={editForm} onChange={(k, v) => setEditForm((c) => ({ ...c, [k]: v }))} assetAccounts={assetAccounts} expenseAccounts={expenseAccounts} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Asset Register Tab ───────────────────────────────────────────────────────

function AssetRegisterTab({
  ar,
  modalOpen,
  setModalOpen,
  canRegister = true,
  canAcquire = true,
  canDepreciate = true
}: {
  ar: boolean;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  canRegister?: boolean;
  canAcquire?: boolean;
  canDepreciate?: boolean;
}) {
  const categoriesQ = useAssetCategoriesQuery();
  const assetsQ = useFixedAssetsQuery();
  const centersQ = useCentersQuery();
  const suppliersQ = useSuppliersQuery();
  const expensesQ = useExpenseInvoicesQuery({});
  const createM = useCreateFixedAssetMutation();
  const updateM = useUpdateFixedAssetMutation();
  const deactivateM = useDeactivateFixedAssetMutation();
  const reactivateM = useReactivateFixedAssetMutation();
  const postAcqM = usePostAssetAcquisitionMutation();
  const postDepM = usePostAssetDepreciationMutation();
  const accountsQ = useFinanceV2AccountsQuery();

  const [form, setForm] = useState({
    categoryId: "", centerId: "", assetCode: "", name: "", description: "",
    purchaseDate: today(), purchaseCost: "", usefulLifeMonths: "", status: "ACTIVE" as FixedAssetStatusV2,
    location: "", supplierId: "", expenseInvoiceId: "", notes: ""
  });

  const [acqModal, setAcqModal] = useState<FixedAssetV2 | null>(null);
  const [acqForm, setAcqForm] = useState({ financeAccountId: "" });
  const [depModal, setDepModal] = useState<FixedAssetV2 | null>(null);
  const [depForm, setDepForm] = useState({ periodYear: new Date().getFullYear(), periodMonth: new Date().getMonth() + 1 });
  const [editModal, setEditModal] = useState<FixedAssetV2 | null>(null);
  const [editForm, setEditForm] = useState({ name: "", location: "", description: "", notes: "", usefulLifeMonths: "" });
  const [deactivateModal, setDeactivateModal] = useState<FixedAssetV2 | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rejectInvalidForm(event.currentTarget, ar)) return;
    try {
      await createM.mutateAsync({
        categoryId: Number(form.categoryId),
        centerId: form.centerId ? Number(form.centerId) : undefined,
        assetCode: form.assetCode,
        name: form.name,
        description: form.description || undefined,
        purchaseDate: form.purchaseDate,
        purchaseCost: Number(form.purchaseCost),
        usefulLifeMonths: form.usefulLifeMonths ? Number(form.usefulLifeMonths) : undefined,
        status: form.status,
        location: form.location,
        supplierId: form.supplierId ? Number(form.supplierId) : undefined,
        expenseInvoiceId: form.expenseInvoiceId ? Number(form.expenseInvoiceId) : undefined,
        notes: form.notes || undefined
      });
      notifySuccess(ar ? "تم تسجيل الأصل بنجاح" : "Asset registered successfully");
      setForm((c) => ({ ...c, assetCode: "", name: "", description: "", purchaseCost: "", location: "", notes: "" }));
      setModalOpen(false);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تسجيل الأصل." : "Unable to register the asset." }));
    }
  };

  const openEdit = (asset: FixedAssetV2) => {
    setEditForm({
      name: asset.name,
      location: asset.location ?? "",
      description: asset.description ?? "",
      notes: asset.notes ?? "",
      usefulLifeMonths: asset.usefulLifeMonths ? String(asset.usefulLifeMonths) : ""
    });
    setEditModal(asset);
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editModal) return;
    if (rejectInvalidForm(event.currentTarget, ar)) return;
    try {
      await updateM.mutateAsync({
        id: editModal.id,
        payload: {
          name: editForm.name,
          location: editForm.location || undefined,
          description: editForm.description || undefined,
          notes: editForm.notes,
          usefulLifeMonths: editForm.usefulLifeMonths ? Number(editForm.usefulLifeMonths) : null
        }
      });
      notifySuccess(ar ? "تم تحديث الأصل بنجاح" : "Asset updated successfully");
      setEditModal(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تحديث الأصل." : "Unable to update." }));
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateModal) return;
    try {
      await deactivateM.mutateAsync(deactivateModal.id);
      notifySuccess(ar ? "تم تعطيل الأصل" : "Asset deactivated");
      setDeactivateModal(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تعطيل الأصل." : "Unable to deactivate." }));
    }
  };

  const handleReactivate = async (asset: FixedAssetV2) => {
    try {
      await reactivateM.mutateAsync(asset.id);
      notifySuccess(ar ? "تم تفعيل الأصل" : "Asset reactivated");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تفعيل الأصل." : "Unable to reactivate." }));
    }
  };

  const filtered = useMemo(() => {
    const list = assetsQ.data ?? [];
    if (!searchTerm) return list;
    return list.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assetsQ.data, searchTerm]);
  const pagination = useClientPagination(filtered, { initialPageSize: 10, resetKey: searchTerm });

  return (
    <div className="space-y-4">
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content p-0">
          <div className="ctr-controls mb-4">
            <div className="ctr-search-wrap">
              <Archive className="ctr-search-icon" size={18} />
              <input className="ctr-search-input" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={ar ? "بحث بالكود أو اسم الأصل..." : "Search assets..."} />
            </div>
          </div>

          {assetsQ.isError ? (
            <ErrorState className="m-4" title={ar ? "فشل تحميل الأصول" : "Failed to load assets"} description={getLocalizedApiErrorMessage(assetsQ.error, { ar, fallback: ar ? "تعذر تحميل سجل الأصول." : "Unable to load the asset register." })} onRetry={() => void assetsQ.refetch()} />
          ) : (
            <FinanceDataTable
              className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
              columns={[
                { id: "name", header: ar ? "الأصل" : "Asset", cell: (row: FixedAssetV2) => (
                  <div className="flex flex-col">
                    <span className="font-bold">{row.name}</span>
                    <span className="text-[10px] text-slate-400">{row.assetCode} • {row.category?.name ?? "-"}</span>
                  </div>
                )},
                { id: "center", header: ar ? "المركز" : "Center", cell: (row: FixedAssetV2) => <span className="opacity-70">{row.center?.name ?? (ar ? "على مستوى الجمعية" : "Organization level")}</span> },
                { id: "purchaseDate", header: ar ? "تاريخ الشراء" : "Purchased", cell: (row: FixedAssetV2) => <span className="text-xs">{displayDate(row.purchaseDate)}</span> },
                { id: "cost", header: ar ? "التكلفة" : "Cost", align: "end", cell: (row: FixedAssetV2) => (
                  <div className="font-bold text-brand-600"><FinanceMoney amount={row.purchaseCost} baseCurrency="YER" /></div>
                )},
                { id: "currentValue", header: ar ? "القيمة الحالية" : "Curr. value", align: "end", cell: (row: FixedAssetV2) => (
                  <span className="text-xs text-slate-500"><FinanceMoney amount={row.currentValue ?? row.purchaseCost} baseCurrency="YER" /></span>
                )},

                { id: "status", header: ar ? "الحالة" : "Status", align: "center", cell: (row: FixedAssetV2) => {
                  const label = statusOptions.find((s) => s.value === row.status)?.[ar ? "ar" : "en"] ?? row.status;
                  return (
                    <div className="flex flex-col gap-1 items-center">
                      <span className={`fin-status-pill ${getStatusStyle(row.status)}`}>{label}</span>
                      {row.expenseInvoiceId ? (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded">{ar ? "فاتورة" : "Invoice"}</span>
                      ) : row.acquisitionJournalEntryId ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded">{ar ? "مرحل" : "Posted"}</span>
                      ) : null}
                    </div>
                  );
                }},
                { id: "actions", header: ar ? "إجراءات" : "Actions", align: "center", cell: (row: FixedAssetV2) => (
                  <div className="flex gap-1 justify-center flex-wrap">
                    {canRegister && (
                      <button type="button" className="fin-action-btn view" onClick={() => openEdit(row)} title={ar ? "تعديل" : "Edit"}>
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canAcquire && !row.expenseInvoiceId && !row.acquisitionJournalEntryId && (
                      <button type="button" className="fin-action-btn approve" onClick={() => setAcqModal(row)} title={ar ? "قيد شراء" : "Post Acq."}>
                        <PackageCheck size={16} />
                      </button>
                    )}
                    {canDepreciate && row.acquisitionJournalEntryId && (
                      <button type="button" className="fin-action-btn print" onClick={() => setDepModal(row)} title={ar ? "إهلاك" : "Depreciate"}>
                        <Archive size={16} />
                      </button>
                    )}
                    {canRegister && row.status === "INACTIVE" && (
                      <button type="button" className="fin-action-btn approve" onClick={() => handleReactivate(row)} disabled={reactivateM.isPending} title={ar ? "تفعيل" : "Reactivate"}>
                        <RotateCcw size={16} />
                      </button>
                    )}
                    {canRegister && row.status !== "INACTIVE" && (
                      <button type="button" className="fin-action-btn delete" onClick={() => setDeactivateModal(row)} title={ar ? "تعطيل" : "Deactivate"}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              ]}
              rows={pagination.pagedRows}
              rowKey="id"
              density="dense"
            />
          )}
        </div>
      </div>
      <FinanceTableFooter ar={ar} pageSize={pagination.pageSize} setPageSize={pagination.setPageSize} currentPage={pagination.currentPage} setPage={pagination.setCurrentPage} totalFilteredCount={pagination.totalItems} pages={pagination.totalPages} />

      {/* مودال تسجيل أصل جديد */}
      <Modal isOpen={Boolean(modalOpen && canRegister)} onClose={() => setModalOpen(false)} title={ar ? "تسجيل أصل جديد" : "Register New Asset"} titleIcon={<div className="circlemod-head-icon"><Archive className="w-4 h-4" /></div>} size="lg" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="asset-reg-form" isLoading={createM.isPending}>{ar ? "حفظ" : "Save"}</Button>
        </div>
      }>
        <form id="asset-reg-form" className="circlemod-form" onSubmit={submit} noValidate>
          <div className="circlemod-section">
            <div className="circlemod-section-head"><Archive size={15} className="circlemod-section-icon" /><span>{ar ? "بيانات الأصل الأساسية" : "Basic asset info"}</span></div>
            <div className="circlemod-form-grid">
              <Field label={ar ? "التصنيف" : "Category"} required>
                <select className="circlemod-input" value={form.categoryId} onChange={(e) => {
                  const val = e.target.value;
                  const selectedCat = categoriesQ.data?.find((c) => c.id === Number(val));
                  setForm((c) => ({
                    ...c,
                    categoryId: val,
                    usefulLifeMonths: selectedCat?.usefulLifeMonths ? String(selectedCat.usefulLifeMonths) : c.usefulLifeMonths
                  }));
                }} required>
                  <option value="">{ar ? "اختر التصنيف" : "Select category"}</option>
                  {(categoriesQ.data ?? []).filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label={ar ? "المركز" : "Center"}>
                <select className="circlemod-input" value={form.centerId} onChange={(e) => setForm((c) => ({ ...c, centerId: e.target.value }))}>
                  <option value="">{ar ? "على مستوى الجمعية" : "Organization level"}</option>
                  {(centersQ.data?.items ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label={ar ? "كود الأصل" : "Asset code"} required>
                <input className="circlemod-input" value={form.assetCode} onChange={(e) => setForm((c) => ({ ...c, assetCode: e.target.value }))} required />
              </Field>
              <Field label={ar ? "اسم الأصل" : "Asset name"} required>
                <input className="circlemod-input" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />
              </Field>
              <Field label={ar ? "تاريخ الشراء" : "Purchase date"} required>
                <input type="date" className="circlemod-input" value={form.purchaseDate} max={today()} onChange={(e) => setForm((c) => ({ ...c, purchaseDate: e.target.value }))} required />
              </Field>
              <Field label={ar ? "تكلفة الشراء" : "Purchase cost"} required>
                <input type="number" min="0.01" step="0.01" className="circlemod-input" value={form.purchaseCost} onChange={(e) => setForm((c) => ({ ...c, purchaseCost: e.target.value }))} required />
              </Field>
            </div>
          </div>
          <div className="circlemod-section">
            <div className="circlemod-section-head"><Tags size={15} className="circlemod-section-icon" /><span>{ar ? "بيانات إضافية" : "Additional details"}</span></div>
            <div className="circlemod-form-grid">
              <Field label={ar ? "الموقع" : "Location"} required>
                <input className="circlemod-input" value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} required />
              </Field>
              <Field label={ar ? "العمر بالأشهر" : "Useful life months"} required>
                <input type="number" min="1" className="circlemod-input" value={form.usefulLifeMonths} onChange={(e) => setForm((c) => ({ ...c, usefulLifeMonths: e.target.value }))} required />
              </Field>
              <Field label={ar ? "الحالة" : "Status"}>
                <select className="circlemod-input" value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as FixedAssetStatusV2 }))}>
                  {statusOptions.filter((s) => s.value !== "IN_CUSTODY").map((s) => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
                </select>
              </Field>
              <Field label={ar ? "الوصف" : "Description"}>
                <input className="circlemod-input" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
              </Field>
              <Field label={ar ? "ملاحظات" : "Notes"}>
                <input className="circlemod-input" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
              </Field>
            </div>
          </div>
          <details className="circlemod-section group">
            <summary className="circlemod-section-head cursor-pointer list-none select-none flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tags size={15} className="circlemod-section-icon" />
                <span>{ar ? "بيانات الشراء الاختيارية" : "Optional purchase details"}</span>
              </div>
              <div className="text-slate-400 group-open:rotate-180 transition-transform">▼</div>
            </summary>
            <div className="circlemod-form-grid mt-4">
              <Field label={ar ? "المورد" : "Supplier"}>
                <select className="circlemod-input" value={form.supplierId} onChange={(e) => setForm((c) => ({ ...c, supplierId: e.target.value }))}>
                  <option value="">{ar ? "بدون مورد" : "No supplier"}</option>
                  {(suppliersQ.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label={ar ? "فاتورة شراء مرتبطة" : "Linked purchase invoice"}>
                <select className="circlemod-input" value={form.expenseInvoiceId} onChange={(e) => setForm((c) => ({ ...c, expenseInvoiceId: e.target.value }))}>
                  <option value="">{ar ? "بدون فاتورة" : "No invoice"}</option>
                  {(expensesQ.data ?? []).map((inv) => <option key={inv.id} value={inv.id}>{inv.invoiceNo || `#${inv.id}`} - {inv.description} - {formatMoney(inv.amount)}</option>)}
                </select>
                <div className="text-[11px] text-slate-500 mt-1">
                  {ar ? "ربط الفاتورة اختياري ويستخدم للتوثيق المالي فقط، ولا يعني تسجيل الأصل كمصروف مباشر." : "Linking an invoice is optional and used for financial documentation only."}
                </div>
              </Field>
            </div>
          </details>
        </form>
      </Modal>

      {/* مودال تعديل أصل */}
      <Modal isOpen={Boolean(editModal && canRegister)} onClose={() => setEditModal(null)} title={ar ? "تعديل الأصل" : "Edit Asset"} titleIcon={<div className="circlemod-head-icon"><Edit2 className="w-4 h-4" /></div>} size="md" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setEditModal(null)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="asset-edit-form" isLoading={updateM.isPending}>{ar ? "حفظ التعديلات" : "Save changes"}</Button>
        </div>
      }>
        <form id="asset-edit-form" className="circlemod-form" onSubmit={submitEdit} noValidate>
          <div className="circlemod-section">
            <div className="circlemod-form-grid">
              <Field label={ar ? "اسم الأصل" : "Asset name"} required>
                <input className="circlemod-input" value={editForm.name} onChange={(e) => setEditForm((c) => ({ ...c, name: e.target.value }))} required />
              </Field>
              <Field label={ar ? "الموقع" : "Location"}>
                <input className="circlemod-input" value={editForm.location} onChange={(e) => setEditForm((c) => ({ ...c, location: e.target.value }))} />
              </Field>
              <Field label={ar ? "العمر بالأشهر" : "Useful life months"}>
                <input type="number" min="1" className="circlemod-input" value={editForm.usefulLifeMonths} onChange={(e) => setEditForm((c) => ({ ...c, usefulLifeMonths: e.target.value }))} />
              </Field>
              <Field label={ar ? "الوصف" : "Description"}>
                <input className="circlemod-input" value={editForm.description} onChange={(e) => setEditForm((c) => ({ ...c, description: e.target.value }))} />
              </Field>
              <Field label={ar ? "ملاحظات" : "Notes"}>
                <input className="circlemod-input" value={editForm.notes} onChange={(e) => setEditForm((c) => ({ ...c, notes: e.target.value }))} />
              </Field>
            </div>
          </div>
        </form>
      </Modal>

      {/* مودال تأكيد التعطيل */}
      <Modal isOpen={Boolean(deactivateModal)} onClose={() => setDeactivateModal(null)} title={ar ? "تعطيل الأصل" : "Deactivate Asset"} size="sm" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setDeactivateModal(null)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button variant="danger" onClick={handleDeactivate} isLoading={deactivateM.isPending}>{ar ? "تعطيل" : "Deactivate"}</Button>
        </div>
      }>
        <p className="text-sm text-slate-600 p-2">
          {ar ? `هل تريد تعطيل الأصل "${deactivateModal?.name}"؟ تأكد من إخلاء العهدة أولاً إن وجدت.` : `Deactivate "${deactivateModal?.name}"? Make sure to release any active custody first.`}
        </p>
      </Modal>

      {/* مودال قيد الشراء */}
      <Modal isOpen={Boolean(acqModal && canAcquire)} onClose={() => setAcqModal(null)} title={ar ? "إنشاء قيد اقتناء الأصل" : "Post Asset Acquisition"} titleIcon={<div className="circlemod-head-icon"><Archive className="w-4 h-4" /></div>} size="md" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setAcqModal(null)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="acq-form" isLoading={postAcqM.isPending}>{ar ? "تأكيد" : "Confirm"}</Button>
        </div>
      }>
        <form id="acq-form" className="circlemod-form" noValidate onSubmit={async (e) => {
          e.preventDefault();
          if (!acqModal) return;
          if (rejectInvalidForm(e.currentTarget, ar)) return;
          try {
            await postAcqM.mutateAsync({ id: acqModal.id, payload: { financeAccountId: Number(acqForm.financeAccountId) } });
            notifySuccess(ar ? "تم إثبات اقتناء الأصل بنجاح" : "Asset acquisition posted successfully");
            setAcqModal(null);
            setAcqForm({ financeAccountId: "" });
          } catch (error) {
            notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر إثبات اقتناء الأصل." : "Unable to post the asset acquisition." }));
          }
        }}>
          <div className="circlemod-section">
            <div className="circlemod-section-head"><Archive size={15} className="circlemod-section-icon" /><span>{ar ? "بيانات الدفع والقيد" : "Payment & Journal"}</span></div>
            <div className="p-3 bg-slate-50 text-xs text-slate-600 rounded border border-slate-200 mb-4">
              {ar ? "سيتم إنشاء قيد محاسبي بشراء الأصل من الحساب المالي المحدد." : "An acquisition journal entry will be created using the selected finance account."}
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "الحساب المالي (للدفع)" : "Finance Account (for payment)"} *</label>
                <select className="circlemod-input" value={acqForm.financeAccountId} onChange={(e) => setAcqForm({ financeAccountId: e.target.value })} required>
                  <option value="">{ar ? "اختر الحساب المالي" : "Select finance account"}</option>
                  {(accountsQ.data ?? []).filter((a: any) => a.isActive).map((a: any) => <option key={a.id} value={a.id}>{a.name || `Account #${a.id}`}</option>)}
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* مودال الإهلاك */}
      <Modal isOpen={Boolean(depModal && canDepreciate)} onClose={() => setDepModal(null)} title={ar ? "إهلاك الأصل للشهر" : "Run Asset Depreciation"} titleIcon={<div className="circlemod-head-icon"><Archive className="w-4 h-4" /></div>} size="md" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setDepModal(null)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="dep-form" isLoading={postDepM.isPending}>{ar ? "تشغيل الإهلاك" : "Run Depreciation"}</Button>
        </div>
      }>
        <form id="dep-form" className="circlemod-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!depModal) return;
          try {
            await postDepM.mutateAsync({ id: depModal.id, payload: { periodYear: depForm.periodYear, periodMonth: depForm.periodMonth } });
            notifySuccess(ar ? "تم تسجيل إهلاك الأصل بنجاح" : "Asset depreciation posted successfully");
            setDepModal(null);
          } catch (error) {
            notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تسجيل إهلاك الأصل." : "Unable to post asset depreciation." }));
          }
        }}>
          <div className="circlemod-section">
            <div className="circlemod-section-head"><Archive size={15} className="circlemod-section-icon" /><span>{ar ? "الفترة المالية للإهلاك" : "Depreciation Fiscal Period"}</span></div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "السنة المالية" : "Fiscal Year"} *</label>
                <input type="number" className="circlemod-input" value={depForm.periodYear} onChange={(e) => setDepForm({ ...depForm, periodYear: Number(e.target.value) })} required />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "الشهر" : "Month"} *</label>
                <input type="number" min="1" max="12" className="circlemod-input" value={depForm.periodMonth} onChange={(e) => setDepForm({ ...depForm, periodMonth: Number(e.target.value) })} required />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Asset Custody Tab ────────────────────────────────────────────────────────

function AssetCustodyTab({
  ar,
  modalOpen,
  setModalOpen,
  canManage = true
}: {
  ar: boolean;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  canManage?: boolean;
}) {
  const assetsQ = useFixedAssetsQuery();
  const custodyQ = useAssetCustodyLogsQuery();
  const usersQ = useUsersQuery({ page: 1, pageSize: 500 }, true);
  const assignM = useAssignAssetCustodyMutation();
  const releaseM = useReleaseCustodyMutation();
  const updateM = useUpdateAssetCustodyMutation();
  const deleteM = useDeleteAssetCustodyMutation();
  const users = useMemo(() => {
    return (usersQ.data?.items ?? []).filter((u) => u.role !== "STUDENT" && u.role !== "PARENT");
  }, [usersQ.data?.items]);

  const [form, setForm] = useState({
    assetId: "", toUserId: "", assignedAt: today(), notes: ""
  });
  const [releaseModal, setReleaseModal] = useState<AssetCustodyLogV2 | null>(null);
  const [releaseForm, setReleaseForm] = useState({ returnedAt: today(), notes: "" });

  const [editModal, setEditModal] = useState<AssetCustodyLogV2 | null>(null);
  const [editForm, setEditForm] = useState({ toUserId: "", assignedAt: "", returnedAt: "", notes: "" });

  const [deleteModal, setDeleteModal] = useState<AssetCustodyLogV2 | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const assignableAssets = useMemo(
    () => (assetsQ.data ?? []).filter((a) => a.status === "ACTIVE" || a.status === "IN_CUSTODY"),
    [assetsQ.data]
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rejectInvalidForm(event.currentTarget, ar)) return;
    try {
      await assignM.mutateAsync({
        assetId: Number(form.assetId),
        payload: {
          toUserId: form.toUserId ? Number(form.toUserId) : undefined,
          assignedAt: new Date(form.assignedAt).toISOString(),
          notes: form.notes || undefined
        }
      });
      notifySuccess(ar ? "تم تسجيل تسليم العهدة بنجاح" : "Asset custody assigned successfully");
      setForm((c) => ({ ...c, toUserId: "", notes: "", assetId: "" }));
      setModalOpen(false);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تسجيل تسليم العهدة." : "Unable to assign asset custody." }));
    }
  };

  const submitRelease = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!releaseModal) return;
    if (rejectInvalidForm(event.currentTarget, ar)) return;
    try {
      await releaseM.mutateAsync({ custodyId: releaseModal.id, payload: { returnedAt: releaseForm.returnedAt, notes: releaseForm.notes } });
      notifySuccess(ar ? "تم إخلاء العهدة بنجاح" : "Custody released successfully");
      setReleaseModal(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر إخلاء العهدة." : "Unable to release custody." }));
    }
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editModal) return;
    if (rejectInvalidForm(event.currentTarget, ar)) return;
    try {
      await updateM.mutateAsync({
        custodyId: editModal.id,
        payload: {
          toUserId: editForm.toUserId ? Number(editForm.toUserId) : undefined,
          assignedAt: new Date(editForm.assignedAt).toISOString(),
          returnedAt: editForm.returnedAt ? new Date(editForm.returnedAt).toISOString() : null,
          notes: editForm.notes
        }
      });
      notifySuccess(ar ? "تم تعديل العهدة بنجاح" : "Custody updated successfully");
      setEditModal(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تعديل العهدة." : "Unable to update custody." }));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteM.mutateAsync(deleteModal.id);
      notifySuccess(ar ? "تم حذف العهدة بنجاح" : "Custody deleted successfully");
      setDeleteModal(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر حذف العهدة." : "Unable to delete custody." }));
    }
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
  const pagination = useClientPagination(filtered, { initialPageSize: 10, resetKey: searchTerm });

  return (
    <div className="space-y-4">
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content p-0">
          <div className="ctr-controls mb-4">
            <div className="ctr-search-wrap">
              <ClipboardList className="ctr-search-icon" size={18} />
              <input className="ctr-search-input" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={ar ? "بحث في العهد..." : "Search custody..."} />
            </div>
          </div>

          {custodyQ.isError ? (
            <ErrorState className="m-4" title={ar ? "فشل تحميل العهد" : "Failed to load custody logs"} description={getLocalizedApiErrorMessage(custodyQ.error, { ar, fallback: ar ? "تعذر تحميل سجل العهد." : "Unable to load custody logs." })} onRetry={() => void custodyQ.refetch()} />
          ) : (
            <FinanceDataTable
              className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
              columns={[
                { id: "asset", header: ar ? "الأصل" : "Asset", cell: (row: AssetCustodyLogV2) => row.asset ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{row.asset.assetCode}</span>
                    <span className="text-[10px] text-slate-400">{row.asset.name}</span>
                  </div>
                ) : "-" },
                { id: "to", header: ar ? "الموظف المستلم" : "Recipient", cell: (row: AssetCustodyLogV2) => row.toUser ? <Badge variant="info" size="sm">{row.toUser.fullName}</Badge> : "-" },
                { id: "center", header: ar ? "المركز" : "Center", cell: (row: AssetCustodyLogV2) => <span className="text-slate-500">{row.center?.name ?? (ar ? "على مستوى الجمعية" : "Organization level")}</span> },
                { id: "assigned", header: ar ? "تاريخ التسليم" : "Assigned", cell: (row: AssetCustodyLogV2) => <span className="font-medium">{displayDate(row.assignedAt)}</span> },
                { id: "returned", header: ar ? "تاريخ الإرجاع" : "Returned", cell: (row: AssetCustodyLogV2) => row.returnedAt
                  ? <Badge variant="success" size="sm">{displayDate(row.returnedAt)}</Badge>
                  : <span className="text-slate-300 italic text-[10px]">{ar ? "لم يتم" : "Not yet"}</span>
                },
                { id: "custodyStatus", header: ar ? "الحالة" : "Status", align: "center", cell: (row: AssetCustodyLogV2) => (
                  <span className={`fin-status-pill ${row.returnedAt ? "fin-status--success" : "fin-status--info"}`}>
                    {row.returnedAt ? (ar ? "مرجعة" : "Returned") : (ar ? "نشطة" : "Active")}
                  </span>
                )},
                { id: "notes", header: ar ? "ملاحظات" : "Notes", cell: (row: AssetCustodyLogV2) => <span className="text-xs text-slate-400 italic line-clamp-1 max-w-[120px]">{row.notes ?? "-"}</span> },
                ...(canManage ? [{
                  id: "actions", header: ar ? "إجراءات" : "Actions", align: "center" as const,
                  cell: (row: AssetCustodyLogV2) => (
                    <div className="flex items-center justify-center gap-1">
                      {!row.returnedAt ? (
                        <button type="button" className="fin-action-btn approve" title={ar ? "إخلاء" : "Release"} onClick={() => { setReleaseForm({ returnedAt: today(), notes: "" }); setReleaseModal(row); }}>
                          <XCircle size={16} />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs w-[28px] text-center" title={ar ? "مُخلاة" : "Released"}>—</span>
                      )}
                      <button type="button" className="fin-action-btn view" title={ar ? "تعديل" : "Edit"} onClick={() => {
                        setEditForm({
                          toUserId: row.toUserId ? String(row.toUserId) : "",
                          assignedAt: row.assignedAt.split("T")[0],
                          returnedAt: row.returnedAt ? row.returnedAt.split("T")[0] : "",
                          notes: row.notes || ""
                        });
                        setEditModal(row);
                      }}>
                        <Edit2 size={16} />
                      </button>
                      <button type="button" className="fin-action-btn delete" title={ar ? "حذف" : "Delete"} onClick={() => setDeleteModal(row)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                }] : [])
              ]}
              rows={pagination.pagedRows}
              rowKey="id"
              density="dense"
            />
          )}
        </div>
      </div>
      <FinanceTableFooter ar={ar} pageSize={pagination.pageSize} setPageSize={pagination.setPageSize} currentPage={pagination.currentPage} setPage={pagination.setCurrentPage} totalFilteredCount={pagination.totalItems} pages={pagination.totalPages} />

      {/* مودال تسليم عهدة */}
      <Modal isOpen={Boolean(modalOpen && canManage)} onClose={() => setModalOpen(false)} title={ar ? "تسجيل تسليم عهدة" : "Assign Custody"} titleIcon={<div className="circlemod-head-icon"><ClipboardList className="w-4 h-4" /></div>} size="md" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="custody-form" isLoading={assignM.isPending}>{ar ? "حفظ" : "Save"}</Button>
        </div>
      }>
        <form id="custody-form" className="circlemod-form" onSubmit={submit} noValidate>
          <div className="circlemod-section">
            <div className="circlemod-form-grid">
              <Field label={ar ? "الأصل" : "Asset"} required>
                <select className="circlemod-input" value={form.assetId} onChange={(e) => setForm((c) => ({ ...c, assetId: e.target.value }))} required>
                  <option value="">{ar ? "اختر الأصل" : "Select asset"}</option>
                  {assignableAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.assetCode} - {asset.name}</option>)}
                </select>
              </Field>
              <Field label={ar ? "العهدة/الموظف" : "Custodian"} required>
                <select className="circlemod-input" value={form.toUserId} onChange={(e) => setForm((c) => ({ ...c, toUserId: e.target.value }))} required>
                  <option value="">{ar ? "اختر الموظف" : "Select custodian"}</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </Field>
              <Field label={ar ? "المركز" : "Center"}>
                <div className="circlemod-input bg-slate-50 text-slate-500 cursor-not-allowed flex items-center h-[38px] px-3">
                  {(() => {
                    if (!form.assetId) return ar ? "-" : "-";
                    const asset = assignableAssets.find((a) => a.id === Number(form.assetId));
                    if (!asset) return ar ? "-" : "-";
                    if (!asset.center) return ar ? "على مستوى الجمعية" : "Organization level";
                    return asset.center.name;
                  })()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {ar ? "يتم تحديد المركز تلقائيًا من بيانات الأصل." : "Center is automatically determined from the asset."}
                </div>
              </Field>
              <Field label={ar ? "تاريخ التسليم" : "Assigned at"} required>
                <input type="date" className="circlemod-input" value={form.assignedAt} onChange={(e) => setForm((c) => ({ ...c, assignedAt: e.target.value }))} required />
              </Field>
              <Field label={ar ? "ملاحظات" : "Notes"}>
                <input className="circlemod-input" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
              </Field>
            </div>
          </div>
        </form>
      </Modal>

      {/* مودال إخلاء العهدة */}
      <Modal isOpen={Boolean(releaseModal && canManage)} onClose={() => setReleaseModal(null)} title={ar ? "إخلاء العهدة" : "Release Custody"} titleIcon={<div className="circlemod-head-icon"><XCircle className="w-4 h-4" /></div>} size="sm" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setReleaseModal(null)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="release-form" isLoading={releaseM.isPending}>{ar ? "تأكيد الإخلاء" : "Confirm release"}</Button>
        </div>
      }>
        <form id="release-form" className="circlemod-form" onSubmit={submitRelease} noValidate>
          <div className="circlemod-section">
            {releaseModal && (
              <div className="p-3 bg-slate-50 text-xs text-slate-600 rounded border border-slate-200 mb-4">
                {ar ? `إخلاء عهدة الأصل: ` : `Releasing custody for: `}
                <strong>{releaseModal.asset?.name ?? "-"}</strong>
                {releaseModal.toUser && <> {ar ? "من" : "from"} <strong>{releaseModal.toUser.fullName}</strong></>}
              </div>
            )}
            <div className="circlemod-form-grid">
              <Field label={ar ? "تاريخ الإرجاع" : "Return date"} required>
                <input type="date" className="circlemod-input" value={releaseForm.returnedAt} onChange={(e) => setReleaseForm((c) => ({ ...c, returnedAt: e.target.value }))} required />
              </Field>
              <Field label={ar ? "ملاحظات" : "Notes"}>
                <input className="circlemod-input" value={releaseForm.notes} onChange={(e) => setReleaseForm((c) => ({ ...c, notes: e.target.value }))} />
              </Field>
            </div>
          </div>
        </form>
      </Modal>

      {/* مودال تعديل عهدة */}
      <Modal isOpen={Boolean(editModal && canManage)} onClose={() => setEditModal(null)} title={ar ? "تعديل العهدة" : "Edit Custody"} titleIcon={<div className="circlemod-head-icon"><Edit2 className="w-4 h-4" /></div>} size="md" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setEditModal(null)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" form="edit-custody-form" isLoading={updateM.isPending}>{ar ? "حفظ التعديلات" : "Save Changes"}</Button>
        </div>
      }>
        <form id="edit-custody-form" className="circlemod-form" onSubmit={submitEdit} noValidate>
          <div className="circlemod-section">
            <div className="circlemod-form-grid">
              <Field label={ar ? "العهدة/الموظف" : "Custodian"} required>
                <select className="circlemod-input" value={editForm.toUserId} onChange={(e) => setEditForm((c) => ({ ...c, toUserId: e.target.value }))} required>
                  <option value="">{ar ? "اختر الموظف" : "Select custodian"}</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </Field>
              <Field label={ar ? "تاريخ التسليم" : "Assigned at"} required>
                <input type="date" className="circlemod-input" value={editForm.assignedAt} onChange={(e) => setEditForm((c) => ({ ...c, assignedAt: e.target.value }))} required />
              </Field>
              <Field label={ar ? "تاريخ الإرجاع" : "Return date"}>
                <input type="date" className="circlemod-input" value={editForm.returnedAt} onChange={(e) => setEditForm((c) => ({ ...c, returnedAt: e.target.value }))} />
              </Field>
              <Field label={ar ? "ملاحظات" : "Notes"}>
                <input className="circlemod-input" value={editForm.notes} onChange={(e) => setEditForm((c) => ({ ...c, notes: e.target.value }))} />
              </Field>
            </div>
          </div>
        </form>
      </Modal>

      {/* مودال حذف عهدة */}
      <Modal isOpen={Boolean(deleteModal && canManage)} onClose={() => setDeleteModal(null)} title={ar ? "حذف عهدة" : "Delete Custody"} titleIcon={<div className="circlemod-head-icon"><Trash2 className="w-4 h-4 text-red-500" /></div>} size="sm" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setDeleteModal(null)} type="button">{ar ? "إلغاء" : "Cancel"}</Button>
          <Button variant="danger" onClick={handleDelete} isLoading={deleteM.isPending}>{ar ? "حذف" : "Delete"}</Button>
        </div>
      }>
        <p className="text-sm text-slate-600 p-2">
          {ar ? `هل أنت متأكد من حذف هذه العهدة؟` : `Are you sure you want to delete this custody log?`}
        </p>
      </Modal>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function Field({ label, required, tooltip, children }: { label: string; required?: boolean; tooltip?: string; children: ReactNode }) {
  return (
    <div className="circlemod-field">
      <label className="flex items-center gap-1">
        <span>{label}{required ? " *" : ""}</span>
        {tooltip && <span title={tooltip}><Info size={14} className="text-slate-400 cursor-help" /></span>}
      </label>
      {children}
    </div>
  );
}


