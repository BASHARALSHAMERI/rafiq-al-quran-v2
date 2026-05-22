import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Clock3,
  Globe,
  Info,
  MapPin,
  Plus,
  Save,
  Shield,
  Trash2
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { notifyError, notifySuccess } from "../../../shared/ui/feedback";
import type { AttendanceHolidayPeriod } from "../staff-attendance.api";
import { useAttendancePolicy, useUpdatePolicy } from "../staff-attendance.api";

const ALL_DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
] as const;

type WeekdayValue = (typeof ALL_DAYS)[number];
type GeoMode = "REQUIRED" | "OPTIONAL";

type HolidayRow = AttendanceHolidayPeriod & { id: string };

type PolicyFormState = {
  gracePeriodMinutes: number;
  autoAbsenceDelayMinutes: number;
  weekendDays: WeekdayValue[];
  holidays: HolidayRow[];
  geoEnforcement: GeoMode;
  timezone: string;
  defaultShiftHours: string;
  earlyDepartureThresholdMinutes: number;
  prayerApiSource: string;
};

const DAY_LABELS: Record<WeekdayValue, { ar: string; en: string }> = {
  SUNDAY: { ar: "الأحد", en: "Sunday" },
  MONDAY: { ar: "الاثنين", en: "Monday" },
  TUESDAY: { ar: "الثلاثاء", en: "Tuesday" },
  WEDNESDAY: { ar: "الأربعاء", en: "Wednesday" },
  THURSDAY: { ar: "الخميس", en: "Thursday" },
  FRIDAY: { ar: "الجمعة", en: "Friday" },
  SATURDAY: { ar: "السبت", en: "Saturday" }
};

const DEFAULT_FORM: PolicyFormState = {
  gracePeriodMinutes: 15,
  autoAbsenceDelayMinutes: 60,
  weekendDays: ["FRIDAY", "SATURDAY"],
  holidays: [],
  geoEnforcement: "OPTIONAL",
  timezone: "Asia/Riyadh",
  defaultShiftHours: "2",
  earlyDepartureThresholdMinutes: 15,
  prayerApiSource: "ALADHAN"
};

const PRAYER_SOURCE_OPTIONS = [
  { value: "ALADHAN", ar: "الأذان (AlAdhan)", en: "AlAdhan" },
  { value: "UMM_AL_QURA", ar: "أم القرى (Umm Al-Qura)", en: "Umm Al-Qura" },
  { value: "MWL", ar: "رابطة العالم الإسلامي (MWL)", en: "Muslim World League (MWL)" },
  { value: "ISNA", ar: "تقويم أمريكا الشمالية (ISNA)", en: "Islamic Society of North America (ISNA)" },
  { value: "EGYPTIAN", ar: "الهيئة المصرية العامة للمساحة", en: "Egyptian General Authority of Survey" }
] as const;

const TIMEZONE_OPTIONS = [
  { value: "Asia/Riyadh", ar: "آسيا/الرياض (السعودية)", en: "Asia/Riyadh (Saudi Arabia)" },
  { value: "Asia/Dubai", ar: "آسيا/دبي (الإمارات)", en: "Asia/Dubai (United Arab Emirates)" },
  { value: "Asia/Baghdad", ar: "آسيا/بغداد (العراق)", en: "Asia/Baghdad (Iraq)" },
  { value: "Asia/Amman", ar: "آسيا/عمّان (الأردن)", en: "Asia/Amman (Jordan)" },
  { value: "Asia/Beirut", ar: "آسيا/بيروت (لبنان)", en: "Asia/Beirut (Lebanon)" },
  { value: "Asia/Damascus", ar: "آسيا/دمشق (سوريا)", en: "Asia/Damascus (Syria)" },
  { value: "Africa/Cairo", ar: "أفريقيا/القاهرة (مصر)", en: "Africa/Cairo (Egypt)" },
  { value: "Asia/Qatar", ar: "آسيا/الدوحة (قطر)", en: "Asia/Qatar (Qatar)" },
  { value: "Asia/Kuwait", ar: "آسيا/الكويت (الكويت)", en: "Asia/Kuwait (Kuwait)" },
  { value: "Asia/Muscat", ar: "آسيا/مسقط (عمان)", en: "Asia/Muscat (Oman)" },
  { value: "Asia/Aden", ar: "آسيا/عدن (اليمن)", en: "Asia/Aden (Yemen)" }
] as const;

