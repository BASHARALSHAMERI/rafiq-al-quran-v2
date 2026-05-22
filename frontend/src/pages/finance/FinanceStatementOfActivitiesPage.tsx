import { useState } from "react";
import { ArrowLeft, Activity, TrendingUp, TrendingDown } from "lucide-react";
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
import { useFinanceV2ReportStatementOfActivitiesQuery } from "../../features/finance-v2/finance-v2.hooks";
import type { FinancialPositionItemV2 } from "../../features/finance-v2/types";
// import { Badge } from "../../components/ui/Badge";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

const nowDate = new Date();
const defaultTo = nowDate.toISOString().slice(0, 10);
const defaultFrom = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
  .toISOString()
  .slice(0, 10);

export default function FinanceStatementOfActivitiesPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [centerId, setCenterId] = useState<number | undefined>();

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const reportQ = useFinanceV2ReportStatementOfActivitiesQuery({
    centerId,
    from,
    to
  });

  const data = reportQ.data;

  const SectionTitle = ({ title, amount, icon: Icon, colorClass }: { title: string; amount: number; icon: React.ElementType; colorClass: string }) => (
    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${colorClass}`}>
            <Icon size={18} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
    </div>
  );

  const DataRow = ({ label, code, amount, isTotal = false }: { label: string; code?: string; amount: number; isTotal?: boolean }) => (
    <div className={`flex justify-between items-center py-2 text-sm ${isTotal ? 'border-t border-gray-100 dark:border-gray-800 mt-2 pt-2' : ''}`}>
      <div className="flex gap-2">
        {code && <span className="text-gray-400 font-mono text-xs">{code}</span>}
        <span className={`${isTotal ? 'font-semibold text-gray-900' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
      </div>
      <span className={`font-medium ${isTotal ? 'font-bold text-gray-900' : 'text-gray-900 dark:text-gray-100'}`}>{formatCurrency(amount)}</span>
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
        title={ar ? "قائمة الأنشطة (الإيرادات والمصروفات)" : "Statement of Activities"}
        description={
          ar
            ? "تعرض ملخص الإيرادات والمصروفات والفائض أو العجز خلال فترة محددة."
            : "Displays a summary of revenue, expenses, and surplus or deficit over a specific period."
        }
        icon={<Activity className="w-6 h-6 text-emerald-600" />}
      />

      <FilterBar
        onReset={() => {
          setFrom(defaultFrom);
          setTo(defaultTo);
          setCenterId(undefined);
        }}
        activeFiltersCount={
          (from !== defaultFrom ? 1 : 0) +
          (to !== defaultTo ? 1 : 0) +
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
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-gray-400">→</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Revenue Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <SectionTitle 
                        title={ar ? "الإيرادات" : "Revenue"} 
                        amount={data.revenue.totalRevenue} 
                        icon={TrendingUp} 
                        colorClass="bg-emerald-500" 
                    />
                    
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "اشتراكات الطلاب" : "Student Contributions"}</h4>
                            {data.revenue.studentContributions.map((item: FinancialPositionItemV2) => (
                                <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                            ))}
                        </div>
                        
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "التبرعات" : "Donations"}</h4>
                            {data.revenue.donations.map((item: FinancialPositionItemV2) => (
                                <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                            ))}
                        </div>

                        {data.revenue.other.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "إيرادات أخرى" : "Other Revenue"}</h4>
                                {data.revenue.other.map((item: FinancialPositionItemV2) => (
                                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <SectionTitle 
                        title={ar ? "المصروفات" : "Expenses"} 
                        amount={data.expenses.totalExpenses} 
                        icon={TrendingDown} 
                        colorClass="bg-rose-500" 
                    />
                    
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "الرواتب والأجور" : "Payroll & Wages"}</h4>
                            {data.expenses.payroll.map((item: FinancialPositionItemV2) => (
                                <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                            ))}
                        </div>
                        
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "المصروفات التشغيلية" : "Operating Expenses"}</h4>
                            {data.expenses.operating.map((item: FinancialPositionItemV2) => (
                                <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                            ))}
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "المصروفات التعليمية" : "Educational Expenses"}</h4>
                            {data.expenses.educational.map((item: FinancialPositionItemV2) => (
                                <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                            ))}
                        </div>

                        {data.expenses.centers.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "مصروفات المراكز" : "Center Expenses"}</h4>
                                {data.expenses.centers.map((item: FinancialPositionItemV2) => (
                                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                                ))}
                            </div>
                        )}

                        {data.expenses.depreciation.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "الإهلاكات" : "Depreciation"}</h4>
                                {data.expenses.depreciation.map((item: FinancialPositionItemV2) => (
                                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                                ))}
                            </div>
                        )}

                        {data.expenses.other.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "مصروفات أخرى" : "Other Expenses"}</h4>
                                {data.expenses.other.map((item: FinancialPositionItemV2) => (
                                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Surplus/Deficit Summary */}
            <div className={`rounded-2xl p-8 border ${data.surplusOrDeficit >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/50' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/50'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${data.surplusOrDeficit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {data.surplusOrDeficit >= 0 ? <TrendingUp className="text-white" size={32} /> : <TrendingDown className="text-white" size={32} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {data.surplusOrDeficit >= 0 ? (ar ? "فائض الفترة" : "Surplus for the Period") : (ar ? "عجز الفترة" : "Deficit for the Period")}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {ar ? "صافي التغير في الأصول خلال الفترة المختارة" : "Net change in assets during the selected period"}
                            </p>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <span className={`text-4xl font-black ${data.surplusOrDeficit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {data.surplusOrDeficit >= 0 ? "+" : ""}
                            {formatCurrency(data.surplusOrDeficit)}
                        </span>
                        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">YER</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
