import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Settings,
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { useAuthStore } from "../../auth/auth.store";
import { useLeaveRequests, useStaffExcuses } from "../staff-attendance.api";
import { AttendancePolicySettings } from "./AttendancePolicySettings";
import { DailyStaffAttendanceView } from "./DailyStaffAttendanceView";
import { FinanceDeductionReview } from "./FinanceDeductionReview";
import { StaffExcusesRequestsView } from "./StaffExcusesRequestsView";
import { SupervisorVisitsView } from "./SupervisorVisitsView";
import { VisitPlanManagement } from "./VisitPlanManagement";
import { StaffSchedulesView } from "./StaffSchedulesView";

import "../../../styles/pages/staff-operations-v1.css";
import "../../../styles/pages/centers-modern.css";

type StaffOpsTabId =
  | "daily"
  | "requests"
  | "visits"
  | "plans"
  | "finance"
  | "policy"
  | "schedules";

type StaffOpsTab = {
  id: StaffOpsTabId;
  label: string;
  icon: ReactNode;
  badge?: number | null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export function StaffOperationsDashboard() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<StaffOpsTabId>("daily");

  const { data: pendingExcuses } = useStaffExcuses("PENDING");
  const { data: pendingLeaves } = useLeaveRequests({ status: "LEAVE_PENDING" });
  const pendingCount = (pendingExcuses?.length ?? 0) + (pendingLeaves?.length ?? 0);
  
  const isOpsAdmin = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canReviewFinanceDeductions = user?.role === "SUPER_ADMIN";
  const tabs: StaffOpsTab[] = [
    ...(isOpsAdmin
      ? [
          {
            id: "daily" as const,
            label: ar ? "الحضور اليومي" : "Daily Attendance",
            icon: <Calendar size={16} />
          },
          {
            id: "visits" as const,
            label: ar ? "الزيارات الإشرافية" : "Supervisor Visits",
            icon: <MapPin size={16} />
          },
          {
            id: "requests" as const,
            label: ar ? "الأعذار والإجازات" : "Staff Requests",
            icon: <AlertCircle size={16} />,
            badge: pendingCount > 0 ? pendingCount : null
          },
          {
            id: "plans" as const,
            label: ar ? "خطط الزيارات" : "Visit Plans",
            icon: <MapPin size={16} />
          },
          {
            id: "finance" as const,
            label: ar ? "الخصومات المالية" : "Finance Deductions",
            icon: <DollarSign size={16} />
          },
          {
            id: "schedules" as const,
            label: ar ? "جداول الموظفين" : "Staff Schedules",
            icon: <Clock size={16} />
          }
        ]
      : []),
    ...(isSuperAdmin
      ? [
          {
            id: "policy" as const,
            label: ar ? "سياسة الحضور" : "Attendance Policy",
            icon: <Settings size={16} />
          }
        ]
      : [])
  ];

  return (
    <div className="staff-ops-dashboard-root w-full">
      <motion.div initial="hidden" animate="visible" className="flex flex-col gap-8">
        
        {/* ── Tabs Navigation ── */}
        <motion.div variants={fadeUp} className="ctr-workspace mt-0">
          <div
            className="exams-tabs-bar"
            role="tablist"
            aria-label={ar ? "تبويبات شؤون الموظفين" : "Staff operations tabs"}
          >
            {tabs
              .filter((tab) => tab.id !== "finance" || canReviewFinanceDeductions)
              .map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`exams-tab-btn ${isActive ? "exams-tab-btn--active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge ? (
                    <span className="staff-ops-tab__badge pulse-on-update">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* ── Tab Content ── */}
          <div className="staff-ops-content mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: ar ? 15 : -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: ar ? -15 : 15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {activeTab === "daily" && isOpsAdmin && <DailyStaffAttendanceView />}
                {activeTab === "requests" && isOpsAdmin && <StaffExcusesRequestsView />}
                {activeTab === "visits" && isOpsAdmin && <SupervisorVisitsView />}
                {activeTab === "plans" && isOpsAdmin && <VisitPlanManagement />}
                {activeTab === "finance" && canReviewFinanceDeductions && <FinanceDeductionReview />}
                {activeTab === "schedules" && isOpsAdmin && <StaffSchedulesView />}
                {activeTab === "policy" && isSuperAdmin && <AttendancePolicySettings />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
