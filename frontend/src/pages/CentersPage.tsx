import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";
import { useI18n } from "../app/i18n";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useAuthStore } from "../features/auth/auth.store";
import {
  ORG_QUERY_KEYS,
  useCentersQuery,
  useCirclesQuery,
  useCreateCenterMutation,
  useUpdateCenterMutation,
  useUpdateCenterStatusMutation
} from "../features/org/org.hooks";
import type { Center, CircleScheduleRow, CreateCenterPayload } from "../features/org/types";
import { CenterCard } from "../features/org/components/centers/CenterCard";
import { CenterFormModal } from "../features/org/components/centers/CenterFormModal";
import { CentersKpis } from "../features/org/components/centers/CentersKpis";
import {
  PAGE_SIZES,
  emptyCenterDraft,
  type CenterDraft,
  type FormMode,
  type GenderFilter,
  type QuickRole,
  type StatusFilter,
  validateCenter
} from "../features/org/components/centers/centers.types";
import {
  createEmptyScheduleDraftRows,
  serializeScheduleDraftRows,
  type CircleScheduleDraftRow
} from "../features/org/circleSchedule";
import { useCreateUserMutation, useUsersQuery, USERS_QUERY_KEYS } from "../features/users/users.hooks";
import { RoleAwareUserFormModal } from "../features/users/components/UserFormModal";
import type { Role } from "../features/auth/types";
import { getApiErrorMessage } from "../shared/api/error";
import { stagger, fadeUp } from "../shared/pageAnimations";
import { apiClient } from "../shared/api/http";

function useStaffSchedulesForCenter(centerId: number | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["staffSchedulesCenter", centerId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Array<{ userId: number; isActive: boolean; slots: any[] }> }>(
        "/staff-schedules",
        { params: { centerId, staffRole: "CENTER_ADMIN", isActive: true } }
      );
      return res.data.data;
    },
    enabled: options?.enabled ?? true
  });
}

const slotsToScheduleRows = (
  slots: Array<{
    dayOfWeek: string;
    mode: "CLOCK" | "PRAYER";
    fromTime?: string | null;
    toTime?: string | null;
    fromPrayer?: "FAJR" | "DHUHR" | "ASR" | "MAGHRIB" | "ISHA" | null;
    toPrayer?: "FAJR" | "DHUHR" | "ASR" | "MAGHRIB" | "ISHA" | null;
  }>
): CircleScheduleDraftRow[] => {
  const rows = createEmptyScheduleDraftRows();
  const byDay = new Map(rows.map((row) => [row.day, row]));

  for (const slot of slots) {
    const target = byDay.get(slot.dayOfWeek as CircleScheduleDraftRow["day"]);
    if (!target || target.enabled) continue;
    target.enabled = true;
    target.mode = slot.mode;
    target.fromTime = slot.fromTime ?? "";
    target.toTime = slot.toTime ?? "";
    target.fromPrayer = (slot.fromPrayer ?? "MAGHRIB") as CircleScheduleDraftRow["fromPrayer"];
    target.toPrayer = (slot.toPrayer ?? "ISHA") as CircleScheduleDraftRow["toPrayer"];
  }

  return rows;
};

