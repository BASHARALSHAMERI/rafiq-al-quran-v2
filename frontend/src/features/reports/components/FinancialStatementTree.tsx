import { AlertCircle, ShieldCheck } from "lucide-react";
import Badge from "../../../components/ui/Badge";
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
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

function SectionTitle({ title, amount }: { title: string; amount: number }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <span className="text-lg font-bold text-brand-600">{formatCurrency(amount)}</span>
    </div>
  );
}

function SubSectionTitle({ title, amount }: { title: string; amount: number }) {
  return (
    <div className="flex justify-between items-center mt-6 mb-2">
      <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
      <span className="text-md font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
    </div>
  );
}

function DataRow({ label, code, amount, indent = false, ar }: { label: string; code: string; amount: number; indent?: boolean; ar: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2 text-sm ${indent ? (ar ? 'pr-6' : 'pl-6') : ''}`}>
      <div className="flex gap-2">
        <span className="text-gray-400 font-mono text-xs">{code}</span>
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
    </div>
  );
}

export function FinancialStatementTree({ data, isLoading, error }: FinancialStatementTreeProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
            <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-center border border-red-200 dark:border-red-800">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-700 dark:text-red-300 font-semibold">
          {ar ? "تعذر تحميل التقرير" : "Failed to load report"}
        </p>
        <p className="text-red-500 dark:text-red-400 text-sm mt-1">
          {error.message}
        </p>
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
    <div>
      <div className="flex items-center gap-3 mb-6">
        {data.isBalanced ? (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <SectionTitle title={ar ? "الأصول" : "Assets"} amount={data.assets.totalAssets} />

          <SubSectionTitle title={ar ? "الأصول المتداولة" : "Current Assets"} amount={data.assets.totalCurrent} />
          {data.assets.current.map((item) => (
            <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent ar={ar} />
          ))}

          <SubSectionTitle title={ar ? "الأصول الثابتة" : "Fixed Assets"} amount={data.assets.totalFixed} />
          {data.assets.fixed.map((item) => (
            <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent ar={ar} />
          ))}
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <SectionTitle title={ar ? "الخصوم" : "Liabilities"} amount={data.liabilities.totalLiabilities} />
            {data.liabilities.rows.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-4">{ar ? "لا توجد خصوم مسجلة" : "No liabilities recorded"}</p>
            ) : (
              data.liabilities.rows.map((item) => (
                <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent ar={ar} />
              ))
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <SectionTitle title={ar ? "صافي الأصول" : "Net Assets"} amount={data.netAssets.totalNetAssets} />

            <SubSectionTitle title={ar ? "صافي أصول غير مقيدة" : "Unrestricted"} amount={data.netAssets.totalUnrestricted} />
            {data.netAssets.unrestricted.map((item) => (
              <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent ar={ar} />
            ))}

            <SubSectionTitle title={ar ? "صافي أصول مقيدة" : "Restricted"} amount={data.netAssets.totalRestricted} />
            {data.netAssets.restricted.map((item) => (
              <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent ar={ar} />
            ))}
          </div>

          <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-6 border border-brand-100 dark:border-brand-800">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-brand-900 dark:text-brand-100">
                {ar ? "إجمالي الخصوم وصافي الأصول" : "Total Liabilities & Net Assets"}
              </span>
              <span className="text-2xl font-black text-brand-600">
                {formatCurrency(data.liabilities.totalLiabilities + data.netAssets.totalNetAssets)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialStatementTree;
