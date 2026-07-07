import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  CopyPlus,
  Wand2
} from "lucide-react";
import type { PrayerName } from "./types";
import {
  PRAYER_ORDER,
  prayerLabel,
  type CircleScheduleDraftRow,
  weekdayLabel
} from "./circleSchedule";

type Props = {
  rows: CircleScheduleDraftRow[];
  onChange: (rows: CircleScheduleDraftRow[]) => void;
  ar: boolean;
  disabled?: boolean;
};

const addTwoHours = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return "";
  }

  const totalMinutes = (hours * 60 + minutes + 120) % (24 * 60);
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
};

export function CircleScheduleEditor({ rows, onChange, ar, disabled = false }: Props) {
  const [workStartDate, setWorkStartDate] = useState("");

  const updateRow = (
    day: CircleScheduleDraftRow["day"],
    updater: (row: CircleScheduleDraftRow) => CircleScheduleDraftRow
  ) => {
    onChange(rows.map((row) => (row.day === day ? updater(row) : row)));
  };

  const handleToggle = (day: CircleScheduleDraftRow["day"], enabled: boolean) => {
    updateRow(day, (prev) => ({ ...prev, enabled }));
  };

  const handleModeChange = (day: CircleScheduleDraftRow["day"], mode: "CLOCK" | "PRAYER") => {
    updateRow(day, (prev) => ({
      ...prev,
      mode,
      fromTime: mode === "CLOCK" ? "08:00" : "",
      toTime: mode === "CLOCK" ? "10:00" : "",
      fromPrayer: mode === "PRAYER" ? "MAGHRIB" : prev.fromPrayer,
      toPrayer: mode === "PRAYER" ? "ISHA" : prev.toPrayer
    }));
  };

  const handleFromTimeChange = (day: CircleScheduleDraftRow["day"], value: string) => {
    updateRow(day, (prev) => ({
      ...prev,
      fromTime: value,
      toTime: value ? addTwoHours(value) : ""
    }));
  };

  const copyToEnabledDays = (sourceRow: CircleScheduleDraftRow) => {
    onChange(
      rows.map((row) =>
        row.enabled
          ? {
              ...row,
              mode: sourceRow.mode,
              fromTime: sourceRow.fromTime,
              toTime: sourceRow.toTime,
              fromPrayer: sourceRow.fromPrayer,
              toPrayer: sourceRow.toPrayer
            }
          : row
      )
    );
  };

  /** Apply: just mark all enabled rows with the chosen start date as a note (stored in fromTime label context).
   *  Since scheduleRow uses fromTime/toTime as clock times, we keep that model unchanged
   *  and use workStartDate only as a UI convenience label – it does not affect row time data.
   *  If you need to persist the date to the backend, extend the payload accordingly. */
  const applyWorkStartToEnabledDays = (value: string) => {
    if (!value) return;
    // Apply a default 08:00 → 10:00 to all enabled CLOCK rows that have no time set
    onChange(
      rows.map((row) =>
        row.enabled && row.mode === "CLOCK" && !row.fromTime
          ? { ...row, fromTime: "08:00", toTime: "10:00" }
          : row
      )
    );
  };

  const ArrowIcon = ar ? ArrowLeft : ArrowRight;

  return (
    <div className="cirsched-wrap" dir={ar ? "rtl" : "ltr"}>
      {/* Compact Header with date quick-action */}
      <div className="cirsched-header">
        <div className="cirsched-header-left">
          <div className="cirsched-icon-dot">
            <CalendarDays size={13} />
          </div>
          <span className="cirsched-title">{ar ? "جدول الأسبوع" : "Weekly Schedule"}</span>
        </div>

        <div className="cirsched-quick">
          <div className="cirsched-date-wrap">
            <CalendarDays size={12} className="cirsched-date-icon" />
            <input
              type="date"
              className="cirsched-date-input"
              value={workStartDate}
              onChange={(e) => setWorkStartDate(e.target.value)}
              disabled={disabled}
              title={ar ? "تاريخ بدء العمل" : "Work start date"}
            />
          </div>
          <button
            type="button"
            className="cirsched-apply-btn"
            onClick={() => applyWorkStartToEnabledDays(workStartDate)}
            disabled={disabled || !workStartDate}
            title={ar ? "تطبيق على الكل" : "Apply to all"}
          >
            <Wand2 size={12} />
            <span>{ar ? "تطبيق" : "Apply"}</span>
          </button>
        </div>
      </div>

      {/* Day Rows */}
      <div className="cirsched-list">
        {rows.map((row) => {
          const dayLabel = weekdayLabel(row.day, ar);

          return (
            <div key={row.day} className={`cirsched-row ${row.enabled ? "is-on" : "is-off"}`}>
              {/* Toggle + Day Name */}
              <div className="cirsched-toggle-cell">
                <button
                  type="button"
                  onClick={() => handleToggle(row.day, !row.enabled)}
                  className={`cirsched-check ${row.enabled ? "active" : ""}`}
                  disabled={disabled}
                >
                  {row.enabled ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <span className="cirsched-day-name">{dayLabel}</span>
              </div>

              {/* Controls */}
              <div className="cirsched-controls-cell">
                {row.enabled ? (
                  <div className="cirsched-controls-inner">
                    {/* Mode Switch */}
                    <div className="cirsched-mode-pill">
                      <button
                        type="button"
                        className={row.mode === "CLOCK" ? "active" : ""}
                        onClick={() => handleModeChange(row.day, "CLOCK")}
                        disabled={disabled}
                      >
                        {ar ? "ساعة" : "Clock"}
                      </button>
                      <button
                        type="button"
                        className={row.mode === "PRAYER" ? "active" : ""}
                        onClick={() => handleModeChange(row.day, "PRAYER")}
                        disabled={disabled}
                      >
                        {ar ? "صلاة" : "Prayer"}
                      </button>
                    </div>

                    {/* Time / Prayer Pickers */}
                    <div className="cirsched-pickers">
                      {row.mode === "CLOCK" ? (
                        <>
                          <input
                            type="time"
                            className="cirsched-time"
                            value={row.fromTime}
                            onChange={(e) => handleFromTimeChange(row.day, e.target.value)}
                            disabled={disabled}
                          />
                          <ArrowIcon size={10} className="cirsched-arrow" />
                          <input
                            type="time"
                            className="cirsched-time"
                            value={row.toTime}
                            onChange={(e) =>
                              updateRow(row.day, (prev) => ({ ...prev, toTime: e.target.value }))
                            }
                            disabled={disabled}
                          />
                        </>
                      ) : (
                        <>
                          <select
                            className="cirsched-sel"
                            value={row.fromPrayer}
                            onChange={(e) =>
                              updateRow(row.day, (prev) => ({
                                ...prev,
                                fromPrayer: e.target.value as PrayerName
                              }))
                            }
                            disabled={disabled}
                          >
                            {PRAYER_ORDER.map((prayer) => (
                              <option key={prayer} value={prayer}>
                                {prayerLabel(prayer, ar)}
                              </option>
                            ))}
                          </select>
                          <ArrowIcon size={10} className="cirsched-arrow" />
                          <select
                            className="cirsched-sel"
                            value={row.toPrayer}
                            onChange={(e) =>
                              updateRow(row.day, (prev) => ({
                                ...prev,
                                toPrayer: e.target.value as PrayerName
                              }))
                            }
                            disabled={disabled}
                          >
                            {PRAYER_ORDER.map((prayer) => (
                              <option key={prayer} value={prayer}>
                                {prayerLabel(prayer, ar)}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>

                    {/* Copy button */}
                    <button
                      type="button"
                      className="cirsched-copy"
                      onClick={() => copyToEnabledDays(row)}
                      disabled={disabled}
                      title={ar ? "نسخ للكل" : "Copy to all"}
                    >
                      <CopyPlus size={12} />
                    </button>
                  </div>
                ) : (
                  <span className="cirsched-off-label">
                    {ar ? "إجازة" : "Off"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default CircleScheduleEditor;
