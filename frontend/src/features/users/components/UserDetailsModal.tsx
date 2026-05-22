import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Phone, Building2, Users,
  XCircle, User,
  UserCheck, Briefcase, GraduationCap
} from "lucide-react";
import type { Role } from "../../auth/types";
import type { UserListItem } from "../types";
import { createPortal } from "react-dom";

interface UserDetailsModalProps {
  ar: boolean;
  isOpen: boolean;
  onClose: () => void;
  detailsUser: UserListItem | null;
  isLoading: boolean;
  roleLabel: (r: Role, ar: boolean) => string;
  fmtDate: (v?: string | null) => string;
  students?: UserListItem[];
}

const KHATM: Record<string, [string, string]> = {
  KHATIM: ["خاتم", "Khatim"], MUJAZ: ["مجاز", "Mujaz"],
  QIRAAT: ["قراءات", "Qiraat"], HAFIZ: ["حافظ", "Hafiz"]
};
const RIWAYA: Record<string, [string, string]> = {
  HAFS: ["حفص عن عاصم", "Hafs"], WARSH: ["ورش عن نافع", "Warsh"]
};
const GENDER: Record<string, [string, string]> = {
  MALE: ["ذكر", "Male"], FEMALE: ["أنثى", "Female"]
};
const SLEVEL: Record<string, [string, string]> = {
  BEGINNER: ["مبتدئ", "Beginner"], INTERMEDIATE: ["متوسط", "Intermediate"], ADVANCED: ["متقدم", "Advanced"]
};

const LB = (m: Record<string, [string, string]>, k: string | null | undefined, ar: boolean) =>
  k ? (m[k]?.[ar ? 0 : 1] ?? k) : null;

