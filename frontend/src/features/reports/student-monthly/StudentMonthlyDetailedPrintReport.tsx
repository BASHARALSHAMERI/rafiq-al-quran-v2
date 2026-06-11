/**
 * مكوّن "التقرير الشهري التفصيلي للطالب" — قالب طباعة/PDF (A4 Landscape, RTL).
 * يستقبل بيانات حقيقية محوّلة عبر الـ Adapter فقط (لا بيانات تجريبية).
 */

import type {
  StudentMonthlyDailyRow,
  StudentMonthlyDetailedReport,
} from "./types";

import "../../../styles/pages/student-monthly-report.css";

export type StudentMonthlyDetailedPrintReportProps = {
  data: StudentMonthlyDetailedReport;
  mode?: "screen" | "print" | "pdf";
};

const isAbsent = (status: StudentMonthlyDailyRow["attendanceStatus"]) =>
  status === "absent_excused" || status === "absent_unexcused";

const rowClassName = (status: StudentMonthlyDailyRow["attendanceStatus"]) => {
  if (status === "absent_excused") return "absent-excused-row";
  if (status === "absent_unexcused") return "absent-unexcused-row";
  return "";
};

const AttendanceChip = ({
  status,
}: {
  status: StudentMonthlyDailyRow["attendanceStatus"];
}) => {
  if (status === "absent_excused")
    return <span className="attendance-chip attendance-chip--excused">غياب بعذر</span>;
  if (status === "absent_unexcused")
    return <span className="attendance-chip attendance-chip--unexcused">غياب بغير عذر</span>;
  if (status === "late")
    return <span className="attendance-chip attendance-chip--late">متأخر</span>;
  return null;
};

const cell = (value?: string | number) => {
  if (value == null || value === "") return <span className="empty-cell">—</span>;
  return <>{value}</>;
};

