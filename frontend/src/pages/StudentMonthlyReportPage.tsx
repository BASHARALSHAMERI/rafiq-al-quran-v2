/**
 * صفحة "التقرير الشهري التفصيلي للطالب".
 * - فلاتر حقيقية: المركز ← الحلقة ← الطالب ← الشهر/السنة (مربوطة بالـ URL).
 * - تستدعي GET /reports/student/:id?month=&year= عبر useStudentReportQuery.
 * - تحوّل الاستجابة عبر الـ Adapter ثم تعرضها في قالب الطباعة.
 * - لا بيانات تجريبية إطلاقًا.
 */

import { useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Printer, RefreshCw } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { LoadingState } from "../components/ui/LoadingState";
import { useI18n } from "../app/i18n";
import { useAuthStore } from "../features/auth/auth.store";
import { useCentersQuery, useCirclesQuery } from "../features/org/org.hooks";
import { canReadCenters } from "../features/org/org.permissions";
import {
  useStudentReportQuery,
  useStudentsSummaryQuery,
} from "../features/reports/reports.hooks";
import {
  adaptStudentMonthlyReport,
  buildEmptyStudentMonthlyReport,
} from "../features/reports/student-monthly/studentMonthlyReport.adapter";
import { StudentMonthlyDetailedPrintReport } from "../features/reports/student-monthly/StudentMonthlyDetailedPrintReport";
import type { StudentMonthlyApiResponse } from "../features/reports/student-monthly/types";
import type { StudentMonthlyDetailedReport } from "../features/reports/student-monthly/types";

