import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { useI18n } from "../../app/i18n";
import { labels } from "../../constants/labels";
import { useOrgBrandingQuery } from "../../features/org/org.hooks";

interface AuthLayoutProps {
  /** The direction for RTL/LTR support */
  direction: "rtl" | "ltr";
  /** Children to render in the card panel */
  children: ReactNode;
}

/**
 * Shared Split-Screen Abstract layout for all auth-related pages.
 */
function AuthLayout({ direction, children }: AuthLayoutProps) {
  const { data: branding } = useOrgBrandingQuery({ enabled: true });

  const logoSrc = branding?.logoUrl || "/brand/rafiq-logo.svg";
  const appName = branding?.name || labels.appShortName;
  const { language, toggleLanguage } = useI18n();

  return (
    <main className="auth-prime" dir={direction}>
      {/* The Sanctuary Side (Art) */}
      <section className="auth-prime__art" aria-hidden="true">
        <div className="auth-mihrab">
          <img src={logoSrc} alt="" className="auth-mihrab-logo" />
          <h1 className="auth-mihrab-title">{appName}</h1>
          
          <div className="auth-mihrab-divider" />

          <div className="auth-mihrab-quote">
            <p>"إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ"</p>
          </div>

          <footer className="auth-mihrab-footer">
            سورة الإسراء
          </footer>
        </div>
      </section>

      {/* Action Side (Form) */}
      <section className="auth-prime__form-side">
        <div className="auth-prime__top-actions">
          <button 
            type="button" 
            className="auth-prime__lang" 
            onClick={toggleLanguage}
            title={language === "ar" ? labels.common.english : labels.common.arabic}
          >
            <Globe className="h-4 w-4" />
            <span>{language === "ar" ? "English" : "العربية"}</span>
          </button>
        </div>
        
        <div className="auth-prime__container">
          <div className="auth-prime__shell" aria-label={labels.appShortName}>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
