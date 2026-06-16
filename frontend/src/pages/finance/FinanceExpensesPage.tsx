import { useState, Suspense, useMemo } from "react";
import { 
  FileText, 
  Users, 
  Tag, 
  RefreshCw, 
  Plus, 
  Wallet,
  TrendingDown,
  UserCheck,
  Search
} from "lucide-react";
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
  const canManageExpenses =
    user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTANT" || user?.role === "FINANCE_MANAGER";
  const [activeTab, setActiveTab] = useState<ExpenseTab>("expenses");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpenseInvoiceModal, setShowExpenseInvoiceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const invoicesQ = useExpenseInvoicesQuery({});
  const suppliersQ = useSuppliersQuery();
  const categoriesQ = useExpenseCategoriesQuery();

  const totalExpenses = useMemo(() => {
    return (invoicesQ.data ?? []).reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [invoicesQ.data]);

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
                {activeTab === "suppliers" && canManageExpenses && (
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
                {activeTab === "categories" && canManageExpenses && (
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
                {activeTab === "expenses" && canManageExpenses && (
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
          <VouchersKpi 
            icon={TrendingDown} 
            cls="rose" 
            val={<FinanceMoney amount={totalExpenses} baseCurrency="YER" />} 
            label={ar ? "إجمالي المصروفات" : "Total Expenses"} 
          />
          <VouchersKpi 
            icon={UserCheck} 
            cls="brand" 
            val={(suppliersQ.data ?? []).length.toLocaleString()} 
            label={ar ? "عدد الموردين" : "Total Suppliers"} 
          />
          <VouchersKpi 
            icon={Tag} 
            cls="amber" 
            val={(categoriesQ.data ?? []).length.toLocaleString()} 
            label={ar ? "تصنيفات النشاط" : "Expense Categories"} 
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
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={ar ? "بحث في المصروفات أو الموردين أو التصنيفات..." : "Search expenses, suppliers, or categories..."}
            />
            <div className="hidden">
              {ar ? "عرض وإدارة سجلات الإنفاق والموردين" : "View and manage spending logs and suppliers"}
            </div>
          </div>
        </div>
      }
    >
      <div className="mt-6 animate-premium">
        <Suspense fallback={<LoadingState />}>
          {activeTab === "expenses"    && (
            <FinanceExpensesTab
              ar={ar}
              canManage={canManageExpenses}
              searchTerm={searchTerm}
              externalShowForm={canManageExpenses && showExpenseInvoiceModal}
              onExternalFormClose={() => setShowExpenseInvoiceModal(false)}
            />
          )}
          {activeTab === "suppliers"   && (
            <FinanceSuppliersTab 
              ar={ar} 
              canManage={canManageExpenses}
              searchTerm={searchTerm}
              externalShowForm={canManageExpenses && showSupplierModal}
              onExternalFormClose={() => setShowSupplierModal(false)} 
            />
          )}
          {activeTab === "categories"  && (
            <FinanceExpenseCategoriesTab 
              ar={ar} 
              canManage={canManageExpenses}
              searchTerm={searchTerm}
              externalShowForm={canManageExpenses && showCategoryModal}
              onExternalFormClose={() => setShowCategoryModal(false)} 
            />
          )}
        </Suspense>
      </div>
    </FinancePageShell>
  );
}
