import { BookOpen, Pencil, Power } from "lucide-react";
import type { Circle } from "../../types";
import { formatScheduleSummary } from "../../circleSchedule";
import { circleTypeLabel } from "./circles.types";

interface CirclesTableProps {
  ar: boolean;
  circles: Circle[];
  canManage: boolean;
  pending: boolean;
  openEdit: (c: Circle) => void;
  toggleStatus: (c: Circle) => void;
}

export default function CirclesTable({
  ar,
  circles,
  canManage,
  pending,
  openEdit,
  toggleStatus,
}: CirclesTableProps) {
  return (
    <div className="ctr-table-wrap glass-panel p-4">
      <table className="ctr-table">
        <thead>
          <tr>
            <th>{ar ? "الحلقة" : "Circle"}</th>
            <th>{ar ? "المركز" : "Center"}</th>
            <th>{ar ? "المعلم" : "Teacher"}</th>
            <th>{ar ? "النوع" : "Type"}</th>
            <th>{ar ? "المواعيد" : "Schedule"}</th>
            <th>{ar ? "الطلاب" : "Students"}</th>
            <th>{ar ? "الحالة" : "Status"}</th>
            {canManage && <th>{ar ? "الإجراءات" : "Actions"}</th>}
          </tr>
        </thead>
        <tbody>
          {circles.map((c) => {
            const on = c.isActive ?? true;
            const students = Number(c._count?.enrollments ?? c._count?.students ?? 0);
            const scheduleSummary = formatScheduleSummary(c.weeklySchedule, ar);

            return (
              <tr key={c.id} className={`table-row-glass ${on ? "" : "ctr-tr--off"}`}>
                <td>
                  <div className="ctr-cell-name">
                    <div className="ctr-cell-icon glass-icon">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="ctr-cell-primary">{c.name}</span>
                    </div>
                  </div>
                </td>
                <td className="font-semibold text-slate-700 dark:text-slate-300">{c.center?.name ?? "—"}</td>
                <td>
                  {c.teacher?.fullName ?? (
                    <span className="ctr-cell-secondary text-amber-500/70">{ar ? "غير معين" : "Unassigned"}</span>
                  )}
                </td>
                <td>
                  <span className="ctr-chip glass-chip">
                    <code>{circleTypeLabel(c.circleType, ar)}</code>
                  </span>
                </td>
                <td>{scheduleSummary ?? <span className="ctr-cell-secondary text-slate-400">—</span>}</td>
                <td>
                  <strong className="text-violet-600 dark:text-violet-400">{students}</strong>
                </td>
                <td>
                  <span className={`ctr-dot-badge glass-chip ${on ? " ctr-dot-badge--on" : ""}`}>
                    <span className={`ctr-dot ctr-dot--sm${on ? " ctr-dot--on glow-dot" : ""}`} />
                    {on ? (ar ? "نشطة" : "Active") : (ar ? "معطلة" : "Off")}
                  </span>
                </td>
                {canManage && (
                  <td>
                    <div className="ctr-cell-actions flex gap-1">
                      <button
                        className="ctr-act glass-btn-icon"
                        onClick={() => openEdit(c)}
                        disabled={pending}
                        title={ar ? "تعديل" : "Edit"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className={`ctr-act glass-btn-icon ${on ? "ctr-act--danger" : "ctr-act--success"}`}
                        onClick={() => void toggleStatus(c)}
                        disabled={pending}
                        title={on ? (ar ? "تعطيل" : "Deactivate") : (ar ? "تفعيل" : "Activate")}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
