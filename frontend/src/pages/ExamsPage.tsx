import { useEffect, useMemo, useState } from "react";
import { BookOpen, ClipboardCheck, ClipboardList, GraduationCap, Library } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthStore } from "../features/auth/auth.store";
import { ExamBankTab } from "../features/exams/components/ExamBankTab";
import { GradeScalesTab } from "../features/exams/components/GradeScalesTab";
import { ExamNominationRequestsTab } from "../features/exams/components/ExamNominationRequestsTab";
import { ExamRegistryTab } from "../features/exams/components/ExamRegistryTab";
import { ExamTypesTab } from "../features/exams/components/ExamTypesTab";
import { useCentersQuery, useCirclesQuery } from "../features/org/org.hooks";
import { canReadCenters, canReadCircles } from "../features/org/org.permissions";

type TabId = "registry" | "nominations" | "types" | "grades" | "bank";

const tabMeta: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "registry", label: "سجل الاختبارات", icon: <ClipboardList size={16} /> },
  { id: "nominations", label: "طلبات الترشيح", icon: <ClipboardCheck size={16} /> },
  { id: "types", label: "أنواع الاختبارات", icon: <BookOpen size={16} /> },
  { id: "grades", label: "تقديرات الاختبارات", icon: <GraduationCap size={16} /> },
  { id: "bank", label: "بنك الأسئلة", icon: <Library size={16} /> }
];

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("registry");
  const user = useAuthStore((state) => state.user);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isCenterAdmin = user?.role === "CENTER_ADMIN";
  const canLoadCenters = canReadCenters(user?.role);
  const canLoadCircles = canReadCircles(user?.role);

  const centersQuery = useCentersQuery({ enabled: canLoadCenters });
  const circlesQuery = useCirclesQuery(undefined, { enabled: canLoadCircles });

  const centers = useMemo(
    () => (canLoadCenters ? centersQuery.data?.items ?? [] : []),
    [canLoadCenters, centersQuery.data]
  );
  const circles = useMemo(
    () => (canLoadCircles ? circlesQuery.data?.items ?? [] : []),
    [canLoadCircles, circlesQuery.data]
  );

  const visibleTabs = useMemo(
    () =>
      tabMeta.filter((tab) => {
        if (tab.id === "registry") {
          return true;
        }

        if (tab.id === "nominations") {
          return isCenterAdmin;
        }

        return isSuperAdmin;
      }),
    [isCenterAdmin, isSuperAdmin]
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? "registry");
    }
  }, [activeTab, visibleTabs]);

  return (
    <div className="page exams-page">
      <PageHeader
        title="نظام الاختبارات"
        description="إدارة قوالب الاختبارات، واعتماد الترشيحات، ومتابعة سجل الاختبارات والنتائج ضمن مسار عمل واضح ومترابط."
        icon={<ClipboardList className="w-6 h-6" />}
      />

      <div className="exams-tabs-bar">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`exams-tab-btn ${activeTab === tab.id ? "exams-tab-btn--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="exams-tab-content">
        {activeTab === "registry" ? <ExamRegistryTab centers={centers} circles={circles} /> : null}
        {activeTab === "nominations" ? <ExamNominationRequestsTab centers={centers} circles={circles} /> : null}
        {activeTab === "types" ? <ExamTypesTab /> : null}
        {activeTab === "grades" ? <GradeScalesTab /> : null}
        {activeTab === "bank" ? <ExamBankTab /> : null}
      </div>
    </div>
  );
}
