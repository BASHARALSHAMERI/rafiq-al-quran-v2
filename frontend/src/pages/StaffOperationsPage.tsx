import { Users } from "lucide-react";
import { useI18n } from "../app/i18n";
import { PageHeader } from "../components/ui/PageHeader";
import { StaffOperationsDashboard } from "../features/staff-attendance/components/StaffOperationsDashboard";

export default function StaffOperationsPage() {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <div className="page staff-ops-page relative z-10" dir={ar ? "rtl" : "ltr"}>
      <PageHeader
        title={ar ? "إدارة شؤون الموظفين" : "Staff Operations"}
        description={ar ? "إدارة الحضور، الأعذار، الزيارات الإشرافية والسياسات العامة" : "Management of attendance, excuses, supervisor visits and general policies"}
        icon={<Users className="w-6 h-6" />}
      />
      <main className="staff-ops-main-wrapper w-full max-w-[1400px] mx-auto">
        <StaffOperationsDashboard />
      </main>
    </div>
  );
}
