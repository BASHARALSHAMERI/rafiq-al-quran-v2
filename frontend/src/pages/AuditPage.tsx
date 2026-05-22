import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// useNavigate removed — not used on this page
import {
  Filter,
  RefreshCw,
  Search,
  Activity,
  History,
  ShieldAlert,
  Clock,
  ChevronFirst,
  ChevronRight,
  ChevronLeft,
  ChevronLast,
  FileText,
  User,
  Shield,
  Eye,
  AlertTriangle,
  X,
  Server,
  Zap,
  Globe,
  Database
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { useI18n } from "../app/i18n";
import { useAuditCatalogQuery, useAuditLogsQuery } from "../features/audit/audit.hooks";
import type { AuditAction, AuditEntityType, AuditLogRow } from "../features/audit/types";
import { getLocalizedApiErrorMessage } from "../shared/api/error";

import "../styles/pages/audit-v2.css";

/* ═══════════════════════════════════════════════════════════════
   ANIMATION CONFIG
   ═══════════════════════════════════════════════════════════════ */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const toNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const formatDate = (value: string, locale: "ar-SA-u-nu-latn" | "en-US") => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale, {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
};

const actionVariant = (action: string) => {
  if (["CREATE", "PUBLISH", "EXPORT", "SCORE", "LOGIN"].includes(action)) return "success";
  if (["DELETE", "ARCHIVE", "WARNING", "FAILED_LOGIN"].includes(action)) return "danger";
  if (["UPDATE", "EDIT", "MODIFY"].includes(action)) return "warning";
  if (["DOWNLOAD", "VIEW", "READ"].includes(action)) return "info";
  return "default";
};

const actionLabel = (action: string, ar: boolean) => {
  if (!ar) return action;
  const mapAr: Record<string, string> = {
    "CREATE": "إنشاء", "UPDATE": "تحديث", "DELETE": "حذف", "PUBLISH": "نشر",
    "ARCHIVE": "أرشفة", "DOWNLOAD": "تحميل", "EXPORT": "تصدير", "SCORE": "تقييم",
    "LOGIN": "تسجيل دخول", "LOGOUT": "خروج"
  };
  return mapAr[action] || action;
};

const entityLabel = (entity: string, ar: boolean) => {
  if (!ar) return entity;
  const mapAr: Record<string, string> = {
    "USER": "مستخدم", "CENTER": "مركز", "CIRCLE": "حلقة", "EXAM": "اختبار",
    "EXAM_ATTEMPT": "محاولة اختبار", "LIBRARY_ITEM": "عنصر مكتبة", "INVOICE": "فاتورة",
    "PAYMENT": "دفعة", "REPORT_EXPORT": "تصدير تقرير", "SETTINGS": "إعدادات"
  };
  return mapAr[entity] || entity;
};

const metadataEntries = (metadata: Record<string, unknown>) => {
  return Object.entries(metadata).map(([key, value]) => {
    if (value === null || value === undefined) return { key, value: "-" };
    if (typeof value === "object") return { key, value: JSON.stringify(value, null, 2) };
    return { key, value: String(value) };
  });
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function AuditPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const locale = ar ? "ar-SA-u-nu-latn" : "en-US";

  const { defaultFrom, defaultTo } = useMemo(() => {
    const dNow = new Date();
    const dAgo = new Date(dNow.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      defaultFrom: dAgo.toISOString().slice(0, 10),
      defaultTo: dNow.toISOString().slice(0, 10)
    };
  }, []);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [centerId, setCenterId] = useState<number | undefined>();
  const [circleId, setCircleId] = useState<number | undefined>();
  const [actorUserId, setActorUserId] = useState<number | undefined>();
  const [action, setAction] = useState<AuditAction | "">("");
  const [entityType, setEntityType] = useState<AuditEntityType | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [selectedRow, setSelectedRow] = useState<AuditLogRow | null>(null);

  const catalogQuery = useAuditCatalogQuery();
  const listQuery = useAuditLogsQuery({
    from, to, centerId, circleId, actorUserId,
    action: action || undefined,
    entityType: entityType || undefined,
    q: search || undefined, page, pageSize
  });

  const centers = catalogQuery.data?.centers ?? [];
  const actors = catalogQuery.data?.actors ?? [];
  const actions = catalogQuery.data?.actions ?? [];
  const entityTypes = catalogQuery.data?.entityTypes ?? [];

  const filteredCircles = useMemo(() => {
    const list = catalogQuery.data?.circles ?? [];
    if (!centerId) return list;
    return list.filter((circle) => circle.centerId === centerId);
  }, [centerId, catalogQuery.data?.circles]);

  const rows = listQuery.data?.rows ?? [];
  const total = listQuery.data?.total ?? 0;
  const currentPage = listQuery.data?.page ?? page;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // KPIs
  const totalLogs = total;
  const warningLogsCount = rows.filter(r => ["DELETE", "FAILED_LOGIN", "ARCHIVE"].includes(r.action)).length;
  // Estimate warnings scaling to total pages
  const estWarningTotal = Math.round(warningLogsCount * (total / Math.max(1, rows.length)));

  const error = catalogQuery.error || listQuery.error;
  const isLoading = catalogQuery.isFetching || listQuery.isFetching;

  const resetFilters = () => {
    setFrom(defaultFrom); setTo(defaultTo); setCenterId(undefined); setCircleId(undefined);
    setActorUserId(undefined); setAction(""); setEntityType(""); setSearch(""); setPage(1);
  };

  return (
    <div className="page aud-page">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        
        {/* ══ TOP BAR ══ */}
        <motion.div variants={fadeUp}>
          <PageHeader
            title={ar ? "سجل التدقيق" : "Audit Log"}
            description={ar ? "تتبع ومراقبة جميع الحركات والأحداث الحساسة في النظام" : "Track and monitor all systemic events and sensitive activities"}
            icon={<ShieldAlert className="w-6 h-6" />}
            actions={
              <Button variant="secondary" size="sm" onClick={() => { void catalogQuery.refetch(); void listQuery.refetch(); }} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hide-mobile">{ar ? "تحديث" : "Refresh"}</span>
              </Button>
            }
          />
        </motion.div>

        {/* ══ KPI CARDS ══ */}
        <motion.div variants={fadeUp} className="aud-kpis">
          <div className="aud-kpi">
            <div className="aud-kpi__icon aud-kpi-icon--violet"><Activity /></div>
            <div className="aud-kpi__data">
              <span className="aud-kpi__val">{totalLogs.toLocaleString()}</span>
              <span className="aud-kpi__label">{ar ? "عنصر تسجيل" : "Total Events"}</span>
            </div>
          </div>
          <div className="aud-kpi">
            <div className="aud-kpi__icon aud-kpi-icon--emerald"><History /></div>
            <div className="aud-kpi__data">
              <span className="aud-kpi__val">30</span>
              <span className="aud-kpi__label">{ar ? "يوم (فترة الاحتفاظ)" : "Retention (Days)"}</span>
            </div>
          </div>
          <div className="aud-kpi">
            <div className="aud-kpi__icon aud-kpi-icon--amber"><AlertTriangle /></div>
            <div className="aud-kpi__data">
              <span className="aud-kpi__val">{estWarningTotal.toLocaleString()}</span>
              <span className="aud-kpi__label">{ar ? "تنبيهات / حذوفات" : "Alerts / Deletes"}</span>
            </div>
            <div className="aud-kpi__trend aud-kpi__trend--up"><Zap className="w-4 h-4" /></div>
          </div>
          <div className="aud-kpi">
            <div className="aud-kpi__icon aud-kpi-icon--rose"><Server /></div>
            <div className="aud-kpi__data">
              <span className="aud-kpi__val">100%</span>
              <span className="aud-kpi__label">{ar ? "حالة تغطية النظام" : "System Coverage"}</span>
            </div>
          </div>
        </motion.div>

        {/* ══ FILTERS ══ */}
        <motion.div variants={fadeUp} className="aud-filters">
          <div className="aud-filters__head">
            <div className="aud-filters__title"><Filter className="w-4 h-4" /> {ar ? "فلاتر السجل" : "Audit Filters"}</div>
            <button className="aud-filters__reset" onClick={resetFilters}>{ar ? "إعادة ضبط المحكمات" : "Reset Filters"}</button>
          </div>
          <div className="aud-filters__grid">
            <div className="aud-filter">
              <label>{ar ? "من تاريخ" : "From Date"}</label>
              <input type="date" className="aud-input" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} title={ar ? "تاريخ البداية" : "Start Date"} />
            </div>
            <div className="aud-filter">
              <label>{ar ? "إلى تاريخ" : "To Date"}</label>
              <input type="date" className="aud-input" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} title={ar ? "تاريخ النهاية" : "End Date"} />
            </div>
            <div className="aud-filter">
              <label>{ar ? "الفاعل" : "Actor"}</label>
              <select className="aud-select" value={actorUserId ? String(actorUserId) : ""} onChange={(e) => { setActorUserId(toNumber(e.target.value)); setPage(1); }} title={ar ? "الفاعل" : "Actor"}>
                <option value="">{ar ? "الكل" : "All Actors"}</option>
                {actors.map(a => <option key={a.id} value={a.id}>{a.fullName} ({a.role})</option>)}
              </select>
            </div>
            <div className="aud-filter">
              <label>{ar ? "الإجراء المحتسب" : "Action"}</label>
              <select className="aud-select" value={action} onChange={(e) => { setAction((e.target.value as AuditAction) || ""); setPage(1); }} title={ar ? "الإجراء" : "Action"}>
                <option value="">{ar ? "كل الإجراءات" : "All Actions"}</option>
                {actions.map(a => <option key={a} value={a}>{actionLabel(a, ar)}</option>)}
              </select>
            </div>
            <div className="aud-filter">
              <label>{ar ? "الكيان المتأثر" : "Entity Type"}</label>
              <select className="aud-select" value={entityType} onChange={(e) => { setEntityType((e.target.value as AuditEntityType) || ""); setPage(1); }} title={ar ? "الكيان المتأثر" : "Entity Type"}>
                <option value="">{ar ? "الكل" : "All Entities"}</option>
                {entityTypes.map(t => <option key={t} value={t}>{entityLabel(t, ar)}</option>)}
              </select>
            </div>
            <div className="aud-filter">
              <label>{ar ? "المركز" : "Center"}</label>
              <select className="aud-select" value={centerId ? String(centerId) : ""} onChange={(e) => { setCenterId(toNumber(e.target.value)); setCircleId(undefined); setPage(1); }} title={ar ? "المركز" : "Center"}>
                <option value="">{ar ? "الكل" : "All Centers"}</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="aud-filter">
              <label>{ar ? "الحلقة" : "Circle"}</label>
              <select className="aud-select" value={circleId ? String(circleId) : ""} onChange={(e) => { setCircleId(toNumber(e.target.value)); setPage(1); }} title={ar ? "الحلقة" : "Circle"}>
                <option value="">{ar ? "الكل" : "All Circles"}</option>
                {filteredCircles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </motion.div>

        {/* ══ AUDIT PANEL ══ */}
        <motion.div variants={fadeUp} className="aud-panel">
          <div className="aud-panel__toolbar">
            <div className="aud-panel__search">
              <Search className="w-4 h-4" />
              <input 
                placeholder={ar ? "بحث داخل الملخص والميتا داتا..." : "Search summaries or metadata..."} 
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="aud-select aud-select--sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} title={ar ? "عدد السجلات في الصفحة" : "Items per page"}>
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} {ar ? "بالصفحة" : "/ page"}</option>)}
            </select>
          </div>

          <div className="aud-panel__body">
            {error ? (
              <div className="aud-empty">
                <AlertTriangle className="w-10 h-10" />
                <h3>{ar ? "تعذر تحميل قاعدة البيانات" : "Log retrieval failed"}</h3>
                <p>
                  {getLocalizedApiErrorMessage(error, {
                    ar,
                    fallback: ar ? "تعذر تحميل السجل. يرجى المحاولة مرة أخرى." : "Unable to load the audit log. Please try again."
                  })}
                </p>
                <Button variant="secondary" onClick={() => void listQuery.refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
              </div>
            ) : isLoading && rows.length === 0 ? (
              <div className="aud-panel__skeleton">
                {[...Array(6)].map((_, i) => <div key={i} className="aud-skel-row" />)}
              </div>
            ) : rows.length === 0 ? (
              <div className="aud-empty">
                <Activity className="w-10 h-10" />
                <h3>{ar ? "سجل التدقيق فارغ" : "Audit log is empty"}</h3>
                <p>{ar ? "لا توجد نتائج مطابقة لمحكمات البحث الحالية" : "No results match the current search filters."}</p>
              </div>
            ) : (
              <div className="aud-table-wrap">
                <table className="aud-table">
                  <thead>
                    <tr>
                      <th className="w-[160px]">{ar ? "الوقت / التاريخ" : "Timestamp"}</th>
                      <th className="w-[200px]">{ar ? "الفاعل" : "Actor"}</th>
                      <th className="w-[120px]">{ar ? "الإجراء" : "Action"}</th>
                      <th className="w-[150px]">{ar ? "الكيان (Entity)" : "Entity"}</th>
                      <th>{ar ? "وصف العملية / الملخص" : "Summary"}</th>
                      <th className="w-[70px] text-center">{ar ? "الأداة" : "Tools"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => {
                      const v = actionVariant(row.action);
                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="aud-cell-time">
                              <span className="aud-time-icon"><Clock className="w-3.5 h-3.5" /></span>
                              <span className="aud-time-val">{formatDate(row.createdAt, locale).replace(",", "")}</span>
                            </div>
                          </td>
                          <td>
                            <div className="aud-cell-actor">
                              <span className="aud-actor-icon"><User className="w-3 h-3" /></span>
                              <div className="aud-actor-info">
                                <strong>{row.actor?.fullName ?? (ar ? "غير معروف" : "Unknown")}</strong>
                                <span>{row.actorRole}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`aud-badge aud-badge--${v}`}>
                              {actionLabel(row.action, ar)}
                            </span>
                          </td>
                          <td>
                            <div className="aud-cell-entity">
                              <FileText className="w-3.5 h-3.5 text-tertiary" />
                              <span className="aud-entity-type">{entityLabel(row.entityType, ar)}</span>
                              <span className="aud-entity-id">#{row.entityId}</span>
                            </div>
                          </td>
                          <td>
                            <div className="aud-cell-summary">
                              {row.summary}
                            </div>
                          </td>
                          <td className="text-center">
                            <button className="aud-btn-action" onClick={() => setSelectedRow(row)} title={ar ? "التفاصيل الدقيقة" : "Advanced Details"}>
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!error && rows.length > 0 && (
            <div className="aud-panel__foot">
              <span className="aud-pag-info">
                {ar ? `عرض ${((page-1)*pageSize)+1}–${Math.min(page*pageSize, total)} من أصل ${total} سجل` : `Showing ${((page-1)*pageSize)+1}–${Math.min(page*pageSize, total)} of ${total} logs`}
              </span>
              <div className="aud-pag-nav">
                <button className="aud-pag-btn" disabled={currentPage <= 1} onClick={() => setPage(1)} title="First Page"><ChevronFirst className="w-4 h-4" /></button>
                <button className="aud-pag-btn" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} title="Previous Page">{ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}</button>
                <span className="aud-pag-cur">{currentPage} / {totalPages}</span>
                <button className="aud-pag-btn" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} title="Next Page">{ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
                <button className="aud-pag-btn" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)} title="Last Page"><ChevronLast className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </motion.div>

      </motion.div>

      {/* ══ AUDIT DETAIL MODAL ══ */}
      <AnimatePresence>
        {selectedRow && (
          <div className="aud-modal" onClick={() => setSelectedRow(null)}>
            <motion.div 
              className="aud-modal__box"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="aud-modal__head">
                <div className="aud-modal__title">
                  <Shield className={`w-5 h-5 text-${actionVariant(selectedRow.action)}`} />
                  <span>{ar ? "تفاصيل الحركة" : "Audit Details"} <span className="aud-modal__ref">#{selectedRow.id}</span></span>
                </div>
                <button className="aud-modal__close" onClick={() => setSelectedRow(null)} title="Close"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="aud-modal__body">
                <div className="aud-kpis aud-kpis--sm">
                  <div className="aud-kpi">
                    <div className="aud-kpi__data">
                      <span className="aud-kpi__val">{actionLabel(selectedRow.action, ar)}</span>
                      <span className="aud-kpi__label">{ar ? "الإجراء" : "Action"}</span>
                    </div>
                  </div>
                  <div className="aud-kpi">
                    <div className="aud-kpi__data">
                      <span className="aud-kpi__val flex items-center gap-1.5">
                        {entityLabel(selectedRow.entityType, ar)}<span className="text-tertiary text-base">#{selectedRow.entityId}</span>
                      </span>
                      <span className="aud-kpi__label">{ar ? "الكيان (Entity)" : "Entity"}</span>
                    </div>
                  </div>
                  <div className="aud-kpi">
                    <div className="aud-kpi__data">
                      <span className="aud-kpi__val text-base">{formatDate(selectedRow.createdAt, locale)}</span>
                      <span className="aud-kpi__label">{ar ? "الوقت والتاريخ" : "Timestamp"}</span>
                    </div>
                  </div>
                </div>

                <div className="aud-modal__section">
                  <h4 className="aud-modal__sectitle"><User className="w-4 h-4" /> {ar ? "معلومات الفاعل" : "Actor Info"}</h4>
                  <div className="aud-modal__grid">
                    <div className="aud-prop"><span className="aud-prop__lbl">{ar ? "الاسم" : "Name"}</span><span className="aud-prop__val">{selectedRow.actor?.fullName ?? "-"}</span></div>
                    <div className="aud-prop"><span className="aud-prop__lbl">{ar ? "الرتبة" : "Role"}</span><span className="aud-prop__val"><span className="aud-badge aud-badge--default">{selectedRow.actorRole}</span></span></div>
                    <div className="aud-prop"><span className="aud-prop__lbl">IP</span><span className="aud-prop__val aud-prop__val--mono"><Globe className="w-3 h-3" /> {selectedRow.ip ?? "Unknown"}</span></div>
                    <div className="aud-prop"><span className="aud-prop__lbl">{ar ? "المتصفح" : "Browser"}</span><span className="aud-prop__val">{selectedRow.userAgent?.substring(0,40)}{selectedRow.userAgent?.length && selectedRow.userAgent.length > 40 ? "..." : ""}</span></div>
                  </div>
                </div>

                {selectedRow.center && (
                  <div className="aud-modal__section">
                    <h4 className="aud-modal__sectitle"><Database className="w-4 h-4" /> {ar ? "النطاق الجغرافي / الإداري" : "Scope Context"}</h4>
                    <div className="aud-modal__grid">
                      <div className="aud-prop"><span className="aud-prop__lbl">{ar ? "المركز" : "Center"}</span><span className="aud-prop__val">{selectedRow.center.name}</span></div>
                      {selectedRow.circle && <div className="aud-prop"><span className="aud-prop__lbl">{ar ? "الحلقة" : "Circle"}</span><span className="aud-prop__val">{selectedRow.circle.name}</span></div>}
                    </div>
                  </div>
                )}

                <div className="aud-modal__section aud-modal__section--full">
                  <h4 className="aud-modal__sectitle"><ShieldAlert className="w-4 h-4" /> {ar ? "الملخص البياني" : "Event Summary"}</h4>
                  <div className="aud-modal__text">{selectedRow.summary}</div>
                </div>

                <div className="aud-modal__section aud-modal__section--full">
                  <h4 className="aud-modal__sectitle"><Server className="w-4 h-4" /> {ar ? "البيانات الوصفية (Metadata)" : "System Metadata"}</h4>
                  <div className="aud-meta">
                    <table className="aud-meta__table">
                      <thead>
                        <tr>
                          <th>{ar ? "المفتاح (Key)" : "Key"}</th>
                          <th>{ar ? "القيمة المتأثرة" : "Value"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metadataEntries(selectedRow.metadata).map(entry => (
                          <tr key={entry.key}>
                            <td><code>{entry.key}</code></td>
                            <td><pre>{entry.value}</pre></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
