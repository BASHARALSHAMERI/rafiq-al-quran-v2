import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Building2,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ErrorState } from "../../components/ui/ErrorState";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../auth/auth.store";
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUserStatusMutation,
  useResendActivationMutation
} from "./users.hooks";
import { useCentersQuery, useCirclesQuery, ORG_QUERY_KEYS } from "../org/org.hooks";
import { USERS_QUERY_KEYS } from "./users.hooks";
import { roleLabel, fmtDate, centerIdsForUser, circleIdsForUser } from "./users.helpers";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import {
  entityFeedback,
  notifyError,
  notifySuccess,
  type LocalizedLabel
} from "../../shared/ui/feedback";
import type { Role } from "../auth/types";
import type { InvitationDeliveryPayload, UserListItem } from "./types";
import { UsersTable } from "./components/UsersTable";
import { RoleAwareUserFormModal } from "./components/UserFormModal";
import { UserDetailsModal } from "./components/UserDetailsModal";
import "../../styles/pages/users-enterprise-v5.css";

const USER_ENTITY: LocalizedLabel = { ar: "المستخدم", en: "user" };
const USERS_ENTITY: LocalizedLabel = { ar: "المستخدمين", en: "users" };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function UserRolePage({
  role,
  title,
  description
}: {
  role: Role;
  title?: string;
  description: string;
}) {
  const { language } = useI18n();
  const ar = language === "ar";
  const authUser = useAuthStore((state) => state.user);
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const centerId = searchParams.get("centerId") ? Number(searchParams.get("centerId")) : undefined;
  const circleId = searchParams.get("circleId") ? Number(searchParams.get("circleId")) : undefined;

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; user?: UserListItem } | null>(null);
  const [detailsModal, setDetailsModal] = useState<UserListItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserListItem | null>(null);
  const [invitationDelivery, setInvitationDelivery] = useState<InvitationDeliveryPayload | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canLoadCenters = role === "CENTER_ADMIN" || role === "SUPERVISOR" || role === "TEACHER" || role === "STUDENT";
  const canLoadCircles = role === "SUPERVISOR" || role === "TEACHER" || role === "STUDENT";
  const canCreate = authUser?.role === "SUPER_ADMIN";
  const canManage = authUser?.role === "SUPER_ADMIN";

  const usersQ = useUsersQuery({ role, centerId, circleId });
  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const circlesQ = useCirclesQuery(centerId ?? undefined, { enabled: canLoadCircles });
  const studentsQ = useUsersQuery({ role: "STUDENT" }, role === "PARENT" || role === "STUDENT");

  const users = usersQ.data?.items ?? [];
  const centers = centersQ.data?.items ?? [];
  const circles = circlesQ.data?.items ?? [];
  const studentOptions = studentsQ.data?.items ?? [];

  const centerMap = useMemo(() => new Map(centers.map((c) => [c.id, c.name])), [centers]);
  const circleMap = useMemo(() => new Map(circles.map((c) => [c.id, c.name])), [circles]);

  const createM = useCreateUserMutation();
  const updateM = useUpdateUserMutation();
  const deleteM = useDeleteUserMutation();
  const statusM = useUserStatusMutation();
  const resendM = useResendActivationMutation();

  const copyInvitationLink = async () => {
    if (!invitationDelivery) return;

    try {
      await navigator.clipboard.writeText(invitationDelivery.activationLink);
      notifySuccess(
        ar
          ? "تم نسخ رابط الدعوة. أرسله للمستخدم عبر القناة الإدارية المعتمدة."
          : "Invitation link copied. Send it through the approved admin channel."
      );
    } catch {
      notifyError(
        ar
          ? "تعذر نسخ رابط الدعوة. انسخه يدويًا من هذه النافذة."
          : "Failed to copy the invitation link. Copy it manually from this dialog."
      );
    }
  };

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    let result = [...users];

    if (search !== "") {
      result = result.filter((user) => {
        const name = String(user.fullName ?? "").toLowerCase();
        const email = String(user.email ?? "").toLowerCase();
        const phone = String(user.phone ?? "").toLowerCase();
        const username = String(user.username ?? "").toLowerCase();
        const cIds = centerIdsForUser(user);
        const cNames = cIds.map((id) => centerMap.get(id)?.toLowerCase()).filter(Boolean) as string[];

        return (
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search) ||
          username.includes(search) ||
          cNames.some((cn) => cn.includes(search))
        );
      });
    }

    return result.sort((left, right) => {
      const activeOrder = Number(right.isActive ?? false) - Number(left.isActive ?? false);
      if (activeOrder !== 0) return activeOrder;
      return String(left.fullName ?? "").localeCompare(String(right.fullName ?? ""), ar ? "ar" : "en", {
        sensitivity: "base"
      });
    });
  }, [ar, q, users, centerMap]);

  const totalCount = usersQ.data?.total ?? filtered.length;
  const activeCount = filtered.filter((user) => user.isActive).length;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);

  const rows = useMemo(() => {
    const rawRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return rawRows.map((user) => {
      const directCenterNames = (user.centerAccesses ?? []).map((a) => a.center?.name).filter(Boolean) as string[];
      const circleAccessCenterNames = (user.circleAccesses ?? [])
        .map((a) => centerMap.get(a.circle?.centerId ?? 0))
        .filter(Boolean) as string[];
      const enrollmentCenterNames = (user.studentEnrollments ?? [])
        .map((e) => centerMap.get(e.circle?.centerId ?? 0))
        .filter(Boolean) as string[];

      let names = [...new Set([...directCenterNames, ...circleAccessCenterNames, ...enrollmentCenterNames])];

      if (names.length === 0) {
        const ids = centerIdsForUser(user);
        names = ids.map((id) => centerMap.get(id)).filter(Boolean) as string[];
      }

      const centerDisplayName =
        names.length > 0 ? (names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`) : undefined;

      const directCircleNames = [
        ...(user.circleAccesses ?? []).map((a) => a.circle?.name),
        ...(user.studentEnrollments ?? []).map((e) => e.circle?.name)
      ].filter(Boolean) as string[];

      let cNames = [...new Set(directCircleNames)];

      if (cNames.length === 0) {
        const allCIds = circleIdsForUser(user);
        cNames = allCIds.map((id) => circleMap.get(id)).filter(Boolean) as string[];
      }

      const circleDisplayName =
        cNames.length > 0 ? (cNames.length === 1 ? cNames[0] : `${cNames[0]} +${cNames.length - 1}`) : undefined;

      return {
        ...user,
        centerName: centerDisplayName,
        circleName: circleDisplayName,
        _onResend: async () => {
          try {
            const result = await resendM.mutateAsync(user.id);
            if (result.invitation) {
              setInvitationDelivery(result.invitation);
            }
            notifySuccess(
              ar
                ? "تم تجهيز رابط الدعوة لإعادة الإرسال الإداري."
                : "Invitation link is ready for controlled admin delivery."
            );
          } catch (e) {
            notifyError(
              getLocalizedApiErrorMessage(e, {
                ar,
                fallback: ar ? "فشل إعادة إرسال الدعوة" : "Failed to resend invitation"
              })
            );
          }
        }
      };
    });
  }, [filtered, currentPage, pageSize, centerMap, circleMap, resendM, ar]);

  const refreshAll = async () => {
    setQ("");
    setPage(1);
    setActionError(null);
    const next = new URLSearchParams(searchParams);
    next.delete("centerId");
    next.delete("circleId");
    setSearchParams(next, { replace: true });
    await Promise.all(
      [
        qc.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all }),
        canLoadCenters && qc.invalidateQueries({ queryKey: ORG_QUERY_KEYS.centers() }),
        canLoadCircles && qc.invalidateQueries({ queryKey: ORG_QUERY_KEYS.circles() })
      ].filter(Boolean)
    );
    await usersQ.refetch();
  };

  const submitUserForm = async (payload: Record<string, unknown>) => {
    const mode = formModal?.mode === "create" ? "create" : "update";
    try {
      setFormError(null);
      if (formModal?.mode === "create") {
        const result = await createM.mutateAsync(payload as any);
        if (result.invitation) {
          setInvitationDelivery(result.invitation);
        }
      } else {
        await updateM.mutateAsync({ userId: formModal!.user!.id, payload: payload as any });
      }
      setFormModal(null);
      await refreshAll();
      notifySuccess(entityFeedback.success(ar, mode, USER_ENTITY));
    } catch (error) {
      setFormError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: entityFeedback.error(ar, mode, USER_ENTITY)
        })
      );
    }
  };

  const headerIcon = (r: Role) => {
    switch (r) {
      case "TEACHER":
        return <GraduationCap />;
      case "STUDENT":
        return <BookOpen />;
      case "CENTER_ADMIN":
        return <ShieldCheck />;
      case "SUPERVISOR":
        return <Building2 />;
      default:
        return <Users />;
    }
  };

  const addLabel = (r: Role, isAr: boolean) => {
    if (isAr) return `إضافة ${roleLabel(r, true)}`;
    return `Add ${roleLabel(r, false)}`;
  };

  const emptyTitle = ar ? "لا يوجد مستخدمون" : "No users found";
  const emptyDescription = ar ? "لا توجد نتائج مطابقة للبحث الحالي." : "No results match your search.";

  const anyBusy = createM.isPending || updateM.isPending || deleteM.isPending || statusM.isPending;

  return (
    <>
      <div className="page users-page">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="users-page__content">
          <motion.div variants={fadeUp}>
            <PageHeader
              title={title || roleLabel(role, ar)}
              description={description}
              icon={headerIcon(role)}
              actions={
                <div className="users-page-header__actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void refreshAll()}
                    disabled={usersQ.isFetching}
                    leftIcon={<RefreshCw className={usersQ.isFetching ? "animate-spin" : ""} />}
                  >
                    {ar ? "تحديث" : "Refresh"}
                  </Button>
                  {canCreate ? (
                    <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => setFormModal({ mode: "create" })}>
                      {addLabel(role, ar)}
                    </Button>
                  ) : null}
                </div>
              }
            />
          </motion.div>

          <motion.div variants={fadeUp} className="users-workspace">
            <div className="grade-scales-controls">
              <div className="grade-scales-search-wrap">
                <Search size={16} className="grade-scales-search-icon" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={ar ? "ابحث بالاسم، البريد أو الهاتف..." : "Search users..."}
                  className="grade-scales-search-input"
                />
              </div>

              <div className="grade-scales-stats-pills">
                <div className="grade-scales-pill">
                  {ar ? "الإجمالي:" : "Total:"} <strong>{totalCount}</strong>
                </div>
                <div className="grade-scales-pill">
                  {ar ? "نشط:" : "Active:"} <strong>{activeCount}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {canLoadCenters ? (
                  <select
                    className="users-filter-select-modern"
                    value={centerId ?? ""}
                    onChange={(e) => {
                      const next = new URLSearchParams(searchParams);
                      if (e.target.value) next.set("centerId", e.target.value);
                      else next.delete("centerId");
                      next.delete("circleId");
                      setSearchParams(next, { replace: true });
                      setPage(1);
                    }}
                  >
                    <option value="">{ar ? "كل المراكز" : "All centers"}</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                {canLoadCircles ? (
                  <select
                    className="users-filter-select-modern"
                    value={circleId ?? ""}
                    onChange={(e) => {
                      const next = new URLSearchParams(searchParams);
                      if (e.target.value) next.set("circleId", e.target.value);
                      else next.delete("circleId");
                      setSearchParams(next, { replace: true });
                      setPage(1);
                    }}
                  >
                    <option value="">{ar ? "كل الحلقات" : "All circles"}</option>
                    {circles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>

            <div className="users-workspace-body">
              {actionError ? <ErrorState title={ar ? "خطأ" : "Error"} description={actionError} /> : null}
              {usersQ.isError ? (
                <ErrorState
                  title={ar ? "تعذر تحميل المستخدمين" : "Unable to load users"}
                  description={getLocalizedApiErrorMessage(usersQ.error, {
                    ar,
                    fallback: entityFeedback.error(ar, "load", USERS_ENTITY)
                  })}
                  onRetry={() => void refreshAll()}
                />
              ) : null}
              {usersQ.isLoading ? (
                <TableSkeleton rows={6} columns={6} />
              ) : (
                <UsersTable
                  users={rows}
                  ar={ar}
                  onDetails={setDetailsModal}
                  onEdit={(user) => setFormModal({ mode: "edit", user })}
                  onDelete={setDeleteConfirm}
                  canManage={canManage}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                />
              )}
            </div>

            {!usersQ.isLoading && !usersQ.isError && filtered.length > 0 ? (
              <div className="grade-scales-footer">
                <div className="gs-page-size">
                  <span>{ar ? "الصفوف لكل صفحة:" : "Rows per page:"}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="gs-pagination-info">
                  {ar ? (
                    <>
                      عرض {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)} -{" "}
                      {Math.min(filtered.length, currentPage * pageSize)} من {filtered.length} مستخدم
                    </>
                  ) : (
                    <>
                      Showing {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)} -{" "}
                      {Math.min(filtered.length, currentPage * pageSize)} of {filtered.length} users
                    </>
                  )}
                </div>

                <div className="gs-pagination-controls">
                  <button className="gs-page-btn" disabled={currentPage === 1} onClick={() => setPage((prev) => prev - 1)}>
                    {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  </button>

                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    let p = currentPage;
                    if (currentPage <= 3) p = i + 1;
                    else if (currentPage >= pages - 2) p = pages - 4 + i;
                    else p = currentPage - 2 + i;

                    if (p <= 0 || p > pages) return null;

                    return (
                      <button
                        key={p}
                        className={`gs-page-btn ${currentPage === p ? "gs-page-btn--active" : ""}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button className="gs-page-btn" disabled={currentPage === pages} onClick={() => setPage((prev) => prev + 1)}>
                    {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {formModal ? (
            <RoleAwareUserFormModal
              open
              mode={formModal.mode}
              role={role}
              ar={ar}
              initialUser={formModal.user}
              centers={centers}
              circles={circles}
              students={studentOptions}
              busy={anyBusy}
              error={formError}
              onClose={() => setFormModal(null)}
              onSubmit={submitUserForm}
            />
          ) : null}
          {detailsModal ? (
            <UserDetailsModal
              isOpen
              detailsUser={detailsModal}
              ar={ar}
              fmtDate={fmtDate}
              roleLabel={roleLabel}
              isLoading={usersQ.isFetching}
              students={studentOptions}
              onClose={() => setDetailsModal(null)}
            />
          ) : null}
          {deleteConfirm ? (
            <ConfirmModal
              isOpen
              title={ar ? "حذف المستخدم" : "Delete User"}
              description={
                ar
                  ? `هل أنت متأكد من حذف ${deleteConfirm.fullName}؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete ${deleteConfirm.fullName}?`
              }
              onClose={() => setDeleteConfirm(null)}
              onConfirm={async () => {
                try {
                  await deleteM.mutateAsync(deleteConfirm.id);
                  setDeleteConfirm(null);
                  await refreshAll();
                  notifySuccess(entityFeedback.success(ar, "delete", USER_ENTITY));
                } catch (e) {
                  notifyError(
                    getLocalizedApiErrorMessage(e, {
                      ar,
                      fallback: entityFeedback.error(ar, "delete", USER_ENTITY)
                    })
                  );
                }
              }}
              isConfirming={deleteM.isPending}
              confirmVariant="danger"
              confirmLabel={ar ? "حذف" : "Delete"}
              cancelLabel={ar ? "إلغاء" : "Cancel"}
            />
          ) : null}
          {invitationDelivery ? (
            <ConfirmModal
              isOpen
              title={ar ? "رابط الدعوة جاهز" : "Invitation Link Ready"}
              description={
                ar
                  ? "هذا fallback إداري مقصود لأن إرسال البريد غير مفعّل في هذا الروند. انسخ الرابط وأرسله للمستخدم عبر القناة الإدارية المعتمدة."
                  : "This is a deliberate admin fallback because email delivery is not configured in this round. Copy the link and send it through the approved admin channel."
              }
              onClose={() => setInvitationDelivery(null)}
              onConfirm={copyInvitationLink}
              confirmVariant="primary"
              confirmLabel={ar ? "نسخ الرابط" : "Copy Link"}
              cancelLabel={ar ? "إغلاق" : "Close"}
              icon={<RefreshCw className="w-5 h-5" />}
              size="md"
            >
              <div className="space-y-3 text-sm">
                <p>
                  {ar ? "طريقة التسليم:" : "Delivery method:"}{" "}
                  <strong>{invitationDelivery.method}</strong>
                </p>
                <p>
                  {ar ? "ينتهي الرابط في:" : "Link expires at:"}{" "}
                  <strong>{fmtDate(invitationDelivery.expiresAt) ?? invitationDelivery.expiresAt}</strong>
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left" dir="ltr">
                  <code className="break-all text-xs">{invitationDelivery.activationLink}</code>
                </div>
              </div>
            </ConfirmModal>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
