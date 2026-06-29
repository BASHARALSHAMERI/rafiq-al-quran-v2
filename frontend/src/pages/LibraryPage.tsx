import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive, BookOpen, ChevronLeft, ChevronRight, Download, FileText, PencilLine,
  RefreshCw, Search, Upload, X, Library as LibraryIcon, FolderOpen, Eye,
  FileImage, FilePlus2, Headphones, PlayCircle
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { LoadingState } from "../components/ui/LoadingState";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { useAuthStore } from "../features/auth/auth.store";
import type { Role } from "../features/auth/types";
import {
  LIBRARY_QUERY_KEYS, useArchiveLibraryItemMutation, useDownloadLibraryItemMutation,
  useLibraryCategoriesQuery, useLibraryItemsQuery, useUpdateLibraryItemMutation,
  useUploadLibraryItemMutation
} from "../features/library/library.hooks";
import { libraryApi } from "../features/library/library.api";
import type { BookCategory, LibraryCategory, LibraryItem, LibraryItemStatus, LibraryItemType, LibraryVisibility } from "../features/library/types";
import { ORG_QUERY_KEYS, useCentersQuery, useCirclesQuery } from "../features/org/org.hooks";
import { canReadCenters, canReadCircles } from "../features/org/org.permissions";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import { entityFeedback, notifyError, notifySuccess, type LocalizedLabel } from "../shared/ui/feedback";
import { useI18n } from "../app/i18n";

import { stagger, fadeUp } from "../shared/pageAnimations";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const PAGE_SIZES = [10, 20, 50] as const;
const WRITE_ROLES = new Set<Role>(["SUPER_ADMIN", "CENTER_ADMIN"]);
const LIBRARY_FILE_ENTITY: LocalizedLabel = { ar: "الملف", en: "file" };
const LIBRARY_FILES_ENTITY: LocalizedLabel = { ar: "الملفات", en: "files" };
const posInt = (v: string): number | undefined => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : undefined; };

const fmtSize = (v: number): string => {
  if (!Number.isFinite(v) || v <= 0) return "—";
  if (v < 1024) return `${v} B`;
  const kb = v / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

const fmtDate = (v?: string | null, ar?: boolean): string => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US", { year: "numeric", month: "short", day: "numeric" });
};

const fileIcon = (mime: string, type?: LibraryItemType) => {
  if (type === "AUDIO" || mime.startsWith("audio/")) return Headphones;
  if (type === "VIDEO" || mime.startsWith("video/")) return PlayCircle;
  if (mime.startsWith("image/")) return FileImage;
  return FileText;
};

const fileAccent = (mime: string, type?: LibraryItemType): string => {
  if (type === "AUDIO" || mime.startsWith("audio/")) return "lib-file-accent--violet";
  if (type === "VIDEO" || mime.startsWith("video/")) return "lib-file-accent--amber";
  if (mime.startsWith("image/")) return "lib-file-accent--sky";
  if (mime.includes("pdf")) return "lib-file-accent--rose";
  if (mime.includes("word") || mime.includes("docx")) return "lib-file-accent--blue";
  return "lib-file-accent--emerald";
};

const isCategoryCompat = (cat: LibraryCategory, vis: LibraryVisibility, centerId?: number): boolean => {
  if (vis === "ORG") return cat.centerId === null;
  if (cat.centerId === null) return true;
  return centerId ? cat.centerId === centerId : false;
};

const BOOK_CATEGORIES: BookCategory[] = ["TAFSIR", "FIQH", "HADITH", "MATN", "SIRA", "GENERAL"];