export function UserDetailsModal({
  ar, isOpen, onClose,
  detailsUser: u, isLoading,
  roleLabel, fmtDate,
  students = []
}: UserDetailsModalProps) {
  if (!isOpen) return null;

  const studentMap = new Map(students.map(s => [s.id, s.fullName]));

  const primaryColor = "#247d7e";
  const isActive = u?.isActive ?? false;

  const modalContent = (
    <div className="udm-fixed-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="udm-modern-container"
            dir={ar ? "rtl" : "ltr"}
          >
            {/* Header / Hero Section */}
            <div className="udm-header-hero" style={{ background: `linear-gradient(135deg, ${primaryColor}, #1a5e5f)` }}>
              <button className="udm-close-trigger" onClick={onClose}>
                <X size={20} />
              </button>
              
              <div className="udm-hero-main">
                <div className="udm-avatar-wrapper">
                  {u?.profile?.avatarUrl ? (
                    <img src={u.profile.avatarUrl} alt={u.fullName} className="udm-avatar-img" />
                  ) : (
                    <div className="udm-avatar-placeholder">
                      <User size={40} />
                    </div>
                  )}
                  <div className={`udm-status-badge ${isActive ? "active" : "inactive"}`}>
                    {isActive ? <UserCheck size={12} /> : <XCircle size={12} />}
                  </div>
                </div>

                <div className="udm-hero-info">
                  <h2 className="udm-user-fullname">{u?.fullName || "—"}</h2>
                  <div className="udm-hero-badges">
                    <span className="udm-role-pill">{roleLabel(u?.role || "STUDENT", ar)}</span>
                    <span className="udm-id-pill">#{u?.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="udm-scroll-content">
              {isLoading ? (
                <div className="udm-loading-state">
                  <div className="udm-loader-spin" />
                  <p>{ar ? "جاري تحميل البيانات..." : "Loading user details..."}</p>
                </div>
              ) : u ? (
                <div className="udm-sections-grid">
                  
                  {/* Quick Info Bar - Universal */}
                  <div className="udm-quick-stats">
                    <div className="udm-qstat">
                      <span className="udm-qstat-label">{ar ? "الحالة" : "Status"}</span>
                      <span className={`udm-qstat-val ${isActive ? "text-success" : "text-danger"}`}>
                        {isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}
                      </span>
                    </div>
                    <div className="udm-qstat">
                      <span className="udm-qstat-label">{ar ? "الجنس" : "Gender"}</span>
                      <span className="udm-qstat-val">{LB(GENDER, u.profile?.gender, ar) || "—"}</span>
                    </div>
                    <div className="udm-qstat">
                      <span className="udm-qstat-label">{ar ? "تاريخ الانضمام" : "Joined"}</span>
                      <span className="udm-qstat-val">{fmtDate(u.createdAt)}</span>
                    </div>
                  </div>

                  {/* 1. Profile Specific Section (The Core Data) */}
                  {u.role === "TEACHER" && u.teacherProfile && (
                    <section className="udm-section">
                      <h3 className="udm-section-title"><Briefcase size={16} /> {ar ? "الملف المهني" : "Professional Profile"}</h3>
                      <div className="udm-info-grid">
                        <div className="udm-info-tile">
                          <label>{ar ? "المؤهل العلمي" : "Education"}</label>
                          <p>{u.teacherProfile.educationLevel || "—"}</p>
                        </div>
                        <div className="udm-info-tile">
                          <label>{ar ? "الخبرة" : "Experience"}</label>
                          <p>{u.teacherProfile.yearsExperience} {ar ? "سنوات" : "Years"}</p>
                        </div>
                        <div className="udm-info-tile">
                          <label>{ar ? "درجة الحفظ" : "Khatm"}</label>
                          <p>{LB(KHATM, u.teacherProfile.khatmType, ar) || "—"}</p>
                        </div>
                        <div className="udm-info-tile">
                          <label>{ar ? "الرواية" : "Riwaya"}</label>
                          <p>{LB(RIWAYA, u.teacherProfile.riwaya, ar) || "—"}</p>
                        </div>
                      </div>
                    </section>
                  )}

                  {u.role === "STUDENT" && u.studentProfile && (
                    <section className="udm-section">
                      <h3 className="udm-section-title"><GraduationCap size={16} /> {ar ? "ملف الطالب" : "Student Profile"}</h3>
                      <div className="udm-info-grid">
                        <div className="udm-info-tile">
                          <label>{ar ? "المستوى الدراسي" : "Level"}</label>
                          <p>{LB(SLEVEL, u.studentProfile.level, ar) || "—"}</p>
                        </div>
                        <div className="udm-info-tile">
                          <label>{ar ? "تاريخ الالتحاق" : "Join Date"}</label>
                          <p>{fmtDate(u.studentProfile.joinDate)}</p>
                        </div>
                        {u.studentProfile.nickname && (
                          <div className="udm-info-tile">
                            <label>{ar ? "اللقب" : "Nickname"}</label>
                            <p>{u.studentProfile.nickname}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* 2. Relationships Section */}
                  {(u.role === "PARENT" && (u.parentLinks?.length ?? 0) > 0) && (
                    <section className="udm-section">
                      <h3 className="udm-section-title"><Users size={16} /> {ar ? "الأبناء المرتبطون" : "Linked Children"}</h3>
                      <div className="udm-relationship-list">
                        {(u.parentLinks ?? []).map(lnk => {
                          const studentName = (lnk.student?.fullName as string) || lnk.student?.profile?.fullName || studentMap.get(lnk.studentId) || `#${lnk.studentId}`;
                          return (
                            <div key={lnk.studentId} className="udm-rel-card">
                              <div className="udm-rel-avatar"><User size={14} /></div>
                              <div className="udm-rel-info">
                                <p className="udm-rel-name">{studentName}</p>
                                <span className="udm-rel-type">{lnk.relationType ? (ar ? "صلة قرابة" : "Relation") : (ar ? "طالب" : "Student")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {(u.role === "STUDENT" && (u.childLinks?.length ?? 0) > 0) && (
                    <section className="udm-section">
                      <h3 className="udm-section-title"><Users size={16} /> {ar ? "أولياء الأمور" : "Guardians"}</h3>
                      <div className="udm-relationship-list">
                        {(u.childLinks ?? []).map(lnk => (
                          <div key={lnk.parentId} className="udm-rel-card">
                            <div className="udm-rel-avatar"><User size={14} /></div>
                            <div className="udm-rel-info">
                              <p className="udm-rel-name">{(lnk.parent?.fullName as string) || lnk.parent?.profile?.fullName || `#${lnk.parentId}`}</p>
                              <span className="udm-rel-type">{ar ? "ولي أمر" : "Guardian"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 3. Organization Section */}
                  <section className="udm-section">
                    <h3 className="udm-section-title"><Building2 size={16} /> {ar ? "الارتباط الإداري" : "Organization"}</h3>
                    <div className="udm-org-summary">
                      <div className="udm-org-node">
                        <label>{ar ? "المركز" : "Center"}</label>
                        <p>{u.centerName || (ar ? "غير محدد" : "Not assigned")}</p>
                      </div>
                      <div className="udm-org-node">
                        <label>{ar ? "الحلقة" : "Circle"}</label>
                        <p>{u.circleName || (ar ? "غير محدد" : "Not assigned")}</p>
                      </div>
                    </div>
                  </section>

                  {/* 4. Contact & Identity Section */}
                  <section className="udm-section">
                    <h3 className="udm-section-title"><Phone size={16} /> {ar ? "التواصل والهوية" : "Contact & Identity"}</h3>
                    <div className="udm-info-grid">
                      <div className="udm-info-tile">
                        <label>{ar ? "رقم الهاتف" : "Phone"}</label>
                        <p>{u.phone || u.profile?.phone || "—"}</p>
                      </div>
                      <div className="udm-info-tile">
                        <label>{ar ? "البريد الإلكتروني" : "Email"}</label>
                        <p>{u.email || "—"}</p>
                      </div>
                      <div className="udm-info-tile">
                        <label>{ar ? "اسم المستخدم" : "Username"}</label>
                        <p>{u.username ? `@${u.username}` : "—"}</p>
                      </div>
                      <div className="udm-info-tile">
                        <label>{ar ? "آخر دخول" : "Last Login"}</label>
                        <p>{fmtDate(u.lastLoginAt)}</p>
                      </div>
                      <div className="udm-info-tile full">
                        <label>{ar ? "العنوان" : "Address"}</label>
                        <p>{u.profile?.address || "—"}</p>
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}
            </div>

            <style>{`
              .udm-fixed-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(8px);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
              }
              .udm-modern-container {
                width: 100%;
                max-width: 540px;
                background: #fff;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                display: flex;
                flex-direction: column;
                max-height: 90vh;
              }
              .udm-header-hero {
                padding: 1rem 1.5rem;
                color: #fff;
                position: relative;
                display: flex;
                align-items: center;
              }
              .udm-close-trigger {
                position: absolute;
                top: 0.85rem;
                right: 1.25rem;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: #fff;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                z-index: 10;
              }
              [dir="rtl"] .udm-close-trigger {
                right: auto;
                left: 1.25rem;
              }
              .udm-close-trigger:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
              }
              .udm-hero-main {
                display: flex;
                align-items: center;
                gap: 1.25rem;
              }
              .udm-avatar-wrapper {
                position: relative;
                width: 52px;
                height: 52px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                padding: 2px;
              }
              .udm-avatar-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 9px;
              }
              .udm-avatar-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
              }
              .udm-status-badge {
                position: absolute;
                bottom: -5px;
                right: -5px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #fff;
              }
              .udm-status-badge.active { background: #10b981; color: #fff; }
              .udm-status-badge.inactive { background: #ef4444; color: #fff; }

              .udm-user-fullname {
                font-size: 1.35rem;
                font-weight: 800;
                margin: 0;
                color: #ffffff;
                letter-spacing: -0.02em;
                line-height: 1.1;
              }
              .udm-hero-badges {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-top: 0.6rem;
              }
              .udm-role-pill {
                background: rgba(255, 255, 255, 0.25);
                padding: 0.25rem 0.85rem;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 700;
                color: #ffffff;
              }
              .udm-id-pill {
                font-size: 0.8rem;
                opacity: 0.85;
                font-weight: 600;
                color: #ffffff;
              }

              .udm-scroll-content {
                padding: 1.5rem 2rem;
                overflow-y: auto;
                background: #fcfdfe;
              }
              .udm-quick-stats {
                display: flex;
                justify-content: space-between;
                background: #fff;
                padding: 1rem;
                border-radius: 16px;
                border: 1px solid #f1f5f9;
                margin-bottom: 2rem;
              }
              .udm-qstat {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                flex: 1;
                align-items: center;
              }
              .udm-qstat:not(:last-child) {
                border-inline-end: 1px solid #f1f5f9;
              }
              .udm-qstat-label {
                font-size: 0.65rem;
                font-weight: 700;
                color: #94a3b8;
                text-transform: uppercase;
              }
              .udm-qstat-val {
                font-size: 0.85rem;
                font-weight: 700;
                color: #1e293b;
              }
              .text-success { color: #059669; }

              .udm-section {
                margin-bottom: 2rem;
              }
              .udm-section-title {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                font-size: 0.9rem;
                font-weight: 800;
                color: ${primaryColor};
                margin-bottom: 1rem;
                border-bottom: 1.5px solid color-mix(in srgb, ${primaryColor} 10%, transparent);
                padding-bottom: 0.5rem;
              }
              .udm-info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.25rem;
              }
              .udm-info-tile {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
              }
              .udm-info-tile.full { grid-column: 1 / -1; }
              .udm-info-tile label {
                font-size: 0.7rem;
                font-weight: 700;
                color: #94a3b8;
                text-transform: uppercase;
              }
              .udm-info-tile p {
                font-size: 0.85rem;
                font-weight: 600;
                color: #475569;
                margin: 0;
              }

              .udm-org-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
              }
              .udm-org-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
              }
              .udm-org-item-content {
                display: flex;
                flex-direction: column;
              }
              .udm-org-item-content label {
                font-size: 0.65rem;
                font-weight: 700;
                color: #94a3b8;
              }
              .udm-org-item-content p {
                font-size: 0.85rem;
                font-weight: 700;
                color: #1e293b;
                margin: 0;
              }
              .text-primary { color: ${primaryColor}; }

              .udm-loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 4rem 0;
                gap: 1rem;
                color: #94a3b8;
              }
              .udm-relationship-list {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.75rem;
              }
              .udm-rel-card {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
              }
              .udm-rel-avatar {
                width: 32px;
                height: 32px;
                background: color-mix(in srgb, ${primaryColor} 10%, transparent);
                color: ${primaryColor};
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .udm-rel-info p { margin: 0; font-size: 0.85rem; font-weight: 700; color: #1e293b; }
              .udm-rel-type { font-size: 0.65rem; color: #94a3b8; font-weight: 600; }

              .udm-org-summary {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
              }
              .udm-org-node {
                padding: 1rem;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
              }
              .udm-org-node label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
              .udm-org-node p { margin: 0; font-size: 0.9rem; font-weight: 700; color: #1e293b; }

              .udm-loader-spin {
                width: 30px;
                height: 30px;
                border: 3px solid #f1f5f9;
                border-top-color: ${primaryColor};
                border-radius: 50%;
                animation: udm-spin 0.8s linear infinite;
              }
              @keyframes udm-spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
