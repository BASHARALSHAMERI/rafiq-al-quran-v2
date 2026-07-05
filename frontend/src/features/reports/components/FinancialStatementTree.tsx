import { useState, type ReactNode } from "react";
import { AlertCircle, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import { DataTable, type DataTableColumn } from "../../../components/ui/DataTable";
import { useI18n } from "../../../app/i18n";

export type FinancialStatementItem = {
  accountId: number;
  code: string;
  name: string;
  balance: number;
};

export type FinancialStatementData = {
  assets: {
    current: FinancialStatementItem[];
    fixed: FinancialStatementItem[];
    totalCurrent: number;
    totalFixed: number;
    totalAssets: number;
  };
  liabilities: {
    rows: FinancialStatementItem[];
    totalLiabilities: number;
  };
  netAssets: {
    unrestricted: FinancialStatementItem[];
    restricted: FinancialStatementItem[];
    totalUnrestricted: number;
    totalRestricted: number;
    totalNetAssets: number;
  };
  isBalanced: boolean;
};

export type FinancialStatementTreeProps = {
  data: FinancialStatementData;
  isLoading?: boolean;
  error?: Error | null;
  search?: string;
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

const amountCell = (val: number) => {
  const isNeg = val < 0;
  return (
    <span
      className="font-bold tabular-nums"
      style={{ direction: "ltr", display: "inline-block", color: isNeg ? "#C62828" : "#1A1A2E" }}
    >{formatCurrency(val)}</span>
  );
};

const sharedColumns = (ar: boolean): DataTableColumn<FinancialStatementItem>[] => [
  {
    id: "code",
    header: ar ? "الكود" : "Code",
    width: "20%",
    align: "center",
    cell: (r) => <span className="font-mono text-xs" style={{ color: "#78909C" }}>{r.code}</span>,
  },
  {
    id: "name",
    header: ar ? "الحساب" : "Account",
    cell: (r) => <span className="font-semibold" style={{ color: "#1A1A2E" }}>{r.name}</span>,
  },
  {
    id: "balance",
    header: ar ? "المبلغ" : "Amount",
    width: "30%",
    align: "end",
    headerClassName: "text-center",
    cell: (r) => amountCell(r.balance),
  },
];

function SectionBlock({ title, total, bgColor, headerBg, children }: { title: string; total: string; bgColor: string; headerBg: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: bgColor, borderColor: headerBg }}>
      <div className="flex justify-between items-center px-5 py-3" style={{ background: headerBg }}>
        <h3 className="text-base font-extrabold" style={{ color: "#1A1A2E" }}>{title}</h3>
        <span className="text-base font-extrabold tabular-nums" style={{ color: "#1A1A2E", direction: "ltr" }}>{total}</span>
      </div>
      {children}
    </div>
  );
}

function SubTable({ items, subtitle, subtotal, ar }: { items: FinancialStatementItem[]; subtitle: string; subtotal: string; ar: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-center px-5 py-2" style={{ background: "rgba(255,255,255,0.7)" }}>
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#546E7A" }}>{subtitle}</h4>
        <span className="text-xs font-bold tabular-nums" style={{ color: "#1A1A2E", direction: "ltr" }}>{subtotal}</span>
      </div>
      <div className="px-2 py-1">
        <DataTable
          columns={sharedColumns(ar)}
          rows={items}
          rowKey={(_, i) => i}
          dense
          emptyState={null}
        />
      </div>
    </div>
  );
}

