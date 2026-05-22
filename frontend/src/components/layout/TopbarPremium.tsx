import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement
} from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  Clock,
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  X
} from "lucide-react";
import { labels, roleLabels } from "../../constants/labels";
import { useAuthStore } from "../../features/auth/auth.store";
import { useLogoutMutation } from "../../features/auth/auth.hooks";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationsCountQuery
} from "../../features/notifications/notifications.hooks";
import type {
  NotificationItem,
  NotificationType
} from "../../features/notifications/types";
import { useUiStore } from "../../app/ui.store";
import { useI18n } from "../../app/i18n";
import { useGlobalSearch } from "../../features/search/useGlobalSearch";
import type { SearchResultItem } from "../../features/search/useGlobalSearch";

type NotificationIconVariant = "info" | "success" | "warning";

const notificationTypeVariant: Record<NotificationType, NotificationIconVariant> = {
  EXAM_PUBLISHED: "info",
  EXAM_SCORED: "success",
  GOLDEN_RECORD_NOMINATION_APPROVED: "info",
  LIBRARY_UPLOADED: "info",
  INVOICE_ISSUED: "warning",
  PAYMENT_RECORDED: "success",
  REPORT_EXPORTED: "info"
};

const iconByVariant: Record<NotificationIconVariant, ReactElement> = {
  success: <Check className="w-4 h-4" />,
  info: <Clock className="w-4 h-4" />,
  warning: <X className="w-4 h-4" />
};

const iconClassByVariant: Record<NotificationIconVariant, string> = {
  info: "notification-icon--info",
  success: "notification-icon--success",
  warning: "notification-icon--warning"
};

const relativeTime = (dateLike: string, lang: "ar" | "en") => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return lang === "ar" ? "الآن" : "now";
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (lang === "en") {
    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const hours = Math.floor(diffMinutes / 60);
    if (hours < 24) return `${hours} h ago`;
    return `${Math.floor(hours / 24)} d ago`;
  }
  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
};

const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches;