const localizedOptions = (
  options: ReadonlyArray<{ value: string; ar: string; en: string }>,
  value: string,
  ar: boolean
) => {
  const selectOptions = options.map((option) => ({
    value: option.value,
    label: ar ? option.ar : option.en
  }));

  if (value && !options.some((option) => option.value === value)) {
    selectOptions.push({
      value,
      label: ar ? `${value} (قيمة محفوظة)` : `${value} (saved value)`
    });
  }

  return selectOptions;
};

const createHolidayRow = (seed?: Partial<AttendanceHolidayPeriod>): HolidayRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  reason: seed?.reason ?? "",
  startDate: seed?.startDate ?? "",
  endDate: seed?.endDate ?? ""
});

const normalizeHoursInput = (value: string) => value.replace(/[^\d.]/g, "");

function PolicyTooltip({ text }: { text: string }) {
  return (
    <span className="staff-ops-policy-tooltip">
      <button
        type="button"
        className="staff-ops-policy-tooltip__trigger"
        aria-label={text}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      <span className="staff-ops-policy-tooltip__bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function PolicyFieldLabel({
  label,
  hint,
  trailing
}: {
  label: string;
  hint: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="staff-ops-policy-field__label">
      <span>
        {label}
        <PolicyTooltip text={hint} />
      </span>
      {trailing}
    </div>
  );
}

