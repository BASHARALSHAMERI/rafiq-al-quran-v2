import { useEffect, useMemo, useState } from "react";
import { Landmark, Wallet, ArrowRightLeft, History, AlertCircle, DollarSign, StickyNote } from "lucide-react";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import {
  entityFeedback,
  notifyError,
  notifyRequiredFields,
  notifySuccess,
  type LocalizedLabel
} from "../../../../shared/ui/feedback";
import {
  useCreateFinanceV2FundTransferMutation,
  useSubmitFinanceV2FundTransferMutation,
  useApproveFinanceV2FundTransferMutation,
  usePostFinanceV2FundTransferMutation,
  useRejectFinanceV2FundTransferMutation,
  useFinanceV2AccountsQuery,
  useFinanceV2ReportCashflowQuery,
  useUpdateFinanceV2AccountLedgerMutation,
  useFinanceV2FundTransfersQuery
} from "../../finance-v2.hooks";
import { useAccountingAccountsQuery } from "../../../../pages/accounting/accounting.hooks";
import { posInt, shortDate, FinancePaginationFooter } from "../FinanceShared";
import { FinanceMoney, FinanceStatusBadge } from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import { Button } from "../../../../components/ui/Button";
import useClientPagination from "../../../../shared/ui/useClientPagination";

type Props = {
  centerId: number | undefined;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canEditLedgerAccount?: boolean;
  ar: boolean;
  activeTab: "accounts" | "transfers" | "movements";
  externalShowTransfer?: boolean;
  onExternalTransferClose?: () => void;
};

const TRANSFER_ENTITY: LocalizedLabel = { ar: "التحويل", en: "transfer" };