export function StudentMonthlyDetailedPrintReport({
  data,
}: StudentMonthlyDetailedPrintReportProps) {
  const { student, center, halqah, teacher, report, dailyRows, groupAchievements, summary, notes } =
    data;

  const printedAtLabel = (() => {
    const d = new Date(report.printedAt);
    if (Number.isNaN(d.getTime())) return report.printedAt;
    return d.toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
  })();

  return (
    <div className="student-monthly-print-report" dir="rtl">
      {/* ─── Header ─── */}
      <div className="student-report-title-card">
        <h1>{student.name}</h1>
        <p>الحلقة: {halqah.name}</p>
        <p>الشهر: {report.monthLabel}</p>
        <div className="student-report-meta-bar">
          {center?.name && <span>المركز: {center.name}</span>}
          {teacher?.name && <span>المعلم: {teacher.name}</span>}
          {student.code && <span>كود الطالب: {student.code}</span>}
          <span>تاريخ الطباعة: {printedAtLabel}</span>
        </div>
      </div>

      {/* ─── الجدول الرئيسي اليومي ─── */}
      <div className="student-monthly-scroll">
        <table className="student-monthly-table">
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            {/* الحفظ */}
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "7%" }} />
            {/* المراجعة */}
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "7%" }} />
            {/* المتون */}
            <col style={{ width: "9%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2}>م</th>
              <th rowSpan={2}>اليوم</th>
              <th rowSpan={2}>التاريخ</th>
              <th className="hifz-header" colSpan={5}>
                الحفظ
              </th>
              <th className="revision-header" colSpan={5}>
                المراجعة
              </th>
              <th className="mutun-header" colSpan={2}>
                المتون
              </th>
            </tr>
            <tr>
              {/* الحفظ */}
              <th className="hifz-header">من سورة</th>
              <th className="hifz-header">من</th>
              <th className="hifz-header">إلى سورة</th>
              <th className="hifz-header">إلى</th>
              <th className="hifz-header">التقدير</th>
              {/* المراجعة */}
              <th className="revision-header">من سورة</th>
              <th className="revision-header">من</th>
              <th className="revision-header">إلى سورة</th>
              <th className="revision-header">إلى</th>
              <th className="revision-header">التقدير</th>
              {/* المتون */}
              <th className="mutun-header">المتن</th>
              <th className="mutun-header">التقدير</th>
            </tr>
          </thead>
          <tbody>
            {dailyRows.map((row) => {
              const absent = isAbsent(row.attendanceStatus);
              const m = row.memorization;
              const r = row.revision;
              const mt = row.mutun;
              return (
                <tr key={`${row.index}-${row.date}`} className={rowClassName(row.attendanceStatus)}>
                  <td>{row.index}</td>
                  <td>
                    {row.dayName}
                    {(absent || row.attendanceStatus === "late") && (
                      <>
                        <br />
                        <AttendanceChip status={row.attendanceStatus} />
                      </>
                    )}
                  </td>
                  <td>{row.date}</td>
                  {/* الحفظ */}
                  <td>{absent ? <span className="empty-cell" /> : cell(m?.fromSurah)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(m?.fromPosition)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(m?.toSurah)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(m?.toPosition)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(m?.grade)}</td>
                  {/* المراجعة */}
                  <td>{absent ? <span className="empty-cell" /> : cell(r?.fromSurah)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(r?.fromPosition)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(r?.toSurah)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(r?.toPosition)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(r?.grade)}</td>
                  {/* المتون */}
                  <td>{absent ? <span className="empty-cell" /> : cell(mt?.matnName)}</td>
                  <td>{absent ? <span className="empty-cell" /> : cell(mt?.grade)}</td>
                </tr>
              );
            })}
            {dailyRows.length === 0 && (
              <tr>
                <td colSpan={15} className="empty-cell">
                  لا توجد أيام مسجلة لهذا الشهر.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── جدول الإنجاز الجماعي ─── */}
      <div className="student-report-section-title">الإنجاز الجماعي</div>
      <table className="group-achievement-table">
        <colgroup>
          <col style={{ width: "4%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "36%" }} />
          <col style={{ width: "22%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>م</th>
            <th>اليوم</th>
            <th>التاريخ</th>
            <th>نوع الإنجاز</th>
            <th>الدرس / النشاط</th>
            <th>الملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {groupAchievements.length > 0 ? (
            groupAchievements.map((a) => (
              <tr key={`${a.index}-${a.date}-${a.lessonTitle}`} className={`group-achievement-row ${a.type}`}>
                <td>{a.index}</td>
                <td>{a.dayName}</td>
                <td>{a.date}</td>
                <td>{a.typeLabel}</td>
                <td>{cell(a.lessonTitle)}</td>
                <td>{cell(a.note)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="empty-cell">
                لا توجد إنجازات جماعية لهذا الشهر.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ─── ملخص الشهر ─── */}
      <div className="summary-section">
        <div className="summary-title">ملخص الشهر</div>
        <table className="summary-table">
          <thead>
            <tr>
              <th>صفحات الحفظ</th>
              <th>صفحات المراجعة</th>
              <th>صفحات المتون</th>
              <th>غياب بعذر</th>
              <th>غياب بغير عذر</th>
              <th>عدد الأيام</th>
              {typeof summary.attendanceRate === "number" && <th>نسبة الحضور</th>}
              {summary.averageGrade && <th>متوسط التقدير</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{summary.memorizationPages}</td>
              <td>{summary.revisionPages}</td>
              <td>{summary.mutunPages}</td>
              <td>{summary.excusedAbsences}</td>
              <td>{summary.unexcusedAbsences}</td>
              <td>{summary.totalDays}</td>
              {typeof summary.attendanceRate === "number" && (
                <td>{summary.attendanceRate}%</td>
              )}
              {summary.averageGrade && <td>{summary.averageGrade}</td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ─── ملاحظات المعلم وتوصية المشرف (تظهر عند توفّرها فقط) ─── */}
      {(notes?.teacherNote || notes?.supervisorRecommendation) && (
        <div className="report-notes">
          {notes?.teacherNote && (
            <div className="report-note-box">
              <h4>ملاحظات المعلم</h4>
              <p>{notes.teacherNote}</p>
            </div>
          )}
          {notes?.supervisorRecommendation && (
            <div className="report-note-box">
              <h4>توصية المشرف</h4>
              <p>{notes.supervisorRecommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── خانات التوقيع ─── */}
      <div className="print-signatures">
        <div className="print-signature-box">المعلم</div>
        <div className="print-signature-box">المشرف</div>
        <div className="print-signature-box">ولي الأمر</div>
      </div>
    </div>
  );
}

export default StudentMonthlyDetailedPrintReport;
