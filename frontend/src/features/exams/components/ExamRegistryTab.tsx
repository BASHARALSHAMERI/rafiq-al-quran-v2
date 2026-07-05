import { useEffect, useMemo, useState } from "react";
import { 
  ClipboardList, 
  Eye, 
  Printer,
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MapPin
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useAuthStore } from "../../auth/auth.store";
import { certificatesApi } from "../../certificates/certificates.api";
import { openCertificatePrintWindow, writeCertificateToWindow } from "../../certificates/certificate-print";
import { useAllAttemptsQuery } from "../exams.hooks";
import {
  ATTEMPT_STATUS_LABELS,
  ATTEMPT_STATUS_VARIANTS,
  EXAM_TYPE_LABELS
} from "../constants/exam-templates";
import type { ExamAttempt } from "../types";
import { ExamEvaluationWorkspace } from "./ExamEvaluationWorkspace";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { notifyError, notifySuccess } from "../../../shared/ui/feedback";
import "../../../styles/features/exam-registry.css";

type CenterOption = { id: number; name: string };
type CircleOption = { id: number; name: string; centerId: number };


const formatDate = (value?: string | null) => {
  if (!value) return "?";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "?"
    : new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric"
      }).format(parsed);
};

const isAttemptOverdue = (attempt: ExamAttempt) => {
  if (attempt.status !== "SCHEDULED") return false;
  if (!attempt.examDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const examDate = new Date(attempt.examDate);
  examDate.setHours(0, 0, 0, 0);
  
  return examDate.getTime() < today.getTime();
};

const toTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getStudentInitials = (name?: string) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] + (name[1] || "")).toUpperCase();
};

const canPrintExamCertificate = (attempt: ExamAttempt) => {
  const passScore = attempt.exam?.passScore;
  return (
    (attempt.status === "APPROVED" || attempt.status === "PUBLISHED") &&
    attempt.totalScore !== null &&
    passScore !== undefined &&
    attempt.totalScore >= passScore
  );
};