export function TopbarPremium() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useI18n();
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const toggleMobileMenu = useUiStore((state) => state.toggleMobileMenu);
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);

  const searchPlaceholder =
    language === "ar"
      ? "ابحث عن طالب، معلم، مركز، حلقة..."
      : "Search students, teachers, centers...";

  const showSearchDropdown = searchFocused && searchValue.trim().length >= 2;
  const { results: searchGroups, loading: searchLoading } = useGlobalSearch(
    showSearchDropdown ? searchValue : "",
    user?.role
  );

  // Flat list for keyboard nav
  const searchResultsFlat = useMemo(
    () => searchGroups.flatMap((g) => g.items),
    [searchGroups]
  );

  const notificationsQuery = useNotificationsQuery({ page: 1, pageSize: 10 }, Boolean(user));
  const unreadCountQuery = useUnreadNotificationsCountQuery(Boolean(user));
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount =
    unreadCountQuery.data?.unreadCount ?? notifications.filter((item) => !item.isRead).length;

  const userInitials = useMemo(() => {
    if (!user?.fullName) return "-";
    return user.fullName
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  const shortName = useMemo(() => {
    if (!user?.fullName) return "";
    const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(" ");
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!notificationsOpen && !userMenuOpen && !showSearchDropdown) return;
    const onClickOutside = (event: MouseEvent) => {
      if (
        notificationsOpen &&
        notificationsRef.current &&
        event.target instanceof Node &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
      if (
        userMenuOpen &&
        userMenuRef.current &&
        event.target instanceof Node &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
      if (
        showSearchDropdown &&
        searchRef.current &&
        event.target instanceof Node &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [notificationsOpen, userMenuOpen, showSearchDropdown]);

  // Refetch notifications when panel opens
  useEffect(() => {
    if (!notificationsOpen) return;
    void notificationsQuery.refetch();
    void unreadCountQuery.refetch();
  }, [notificationsOpen, notificationsQuery, unreadCountQuery]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedResultIndex(-1);
  }, [searchResultsFlat]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedResultIndex((i) => Math.min(i + 1, searchResultsFlat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedResultIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = selectedResultIndex >= 0 ? searchResultsFlat[selectedResultIndex] : searchResultsFlat[0];
      if (target) {
        navigate(target.path);
        setSearchValue("");
        setSearchFocused(false);
        searchInputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setSearchFocused(false);
      setSearchValue("");
      searchInputRef.current?.blur();
    }
  };

  const handleResultClick = (item: SearchResultItem) => {
    navigate(item.path);
    setSearchValue("");
    setSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const markAllRead = async () => {
    if (!unreadCount || markAllReadMutation.isPending) return;
    await markAllReadMutation.mutateAsync();
  };

  const markRead = async (item: NotificationItem) => {
    if (item.isRead || markReadMutation.isPending) return;
    await markReadMutation.mutateAsync(item.id);
  };

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  }, [logoutMutation]);

  const handleNavigationToggle = () => {
    if (isMobileViewport()) {
      toggleMobileMenu();
      return;
    }
    toggleSidebar();
  };

  return (
    <header className="topbar" role="banner">
      <div className="topbar-container">

        {/* ── Start: Mobile toggle + Search ── */}
        <div className="topbar-start">
          <motion.button
            type="button"
            className="topbar-mobile-toggle"
            onClick={handleNavigationToggle}
            whileTap={{ scale: 0.94 }}
            title={language === "ar" ? "القائمة" : "Navigation"}
            aria-label={language === "ar" ? "القائمة" : "Navigation"}
          >
            <Menu className="w-[18px] h-[18px]" />
          </motion.button>

          {/* Search with results dropdown */}
          <div className="topbar-search-wrap" ref={searchRef}>
            <label className="topbar-search" aria-label={searchPlaceholder}>
              <Search className="topbar-search__icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                className="topbar-search__input"
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                spellCheck={false}
                aria-autocomplete="list"
                aria-expanded={showSearchDropdown}
                aria-haspopup="listbox"
                role="combobox"
              />
            </label>

            <AnimatePresence>
              {showSearchDropdown ? (
                <motion.div
                  className="search-dropdown"
                  role="listbox"
                  initial={{ opacity: 0, y: 4, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.99 }}
                  transition={{ duration: 0.12 }}
                >
                  {searchLoading ? (
                    <div className="search-no-results search-loading">
                      {language === "ar" ? "جارٍ البحث..." : "Searching..."}
                    </div>
                  ) : searchGroups.length > 0 ? (
                    searchGroups.map((group) => {
                      const groupLabel = language === "ar" ? group.labelAr : group.labelEn;
                      let flatOffset = 0;
                      for (const g of searchGroups) {
                        if (g.category === group.category) break;
                        flatOffset += g.items.length;
                      }
                      return (
                        <div key={group.category} className="search-result-group">
                          <div className="search-result-group__label">{groupLabel}</div>
                          {group.items.map((item, idx) => {
                            const globalIndex = flatOffset + idx;
                            return (
                              <button
                                key={item.id}
                                className={`search-result-item ${
                                  globalIndex === selectedResultIndex ? "search-result-item--selected" : ""
                                }`}
                                role="option"
                                aria-selected={globalIndex === selectedResultIndex}
                                onMouseDown={() => handleResultClick(item)}
                                onMouseEnter={() => setSelectedResultIndex(globalIndex)}
                              >
                                <span className="search-result-item__text">
                                  <span className="search-result-item__name">{item.label}</span>
                                  {item.sublabel ? (
                                    <span className="search-result-item__sub">{item.sublabel}</span>
                                  ) : null}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                  ) : (
                    <div className="search-no-results">
                      {language === "ar" ? "لا توجد نتائج مطابقة" : "No results found"}
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* ── End: Notifications + User ── */}
        <div className="topbar-end">

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              className="topbar-icon-btn"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              title={language === "ar" ? "الإشعارات" : "Notifications"}
              aria-haspopup="true"
              aria-expanded={notificationsOpen}
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 ? (
                <span className="notification-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            <AnimatePresence>
              {notificationsOpen ? (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  role="menu"
                >
                  <div className="dropdown-header">
                    <h3>{language === "ar" ? "الإشعارات" : "Notifications"}</h3>
                    <div className="dropdown-header__actions">
                      <button
                        className="dropdown-action"
                        onClick={() => {
                          navigate("/notifications");
                          setNotificationsOpen(false);
                        }}
                      >
                        {language === "ar" ? "عرض الكل" : "View all"}
                      </button>
                      {unreadCount > 0 ? (
                        <button
                          className="dropdown-action"
                          onClick={() => void markAllRead()}
                          disabled={markAllReadMutation.isPending}
                        >
                          {language === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="dropdown-body">
                    {notificationsQuery.isLoading ? (
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-message">
                            {language === "ar" ? "جارٍ تحميل الإشعارات..." : "Loading..."}
                          </p>
                        </div>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((item) => {
                        const variant = notificationTypeVariant[item.type];
                        return (
                          <div
                            key={item.id}
                            className={`notification-item ${item.isRead ? "" : "notification-item--unread"}`}
                            onClick={() => void markRead(item)}
                          >
                            <div className={`notification-icon ${iconClassByVariant[variant]}`}>
                              {iconByVariant[variant]}
                            </div>
                            <div className="notification-content">
                              <p className="notification-title">{item.title}</p>
                              <p className="notification-message">{item.body}</p>
                              <span className="notification-time">
                                {relativeTime(item.createdAt, language)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-message">
                            {language === "ar" ? "لا توجد إشعارات جديدة." : "No notifications."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="user-menu-btn"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              <div className="user-avatar-small">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName ?? "User"}
                    className="user-avatar-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <span className="user-name">{shortName}</span>
            </button>

            <AnimatePresence>
              {userMenuOpen ? (
                <motion.div
                  className="dropdown-menu user-dropdown"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  role="menu"
                >
                  {/* User identity header */}
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName ?? "User"}
                          className="user-avatar-img"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{userInitials}</span>
                      )}
                    </div>
                    <div className="user-dropdown-info">
                      <span className="user-dropdown-name">{user?.fullName}</span>
                      <span className="user-dropdown-role">{user ? roleLabels[user.role] : ""}</span>
                    </div>
                  </div>

                  <div className="user-dropdown-divider" />

                  {/* Settings actions */}
                  <div className="user-dropdown-actions">
                    <button
                      className="user-dropdown-item"
                      onClick={() => { toggleTheme(); setUserMenuOpen(false); }}
                    >
                      {theme === "light"
                        ? <Moon className="user-dropdown-item__icon" />
                        : <Sun className="user-dropdown-item__icon" />}
                      <span>{theme === "light" ? labels.common.themeDark : labels.common.themeLight}</span>
                    </button>

                    <button
                      className="user-dropdown-item"
                      onClick={() => { toggleLanguage(); setUserMenuOpen(false); }}
                    >
                      <Globe className="user-dropdown-item__icon" />
                      <span>{language === "ar" ? labels.common.english : labels.common.arabic}</span>
                    </button>

                    <button
                      className="user-dropdown-item"
                      onClick={() => { navigate("/settings"); setUserMenuOpen(false); }}
                    >
                      <Settings className="user-dropdown-item__icon" />
                      <span>{labels.nav.settings}</span>
                    </button>
                  </div>

                  <div className="user-dropdown-divider" />

                  {/* Logout — danger zone */}
                  <div className="user-dropdown-actions">
                    <button
                      className="user-dropdown-item user-dropdown-item--danger"
                      onClick={() => void handleLogout()}
                    >
                      <LogOut className="user-dropdown-item__icon" />
                      <span>{labels.common.logout}</span>
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopbarPremium;
