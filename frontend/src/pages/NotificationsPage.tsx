import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Bell,
  BookUp,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileBarChart,
  FileText,
  Filter,
  Inbox,
  Mail,
  MailOpen,
  Receipt,
  RefreshCw,
  X
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { LoadingState } from "../components/ui/LoadingState";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useI18n } from "../app/i18n";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationsCountQuery
} from "../features/notifications/notifications.hooks";
import type { NotificationType } from "../features/notifications/types";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import { commonFeedback, notifyError, notifySuccess, text } from "../shared/ui/feedback";

import "../styles/pages/notifications-v2.css";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.06 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } }
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const typeOptions: NotificationType[] = [
  "EXAM_PUBLISHED",
  "EXAM_SCORED",
  "GOLDEN_RECORD_NOMINATION_APPROVED",
  "LIBRARY_UPLOADED",
  "INVOICE_ISSUED",
  "PAYMENT_RECORDED",
  "REPORT_EXPORTED"
];

const typeMeta: Record<NotificationType, { icon: typeof FileText; cls: string }> = {
  EXAM_PUBLISHED: { icon: FileText, cls: "ntf-icon--violet" },
  EXAM_SCORED: { icon: Award, cls: "ntf-icon--emerald" },
  GOLDEN_RECORD_NOMINATION_APPROVED: {
    icon: ClipboardCheck,
    cls: "ntf-icon--brand"
  },
  LIBRARY_UPLOADED: { icon: BookUp, cls: "ntf-icon--sky" },
  INVOICE_ISSUED: { icon: Receipt, cls: "ntf-icon--amber" },
  PAYMENT_RECORDED: { icon: CreditCard, cls: "ntf-icon--brand" },
  REPORT_EXPORTED: { icon: FileBarChart, cls: "ntf-icon--rose" }
};