export function ExamRegistryTab({
  centers,
  circles
}: {
  centers: CenterOption[];
  circles: CircleOption[];
}) {
  const user = useAuthStore((state) => state.user);
  const isCenterAdmin = user?.role === "CENTER_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [search, setSearch] = useState("");
  const [centerId, setCenterId] = useState<number | undefined>();
  const [circleId, setCircleId] = useState<number | undefined>();
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [printingAttemptId, setPrintingAttemptId] = useState<number | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const attemptsQuery = useAllAttemptsQuery({ centerId, circleId }, Boolean(user));

  const filteredCircles = useMemo(
    () => (centerId ? circles.filter((circle) => circle.centerId === centerId) : circles),
    [centerId, circles]
  );

  const allAttempts = attemptsQuery.data ?? [];

  const filteredAttempts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...allAttempts].sort(
      (a, b) => toTimestamp(b.examDate ?? b.createdAt) - toTimestamp(a.examDate ?? a.createdAt)
    );

    if (!q) return base;

    return base.filter((attempt) => {
      const haystack = [
        attempt.student?.fullName,
        attempt.exam?.title,
        attempt.circle?.name,
        attempt.circle?.center?.name,
        attempt.gradeLabel
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [allAttempts, search]);

  const totalPages = Math.ceil(filteredAttempts.length / pageSize);
  const paginatedAttempts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAttempts.slice(start, start + pageSize);
  }, [filteredAttempts, page, pageSize]);

  useEffect(() => {
    if (!selectedAttempt) return;
    const latestAttempt = allAttempts.find((attempt) => attempt.id === selectedAttempt.id);
    if (latestAttempt) setSelectedAttempt(latestAttempt);
  }, [allAttempts, selectedAttempt]);

  const summary = useMemo(() => {
    const total = allAttempts.length;
    const scheduled = allAttempts.filter(a => a.status === "SCHEDULED").length;
    const active = allAttempts.filter(a => ["IN_PROGRESS", "EVALUATED", "APPROVED"].includes(a.status)).length;
    const published = allAttempts.filter(a => a.status === "PUBLISHED").length;
    return { total, scheduled, active, published };
  }, [allAttempts]);

  const canOpenAttempt = isCenterAdmin || isSuperAdmin;

  const printAttemptCertificate = async (attempt: ExamAttempt) => {
    if (!canPrintExamCertificate(attempt)) {
      notifyError("لا تتاح الشهادة إلا بعد نجاح المحاولة واعتمادها أو نشرها.");
      return;
    }

    setPrintingAttemptId(attempt.id);
    let printWindow: Window | null = null;
    try {
      printWindow = openCertificatePrintWindow();
      const certificate = await certificatesApi.getExamAttemptCertificate(attempt.id);
      writeCertificateToWindow(printWindow, certificate);
      notifySuccess("تم تجهيز شهادة الاختبار للطباعة.");
    } catch (error) {
      printWindow?.close();
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar: true,
          fallback: "تعذر تجهيز شهادة الاختبار للطباعة."
        })
      );
    } finally {
      setPrintingAttemptId(null);
    }
  };

  return (
    <div className="exams-registry-tab" dir="rtl">
      {/* Unified Controls Header */}
      <div className="exam-bank-controls">
        <div className="exam-bank-search-group" style={{ flex: 2 }}>
          <div className="eb-search-wrap">
            <Search className="eb-search-icon" size={16} />
            <input
              className="eb-search-input"
              style={{ fontSize: '0.75rem' }}
              placeholder="ابحث باسم الطالب، الاختبار، أو المركز..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="exam-bank-stats">
            <div className="eb-stat-pill" style={{ fontSize: '0.68rem' }}>إجمالي: <strong>{summary.total}</strong></div>
            <div className="eb-stat-pill" style={{ fontSize: '0.68rem' }}>مجدولة: <strong>{summary.scheduled}</strong></div>
            <div className="eb-stat-pill" style={{ fontSize: '0.68rem' }}>قيد المعالجة: <strong>{summary.active}</strong></div>
          </div>
        </div>

        <div className="er-filters-group">
          <select
            className="er-filter-select"
            value={centerId ?? ""}
            onChange={(e) => {
              const next = e.target.value ? Number(e.target.value) : undefined;
              setCenterId(next);
              setCircleId(undefined);
              setPage(1);
            }}
          >
            <option value="">كل المراكز</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className="er-filter-select"
            value={circleId ?? ""}
            onChange={(e) => {
              setCircleId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
          >
            <option value="">كل الحلقات</option>
            {filteredCircles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="exam-types-tab__workspace">
        {attemptsQuery.isLoading ? (
          <div className="grade-scales-loading" style={{ fontSize: '0.8rem' }}>جاري تحميل سجل الاختبارات...</div>
        ) : filteredAttempts.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={40} />}
            title="لا توجد اختبارات مسجلة"
            description="جرّب تغيير فلاتر البحث أو المركز للوصول إلى البيانات المطلوبة."
          />
        ) : (
          <>
            <div className="exam-registry-list">
              {paginatedAttempts.map((attempt) => (
                <div key={attempt.id} className="exam-registry-row">
                  <div className="er-row-right">
                    <div className="er-student-avatar">
                      {getStudentInitials(attempt.student?.fullName)}
                    </div>
                    <div className="er-student-info">
                      <strong 
                        className="er-student-name"
                        onClick={() => canOpenAttempt && setSelectedAttempt(attempt)}
                      >
                        {attempt.student?.fullName ?? "—"}
                      </strong>
                      <div className="er-circle-name">
                        <MapPin size={11} />
                        <span>{attempt.circle?.name ?? "—"}</span>
                        {attempt.circle?.center?.name && <span style={{ opacity: 0.6 }}>• {attempt.circle.center.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="er-row-center">
                    <strong className="er-exam-title">{attempt.exam?.title ?? "—"}</strong>
                    <span className="er-exam-type">{EXAM_TYPE_LABELS[attempt.exam?.type ?? "JUZ"]}</span>
                  </div>

                  <div className="er-row-left">
                    <div className="er-date-box">
                      <span>تاريخ الاختبار</span>
                      <strong>{formatDate(attempt.examDate ?? attempt.createdAt)}</strong>
                    </div>

                    <div style={{ minWidth: '100px', display: 'flex', justifyContent: 'center' }}>
                      <Badge 
                        variant={isAttemptOverdue(attempt) ? "error" : ATTEMPT_STATUS_VARIANTS[attempt.status]} 
                        size="sm" 
                        className="text-[0.62rem]"
                      >
                        {isAttemptOverdue(attempt) ? "مجدول (فات الموعد)" : ATTEMPT_STATUS_LABELS[attempt.status]}
                      </Badge>
                    </div>

                    <div className="er-result-box">
                      {attempt.totalScore !== null ? (
                        <>
                          <span className="er-result-score">{attempt.totalScore}</span>
                          <span className="er-result-grade">{attempt.gradeLabel ?? "—"}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>بانتظار النتيجة</span>
                      )}
                    </div>

                    <div className="et-actions">
                      <button
                        className="gs-icon-btn"
                        onClick={() => void printAttemptCertificate(attempt)}
                        title="طباعة شهادة الاختبار"
                        disabled={!canPrintExamCertificate(attempt) || printingAttemptId === attempt.id}
                      >
                        <Printer size={14} />
                      </button>
                      <button 
                        className="gs-icon-btn" 
                        onClick={() => setSelectedAttempt(attempt)}
                        title="عرض التفاصيل والتقييم"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="er-pagination-footer">
              <div className="er-page-size">
                <span>الصفوف لكل صفحة:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="er-pagination-info">
                عرض {Math.min(filteredAttempts.length, (page - 1) * pageSize + 1)} - {Math.min(filteredAttempts.length, page * pageSize)} من {filteredAttempts.length} سجل
              </div>

              <div className="er-pagination-controls">
                <button 
                  className="gs-page-btn" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronRight size={16} />
                </button>
                <button className="gs-page-btn gs-page-btn--active">
                   {page}
                </button>
                <button 
                  className="gs-page-btn" 
                  disabled={page === totalPages || totalPages === 0} 
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedAttempt ? (
        <ExamEvaluationWorkspace
          attempt={selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
          onUpdated={(nextAttempt) => setSelectedAttempt(nextAttempt)}
        />
      ) : null}
    </div>
  );
}
