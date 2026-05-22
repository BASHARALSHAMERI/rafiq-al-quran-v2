import { Users } from "lucide-react";
import { useI18n } from "../app/i18n";
import { PageHeader } from "../components/ui/PageHeader";
import { StaffOperationsDashboard } from "../features/staff-attendance/components/StaffOperationsDashboard";

export default function StaffOperationsPage() {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <div className="page users-page staff-ops-page admin-modern-page users-enterprise-shell">
      <PageHeader
        title={ar ? "إدارة شؤون الموظفين" : "Staff Operations"}
        description={ar ? "إدارة الحضور، الأعذار، الزيارات الإشرافية والسياسات العامة" : "Management of attendance, excuses, supervisor visits and general policies"}
        icon={<Users className="w-6 h-6" />}
      />
      <main className="staff-ops-main-wrapper" style={{ marginTop: '0' }}>
        <StaffOperationsDashboard />
      </main>
    </div>
  );
}
