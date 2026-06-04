import { Fingerprint } from "lucide-react";
import { useI18n } from "../app/i18n";
import { PageHeader } from "../components/ui/PageHeader";
import { SelfAttendanceView } from "../features/staff-attendance/components/SelfAttendanceView";

/**
 * صفحة التحضير الذاتي — متاحة لمديري المراكز والموظفين الماليين على الويب.
 * يستخدم المعلمون والمشرفون التطبيق المحمول بدلاً من هذه الصفحة.
 *
 * الأدوار المسموح بها: CENTER_ADMIN, ACCOUNTANT, FINANCE_MANAGER, TREASURER, AUDITOR
 * (يُطبّق من خلال route-meta.ts → SELF_ATTENDANCE_ROLES)
 */
export default function SelfAttendancePage() {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <div className="page" dir={ar ? "rtl" : "ltr"}>
      <PageHeader
        title={ar ? "تحضيري" : "My Attendance"}
        description={
          ar
            ? "تسجيل الحضور والانصراف، إرسال طلبات الأعذار والإجازات"
            : "Record check-in / check-out and submit excuse or leave requests"
        }
        icon={<Fingerprint className="w-6 h-6" />}
      />
      <main className="w-full max-w-[1400px] mx-auto mt-6 px-4 pb-8">
        <SelfAttendanceView />
      </main>
    </div>
  );
}
