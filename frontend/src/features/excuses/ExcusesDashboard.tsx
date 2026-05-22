import { useState } from "react";
import { useAuthStore } from "../auth/auth.store";
import { useI18n } from "../../app/i18n";
import { FileWarning, Check, X, Calendar, Download } from "lucide-react";
import { Button } from "../../components/ui/Button";

// Mock data interfaces
interface Excuse {
  id: string;
  applicantName: string;
  role: string;
  date: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  hasAttachment: boolean;
}

const mockExcuses: Excuse[] = [
  { id: "1", applicantName: "أحمد بن حنبل", role: "TEACHER", date: "2023-11-05", reason: "عذر طبي مرضي", status: "PENDING", hasAttachment: true },
  { id: "2", applicantName: "سعيد بن المسيب", role: "STUDENT", date: "2023-11-06", reason: "اختبارات مدرسية", status: "APPROVED", hasAttachment: false },
  { id: "3", applicantName: "عبدالله بن المبارك", role: "SUPERVISOR", date: "2023-11-04", reason: "ظرف عائلي طارئ", status: "PENDING", hasAttachment: false },
  { id: "4", applicantName: "يحيى بن معين", role: "CENTER_ADMIN", date: "2023-11-07", reason: "سفر للعلاج", status: "REJECTED", hasAttachment: true },
];

export default function ExcusesDashboard() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<"TEACHERS" | "STUDENTS" | "SUPERVISORS" | "MANAGERS">(
    user?.role === "SUPER_ADMIN" ? "SUPERVISORS" : "TEACHERS"
  );
  
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  const filteredExcuses = mockExcuses.filter(e => {
    if (activeTab === "TEACHERS") return e.role === "TEACHER";
    if (activeTab === "STUDENTS") return e.role === "STUDENT";
    if (activeTab === "SUPERVISORS") return e.role === "SUPERVISOR";
    if (activeTab === "MANAGERS") return e.role === "CENTER_ADMIN";
    return false;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto admin-modern-page users-enterprise-shell">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <FileWarning className="text-orange-500 w-7 h-7" />
          {ar ? "إدارة الأعذار والاستئذانات" : "Excuses & Leaves Management"}
        </h1>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-2xl">
          {ar 
            ? isSuperAdmin 
              ? "تفويض وصندوق وارد حصري للإدارة العليا لاعتماد وتدقيق طلبات مشرفي المراكز والمدراء." 
              : "صندوق الوارد لمدير المركز لاعتماد الإجازات للمعلمين والطلاب المندرجين تحت صلاحياته."
            : "Inbox for managing user excuses and leave requests."}
        </p>
      </div>

      <div className="flex border-b border-gray-200 mb-6 gap-6 overflow-x-auto select-none">
        {isSuperAdmin ? (
          <>
            <button 
              className={`pb-3 px-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'SUPERVISORS' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('SUPERVISORS')}
            >
              {ar ? "طلبات المشرفين" : "Supervisors Requests"}
            </button>
            <button 
              className={`pb-3 px-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'MANAGERS' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('MANAGERS')}
            >
              {ar ? "طلبات مدراء المراكز" : "Center Managers Requests"}
            </button>
          </>
        ) : (
          <>
            <button 
              className={`pb-3 px-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'TEACHERS' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('TEACHERS')}
            >
              {ar ? "أعذار المعلمين" : "Teachers Excuses"}
            </button>
            <button 
              className={`pb-3 px-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'STUDENTS' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('STUDENTS')}
            >
              {ar ? "أعذار الطلاب" : "Students Excuses"}
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExcuses.length > 0 ? (
          filteredExcuses.map((excuse) => (
            <div key={excuse.id} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col hover:border-brand-soft hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{excuse.applicantName}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
                    <Calendar size={13} />
                    <span dir="ltr">{excuse.date}</span>
                  </div>
                </div>
                <div className={`px-2.5 py-1 text-xs rounded-full font-medium tracking-wide ${
                  excuse.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                  excuse.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  'bg-red-50 text-red-600 border border-red-100'
                }`}>
                  {excuse.status === 'PENDING' ? (ar ? 'قيد الانتظار' : 'Pending') : 
                   excuse.status === 'APPROVED' ? (ar ? 'معتمد ✓' : 'Approved ✓') : 
                   (ar ? 'مرفوض ✕' : 'Rejected ✕')}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3.5 mb-4 flex-grow text-sm text-gray-700 border border-gray-100 leading-relaxed shadow-inner">
                <span className="font-semibold text-gray-500 block mb-1 text-xs">{ar ? "المبرر / السبب المرفوع:" : "Reason:"}</span>
                {excuse.reason}
              </div>

              {excuse.hasAttachment && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50/70 border border-blue-100/50 py-2.5 px-3 rounded-lg mb-4 cursor-pointer hover:bg-blue-100 transition-colors font-medium">
                  <Download size={14} className="opacity-70" />
                  <span>{ar ? "تحميل المرفق (عذر طبي/إداري)" : "Download Attachment"}</span>
                </div>
              )}

              {excuse.status === 'PENDING' && (
                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" size="sm">
                    <Check size={16} className="mr-1.5 opacity-80" />
                    {ar ? "اعتماد الطلب" : "Approve"}
                  </Button>
                  <Button className="flex-1 bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm" size="sm">
                    <X size={16} className="mr-1.5 opacity-80" />
                    {ar ? "رفض" : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="opacity-30" />
            </div>
            <p className="text-gray-500 font-medium">{ar ? "لا توجد طلبات معلقة حالياً في هذا القسم" : "No pending requests in this section at the moment"}</p>
            <p className="text-sm mt-1">{ar ? "أنت مواكب لجميع المهام!" : "You're all caught up!"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