const nowDate = new Date();
const defaultMonthValue = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}`;

export default function StudentMonthlyReportPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canLoadCenters = canReadCenters(user?.role);

  const [searchParams, setSearchParams] = useSearchParams();

  const centerId = searchParams.get("centerId") ? Number(searchParams.get("centerId")) : undefined;
  const halqahId = searchParams.get("halqahId") ? Number(searchParams.get("halqahId")) : undefined;
  const studentId = searchParams.get("studentId") ? Number(searchParams.get("studentId")) : undefined;
  const monthValue = searchParams.get("month") || "";

  const [yearStr, monthStr] = monthValue.split("-");
  const month = monthStr ? Number(monthStr) : undefined;
  const year = yearStr ? Number(yearStr) : undefined;

  const setFilter = (key: string, value?: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!value) next.delete(key);
        else next.set(key, value);
        // إعادة ضبط الفلاتر التابعة عند تغيير الأعلى منها
        if (key === "centerId") {
          next.delete("halqahId");
          next.delete("studentId");
        }
        if (key === "halqahId") {
          next.delete("studentId");
        }
        return next;
      },
      { replace: true }
    );
  };

  /* ─── خيارات الفلاتر (بيانات حقيقية) ─── */
  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const circlesQ = useCirclesQuery(centerId, {
    enabled: canLoadCenters ? !!centerId : true,
  });
  const studentsQ = useStudentsSummaryQuery(
    { centerId, circleId: halqahId },
    !!halqahId || !canLoadCenters
  );

  const centerOptions = centersQ.data?.items ?? [];
  const circleOptions = useMemo(
    () => (circlesQ.data?.items ?? []).filter((c) => (centerId ? c.centerId === centerId : true)),
    [circlesQ.data, centerId]
  );
  const studentOptions = (studentsQ.data?.rows ?? []) as { id: number; name: string }[];

  /* ─── استدعاء التقرير الحقيقي ─── */
  const reportEnabled = !!studentId && !!month && !!year;
  const reportQ = useStudentReportQuery(
    studentId ?? null,
    { from: "", to: "", month, year },
    reportEnabled
  );

  /* ─── اسم الطالب من قائمة الفلاتر (للاستخدام عند فشل API أو بيانات فارغة) ─── */
  const selectedStudentName = useMemo(() => {
    if (!studentId) return "";
    const found = studentOptions.find((s) => s.id === studentId);
    // الـ API قد يُرجع fullName أو name — نتعامل مع الحالتين
    return (found as any)?.fullName ?? (found as any)?.name ?? String(studentId);
  }, [studentOptions, studentId]);

  /* ─── بناء/تحويل التقرير ─── */
  const report = useMemo<StudentMonthlyDetailedReport | null>(() => {
    if (!reportEnabled) return null;
    if (reportQ.data) {
      const api = reportQ.data as unknown as StudentMonthlyApiResponse;
      return adaptStudentMonthlyReport(api);
    }
    // API فاضي أو لم يُحمّل بعد: نُبني هيكل فارغ مبني على الفلاتر فقط
    return buildEmptyStudentMonthlyReport({
      studentId: String(studentId),
      studentName: selectedStudentName || String(studentId),
      month: month!,
      year: year!,
    });
  }, [reportQ.data, reportEnabled, studentId, selectedStudentName, month, year]);

  /* ─── اسم الطالب النهائي (من التقرير إن توفّر، وإلا من الفلتر) ─── */
  const effectiveStudentName = useMemo(() => {
    if (report?.student?.name && report.student.name !== String(studentId)) {
      return report.student.name;
    }
    return selectedStudentName || String(studentId ?? "");
  }, [report, selectedStudentName, studentId]);

  /* ─── طباعة / PDF ─── */
  const handlePrint = useCallback(() => {
    if (!reportEnabled) return;
    const originalTitle = document.title;
    // استخدم اسم الطالب من الفلتر لضمان توفّر الاسم حتى في التقرير الفارغ
    const studentPart = effectiveStudentName.replace(/\s+/g, "_") || "طالب";
    const monthPart = (report?.report?.monthLabel ?? monthValue ?? "تقرير").replace(/\s+/g, "_");
    document.title = `تقرير_${studentPart}_${monthPart}`;
    window.print();
    // استعادة العنوان بعد إغلاق حوار الطباعة
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }, [reportEnabled, effectiveStudentName, report, monthValue]);

  /* ─── حالة المحتوى ─── */
  const renderContent = () => {
    if (!reportEnabled) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            {ar ? "اختر الطالب والشهر لعرض التقرير." : "Select a student and month to view the report."}
          </p>
        </div>
      );
    }
    if (reportQ.isLoading && !report) return <LoadingState />;
    return (
      <div className="flex flex-col gap-4">
        {/* شريط تحذير عند فشل الـ API */}
        {reportQ.isError && (
          <div className="no-print rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>
              {ar
                ? "تعذر تحميل البيانات من الخادم. يُعرض التقرير فارغًا."
                : "Failed to load data from server. Showing empty report template."}
            </span>
            <button
              onClick={() => void reportQ.refetch()}
              className="underline font-semibold hover:text-red-900"
            >
              {ar ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}
        {/* شريط معلومات عند بيانات فارغة */}
        {report && report.dailyRows.length === 0 && report.groupAchievements.length === 0 && !reportQ.isError && (
          <div className="no-print rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {ar
              ? "لا توجد أيام مسجلة لهذا الطالب في الشهر المحدد. يُعرض التقرير فارغًا للطباعة."
              : "No recorded days for this student in the selected month. Empty report shown for printing."}
          </div>
        )}
        {/* القالب الطباعي (دائمًا ما يُعرض) */}
        {report && <StudentMonthlyDetailedPrintReport data={report} mode="screen" />}
      </div>
    );
  };

  return (
    <div className="fin-premium-container ctr-page-modern p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-5">
        {/* رجوع */}
        <button
          onClick={() => navigate("/reports")}
          className="back-link inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 self-start no-print"
        >
          <ArrowLeft className={`w-4 h-4 ${ar ? "rotate-180 ml-1" : "mr-1"}`} />
          {ar ? "العودة للتقارير" : "Back to Reports"}
        </button>

        {/* الهيدر + الأزرار */}
        <div className="no-print">
          <PageHeader
            title={ar ? "التقرير الشهري التفصيلي للطالب" : "Student Monthly Detailed Report"}
            description={
              ar
                ? "تقرير شهري تفصيلي لطالب واحد (حفظ / مراجعة / متون / إنجاز جماعي) مخصص للطباعة و PDF."
                : "Detailed monthly report for a single student, optimized for print and PDF."
            }
            icon={<Printer className="w-6 h-6 text-teal-600" />}
            actions={
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="glass-btn"
                  leftIcon={<RefreshCw className={reportQ.isFetching ? "animate-spin" : ""} />}
                  onClick={() => void reportQ.refetch()}
                  disabled={!reportEnabled || reportQ.isFetching}
                >
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="glass-btn"
                  leftIcon={<Download className="text-rose-600" />}
                  onClick={handlePrint}
                  disabled={!reportEnabled}
                  title={effectiveStudentName ? `تصدير: ${effectiveStudentName}` : undefined}
                >
                  {ar ? "تصدير PDF" : "Export PDF"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="glass-btn"
                  leftIcon={<Printer className="text-indigo-600" />}
                  onClick={handlePrint}
                  disabled={!reportEnabled}
                  title={effectiveStudentName ? `طباعة: ${effectiveStudentName}` : undefined}
                >
                  {ar ? "طباعة" : "Print"}
                </Button>
              </div>
            }
          />
        </div>

        {/* الفلاتر */}
        <div className="filters-panel ctr-centers-shell no-print">
          <div className="ctr-controls !mb-0 border border-gray-100 shadow-sm rounded-2xl bg-white p-3">
            <div className="ctr-filters-group">
              {canLoadCenters && (
                <select
                  className="ctr-filter-select !bg-gray-50 !border-transparent hover:!bg-gray-100 !py-2"
                  value={centerId ?? ""}
                  onChange={(e) => setFilter("centerId", e.target.value || undefined)}
                >
                  <option value="">{ar ? "المركز: الكل" : "Center: All"}</option>
                  {centerOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                className="ctr-filter-select !bg-gray-50 !border-transparent hover:!bg-gray-100 !py-2"
                value={halqahId ?? ""}
                onChange={(e) => setFilter("halqahId", e.target.value || undefined)}
                disabled={canLoadCenters && !centerId}
              >
                <option value="">{ar ? "الحلقة: الكل" : "Circle: All"}</option>
                {circleOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="ctr-filter-select !bg-gray-50 !border-transparent hover:!bg-gray-100 !py-2"
                value={studentId ?? ""}
                onChange={(e) => setFilter("studentId", e.target.value || undefined)}
                disabled={!halqahId && canLoadCenters}
              >
                <option value="">{ar ? "اختر الطالب" : "Select student"}</option>
                {studentOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(s as any).fullName ?? s.name}
                  </option>
                ))}
              </select>

              <input
                type="month"
                className="ctr-filter-select !bg-gray-50 !border-transparent hover:!bg-gray-100 !py-2"
                value={monthValue}
                max={defaultMonthValue}
                onChange={(e) => setFilter("month", e.target.value || undefined)}
              />
            </div>
          </div>
        </div>

        {/* المحتوى / المعاينة / قالب الطباعة */}
        {renderContent()}
      </div>
    </div>
  );
}
