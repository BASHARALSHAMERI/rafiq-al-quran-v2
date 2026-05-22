import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useI18n } from "../../app/i18n";
import { useUiStore } from "../../app/ui.store";
import { labels } from "../../constants/labels";
import { useAuthStore } from "../../features/auth/auth.store";
import { useOrgBrandingQuery } from "../../features/org/org.hooks";
import {
  getSectionsByRole,
  type AdminRouteMeta,
  type ResolvedSection
} from "../../app/route-meta";

const sidebarVariants = {
  expanded: {
    width: 272,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }
  },
  collapsed: {
    width: 88,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

interface SidebarTooltipProps {
  label: string;
  children: ReactNode;
}

interface SidebarHomeItemProps {
  route: AdminRouteMeta;
  compact: boolean;
  isActive: boolean;
  onNavigate: () => void;
}

interface SidebarLeafItemProps {
  route: AdminRouteMeta;
  compact: boolean;
  isActive: boolean;
  onNavigate: () => void;
}

interface SidebarGroupProps {
  section: ResolvedSection;
  currentPath: string;
  compact: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

interface SidebarFooterProps {
  user:
    | {
        fullName?: string | null;
        avatarUrl?: string | null;
      }
    | null
    | undefined;
  compact: boolean;
}

function SidebarTooltip({ label, children }: SidebarTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="sidebar-tooltip-trigger"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      {children}

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="sidebar-tooltip"
            role="tooltip"
            initial={{ opacity: 0, x: 6, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
          >
            {label}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SidebarHomeItem({
  route,
  compact,
  isActive,
  onNavigate
}: SidebarHomeItemProps) {
  const RouteIcon = route.routeIcon;

  const item = (
    <NavLink
      to={route.path}
      className={`sidebar-home-item nav-item ${isActive ? "nav-item--active sidebar-home-item--active" : ""} ${
        compact ? "nav-item--compact" : ""
      }`}
      aria-current={isActive ? "page" : undefined}
      aria-label={compact ? route.label : undefined}
      onClick={onNavigate}
    >
      <span className={`nav-item__icon-wrap ${isActive ? "nav-item__icon-wrap--active" : ""}`}>
        <RouteIcon className="nav-item-icon" />
      </span>
      {!compact ? <span className="nav-item-text">{route.label}</span> : null}
    </NavLink>
  );

  return compact ? <SidebarTooltip label={route.label}>{item}</SidebarTooltip> : item;
}

function SidebarLeafItem({
  route,
  compact,
  isActive,
  onNavigate
}: SidebarLeafItemProps) {
  const RouteIcon = route.routeIcon;

  const item = (
    <NavLink
      to={route.path}
      className={`nav-item nav-item--sub ${isActive ? "nav-item--active" : ""} ${
        compact ? "nav-item--compact" : ""
      }`}
      aria-current={isActive ? "page" : undefined}
      aria-label={compact ? route.label : undefined}
      onClick={onNavigate}
    >
      <span className={`nav-item__icon-wrap ${isActive ? "nav-item__icon-wrap--active" : ""}`}>
        <RouteIcon className="nav-item-icon" />
      </span>
      {!compact ? <span className="nav-item-text">{route.label}</span> : null}
    </NavLink>
  );

  return compact ? <SidebarTooltip label={route.label}>{item}</SidebarTooltip> : item;
}

function SidebarGroup({
  section,
  currentPath,
  compact,
  expanded,
  onToggle,
  onNavigate
}: SidebarGroupProps) {
  const activeRoute = section.routes.find((route) => currentPath === route.path);
  const SectionIcon = section.icon;

  return (
    <section
      className={`sidebar-group ${compact ? "sidebar-group--compact" : ""} ${
        activeRoute ? "sidebar-group--active" : ""
      }`}
      aria-label={section.label}
    >
      <SidebarTooltip label={section.label}>
        <motion.button
          type="button"
          className={`sidebar-group__header ${
            activeRoute ? "sidebar-group__header--active" : ""
          } ${expanded ? "sidebar-group__header--expanded" : ""} ${
            compact ? "sidebar-group__header--compact" : ""
          }`}
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`sidebar-panel-${section.id}`}
          aria-label={section.label}
          whileTap={{ scale: 0.99 }}
        >
          <span className="sidebar-group__header-start">
            <span className={`sidebar-group__icon ${activeRoute ? "sidebar-group__icon--active" : ""}`}>
              <SectionIcon className="sidebar-group__icon-svg" />
            </span>
            {!compact ? <span className="sidebar-group__label">{section.label}</span> : null}
          </span>

          <span className="sidebar-group__header-end" aria-hidden="true">
            <ChevronDown
              className={`sidebar-group__chevron ${expanded ? "sidebar-group__chevron--open" : ""}`}
            />
          </span>
        </motion.button>
      </SidebarTooltip>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id={`sidebar-panel-${section.id}`}
            className={`sidebar-group__panel ${compact ? "sidebar-group__panel--compact" : ""}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          >
            <div className={`sidebar-group__items ${compact ? "sidebar-group__items--compact" : ""}`}>
              {section.routes.map((route) => (
                <SidebarLeafItem
                  key={route.id}
                  route={route}
                  compact={compact}
                  isActive={currentPath === route.path}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function SidebarFooter({ user, compact }: SidebarFooterProps) {
  const displayName = useMemo(() => {
    if (!user?.fullName) return labels.appShortName;

    const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(" ");
  }, [user?.fullName]);

  const initials = useMemo(() => {
    if (!user?.fullName) return "-";
    return user.fullName
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.fullName]);

  if (!user) {
    return null;
  }

  const content = (
    <div className={`sidebar-user ${compact ? "sidebar-user--compact" : "sidebar-user--expanded"}`}>
      <div className="sidebar-user__avatar" aria-hidden="true">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="sidebar-user__avatar-image"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {!compact ? (
        <div className="sidebar-user__text">
          <span className="sidebar-user__name" title={displayName}>
            {displayName}
          </span>
        </div>
      ) : null}
    </div>
  );

  return compact ? <SidebarTooltip label={displayName}>{content}</SidebarTooltip> : content;
}

export function SidebarPremium() {
  const location = useLocation();
  const { language } = useI18n();
  const user = useAuthStore((state) => state.user);

  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const isMobileMenuOpen = useUiStore((state) => state.isMobileMenuOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setMobileMenuOpen = useUiStore((state) => state.setMobileMenuOpen);
  const brandingQ = useOrgBrandingQuery({ enabled: Boolean(user) });

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  const visibleSections = useMemo(() => {
    if (!user) return [];
    return getSectionsByRole(user.role);
  }, [user]);

  const activeSectionId = useMemo(() => {
    return (
      visibleSections.find((section) =>
        section.routes.some((route) => route.path === location.pathname)
      )?.id ?? null
    );
  }, [location.pathname, visibleSections]);

  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSectionId || activeSectionId === "home") {
      return;
    }

    setExpandedSectionId(activeSectionId);
  }, [activeSectionId]);

  const homeSection = visibleSections.find((section) => section.id === "home");
  const nonHomeSections = visibleSections.filter((section) => section.id !== "home");
  const compact = sidebarCollapsed && !isMobileMenuOpen;
  const brandName =
    brandingQ.data?.name?.trim() || user?.organizationName?.trim() || labels.appShortName;
  const brandLogo =
    brandingQ.data?.logoUrl?.trim() || user?.organizationLogoUrl?.trim() || "/brand/rafiq-logo.svg";
  const brandSubtitle =
    language === "ar" ? "لإدارة الحلقات القرآنية" : "Quran circles administration";

  return (
    <>
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        className={`sidebar-premium ${isMobileMenuOpen ? "sidebar-premium--mobile-open" : ""}`}
        variants={sidebarVariants}
        initial={compact ? "collapsed" : "expanded"}
        animate={compact ? "collapsed" : "expanded"}
      >
        <div className="sidebar-premium__header">
          <div className="sidebar-premium__brand">
            {compact ? (
              <motion.button
                type="button"
                className="sidebar-brand__mark sidebar-brand__mark--toggle"
                onClick={toggleSidebar}
                aria-label={labels.common.expandSidebar}
                title={labels.common.expandSidebar}
                whileTap={{ scale: 0.98 }}
              >
                <img src={brandLogo} alt="" className="sidebar-brand__logo" loading="eager" />
                <span className="sidebar-brand__mark-indicator" aria-hidden="true">
                  <PanelRightOpen className="sidebar-brand__mark-icon" />
                </span>
              </motion.button>
            ) : (
              <div className="sidebar-brand__mark" aria-hidden="true">
                <img
                  src={brandLogo}
                  alt=""
                  className="sidebar-brand__logo"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <AnimatePresence initial={false} mode="popLayout">
              {!compact ? (
                <motion.div
                  className="sidebar-brand__text"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  <span className="sidebar-brand__name">{brandName}</span>
                  <span className="sidebar-brand__subtitle">{brandSubtitle}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {!compact ? (
            <button
              type="button"
              className="sidebar-collapse-toggle"
              onClick={toggleSidebar}
              aria-label={labels.common.collapseSidebar}
              title={labels.common.collapseSidebar}
            >
              <PanelRightClose className="sidebar-collapse-toggle__icon" />
            </button>
          ) : null}
        </div>

        <nav className="sidebar-premium__nav" aria-label="Main navigation" role="navigation">
          {homeSection?.routes[0] ? (
            <motion.div
              key={homeSection.id}
              className="sidebar-section-slot"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.02 }}
            >
              <SidebarHomeItem
                route={homeSection.routes[0]}
                compact={compact}
                isActive={location.pathname === homeSection.routes[0].path}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </motion.div>
          ) : null}

          {nonHomeSections.map((section, index) => {
            const expanded = expandedSectionId === section.id;
            const isSingleRoute = section.routes.length === 1;
            const primaryRoute = section.routes[0];

            return (
              <motion.div
                key={section.id}
                className="sidebar-section-slot"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.03 }}
              >
                {isSingleRoute && primaryRoute ? (
                  <SidebarLeafItem
                    route={primaryRoute}
                    compact={compact}
                    isActive={location.pathname === primaryRoute.path}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                ) : (
                  <SidebarGroup
                    section={section}
                    currentPath={location.pathname}
                    compact={compact}
                    expanded={expanded}
                    onToggle={() =>
                      setExpandedSectionId((current) => (current === section.id ? null : section.id))
                    }
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                )}
              </motion.div>
            );
          })}
        </nav>

        <div className="sidebar-premium__footer">
          <SidebarFooter user={user} compact={compact} />
        </div>
      </motion.aside>
    </>
  );
}

export default SidebarPremium;

