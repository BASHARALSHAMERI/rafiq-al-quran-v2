import { useState, useMemo } from "react";
import { ArrowLeft, Building2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../app/i18n";
import { PageHeader } from "../../components/ui/PageHeader";
import { FilterBar } from "../../components/ui/FilterBar";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuthStore } from "../../features/auth/auth.store";
import { useCentersQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2ReportCenterFundingQuery } from "../../features/finance-v2/finance-v2.hooks";
const formatCurrency = (val: number, _curr: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(val);

const nowDate = new Date();
const defaultTo = nowDate.toISOString().slice(0, 10);
const defaultFrom = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 30)
  .toISOString()
  .slice(0, 10);

export default function FinanceCenterFundingPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [centerId, setCenterId] = useState<number | undefined>();
  const [search, setSearch] = useState("");

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const reportQ = useFinanceV2ReportCenterFundingQuery({
    centerId,
    from,
    to
  });

  const rows = useMemo(() => {
    if (!reportQ.data?.rows) return [];
    if (!search) return reportQ.data.rows;
    const lowerSearch = search.toLowerCase();
    return reportQ.data.rows.filter((r) =>
      r.centerName.toLowerCase().includes(lowerSearch)
    );
  }, [reportQ.data?.rows, search]);

  const kpis = reportQ.data?.kpis;

  const columns: DataTableColumn<typeof rows[0]>[] = [
    {
      id: "centerName",
      header: ar ? "المركز" : "Center",
      cell: (row) => <div className="font-medium">{row.centerName}</div>
    },
    {
      id: "studentFees",
      header: ar ? "الرسوم والاشتراكات الرمزية" : "Student Fees",
      cell: (row) => formatCurrency(row.studentFees, "YER")
    },
    {
      id: "donations",
      header: ar ? "التبرعات المخصصة" : "Donations",
      cell: (row) => formatCurrency(row.donations, "YER")
    },
    {
      id: "totalFunding",
      header: ar ? "إجمالي التمويل" : "Total Funding",
      cell: (row) => (
        <span className="text-emerald-600 font-semibold">
          {formatCurrency(row.totalFunding, "YER")}
        </span>
      )
    },
    {
      id: "payrollCosts",
      header: ar ? "الرواتب" : "Payroll",
      cell: (row) => formatCurrency(row.payrollCosts, "YER")
    },
    {
      id: "operatingCosts",
      header: ar ? "التشغيلية" : "Operating",
      cell: (row) => formatCurrency(row.operatingCosts, "YER")
    },
    {
      id: "educationalCosts",
      header: ar ? "التعليمية" : "Educational",
      cell: (row) => formatCurrency(row.educationalCosts, "YER")
    },
    {
      id: "totalCosts",
      header: ar ? "إجمالي التكلفة" : "Total Costs",
      cell: (row) => (
        <span className="text-rose-600 font-semibold">
          {formatCurrency(row.totalCosts, "YER")}
        </span>
      )
    },
    {
      id: "fundingGap",
      header: ar ? "العجز/الفائض التمويلي" : "Funding Gap",
      cell: (row) => {
        const isSurplus = row.fundingGap >= 0;
        return (
          <span
            className={`font-bold ${
              isSurplus ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {isSurplus ? "+" : ""}
            {formatCurrency(row.fundingGap, "YER")}
          </span>
        );
      }
    }
  ];

  return (
    <div className="page p-6 max-w-7xl mx-auto space-y-6">
      <Link
        to="/reports"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className={`w-4 h-4 mr-1 ${ar ? "rotate-180 ml-1 mr-0" : ""}`} />
        {ar ? "العودة للتقارير" : "Back to Reports"}
      </Link>

      <PageHeader
        title={ar ? "تقرير تمويل وتكلفة المراكز" : "Center Funding & Cost Report"}
        description={
          ar
            ? "عرض تفصيلي للتمويل (رسوم وتبرعات) مقابل التكاليف (رواتب وتشغيلية) للمراكز."
            : "Detailed view of funding (fees, donations) vs costs (payroll, operations) for centers."
        }
        icon={<Building2 className="w-6 h-6 text-indigo-600" />}
      />

      <FilterBar
        onReset={() => {
          setFrom(defaultFrom);
          setTo(defaultTo);
          setCenterId(undefined);
          setSearch("");
        }}
        activeFiltersCount={
          (from !== defaultFrom ? 1 : 0) +
          (to !== defaultTo ? 1 : 0) +
          (centerId ? 1 : 0) +
          (search ? 1 : 0)
        }
      >
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder={ar ? "بحث بالمركز..." : "Search center..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
            <span className="text-gray-500">-</span>
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
      ) : rows.length === 0 ? (
        <EmptyState
          title={ar ? "لا توجد بيانات" : "No data"}
          description={
            ar
              ? "لا توجد حركات مالية مسجلة للمراكز في هذه الفترة."
              : "No financial movements recorded for centers in this period."
          }
        />
      ) : (
        <div className="space-y-6">
          {kpis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {ar ? "إجمالي التمويل" : "Total Funding"}
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(kpis.totalFunding, "YER")}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {ar ? "إجمالي التكلفة" : "Total Costs"}
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(kpis.totalCosts, "YER")}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {ar ? "صافي العجز/الفائض التمويلي" : "Net Funding Gap"}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    kpis.netFundingGap >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {kpis.netFundingGap >= 0 ? "+" : ""}
                  {formatCurrency(kpis.netFundingGap, "YER")}
                </p>
              </div>
            </div>
          )}

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.centerId}
          />
        </div>
      )}
    </div>
  );
}
