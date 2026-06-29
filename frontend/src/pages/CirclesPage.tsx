import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { useI18n } from "../app/i18n";
import { Button } from "../components/ui/Button";
import ConfirmModal from "../components/ui/ConfirmModal";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthStore } from "../features/auth/auth.store";
import type { Role } from "../features/auth/types";
import {
  ORG_QUERY_KEYS,
  useCentersQuery,
  useCirclesQuery,
  useCreateCircleMutation,
  useUpdateCircleMutation,
  useUpdateCircleStatusMutation
} from "../features/org/org.hooks";
import type { Circle, CircleType } from "../features/org/types";
import { useUsersQuery } from "../features/users/users.hooks";
import { createEmptyScheduleDraftRows, hydrateScheduleDraftRows, serializeScheduleDraftRows, validateScheduleDraftRows } from "../features/org/circleSchedule";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import {
  entityFeedback,
  notifyError,
  notifyInfo,
  notifySuccess,
  type LocalizedLabel
} from "../shared/ui/feedback";
import { fadeUp, stagger } from "../shared/pageAnimations";

import {
  PAGE_SIZES,
  parseNumber,
  type CircleDraft,
  type CircleTypeFilter,
  type FormMode,
  type StatusFilter
} from "../features/org/components/circles/circles.types";
import CircleCard from "../features/org/components/circles/CircleCard";
import CirclesEmpty from "../features/org/components/circles/CirclesEmpty";
import CircleFormModal from "../features/org/components/circles/CircleFormModal";
import CirclesKpis from "../features/org/components/circles/CirclesKpis";
import CirclesToolbar from "../features/org/components/circles/CirclesToolbar";

const CIRCLE_ENTITY: LocalizedLabel = { ar: "الحلقة", en: "circle" };

const emptyDraft: CircleDraft = {
  centerId: "",
  nameAr: "",
  circleType: "",
  primaryTeacherUserId: "",
  mosqueName: "",
  useCenterLocation: true,
  locationText: "",
  latitude: "",
  longitude: "",
  allowedRadiusMeters: "500",
  scheduleRows: createEmptyScheduleDraftRows()
};

const validateCircle = (draft: CircleDraft, ar: boolean) => {
  if (!draft.centerId) return ar ? "المركز مطلوب" : "Center is required";
  if (!draft.nameAr.trim()) return ar ? "اسم الحلقة مطلوب" : "Name is required";
  if (!draft.circleType) return ar ? "نوع الحلقة مطلوب" : "Type is required";
  if (!draft.primaryTeacherUserId) return ar ? "المعلم مطلوب" : "Teacher is required";

  if (!draft.useCenterLocation) {
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    const radius = Number(draft.allowedRadiusMeters);
    if (!draft.latitude || !draft.longitude) return ar ? "\u0625\u062d\u062f\u0627\u062b\u064a\u0627\u062a \u0645\u0648\u0642\u0639 \u0627\u0644\u062d\u0644\u0642\u0629 \u0645\u0637\u0644\u0648\u0628\u0629" : "Circle coordinates are required";
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return ar ? "\u062e\u0637 \u0627\u0644\u0639\u0631\u0636 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d" : "Invalid latitude";
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return ar ? "\u062e\u0637 \u0627\u0644\u0637\u0648\u0644 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d" : "Invalid longitude";
    if (!Number.isInteger(radius) || radius <= 0) return ar ? "\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0648\u0642\u0639 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0639\u062f\u062f\u0627 \u0635\u062d\u064a\u062d\u0627 \u0645\u0648\u062c\u0628\u0627" : "Location radius must be a positive integer";
  }
  const scheduleError = validateScheduleDraftRows(draft.scheduleRows, ar);
  if (scheduleError) return scheduleError;

  return null;
};