export function AttendancePolicySettings() {
  const { language } = useI18n();
  const ar = language === "ar";

  const policyQuery = useAttendancePolicy();
  const updatePolicy = useUpdatePolicy();
  const policy = policyQuery.data;

  const [form, setForm] = useState<PolicyFormState>(DEFAULT_FORM);

  useEffect(() => {
    if (!policy) {
      return;
    }

    setForm({
      gracePeriodMinutes: policy.gracePeriodMinutes,
      autoAbsenceDelayMinutes: policy.autoAbsenceDelayMinutes,
      weekendDays: (policy.weekendDays ?? DEFAULT_FORM.weekendDays) as WeekdayValue[],
      holidays: (policy.holidays ?? []).map((holiday) => createHolidayRow(holiday)),
      geoEnforcement: policy.geoEnforcement,
      timezone: policy.timezone,
      defaultShiftHours: String(policy.defaultShiftDurationMinutes / 60),
      earlyDepartureThresholdMinutes: policy.earlyDepartureThresholdMinutes,
      prayerApiSource: policy.prayerApiSource
    });
  }, [policy]);

  const shiftMinutes = useMemo(() => {
    const numericHours = Number(form.defaultShiftHours);
    if (!Number.isFinite(numericHours) || numericHours <= 0) {
      return 0;
    }
    return Math.round(numericHours * 60);
  }, [form.defaultShiftHours]);

  const workdaysPreview = useMemo(
    () =>
      ALL_DAYS.filter((day) => !form.weekendDays.includes(day)).map((day) =>
        ar ? DAY_LABELS[day].ar : DAY_LABELS[day].en
      ),
    [ar, form.weekendDays]
  );

  const timezoneOptions = useMemo(
    () => localizedOptions(TIMEZONE_OPTIONS, form.timezone, ar),
    [ar, form.timezone]
  );

  const prayerSourceOptions = useMemo(
    () => localizedOptions(PRAYER_SOURCE_OPTIONS, form.prayerApiSource, ar),
    [ar, form.prayerApiSource]
  );

  const setField = <T extends keyof PolicyFormState>(key: T, value: PolicyFormState[T]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateHoliday = (id: string, patch: Partial<HolidayRow>) => {
    setForm((current) => ({
      ...current,
      holidays: current.holidays.map((holiday) =>
        holiday.id === id ? { ...holiday, ...patch } : holiday
      )
    }));
  };

  const addHoliday = () => {
    setForm((current) => ({
      ...current,
      holidays: [...current.holidays, createHolidayRow()]
    }));
  };

  const removeHoliday = (id: string) => {
    setForm((current) => ({
      ...current,
      holidays: current.holidays.filter((holiday) => holiday.id !== id)
    }));
  };

  const toggleWeekend = (day: WeekdayValue) => {
    setForm((current) => ({
      ...current,
      weekendDays: current.weekendDays.includes(day)
        ? current.weekendDays.filter((item) => item !== day)
        : [...current.weekendDays, day]
    }));
  };

  const handleSave = () => {
    if (!shiftMinutes || shiftMinutes < 30) {
      notifyError(
        ar
          ? "أدخل الوقت المعتمد للوردية بالساعات على أن لا يقل عن نصف ساعة."
          : "Enter the default shift time in hours, minimum 0.5 hour."
      );
      return;
    }

    const invalidHoliday = form.holidays.find(
      (holiday) =>
        !holiday.reason.trim() ||
        !holiday.startDate ||
        !holiday.endDate ||
        holiday.endDate < holiday.startDate
    );

    if (invalidHoliday) {
      notifyError(
        ar
          ? "أكمل بيانات العطلات الرسمية: الاسم أو السبب، من، إلى."
          : "Complete each holiday row with reason, start date, and end date."
      );
      return;
    }

    updatePolicy.mutate(
      {
        gracePeriodMinutes: form.gracePeriodMinutes,
        autoAbsenceDelayMinutes: form.autoAbsenceDelayMinutes,
        weekendDays: form.weekendDays,
        holidays: form.holidays.map(({ reason, startDate, endDate }) => ({
          reason: reason.trim(),
          startDate,
          endDate
        })),
        geoEnforcement: form.geoEnforcement,
        timezone: form.timezone.trim(),
        defaultShiftDurationMinutes: shiftMinutes,
        earlyDepartureThresholdMinutes: form.earlyDepartureThresholdMinutes,
        prayerApiSource: form.prayerApiSource.trim().toUpperCase()
      },
      {
        onSuccess: () =>
          notifySuccess(ar ? "تم حفظ السياسة بنجاح" : "Policy saved successfully"),
        onError: () =>
          notifyError(ar ? "تعذر حفظ السياسة. يرجى المحاولة مرة أخرى." : "Unable to save the policy. Please try again.")
      }
    );
  };

  if (policyQuery.isError) {
    return (
      <ErrorState
        title={ar ? "تعذر تحميل سياسة الحضور" : "Unable to load attendance policy"}
        description={
          ar
            ? "حدث خطأ أثناء جلب إعدادات سياسة الحضور."
            : "An error occurred while loading the attendance policy."
        }
        onRetry={() => void policyQuery.refetch()}
        retryLabel={ar ? "إعادة المحاولة" : "Retry"}
      />
    );
  }

  if (policyQuery.isLoading) {
    return (
      <section className="staff-ops-view">
        <div className="staff-ops-settings-skeleton">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="staff-ops-skeleton-block" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="staff-ops-view staff-ops-policy-page">
      <div className="staff-ops-settings-header staff-ops-settings-header--hero">
        <div className="staff-ops-settings-header__copy">
          <div className="staff-ops-settings-header__title">
            <Shield className="w-5 h-5" />
            <h2>{ar ? "سياسة الحضور" : "Attendance Policy"}</h2>
          </div>
        </div>
        <div className="staff-ops-actions">
          <Badge variant="warning" size="sm">
            {ar ? "للمشرف العام فقط" : "SUPER_ADMIN only"}
          </Badge>
        </div>
      </div>

      <div className="staff-ops-policy-main">
          <div className="staff-ops-policy-compact-grid">
            <div className="staff-ops-settings-card">
              <div className="staff-ops-settings-card__header">
                <Clock3 className="w-4 h-4" />
                <span>{ar ? "أوقات الانضباط" : "Timing Rules"}</span>
              </div>

              <div className="staff-ops-policy-field">
                <PolicyFieldLabel
                  label={ar ? "فترة السماح" : "Grace Period"}
                  hint={
                    ar
                      ? "عدد الدقائق المسموح بها بعد بداية الوردية قبل تسجيل الموظف كمتأخر."
                      : "Minutes allowed after shift start before the employee is marked late."
                  }
                />
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={String(form.gracePeriodMinutes)}
                  onChange={(event) => setField("gracePeriodMinutes", Number(event.target.value || 0))}
                />
              </div>

              <div className="staff-ops-policy-field">
                <PolicyFieldLabel
                  label={ar ? "الغياب التلقائي" : "Auto Absence Delay"}
                  hint={
                    ar
                      ? "بعد هذا التأخير من بداية الوردية، وإذا لم يسجل حضور، تتحول الحالة تلقائياً إلى غياب."
                      : "After this delay from shift start, a missing check-in is converted to absence automatically."
                  }
                />
                <Input
                  type="number"
                  min={0}
                  max={180}
                  value={String(form.autoAbsenceDelayMinutes)}
                  onChange={(event) =>
                    setField("autoAbsenceDelayMinutes", Number(event.target.value || 0))
                  }
                />
              </div>

              <div className="staff-ops-policy-field">
                <PolicyFieldLabel
                  label={ar ? "حد الانصراف المبكر" : "Early Departure Threshold"}
                  hint={
                    ar
                      ? "إذا خرج الموظف قبل نهاية الوردية بهذا الفارق أو أكثر، يسجل انصرافاً مبكراً."
                      : "Leaving this many minutes early or more marks the record as early departure."
                  }
                />
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={String(form.earlyDepartureThresholdMinutes)}
                  onChange={(event) =>
                    setField("earlyDepartureThresholdMinutes", Number(event.target.value || 0))
                  }
                />
              </div>

              <div className="staff-ops-policy-field">
                <PolicyFieldLabel
                  label={ar ? "الوقت المعتمد للوردية" : "Default Shift Time"}
                  hint={
                    ar
                      ? "مدة مرجعية تستخدم عندما لا توجد وردية مفصلة للموظف. تدخل بالساعات ويحتسبها النظام بالدقائق."
                      : "Fallback shift duration used when no detailed schedule exists. Enter hours and the system stores minutes."
                  }
                  trailing={
                    <Badge variant="info" size="sm">
                      {shiftMinutes} {ar ? "دقيقة" : "min"}
                    </Badge>
                  }
                />
                <Input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={form.defaultShiftHours}
                  onChange={(event) => setField("defaultShiftHours", normalizeHoursInput(event.target.value))}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="staff-ops-settings-card">
              <div className="staff-ops-settings-card__header">
                <MapPin className="w-4 h-4" />
                <span>{ar ? "إعدادات التشغيل" : "Operational Settings"}</span>
              </div>

              <div className="staff-ops-policy-field">
                <PolicyFieldLabel
                  label={ar ? "التحقق من الموقع" : "Geo Enforcement"}
                  hint={
                    ar
                      ? "إلزامي يعني أن الحضور يحتاج تحقق موقع، واختياري يعني السماح بالتسجيل مع تنبيه فقط."
                      : "Required means attendance needs location verification. Optional means the system only warns."
                  }
                />
                <Select
                  value={form.geoEnforcement}
                  onChange={(event) =>
                    setField("geoEnforcement", event.target.value as PolicyFormState["geoEnforcement"])
                  }
                  options={[
                    { value: "REQUIRED", label: ar ? "إلزامي" : "Required" },
                    { value: "OPTIONAL", label: ar ? "اختياري" : "Optional" }
                  ]}
                />
              </div>

              <div className="staff-ops-policy-field">
                <PolicyFieldLabel
                  label={ar ? "المنطقة الزمنية" : "Timezone"}
                  hint={
                    ar
                      ? "اختر المنطقة الزمنية التي يعتمد عليها حساب يوم الحضور وبداية الورديات."
                      : "Choose the timezone used to calculate attendance days and shift boundaries."
                  }
                />
                <Select
                  value={form.timezone}
                  onChange={(event) => setField("timezone", event.target.value)}
                  leftIcon={<Globe className="w-4 h-4" />}
                  options={timezoneOptions}
                />
              </div>

              <div className="staff-ops-policy-field">
                <PolicyFieldLabel
                  label={ar ? "مصدر المواقيت" : "Prayer API Source"}
                  hint={
                    ar
                      ? "المصدر المرجعي لمواقيت الصلاة عند استخدام ورديات مرتبطة بالمواقيت."
                      : "Reference source for prayer times when schedules depend on them."
                  }
                />
                <Select
                  value={form.prayerApiSource}
                  onChange={(event) => setField("prayerApiSource", event.target.value)}
                  options={prayerSourceOptions}
                />
              </div>

              <div className="staff-ops-policy-field">
                <PolicyFieldLabel
                  label={ar ? "أيام العمل" : "Working Days"}
                  hint={
                    ar
                      ? "الأيام غير المحددة كعطلة أسبوعية تعتبر أيام عمل."
                      : "Any day not marked as weekend is treated as a working day."
                  }
                />
                <div className="staff-ops-policy-calendar-note">
                  <span>{workdaysPreview.join(ar ? "، " : ", ")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="staff-ops-settings-card staff-ops-settings-card--wide">
            <div className="staff-ops-settings-card__header">
              <CalendarRange className="w-4 h-4" />
              <span>{ar ? "العطلات الرسمية وأيام الإغلاق" : "Official Holidays"}</span>
            </div>

            <div className="staff-ops-policy-field">
              <PolicyFieldLabel
                label={ar ? "عطلة نهاية الأسبوع" : "Weekend Days"}
                hint={
                  ar
                    ? "حدد الأيام الأسبوعية التي تعتبر عطلة ثابتة ولا تحسب كيوم عمل."
                    : "Select the weekly days that are treated as recurring non-working days."
                }
              />
              <div className="staff-ops-weekend-grid">
                {ALL_DAYS.map((day) => {
                  const selected = form.weekendDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`staff-ops-day-chip ${selected ? "staff-ops-day-chip--active" : ""}`}
                      onClick={() => toggleWeekend(day)}
                    >
                      <span>{ar ? DAY_LABELS[day].ar : DAY_LABELS[day].en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="staff-ops-policy-field">
              <PolicyFieldLabel
                label={ar ? "سجل العطلات الرسمية" : "Holiday Register"}
                hint={
                  ar
                    ? "أدخل اسم أو سبب العطلة ثم حدد تاريخ البداية والنهاية. مثال: عطلة عيد الأضحى."
                    : "Enter the holiday reason or name, then define its start and end dates. Example: Eid Al-Adha."
                }
                trailing={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={addHoliday}
                  >
                    {ar ? "إضافة عطلة" : "Add Holiday"}
                  </Button>
                }
              />

              {form.holidays.length === 0 ? (
                <div className="staff-ops-policy-empty">
                  {ar ? "لا توجد عطلات رسمية مسجلة حالياً." : "No official holidays have been added yet."}
                </div>
              ) : (
                <div className="staff-ops-policy-holidays">
                  {form.holidays.map((holiday) => (
                    <div key={holiday.id} className="staff-ops-policy-holiday-row">
                      <div className="staff-ops-policy-holiday-row__main">
                        <Input
                          value={holiday.reason}
                          onChange={(event) => updateHoliday(holiday.id, { reason: event.target.value })}
                          placeholder={ar ? "سبب / اسم العطلة" : "Holiday reason / name"}
                        />
                        <Input
                          type="date"
                          value={holiday.startDate}
                          onChange={(event) => updateHoliday(holiday.id, { startDate: event.target.value })}
                        />
                        <Input
                          type="date"
                          value={holiday.endDate}
                          onChange={(event) => updateHoliday(holiday.id, { endDate: event.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        className="staff-ops-policy-holiday-row__remove"
                        onClick={() => removeHoliday(holiday.id)}
                        aria-label={ar ? "حذف العطلة" : "Remove holiday"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="staff-ops-settings-footer">
            <Button
              type="button"
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSave}
              isLoading={updatePolicy.isPending}
            >
              {ar ? "حفظ السياسة" : "Save Policy"}
            </Button>
          </div>
      </div>
    </section>
  );
}