function MobileCard({ title, total, bgColor, headerBg, children, defaultOpen }: { title: string; total: string; bgColor: string; headerBg: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-2xl shadow-sm border overflow-hidden lg:hidden" style={{ background: bgColor, borderColor: headerBg }}>
      <button onClick={() => setOpen((p) => !p)} className="flex justify-between items-center w-full px-5 py-3 text-start" style={{ background: headerBg }}>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-extrabold" style={{ color: "#1A1A2E" }}>{title}</h3>
          {open ? <ChevronUp size={16} style={{ color: "#1A1A2E" }} /> : <ChevronDown size={16} style={{ color: "#1A1A2E" }} />}
        </div>
        <span className="text-base font-extrabold tabular-nums" style={{ color: "#1A1A2E", direction: "ltr" }}>{total}</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export function FinancialStatementTree({ data, isLoading, error, search }: FinancialStatementTreeProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  const sq = (search ?? "").trim().toLowerCase();
  const matches = (item: FinancialStatementItem) =>
    !sq || item.name.toLowerCase().includes(sq) || item.code.toLowerCase().includes(sq);

  const filtered = sq ? {
    assets: {
      current: data.assets.current.filter(matches),
      fixed: data.assets.fixed.filter(matches),
      totalCurrent: data.assets.current.filter(matches).reduce((s, i) => s + i.balance, 0),
      totalFixed: data.assets.fixed.filter(matches).reduce((s, i) => s + i.balance, 0),
      totalAssets: data.assets.current.filter(matches).reduce((s, i) => s + i.balance, 0) + data.assets.fixed.filter(matches).reduce((s, i) => s + i.balance, 0),
    },
    liabilities: {
      rows: data.liabilities.rows.filter(matches),
      totalLiabilities: data.liabilities.rows.filter(matches).reduce((s, i) => s + i.balance, 0),
    },
    netAssets: {
      unrestricted: data.netAssets.unrestricted.filter(matches),
      restricted: data.netAssets.restricted.filter(matches),
      totalUnrestricted: data.netAssets.unrestricted.filter(matches).reduce((s, i) => s + i.balance, 0),
      totalRestricted: data.netAssets.restricted.filter(matches).reduce((s, i) => s + i.balance, 0),
      totalNetAssets: data.netAssets.unrestricted.filter(matches).reduce((s, i) => s + i.balance, 0) + data.netAssets.restricted.filter(matches).reduce((s, i) => s + i.balance, 0),
    },
    isBalanced: data.isBalanced,
  } : data;

  const d = filtered;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-center border border-red-200 dark:border-red-800">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-700 dark:text-red-300 font-semibold">{ar ? "تعذر تحميل التقرير" : "Failed to load report"}</p>
        <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-8 text-center border border-amber-200 dark:border-amber-800">
        <p className="text-amber-700 dark:text-amber-300 font-semibold">
          {ar ? "هذا التقرير يحتاج ربطًا كاملاً بالقيود اليومية (journal_entry_lines) لضمان الدقة المحاسبية." : "This report requires full integration with journal entry lines for accounting accuracy."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-1">
      {sq && (
        <div className="text-sm mb-4 px-4" style={{ color: "#78909C" }}>
          {ar
            ? `نتائج البحث "${sq}": ${d.assets.current.length + d.assets.fixed.length + d.liabilities.rows.length + d.netAssets.unrestricted.length + d.netAssets.restricted.length} عنصر`
            : `Search results for "${sq}": ${d.assets.current.length + d.assets.fixed.length + d.liabilities.rows.length + d.netAssets.unrestricted.length + d.netAssets.restricted.length} items`
          }
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 px-4">
        {d.isBalanced ? (
          <Badge variant="success" className="px-3 py-1 flex gap-1 items-center">
            <ShieldCheck size={14} />
            {ar ? "الميزانية متوازنة" : "Balanced"}
          </Badge>
        ) : (
          <Badge variant="error" className="px-3 py-1 flex gap-1 items-center">
            <AlertCircle size={14} />
            {ar ? "الميزانية غير متوازنة" : "Unbalanced"}
          </Badge>
        )}
      </div>

      {/* ───────── Desktop: side by side ───────── */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-5 px-4">
        {/* ASSETS — Green */}
        <SectionBlock title={ar ? "الأصول" : "Assets"} total={formatCurrency(d.assets.totalAssets)} bgColor="#E8F5E9" headerBg="#C8E6C9">
          {d.assets.current.length > 0 && (
            <SubTable items={d.assets.current} subtitle={ar ? "الأصول المتداولة" : "Current Assets"} subtotal={formatCurrency(d.assets.totalCurrent)} ar={ar} />
          )}
          {d.assets.fixed.length > 0 && (
            <SubTable items={d.assets.fixed} subtitle={ar ? "الأصول الثابتة" : "Fixed Assets"} subtotal={formatCurrency(d.assets.totalFixed)} ar={ar} />
          )}
          {d.assets.current.length === 0 && d.assets.fixed.length === 0 && (
            <div className="px-5 py-6 text-center"><p className="text-sm italic" style={{ color: "#78909C" }}>{ar ? "لا توجد أصول مسجلة" : "No assets recorded"}</p></div>
          )}
        </SectionBlock>

        {/* LIABILITIES + NET ASSETS — Red + Blue */}
        <div className="space-y-5">
          {/* LIABILITIES — Red */}
          <SectionBlock title={ar ? "الخصوم" : "Liabilities"} total={formatCurrency(d.liabilities.totalLiabilities)} bgColor="#FFEBEE" headerBg="#FFCDD2">
            {d.liabilities.rows.length > 0 ? (
              <SubTable items={d.liabilities.rows} subtitle={ar ? "الخصوم" : "Liabilities"} subtotal={formatCurrency(d.liabilities.totalLiabilities)} ar={ar} />
            ) : (
              <div className="px-5 py-6 text-center"><p className="text-sm italic" style={{ color: "#78909C" }}>{ar ? "لا توجد خصوم مسجلة" : "No liabilities recorded"}</p></div>
            )}
          </SectionBlock>

          {/* NET ASSETS — Blue */}
          <SectionBlock title={ar ? "صافي الأصول" : "Net Assets"} total={formatCurrency(d.netAssets.totalNetAssets)} bgColor="#E3F2FD" headerBg="#BBDEFB">
            {d.netAssets.unrestricted.length > 0 && (
              <SubTable items={d.netAssets.unrestricted} subtitle={ar ? "غير مقيدة" : "Unrestricted"} subtotal={formatCurrency(d.netAssets.totalUnrestricted)} ar={ar} />
            )}
            {d.netAssets.restricted.length > 0 && (
              <SubTable items={d.netAssets.restricted} subtitle={ar ? "مقيدة" : "Restricted"} subtotal={formatCurrency(d.netAssets.totalRestricted)} ar={ar} />
            )}
            {d.netAssets.unrestricted.length === 0 && d.netAssets.restricted.length === 0 && (
              <div className="px-5 py-6 text-center"><p className="text-sm italic" style={{ color: "#78909C" }}>{ar ? "لا توجد صافي أصول مسجلة" : "No net assets recorded"}</p></div>
            )}
          </SectionBlock>

          <div className="rounded-2xl p-5 border" style={{ background: "#E8F5E9", borderColor: "#C8E6C9" }}>
            <div className="flex justify-between items-center">
              <span className="text-base font-bold" style={{ color: "#1A1A2E" }}>
                {ar ? "إجمالي الخصوم وصافي الأصول" : "Total Liabilities & Net Assets"}
              </span>
              <span className="text-xl font-black tabular-nums" style={{ color: "#2E7D32", direction: "ltr" }}>
                {formatCurrency(d.liabilities.totalLiabilities + d.netAssets.totalNetAssets)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── Mobile: accordion cards ───────── */}
      <div className="flex flex-col gap-3 lg:hidden px-4">
        <MobileCard title={ar ? "الأصول" : "Assets"} total={formatCurrency(d.assets.totalAssets)} bgColor="#E8F5E9" headerBg="#C8E6C9" defaultOpen>
          {d.assets.current.length > 0 && (
            <SubTable items={d.assets.current} subtitle={ar ? "الأصول المتداولة" : "Current Assets"} subtotal={formatCurrency(d.assets.totalCurrent)} ar={ar} />
          )}
          {d.assets.fixed.length > 0 && (
            <SubTable items={d.assets.fixed} subtitle={ar ? "الأصول الثابتة" : "Fixed Assets"} subtotal={formatCurrency(d.assets.totalFixed)} ar={ar} />
          )}
          {d.assets.current.length === 0 && d.assets.fixed.length === 0 && (
            <div className="px-5 py-6 text-center"><p className="text-sm italic" style={{ color: "#78909C" }}>{ar ? "لا توجد أصول مسجلة" : "No assets recorded"}</p></div>
          )}
        </MobileCard>

        <MobileCard title={ar ? "الخصوم" : "Liabilities"} total={formatCurrency(d.liabilities.totalLiabilities)} bgColor="#FFEBEE" headerBg="#FFCDD2">
          {d.liabilities.rows.length > 0 ? (
            <SubTable items={d.liabilities.rows} subtitle={ar ? "الخصوم" : "Liabilities"} subtotal={formatCurrency(d.liabilities.totalLiabilities)} ar={ar} />
          ) : (
            <div className="px-5 py-6 text-center"><p className="text-sm italic" style={{ color: "#78909C" }}>{ar ? "لا توجد خصوم مسجلة" : "No liabilities recorded"}</p></div>
          )}
        </MobileCard>

        <MobileCard title={ar ? "صافي الأصول" : "Net Assets"} total={formatCurrency(d.netAssets.totalNetAssets)} bgColor="#E3F2FD" headerBg="#BBDEFB">
          {d.netAssets.unrestricted.length > 0 && (
            <SubTable items={d.netAssets.unrestricted} subtitle={ar ? "غير مقيدة" : "Unrestricted"} subtotal={formatCurrency(d.netAssets.totalUnrestricted)} ar={ar} />
          )}
          {d.netAssets.restricted.length > 0 && (
            <SubTable items={d.netAssets.restricted} subtitle={ar ? "مقيدة" : "Restricted"} subtotal={formatCurrency(d.netAssets.totalRestricted)} ar={ar} />
          )}
          {d.netAssets.unrestricted.length === 0 && d.netAssets.restricted.length === 0 && (
            <div className="px-5 py-6 text-center"><p className="text-sm italic" style={{ color: "#78909C" }}>{ar ? "لا توجد صافي أصول مسجلة" : "No net assets recorded"}</p></div>
          )}
        </MobileCard>

        <div className="rounded-2xl p-5 border" style={{ background: "#E8F5E9", borderColor: "#C8E6C9" }}>
          <div className="flex justify-between items-center">
            <span className="text-base font-bold" style={{ color: "#1A1A2E" }}>
              {ar ? "إجمالي الخصوم وصافي الأصول" : "Total Liabilities & Net Assets"}
            </span>
            <span className="text-xl font-black tabular-nums" style={{ color: "#2E7D32", direction: "ltr" }}>
              {formatCurrency(d.liabilities.totalLiabilities + d.netAssets.totalNetAssets)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialStatementTree;
