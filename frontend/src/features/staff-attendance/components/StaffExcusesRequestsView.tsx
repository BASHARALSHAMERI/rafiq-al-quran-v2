import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  CheckCircle, 
  Clock, 
  FileText, 
  Link as LinkIcon, 
  Search, 
  X, 
  XCircle, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  User
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import type {
  ExcuseRequestStatus,
  LeaveRequestStatus,
  StaffExcuseRequest,
  StaffLeaveRequest
} from "../staff-attendance.api";
import {
  useApproveLeave,
  useLeaveRequests,
  useRejectLeave,
  useStaffExcuses,
  useUpdateExcuseStatus
} from "../staff-attendance.api";
import { useAuthStore } from "../../auth/auth.store";
import {
  useClientPagination
} from "../../../shared/ui/useClientPagination";
import { fadeUp } from "../../../shared/pageAnimations";

type RequestTypeFilter = "ALL" | "EXCUSES" | "LEAVES";
type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

type UnifiedRequest =
  | { kind: "EXCUSE"; sortDate: string; request: StaffExcuseRequest }
  | { kind: "LEAVE"; sortDate: string; request: StaffLeaveRequest };

const getRoleLabel = (role: string, ar: boolean) => {
  switch (role) {
    case "TEACHER":
      return ar ? "معلم" : "Teacher";
    case "SUPERVISOR":
      return ar ? "مشرف" : "Supervisor";
    case "CENTER_ADMIN":
      return ar ? "مدير مركز" : "Center Admin";
    default:
      return role;
  }
};

const normalizeStatus = (status: ExcuseRequestStatus | LeaveRequestStatus): StatusFilter => {
  switch (status) {
    case "LEAVE_PENDING":
      return "PENDING";
    case "LEAVE_APPROVED":
      return "APPROVED";
    case "LEAVE_REJECTED":
      return "REJECTED";
    default:
      return status as StatusFilter;
  }
};

const toDateKey = (value: string) => value.slice(0, 10);

const getStatusBadge = (status: ExcuseRequestStatus | LeaveRequestStatus, ar: boolean) => {
  const norm = normalizeStatus(status);
  switch (norm) {
    case "APPROVED":
      return <Badge variant="success" size="sm">{ar ? "معتمد" : "Approved"}</Badge>;
    case "PENDING":
      return <Badge variant="warning" size="sm">{ar ? "قيد الانتظار" : "Pending"}</Badge>;
    case "REJECTED":
      return <Badge variant="error" size="sm">{ar ? "مرفوض" : "Rejected"}</Badge>;
    default:
      return null;
  }
};

