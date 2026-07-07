import { useState, Suspense } from "react";
import { 
  FileText, 
  Users, 
  Tag, 
  RefreshCw, 
  Plus, 
  Wallet,
  TrendingDown,
  UserCheck,
  Search,
  Check,
  UserMinus,
  XCircle
} from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { LoadingState } from "../../components/ui/LoadingState";
import { FinanceExpensesTab } from "./FinanceExpensesTab";
import { FinanceSuppliersTab } from "./FinanceSuppliersTab";
import { FinanceExpenseCategoriesTab } from "./FinanceExpenseCategoriesTab";
import { 
  FinancePageShell, 
  FinancePageHeader,
  FinanceMoney
} from "../../features/finance-v2/design";
import { Button } from "../../components/ui/Button";
import { motion } from "framer-motion";
import { 
  useExpenseInvoicesQuery, 
  useSuppliersQuery, 
  useExpenseCategoriesQuery 
} from "../../features/finance-v2/finance-v2.hooks";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";

type ExpenseTab = "expenses" | "suppliers" | "categories";

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

export default function FinanceExpensesPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canPrepareExpenses =
    user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTANT" || user?.role === "FINANCE_MANAGER";
  const canApproveExpenses = user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const canPayExpenses = user?.role === "SUPER_ADMIN" || user?.role === "TREASURER";
  const canManageExpenseCategories =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const [activeTab, setActiveTab] = useState<ExpenseTab>("expenses");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpenseInvoiceModal, setShowExpenseInvoiceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    setStatusFilter("ALL");
  }, [activeTab]);

  const invoicesQ = useExpenseInvoicesQuery({});
  const suppliersQ = useSuppliersQuery();
  const categoriesQ = useExpenseCategoriesQuery();

  const invoices = invoicesQ.data ?? [];
  const suppliers = suppliersQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const renderKpis = () => {
    if (activeTab === "expenses") {
      const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const paid = invoices.filter((i: any) => i.status === 'PAID').reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const unpaid = total - paid;
      return (
        <>
          <VouchersKpi icon={TrendingDown} cls="brand" val={<FinanceMoney amount={total} baseCurrency="YER" />} label={ar ? "إجمالي المصروفات" : "Total Expenses"} />
          <VouchersKpi icon={Check} cls="success" val={<FinanceMoney amount={paid} baseCurrency="YER" />} label={ar ? "المصروفات المدفوعة" : "Paid Expenses"} />
          <VouchersKpi icon={FileText} cls="amber" val={<FinanceMoney amount={unpaid} baseCurrency="YER" />} label={ar ? "المصروفات المتبقية" : "Unpaid Expenses"} />
        </>
      );
    }
    if (activeTab === "suppliers") {
      const total = suppliers.length;
      const active = suppliers.filter((s: any) => s.isActive !== false).length;
      const inactive = total - active;
      return (
        <>
          <VouchersKpi icon={Users} cls="brand" val={total.toLocaleString()} label={ar ? "إجمالي الموردين" : "Total Suppliers"} />
          <VouchersKpi icon={UserCheck} cls="success" val={active.toLocaleString()} label={ar ? "الموردين النشطين" : "Active Suppliers"} />
          <VouchersKpi icon={UserMinus} cls="rose" val={inactive.toLocaleString()} label={ar ? "الغير نشطين" : "Inactive Suppliers"} />
        </>
      );
    }
    if (activeTab === "categories") {
      const total = categories.length;
      const active = categories.filter((c: any) => c.isActive !== false).length;
      const inactive = total - active;
      return (
        <>
          <VouchersKpi icon={Tag} cls="brand" val={total.toLocaleString()} label={ar ? "إجمالي التصنيفات" : "Total Categories"} />
          <VouchersKpi icon={Check} cls="success" val={active.toLocaleString()} label={ar ? "التصنيفات النشطة" : "Active Categories"} />
          <VouchersKpi icon={XCircle} cls="rose" val={inactive.toLocaleString()} label={ar ? "الغير نشطة" : "Inactive Categories"} />
        </>
      );
    }
    return null;
  };

  const getSearchPlaceholder = () => {
    if (activeTab === "expenses") return ar ? "بحث في فواتير المصروفات..." : "Search expense invoices...";
    if (activeTab === "suppliers") return ar ? "بحث في الموردين..." : "Search suppliers...";
    return ar ? "بحث في التصنيفات..." : "Search categories...";
  };

  const refreshAll = () => {
    void invoicesQ.refetch();
    void suppliersQ.refetch();
    void categoriesQ.refetch();
  };

  const tabs: { id: ExpenseTab; label: string; icon: React.ElementType }[] = [
    { id: "expenses",    label: ar ? "فواتير المصروفات" : "Expense Invoices", icon: FileText },
    { id: "suppliers",  label: ar ? "الموردون"   : "Suppliers",   icon: Users },
    { id: "categories", label: ar ? "التصنيفات"  : "Categories",  icon: Tag },
  ];

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir="rtl"
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "المصروفات والموردون" : "Expenses & Suppliers"}
            subtitle={ar ? "إدارة فواتير المصروفات، الموردين، وتصنيفات الإنفاق" : "Manage expense invoices, suppliers, and spending categories"}
            icon={<Wallet className="h-6 w-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="glass-btn"
                  onClick={refreshAll}
                  leftIcon={<RefreshCw className={`h-4 w-4 ${invoicesQ.isFetching ? "animate-spin" : ""}`} />}
                >
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                {activeTab === "suppliers" && canPrepareExpenses && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="shadow-lg shadow-brand-500/20" 
                    onClick={() => setShowSupplierModal(true)} 
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {ar ? "مورد جديد" : "New Supplier"}
                  </Button>
                )}
                {activeTab === "categories" && canManageExpenseCategories && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="shadow-lg shadow-brand-500/20" 
                    onClick={() => setShowCategoryModal(true)} 
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {ar ? "تصنيف جديد" : "New Category"}
                  </Button>
                )}
                {activeTab === "expenses" && canPrepareExpenses && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="shadow-lg shadow-brand-500/20" 
                    onClick={() => setShowExpenseInvoiceModal(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {ar ? "فاتورة جديدة" : "New Invoice"}
                  </Button>
                )}
              </div>
            }
          />
          <nav className="exams-tabs-bar mt-6" aria-label={ar ? "تبويبات المصروفات" : "Expense tabs"}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`exams-tab-btn ${activeTab === tab.id ? "exams-tab-btn--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          {renderKpis()}
        </div>
      }
      toolbar={
        <div className="ctr-controls">
          <div className="ctr-search-wrap" style={{ flex: 1, minWidth: "350px", maxWidth: "600px" }}>
            <Search className="ctr-search-icon" size={18} />
            <input
              className="ctr-search-input"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={getSearchPlaceholder()}
            />
          </div>
          <select
            className="ctr-search-input"
            style={{ width: "200px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{ar ? "جميع الحالات" : "All Statuses"}</option>
            {activeTab === "expenses" && (
              <>
                <option value="DRAFT">{ar ? "مسودة" : "Draft"}</option>
                <option value="PENDING_APPROVAL">{ar ? "بانتظار الاعتماد" : "Pending Approval"}</option>
                <option value="APPROVED">{ar ? "معتمد" : "Approved"}</option>
                <option value="PARTIALLY_PAID">{ar ? "مدفوع جزئياً" : "Partially Paid"}</option>
                <option value="PAID">{ar ? "مدفوع" : "Paid"}</option>
                <option value="CANCELLED">{ar ? "ملغي" : "Cancelled"}</option>
              </>
            )}
            {(activeTab === "suppliers" || activeTab === "categories") && (
              <>
                <option value="ACTIVE">{ar ? "نشط" : "Active"}</option>
                <option value="INACTIVE">{ar ? "غير نشط" : "Inactive"}</option>
              </>
            )}
          </select>
          <div className="hidden">
            {ar ? "عرض وإدارة سجلات الإنفاق والموردين" : "View and manage spending logs and suppliers"}
          </div>
        </div>
      }
    >
      <div className="mt-2 animate-premium">
        <Suspense fallback={<LoadingState />}>
          {activeTab === "expenses"    && (
            <FinanceExpensesTab
              ar={ar}
              canCreate={canPrepareExpenses}
              canApprove={canApproveExpenses}
              canPay={canPayExpenses}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              externalShowForm={canPrepareExpenses && showExpenseInvoiceModal}
              onExternalFormClose={() => setShowExpenseInvoiceModal(false)}
            />
          )}
          {activeTab === "suppliers"   && (
            <FinanceSuppliersTab 
              ar={ar} 
              canManage={canPrepareExpenses}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              externalShowForm={canPrepareExpenses && showSupplierModal}
              onExternalFormClose={() => setShowSupplierModal(false)} 
            />
          )}
          {activeTab === "categories"  && (
            <FinanceExpenseCategoriesTab 
              ar={ar} 
              canManage={canManageExpenseCategories}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              externalShowForm={canManageExpenseCategories && showCategoryModal}
              onExternalFormClose={() => setShowCategoryModal(false)} 
            />
          )}
        </Suspense>
      </div>
    </FinancePageShell>
  );
}
