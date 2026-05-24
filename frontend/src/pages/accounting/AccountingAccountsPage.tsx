import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronLeft, 
  FileText, 
  FolderOpen, 
  Table2,
  FolderClosed,
  Search,
  Expand,
  Shrink,
  Filter,
  Plus,
  Pencil,
  AlertCircle,
  Printer,
  RefreshCw
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useAuthStore } from "../../features/auth/auth.store";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifySuccess } from "../../shared/ui/feedback";
import {
  FinancePageShell,
  FinancePageHeader,
  FinanceEmptyState,
  FinanceMoney
} from "../../features/finance-v2/design";
import {
  AccountTypeBadge,
  ClassificationBadge,
  accountTypeLabels,
  accountingLinks
} from "./AccountingShared";
import {
  useAccountingAccountsQuery,
  useAccountingTrialBalanceQuery,
  useCreateAccountingAccountMutation,
  useUpdateAccountingAccountMutation
} from "./accounting.hooks";
import { printAccountingDocument } from "../../features/accounting/printAccounting";
import type { AccountingAccount, AccountingAccountType } from "./accounting.api";
import { NavLink } from "react-router-dom";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";

type AccountFormState = {
  code: string;
  type: AccountingAccountType;
  name: string;
  parentId: string;
};

const emptyAccountForm: AccountFormState = {
  code: "",
  type: "ASSET",
  name: "",
  parentId: ""
};

const nextChildCode = (parent: AccountingAccount, accounts: AccountingAccount[]) => {
  const childCodes = accounts
    .filter((account) => account.parentId === parent.id && account.code.startsWith(parent.code))
    .map((account) => Number(account.code.slice(parent.code.length)))
    .filter((value) => Number.isFinite(value));
  const next = childCodes.length > 0 ? Math.max(...childCodes) + 1 : 1;
  return `${parent.code}${String(next).padStart(2, "0")}`;
};

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