const formatRelativeDate = (value: string, isArabic: boolean) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (isArabic) {
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString("ar-SA-u-nu-latn", { month: "short", day: "numeric" });
  }

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function NotificationsPage() {
  const { language } = useI18n();
  const isArabic = language === "ar";

  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");
  const [readFilter, setReadFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const listQuery = useNotificationsQuery({
    type: typeFilter || undefined,
    isRead: readFilter === "ALL" ? undefined : readFilter === "READ",
    from: fromDate || undefined,
    to: toDate || undefined,
    page,
    pageSize
  });
  const unreadQuery = useUnreadNotificationsCountQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const typeLabels = useMemo<Record<NotificationType, string>>(
    () => ({
      EXAM_PUBLISHED: isArabic ? "نشر اختبار" : "Exam Published",
      EXAM_SCORED: isArabic ? "تصحيح اختبار" : "Exam Scored",
      GOLDEN_RECORD_NOMINATION_APPROVED: isArabic
        ? "اعتماد ترشيح اختبار المصحف"
        : "Approved Mushaf Nomination",
      LIBRARY_UPLOADED: isArabic ? "رفع ملف مكتبة" : "Library Upload",
      INVOICE_ISSUED: isArabic ? "إصدار فاتورة" : "Invoice Issued",
      PAYMENT_RECORDED: isArabic ? "تسجيل دفعة" : "Payment Recorded",
      REPORT_EXPORTED: isArabic ? "تصدير تقرير" : "Report Exported"
    }),
    [isArabic]
  );

  const items = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const effectivePageSize = listQuery.data?.pageSize ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
  const unreadCount = unreadQuery.data?.unreadCount ?? 0;
  const hasFilters =
    typeFilter !== "" || readFilter !== "ALL" || fromDate !== "" || toDate !== "";

  const applyFilter = (updater: () => void) => {
    updater();
    setPage(1);
  };

  const clearFilters = () => {
    setTypeFilter("");
    setReadFilter("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const markRead = async (notificationId: number, isRead: boolean) => {
    if (isRead || markReadMutation.isPending) {
      return;
    }

    try {
      await markReadMutation.mutateAsync(notificationId);
      notifySuccess(text(isArabic, commonFeedback.markAsReadSuccess));
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar: isArabic,
          fallback: isArabic
            ? "تعذر تحديث الإشعار. يرجى المحاولة مرة أخرى."
            : "Unable to update the notification. Please try again."
        })
      );
    }
  };

  const markAllRead = async () => {
    if (!unreadCount || markAllReadMutation.isPending) {
      return;
    }

    try {
      await markAllReadMutation.mutateAsync();
      notifySuccess(text(isArabic, commonFeedback.markAllReadSuccess));
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar: isArabic,
          fallback: isArabic
            ? "تعذر تحديث الإشعارات. يرجى المحاولة مرة أخرى."
            : "Unable to update notifications. Please try again."
        })
      );
    }
  };

  const rangeStart = total > 0 ? (page - 1) * effectivePageSize + 1 : 0;
  const rangeEnd = Math.min(page * effectivePageSize, total);

  return (
    <div className="page ntf-page">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <PageHeader
            title={isArabic ? "الإشعارات" : "Notifications"}
            description={
              isArabic
                ? "آخر التحديثات والتنبيهات داخل النظام"
                : "Latest updates and alerts in your system"
            }
            icon={<Bell className="w-6 h-6" />}
            actions={
              <div className="ntf-top__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={
                    <RefreshCw className={`w-4 h-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
                  }
                  onClick={() => {
                    void listQuery.refetch();
                    void unreadQuery.refetch();
                  }}
                >
                  {isArabic ? "تحديث" : "Refresh"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCheck className="w-4 h-4" />}
                  onClick={() => void markAllRead()}
                  isLoading={markAllReadMutation.isPending}
                  disabled={unreadCount === 0}
                >
                  {isArabic ? "تحديد الكل كمقروء" : "Mark all read"}
                </Button>
              </div>
            }
          />
        </motion.div>

        <motion.div variants={fadeUp} className="ntf-kpis">
          <div className="ntf-kpi">
            <div className="ntf-kpi__icon ntf-kpi__icon--total">
              <Inbox className="w-5 h-5" />
            </div>
            <div className="ntf-kpi__data">
              <span className="ntf-kpi__val">{total}</span>
              <span className="ntf-kpi__label">{isArabic ? "إجمالي" : "Total"}</span>
            </div>
          </div>
          <div className="ntf-kpi">
            <div className="ntf-kpi__icon ntf-kpi__icon--unread">
              <Mail className="w-5 h-5" />
            </div>
            <div className="ntf-kpi__data">
              <span className="ntf-kpi__val">{unreadCount}</span>
              <span className="ntf-kpi__label">{isArabic ? "غير مقروء" : "Unread"}</span>
            </div>
          </div>
          <div className="ntf-kpi">
            <div className="ntf-kpi__icon ntf-kpi__icon--read">
              <MailOpen className="w-5 h-5" />
            </div>
            <div className="ntf-kpi__data">
              <span className="ntf-kpi__val">{Math.max(0, total - unreadCount)}</span>
              <span className="ntf-kpi__label">{isArabic ? "مقروء" : "Read"}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="ntf-filters">
          <Filter className="w-4 h-4 ntf-filters__icon" />
          <select
            className="ntf-select"
            value={typeFilter}
            onChange={(event) =>
              applyFilter(() =>
                setTypeFilter((event.target.value as NotificationType | "") || "")
              )
            }
            title={isArabic ? "تصفية بالنوع" : "Filter by type"}
          >
            <option value="">{isArabic ? "كل الأنواع" : "All Types"}</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>

          <select
            className="ntf-select"
            value={readFilter}
            onChange={(event) =>
              applyFilter(() =>
                setReadFilter(event.target.value as "ALL" | "UNREAD" | "READ")
              )
            }
            title={isArabic ? "تصفية بالحالة" : "Filter by status"}
          >
            <option value="ALL">{isArabic ? "الكل" : "All"}</option>
            <option value="UNREAD">{isArabic ? "غير مقروء" : "Unread"}</option>
            <option value="READ">{isArabic ? "مقروء" : "Read"}</option>
          </select>

          <input
            type="date"
            className="ntf-select"
            value={fromDate}
            onChange={(event) => applyFilter(() => setFromDate(event.target.value))}
            title={isArabic ? "من تاريخ" : "From"}
          />
          <input
            type="date"
            className="ntf-select"
            value={toDate}
            onChange={(event) => applyFilter(() => setToDate(event.target.value))}
            title={isArabic ? "إلى تاريخ" : "To"}
          />

          {hasFilters && (
            <button
              className="ntf-clear-btn"
              onClick={clearFilters}
              title={isArabic ? "إعادة ضبط" : "Reset"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="ntf-list-panel">
          {listQuery.isError && (
            <ErrorState
              title={isArabic ? "تعذر تحميل الإشعارات" : "Unable to load notifications"}
              description={getLocalizedApiErrorMessage(listQuery.error, {
                ar: isArabic,
                fallback: isArabic
                  ? "تعذر تحميل الإشعارات. يرجى المحاولة مرة أخرى."
                  : "Unable to load notifications. Please try again."
              })}
              onRetry={() => void listQuery.refetch()}
            />
          )}

          {listQuery.isLoading && <LoadingState />}

          {!listQuery.isLoading && !listQuery.isError && items.length === 0 && (
            <EmptyState
              title={isArabic ? "لا توجد إشعارات" : "No notifications"}
              description={isArabic ? "لا توجد نتائج مطابقة للفلاتر الحالية." : "No results match the current filters."}
            />
          )}

          {!listQuery.isLoading && !listQuery.isError && items.length > 0 && (
            <div className="ntf-feed">
              {items.map((item, index) => {
                const meta = typeMeta[item.type] ?? typeMeta.REPORT_EXPORTED;
                const Icon = meta.icon;

                return (
                  <motion.div
                    key={item.id}
                    className={`ntf-card ${item.isRead ? "" : "ntf-card--unread"}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div className={`ntf-card__icon ${meta.cls}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="ntf-card__body">
                      <div className="ntf-card__head">
                        <h3 className="ntf-card__title">{item.title}</h3>
                        <span className="ntf-card__time">
                          {formatRelativeDate(item.createdAt, isArabic)}
                        </span>
                      </div>
                      <p className="ntf-card__text">{item.body}</p>
                      <div className="ntf-card__meta">
                        <Badge variant="default" size="sm">
                          {typeLabels[item.type]}
                        </Badge>
                        {item.center?.name && <span className="ntf-card__scope">{item.center.name}</span>}
                        {item.circle?.name && (
                          <span className="ntf-card__scope ntf-card__scope--secondary">
                            {item.circle.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ntf-card__actions">
                      {!item.isRead ? (
                        <button
                          className="ntf-mark-btn"
                          onClick={() => void markRead(item.id, item.isRead)}
                          disabled={
                            markReadMutation.isPending && markReadMutation.variables === item.id
                          }
                          title={isArabic ? "تحديد كمقروء" : "Mark as read"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="ntf-read-dot" title={isArabic ? "مقروء" : "Read"} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {!listQuery.isLoading && !listQuery.isError && items.length > 0 && (
          <motion.div variants={fadeUp} className="ntf-pag">
            <span className="ntf-pag__info">
              {isArabic
                ? `عرض ${rangeStart} - ${rangeEnd} من ${total}`
                : `${rangeStart} - ${rangeEnd} of ${total}`}
            </span>
            <div className="ntf-pag__controls">
              <select
                className="ntf-pag__select"
                value={effectivePageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                title={isArabic ? "حجم الصفحة" : "Page size"}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / {isArabic ? "صفحة" : "page"}
                  </option>
                ))}
              </select>
              <div className="ntf-pag__btns">
                <button
                  className="ntf-pag__btn"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {isArabic ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
                <span className="ntf-pag__current">
                  {page} / {totalPages}
                </span>
                <button
                  className="ntf-pag__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  {isArabic ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
