import { useState } from "react";
import {
  Building2,
  Info,
  Save,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  X,
  Settings
} from "lucide-react";
import { useI18n } from "../app/i18n";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import ImageUploadField from "../components/ui/ImageUploadField";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthStore } from "../features/auth/auth.store";
import { useOrgBrandingQuery, useUpdateOrgBrandingMutation } from "../features/org/org.hooks";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import { notifyError, notifySuccess } from "../shared/ui/feedback";
import ForbiddenPage from "./ForbiddenPage";
import "../styles/pages/settings-v2.css";

const APP_VERSION = "v2.0.0";

type SettingsDraft = {
  name: string;
  logoUrl: string;
  description: string;
  address: string;
  phone: string;
  email: string;
};

const formatDateTime = (value: string | null | undefined, locale: "ar-SA-u-nu-latn" | "en-US"): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function SettingsPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const locale = ar ? "ar-SA-u-nu-latn" : "en-US";

  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);

  // Authorization: General Manager (SUPER_ADMIN) only
  if (authUser?.role !== "SUPER_ADMIN") {
    return <ForbiddenPage />;
  }

  const brandingQ = useOrgBrandingQuery();
  const updateBrandingM = useUpdateOrgBrandingMutation();

  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [savedSettings, setSavedSettings] = useState<SettingsDraft | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize baseline settings from fetched data
  const baseline = savedSettings ?? {
    name: brandingQ.data?.name ?? "",
    logoUrl: brandingQ.data?.logoUrl ?? "",
    description: brandingQ.data?.description ?? "",
    address: brandingQ.data?.address ?? "",
    phone: brandingQ.data?.phone ?? "",
    email: brandingQ.data?.email ?? ""
  };

  const current = draft ?? baseline;

  // Check if any actual edits are present
  const hasChanges =
    current.name.trim() !== baseline.name.trim() ||
    current.logoUrl.trim() !== baseline.logoUrl.trim() ||
    current.description.trim() !== baseline.description.trim() ||
    current.address.trim() !== baseline.address.trim() ||
    current.phone.trim() !== baseline.phone.trim() ||
    current.email.trim() !== baseline.email.trim();

  const handleFieldChange = (key: keyof SettingsDraft, val: string) => {
    setDraft({
      ...current,
      [key]: val
    });
  };

  // Form Validations
  const validateForm = (): boolean => {
    if (!current.name.trim()) {
      setValidationError(ar ? "اسم الجمعية حقل إلزامي." : "Organization name is required.");
      return false;
    }
    if (current.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(current.email.trim())) {
        setValidationError(ar ? "صيغة البريد الإلكتروني غير صالحة." : "Invalid email format.");
        return false;
      }
    }
    if (current.phone.trim()) {
      const phoneRegex = /^[+0-9\s()-.]{3,32}$/;
      if (!phoneRegex.test(current.phone.trim())) {
        setValidationError(ar ? "رقم الهاتف غير صالح." : "Invalid phone number.");
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setValidationError(null);
      const updated = await updateBrandingM.mutateAsync({
        name: current.name.trim(),
        logoUrl: current.logoUrl.trim() ? current.logoUrl.trim() : null,
        description: current.description.trim() ? current.description.trim() : null,
        address: current.address.trim() ? current.address.trim() : null,
        phone: current.phone.trim() ? current.phone.trim() : null,
        email: current.email.trim() ? current.email.trim() : null
      });

      const nextSettings = {
        name: updated.name ?? "",
        logoUrl: updated.logoUrl ?? "",
        description: updated.description ?? "",
        address: updated.address ?? "",
        phone: updated.phone ?? "",
        email: updated.email ?? ""
      };

      setSavedSettings(nextSettings);
      setDraft(null);

      if (authUser) {
        setAuthUser({
          ...authUser,
          organizationName: updated.name,
          organizationLogoUrl: updated.logoUrl ?? null
        });
      }
      notifySuccess(ar ? "تم حفظ إعدادات الجمعية بنجاح" : "Organization settings saved successfully");
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر حفظ الإعدادات. يرجى المحاولة مرة أخرى." : "Unable to save settings. Please try again."
      });
      setValidationError(message);
      notifyError(message);
    }
  };

  const handleCancel = () => {
    setDraft(null);
    setValidationError(null);
  };

  const lastUpdated = brandingQ.data?.updatedAt ? formatDateTime(brandingQ.data.updatedAt, locale) : "-";

  return (
    <>
      {/* Scoped styling implementing center creation modal (circlemod) layouts locally */}
      <style>{`
        /* Row & Field container alignment */
        .circlemod-row {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
          margin-bottom: 1.2rem;
          width: 100%;
        }
        .circlemod-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 0;
          flex: 1;
        }
        .circlemod-field--full {
          width: 100%;
          flex-basis: 100%;
        }
        
        /* Label spacing matching center creation form */
        .circlemod-field label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          margin-inline-start: 0.15rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        [data-theme="dark"] .circlemod-field label {
          color: #94a3b8;
        }
        
        /* Inputs styling matching CenterFormModal */
        .circlemod-input {
          height: 42px;
          padding: 0 0.9rem;
          border-radius: 10px;
          border: 1.5px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.5) !important;
          backdrop-filter: blur(8px);
          color: var(--text-primary, #1e293b);
          font-size: 0.85rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
        }
        [data-theme="dark"] .circlemod-input {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.6) !important;
        }
        .circlemod-input:focus {
          border-color: var(--primary, #0f766e);
          background: rgba(255, 255, 255, 0.8) !important;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
        }
        [data-theme="dark"] .circlemod-input:focus {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: var(--primary, #14b8a6);
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
        }
        .circlemod-input::placeholder {
          color: #94a3b8;
          font-size: 0.8rem;
        }
        
        /* Textarea styled identically to inputs but multiline */
        .circlemod-textarea {
          min-height: 104px;
          padding: 0.7rem 0.9rem;
          resize: none;
          line-height: 1.5;
        }
      `}</style>

      {/* Background aurora blobs */}
      <div className="ctr-aurora-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="page settings-page settings-modern-page relative z-10" dir="rtl">
        {/* Page Header (No GM action badge) */}
        <PageHeader
          title={ar ? "إعدادات النظام" : "System Settings"}
          description={ar ? "إدارة البيانات الأساسية للجمعية" : "Management of the basic organization data"}
          icon={<Settings className="w-6 h-6" />}
        />

        {brandingQ.isLoading ? (
          <div className="flex items-center justify-center min-h-[300px] glass-panel rounded-xl">
            <span className="text-sm text-secondary animate-pulse">
              {ar ? "جارٍ تحميل إعدادات النظام..." : "Loading system settings..."}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Beautiful restored stg-hero-panel displaying active settings (without Code chip) */}
            <section className="stg-hero-panel glass-panel flex flex-col lg:flex-row items-center justify-between gap-6 p-6">
              <div className="flex items-center gap-5 w-full lg:w-auto">
                {/* Logo Frame */}
                <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                  {current.logoUrl ? (
                    <img src={current.logoUrl} alt={current.name} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-teal-400" />
                  )}
                </div>
                {/* Text main details */}
                <div className="stg-hero-main text-right">
                  <span className="stg-hero-eyebrow">{ar ? "هوية الجمعية" : "Organization Identity"}</span>
                  <h2 className="stg-hero-title">{current.name || (ar ? "جمعية رفيق القرآن" : "Rafiq Al-Quran Society")}</h2>
                  <p className="stg-hero-description max-w-[550px] leading-relaxed">
                    {current.description || (ar ? "واجهة إعدادات البيانات الأساسية للجمعية وتفاصيل الهوية والتواصل." : "Settings workspace for basic organization profile and contact info.")}
                  </p>
                </div>
              </div>

              {/* Status Chips aligned on the left (No Code chip) */}
              <div className="stg-hero-chips flex flex-wrap gap-2 lg:flex-col lg:items-end flex-shrink-0 w-full lg:w-auto">
                {current.phone.trim() && (
                  <span className="stg-chip glass-btn">
                    <Phone className="w-4 h-4 text-teal-400" />
                    {ar ? "الهاتف:" : "Phone:"} <strong>{current.phone}</strong>
                  </span>
                )}
                {current.email.trim() && (
                  <span className="stg-chip glass-btn">
                    <Mail className="w-4 h-4 text-teal-400" />
                    {ar ? "البريد:" : "Email:"} <strong>{current.email}</strong>
                  </span>
                )}
                {current.address.trim() && (
                  <span className="stg-chip glass-btn">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    {ar ? "العنوان:" : "Address:"} <strong>{current.address}</strong>
                  </span>
                )}
              </div>
            </section>

            {/* Structured Grid Layout using system stylesheet */}
            <div className="stg-grid">
              
              {/* Card 1: بيانات الجمعية الأساسية */}
              <Card className="stg-card glass-panel">
                <CardHeader
                  title={ar ? "بيانات الجمعية الأساسية" : "Basic Organization Data"}
                  subtitle={ar ? "الاسم التعريفي ووصف الجمعية" : "Organization profile and name details"}
                  icon={Building2}
                />
                <CardContent>
                  <div className="circlemod-row">
                    <div className="circlemod-field circlemod-field--full">
                      <label htmlFor="org-name">{ar ? "اسم الجمعية" : "Organization Name"}</label>
                      <input
                        id="org-name"
                        type="text"
                        className="circlemod-input"
                        value={current.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        placeholder={ar ? "أدخل اسم الجمعية" : "Enter organization name"}
                        required
                      />
                    </div>
                  </div>

                  <div className="circlemod-row">
                    <div className="circlemod-field circlemod-field--full">
                      <label htmlFor="org-desc">{ar ? "وصف مختصر للجمعية" : "Short Description"}</label>
                      <textarea
                        id="org-desc"
                        className="circlemod-input circlemod-textarea"
                        placeholder={ar ? "أدخل وصفاً مختصراً للجمعية" : "Enter short description of the organization"}
                        value={current.description}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: شعار الجمعية (Swapped position: Basic visual elements grouped together in Row 1) */}
              <Card className="stg-card glass-panel">
                <CardHeader
                  title={ar ? "شعار الجمعية" : "Organization Logo"}
                  subtitle={ar ? "إدارة الشعار المعتمد للتقارير والواجهة" : "Logo settings for visual branding"}
                  icon={Sparkles}
                />
                <CardContent>
                  <div className="circlemod-row">
                    <div className="circlemod-field circlemod-field--full">
                      <ImageUploadField
                        label={ar ? "شعار الجمعية" : "Organization Logo"}
                        value={current.logoUrl}
                        onChange={(next) => handleFieldChange("logoUrl", next)}
                        kind="ORG_LOGO"
                        ar={ar}
                        maxSize={2 * 1024 * 1024}
                        allowedTypes={["image/png", "image/jpeg", "image/jpg", "image/webp"]}
                        helperText={
                          ar
                            ? "الأنواع المسموحة: png, jpg, jpeg, webp. الحد الأقصى للحجم: 2MB"
                            : "Allowed formats: png, jpg, jpeg, webp. Max size: 2MB"
                        }
                        previewAlt={current.name}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: بيانات التواصل (Swapped position: Technical/Contact grouped together in Row 2) */}
              <Card className="stg-card glass-panel">
                <CardHeader
                  title={ar ? "بيانات التواصل" : "Contact Information"}
                  subtitle={ar ? "العنوان الرسمي للجمعية ووسائل التواصل" : "Official address and communication coordinates"}
                  icon={Phone}
                />
                <CardContent>
                  <div className="circlemod-row">
                    <div className="circlemod-field">
                      <label htmlFor="org-phone">{ar ? "رقم الهاتف" : "Phone Number"}</label>
                      <input
                        id="org-phone"
                        type="text"
                        className="circlemod-input"
                        value={current.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        placeholder={ar ? "أدخل رقم الهاتف" : "Enter phone number"}
                      />
                    </div>

                    <div className="circlemod-field">
                      <label htmlFor="org-email">{ar ? "البريد الإلكتروني" : "Email Address"}</label>
                      <input
                        id="org-email"
                        type="email"
                        className="circlemod-input"
                        value={current.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        placeholder={ar ? "أدخل البريد الإلكتروني" : "Enter email address"}
                      />
                    </div>
                  </div>

                  <div className="circlemod-row">
                    <div className="circlemod-field circlemod-field--full">
                      <label htmlFor="org-address">{ar ? "العنوان" : "Address"}</label>
                      <input
                        id="org-address"
                        type="text"
                        className="circlemod-input"
                        value={current.address}
                        onChange={(e) => handleFieldChange("address", e.target.value)}
                        placeholder={ar ? "أدخل العنوان" : "Enter address"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: معلومات النظام (Without Organization Code row) */}
              <Card className="stg-card glass-panel">
                <CardHeader
                  title={ar ? "معلومات النظام" : "System Information"}
                  subtitle={ar ? "تفاصيل تقنية وعامة عن بيئة تشغيل رفقاء القرآن" : "Technical diagnostics and application meta"}
                  icon={Info}
                />
                <CardContent>
                  <div className="stg-meta-list">
                    <div className="stg-meta-row">
                      <span>{ar ? "اسم النظام" : "System Name"}</span>
                      <strong>{ar ? "رفيق القرآن" : "Rafiq Al-Quran"}</strong>
                    </div>
                    <div className="stg-meta-row">
                      <span>{ar ? "الإصدار الحالي" : "Current Version"}</span>
                      <strong className="stg-version-badge">{APP_VERSION}</strong>
                    </div>
                    <div className="stg-meta-row">
                      <span>{ar ? "آخر تحديث للبيانات" : "Last Updated"}</span>
                      <strong>{lastUpdated}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Error alerts if any */}
            {validationError && (
              <div className="stg-inline-error flex items-center justify-between gap-3 animate-fade-in">
                <span>{validationError}</span>
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="p-1 hover:bg-black/10 rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Bar */}
            {hasChanges && (
              <div className="flex justify-end items-center gap-3 p-4 glass-panel rounded-xl animate-fade-in mt-4">
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={updateBrandingM.isPending}
                >
                  {ar ? "إلغاء التغييرات" : "Cancel Changes"}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={() => void handleSave()}
                  isLoading={updateBrandingM.isPending}
                >
                  {ar ? "حفظ التغييرات" : "Save Changes"}
                </Button>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}

export default SettingsPage;