export default function AccountingAccountsPage() {
  const user = useAuthStore((state) => state.user);
  const canManageAccounts = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN";
  const accountsQ = useAccountingAccountsQuery();
  const trialBalanceQ = useAccountingTrialBalanceQuery();

  const allAccounts = accountsQ.data ?? [];
  const trialBalance = trialBalanceQ.data?.rows ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<AccountingAccountType | "all">("all");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>(emptyAccountForm);
  const [accountError, setAccountError] = useState("");

  const createAccountM = useCreateAccountingAccountMutation();
  const updateAccountM = useUpdateAccountingAccountMutation();
  const isSavingAccount = createAccountM.isPending || updateAccountM.isPending;

  const balancesMap = useMemo(() => {
    const map = new Map<number, number>();
    trialBalance.forEach((row) => map.set(row.account.id, row.balance));
    return map;
  }, [trialBalance]);

  const fullTree = useMemo(() => {
    const map = new Map<number, any>();
    allAccounts.forEach((acc) => {
      map.set(acc.id, { 
        ...acc, 
        children: [], 
        balance: balancesMap.get(acc.id) || 0 
      });
    });
    
    const roots: any[] = [];
    allAccounts.forEach((acc) => {
      const node = map.get(acc.id);
      if (acc.parentId && map.has(acc.parentId)) {
        map.get(acc.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const processNode = (node: any): number => {
      const hasChildren = node.children.length > 0;
      node.isMain = hasChildren;
      if (hasChildren) {
        const childrenSum = node.children.reduce((sum: number, child: any) => sum + processNode(child), 0);
        node.balance = childrenSum; 
        return childrenSum;
      } else {
        return node.balance;
      }
    };

    roots.forEach(processNode);
    return roots;
  }, [allAccounts, balancesMap]);

  const filteredTree = useMemo(() => {
    const filterNodes = (nodes: any[]): any[] => {
      return nodes.reduce((acc: any[], node) => {
        const matchesSearch = !searchTerm || 
          node.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
          node.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = selectedType === 'all' || node.type === selectedType;

        const filteredChildren = filterNodes(node.children);

        if ((matchesSearch && matchesType) || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }

        return acc;
      }, []);
    };

    return filterNodes(fullTree);
  }, [fullTree, searchTerm, selectedType]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => {
    const allParentIds: number[] = [];
    const collect = (nodes: any[]) => {
      nodes.forEach(n => {
        if (n.children.length > 0) {
          allParentIds.push(n.id);
          collect(n.children);
        }
      });
    };
    collect(filteredTree);
    setExpandedIds(new Set(allParentIds));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm(emptyAccountForm);
    setAccountError("");
    setAccountModalOpen(true);
  };

  const openEditAccount = (account: AccountingAccount) => {
    setEditingAccount(account);
    setAccountForm({
      code: account.code,
      type: account.type,
      name: account.name,
      parentId: account.parentId ? String(account.parentId) : ""
    });
    setAccountError("");
    setAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    if (isSavingAccount) return;
    setAccountModalOpen(false);
    setEditingAccount(null);
    setAccountError("");
  };

  const handleParentChange = (parentId: string) => {
    const parent = allAccounts.find((account) => String(account.id) === parentId);
    setAccountForm((previous) => ({
      ...previous,
      parentId,
      code: parent && !editingAccount ? nextChildCode(parent, allAccounts) : previous.code
    }));
  };

  const handleSaveAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setAccountError("");
    try {
      if (editingAccount) {
        await updateAccountM.mutateAsync({
          accountId: editingAccount.id,
          payload: {
            code: accountForm.code.trim(),
            type: accountForm.type,
            name: accountForm.name.trim(),
            parentId: Number(accountForm.parentId) > 0 ? Number(accountForm.parentId) : undefined
          }
        });
        notifySuccess("تم تعديل الحساب بنجاح");
      } else {
        await createAccountM.mutateAsync({
          code: accountForm.code.trim(),
          type: accountForm.type,
          name: accountForm.name.trim(),
          parentId: Number(accountForm.parentId) > 0 ? Number(accountForm.parentId) : undefined
        });
        notifySuccess("تم إضافة الحساب المحاسبي بنجاح");
      }
      setAccountModalOpen(false);
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar: true,
        fallback: error instanceof Error ? error.message : "تعذر حفظ الحساب"
      });
      setAccountError(message);
      notifyError(message);
    }
  };

  const stats = useMemo(() => {
    return {
      total: allAccounts.length,
      assets: allAccounts.filter((a) => a.type === "ASSET").length,
      liabilities: allAccounts.filter((a) => a.type === "LIABILITY").length,
      revenue: allAccounts.filter((a) => a.type === "REVENUE").length,
      expenses: allAccounts.filter((a) => a.type === "EXPENSE").length
    };
  }, [allAccounts]);

  const handlePrint = () => {
    printAccountingDocument({
      title: "دليل الحسابات المحاسبية",
      subtitle: "شجرة الحسابات والتصنيفات",
      rows: fullTree,
      summaryHtml: `
        <strong>الأصول:</strong> ${stats.assets}
        &nbsp; | &nbsp;
        <strong>الخصوم:</strong> ${stats.liabilities}
        &nbsp; | &nbsp;
        <strong>الإيرادات:</strong> ${stats.revenue}
        &nbsp; | &nbsp;
        <strong>المصروفات:</strong> ${stats.expenses}
      `,
      columns: [
        { label: "رقم الحساب", render: (row: any) => row.code, align: "left" },
        { label: "الاسم", render: (row: any) => row.name },
        { label: "النوع", render: (row: any) => accountTypeLabels[row.type as AccountingAccountType], align: "center" },
        { label: "التصنيف", render: (row: any) => (row.children?.length ? "رئيسي" : "فرعي"), align: "center" }
      ]
    });
  };

  const loading = accountsQ.isLoading || trialBalanceQ.isLoading;

  const renderTree = (nodes: any[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedIds.has(node.id) || searchTerm !== "";
      const hasChildren = node.children && node.children.length > 0;
      
      return (
        <div key={node.id} className="accounting-tree-group">
          <motion.div 
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`accounting-tree__row ${hasChildren ? 'accounting-tree__row--parent cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'accounting-tree__row--leaf'}`}
            onClick={() => { 
              if (hasChildren) {
                toggleExpand(node.id);
              } else if (canManageAccounts && !node.systemKey) {
                openEditAccount(node);
              }
            }}
          >
            <div className="accounting-tree__col accounting-tree__col--code">
              <div 
                className="accounting-tree__indent-wrapper"
                style={{ paddingInlineStart: `${level * 20}px` }}
              >
                {hasChildren ? (
                  <button 
                    type="button"
                    className="accounting-tree__toggle"
                    onClick={() => toggleExpand(node.id)}
                    aria-label={isExpanded ? "طي" : "توسيع"}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
                  </button>
                ) : (
                  <div className="accounting-tree__spacer" />
                )}
                <span className="accounting-tree__code-text font-mono font-bold text-slate-700">{node.code}</span>
              </div>
            </div>
            
            <div className="accounting-tree__col accounting-tree__col--name">
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  isExpanded ? <FolderOpen size={16} className="text-amber-500 flex-shrink-0" /> : <FolderClosed size={16} className="text-amber-500 flex-shrink-0" />
                ) : (
                  <FileText size={14} className="text-slate-400 flex-shrink-0" />
                )}
                <span className="font-medium">{node.name}</span>
                {node.systemKey && (
                  <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">
                    نظامي
                  </span>
                )}
              </div>
            </div>
            
            <div className="accounting-tree__col accounting-tree__col--type">
              <AccountTypeBadge type={node.type} />
            </div>
            
            <div className="accounting-tree__col accounting-tree__col--classification">
              <ClassificationBadge isMain={hasChildren} />
            </div>

            <div className="accounting-tree__col accounting-tree__col--balance">
              <div className="flex flex-col items-end">
                <span className={`font-bold ${node.balance > 0 ? "text-emerald-600" : node.balance < 0 ? "text-rose-600" : "text-slate-400"}`}>
                  <FinanceMoney amount={Math.abs(node.balance)} baseCurrency="YER" />
                </span>
                {!hasChildren && (
                  <NavLink 
                    to={`/accounting/journal?accountId=${node.id}`} 
                    className="text-[10px] text-brand-500 hover:underline flex items-center gap-1 mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText size={10} />
                    <span>عرض القيود</span>
                  </NavLink>
                )}
              </div>
            </div>
            
            <div className="accounting-tree__col accounting-tree__col--actions">
              <div className="flex items-center gap-2">
                {canManageAccounts && !node.systemKey && (
                  <button 
                    type="button" 
                    className="fin-action-btn view"
                    title="تعديل الحساب"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditAccount(node);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                )}
                
                {canManageAccounts ? (
                  <button
                    type="button"
                    className="fin-action-btn approve"
                    title="إضافة حساب فرعي"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAccount(null);
                      setAccountForm({
                        ...emptyAccountForm,
                        type: node.type,
                        parentId: String(node.id),
                        code: nextChildCode(node, allAccounts)
                      });
                      setAccountError("");
                      setAccountModalOpen(true);
                    }}
                  >
                    <Plus size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
          
          <AnimatePresence initial={false}>
            {isExpanded && hasChildren && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="accounting-tree-children overflow-hidden"
              >
                {renderTree(node.children, level + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir="rtl"
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title="شجرة الحسابات"
            subtitle="عرض الدليل المحاسبي والهيكل الهرمي للحسابات والأرصدة التجميعية"
            icon={<Table2 className="w-6 h-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />} 
                  onClick={() => { accountsQ.refetch(); trialBalanceQ.refetch(); }}
                >
                  تحديث
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<Printer className="w-4 h-4" />} 
                  onClick={handlePrint}
                >
                  طباعة التقرير
                </Button>
                {canManageAccounts ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={openCreateAccount}
                  >
                    إضافة حساب
                  </Button>
                ) : null}
              </div>
            }
          />
          <nav className="exams-tabs-bar mt-6" aria-label="روابط المحاسبة">
            {accountingLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={item.to} 
                  to={item.to} 
                  className={({ isActive }) => 
                    `exams-tab-btn ${isActive ? "exams-tab-btn--active" : ""}`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          <VouchersKpi icon={Table2} cls="brand" val={stats.total} label="إجمالي الحسابات" />
          <VouchersKpi icon={FileText} cls="amber" val={stats.assets} label="الأصول" />
          <VouchersKpi icon={FileText} cls="emerald" val={stats.revenue} label="الإيرادات" />
          <VouchersKpi icon={FileText} cls="violet" val={stats.expenses} label="المصروفات" />
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
              placeholder="بحث بالكود أو الاسم..." 
            />
          </div>
          <div className="ctr-filters-group">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border-none shadow-sm">
              <Filter size={16} className="text-slate-400 ms-2" />
              <select 
                className="ctr-filter-select border-none bg-transparent h-8 min-w-[140px] focus:ring-0 outline-none"
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value as any)}
              >
                <option value="all">كل الأنواع</option>
                {Object.entries(accountTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-1 items-center ms-2">
              <button
                type="button"
                className="accounting-preview__button accounting-preview__button--icon"
                onClick={expandAll}
                title="توسيع الكل"
              >
                <Expand className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="accounting-preview__button accounting-preview__button--icon"
                onClick={collapseAll}
                title="طي الكل"
              >
                <Shrink className="w-4 h-4" />
              </button>
            </div>
            
            {(searchTerm || selectedType !== "all") && (
              <button 
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline px-2"
                onClick={() => { setSearchTerm(""); setSelectedType("all"); }}
              >
                تصفير
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content" style={{ padding: 0 }}>
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
              <span className="text-slate-500 font-medium">جاري جلب الحسابات...</span>
            </div>
          ) : allAccounts.length === 0 ? (
            <FinanceEmptyState
              variant={searchTerm || selectedType !== "all" ? "filtered" : "first-time"}
              title={searchTerm || selectedType !== "all" ? "لا توجد نتائج" : "لا توجد حسابات محاسبية"}
              description={searchTerm || selectedType !== "all" ? "جرب تعديل البحث أو الفلتر" : "ابدأ ببناء شجرة الحسابات"}
              action={searchTerm || selectedType !== "all" ? (
                <Button variant="secondary" onClick={() => { setSearchTerm(""); setSelectedType("all"); }}>
                  مسح الفلاتر
                </Button>
              ) : canManageAccounts ? (
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateAccount}>
                  إضافة حساب
                </Button>
              ) : null}
            />
          ) : (
            <div className="accounting-tree">
              <div className="accounting-tree__row accounting-tree__row--header bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <div className="accounting-tree__col accounting-tree__col--code font-bold text-slate-500 uppercase text-[11px] tracking-wider">رقم الحساب</div>
                <div className="accounting-tree__col accounting-tree__col--name font-bold text-slate-500 uppercase text-[11px] tracking-wider">اسم الحساب</div>
                <div className="accounting-tree__col accounting-tree__col--type font-bold text-slate-500 uppercase text-[11px] tracking-wider">النوع</div>
                <div className="accounting-tree__col accounting-tree__col--classification font-bold text-slate-500 uppercase text-[11px] tracking-wider">التصنيف</div>
                <div className="accounting-tree__col accounting-tree__col--balance font-bold text-slate-500 uppercase text-[11px] tracking-wider text-end">الرصيد</div>
                <div className="accounting-tree__col accounting-tree__col--actions font-bold text-slate-500 uppercase text-[11px] tracking-wider">إجراءات</div>
              </div>
              
              <div className="accounting-tree__body">
                <AnimatePresence initial={false}>
                  {renderTree(filteredTree)}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(accountModalOpen && canManageAccounts)}
        onClose={closeAccountModal}
        title={editingAccount ? "تعديل حساب" : "إضافة حساب"}
        titleIcon={
          <div className="circlemod-head-icon">
            <FolderOpen className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="ghost" onClick={closeAccountModal} disabled={isSavingAccount}>
              إلغاء
            </Button>
            <Button type="submit" form="accounting-account-form" isLoading={isSavingAccount}>
              حفظ
            </Button>
          </div>
        }
      >
        <form id="accounting-account-form" className="circlemod-form" onSubmit={handleSaveAccount}>
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Table2 size={15} className="circlemod-section-icon" />
              <span>بيانات الحساب المحاسبي</span>
            </div>

            <div className="circlemod-form-grid">
              <div className="circlemod-field">
                <label>رقم الحساب *</label>
                <input 
                  className="circlemod-input" 
                  value={accountForm.code} 
                  onChange={(event) => setAccountForm((previous) => ({ ...previous, code: event.target.value }))} 
                  required 
                />
              </div>

              <div className="circlemod-field">
                <label>نوع الحساب *</label>
                <select 
                  className="circlemod-select" 
                  value={accountForm.type} 
                  onChange={(event) => setAccountForm((previous) => ({ ...previous, type: event.target.value as AccountingAccountType, parentId: "" }))} 
                  required
                >
                  {Object.entries(accountTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="circlemod-field col-span-2">
                <label>اسم الحساب *</label>
                <input 
                  className="circlemod-input" 
                  value={accountForm.name} 
                  onChange={(event) => setAccountForm((previous) => ({ ...previous, name: event.target.value }))} 
                  required 
                />
              </div>

              <div className="circlemod-field col-span-2">
                <label>الحساب الأب</label>
                <select 
                  className="circlemod-select" 
                  value={accountForm.parentId} 
                  onChange={(event) => handleParentChange(event.target.value)}
                >
                  <option value="">بدون حساب أب (حساب رئيسي)</option>
                  {allAccounts
                    .filter((account) => account.id !== editingAccount?.id && account.type === accountForm.type)
                    .map((account) => (
                      <option key={account.id} value={account.id}>{account.code} - {account.name}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>
          
          {accountError ? (
            <div className="circlemod-error mt-4">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{accountError}</span>
            </div>
          ) : null}
        </form>
      </Modal>
    </FinancePageShell>
  );
}