export function StaffExcusesRequestsView() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const isOpsAdmin = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [filterType, setFilterType] = useState<RequestTypeFilter>("ALL");
  const [filterDate, setFilterDate] = useState("");

  const excuseStatus = filterStatus === "ALL" ? undefined : (filterStatus as ExcuseRequestStatus);
  const leaveStatus =
    filterStatus === "ALL"
      ? undefined
      : (`LEAVE_${filterStatus}` as LeaveRequestStatus);

  const excusesQuery = useStaffExcuses(excuseStatus);
  const leavesQuery = useLeaveRequests({ status: leaveStatus });
  const updateExcuseStatus = useUpdateExcuseStatus();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();

  const requests = useMemo<UnifiedRequest[]>(() => {
    const rows: UnifiedRequest[] = [];

    if (filterType !== "LEAVES") {
      rows.push(
        ...(excusesQuery.data ?? []).map((request) => ({
          kind: "EXCUSE" as const,
          sortDate: request.createdAt,
          request
        }))
      );
    }

    if (filterType !== "EXCUSES") {
      rows.push(
        ...(leavesQuery.data ?? []).map((request) => ({
          kind: "LEAVE" as const,
          sortDate: request.createdAt,
          request
        }))
      );
    }

    return rows.sort((left, right) => new Date(right.sortDate).getTime() - new Date(left.sortDate).getTime());
  }, [excusesQuery.data, filterType, leavesQuery.data]);

  const filteredRequests = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return requests.filter((entry) => {
      const selectedDate = filterDate.trim();
      const matchesDate =
        !selectedDate ||
        (entry.kind === "EXCUSE"
          ? toDateKey(entry.request.absenceDate) === selectedDate
          : selectedDate >= toDateKey(entry.request.startDate) &&
            selectedDate <= toDateKey(entry.request.endDate));

      if (!matchesDate) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      const request = entry.request;
      return [
        request.user.fullName,
        request.user.role,
        request.reason,
        entry.kind === "LEAVE" ? entry.request.leaveType : ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [filterDate, requests, search]);

  const pagination = useClientPagination(filteredRequests, { initialPageSize: 12 });

  const stats = useMemo(() => {
    const pending = filteredRequests.filter((entry) => normalizeStatus(entry.request.status) === "PENDING").length;
    const approved = filteredRequests.filter((entry) => normalizeStatus(entry.request.status) === "APPROVED").length;
    const rejected = filteredRequests.filter((entry) => normalizeStatus(entry.request.status) === "REJECTED").length;

    return [
      {
        label: ar ? "إجمالي الطلبات" : "Total Requests",
        value: filteredRequests.length,
        cls: "brand",
        icon: FileText
      },
      {
        label: ar ? "قيد الانتظار" : "Pending",
        value: pending,
        cls: "amber",
        icon: Clock
      },
      {
        label: ar ? "معتمدة" : "Approved",
        value: approved,
        cls: "emerald",
        icon: CheckCircle
      },
      {
        label: ar ? "مرفوضة" : "Rejected",
        value: rejected,
        cls: "violet",
        icon: XCircle
      }
    ];
  }, [ar, filteredRequests]);

  const handleUpdateExcuseStatus = (id: number, status: ExcuseRequestStatus) => {
    if (!isOpsAdmin) return;
    updateExcuseStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(ar ? "تم تحديث حالة العذر" : "Excuse status updated"),
        onError: () => toast.error(ar ? "تعذر تحديث حالة العذر" : "Unable to update excuse")
      }
    );
  };

  const handleUpdateLeaveStatus = (request: StaffLeaveRequest, status: "APPROVED" | "REJECTED") => {
    if (!isOpsAdmin) return;
    const mutation = status === "APPROVED" ? approveLeave : rejectLeave;

    mutation.mutate(
      { id: request.id },
      {
        onSuccess: () => toast.success(ar ? "تمت مراجعة الإجازة" : "Leave request reviewed"),
        onError: () => toast.error(ar ? "تعذرت مراجعة الإجازة" : "Unable to review leave")
      }
    );
  };

  return (
    <section className="staff-ops-view ctr-workspace">
      {/* ── KPIs Strip ── */}
      <div 
        className="ctr-kpis-modern mb-6"
        style={{ 
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          width: '100%' 
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className={`ctr-kpi-modern ${stat.cls}`}>
            <div className="ctr-kpi-icon-wrap">
              <stat.icon size={22} />
            </div>
            <div className="ctr-kpi-content">
              <div className="ctr-kpi-val">{stat.value}</div>
              <div className="ctr-kpi-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls Toolbar ── */}
      <div className="ctr-controls mb-6 staff-ops-toolbar staff-ops-toolbar--excuses staff-ops-toolbar--excuses-row">
        <div className="ctr-search-wrap !max-w-none flex-1 staff-ops-toolbar__search">
          <Search className="ctr-search-icon" size={16} />
          <input
            type="text"
            className="ctr-search-input"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pagination.setCurrentPage(1);
            }}
            placeholder={ar ? "ابحث بالاسم أو السبب..." : "Search by employee or reason..."}
          />
        </div>

        <select
          className="ctr-search-input staff-ops-toolbar__field"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as RequestTypeFilter);
            pagination.setCurrentPage(1);
          }}
        >
          <option value="ALL">{ar ? "كل الأنواع" : "All Types"}</option>
          <option value="EXCUSES">{ar ? "الأعذار" : "Excuses"}</option>
          <option value="LEAVES">{ar ? "الإجازات" : "Leaves"}</option>
        </select>

        <select
          className="ctr-search-input staff-ops-toolbar__field"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as StatusFilter);
            pagination.setCurrentPage(1);
          }}
        >
          <option value="ALL">{ar ? "كل الحالات" : "All Status"}</option>
          <option value="PENDING">{ar ? "قيد الانتظار" : "Pending"}</option>
          <option value="APPROVED">{ar ? "معتمدة" : "Approved"}</option>
          <option value="REJECTED">{ar ? "مرفوضة" : "Rejected"}</option>
        </select>

        <input
          type="date"
          className="ctr-search-input staff-ops-toolbar__field staff-ops-toolbar__field--date"
          value={filterDate}
          onChange={(event) => {
            setFilterDate(event.target.value);
            pagination.setCurrentPage(1);
          }}
          aria-label={ar ? "تصفية حسب التاريخ" : "Filter by date"}
          title={ar ? "تصفية حسب التاريخ" : "Filter by date"}
        />
      </div>

      <AnimatePresence mode="wait">
        {excusesQuery.isError || leavesQuery.isError ? (
          <ErrorState
            title={ar ? "تعذر تحميل الطلبات" : "Unable to load requests"}
            onRetry={() => {
              void excusesQuery.refetch();
              void leavesQuery.refetch();
            }}
          />
        ) : excusesQuery.isLoading || leavesQuery.isLoading ? (
          <div className="ctr-grid-modern">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="ctr-card-modern animate-pulse h-40 opacity-50" />
            ))}
          </div>
        ) : pagination.pagedRows.length === 0 ? (
          <EmptyState
            title={ar ? "لا توجد طلبات" : "No requests found"}
          />
        ) : (
          <div className="ctr-grid-modern">
            {pagination.pagedRows.map((entry) => {
              const request = entry.request;
              const isPending = normalizeStatus(request.status) === "PENDING";
              const isLeave = entry.kind === "LEAVE";
              const attachmentUrl =
                isLeave ? ((request as StaffLeaveRequest).attachmentUrl ?? undefined) : undefined;
              
              return (
                <motion.div
                  key={`${entry.kind}-${request.id}`}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="ctr-card-modern"
                >
                  <div className="ctr-card-header">
                    <div className={`ctr-card-icon-box ${isLeave ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                      {isLeave ? <Calendar size={22} /> : <FileText size={22} />}
                    </div>
                    <div className="ctr-card-title-wrap">
                      <h3 className="ctr-card-title text-[15px] font-bold">{request.user.fullName}</h3>
                      <div className="ctr-card-subtitle flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" />
                        <span className="text-slate-500 font-medium text-[11px]">{getRoleLabel(request.user.role, ar)}</span>
                      </div>
                    </div>
                    <div className="ctr-card-status-row">
                      {getStatusBadge(request.status, ar)}
                    </div>
                  </div>

                  <div className="ctr-card-details bg-slate-50/30 p-3 rounded-xl mt-3 space-y-2">
                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[10px]">{ar ? "نوع الطلب" : "Request Type"}</span>
                      <Badge variant={isLeave ? "info" : "secondary"} size="sm" className="text-[10px]">
                        {isLeave ? (ar ? "إجازة" : "Leave") : ar ? "عذر غياب" : "Absence Excuse"}
                      </Badge>
                    </div>

                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[10px]">{ar ? "الفترة / التاريخ" : "Period / Date"}</span>
                      <span className="ctr-card-detail-val text-[11px] font-bold">
                        {isLeave ? (
                          `${new Date((request as StaffLeaveRequest).startDate).toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US")} - ${new Date((request as StaffLeaveRequest).endDate).toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US")}`
                        ) : (
                          new Date((request as StaffExcuseRequest).absenceDate).toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US")
                        )}
                      </span>
                    </div>

                    <div className="ctr-card-detail-row items-start pt-1">
                      <span className="ctr-card-detail-label text-[10px] mt-1">{ar ? "السبب" : "Reason"}</span>
                      <span className="text-[11px] text-slate-600 leading-normal line-clamp-2">
                        {request.reason || (ar ? "لا يوجد سبب مسجل" : "No reason provided")}
                      </span>
                    </div>
                  </div>

                  <div className="ctr-card-actions mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex gap-2">
                      {isPending && isOpsAdmin ? (
                        <>
                          <Button
                            size="sm"
                            className="h-8 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => isLeave ? handleUpdateLeaveStatus(request as StaffLeaveRequest, "APPROVED") : handleUpdateExcuseStatus(request.id, "APPROVED")}
                          >
                            <Check size={14} className="me-1" /> {ar ? "قبول" : "Approve"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-[11px] text-red-600 hover:bg-red-50"
                            onClick={() => isLeave ? handleUpdateLeaveStatus(request as StaffLeaveRequest, "REJECTED") : handleUpdateExcuseStatus(request.id, "REJECTED")}
                          >
                            <X size={14} className="me-1" /> {ar ? "رفض" : "Reject"}
                          </Button>
                        </>
                      ) : isPending ? (
                         <span className="text-[10px] text-slate-400 italic">{ar ? "بانتظار مراجعة الإدارة" : "Pending Admin Review"}</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider">{ar ? "تمت المراجعة بواسطة" : "Processed By"}</span>
                          <span className="text-[11px] font-bold text-slate-700">{request.handledBy?.fullName || (ar ? "النظام" : "System")}</span>
                        </div>
                      )}
                    </div>
                    
                    {attachmentUrl && (
                      <a 
                        href={attachmentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-brand hover:text-white transition-colors"
                      >
                        <LinkIcon size={14} />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ── Pagination ── */}
      {!excusesQuery.isLoading && !leavesQuery.isLoading && pagination.totalItems > 0 && (
        <div className="ctr-footer mt-6">
          <div className="ctr-page-info">
             {ar
              ? `عرض ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)} - ${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} من ${pagination.totalItems}`
              : `Showing ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)} - ${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} of ${pagination.totalItems}`
            }
          </div>

          <div className="ctr-page-controls">
            <button
              className="ctr-page-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.setCurrentPage(pagination.currentPage - 1)}
            >
              <ChevronRight size={16} />
            </button>
            <button className="ctr-page-btn active">{pagination.currentPage}</button>
            <button
              className="ctr-page-btn"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => pagination.setCurrentPage(pagination.currentPage + 1)}
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
