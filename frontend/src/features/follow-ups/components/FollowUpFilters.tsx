import { BookOpen, RotateCcw, BookMarked, ScrollText, X } from "lucide-react";
import type { FollowUpStatus, FollowUpType } from "../types";
import type { Center } from "../../org/types";

type Circle = { id: number; name: string };

type Props = {
  ar: boolean;
  type: FollowUpType;
  onTypeChange: (type: FollowUpType) => void;
  canLoadCenters: boolean;
  canLoadCircles: boolean;
  centers: Center[];
  circles: Circle[];
  centerId: number | undefined;
  circleId: number | undefined;
  studentIdFilter: number | undefined;
  statusFilter: FollowUpStatus | undefined;
  onCenterChange: (id: number | undefined) => void;
  onCircleChange: (id: number | undefined) => void;
  onStudentIdChange: (id: number | undefined) => void;
  onStatusChange: (status: FollowUpStatus | undefined) => void;
  onReset: () => void;
};

const toOptionalNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const TYPE_CONFIG: Record<FollowUpType, {
  labelAr: string;
  labelEn: string;
  cls: string;
  icon: typeof BookOpen;
}> = {
  NEW_MEMORIZATION: {
    labelAr: "الحفظ",
    labelEn: "Hifz",
    cls: "fu-type-tab--hifz",
    icon: BookOpen,
  },
  REVIEW: {
    labelAr: "المراجعة",
    labelEn: "Review",
    cls: "fu-type-tab--review",
    icon: BookMarked,
  },
  MATN: {
    labelAr: "المتون",
    labelEn: "Mutoon",
    cls: "fu-type-tab--matn",
    icon: ScrollText,
  },
};

const TYPES: FollowUpType[] = ["NEW_MEMORIZATION", "REVIEW", "MATN"];

export function FollowUpFilters({
  ar,
  type,
  onTypeChange,
  canLoadCenters,
  canLoadCircles,
  centers,
  circles,
  centerId,
  circleId,
  studentIdFilter,
  statusFilter,
  onCenterChange,
  onCircleChange,
  onStudentIdChange,
  onStatusChange,
  onReset,
}: Props) {
  const hasActiveFilters =
    centerId !== undefined ||
    circleId !== undefined ||
    studentIdFilter !== undefined ||
    statusFilter !== undefined;

  const activeFilters: { key: string; label: string; onClear: () => void }[] = [];
  if (centerId !== undefined) {
    const name = centers.find((c) => c.id === centerId)?.name ?? `#${centerId}`;
    activeFilters.push({ key: "center", label: `${ar ? "المركز" : "Center"}: ${name}`, onClear: () => onCenterChange(undefined) });
  }
  if (circleId !== undefined) {
    const name = circles.find((c) => c.id === circleId)?.name ?? `#${circleId}`;
    activeFilters.push({ key: "circle", label: `${ar ? "الحلقة" : "Circle"}: ${name}`, onClear: () => onCircleChange(undefined) });
  }
  if (studentIdFilter !== undefined) {
    activeFilters.push({ key: "student", label: `${ar ? "الطالب" : "Student"}: #${studentIdFilter}`, onClear: () => onStudentIdChange(undefined) });
  }
  if (statusFilter !== undefined) {
    activeFilters.push({ key: "status", label: `${ar ? "الحالة" : "Status"}: ${statusFilter}`, onClear: () => onStatusChange(undefined) });
  }

  return (
    <div className="fu-filter-card">
      {/* Type Tabs */}
      <div className="fu-type-tabs">
        {TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t];
          const Icon = cfg.icon;
          const isActive = t === type;
          return (
            <button
              key={t}
              type="button"
              className={`fu-type-tab ${cfg.cls} ${isActive ? "fu-type-tab--active" : ""}`}
              onClick={() => onTypeChange(t)}
            >
              <Icon className="fu-type-tab__icon" />
              {ar ? cfg.labelAr : cfg.labelEn}
            </button>
          );
        })}
      </div>

      {/* Filter Controls Row */}
      <div className="fu-filter-row">
        {canLoadCenters ? (
          <div className="fu-filter-group">
            <span className="fu-filter-label">{ar ? "المركز" : "Center"}</span>
            <select
              className="fu-select"
              value={centerId ?? ""}
              onChange={(e) => {
                const next = toOptionalNumber(e.target.value);
                onCenterChange(next);
                onCircleChange(undefined);
              }}
            >
              <option value="">{ar ? "كل المراكز" : "All centers"}</option>
              {centers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {canLoadCircles ? (
          <div className="fu-filter-group">
            <span className="fu-filter-label">{ar ? "الحلقة" : "Circle"}</span>
            <select
              className="fu-select"
              value={circleId ?? ""}
              onChange={(e) => onCircleChange(toOptionalNumber(e.target.value))}
            >
              <option value="">{ar ? "كل الحلقات" : "All circles"}</option>
              {circles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="fu-filter-group">
          <span className="fu-filter-label">{ar ? "رقم الطالب" : "Student ID"}</span>
          <input
            className="fu-input"
            type="number"
            min={1}
            value={studentIdFilter ?? ""}
            onChange={(e) => onStudentIdChange(toOptionalNumber(e.target.value))}
            placeholder={ar ? "ابحث بالرقم..." : "Search by ID..."}
          />
        </div>

        {/* Status pills */}
        <div className="fu-filter-group">
          <span className="fu-filter-label">{ar ? "الحالة" : "Status"}</span>
          <div className="fu-status-pills">
            <button
              type="button"
              className={`fu-status-pill fu-status-pill--all ${statusFilter === undefined ? "fu-status-pill--active" : ""}`}
              onClick={() => onStatusChange(undefined)}
            >
              <span className="fu-status-pill__dot fu-status-pill__dot--all" />
              {ar ? "الكل" : "All"}
            </button>
            <button
              type="button"
              className={`fu-status-pill fu-status-pill--draft ${statusFilter === "DRAFT" ? "fu-status-pill--active" : ""}`}
              onClick={() => onStatusChange("DRAFT")}
            >
              <span className="fu-status-pill__dot fu-status-pill__dot--draft" />
              {ar ? "مسودة" : "Draft"}
            </button>
            <button
              type="button"
              className={`fu-status-pill fu-status-pill--final ${statusFilter === "FINAL" ? "fu-status-pill--active" : ""}`}
              onClick={() => onStatusChange("FINAL")}
            >
              <span className="fu-status-pill__dot fu-status-pill__dot--final" />
              {ar ? "معتمد" : "Final"}
            </button>
          </div>
        </div>

        {/* Reset */}
        {hasActiveFilters ? (
          <button type="button" className="fu-reset-btn" onClick={onReset}>
            <RotateCcw className="fu-reset-btn__icon" />
            {ar ? "إعادة ضبط" : "Reset"}
          </button>
        ) : null}
      </div>

      {/* Active filters tags */}
      {activeFilters.length > 0 ? (
        <div className="fu-active-filters">
          {activeFilters.map((tag) => (
            <span key={tag.key} className="fu-active-tag">
              {tag.label}
              <button type="button" className="fu-active-tag__close" onClick={tag.onClear} aria-label="Remove">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
