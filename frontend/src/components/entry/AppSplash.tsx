import { motion } from "framer-motion";
import { useOrgBrandingQuery } from "../../features/org/org.hooks";
import { getCurrentLanguage } from "../../constants/labels";
import "./app-splash.css";

function AppSplash() {
  const { data: branding } = useOrgBrandingQuery({ enabled: true });
  const logoSrc = branding?.logoUrl || "/brand/rafiq-logo.svg";

  return (
    <motion.section
      className="app-splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      aria-label="Rufaqa Al-Quran Splash Screen"
    >
      <motion.div
        className="app-splash__brand"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="app-splash__logo-wrapper">
          <img
            src={logoSrc}
            alt="Logo"
            className="app-splash__logo"
          />
        </div>
        
        <motion.p
          className="app-splash__impact-text"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {getCurrentLanguage() === "ar" ? "يبدأ الأثر من هنا..." : "Impact begins here..."}
        </motion.p>

        <motion.div
          className="app-splash__loader-line"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="app-splash__loader-progress" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

export default AppSplash;