type UploadForm = { title: string; description: string; visibility: LibraryVisibility; type: LibraryItemType; centerId: string; circleId: string; categoryId: string; bookCategory: BookCategory | ""; file: File | null; cover: File | null };
type EditForm = { title: string; description: string; visibility: LibraryVisibility; status: LibraryItemStatus; type: LibraryItemType; centerId: string; circleId: string; categoryId: string; bookCategory: BookCategory | "" };

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */
export default function LibraryPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const canUpload = Boolean(user?.role && WRITE_ROLES.has(user.role));
    const canLoadCenters = canReadCenters(user?.role);
  const canLoadCircles = canReadCircles(user?.role);

  const visLabels: Record<LibraryVisibility, string> = { ORG: ar ? "مؤسسي" : "Organization", CENTER: ar ? "مركز" : "Center", CIRCLE: ar ? "حلقة" : "Circle" };
  const statLabels: Record<LibraryItemStatus, string> = { ACTIVE: ar ? "نشط" : "Active", ARCHIVED: ar ? "مؤرشف" : "Archived" };
  const typeLabels: Record<LibraryItemType, string> = { DOCUMENT: ar ? "مستند" : "Document", AUDIO: ar ? "صوتي" : "Audio", VIDEO: ar ? "فيديو" : "Video" };
  const bookCatLabels: Record<BookCategory, string> = {
    TAFSIR: ar ? "تفسير" : "Tafsir",
    FIQH: ar ? "فقه" : "Fiqh",
    HADITH: ar ? "حديث" : "Hadith",
    MATN: ar ? "متن" : "Matn",
    SIRA: ar ? "سيرة" : "Sira",
    GENERAL: ar ? "عام" : "General"
  };

  // ── State ──
  const [search, setSearch] = useState("");
  const [centerId] = useState<number | undefined>();
  const [circleId] = useState<number | undefined>();
  const [catId] = useState<number | undefined>();
  const [vis] = useState<LibraryVisibility | "">("");
  const [stat, setStat] = useState<LibraryItemStatus | "">("ACTIVE");
  const [type, setType] = useState<LibraryItemType | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uf, setUf] = useState<UploadForm>({ title: "", description: "", visibility: "CENTER", type: "DOCUMENT", centerId: "", circleId: "", categoryId: "", bookCategory: "", file: null, cover: null });

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<LibraryItem | null>(null);
  const [ef, setEf] = useState<EditForm>({ title: "", description: "", visibility: "CENTER", status: "ACTIVE", type: "DOCUMENT", centerId: "", circleId: "", categoryId: "", bookCategory: "" });

  const [dlId, setDlId] = useState<number | null>(null);
  const [archId, setArchId] = useState<number | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<LibraryItem | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);

  // ── Queries ──
  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const circlesQ = useCirclesQuery(centerId, { enabled: canLoadCircles });
  const catsQ = useLibraryCategoriesQuery(centerId);
  const itemsQ = useLibraryItemsQuery({ centerId, circleId, categoryId: catId, bookCategory: undefined, q: search.trim() || undefined, visibility: vis || undefined, status: stat || undefined, type: type || undefined, page, pageSize });

  const ufCenterId = posInt(uf.centerId);
  const ufCirclesQ = useCirclesQuery(ufCenterId, { enabled: canLoadCircles });
  const ufCatsQ = useLibraryCategoriesQuery(ufCenterId);
  const efCenterId = posInt(ef.centerId);
  const efCirclesQ = useCirclesQuery(efCenterId, { enabled: canLoadCircles });
  const efCatsQ = useLibraryCategoriesQuery(efCenterId);

  const uploadM = useUploadLibraryItemMutation();
  const updateM = useUpdateLibraryItemMutation();
  const archiveM = useArchiveLibraryItemMutation();
  const downloadM = useDownloadLibraryItemMutation();

  const fallbackCenters = useMemo(() => {
    const uniqueCenters = new Map<number, { id: number; name: string }>();

    for (const circle of circlesQ.data?.items ?? []) {
      if (!circle.centerId) {
        continue;
      }

      uniqueCenters.set(circle.centerId, {
        id: circle.centerId,
        name: circle.center?.name ?? `#${circle.centerId}`
      });
    }

    return Array.from(uniqueCenters.values());
  }, [circlesQ.data?.items]);
  const centers = canLoadCenters ? centersQ.data?.items ?? [] : fallbackCenters;
  const cats = catsQ.data ?? [];
  const items = itemsQ.data?.data ?? [];
  const totalItems = itemsQ.data?.total ?? items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const curPage = Math.min(page, totalPages);

  const visibilityOpts = useMemo(() => user?.role === "SUPER_ADMIN" ? (["ORG", "CENTER", "CIRCLE"] as const) : (["CENTER", "CIRCLE"] as const), [user?.role]);
  const ufCats = useMemo(() => (ufCatsQ.data ?? []).filter(c => isCategoryCompat(c, uf.visibility, ufCenterId)), [ufCatsQ.data, uf.visibility, ufCenterId]);
  const efCats = useMemo(() => (efCatsQ.data ?? []).filter(c => isCategoryCompat(c, ef.visibility, efCenterId)), [efCatsQ.data, ef.visibility, efCenterId]);
  useEffect(() => { if (page !== curPage) setPage(curPage); }, [curPage, page]);

  const canManage = (item: LibraryItem) => { if (!user || !canUpload) return false; if (user.role === "TEACHER") return item.createdById === user.id; return true; };

  // ── Actions ──
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: LIBRARY_QUERY_KEYS.all }), qc.invalidateQueries({ queryKey: ORG_QUERY_KEYS.centers() })]); };

  const openUpload = () => {
    const dc = centerId ?? (centers.length === 1 ? centers[0].id : undefined);
    setUf({ title: "", description: "", visibility: "CENTER", type: "DOCUMENT", centerId: dc ? String(dc) : "", circleId: "", categoryId: "", bookCategory: "", file: null, cover: null }); setUploadOpen(true);
  };

  const openEdit = (item: LibraryItem) => {
    setEditItem(item);
    setEf({ title: item.title, description: item.description ?? "", visibility: item.visibility, status: item.status, type: item.type, centerId: item.centerId ? String(item.centerId) : "", circleId: item.circleId ? String(item.circleId) : "", categoryId: item.categoryId ? String(item.categoryId) : "", bookCategory: item.bookCategory ?? "" });
    setEditOpen(true); setMenuId(null);
  };

  const doUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const t = uf.title.trim(); const cid = posInt(uf.centerId); const crid = posInt(uf.circleId); const catid = posInt(uf.categoryId);
      if (t.length < 2) throw new Error(ar ? "عنوان الملف مطلوب" : "Title required");
      if (!uf.file) throw new Error(ar ? "الرجاء اختيار ملف" : "Select a file");
      if (uf.visibility === "ORG" && user?.role !== "SUPER_ADMIN") throw new Error(ar ? "صلاحية مؤسسية فقط" : "Org-level restricted");
      if (uf.visibility === "CENTER" && !cid) throw new Error(ar ? "اختر المركز" : "Select center");
      if (uf.visibility === "CIRCLE" && !crid) throw new Error(ar ? "اختر الحلقة" : "Select circle");
      await uploadM.mutateAsync({ title: t, description: uf.description.trim() || undefined, visibility: uf.visibility, type: uf.type, centerId: uf.visibility === "ORG" ? undefined : cid, circleId: uf.visibility === "CIRCLE" ? crid : undefined, categoryId: catid, bookCategory: uf.bookCategory || undefined, file: uf.file, cover: uf.cover || undefined });
      setUploadOpen(false);
      notifySuccess(entityFeedback.success(ar, "create", LIBRARY_FILE_ENTITY));
    } catch (err) {
      notifyError(
        getLocalizedApiErrorMessage(err, {
          ar,
          fallback: entityFeedback.error(ar, "create", LIBRARY_FILE_ENTITY)
        })
      );
    }
  };

  const doEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editItem) return;
    try {
      const t = ef.title.trim(); const cid = posInt(ef.centerId); const crid = posInt(ef.circleId); const catid = posInt(ef.categoryId);
      if (t.length < 2) throw new Error(ar ? "عنوان الملف مطلوب" : "Title required");
      if (ef.visibility === "CENTER" && !cid) throw new Error(ar ? "اختر المركز" : "Select center");
      if (ef.visibility === "CIRCLE" && !crid) throw new Error(ar ? "اختر الحلقة" : "Select circle");
      await updateM.mutateAsync({ itemId: editItem.id, payload: { title: t, description: ef.description.trim() || null, visibility: ef.visibility, status: ef.status, type: ef.type, categoryId: catid ?? null, bookCategory: ef.bookCategory || null, centerId: ef.visibility === "ORG" ? null : ef.visibility === "CENTER" ? (cid ?? null) : (cid ?? undefined), circleId: ef.visibility === "CIRCLE" ? (crid ?? null) : null } });
      setEditOpen(false); setEditItem(null);
      notifySuccess(entityFeedback.success(ar, "update", LIBRARY_FILE_ENTITY));
    } catch (err) {
      notifyError(
        getLocalizedApiErrorMessage(err, {
          ar,
          fallback: entityFeedback.error(ar, "update", LIBRARY_FILE_ENTITY)
        })
      );
    }
  };

  const doArchive = async (item: LibraryItem) => {
    if (!canManage(item)) return;
    setArchiveTarget(item); setMenuId(null);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchId(archiveTarget.id);
    try {
      await archiveM.mutateAsync(archiveTarget.id);
      notifySuccess(entityFeedback.success(ar, "archive", LIBRARY_FILE_ENTITY));
      setArchiveTarget(null);
    }
    catch (err) {
      notifyError(
        getLocalizedApiErrorMessage(err, {
          ar,
          fallback: entityFeedback.error(ar, "archive", LIBRARY_FILE_ENTITY)
        })
      );
    }
    finally { setArchId(null); }
  };

  const doDownload = async (item: LibraryItem) => {
    setDlId(item.id); setMenuId(null);
    try {
      const res = await downloadM.mutateAsync(item.id);
      const u = URL.createObjectURL(res.blob); const a = document.createElement("a"); a.href = u; a.download = res.fileName || item.fileName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u);
      notifySuccess(entityFeedback.success(ar, "export", LIBRARY_FILE_ENTITY));
    } catch (err) {
      notifyError(
        getLocalizedApiErrorMessage(err, {
          ar,
          fallback: ar ? "تعذر تنزيل الملف. يرجى المحاولة مرة أخرى." : "Unable to download the file. Please try again."
        })
      );
    }
    finally { setDlId(null); }
  };

  return (
    <div className="page admin-modern-page ctr-workspace lib-workspace" onClick={() => menuId && setMenuId(null)}>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">

        {/* ═══ TOP BAR ═══ */}
        <motion.div variants={fadeUp}>
          <PageHeader
            title={ar ? "المكتبة الإلكترونية" : "Digital Library"}
            description={ar ? "إدارة المواد التعليمية مع الصلاحيات" : "Manage educational resources with role-based scoping"}
            icon={<LibraryIcon className="w-6 h-6" />}
            actions={
              <>
                <Button variant="secondary" size="sm" leftIcon={<RefreshCw className={`w-4 h-4 ${itemsQ.isFetching ? "animate-spin" : ""}`} />} onClick={refresh}>{ar ? "تحديث" : "Refresh"}</Button>
                {canUpload && <Button variant="primary" size="sm" leftIcon={<Upload className="w-4 h-4" />} onClick={openUpload}>{ar ? "رفع ملف" : "Upload"}</Button>}
              </>
            }
          />
        </motion.div>

        {/* ═══ KPI STRIP ═══ */}
        <motion.div variants={fadeUp} className="ctr-kpis-modern mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="ctr-kpi-modern brand"><div className="ctr-kpi-icon-wrap"><BookOpen className="w-5 h-5" /></div><div className="ctr-kpi-content"><span className="ctr-kpi-val">{totalItems}</span><span className="ctr-kpi-label">{ar ? "ملف" : "Files"}</span></div></div>
          <div className="ctr-kpi-modern violet"><div className="ctr-kpi-icon-wrap"><FolderOpen className="w-5 h-5" /></div><div className="ctr-kpi-content"><span className="ctr-kpi-val">{cats.length}</span><span className="ctr-kpi-label">{ar ? "تصنيف" : "Categories"}</span></div></div>
          <div className="ctr-kpi-modern emerald"><div className="ctr-kpi-icon-wrap"><Eye className="w-5 h-5" /></div><div className="ctr-kpi-content"><span className="ctr-kpi-val">{stat === "ACTIVE" ? (ar ? "نشط" : "Active") : stat === "ARCHIVED" ? (ar ? "مؤرشف" : "Archived") : (ar ? "الكل" : "All")}</span><span className="ctr-kpi-label">{ar ? "الفلتر" : "Filter"}</span></div></div>
        </motion.div>

        {/* ═══ TOOLBAR ═══ */}
        <motion.div variants={fadeUp} className="ctr-controls mb-6 lib-controls-row">
          <div className="ctr-search-wrap lib-search-wrap">
            <Search className="ctr-search-icon" size={16} />
            <input className="ctr-search-input lib-search-input" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={ar ? "بحث بالعنوان أو الوصف..." : "Search by title or description..."} title={ar ? "بحث" : "Search"} />
          </div>
          <div className="ctr-filters-group lib-filters-group">
            <select className="ctr-search-input lib-filter-select" value={type} onChange={e => { setType((e.target.value as LibraryItemType | "") || ""); setPage(1); }} title={ar ? "النوع" : "Type"}>
              <option value="">{ar ? "النوع" : "Type"}</option>
              {(["DOCUMENT", "AUDIO", "VIDEO"] as const).map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
            </select>
            <select className="ctr-search-input lib-filter-select" value={stat} onChange={e => { setStat((e.target.value as LibraryItemStatus | "") || ""); setPage(1); }} title={ar ? "الحالة" : "Status"}>
              <option value="">{ar ? "الحالة" : "Status"}</option>
              {(["ACTIVE", "ARCHIVED"] as const).map(s => <option key={s} value={s}>{statLabels[s]}</option>)}
            </select>
            <div className="ctr-view-toggle flex gap-1 lib-view-toggle">
              <button className={`ctr-view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Grid">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
              </button>
              <button className={`ctr-view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="List">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="3" rx="1"/><rect x="1" y="7" width="14" height="3" rx="1"/><rect x="1" y="12" width="14" height="3" rx="1"/></svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ═══ CONTENT ═══ */}
        <motion.div variants={fadeUp}>
          {itemsQ.isLoading && <LoadingState />}
          {itemsQ.isError && (
            <ErrorState
              title={ar ? "تعذر تحميل الملفات" : "Unable to load files"}
              description={getLocalizedApiErrorMessage(itemsQ.error, {
                ar,
                fallback: entityFeedback.error(ar, "load", LIBRARY_FILES_ENTITY)
              })}
              onRetry={() => void itemsQ.refetch()}
            />
          )}
          {!itemsQ.isLoading && !itemsQ.isError && items.length === 0 && (
            <EmptyState
              title={ar ? "لا توجد مواد" : "No files"}
              description={ar ? "جرّب تعديل الفلاتر أو رفع ملف جديد" : "Try adjusting filters or upload a new file"}
            />
          )}

          {!itemsQ.isLoading && !itemsQ.isError && items.length > 0 && (
            <>
              <div className={viewMode === "grid" ? "lib-grid" : "lib-list"}>
                {items.map((item, idx) => {
                  const FIcon = fileIcon(item.mimeType, item.type);
                  const accent = fileAccent(item.mimeType, item.type);
                  return (
                    <motion.div key={item.id} className={viewMode === "grid" ? "lib-card" : "lib-row"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                      {viewMode === "grid" ? (
                        item.coverStorageKey ? (
                          <div className="lib-card__cover-banner">
                            <img 
                              src={libraryApi.getItemCoverUrl(item.id)} 
                              alt={item.title}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        ) : (
                          <div className={`lib-card__cover-fallback ${accent}`}>
                            <FIcon className="w-10 h-10 opacity-30" />
                          </div>
                        )
                      ) : (
                        <div className={`lib-card__icon ${accent}`}>
                          <FIcon className="w-5 h-5" />
                        </div>
                      )}

                      {/* Content */}
                      <div className={viewMode === "grid" ? "lib-card__inner" : "lib-card__body w-full flex items-center justify-between gap-4"}>
                        <div className={viewMode === "list" ? "flex-1 min-w-0" : "flex-1"}>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="lib-card__title">{item.title}</h4>
                            {viewMode === "grid" && item.bookCategory && (
                              <Badge variant="primary" size="sm" className="whitespace-nowrap">
                                {bookCatLabels[item.bookCategory]}
                              </Badge>
                            )}
                          </div>
                          <span className="lib-card__file" title={item.fileName}>
                            {(() => {
                              if (item.description) return item.description;
                              try { return decodeURIComponent(item.fileName); } catch { return item.fileName; }
                            })()}
                          </span>
                          <div className="lib-card__meta">
                            <Badge variant="info" size="sm">{visLabels[item.visibility]}</Badge>
                            <Badge variant={item.status === "ACTIVE" ? "success" : "default"} size="sm">{statLabels[item.status]}</Badge>
                            {item.category && <span className="lib-card__cat">{item.category.name}</span>}
                            {viewMode === "list" && item.bookCategory && (
                              <Badge variant="primary" size="sm">
                                {bookCatLabels[item.bookCategory]}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className={viewMode === "list" ? "lib-card__details flex items-center gap-4 text-sm" : "lib-card__details"}>
                          <span>{fmtSize(item.fileSize)}</span>
                          <span>{fmtDate(item.createdAt, ar)}</span>
                          {viewMode === "grid" && <span>{item.createdBy?.fullName ?? "—"}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lib-card__actions" style={{ opacity: 1 }}>
                        <button className="lib-action-btn lib-action-btn--dl" onClick={() => doDownload(item)} disabled={dlId === item.id} title={ar ? "تنزيل" : "Download"}>
                          <Download className={`w-4 h-4 ${dlId === item.id ? "animate-spin" : ""}`} />
                        </button>
                        {canManage(item) && (
                          <>
                            <button className="lib-action-btn text-blue-600" onClick={() => openEdit(item)} title={ar ? "تعديل" : "Edit"}>
                              <PencilLine className="w-4 h-4" />
                            </button>
                            <button className="lib-action-btn text-red-600" onClick={() => doArchive(item)} disabled={archId === item.id} title={ar ? "أرشفة" : "Archive"}>
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="ctr-footer mt-6">
                <div className="ctr-page-size">
                  <span>{ar ? "الصفوف:" : "Rows:"}</span>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} title={ar ? "حجم الصفحة" : "Page size"}>
                    {PAGE_SIZES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="ctr-page-info">
                  {ar 
                    ? `عرض ${Math.min(totalItems, (curPage - 1) * pageSize + 1)} - ${Math.min(totalItems, curPage * pageSize)} من ${totalItems}`
                    : `Showing ${Math.min(totalItems, (curPage - 1) * pageSize + 1)} - ${Math.min(totalItems, curPage * pageSize)} of ${totalItems}`
                  }
                </div>
                <div className="ctr-page-controls">
                  <button className="ctr-page-btn" disabled={curPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} title={ar ? "السابق" : "Prev"}>
                    {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  </button>
                  <button className="ctr-page-btn active">{curPage}</button>
                  <button className="ctr-page-btn" disabled={curPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} title={ar ? "التالي" : "Next"}>
                    {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>

      </motion.div>

      {/* ═══ UPLOAD MODAL ═══ */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title={ar ? "رفع ملف جديد" : "Upload New File"}
        titleIcon={<FilePlus2 className="w-5 h-5" />}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setUploadOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" form="lib-upload-form" size="sm" isLoading={uploadM.isPending}>{ar ? "رفع الملف" : "Upload"}</Button>
          </>
        }
      >
        <form id="lib-upload-form" onSubmit={doUpload}>
          <div className="flex flex-col gap-4">
            <Input label={ar ? "العنوان" : "Title"} value={uf.title} onChange={e => setUf(p => ({ ...p, title: e.target.value }))} placeholder={ar ? "عنوان الملف" : "File title"} title={ar ? "العنوان" : "Title"} required />
            <div className="flex flex-col gap-1.5">
              <label className="input-label">{ar ? "الوصف" : "Description"}</label>
              <textarea className="input-field" value={uf.description} onChange={e => setUf(p => ({ ...p, description: e.target.value }))} rows={2} placeholder={ar ? "وصف الملف" : "File description"} title={ar ? "الوصف" : "Description"} />
            </div>
            <div className="flex gap-4">
              <Select className="flex-1" label={ar ? "النوع" : "Type"} value={uf.type} onChange={e => setUf(p => ({ ...p, type: e.target.value as LibraryItemType }))} title={ar ? "النوع" : "Type"}>{(["DOCUMENT", "AUDIO", "VIDEO"] as const).map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}</Select>
              <Select className="flex-1" label={ar ? "الظهور" : "Visibility"} value={uf.visibility} onChange={e => { const v = e.target.value as LibraryVisibility; setUf(p => ({ ...p, visibility: v, centerId: v === "ORG" ? "" : p.centerId, circleId: v === "CIRCLE" ? p.circleId : "" })); }} title={ar ? "الظهور" : "Visibility"}>{visibilityOpts.map(v => <option key={v} value={v}>{visLabels[v]}</option>)}</Select>
            </div>
            <div className="flex gap-4">
              {uf.visibility !== "ORG" && <Select className="flex-1" label={ar ? "المركز" : "Center"} value={uf.centerId} onChange={e => setUf(p => ({ ...p, centerId: e.target.value, circleId: "", categoryId: "" }))} title={ar ? "المركز" : "Center"} required><option value="">{ar ? "اختر" : "Select"}</option>{centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}
              {uf.visibility === "CIRCLE" && <Select className="flex-1" label={ar ? "الحلقة" : "Circle"} value={uf.circleId} onChange={e => setUf(p => ({ ...p, circleId: e.target.value }))} title={ar ? "الحلقة" : "Circle"} required><option value="">{ar ? "اختر" : "Select"}</option>{(ufCirclesQ.data?.items ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}
            </div>
            <div className="flex gap-4">
              <Select className="flex-1" label={ar ? "التصنيف الإداري" : "Admin Category"} value={uf.categoryId} onChange={e => setUf(p => ({ ...p, categoryId: e.target.value }))} title={ar ? "التصنيف" : "Category"}><option value="">{ar ? "بدون" : "None"}</option>{ufCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
              <Select className="flex-1" label={ar ? "تصنيف الكتاب" : "Book Class"} value={uf.bookCategory} onChange={e => setUf(p => ({ ...p, bookCategory: e.target.value as BookCategory }))} title={ar ? "تصنيف الكتاب" : "Book Category"}><option value="">{ar ? "بدون" : "None"}</option>{BOOK_CATEGORIES.map(c => <option key={c} value={c}>{bookCatLabels[c]}</option>)}</Select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="input-label">{ar ? "الملف" : "File"}</label>
                <div className="lib-file-drop">
                  <Upload className="w-5 h-5" />
                  <span>{uf.file ? uf.file.name : (ar ? "اختر ملف" : "Choose file")}</span>
                  <input type="file" accept=".pdf,.docx,.mp3,.wav,.mp4,image/*" onChange={e => { const f = e.target.files?.[0] ?? null; setUf(p => ({ ...p, file: f })); }} title={ar ? "الملف" : "File"} required />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="input-label">{ar ? "الغلاف" : "Cover"}</label>
                <div className="lib-file-drop lib-file-drop--cover">
                  <FileImage className="w-5 h-5" />
                  <span>{uf.cover ? uf.cover.name : (ar ? "صورة الغلاف" : "Cover Image")}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files?.[0] ?? null; setUf(p => ({ ...p, cover: f })); }} title={ar ? "الغلاف" : "Cover"} />
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ═══ EDIT MODAL ═══ */}
      <Modal
        isOpen={editOpen}
        onClose={() => { setEditOpen(false); setEditItem(null); }}
        title={ar ? "تعديل مادة المكتبة" : "Edit Library Item"}
        titleIcon={<PencilLine className="w-5 h-5" />}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditOpen(false); setEditItem(null); }}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" form="lib-edit-form" size="sm" isLoading={updateM.isPending}>{ar ? "حفظ" : "Save"}</Button>
          </>
        }
      >
        <form id="lib-edit-form" onSubmit={doEdit}>
          <div className="flex flex-col gap-4">
            <Input label={ar ? "العنوان" : "Title"} value={ef.title} onChange={e => setEf(p => ({ ...p, title: e.target.value }))} placeholder={ar ? "عنوان الملف" : "File title"} title={ar ? "العنوان" : "Title"} required />
            <div className="flex flex-col gap-1.5">
              <label className="input-label">{ar ? "الوصف" : "Description"}</label>
              <textarea className="input-field" value={ef.description} onChange={e => setEf(p => ({ ...p, description: e.target.value }))} rows={2} placeholder={ar ? "وصف الملف" : "File description"} title={ar ? "الوصف" : "Description"} />
            </div>
            <div className="flex gap-4">
              <Select className="flex-1" label={ar ? "النوع" : "Type"} value={ef.type} onChange={e => setEf(p => ({ ...p, type: e.target.value as LibraryItemType }))} title={ar ? "النوع" : "Type"}>{(["DOCUMENT", "AUDIO", "VIDEO"] as const).map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}</Select>
              <Select className="flex-1" label={ar ? "الظهور" : "Visibility"} value={ef.visibility} onChange={e => { const v = e.target.value as LibraryVisibility; setEf(p => ({ ...p, visibility: v, centerId: v === "ORG" ? "" : p.centerId, circleId: v === "CIRCLE" ? p.circleId : "" })); }} title={ar ? "الظهور" : "Visibility"}>{visibilityOpts.map(v => <option key={v} value={v}>{visLabels[v]}</option>)}</Select>
            </div>
            <div className="flex gap-4">
              {ef.visibility !== "ORG" && <Select className="flex-1" label={ar ? "المركز" : "Center"} value={ef.centerId} onChange={e => setEf(p => ({ ...p, centerId: e.target.value, circleId: "", categoryId: "" }))} title={ar ? "المركز" : "Center"} required><option value="">{ar ? "اختر" : "Select"}</option>{centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}
              {ef.visibility === "CIRCLE" && <Select className="flex-1" label={ar ? "الحلقة" : "Circle"} value={ef.circleId} onChange={e => setEf(p => ({ ...p, circleId: e.target.value }))} title={ar ? "الحلقة" : "Circle"} required><option value="">{ar ? "اختر" : "Select"}</option>{(efCirclesQ.data?.items ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}
              {ef.visibility === "ORG" && <Select className="flex-1" label={ar ? "الحالة" : "Status"} value={ef.status} onChange={e => setEf(p => ({ ...p, status: e.target.value as LibraryItemStatus }))} title={ar ? "الحالة" : "Status"}>{(["ACTIVE", "ARCHIVED"] as const).map(s => <option key={s} value={s}>{statLabels[s]}</option>)}</Select>}
            </div>
            <div className="flex gap-4">
              <Select className="flex-1" label={ar ? "التصنيف الإداري" : "Admin Category"} value={ef.categoryId} onChange={e => setEf(p => ({ ...p, categoryId: e.target.value }))} title={ar ? "التصنيف" : "Category"}><option value="">{ar ? "بدون" : "None"}</option>{efCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
              <Select className="flex-1" label={ar ? "تصنيف الكتاب" : "Book Class"} value={ef.bookCategory} onChange={e => setEf(p => ({ ...p, bookCategory: e.target.value as BookCategory }))} title={ar ? "تصنيف الكتاب" : "Book Category"}><option value="">{ar ? "بدون" : "None"}</option>{BOOK_CATEGORIES.map(c => <option key={c} value={c}>{bookCatLabels[c]}</option>)}</Select>
            </div>
            <div className="flex gap-4">
              {ef.visibility !== "ORG" && <Select className="flex-1" label={ar ? "الحالة" : "Status"} value={ef.status} onChange={e => setEf(p => ({ ...p, status: e.target.value as LibraryItemStatus }))} title={ar ? "الحالة" : "Status"}>{(["ACTIVE", "ARCHIVED"] as const).map(s => <option key={s} value={s}>{statLabels[s]}</option>)}</Select>}
            </div>
            <div className="flex gap-4 opacity-60">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="input-label">{ar ? "الملف (لا يمكن تغييره)" : "File (Cannot be changed)"}</label>
                <div className="lib-file-drop cursor-not-allowed">
                  <FileText className="w-5 h-5" />
                  <span className="truncate max-w-[150px]" title={editItem?.fileName}>{editItem?.fileName}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="input-label">{ar ? "الغلاف (لا يمكن تغييره)" : "Cover (Cannot be changed)"}</label>
                <div className="lib-file-drop lib-file-drop--cover cursor-not-allowed">
                  <FileImage className="w-5 h-5" />
                  <span>{editItem?.coverStorageKey ? (ar ? "يوجد غلاف" : "Has Cover") : (ar ? "لا يوجد غلاف" : "No Cover")}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={archiveTarget !== null}
        onClose={() => { if (!archId) setArchiveTarget(null); }}
        onConfirm={confirmArchive}
        title={ar ? "أرشفة الملف" : "Archive file"}
        description={
          archiveTarget
            ? ar
              ? `سيتم نقل ${archiveTarget.title} إلى الأرشيف دون حذف الملف.`
              : `${archiveTarget.title} will be moved to the archive without deleting the file.`
            : undefined
        }
        confirmLabel={ar ? "أرشفة" : "Archive"}
        cancelLabel={ar ? "إلغاء" : "Cancel"}
        isConfirming={archId !== null}
      >
        <p className="lib-confirm-copy">
          {ar
            ? "يمكنك إعادة عرض الملف لاحقًا من الحالة المؤرشفة إذا لزم الأمر."
            : "You can still access this item later from archived results if needed."}
        </p>
      </ConfirmModal>
    </div>
  );
}
