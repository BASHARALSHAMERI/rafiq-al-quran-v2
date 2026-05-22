import { useState } from "react";
import {
  Building2,
  Info,
  Moon,
  Palette,
  PanelsTopLeft,
  Save,
  Settings,
  ShieldCheck,
  Sun
} from "lucide-react";
import { useI18n } from "../app/i18n";
import { useUiStore } from "../app/ui.store";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import Input from "../components/ui/Input";
import ImageUploadField from "../components/ui/ImageUploadField";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthStore } from "../features/auth/auth.store";
import { useOrgBrandingQuery, useUpdateOrgBrandingMutation } from "../features/org/org.hooks";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import { notifyError, notifySuccess } from "../shared/ui/feedback";
import "../styles/pages/settings-v2.css";

const APP_VERSION = "v2.0.0";

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

  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const canEditBranding = authUser?.role === "SUPER_ADMIN";

  const brandingQ = useOrgBrandingQuery();
  const updateBrandingM = useUpdateOrgBrandingMutation();

  const [brandingDraft, setBrandingDraft] = useState<{ name: string; logoUrl: string } | null>(null);
  const [savedBranding, setSavedBranding] = useState<{ name: string; logoUrl: string } | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  const baselineBranding = savedBranding ?? {
    name: brandingQ.data?.name ?? "",
    logoUrl: brandingQ.data?.logoUrl ?? ""
  };
  const currentBranding = brandingDraft ?? baselineBranding;
  const brandName = currentBranding.name;
  const brandLogoUrl = currentBranding.logoUrl;
  const initialName = baselineBranding.name;
  const initialLogo = baselineBranding.logoUrl;
  const hasBrandingChanges =
    brandName.trim() !== initialName.trim() || brandLogoUrl.trim() !== initialLogo.trim();

  const organizationName =
    brandingQ.data?.name ??
    authUser?.organizationName ??
    (ar ? "جمعية رفيق القرآن" : "Rafiq Al-Quran Society");
  const organizationCode = brandingQ.data?.code ?? "-";
  const themeLabel = theme === "light" ? (ar ? "فاتح" : "Light") : (ar ? "داكن" : "Dark");
  const sidebarLabel = sidebarCollapsed
    ? ar
      ? "مطوي"
      : "Collapsed"
    : ar
      ? "موسع"
      : "Expanded";

  const submitBranding = async () => {
    const trimmedName = brandName.trim();
    if (!trimmedName) {
      setBrandingError(ar ? "اسم الجمعية مطلوب." : "Organization name is required.");
      return;
    }

    try {
      setBrandingError(null);
      const updated = await updateBrandingM.mutateAsync({
        name: trimmedName,
        logoUrl: brandLogoUrl.trim() ? brandLogoUrl.trim() : null
      });

      setSavedBranding({
        name: updated.name ?? "",
        logoUrl: updated.logoUrl ?? ""
      });
      setBrandingDraft(null);

      if (authUser) {
        setAuthUser({
          ...authUser,
          organizationName: updated.name,
          organizationLogoUrl: updated.logoUrl ?? null
        });
      }
      notifySuccess(ar ? "تم حفظ الهوية المؤسسية بنجاح" : "Organization branding saved successfully");
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر حفظ بيانات الجمعية. يرجى المحاولة مرة أخرى." : "Unable to save organization branding. Please try again."
      });
      setBrandingError(message);
      notifyError(message);
      return;
    }
  };

  return (
    <div className="page settings-page settings-modern-page">
      <PageHeader
        title={ar ? "إعدادات النظام" : "System Settings"}
        description={ar ? "هوية الجمعية وتفضيلات العرض" : "Organization branding and display preferences"}
        icon={<Settings className="w-6 h-6" />}
        actions={
          <div className={`stg-access-badge ${canEditBranding ? "is-open" : "is-readonly"}`}>
            <ShieldCheck className="w-4 h-4" />
            <span>
              {canEditBranding
                ? ar
                  ? "صلاحية تعديل كاملة"
                  : "Full edit access"
                : ar
                  ? "عرض فقط"
                  : "Read only"}
            </span>
          </div>
        }
      />

      <section className="stg-hero-panel">
        <div className="stg-hero-main">
          <span className="stg-hero-eyebrow">{ar ? "هوية الجمعية" : "Organization Identity"}</span>
          <h2 className="stg-hero-title">{organizationName}</h2>
          <p className="stg-hero-description">
            {ar
              ? "واجهة إعدادات حديثة تساعدك على ضبط الشكل العام للنظام والبيانات المؤسسية بسرعة."
              : "A modern settings workspace to control visual identity and core organization data quickly."}
          </p>
        </div>
        <div className="stg-hero-chips">
          <span className="stg-chip">
            <Building2 className="w-4 h-4" />
            {ar ? "رمز الجمعية:" : "Code:"} <strong>{organizationCode}</strong>
          </span>
          <span className="stg-chip">
            <Palette className="w-4 h-4" />
            {ar ? "النمط:" : "Theme:"} <strong>{themeLabel}</strong>
          </span>
          <span className="stg-chip">
            <PanelsTopLeft className="w-4 h-4" />
            {ar ? "القائمة:" : "Sidebar:"} <strong>{sidebarLabel}</strong>
          </span>
        </div>
      </section>

      <section className="stg-quick-grid">
        <article className="stg-quick-card">
          <div className="stg-quick-icon stg-quick-icon--theme">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <p className="stg-quick-label">{ar ? "وضع الواجهة" : "Interface Mode"}</p>
            <p className="stg-quick-value">{themeLabel}</p>
          </div>
        </article>

        <article className="stg-quick-card">
          <div className="stg-quick-icon stg-quick-icon--layout">
            <PanelsTopLeft className="w-4 h-4" />
          </div>
          <div>
            <p className="stg-quick-label">{ar ? "حالة الشريط الجانبي" : "Sidebar State"}</p>
            <p className="stg-quick-value">{sidebarLabel}</p>
          </div>
        </article>

        <article className="stg-quick-card">
          <div className="stg-quick-icon stg-quick-icon--role">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="stg-quick-label">{ar ? "مستوى الصلاحية" : "Permission Level"}</p>
            <p className="stg-quick-value">
              {canEditBranding
                ? ar
                  ? "مدير النظام"
                  : "Super Admin"
                : ar
                  ? "مستخدم إداري"
                  : "Administrative user"}
            </p>
          </div>
        </article>
      </section>

      <div className="stg-grid">
        <Card className="stg-card stg-card--branding">
          <CardHeader
            title={ar ? "الهوية المؤسسية" : "Organization Branding"}
            subtitle={
              ar
                ? "حدّث اسم الجمعية والشعار ليظهر في جميع الصفحات والتقارير."
                : "Update organization name and logo for all pages and reports."
            }
            icon={Building2}
            action={
              <span className={`stg-role-pill ${canEditBranding ? "is-editable" : "is-locked"}`}>
                {canEditBranding ? (ar ? "قابل للتعديل" : "Editable") : ar ? "مقفل" : "Locked"}
              </span>
            }
          />
          <CardContent>
            <div className="stg-form-stack">
              <Input
                label={ar ? "اسم الجمعية" : "Organization Name"}
                value={brandName}
                onChange={(event) =>
                  setBrandingDraft({
                    ...currentBranding,
                    name: event.target.value
                  })
                }
                placeholder={ar ? "مثال: جمعية رفيق القرآن" : "Example: Rafiq Al-Quran Society"}
                disabled={!canEditBranding}
              />

              <ImageUploadField
                label={ar ? "شعار الجمعية" : "Organization Logo"}
                value={brandLogoUrl}
                onChange={(next) =>
                  setBrandingDraft({
                    ...currentBranding,
                    logoUrl: next
                  })
                }
                kind="ORG_LOGO"
                ar={ar}
                disabled={!canEditBranding}
                helperText={
                  ar
                    ? "اختر صورة من الجهاز وسيتم رفعها مباشرة."
                    : "Choose an image from your device and it will upload instantly."
                }
                previewAlt={brandName || organizationName}
              />

              {brandLogoUrl.trim() ? (
                <div className="stg-logo-preview">
                  <div className="stg-logo-preview__image">
                    <img
                      src={brandLogoUrl}
                      alt={brandName || organizationName}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        (event.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="stg-logo-preview__meta">
                    <span className="stg-logo-preview__title">{brandName || organizationName}</span>
                    <span className="stg-logo-preview__sub">{organizationCode}</span>
                  </div>
                </div>
              ) : null}

              {brandingError ? <div className="stg-inline-error">{brandingError}</div> : null}

              <div className="stg-form-footer">
                <p className="stg-form-note">
                  {brandingQ.isLoading
                    ? ar
                      ? "جار تحميل بيانات الجمعية..."
                      : "Loading organization branding..."
                    : canEditBranding
                      ? ar
                        ? "يمكنك تعديل الاسم أو الشعار ثم حفظ التغييرات."
                        : "You can update the name or logo, then save changes."
                      : ar
                        ? "هذه البيانات للعرض فقط. يلزم صلاحية مدير النظام للتعديل."
                        : "Read-only data. Super Admin permission is required for editing."}
                </p>
                <Button
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={() => void submitBranding()}
                  isLoading={updateBrandingM.isPending}
                  disabled={
                    brandingQ.isLoading ||
                    !canEditBranding ||
                    !hasBrandingChanges ||
                    updateBrandingM.isPending
                  }
                >
                  {ar ? "حفظ التغييرات" : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stg-card">
          <CardHeader
            title={ar ? "تفضيلات الواجهة" : "Interface Preferences"}
            subtitle={
              ar ? "تحكم سريع في نمط العرض وسلوك القائمة الجانبية." : "Quick controls for theme and sidebar."
            }
            icon={Settings}
          />
          <CardContent>
            <div className="stg-switch-list">
              <div className="stg-switch-item">
                <div className="stg-switch-copy">
                  <p className="stg-switch-title">{ar ? "نمط الألوان" : "Color Theme"}</p>
                  <p className="stg-switch-description">
                    {ar
                      ? "بدّل بين النمط الفاتح والداكن حسب بيئة العمل."
                      : "Switch between light and dark mode based on your workspace."}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  leftIcon={theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  onClick={toggleTheme}
                >
                  {theme === "light"
                    ? ar
                      ? "تفعيل الداكن"
                      : "Enable Dark"
                    : ar
                      ? "تفعيل الفاتح"
                      : "Enable Light"}
                </Button>
              </div>

              <div className="stg-switch-item">
                <div className="stg-switch-copy">
                  <p className="stg-switch-title">{ar ? "القائمة الجانبية" : "Sidebar Density"}</p>
                  <p className="stg-switch-description">
                    {ar
                      ? "وسّع أو اطوِ القائمة الجانبية لزيادة مساحة المحتوى."
                      : "Expand or collapse the sidebar to increase content space."}
                  </p>
                </div>
                <Button variant="secondary" onClick={toggleSidebar}>
                  {sidebarCollapsed ? (ar ? "توسيع" : "Expand") : ar ? "طي" : "Collapse"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stg-card">
          <CardHeader
            title={ar ? "معلومات النظام" : "System Information"}
            subtitle={
              ar ? "بيانات مرجعية عن النسخة الحالية وهوية الجمعية." : "Reference data about app version and branding."
            }
            icon={Info}
          />
          <CardContent>
            <div className="stg-meta-list">
              <div className="stg-meta-row">
                <span>{ar ? "الإصدار" : "Version"}</span>
                <strong>{APP_VERSION}</strong>
              </div>
              <div className="stg-meta-row">
                <span>{ar ? "اسم النظام" : "System Name"}</span>
                <strong>{ar ? "رفيق القرآن" : "Rafiq Al-Quran"}</strong>
              </div>
              <div className="stg-meta-row">
                <span>{ar ? "اسم الجمعية" : "Organization"}</span>
                <strong>{organizationName}</strong>
              </div>
              <div className="stg-meta-row">
                <span>{ar ? "رمز الجمعية" : "Organization Code"}</span>
                <strong>{organizationCode}</strong>
              </div>
              <div className="stg-meta-row">
                <span>{ar ? "آخر تحديث" : "Last Updated"}</span>
                <strong>{formatDateTime(brandingQ.data?.updatedAt, locale)}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SettingsPage;
