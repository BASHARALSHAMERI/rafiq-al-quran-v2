import { useState } from "react";
import { ArrowLeft, Scale, ShieldCheck, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../app/i18n";
import { PageHeader } from "../../components/ui/PageHeader";
import { FilterBar } from "../../components/ui/FilterBar";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuthStore } from "../../features/auth/auth.store";
import { useCentersQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2ReportFinancialPositionQuery } from "../../features/finance-v2/finance-v2.hooks";
import { Badge } from "../../components/ui/Badge";
import type { FinancialPositionItemV2 } from "../../features/finance-v2/types";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

const nowDate = new Date();
const defaultAsOf = nowDate.toISOString().slice(0, 10);

export default function FinanceStatementOfFinancialPositionPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);

  const [asOf, setAsOf] = useState(defaultAsOf);
  const [centerId, setCenterId] = useState<number | undefined>();

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const reportQ = useFinanceV2ReportFinancialPositionQuery({
    centerId,
    asOf
  });

  const data = reportQ.data;

  const SectionTitle = ({ title, amount }: { title: string; amount: number }) => (
    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <span className="text-lg font-bold text-brand-600">{formatCurrency(amount)}</span>
    </div>
  );

  const SubSectionTitle = ({ title, amount }: { title: string; amount: number }) => (
    <div className="flex justify-between items-center mt-6 mb-2">
      <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
      <span className="text-md font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
    </div>
  );

  const DataRow = ({ label, code, amount, indent = false }: { label: string; code: string; amount: number; indent?: boolean }) => (
    <div className={`flex justify-between items-center py-2 text-sm ${indent ? (ar ? 'pr-6' : 'pl-6') : ''}`}>
      <div className="flex gap-2">
        <span className="text-gray-400 font-mono text-xs">{code}</span>
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
    </div>
  );

  return (
    <div className="page p-6 max-w-5xl mx-auto space-y-6">
      <Link
        to="/reports"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className={`w-4 h-4 mr-1 ${ar ? "rotate-180 ml-1 mr-0" : ""}`} />
        {ar ? "العودة للتقارير" : "Back to Reports"}
      </Link>

      <PageHeader
        title={ar ? "قائمة المركز المالي" : "Statement of Financial Position"}
        description={
          ar
            ? "تعرض الأصول والخصوم وصافي الأصول للجمعية في تاريخ محدد."
            : "Displays assets, liabilities, and net assets of the organization as of a specific date."
        }
        icon={<Scale className="w-6 h-6 text-indigo-600" />}
        actions={
            data?.isBalanced ? (
                <Badge variant="success" className="px-3 py-1 flex gap-1 items-center">
                    <ShieldCheck size={14} />
                    {ar ? "الميزانية متوازنة" : "Balanced"}
                </Badge>
            ) : data ? (
                <Badge variant="error" className="px-3 py-1 flex gap-1 items-center">
                    <AlertCircle size={14} />
                    {ar ? "الميزانية غير متوازنة" : "Unbalanced"}
                </Badge>
            ) : null
        }
      />

      <FilterBar
        onReset={() => {
          setAsOf(defaultAsOf);
          setCenterId(undefined);
        }}
        activeFiltersCount={
          (asOf !== defaultAsOf ? 1 : 0) +
          (centerId ? 1 : 0)
        }
      >
        <div className="flex flex-wrap gap-3">
          {canLoadCenters && (
            <Select
              className="w-48"
              value={centerId || ""}
              onChange={(e) => setCenterId(Number(e.target.value) || undefined)}
            >
              <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
              {centersQ.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{ar ? "حتى تاريخ:" : "As of:"}</span>
            <Input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
        </div>
      </FilterBar>

      {reportQ.isLoading ? (
        <LoadingState />
      ) : reportQ.isError ? (
        <ErrorState
          title={ar ? "فشل تحميل التقرير" : "Failed to load report"}
          onRetry={() => void reportQ.refetch()}
        />
      ) : !data ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Right Column: Assets */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <SectionTitle title={ar ? "الأصول" : "Assets"} amount={data.assets.totalAssets} />
                
                {data.assets.current.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                ))}

                <SubSectionTitle title={ar ? "الأصول الثابتة" : "Fixed Assets"} amount={data.assets.totalFixed} />
                {data.assets.fixed.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                ))}
            </div>

            {/* Left Column: Liabilities & Net Assets */}
            <div className="space-y-8">
                {/* Liabilities */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <SectionTitle title={ar ? "الخصوم" : "Liabilities"} amount={data.liabilities.totalLiabilities} />
                    {data.liabilities.rows.length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-4">{ar ? "لا توجد خصوم مسجلة" : "No liabilities recorded"}</p>
                    ) : (
                        data.liabilities.rows.map((item: FinancialPositionItemV2) => (
                            <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                        ))
                    )}
                </div>

                {/* Net Assets */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <SectionTitle title={ar ? "صافي الأصول" : "Net Assets"} amount={data.netAssets.totalNetAssets} />
                    
                    <SubSectionTitle title={ar ? "صافي أصول غير مقيدة" : "Unrestricted Net Assets"} amount={data.netAssets.totalUnrestricted} />
                    {data.netAssets.unrestricted.map((item: FinancialPositionItemV2) => (
                        <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                    ))}

                    <SubSectionTitle title={ar ? "صافي أصول مقيدة" : "Restricted Net Assets"} amount={data.netAssets.totalRestricted} />
                    {data.netAssets.restricted.map((item: FinancialPositionItemV2) => (
                        <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                    ))}
                </div>

                {/* Total Liabilities & Net Assets */}
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
      )}
    </div>
  );
}