export default function FinanceTreasuryTab({ 
  centerId, 
  isAdmin, 
  canEditLedgerAccount = isAdmin,
  ar,
  activeTab,
  externalShowTransfer,
  onExternalTransferClose 
}: Props) {
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    notes: ""
  });
  const [treasuryError, setTreasuryError] = useState("");

  useEffect(() => {
    if (externalShowTransfer) {
      setShowTransferForm(true);
    }
  }, [externalShowTransfer]);

  const accountsQ = useFinanceV2AccountsQuery(centerId);

  const movementTypeMap: Record<string, string> = useMemo(() => ({
    ORG_FUNDING: ar ? "تمويل مؤسسة" : "Org Funding",
    CENTER_FUNDING: ar ? "تمويل مركز" : "Center Funding",
    REWARD_PAYMENT: ar ? "صرف مكافآت" : "Reward Payment",
    REWARD_PAYOUT: ar ? "صرف مكافآت" : "Reward Payout",
    PAYROLL_DISBURSEMENT: ar ? "صرف رواتب" : "Payroll",
    PAYROLL_PAYOUT: ar ? "صرف رواتب" : "Payroll Payout",
    EXPENSE_PAYMENT: ar ? "سداد مصروفات" : "Expense Payment",
    SUPPLIER_PAYMENT: ar ? "سداد مورد" : "Supplier Payment",
    RECEIPT_VOUCHER: ar ? "سند قبض" : "Receipt Voucher",
    PAYMENT_COLLECTION: ar ? "تحصيل رسوم" : "Payment Collection",
    VOUCHER_DISBURSEMENT: ar ? "سند صرف" : "Voucher Disbursement",
    ASSET_PURCHASE: ar ? "شراء أصل" : "Asset Purchase",
    CASH_MOVEMENT: ar ? "حركة نقدية" : "Cash Movement",
    FUND_TRANSFER: ar ? "تحويل صناديق" : "Fund Transfer",
    FUND_TRANSFER_OUT: ar ? "تحويل صادر" : "Fund Transfer Out",
    FUND_TRANSFER_IN: ar ? "تحويل وارد" : "Fund Transfer In",
    DEDUCTION_RECOVERY: ar ? "استرداد استقطاع" : "Deduction Recovery",
    VOID_REVERSAL: ar ? "إلغاء حركة" : "Void Reversal",
    LEGACY_BACKFILL: ar ? "تسوية سابقة" : "Legacy Backfill",
    OTHER: ar ? "أخرى" : "Other"
  }), [ar]);

  const accountTypeMap: Record<string, string> = useMemo(() => ({
    ORG_FUND: ar ? "صندوق المؤسسة" : "Org Fund",
    CENTER_FUND: ar ? "صندوق المركز" : "Center Fund",
    BANK: ar ? "حساب بنكي" : "Bank"
  }), [ar]);

  const accounts = useMemo(() => accountsQ.data ?? [], [accountsQ.data]);
  const accountsPagination = useClientPagination(accounts, { initialPageSize: 10 });
  
  const transfersQ = useFinanceV2FundTransfersQuery(centerId);
  const transfers = useMemo(() => transfersQ.data?.rows ?? [], [transfersQ.data?.rows]);
  const transfersPagination = useClientPagination(transfers, { initialPageSize: 10 });

  const accountingAccountsQ = useAccountingAccountsQuery(canEditLedgerAccount);
  const assetAccounts = useMemo(() => {
    const accounts = accountingAccountsQ.data ?? [];
    const parentIds = new Set(accounts.map((account) => account.parentId).filter((id): id is number => Boolean(id)));
    return accounts.filter((account) => account.type === "ASSET" && account.isActive && !parentIds.has(account.id) && /^(1110|1120|1130)/.test(account.code));
  }, [accountingAccountsQ.data]);

  const cashflowQ = useFinanceV2ReportCashflowQuery(centerId);
  const cashflow = useMemo(() => cashflowQ.data, [cashflowQ.data]);
  const movements = useMemo(() => cashflow?.rows ?? [], [cashflow]);
  const movementsPagination = useClientPagination(movements, { initialPageSize: 10 });

  const createTransferM = useCreateFinanceV2FundTransferMutation();
  const submitTransferM = useSubmitFinanceV2FundTransferMutation();
  const approveTransferM = useApproveFinanceV2FundTransferMutation();
  const postTransferM = usePostFinanceV2FundTransferMutation();

  const updateLedgerM = useUpdateFinanceV2AccountLedgerMutation();
  const isTransferPending = createTransferM.isPending || submitTransferM.isPending || approveTransferM.isPending || postTransferM.isPending;

  const handleUpdateLedgerAccount = async (accountId: number, accountingAccountId: number) => {
    try {
      await updateLedgerM.mutateAsync({ accountId, accountingAccountId });
      notifySuccess(ar ? "تم تحديث حساب الأستاذ المرتبط" : "Ledger account updated");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تحديث حساب الأستاذ" : "Failed to update ledger account" }));
    }
  };

  const closeTransferModal = () => {
    if (isTransferPending) return;
    setShowTransferForm(false);
    setTreasuryError("");
    onExternalTransferClose?.();
  };

  const handleCreateTransfer = async (actionType: "DRAFT" | "SUBMIT" | "POST") => {
    setTreasuryError("");

    try {
      let fromId = posInt(transferForm.fromAccountId);
      let toId = posInt(transferForm.toAccountId);



      const amount = Number(transferForm.amount);
      const invalidFieldId = !fromId ? "tr-from" : !toId ? "tr-to" : !Number.isFinite(amount) || amount <= 0 ? "tr-amount" : null;
      if (invalidFieldId) {
        const message = ar ? "يرجى إكمال الحقول المطلوبة." : "Please complete the required fields.";
        setTreasuryError(message);
        notifyRequiredFields(ar);
        requestAnimationFrame(() => document.getElementById(invalidFieldId)?.focus());
        return;
      }
      const validFromId = fromId as number;
      const validToId = toId as number;

      const created = await createTransferM.mutateAsync({
        fromAccountId: validFromId,
        toAccountId: validToId,
        amount,
        notes: transferForm.notes.trim() || undefined
      });

      if (actionType === "DRAFT") {
        notifySuccess(ar ? "تم حفظ طلب التحويل كمسودة، ولم يتم تحريك الرصيد بعد." : "Transfer saved as draft, balance is not affected.");
      } else {
        try {
          await submitTransferM.mutateAsync({ transferId: created.id });
          
          if (actionType === "SUBMIT") {
             notifySuccess(ar ? "تم إرسال طلب التحويل للاعتماد، ولم يتم تحريك الرصيد بعد." : "Transfer submitted for approval, balance is not affected.");
          } else if (actionType === "POST") {
            await approveTransferM.mutateAsync({ transferId: created.id });
            await postTransferM.mutateAsync({ transferId: created.id });
            notifySuccess(ar ? "تم ترحيل التحويل بنجاح وتحديث أرصدة الصناديق." : "Transfer posted successfully and balances updated.");
          }
        } catch (execError: any) {
          const fallback = actionType === "POST" 
            ? (ar ? "تعذر ترحيل التحويل، ولم يتم تغيير الأرصدة." : "Failed to post transfer, balances not changed.")
            : (ar ? "تعذر إكمال العملية" : "Operation failed");
            
          const execMessage = getLocalizedApiErrorMessage(execError, { ar, fallback });
          setTreasuryError(execMessage);
          notifyError(execMessage);
        }
      }

      setTransferForm({ fromAccountId: "", toAccountId: "", amount: "", notes: "" });
      closeTransferModal();
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, { ar, fallback: entityFeedback.error(ar, "create", TRANSFER_ENTITY) });
      setTreasuryError(message);
      notifyError(message);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-premium mt-4">

      <Modal
        isOpen={Boolean(showTransferForm && isAdmin)}
        onClose={closeTransferModal}
        title={ar ? "تحويل بين الصناديق" : "Fund Transfer"}
        titleIcon={
          <div className="circlemod-head-icon">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <Button variant="secondary" onClick={closeTransferModal} disabled={isTransferPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => handleCreateTransfer("DRAFT")} isLoading={isTransferPending}>
                {ar ? "حفظ كمسودة" : "Save Draft"}
              </Button>
              <Button type="button" onClick={() => handleCreateTransfer("SUBMIT")} isLoading={isTransferPending}>
                {ar ? "إرسال للاعتماد" : "Submit"}
              </Button>
              {canEditLedgerAccount && (
                <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleCreateTransfer("POST")} isLoading={isTransferPending}>
                  {ar ? "تنفيذ وترحيل الآن" : "Execute & Post"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <form id="finance-transfer-form" className="circlemod-form">
          {/* Section 1: Accounts */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Landmark size={15} className="circlemod-section-icon" />
              <span>{ar ? "الحسابات" : "Accounts"}</span>
            </div>
              <div className="circlemod-row">
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="tr-from">{ar ? "من حساب *" : "From Account *"}</label>
                  <select
                    id="tr-from"
                    className="circlemod-select"
                    value={transferForm.fromAccountId}
                    onChange={(e) => setTransferForm(p => ({ ...p, fromAccountId: e.target.value }))}
                    required
                  >
                    <option value="">{ar ? "من حساب..." : "From account..."}</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>#{acc.id} — {acc.name || accountTypeMap[acc.accountType] || acc.accountType}</option>
                    ))}
                  </select>
                </div>
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="tr-to">{ar ? "إلى حساب *" : "To Account *"}</label>
                  <select
                    id="tr-to"
                    className="circlemod-select"
                    value={transferForm.toAccountId}
                    onChange={(e) => setTransferForm(p => ({ ...p, toAccountId: e.target.value }))}
                    required
                  >
                    <option value="">{ar ? "إلى حساب..." : "To account..."}</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>#{acc.id} — {acc.name || accountTypeMap[acc.accountType] || acc.accountType}</option>
                    ))}
                  </select>
                </div>
              </div>
          </div>

          {/* Section 2: Amount */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <DollarSign size={15} className="circlemod-section-icon" />
              <span>{ar ? "المبلغ" : "Amount"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="tr-amount">{ar ? "مبلغ التحويل *" : "Transfer Amount *"}</label>
                <input
                  id="tr-amount"
                  className="circlemod-input"
                  type="number"
                  min={1}
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder={ar ? "المبلغ" : "Amount"}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <StickyNote size={15} className="circlemod-section-icon" />
              <span>{ar ? "ملاحظات" : "Notes"}</span>
              <span className="circlemod-section-hint">{ar ? "اختياري" : "Optional"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="tr-notes">{ar ? "ملاحظات إضافية" : "Additional Notes"}</label>
                <input
                  id="tr-notes"
                  className="circlemod-input"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder={ar ? "ملاحظات اختيارية" : "Optional notes"}
                />
              </div>
            </div>
          </div>

          {treasuryError ? (
            <div className="circlemod-error" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{treasuryError}</span>
            </div>
          ) : null}
        </form>
      </Modal>

      {!accountsQ.isLoading && accounts.length > 0 && activeTab === "accounts" ? (
        <div className="animate-premium mt-4">
          <FinanceDataTable<any>
            rows={accountsPagination.pagedRows}
                columns={[
                  {
                    header: ar ? "الصندوق / الحساب" : "Account / Fund",
                    render: (acc) => (
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.accountType === 'CENTER_FUND' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {acc.accountType === 'CENTER_FUND' ? <Wallet size={20} /> : <Landmark size={20} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-text-primary">{acc.name || (acc.center?.name ?? (ar ? "صندوق الجمعية" : "Org Fund"))}</span>
                          <span className="text-[0.7rem] text-text-tertiary uppercase tracking-wider">{acc.accountType}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    header: ar ? "المركز" : "Center",
                    render: (acc) => <span className="text-sm font-medium text-text-secondary">{acc.center?.name || "-"}</span>
                  },
                  {
                    header: ar ? "حساب الأستاذ" : "Ledger Account",
                    render: (acc) => canEditLedgerAccount && !acc.accountingAccountId ? (
                      <select
                        className="circlemod-select min-w-[220px]"
                        value={acc.accountingAccountId ?? ""}
                        disabled={updateLedgerM.isPending || accountingAccountsQ.isLoading}
                        onChange={(event) => {
                          const nextId = posInt(event.target.value);
                          if (nextId) void handleUpdateLedgerAccount(acc.id, nextId);
                        }}
                        aria-label={ar ? "حساب الأستاذ المرتبط" : "Linked ledger account"}
                      >
                        <option value="">{ar ? "اختر حساب نقدي/بنكي..." : "Select cash/bank account..."}</option>
                        {assetAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-text-secondary">
                        {acc.accountingAccount ? `${acc.accountingAccount.code} - ${acc.accountingAccount.name}` : "-"}
                      </span>
                    )
                  },
                  {
                    header: ar ? "الرصيد الحالي" : "Current Balance",
                    render: (acc) => <FinanceMoney amount={acc.currentBalance || acc.balance || 0} baseCurrency="YER" className="!text-lg !font-extrabold" />
                  },
                  {
                    header: ar ? "آخر نشاط" : "Last Activity",
                    render: (acc) => <span className="text-xs text-text-tertiary">{acc.updatedAt ? shortDate(acc.updatedAt, ar) : "-"}</span>
                  },
                  {
                    header: ar ? "الإجراءات" : "Actions",
                    render: (acc) => (
                      <div className="flex items-center gap-2">
                        <button 
                          className={`fin-action-btn view group ${selectedAccountId === acc.id ? '!bg-brand-50 !text-brand-600' : ''}`} 
                          onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)}
                          title={ar ? "سجل الحركات" : "Transaction History"}
                        >
                          <History size={16} />
                        </button>
                      </div>
                    )
                  }
                ]}
                rowKey="id"
                className="fin-premium-table"
              />
              <FinancePaginationFooter
                ar={ar}
                pageSize={accountsPagination.pageSize}
                setPageSize={accountsPagination.setPageSize}
                currentPage={accountsPagination.currentPage}
                setPage={accountsPagination.setCurrentPage}
                totalFilteredCount={accountsPagination.totalItems}
                pages={accountsPagination.totalPages}
              />
        </div>
      ) : null}

      {activeTab === "transfers" && (
        <div className="animate-premium mt-4">
          <FinanceDataTable<any>
            rows={transfersPagination.pagedRows}
            columns={[
              { header: ar ? "التاريخ" : "Date", render: (tr) => <span className="text-xs text-text-tertiary">{shortDate(tr.createdAt, ar)}</span> },
              { header: ar ? "من حساب" : "From", render: (tr) => <span className="font-bold text-text-primary">{tr.fromAccount?.name || accountTypeMap[tr.fromAccount?.accountType] || tr.fromAccount?.accountType}</span> },
              { header: ar ? "إلى حساب" : "To", render: (tr) => <span className="font-bold text-text-primary">{tr.toAccount?.name || accountTypeMap[tr.toAccount?.accountType] || tr.toAccount?.accountType}</span> },
              { header: ar ? "المبلغ" : "Amount", render: (tr) => <FinanceMoney amount={tr.amount} baseCurrency="YER" className="!font-bold text-brand-600" /> },
              { header: ar ? "المنفذ" : "Requested By", render: (tr) => <span className="text-sm">{tr.requestedBy?.fullName}</span> },
              { header: ar ? "الحالة" : "Status", render: (tr) => <FinanceStatusBadge status={tr.status} /> },
              { header: ar ? "ملاحظات" : "Notes", render: (tr) => <span className="text-xs text-text-tertiary">{tr.notes || "-"}</span> }
            ]}
            rowKey="id"
            className="fin-premium-table"
            emptyState={
              <div className="p-8 text-center text-text-tertiary">
                <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{ar ? "لا توجد تحويلات مسجلة" : "No transfers recorded"}</p>
              </div>
            }
          />
          <FinancePaginationFooter
            ar={ar}
            pageSize={transfersPagination.pageSize}
            setPageSize={transfersPagination.setPageSize}
            currentPage={transfersPagination.currentPage}
            setPage={transfersPagination.setCurrentPage}
            totalFilteredCount={transfersPagination.totalItems}
            pages={transfersPagination.totalPages}
          />
        </div>
      )}

      {activeTab === "movements" && (
        <div className="animate-premium mt-4">
          <FinanceDataTable<any>
            rows={movementsPagination.pagedRows}
            columns={[
              { header: ar ? "التاريخ" : "Date", render: (row) => <span className="text-xs text-text-tertiary font-medium">{shortDate(row.postedAt, ar)}</span> },
              { header: ar ? "الحساب/الصندوق" : "Account", render: (row) => <span className="font-bold text-brand-600">#{row.accountId}</span> },
              { header: ar ? "نوع الحركة" : "Type", render: (row) => <span className="text-xs">{movementTypeMap[row.movementType] || row.movementType}</span> },
              { header: ar ? "الاتجاه" : "Direction", render: (row) => <span className={`fin-status-pill ${row.direction === 'IN' ? 'fin-status--success' : 'fin-status--error'}`}>{row.direction === 'IN' ? (ar ? 'وارد' : 'IN') : (ar ? 'منصرف' : 'OUT')}</span> },
              { header: ar ? "المبلغ" : "Amount", render: (row) => <FinanceMoney amount={row.amount} baseCurrency="YER" className={row.direction === 'IN' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'} /> },
              { header: ar ? "الرصيد" : "Balance", render: (row) => <FinanceMoney amount={row.balanceAfter} baseCurrency="YER" className="font-bold" /> }
            ]}
            rowKey={(_, idx) => `cf-${idx}`}
            className="fin-premium-table"
            emptyState={
              <div className="p-8 text-center text-text-tertiary">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{ar ? "لا توجد حركات مسجلة" : "No movements recorded"}</p>
              </div>
            }
          />
          <FinancePaginationFooter
            ar={ar}
            pageSize={movementsPagination.pageSize}
            setPageSize={movementsPagination.setPageSize}
            currentPage={movementsPagination.currentPage}
            setPage={movementsPagination.setCurrentPage}
            totalFilteredCount={movementsPagination.totalItems}
            pages={movementsPagination.totalPages}
          />
        </div>
      )}

      <Modal
        isOpen={selectedAccountId !== null}
        onClose={() => setSelectedAccountId(null)}
        title={ar ? "سجل حركات الصندوق" : "Fund Transaction History"}
        titleIcon={
          <div className="circlemod-head-icon">
            <History className="w-4 h-4" />
          </div>
        }
        size="xl"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body !p-0"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setSelectedAccountId(null)}>
              {ar ? "إغلاق" : "Close"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col">
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Landmark className="w-4 h-4 text-brand-600" />
              {accounts.find(a => a.id === selectedAccountId)?.name || (accounts.find(a => a.id === selectedAccountId)?.accountType)}
            </h3>
            <div className="text-left rtl:text-right">
              <span className="text-xs text-text-tertiary block mb-1">{ar ? "الرصيد الحالي" : "Current Balance"}</span>
              <FinanceMoney 
                amount={accounts.find(a => a.id === selectedAccountId)?.currentBalance || accounts.find(a => a.id === selectedAccountId)?.balance || 0} 
                baseCurrency="YER" 
                className="font-bold text-brand-600" 
              />
            </div>
          </div>
          <div className="p-0">
            <FinanceDataTable<any>
              rows={cashflow?.rows?.filter((r: any) => r.accountId === selectedAccountId) || []}
              columns={[
                {
                  header: ar ? "التاريخ" : "Date",
                  render: (row) => <span className="text-xs text-text-tertiary font-medium">{shortDate(row.postedAt, ar)}</span>
                },
                {
                  header: ar ? "سند قيد" : "Voucher",
                  render: (row) => <span className="font-bold text-brand-600">#{row.voucherId}</span>
                },
                {
                  header: ar ? "الاتجاه" : "Type",
                  render: (row) => (
                    <span className={`fin-status-pill ${row.direction === 'IN' ? 'fin-status--success' : 'fin-status--error'}`}>
                      {row.direction === 'IN' ? (ar ? 'وارد' : 'IN') : (ar ? 'منصرف' : 'OUT')}
                    </span>
                  )
                },
                {
                  header: ar ? "المبلغ" : "Amount",
                  render: (row) => <FinanceMoney amount={row.amount} baseCurrency="YER" className={row.direction === 'IN' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'} />
                },
                {
                  header: ar ? "الرصيد" : "Balance",
                  render: (row) => <FinanceMoney amount={row.balanceAfter} baseCurrency="YER" className="font-bold" />
                }
              ]}
              rowKey={(_, idx) => `cf-${idx}`}
              className="fin-premium-table"
              emptyState={
                <div className="p-8 text-center text-text-tertiary">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{ar ? "لا توجد حركات مسجلة لهذا الصندوق" : "No transactions recorded for this fund"}</p>
                </div>
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
