import { motion } from "framer-motion";
import { 
  Phone, 
  Mail, 
  MapPin, 
  User as UserIcon, 
  Sliders, 
  Eye, 
  Trash2,
  RefreshCw
} from "lucide-react";
import { EmptyState } from "../../../components/ui/EmptyState";
import type { UserListItem } from "../types";
import { roleLabel } from "../users.helpers";

interface UsersTableProps {
  users: UserListItem[];
  ar: boolean;
  onDetails: (user: UserListItem) => void;
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  canManage?: boolean;
  showRoleColumn?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

export function UsersTable({
  users,
  ar,
  onDetails,
  onEdit,
  onDelete,
  canManage = true,
  showRoleColumn = false,
  emptyTitle,
  emptyDescription
}: UsersTableProps) {
  if (users.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const primaryColor = "#247d7e"; // Main brand color

  return (
    <div className="users-modern-list">
      {users.map((user) => {
        return (
          <motion.article
            layout
            key={user.id}
            className={`user-signature-card ${!user.isActive ? "user-card--inactive" : ""}`}
            whileHover={{ 
              y: -3
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="user-card-main-content">
              {/* Profile Unit */}
              <div className="user-profile-signature">
                <div className="user-avatar-signature" style={{ borderColor: primaryColor, borderWidth: "1.5px" }}>
                  {user.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt={user.fullName} className="user-img-sig" />
                  ) : (
                    <div className="user-icon-sig">
                      <UserIcon size={24} />
                    </div>
                  )}
                  {user.isActive && <span className="user-status-dot" />}
                </div>

                <div className="user-meta-sig">
                  <h4 className="user-name-sig" onClick={() => onDetails(user)}>
                    {user.fullName}
                  </h4>
                  <div className="user-details-row">
                    <span className="user-detail-item">
                      <Mail size={12} />
                      {user.email || (ar ? "لا يوجد بريد" : "No email")}
                    </span>
                    <span className="user-divider">•</span>
                    <span className="user-detail-item">
                      <Phone size={12} />
                      {user.phone || (ar ? "بدون هاتف" : "No phone")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scope/Center Unit */}
              <div className="user-scope-sig">
                <div className="user-scope-pill">
                  <MapPin size={14} />
                  <span>{user.centerName || (ar ? "عام" : "General")}</span>
                </div>
                {user.circleName && (
                  <div className="user-scope-sub">
                    <Sliders size={12} />
                    <span>{user.circleName}</span>
                  </div>
                )}
              </div>

              {showRoleColumn && (
                <div className="user-scope-sig" style={{ flex: 1 }}>
                  <div className="user-scope-pill" style={{ backgroundColor: "#e2e8f0", color: "#475569", borderColor: "#cbd5e1" }}>
                    <Sliders size={14} />
                    <span>{user.role ? roleLabel(user.role, ar) : (ar ? "غير محدد" : "N/A")}</span>
                  </div>
                </div>
              )}

               {/* Actions & Status Unit */}
              <div className="user-actions-sig">
                {user.accountStatus === "INVITED" ? (
                  <div className="user-status-tag user-status-tag--invited">
                    {ar ? "دعوة معلقة" : "Pending Invite"}
                  </div>
                ) : (
                  <div className={`user-status-tag ${!user.isActive ? "user-status-tag--inactive" : ""}`}>
                    {user.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}
                  </div>
                )}
                
                <div className="user-tools-sig">
                  {user.accountStatus === "INVITED" && (
                    <button 
                      className="gs-icon-btn gs-icon-btn--invited" 
                      onClick={(e) => {
                        e.stopPropagation();
                        // This will be handled by the parent component
                        (user as any)._onResend?.();
                      }} 
                      title={ar ? "إعادة إرسال الدعوة" : "Resend Invitation"}
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button className="gs-icon-btn" onClick={() => onDetails(user)} title={ar ? "عرض" : "View"}>
                    <Eye size={16} />
                  </button>
                  {canManage ? (
                    <>
                      <button className="gs-icon-btn" onClick={() => onEdit(user)} title={ar ? "تعديل" : "Edit"}>
                        <Sliders size={16} />
                      </button>
                      <button className="gs-icon-btn delete" onClick={() => onDelete(user)} title={ar ? "حذف" : "Delete"}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