export default function CentersPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const qc = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "SUPER_ADMIN";

  const centersQ = useCentersQuery();
  const adminsQ = useUsersQuery({ role: "CENTER_ADMIN" as Role });
  const supervisorsQ = useUsersQuery({ role: "SUPERVISOR" as Role });
  const circlesQ = useCirclesQuery();
  const studentsQ = useUsersQuery({ role: "STUDENT" as Role });

  const createM = useCreateCenterMutation();
  const updateM = useUpdateCenterMutation();
  const statusM = useUpdateCenterStatusMutation();
  const createUserM = useCreateUserMutation();

  const [q, setQ] = useState("");
  const [gFilter, setGFilter] = useState<GenderFilter>("ALL");
  const [sFilter, setSFilter] = useState<StatusFilter>("ALL");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const [modalMode, setModalMode] = useState<FormMode | null>(null);
  const [activeCenter, setActiveCenter] = useState<Center | null>(null);
  const [draft, setDraft] = useState<CenterDraft>(emptyCenterDraft);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<Center | null>(null);
  const [quickRole, setQuickRole] = useState<QuickRole | null>(null);
  const [quickErr, setQuickErr] = useState<string | null>(null);
  const [showSlowLoadMessage, setShowSlowLoadMessage] = useState(false);

  const centerAdminSchedulesQ = useStaffSchedulesForCenter(activeCenter?.id, {
    enabled: modalMode === "edit" && Boolean(activeCenter?.id)
  });

  const centersList = useMemo(() => centersQ.data?.items ?? [], [centersQ.data]);
  const admins = adminsQ.data?.items ?? [];
  const supervisors = supervisorsQ.data?.items ?? [];
  const allCenters = centersList.map((center) => ({ id: center.id, name: center.name }));
  const allCircles =
    circlesQ.data?.items?.map((circle) => ({ id: circle.id, name: circle.name, centerId: circle.centerId })) ?? [];
  const allStudents =
    studentsQ.data?.items?.map((student) => ({ id: student.id, fullName: student.fullName })) ?? [];

  const filtered = useMemo(() => {
    let result = centersList;
    const normalizedQuery = q.trim().toLowerCase();

    if (normalizedQuery) {
      result = result.filter((center) =>
        [center.name, center.code, center.mosqueName, center.centerAdmin?.fullName].some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedQuery)
        )
      );
    }

    if (gFilter !== "ALL") result = result.filter((center) => center.gender === gFilter);
    if (sFilter === "ACTIVE") result = result.filter((center) => center.isActive ?? true);
    if (sFilter === "INACTIVE") result = result.filter((center) => !(center.isActive ?? true));

    return result;
  }, [centersList, gFilter, q, sFilter]);

  const studentsByCenterId = useMemo(() => {
    const counts = new Map<number, number>();
    for (const circle of circlesQ.data?.items ?? []) {
      const centerId = Number(circle.centerId);
      if (!Number.isFinite(centerId) || centerId <= 0) continue;
      const students = Number(circle._count?.enrollments ?? circle._count?.students ?? 0);
      const current = counts.get(centerId) ?? 0;
      counts.set(centerId, current + (Number.isFinite(students) ? students : 0));
    }
    return counts;
  }, [circlesQ.data?.items]);

  const centerScheduleByCenterId = useMemo(() => {
    const map = new Map<number, CircleScheduleRow[]>();
    for (const circle of circlesQ.data?.items ?? []) {
      const centerId = Number(circle.centerId);
      if (!Number.isFinite(centerId) || centerId <= 0) continue;
      if (map.has(centerId)) continue;
      if (!circle.weeklySchedule?.length) continue;
      map.set(centerId, circle.weeklySchedule);
    }
    return map;
  }, [circlesQ.data?.items]);

  const totalCenters = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCenters / pageSize));
  const curPage = Math.min(page, totalPages);
  const paged = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);
  const rangeFrom = totalCenters === 0 ? 0 : (curPage - 1) * pageSize + 1;
  const rangeTo = Math.min(curPage * pageSize, totalCenters);

  const adminOpts = admins.map((userOption) => ({
    id: userOption.id,
    label: `${userOption.fullName}${userOption.isActive ? "" : ar ? " (معطل)" : " (inactive)"}`
  }));
  const supOpts = supervisors.map((userOption) => ({
    id: userOption.id,
    label: `${userOption.fullName}${userOption.isActive ? "" : ar ? " (معطل)" : " (inactive)"}`
  }));

  const pending = createM.isPending || updateM.isPending || statusM.isPending;

  useEffect(() => {
    if (!centersQ.isLoading) {
      setShowSlowLoadMessage(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowLoadMessage(true);
    }, 8_000);

    return () => window.clearTimeout(timer);
  }, [centersQ.isLoading]);

  const resetFilters = () => {
    setQ("");
    setGFilter("ALL");
    setSFilter("ALL");
    setPage(1);
  };

  const refreshAll = async () => {
    resetFilters();
    await qc.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
  };

  const openCreate = () => {
    setFormErr(null);
    setActionErr(null);
    setModalMode("create");
    setActiveCenter(null);
    setDraft(emptyCenterDraft);
  };

  const openEdit = (center: Center) => {
    setFormErr(null);
    setActionErr(null);
    setModalMode("edit");
    setActiveCenter(center);
    setDraft({
      nameAr: String(center.name ?? ""),
      gender: center.gender || "",
      logoUrl: String(center.logoUrl ?? ""),
      mosqueName: String(center.mosqueName ?? ""),
      latitude: (center as any).latitude != null ? String((center as any).latitude) : "",
      longitude: (center as any).longitude != null ? String((center as any).longitude) : "",
      allowedRadiusMeters: (center as any).allowedRadiusMeters != null ? String((center as any).allowedRadiusMeters) : "500",
      centerAdminUserId: typeof center.centerAdminUserId === "number" ? center.centerAdminUserId : "",
      supervisorUserIds: (center.centerSupervisors ?? []).map((item) => item.supervisorUserId),
      scheduleRows: createEmptyScheduleDraftRows()
    });
  };

  useEffect(() => {
    if (modalMode !== "edit" || !activeCenter || !draft.centerAdminUserId) return;
    const schedules = centerAdminSchedulesQ.data ?? [];
    const matchedSchedule =
      schedules.find((schedule) => schedule.userId === Number(draft.centerAdminUserId) && schedule.isActive) ??
      schedules.find((schedule) => schedule.isActive);
    if (!matchedSchedule) return;

    setDraft((previous) => ({
      ...previous,
      scheduleRows: slotsToScheduleRows(matchedSchedule.slots)
    }));
  }, [activeCenter, centerAdminSchedulesQ.data, draft.centerAdminUserId, modalMode]);

  const submitCenter = async () => {
    if (!modalMode) return;

    const validationError = validateCenter(draft, ar);
    if (validationError) {
      setFormErr(validationError);
      return;
    }

    if (!draft.gender) {
      setFormErr(ar ? "الجنس مطلوب" : "Gender required");
      return;
    }

    const serializedSchedule = serializeScheduleDraftRows(draft.scheduleRows);
    const shouldIncludeSchedule =
      modalMode === "create" || centerAdminSchedulesQ.data !== undefined || serializedSchedule.length > 0;

    const payload: CreateCenterPayload = {
      nameAr: draft.nameAr.trim(),
      gender: draft.gender,
      logoUrl: draft.logoUrl.trim() ? draft.logoUrl.trim() : null,
      mosqueName: draft.mosqueName.trim() || undefined,
      latitude: draft.latitude ? Number(draft.latitude) : null,
      longitude: draft.longitude ? Number(draft.longitude) : null,
      allowedRadiusMeters: draft.allowedRadiusMeters ? Number(draft.allowedRadiusMeters) : null,
      centerAdminUserId: Number(draft.centerAdminUserId),
      supervisorUserIds: draft.supervisorUserIds
    };

    if (shouldIncludeSchedule) payload.centerAdminSchedule = serializedSchedule;

    try {
      setFormErr(null);
      if (modalMode === "create") await createM.mutateAsync(payload);
      else await updateM.mutateAsync({ centerId: activeCenter!.id, payload });
      setModalMode(null);
      await refreshAll();
    } catch (error) {
      setFormErr(getApiErrorMessage(error, ar ? "تعذر الحفظ" : "Save failed"));
    }
  };

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;

    try {
      setActionErr(null);
      await statusM.mutateAsync({
        centerId: statusTarget.id,
        payload: { isActive: !(statusTarget.isActive ?? true) }
      });
      setStatusTarget(null);
      await refreshAll();
    } catch (error) {
      setActionErr(getApiErrorMessage(error, ar ? "تعذر التحديث" : "Update failed"));
    }
  };

  const openQuick = (role: QuickRole) => {
    setQuickRole(role);
    setQuickErr(null);
  };

  const submitQuickUser = async (payload: Record<string, unknown>) => {
    if (!quickRole) return;

    try {
      setQuickErr(null);
      const created = await createUserM.mutateAsync(payload as Parameters<typeof createUserM.mutateAsync>[0]);
      const savedRole = quickRole;
      setQuickRole(null);

      if (savedRole === "CENTER_ADMIN") {
        setDraft((previous) => ({ ...previous, centerAdminUserId: created.id }));
      } else {
        setDraft((previous) => ({
          ...previous,
          supervisorUserIds: [...new Set([...previous.supervisorUserIds, created.id])]
        }));
      }

      await qc.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    } catch (error) {
      setQuickErr(getApiErrorMessage(error, ar ? "تعذر الإنشاء" : "Creation failed"));
    }
  };

  return (
    <>
      <div className="page ctr-page-modern ctr-page-centers relative z-10" dir={ar ? "rtl" : "ltr"}>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
          <motion.div variants={fadeUp}>
            <PageHeader
              title={ar ? "إدارة المراكز" : "Centers Management"}
              description={ar ? "تنظيم المراكز والحلقات والإشراف" : "Organize centers, circles, and supervision"}
              icon={<Building2 className="w-6 h-6" />}
              actions={
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button
                    variant="secondary"
                    className="glass-btn"
                    size="sm"
                    leftIcon={<RefreshCw className={`w-4 h-4 ${centersQ.isFetching ? "animate-spin" : ""}`} />}
                    onClick={() => void refreshAll()}
                    disabled={centersQ.isFetching}
                  >
                    {ar ? "تحديث" : "Refresh"}
                  </Button>
                  {canManage ? (
                    <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
                      {ar ? "إضافة مركز" : "Add Center"}
                    </Button>
                  ) : null}
                </div>
              }
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <CentersKpis centersQ={centersQ} filtered={filtered} ar={ar} />
          </motion.div>

          <motion.div variants={fadeUp} className="ctr-centers-shell">
            <div className="ctr-controls">
              <div className="ctr-filters-group">
                <select
                  className="ctr-filter-select"
                  value={sFilter}
                  onChange={(event) => {
                    setSFilter(event.target.value as StatusFilter);
                    setPage(1);
                  }}
                >
                  <option value="ALL">{ar ? "كل الحالات" : "All statuses"}</option>
                  <option value="ACTIVE">{ar ? "نشط" : "Active"}</option>
                  <option value="INACTIVE">{ar ? "معطل" : "Inactive"}</option>
                </select>

                <select
                  className="ctr-filter-select"
                  value={gFilter}
                  onChange={(event) => {
                    setGFilter(event.target.value as GenderFilter);
                    setPage(1);
                  }}
                >
                  <option value="ALL">{ar ? "كل الفئات" : "All genders"}</option>
                  <option value="MALE">{ar ? "ذكور" : "Male"}</option>
                  <option value="FEMALE">{ar ? "إناث" : "Female"}</option>
                </select>

                <div className="ctr-view-toggle" role="tablist" aria-label={ar ? "طرق العرض" : "View modes"}>
                  <button
                    type="button"
                    className={`ctr-view-btn ${view === "list" ? "active" : ""}`}
                    onClick={() => setView("list")}
                    aria-label={ar ? "عرض القائمة" : "List view"}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    className={`ctr-view-btn ${view === "grid" ? "active" : ""}`}
                    onClick={() => setView("grid")}
                    aria-label={ar ? "عرض البطاقات" : "Grid view"}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>

              <div className="ctr-search-wrap">
                <Search className="ctr-search-icon" size={16} />
                <input
                  type="text"
                  value={q}
                  onChange={(event) => {
                    setQ(event.target.value);
                    setPage(1);
                  }}
                  className="ctr-search-input"
                  placeholder={ar ? "البحث بالاسم أو الرمز..." : "Search by name, code, or manager..."}
                />
              </div>
            </div>

            <div className="ctr-centers-results">
              {actionErr ? (
                <ErrorState
                  className="ctr-inline-state"
                  title={ar ? "تعذر تحديث المركز" : "Unable to update center"}
                  description={actionErr}
                />
              ) : null}

              {centersQ.isLoading && !showSlowLoadMessage ? (
                <div className={view === "grid" ? "ctr-centers-grid" : "ctr-centers-list"}>
                  {Array.from({ length: view === "grid" ? 6 : 4 }).map((_, index) => (
                    <div
                      key={index}
                      className={`ctr-center-card${view === "list" ? " ctr-center-card--list" : ""}`}
                      style={{
                        height: view === "grid" ? "240px" : "140px",
                        opacity: 0.42,
                        animation: "pulse 1.5s ease-in-out infinite"
                      }}
                    />
                  ))}
                </div>
              ) : null}

              {centersQ.isLoading && showSlowLoadMessage ? (
                <ErrorState
                  title={ar ? "البيانات تستغرق وقتاً أطول من المتوقع" : "Data is taking longer than expected"}
                  description={
                    ar
                      ? "لا تزال بيانات المراكز قيد التحميل. يمكنك إعادة المحاولة أو فحص اتصال الخادم."
                      : "Centers data is still loading. Retry or check the server connection."
                  }
                  onRetry={() => void refreshAll()}
                  retryLabel={ar ? "إعادة المحاولة" : "Retry"}
                />
              ) : null}

              {centersQ.isError ? (
                <ErrorState
                  title={ar ? "تعذر تحميل المراكز" : "Unable to load centers"}
                  description={getApiErrorMessage(centersQ.error)}
                  onRetry={() => void refreshAll()}
                  retryLabel={ar ? "إعادة المحاولة" : "Retry"}
                />
              ) : null}

              {!centersQ.isLoading && !centersQ.isError && paged.length === 0 ? (
                <EmptyState
                  title={q.trim() || gFilter !== "ALL" || sFilter !== "ALL" ? (ar ? "لا توجد نتائج" : "No results") : ar ? "لا توجد مراكز" : "No centers"}
                  description={
                    q.trim() || gFilter !== "ALL" || sFilter !== "ALL"
                      ? ar
                        ? "جرّب تعديل البحث أو الفلاتر لعرض نتائج أخرى."
                        : "Try adjusting the search or filters."
                      : ar
                        ? "ابدأ بإنشاء أول مركز."
                        : "Create your first center to get started."
                  }
                  icon={<Building2 className="w-8 h-8" />}
                  action={
                    canManage ? (
                      <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
                        {ar ? "إضافة مركز" : "Add Center"}
                      </Button>
                    ) : undefined
                  }
                />
              ) : null}

              <AnimatePresence mode="wait">
                {!centersQ.isLoading && !centersQ.isError && paged.length > 0 ? (
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={view === "grid" ? "ctr-centers-grid" : "ctr-centers-list"}
                  >
                    {paged.map((center, index) => (
                      <CenterCard
                        key={center.id}
                        c={center}
                        i={index}
                        ar={ar}
                        studentCount={studentsByCenterId.get(center.id) ?? 0}
                        scheduleRows={centerScheduleByCenterId.get(center.id)}
                        view={view}
                        canManage={canManage}
                        pendingStatus={statusM.isPending}
                        onEdit={openEdit}
                        onToggleStatus={(nextCenter) => setStatusTarget(nextCenter)}
                      />
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {!centersQ.isLoading && !centersQ.isError && totalCenters > 0 ? (
              <div className="ctr-footer">
                <div className="ctr-page-controls">
                  <button
                    type="button"
                    className="ctr-page-btn"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={curPage === 1}
                    aria-label={ar ? "الصفحة السابقة" : "Previous page"}
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="ctr-page-btn active">{curPage}</div>
                  <button
                    type="button"
                    className="ctr-page-btn"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={curPage === totalPages}
                    aria-label={ar ? "الصفحة التالية" : "Next page"}
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>

                <div className="ctr-page-info">
                  {ar
                    ? `عرض ${rangeFrom} - ${rangeTo} من ${totalCenters} مركز`
                    : `Showing ${rangeFrom} - ${rangeTo} of ${totalCenters} centers`}
                </div>

                <div className="ctr-page-size">
                  <span>{ar ? "الصفوف لكل صفحة:" : "Rows per page:"}</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>

        <CenterFormModal
          isOpen={modalMode !== null}
          mode={modalMode ?? "create"}
          draft={draft}
          setDraft={setDraft}
          pending={pending}
          formErr={formErr}
          ar={ar}
          canManage={canManage}
          adminOpts={adminOpts}
          supOpts={supOpts}
          onClose={() => {
            if (!pending) {
              setModalMode(null);
              setFormErr(null);
            }
          }}
          onSubmit={submitCenter}
          onOpenQuick={openQuick}
        />

        <RoleAwareUserFormModal
          open={quickRole !== null}
          mode="create"
          role={(quickRole ?? "CENTER_ADMIN") as Role}
          ar={ar}
          centers={allCenters}
          circles={allCircles}
          students={allStudents}
          busy={createUserM.isPending}
          error={quickErr}
          onClose={() => {
            if (!createUserM.isPending) {
              setQuickRole(null);
              setQuickErr(null);
            }
          }}
          onSubmit={submitQuickUser}
        />

        <ConfirmModal
          isOpen={statusTarget !== null}
          onClose={() => {
            if (!statusM.isPending) setStatusTarget(null);
          }}
          onConfirm={confirmToggleStatus}
          title={
            statusTarget
              ? statusTarget.isActive ?? true
                ? ar
                  ? "تعطيل المركز"
                  : "Deactivate center"
                : ar
                  ? "تفعيل المركز"
                  : "Activate center"
              : ar
                ? "تحديث حالة المركز"
                : "Update center status"
          }
          description={
            statusTarget
              ? statusTarget.isActive ?? true
                ? ar
                  ? `سيتم تعطيل ${statusTarget.name} مع إبقاء البيانات الحالية كما هي.`
                  : `${statusTarget.name} will be deactivated while keeping its data intact.`
                : ar
                  ? `سيتم إعادة تفعيل ${statusTarget.name}.`
                  : `${statusTarget.name} will be activated again.`
              : undefined
          }
          confirmLabel={statusTarget && (statusTarget.isActive ?? true) ? (ar ? "تعطيل" : "Deactivate") : ar ? "تفعيل" : "Activate"}
          cancelLabel={ar ? "إلغاء" : "Cancel"}
          isConfirming={statusM.isPending}
          confirmVariant={statusTarget && (statusTarget.isActive ?? true) ? "danger" : "primary"}
        >
          {statusTarget ? (
            <p className="ctr-confirm-copy">
              {statusTarget.isActive ?? true
                ? ar
                  ? "سيتم إخفاء المركز من القوائم النشطة دون حذف أي بيانات."
                  : "The center will be removed from active lists without deleting any data."
                : ar
                  ? "سيعود المركز إلى القوائم النشطة بنفس الإعدادات الحالية."
                  : "The center will return to active lists with its current settings."}
            </p>
          ) : null}
        </ConfirmModal>
      </div>
    </>
  );
}

