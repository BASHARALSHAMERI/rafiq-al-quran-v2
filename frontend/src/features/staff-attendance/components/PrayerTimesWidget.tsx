import React from "react";
import { usePrayerTimes } from "../staff-attendance.api";
import { Clock, Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { useTimeFormat, fmtClockTime } from "../../../shared/utils/time-format";

interface PrayerTimesWidgetProps {
  centerId: number;
  date?: string;
  ar?: boolean;
}

const PRAYER_CONFIG = [
  { key: "fajr" as const, labelAr: "الفجر", labelEn: "Fajr", icon: Sunrise, color: "text-sky-400" },
  { key: "dhuhr" as const, labelAr: "الظهر", labelEn: "Dhuhr", icon: Sun, color: "text-amber-400" },
  { key: "asr" as const, labelAr: "العصر", labelEn: "Asr", icon: Sun, color: "text-orange-400" },
  { key: "maghrib" as const, labelAr: "المغرب", labelEn: "Maghrib", icon: Sunset, color: "text-rose-400" },
  { key: "isha" as const, labelAr: "العشاء", labelEn: "Isha", icon: Moon, color: "text-indigo-400" }
];

export const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({ centerId, date, ar = true }) => {
  const { data: times, isLoading, error } = usePrayerTimes(centerId, date);
  const { hour12 } = useTimeFormat();
  const locale = ar ? "ar-SA-u-nu-latn" : "en-US";

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-3 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className="text-teal-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {ar ? "أوقات الصلاة" : "Prayer Times"}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !times) {
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <span className="text-[11px] text-slate-400">
            {ar ? "غير متوفر — تأكد من إدخال إحداثيات المركز" : "Not available — ensure center has GPS coordinates"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <Clock size={14} className="text-teal-500" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {ar ? "أوقات الصلاة" : "Prayer Times"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {PRAYER_CONFIG.map((prayer) => {
          const time = times[prayer.key];
          const Icon = prayer.icon;
          return (
            <div
              key={prayer.key}
              className="flex flex-col items-center gap-1 rounded-lg bg-slate-50/80 dark:bg-slate-700/40 p-1.5 border border-slate-100 dark:border-slate-600/30"
            >
              <Icon size={13} className={prayer.color} />
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {ar ? prayer.labelAr : prayer.labelEn}
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">
                {time ? fmtClockTime(time, locale, hour12) : "--:--"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
