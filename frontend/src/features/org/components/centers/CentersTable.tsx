import { motion } from "framer-motion";
import { Building2, ExternalLink, Pencil, Power } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Center } from "../../../org/types";
import { genderLabel } from "./centers.types";

interface CentersTableProps {
  paged: Center[];
  ar: boolean;
  canManage: boolean;
  pendingStatus: boolean;
  onEdit: (c: Center) => void;
  onToggleStatus: (c: Center) => void;
}

export function CentersTable({ paged, ar, canManage, pendingStatus, onEdit, onToggleStatus }: CentersTableProps) {
  const navigate = useNavigate();

  return (
    <div className="ctr-table-wrap glass-panel p-4">
      <table className="ctr-table">
        <thead>
          <tr>
            <th>{ar ? "المركز" : "Center"}</th>
            <th>{ar ? "الرمز" : "Code"}</th>
            <th>{ar ? "المدير" : "Manager"}</th>
            <th>{ar ? "الجنس" : "Gender"}</th>
            <th>{ar ? "الحلقات" : "Circles"}</th>
            <th>{ar ? "المشرفون" : "Sups"}</th>
            <th>{ar ? "الحالة" : "Status"}</th>
            {canManage && <th>{ar ? "الإجراءات" : "Actions"}</th>}
          </tr>
        </thead>
        <tbody>
          {paged.map((c, i) => {
            const active = c.isActive ?? true;
            return (
              <motion.tr 
                key={c.id} 
                className={`table-row-glass ${active ? "" : "ctr-tr--off"}`} 
                initial={{ opacity: 0, x: ar ? 8 : -8 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.025, duration: 0.25 }}
              >
                <td>
                  <div className="ctr-cell-name">
                    <div className="ctr-cell-icon glass-icon">
                      {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="ctr-avatar-img" loading="lazy" referrerPolicy="no-referrer" /> : <Building2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="ctr-cell-primary">{c.name}</span>
                    </div>
                  </div>
                </td>
                <td><code className="ctr-code glass-chip" title={ar ? "رمز المركز" : "Center Code"}>{c.code}</code></td>
                <td className="font-semibold text-slate-700 dark:text-slate-300">{c.centerAdmin?.fullName ?? "—"}</td>
                <td>
                  <span className={`ctr-chip glass-chip ctr-chip--gender ctr-chip--sm ${c.gender === "MALE" ? "ctr-chip--male" : "ctr-chip--female"}`} title={ar ? "الجنس المخصص" : "Gender Target"}>
                    {genderLabel(c.gender, ar)}
                  </span>
                </td>
                <td><strong className="text-violet-600 dark:text-violet-400" title={ar ? `يحتوي ${Number(c._count?.circles ?? 0)} حلقة` : `Has ${Number(c._count?.circles ?? 0)} circles`}>{Number(c._count?.circles ?? 0)}</strong></td>
                <td><strong className="text-amber-600 dark:text-amber-400" title={ar ? `يديره ${c.centerSupervisors?.length ?? 0} مشرفين` : `Managed by ${c.centerSupervisors?.length ?? 0} supervisors`}>{c.centerSupervisors?.length ?? 0}</strong></td>
                <td>
                  <span className={`ctr-dot-badge glass-chip ${active ? " ctr-dot-badge--on" : ""}`} title={active ? (ar ? "نشط حالياً" : "Currently Active") : (ar ? "معطل" : "Disabled")}>
                    <span className={`ctr-dot ctr-dot--sm${active ? " ctr-dot--on glow-dot" : ""}`} />{active ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Off")}
                  </span>
                </td>
                {canManage && (
                  <td>
                    <div className="ctr-cell-actions">
                      <button className="ctr-act glass-btn-icon" onClick={() => navigate(`/org/circles?centerId=${c.id}`)} title={ar ? "عرض الحلقات" : "View Circles"}><ExternalLink className="w-3.5 h-3.5" /></button>
                      <button className="ctr-act glass-btn-icon" onClick={() => onEdit(c)} disabled={pendingStatus} title={ar ? "تعديل البيانات" : "Edit Details"}><Pencil className="w-3.5 h-3.5" /></button>
                      <button className={`ctr-act glass-btn-icon ${active ? "ctr-act--danger" : "ctr-act--success"}`} onClick={() => onToggleStatus(c)} disabled={pendingStatus} title={active ? (ar ? "إيقاف وتجميد" : "Deactivate") : (ar ? "تفعيل" : "Activate")}><Power className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                )}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
