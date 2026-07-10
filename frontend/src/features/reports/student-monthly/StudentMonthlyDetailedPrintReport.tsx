import { useMemo } from "react";
import type {
  StudentMonthlyDailyRow,
  StudentMonthlyDetailedReport,
  GroupAchievementRow,
} from "./types";

import "../../../styles/pages/student-monthly-report.css";

export type StudentMonthlyDetailedPrintReportProps = {
  data: StudentMonthlyDetailedReport;
  mode?: "screen" | "print" | "pdf";
  orgLogoUrl?: string;
  orgName?: string;
  /** أسماء احتياطية من الفلاتر في حال عدم ورودها من API */
  filterCenterName?: string;
  filterHalqahName?: string;
  filterTeacherName?: string;
};

const isAbsent = (status: StudentMonthlyDailyRow["attendanceStatus"]) =>
  status === "absent_excused" || status === "absent_unexcused";

const rowClassName = (status: StudentMonthlyDailyRow["attendanceStatus"]) => {
  if (status === "absent_excused") return "absent-excused-row";
  if (status === "absent_unexcused") return "absent-unexcused-row";
  return "";
};

const AttendanceBadge = ({
  status,
}: {
  status: StudentMonthlyDailyRow["attendanceStatus"];
}) => {
  if (status === "present") return <span className="smr-badge smr-badge--present">حاضر</span>;
  if (status === "late") return <span className="smr-badge smr-badge--late">متأخر</span>;
  if (status === "absent_excused") return <span className="smr-badge smr-badge--excused">غياب بعذر</span>;
  if (status === "absent_unexcused") return <span className="smr-badge smr-badge--absent">غياب</span>;
  return <span className="smr-badge smr-badge--none">—</span>;
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

const activitiesByDate = (groupAchievements: GroupAchievementRow[]) => {
  const map = new Map<string, string[]>();
  for (const a of groupAchievements) {
    const list = map.get(a.date) ?? [];
    list.push(a.typeLabel);
    map.set(a.date, list);
  }
  return map;
};

export function StudentMonthlyDetailedPrintReport({
  data,
  orgLogoUrl,
  orgName,
  filterCenterName,
  filterHalqahName,
  filterTeacherName,
}: StudentMonthlyDetailedPrintReportProps) {
  const { student, center, halqah, teacher, report, dailyRows, groupAchievements, summary, notes } =
    data;

  const resolvedHalqahName = halqah.name !== "—" ? halqah.name : filterHalqahName || "—";
  const resolvedCenterName = center?.name || filterCenterName;
  const resolvedTeacherName = teacher?.name || filterTeacherName;

  const printedAtLabel = (() => {
    const d = new Date(report.printedAt);
    if (Number.isNaN(d.getTime())) return report.printedAt;
    return d.toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
  })();

  const activitiesMap = useMemo(() => activitiesByDate(groupAchievements), [groupAchievements]);
  const resolvedOrgName = orgName || "جمعية رفقاء القرآن";
  const resolvedOrgLogo = orgLogoUrl || "/brand/rafiq-logo.svg";
  const resolvedCenterLogo = center?.logoUrl || orgLogoUrl || "/brand/rafiq-logo.svg";

  return (
    <div dir="rtl">
      {/* ═══ عرض الشاشة (جدول فقط) ═══ */}
      <div className="smr-screen">
        <div className="smr-table-wrap">
          <table className="smr-table">
            <thead>
              <tr>
                <th>م</th>
                <th>اليوم</th>
                <th>التاريخ</th>
                <th>الحضور</th>
                <th>سورة الحفظ</th>
                <th>آية</th>
                <th>سورة المراجعة</th>
                <th>آية</th>
                <th>النشاط</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-cell" style={{ textAlign: "center", padding: "24px" }}>
                    لا توجد أيام مسجلة لهذا الشهر.
                  </td>
                </tr>
              ) : (
                dailyRows.map((row) => {
                  const absent = isAbsent(row.attendanceStatus);
                  const m = row.memorization;
                  const r = row.revision;
                  const activities = activitiesMap.get(row.date);
                  return (
                    <tr key={`${row.index}-${row.date}`} className={rowClassName(row.attendanceStatus)}>
                      <td className="smr-cell-num">{row.index}</td>
                      <td>{row.dayName}</td>
                      <td>{row.date}</td>
                      <td><AttendanceBadge status={row.attendanceStatus} /></td>
                      <td><AttendanceBadge status={row.attendanceStatus} /></td>
                      <td>{absent ? <span className="empty-cell">—</span> : cell(m?.toSurah)}</td>
                      <td>{absent ? <span className="empty-cell">—</span> : cell(m?.toPosition)}</td>
                      <td>{absent ? <span className="empty-cell">—</span> : cell(r?.toSurah)}</td>
                      <td>{absent ? <span className="empty-cell">—</span> : cell(r?.toPosition)}</td>
                      <td className="smr-cell-activity">
                        {activities ? activities.join("، ") : <span className="empty-cell">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ عرض الطباعة — تصميم كارت (نمط السندات) ═══ */}
      <div className="smr-print-wrap">
        <div className="smr-print-card">
          <div className="smr-print-corner smr-print-corner--tl" />
          <div className="smr-print-corner smr-print-corner--tr" />
          <div className="smr-print-corner smr-print-corner--bl" />
          <div className="smr-print-corner smr-print-corner--br" />
          <div className="smr-print-inner">

            <div className="smr-print-header">
              <div className="smr-print-header-right">
                <img className="smr-print-header-logo" src={resolvedOrgLogo} alt="شعار الجمعية" />
                <div className="smr-print-org-name">{resolvedOrgName}</div>
              </div>
              <div className="smr-print-header-center">
                <div className="smr-print-student-name">{student.name}</div>
                <div className="smr-print-circle-name">حلقة {resolvedHalqahName}</div>
                <div className="smr-print-month-year">{report.monthLabel}</div>
                {resolvedTeacherName && <div className="smr-print-teacher-name">المعلم: {resolvedTeacherName}</div>}
              </div>
              <div className="smr-print-header-left">
                <img className="smr-print-header-logo" src={resolvedCenterLogo} alt="شعار المركز" />
                {resolvedCenterName && <div className="smr-print-center-name">مركز {resolvedCenterName}</div>}
              </div>
            </div>

        <div className="smr-print-body">
          <div className="smr-print-section-title">التقرير الشهري التفصيلي</div>
          <div className="student-monthly-scroll">
            <table className="student-monthly-table">
              <colgroup>
                <col style={{ width: "3%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "7%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2}>م</th>
                  <th rowSpan={2}>اليوم</th>
                  <th rowSpan={2}>التاريخ</th>
                  <th rowSpan={2}>الحضور</th>

                  <th colSpan={5}>الحفظ</th>
                  <th colSpan={5}>المراجعة</th>
                  <th colSpan={2}>المتون</th>
                </tr>
                <tr>
                  <th>من سورة</th>
                  <th>من</th>
                  <th>إلى سورة</th>
                  <th>إلى</th>
                  <th>التقدير</th>
                  <th>من سورة</th>
                  <th>من</th>
                  <th>إلى سورة</th>
                  <th>إلى</th>
                  <th>التقدير</th>
                  <th>المتن</th>
                  <th>التقدير</th>
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
                          <><br /><AttendanceChip status={row.attendanceStatus} /></>
                        )}
                      </td>
                      <td>{row.date}</td>
                      <td><AttendanceBadge status={row.attendanceStatus} /></td>
                      <td>{absent ? <span className="empty-cell" /> : cell(m?.fromSurah)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(m?.fromPosition)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(m?.toSurah)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(m?.toPosition)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(m?.grade)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(r?.fromSurah)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(r?.fromPosition)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(r?.toSurah)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(r?.toPosition)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(r?.grade)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(mt?.matnName)}</td>
                      <td>{absent ? <span className="empty-cell" /> : cell(mt?.grade)}</td>
                    </tr>
                  );
                })}
                {dailyRows.length === 0 && (
                  <tr>
                    <td colSpan={16} className="empty-cell">لا توجد أيام مسجلة لهذا الشهر.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="smr-print-section-title">الإنجاز الجماعي</div>
          <table className="group-achievement-table">
            <colgroup>
                <col style={{ width: "3%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "7%" }} />
              </colgroup>
              <thead>
              <tr>
                <th>م</th><th>اليوم</th><th>التاريخ</th>
                <th>نوع الإنجاز</th><th>الدرس / النشاط</th><th>الملاحظات</th>
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
                <tr><td colSpan={6} className="empty-cell">لا توجد إنجازات جماعية لهذا الشهر.</td></tr>
              )}
            </tbody>
          </table>

          <div className="smr-print-section-title">ملخص الشهر</div>
          <table className="summary-table">
            <thead>
              <tr>
                <th>صفحات الحفظ</th><th>صفحات المراجعة</th><th>صفحات المتون</th>
                <th>غياب بعذر</th><th>غياب بغير عذر</th><th>عدد الأيام</th>
                {typeof summary.attendanceRate === "number" && <th>نسبة الحضور</th>}
                {summary.averageGrade && <th>متوسط التقدير</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{summary.memorizationPages}</td><td>{summary.revisionPages}</td>
                <td>{summary.mutunPages}</td><td>{summary.excusedAbsences}</td>
                <td>{summary.unexcusedAbsences}</td><td>{summary.totalDays}</td>
                {typeof summary.attendanceRate === "number" && <td>{summary.attendanceRate}%</td>}
                {summary.averageGrade && <td>{summary.averageGrade}</td>}
              </tr>
            </tbody>
          </table>

          {(notes?.teacherNote || notes?.supervisorRecommendation) && (
            <div className="report-notes">
              {notes?.teacherNote && (
                <div className="report-note-box">
                  <h4>ملاحظات المعلم</h4><p>{notes.teacherNote}</p>
                </div>
              )}
              {notes?.supervisorRecommendation && (
                <div className="report-note-box">
                  <h4>توصية المشرف</h4><p>{notes.supervisorRecommendation}</p>
                </div>
              )}
            </div>
          )}

          <div className="smr-print-signatures">
            <div className="smr-print-sig-box">
              <span className="smr-print-sig-label">المعلم</span>
              <div className="smr-print-sig-line" />
            </div>
            <div className="smr-print-sig-box">
              <span className="smr-print-sig-label">المشرف</span>
              <div className="smr-print-sig-line" />
            </div>
            <div className="smr-print-sig-box">
              <span className="smr-print-sig-label">ولي الأمر</span>
              <div className="smr-print-sig-line" />
            </div>
          </div>
        </div>

        <div className="smr-print-footer">
          <div className="smr-print-footer-text">نظام رفقاء القرآن — برنامج إدارة الجمعيات القرآنية</div>
          <div className="smr-print-footer-text" style={{ fontSize: "0.65rem", opacity: 0.6 }}>طُبع بتاريخ: {printedAtLabel}</div>
        </div>

          </div>{/* smr-print-inner */}
        </div>{/* smr-print-card */}
      </div>
    </div>
  );
}

export default StudentMonthlyDetailedPrintReport;