export default function CirclesPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN";
  const showCenterFilter = user?.role === "SUPER_ADMIN";

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCenterId = parseNumber(searchParams.get("centerId"));

  const centersQ = useCentersQuery();
  const centersData = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);
  const allowedCenterIds = useMemo(() => new Set(centersData.map((center) => center.id)), [centersData]);
  const selectedCenterId =
    requestedCenterId && allowedCenterIds.has(requestedCenterId)
      ? requestedCenterId
      : user?.role === "CENTER_ADMIN" && centersData.length === 1
        ? centersData[0].id
        : undefined;

  const circlesQ = useCirclesQuery(selectedCenterId);
  const createM = useCreateCircleMutation();
  const updateM = useUpdateCircleMutation();
  const statusM = useUpdateCircleStatusMutation();

  const [q, setQ] = useState("");
  const [tFilter, setTFilter] = useState<CircleTypeFilter>("ALL");
  const [sFilter, setSFilter] = useState<StatusFilter>("ACTIVE");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[1]);

  const [modal, setModal] = useState<{ mode: FormMode; circle?: Circle } | null>(null);
  const [statusTarget, setStatusTarget] = useState<Circle | null>(null);
  const [draft, setDraft] = useState<CircleDraft>(emptyDraft);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [scopeMsg, setScopeMsg] = useState<string | null>(null);

  const teacherCenterId = typeof draft.centerId === "number" ? draft.centerId : selectedCenterId;
  const teachersQ = useUsersQuery({ role: "TEACHER" as Role, centerId: teacherCenterId });
  const teachers = teachersQ.data?.items ?? [];

  useEffect(() => {
    if (user?.role === "TEACHER") {
      notifyInfo(ar ? "تعرض هذه الصفحة الحلقات المعيّنة لك فقط." : "This page shows only circles assigned to you.");
    }
  }, [ar, user?.role]);

  useEffect(() => {
    if (!requestedCenterId || centersQ.isLoading || centersData.length === 0) return;
    if (!allowedCenterIds.has(requestedCenterId)) {
      setScopeMsg(ar ? "تم تجاهل فلتر مركز خارج النطاق." : "Out-of-scope center filter was ignored.");
      const next = new URLSearchParams(searchParams);
      next.delete("centerId");
      setSearchParams(next, { replace: true });
    }
  }, [allowedCenterIds, ar, centersData.length, centersQ.isLoading, requestedCenterId, searchParams, setSearchParams]);

  const circlesData = useMemo(() => circlesQ.data?.items ?? [], [circlesQ.data?.items]);

  const filtered = useMemo(() => {
    let result = circlesData;
    const normalized = q.trim().toLowerCase();

    if (normalized) {
      result = result.filter((circle) =>
        [circle.name, circle.center?.name, circle.teacher?.fullName, circle.mosqueName].some((value) =>
          String(value ?? "").toLowerCase().includes(normalized)
        )
      );
    }

    if (tFilter !== "ALL") result = result.filter((circle) => circle.circleType === tFilter);
    if (sFilter === "ACTIVE") result = result.filter((circle) => (circle.isActive ?? true) && (circle.center?.isActive ?? true));
    if (sFilter === "INACTIVE") result = result.filter((circle) => !(circle.isActive ?? true) || !(circle.center?.isActive ?? true));

    return result;
  }, [circlesData, q, sFilter, tFilter]);

  const totalCircles = circlesData.length;
  const activeCircles = circlesData.filter((circle) => (circle.isActive ?? true) && (circle.center?.isActive ?? true)).length;
  const totalStudents = circlesData.reduce((sum, circle) => sum + Number(circle._count?.enrollments ?? circle._count?.students ?? 0), 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const paged = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);
  const rangeFrom = filtered.length === 0 ? 0 : (curPage - 1) * pageSize + 1;
  const rangeTo = Math.min(filtered.length, curPage * pageSize);

  const centerOpts = centersData
    .filter((center) => center.isActive ?? true)
    .map((center) => ({ id: center.id, label: center.name, mosqueName: center.mosqueName, latitude: center.latitude, longitude: center.longitude }));
  const canChooseCircleCenter = user?.role === "SUPER_ADMIN";
  const teacherOpts = teachers.map((teacher) => ({ id: teacher.id, label: teacher.fullName }));
  const selectedDraftCenter = typeof draft.centerId === "number" ? centersData.find((center) => center.id === draft.centerId) : undefined;
  const pending = createM.isPending || updateM.isPending || statusM.isPending;

  const refreshAll = async () => {
    setQ("");
    setTFilter("ALL");
    setSFilter("ACTIVE");
    setPage(1);
    setScopeMsg(null);

    const next = new URLSearchParams(searchParams);
    next.delete("centerId");
    setSearchParams(next, { replace: true });

    await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.all });
  };

  const openCreate = () => {
    setFormErr(null);
    setActionErr(null);
    setModal({ mode: "create" });
    setDraft({
      ...emptyDraft,
      centerId: selectedCenterId ?? centerOpts[0]?.id ?? "",
      scheduleRows: createEmptyScheduleDraftRows()
    });
  };

  const openEdit = (circle: Circle) => {
    setFormErr(null);
    setActionErr(null);
    setModal({ mode: "edit", circle });
    setDraft({
      centerId: circle.centerId,
      nameAr: String(circle.name ?? ""),
      circleType: (circle.circleType ?? "") as CircleType | "",
      primaryTeacherUserId: typeof circle.teacherId === "number" ? circle.teacherId : "",
      mosqueName: String(circle.mosqueName ?? ""),
      useCenterLocation: circle.latitude == null || circle.longitude == null,
      locationText: String(circle.locationText ?? ""),
      latitude: circle.latitude == null ? "" : String(circle.latitude),
      longitude: circle.longitude == null ? "" : String(circle.longitude),
      allowedRadiusMeters: circle.allowedRadiusMeters == null ? "500" : String(circle.allowedRadiusMeters),
      scheduleRows: hydrateScheduleDraftRows(circle.weeklySchedule)
    });
  };

  const submitCircle = async () => {
    if (!modal) return;
    const action = modal.mode === "create" ? "create" : "update";

    const validationError = validateCircle(draft, ar);
    if (validationError) {
      setFormErr(validationError);
      return;
    }

    const payload = {
      nameAr: draft.nameAr.trim(),
      circleType: draft.circleType as CircleType,
      primaryTeacherUserId: Number(draft.primaryTeacherUserId),
      mosqueName: draft.mosqueName.trim() || undefined,
      locationText: draft.useCenterLocation ? null : draft.locationText.trim() || null,
      latitude: draft.useCenterLocation ? null : Number(draft.latitude),
      longitude: draft.useCenterLocation ? null : Number(draft.longitude),
      allowedRadiusMeters: draft.useCenterLocation ? null : Number(draft.allowedRadiusMeters),
      weeklySchedule: serializeScheduleDraftRows(draft.scheduleRows)
    };

    try {
      setFormErr(null);
      if (modal.mode === "create") {
        await createM.mutateAsync({ centerId: Number(draft.centerId), ...payload });
      } else {
        await updateM.mutateAsync({ circleId: modal.circle!.id, payload });
      }

      setModal(null);
      await refreshAll();
      notifySuccess(entityFeedback.success(ar, action, CIRCLE_ENTITY));
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: entityFeedback.error(ar, action, CIRCLE_ENTITY)
      });
      setFormErr(message);
      notifyError(message);
    }
  };

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;

    const nextIsActive = !(statusTarget.isActive ?? true);

    try {
      setActionErr(null);
      await statusM.mutateAsync({ circleId: statusTarget.id, payload: { isActive: nextIsActive } });
      setStatusTarget(null);
      await refreshAll();
      notifySuccess(
        nextIsActive
          ? ar
            ? "تم تفعيل الحلقة بنجاح"
            : "Circle activated successfully"
          : ar
            ? "تم تعطيل الحلقة بنجاح"
            : "Circle deactivated successfully"
      );
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar
          ? "تعذر تحديث حالة الحلقة. يرجى المحاولة مرة أخرى."
          : "Unable to update circle status. Please try again."
      });
      setActionErr(message);
      notifyError(message);
    }
  };

  return (
    <div className="page ctr-page-modern ctr-page-circles relative z-10" dir={ar ? "rtl" : "ltr"}>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
        <motion.div variants={fadeUp}>
          <PageHeader
            title={ar ? "إدارة الحلقات" : "Circles Management"}
            description={ar ? "حلقات الحفظ والمراجعة والمعلمين" : "Memorization, review circles, and teachers"}
            icon={<BookOpen className="w-6 h-6" />}
            actions={
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  variant="secondary"
                  className="glass-btn"
                  size="sm"
                  leftIcon={<RefreshCw className={`w-4 h-4 ${circlesQ.isFetching ? "animate-spin" : ""}`} />}
                  onClick={() => void refreshAll()}
                  disabled={circlesQ.isFetching}
                >
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                {canManage ? (
                  <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
                    {ar ? "إضافة حلقة" : "Add Circle"}
                  </Button>
                ) : null}
              </div>
            }
          />
        </motion.div>

        {scopeMsg ? (
          <motion.div variants={fadeUp} className="ctr-inline-err">
            {scopeMsg}
          </motion.div>
        ) : null}

        {actionErr ? (
          <motion.div variants={fadeUp} className="ctr-inline-err">
            {actionErr}
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp}>
          <CirclesKpis
            isLoading={circlesQ.isLoading}
            totalCircles={totalCircles}
            activeCircles={activeCircles}
            totalStudents={totalStudents}
            filteredCount={filtered.length}
            selectedCenterId={selectedCenterId}
            ar={ar}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="ctr-centers-shell">
          <CirclesToolbar
            ar={ar}
            q={q}
            setQ={setQ}
            showCenterFilter={showCenterFilter}
            selectedCenterId={selectedCenterId}
            centerOpts={centerOpts}
            setCenterId={(value) => {
              const next = new URLSearchParams(searchParams);
              if (value) next.set("centerId", value);
              else next.delete("centerId");
              setSearchParams(next, { replace: true });
              setScopeMsg(null);
            }}
            tFilter={tFilter}
            setTFilter={setTFilter}
            sFilter={sFilter}
            setSFilter={setSFilter}
            view={view}
            setView={setView}
            setPage={setPage}
          />

          <div className="ctr-centers-results">
            {circlesQ.isError ? (
              <div className="ctr-inline-state">
                <div className="ctr-empty-state">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                  <h3>{ar ? "تعذر تحميل الحلقات" : "Failed to load circles"}</h3>
                  <p>
                    {getLocalizedApiErrorMessage(circlesQ.error, {
                      ar,
                      fallback: ar ? "تعذر تحميل الحلقات. يرجى المحاولة مرة أخرى." : "Unable to load circles. Please try again."
                    })}
                  </p>
                  <Button variant="secondary" onClick={() => void refreshAll()}>
                    {ar ? "إعادة المحاولة" : "Retry"}
                  </Button>
                </div>
              </div>
            ) : null}

            {circlesQ.isLoading ? (
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

            {!circlesQ.isLoading && !circlesQ.isError && filtered.length === 0 ? (
              <CirclesEmpty
                icon={BookOpen}
                title={
                  q.trim() || tFilter !== "ALL" || sFilter !== "ALL" || selectedCenterId
                    ? ar
                      ? "لا توجد نتائج"
                      : "No results"
                    : ar
                      ? "لا توجد حلقات"
                      : "No circles"
                }
                desc={
                  q.trim() || tFilter !== "ALL" || sFilter !== "ALL" || selectedCenterId
                    ? ar
                      ? "جرّب تعديل البحث أو الفلاتر."
                      : "Try adjusting search or filters."
                    : ar
                      ? "لا توجد حلقات متاحة في نطاقك."
                      : "No circles available in your scope."
                }
                action={
                  canManage && !q.trim() && tFilter === "ALL" && sFilter === "ALL" && !selectedCenterId ? (
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
                      {ar ? "إضافة حلقة" : "Add Circle"}
                    </Button>
                  ) : undefined
                }
              />
            ) : null}

            <AnimatePresence mode="wait">
              {!circlesQ.isLoading && !circlesQ.isError && paged.length > 0 ? (
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={view === "grid" ? "ctr-centers-grid" : "ctr-centers-list"}
                >
                  {paged.map((circle) => (
                    <CircleCard
                      key={circle.id}
                      circle={circle}
                      ar={ar}
                      view={view}
                      canManage={canManage}
                      pending={pending}
                      openEdit={openEdit}
                      toggleStatus={setStatusTarget}
                    />
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {!circlesQ.isLoading && !circlesQ.isError && filtered.length > 0 ? (
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
                  ? `عرض ${rangeFrom} - ${rangeTo} من ${filtered.length} حلقة`
                  : `Showing ${rangeFrom} - ${rangeTo} of ${filtered.length} circles`}
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

      <CircleFormModal
        ar={ar}
        modal={modal}
        setModal={() => setModal(null)}
        draft={draft}
        setDraft={setDraft}
        pending={pending}
        formErr={formErr}
        setFormErr={setFormErr}
        centerOpts={centerOpts}
        teacherOpts={teacherOpts}
        selectedDraftCenter={selectedDraftCenter}
        canChooseCenter={canChooseCircleCenter}
        submitCircle={submitCircle}
      />

      <ConfirmModal
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => void confirmToggleStatus()}
        isConfirming={statusM.isPending}
        title={
          statusTarget
            ? statusTarget.isActive ?? true
              ? ar
                ? "تعطيل الحلقة"
                : "Deactivate circle"
              : ar
                ? "تفعيل الحلقة"
                : "Activate circle"
            : ar
              ? "تأكيد الإجراء"
              : "Confirm action"
        }
        message={
          statusTarget
            ? statusTarget.isActive ?? true
              ? ar
                ? `سيتم تعطيل ${statusTarget.name} ويمكنك إعادة تفعيلها لاحقًا.`
                : `${statusTarget.name} will be deactivated. You can activate it again later.`
              : ar
                ? `سيتم تفعيل ${statusTarget.name} وإتاحتها للاستخدام.`
                : `${statusTarget.name} will be activated and made available for use.`
            : undefined
        }
        confirmLabel={
          statusTarget
            ? statusTarget.isActive ?? true
              ? ar
                ? "تعطيل"
                : "Deactivate"
              : ar
                ? "تفعيل"
                : "Activate"
            : ar
              ? "تأكيد"
              : "Confirm"
        }
        cancelLabel={ar ? "إلغاء" : "Cancel"}
        confirmVariant={statusTarget && (statusTarget.isActive ?? true) ? "danger" : "primary"}
      />
    </div>
  );
}
