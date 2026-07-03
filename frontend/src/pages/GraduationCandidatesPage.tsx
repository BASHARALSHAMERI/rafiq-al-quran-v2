import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Pencil,
  Plus,
  RefreshCw,
  XCircle,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useI18n } from "../app/i18n";
import { notifyError } from "../shared/ui/feedback";
import { Badge } from "../components/ui/Badge";
import { Button, type ButtonVariant } from "../components/ui/Button";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { useAuthStore } from "../features/auth/auth.store";
import { useAllAttemptsQuery } from "../features/exams/exams.hooks";
import {
  GOLDEN_RECORDS_QUERY_KEYS,
  useApproveCandidateMutation,
  useCreateCandidateMutation,
  useDeferCandidateMutation,
  useGraduationCandidatesQuery,
  useLinkCandidateExamAttemptMutation,
  useRejectCandidateMutation,
  useUpdateCandidateMutation
} from "../features/golden-records/golden-records.hooks";
import type {
  CreateCandidatePayload,
  GraduationCandidateItem
} from "../features/golden-records/types";
import {
  attemptStatusLabel,
  badgeVariantForStatus,
  calculateDurationMonths,
  canCreateRecordFromCandidate,
  canEditCandidate,
  canLinkCandidateExamAttempt,
  canTransitionCandidate,
  candidateStatusLabel,
  formatDateLabel,
  formatDurationLabel,
  getActiveStudentEnrollments,
  getEarliestStudentStartDate,
  toPositiveNumber
} from "../features/golden-records/utils";
import { useCentersQuery, useCirclesQuery } from "../features/org/org.hooks";
import { canReadCenters, canReadCircles } from "../features/org/org.permissions";
import { useUserByIdQuery, useUsersQuery } from "../features/users/users.hooks";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import { entityFeedback, notifySuccess, type LocalizedLabel, validationFeedback } from "../shared/ui/feedback";
import "../styles/features/golden-registry.css";

type CandidateFormMode = "create" | "edit";
type CandidateDecisionKind = "approve" | "reject" | "defer";
type GraduationCandidatesPageProps = {
  embedded?: boolean;
};

type CandidateFiltersState = {
  year: string;
  centerId: string;
  circleId: string;
  search: string;
  page: number;
  pageSize: number;
};

type CandidateFormState = {
  studentId: string;
  memorizationCompletionDate: string;
  khatmaTestDate: string;
  notes: string;
};

type CandidateExamLinkFormState = {
  examAttemptId: string;
};

const PAGE_SIZES = [5, 10, 15, 20] as const;
const CURRENT_YEAR = new Date().getFullYear();
const CANDIDATE_ENTITY: LocalizedLabel = { ar: "المرشح", en: "candidate" };
const CANDIDATES_ENTITY: LocalizedLabel = { ar: "المرشحين", en: "candidates" };
const EXAM_ATTEMPT_ENTITY: LocalizedLabel = { ar: "محاولة الاختبار", en: "exam attempt" };
const EXAM_ATTEMPTS_ENTITY: LocalizedLabel = { ar: "محاولات الاختبار", en: "exam attempts" };

const blankCandidateForm = (defaults?: Partial<CandidateFormState>): CandidateFormState => ({
  studentId: "",
  memorizationCompletionDate: "",
  khatmaTestDate: "",
  notes: "",
  ...defaults
});

const blankCandidateExamLinkForm = (defaults?: Partial<CandidateExamLinkFormState>): CandidateExamLinkFormState => ({
  examAttemptId: "",
  ...defaults
});

type DecisionModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  note: string;
  noteLabel: string;
  notePlaceholder: string;
  requireNote?: boolean;
  summary?: ReactNode;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onNoteChange: (value: string) => void;
};

function DecisionModal({
  isOpen,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel,
  confirmVariant,
  note,
  noteLabel,
  notePlaceholder,
  requireNote = false,
  summary,
  isLoading,
  onClose,
  onConfirm,
  onNoteChange
}: DecisionModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      confirmVariant={confirmVariant}
      isConfirming={isLoading}
      confirmDisabled={requireNote && !note.trim()}
      cancelLabel={cancelLabel}
      size="md"
    >
      <div className="golden-records-decision-modal">
        {summary}
        <div className="golden-records-field">
          <label className="golden-records-field__label">
            {noteLabel}
            {requireNote ? <span className="golden-records-field__required">*</span> : null}
          </label>
          <textarea
            className="golden-records-textarea"
            rows={4}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={notePlaceholder}
          />
        </div>
      </div>
    </ConfirmModal>
  );
}

export default function GraduationCandidatesPage({
  embedded = false
}: GraduationCandidatesPageProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canManageCandidateNominations = user?.role === "CENTER_ADMIN";
  const canLoadCenters = canReadCenters(user?.role);
  const canLoadCircles = canReadCircles(user?.role);

  const [filters, setFilters] = useState<CandidateFiltersState>({
    year: String(CURRENT_YEAR),
    centerId: "",
    circleId: "",
    search: "",
    page: 1,
    pageSize: PAGE_SIZES[1]
  });

  const [formMode, setFormMode] = useState<CandidateFormMode | null>(null);
  const [formDraft, setFormDraft] = useState<CandidateFormState>(blankCandidateForm());
  const [formTarget, setFormTarget] = useState<GraduationCandidateItem | null>(null);
  
  const [examLinkTarget, setExamLinkTarget] = useState<GraduationCandidateItem | null>(null);
  const [examLinkDraft, setExamLinkDraft] = useState<CandidateExamLinkFormState>(blankCandidateExamLinkForm());

  const [decision, setDecision] = useState<{ kind: CandidateDecisionKind; item: GraduationCandidateItem; } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const circlesQ = useCirclesQuery(undefined, { enabled: canLoadCircles });
  const centers = centersQ.data?.items ?? [];
  const circles = circlesQ.data?.items ?? [];

  const candidatesQuery = {
    centerId: toPositiveNumber(filters.centerId),
    circleId: toPositiveNumber(filters.circleId),
    search: filters.search.trim() || undefined,
    year: toPositiveNumber(filters.year) ?? CURRENT_YEAR,
    page: filters.page,
    pageSize: filters.pageSize
  };
  const candidatesQ = useGraduationCandidatesQuery(candidatesQuery);

  const formOpen = Boolean(formMode);
  const examLinkOpen = Boolean(examLinkTarget);

  const formStudentId = toPositiveNumber(formDraft.studentId) ?? null;
  const studentsQ = useUsersQuery(
    {
      role: "STUDENT",
      centerId: toPositiveNumber(filters.centerId),
      page: 1,
      pageSize: 200
    },
    formOpen && canManageCandidateNominations && formMode === "create"
  );
  const selectedStudentQ = useUserByIdQuery(formStudentId, formOpen && Boolean(formStudentId));
  const examLinkAttemptsQ = useAllAttemptsQuery(
    {
      centerId: examLinkTarget?.centerId,
      studentId: examLinkTarget?.studentId,
      purpose: "GOLDEN_RECORD_MUSHAF"
    },
    examLinkOpen && Boolean(examLinkTarget?.centerId) && Boolean(examLinkTarget?.studentId)
  );

  const createM = useCreateCandidateMutation();
  const updateM = useUpdateCandidateMutation();
  const approveM = useApproveCandidateMutation();
  const rejectM = useRejectCandidateMutation();
  const deferM = useDeferCandidateMutation();
  const linkExamM = useLinkCandidateExamAttemptMutation();

  const students = studentsQ.data?.items ?? [];
  const examLinkAttempts = examLinkAttemptsQ.data ?? [];
  const selectedExamLinkAttempt = examLinkAttempts.find((attempt) => attempt.id === (toPositiveNumber(examLinkDraft.examAttemptId) ?? 0)) ?? null;
  const selectedStudent = selectedStudentQ.data ?? null;
  const selectedActiveEnrollments = getActiveStudentEnrollments(selectedStudent);
  const selectedActiveEnrollment = selectedActiveEnrollments.length === 1 ? selectedActiveEnrollments[0] : null;

  const derivedCenterName = selectedActiveEnrollment?.circle?.centerId !== undefined
      ? centers.find((center) => center.id === selectedActiveEnrollment.circle?.centerId)?.name ?? formTarget?.centerName ?? (ar ? "غير محدد" : "Not set")
      : formTarget?.centerName ?? (ar ? "غير محدد" : "Not set");
  const derivedCircleName = selectedActiveEnrollment?.circle?.name ?? formTarget?.circleName ?? (ar ? "غير محدد" : "Not set");
  const derivedYear = formTarget?.year ?? CURRENT_YEAR;
  const derivedDurationMonths = calculateDurationMonths(
      getEarliestStudentStartDate(selectedStudent),
      formDraft.memorizationCompletionDate || formTarget?.memorizationCompletionDate
    ) ?? formTarget?.memorizationDurationMonths ?? null;

  const studentOptions = formMode === "edit" && formTarget
      ? [{ value: String(formTarget.studentId), label: formTarget.studentName }]
      : students.map((student) => ({ value: String(student.id), label: student.fullName }));

  const enrollmentError = !formStudentId || selectedStudentQ.isLoading
      ? null
      : selectedActiveEnrollments.length === 0
        ? ar ? "لا يمكن ترشيح طالب لا يملك حلقة فعالة." : "Student must have one active halaqa before nomination."
        : selectedActiveEnrollments.length > 1
          ? ar ? "لا يمكن ترشيح طالب لديه أكثر من حلقة فعالة. صحح بيانات الالتحاق أولاً." : "Student has multiple active halaqas. Fix enrollment data first."
          : null;

  useEffect(() => {
    if (!formOpen && centers.length === 1 && !filters.centerId) {
      setFilters((current) => ({ ...current, centerId: String(centers[0].id) }));
    }
  }, [formOpen, filters.centerId, centers]);

  const centerOptions = centers.map((center) => ({ value: String(center.id), label: center.name }));
  const circleOptions = circles.map((circle) => ({ value: String(circle.id), label: circle.name }));

  const refreshModule = async () => {
    await queryClient.invalidateQueries({ queryKey: GOLDEN_RECORDS_QUERY_KEYS.all });
    notifySuccess(entityFeedback.success(ar, "refresh", CANDIDATES_ENTITY));
  };

  const openCreateModal = () => {
    setFormMode("create");
    setFormTarget(null);
    setFormDraft(blankCandidateForm());
  };

  const openEditModal = (item: GraduationCandidateItem) => {
    setFormMode("edit");
    setFormTarget(item);
    setFormDraft(
      blankCandidateForm({
        studentId: String(item.studentId),
        memorizationCompletionDate: item.memorizationCompletionDate ?? "",
        khatmaTestDate: item.khatmaTestDate ?? "",
        notes: item.notes ?? ""
      })
    );
  };

  const closeModal = () => {
    setFormMode(null);
    setFormTarget(null);
  };

  const openExamLinkModal = (item: GraduationCandidateItem) => {
    setExamLinkTarget(item);
    setExamLinkDraft(blankCandidateExamLinkForm({ examAttemptId: item.examAttemptId ? String(item.examAttemptId) : "" }));
  };

  const closeExamLinkModal = () => {
    setExamLinkTarget(null);
    setExamLinkDraft(blankCandidateExamLinkForm());
  };

  const openDecisionModal = (kind: CandidateDecisionKind, item: GraduationCandidateItem) => {
    setDecision({ kind, item });
    setDecisionNote(item.statusNote ?? "");
  };

  const closeDecisionModal = () => {
    setDecision(null);
    setDecisionNote("");
  };

  const validateForm = () => {
    if (!toPositiveNumber(formDraft.studentId)) return ar ? "اختيار الطالب مطلوب" : "Student is required";
    if (!formDraft.memorizationCompletionDate.trim()) return ar ? "تاريخ إكمال الحفظ مطلوب" : "Memorization completion date is required";
    if (!formDraft.khatmaTestDate.trim()) return ar ? "تاريخ اختبار المصحف المخطط مطلوب" : "Planned mushaf exam date is required";
    if (formDraft.memorizationCompletionDate > formDraft.khatmaTestDate) return ar ? "تاريخ إكمال الحفظ يجب أن يسبق أو يساوي تاريخ الاختبار المخطط" : "Memorization completion date must be on or before the planned exam date";
    if (selectedStudentQ.isLoading) return ar ? "جاري تحميل بيانات الطالب الحالية، حاول بعد لحظة." : "Student context is still loading. Try again in a moment.";
    if (selectedStudentQ.isError) return ar ? "تعذر تحميل بيانات الطالب الحالية." : "Unable to load the current student context.";
    if (enrollmentError) return enrollmentError;
    return null;
  };

  const submitForm = async () => {
    const err = validateForm();
    if (err) {
      notifyError(err);
      return;
    }

    const payloadBase = {
      studentId: toPositiveNumber(formDraft.studentId)!,
      memorizationCompletionDate: formDraft.memorizationCompletionDate,
      khatmaTestDate: formDraft.khatmaTestDate,
      notes: formDraft.notes.trim() || null
    };

    try {
      if (formMode === "create") {
        await createM.mutateAsync(payloadBase as CreateCandidatePayload);
        notifySuccess(entityFeedback.success(ar, "create", CANDIDATE_ENTITY));
      } else if (formTarget) {
        await updateM.mutateAsync({
          candidateId: formTarget.id,
          payload: { ...payloadBase, lockVersion: formTarget.lockVersion }
        });
        notifySuccess(entityFeedback.success(ar, "update", CANDIDATE_ENTITY));
      }
      closeModal();
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: entityFeedback.error(ar, "save", CANDIDATE_ENTITY)
        })
      );
    }
  };

  const submitExamLink = async () => {
    if (!examLinkTarget) return;
    const examAttemptId = toPositiveNumber(examLinkDraft.examAttemptId);
    if (!examAttemptId) {
      notifyError(validationFeedback.required(ar, EXAM_ATTEMPT_ENTITY));
      return;
    }

    try {
      await linkExamM.mutateAsync({
        candidateId: examLinkTarget.id,
        payload: { examAttemptId, lockVersion: examLinkTarget.lockVersion }
      });
      notifySuccess(entityFeedback.success(ar, "link", CANDIDATE_ENTITY));
      closeExamLinkModal();
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: entityFeedback.error(ar, "link", CANDIDATE_ENTITY)
        })
      );
    }
  };

  const confirmDecision = async () => {
    if (!decision) return;
    try {
      if (decision.kind === "approve") {
        await approveM.mutateAsync({
          candidateId: decision.item.id,
          payload: { statusNote: decisionNote.trim() || null, lockVersion: decision.item.lockVersion }
        });
        notifySuccess(entityFeedback.success(ar, "approve", CANDIDATE_ENTITY));
      } else if (decision.kind === "reject") {
        await rejectM.mutateAsync({
          candidateId: decision.item.id,
          payload: { statusNote: decisionNote.trim(), lockVersion: decision.item.lockVersion }
        });
        notifySuccess(entityFeedback.success(ar, "reject", CANDIDATE_ENTITY));
      } else {
        await deferM.mutateAsync({
          candidateId: decision.item.id,
          payload: { statusNote: decisionNote.trim(), lockVersion: decision.item.lockVersion }
        });
        notifySuccess(entityFeedback.success(ar, "defer", CANDIDATE_ENTITY));
      }
      closeDecisionModal();
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: entityFeedback.error(ar, decision.kind, CANDIDATE_ENTITY)
        })
      );
    }
  };

    const pageHeader = (
    <PageHeader
      title={ar ? "مرشحو التخرج" : "Graduation Candidates"}
      description={ar ? "إدارة عمليات ترشيح التخرج والمركز والحلقات المرتبطة بنظام الحفظ والمراجعة." : "Manage graduation nominations, center and circle links for the memorization system."}
      icon={<ClipboardCheck className="w-6 h-6" />}
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={16} className={candidatesQ.isFetching ? "animate-spin" : ""} />}
            onClick={() => void refreshModule()}
          >
            {ar ? "تحديث" : "Refresh"}
          </Button>
        </div>
      }
    />
  );

  return (
    <div
      className={
        embedded
          ? "golden-records-page golden-records-page--embedded"
          : "page admin-modern-page users-enterprise-shell golden-records-page"
      }
    >
      {embedded ? null : pageHeader}

      <section className="golden-records-tab-panel">
        <div className="grade-scales-controls">
          <div className="grade-scales-search-wrap">
            <Search size={16} className="grade-scales-search-icon" />
            <input
              type="text"
              className="grade-scales-search-input"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
              placeholder={ar ? "ابحث بالاسم أو المركز..." : "Search candidates..."}
            />
          </div>

          <div className="grade-scales-stats-pills">
            <div className="grade-scales-pill">
              {ar ? "الإجمالي:" : "Total:"} <strong>{candidatesQ.data?.total ?? 0}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="users-filter-select-modern !w-[90px]"
              value={filters.year}
              onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value, page: 1 }))}
            >
              {[...Array(5)].map((_, i) => {
                const y = CURRENT_YEAR - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>

            {centers.length > 1 && (
              <select
                className="users-filter-select-modern"
                value={filters.centerId}
                onChange={(event) => setFilters((current) => ({ ...current, centerId: event.target.value, circleId: "", page: 1 }))}
              >
                <option value="">{ar ? "كل المراكز" : "All centers"}</option>
                {centerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            )}

            <select
              className="users-filter-select-modern"
              value={filters.circleId}
              onChange={(event) => setFilters((current) => ({ ...current, circleId: event.target.value, page: 1 }))}
            >
              <option value="">{ar ? "كل الحلقات" : "All halaqas"}</option>
              {circleOptions.filter((option) => !filters.centerId || circles.find((circle) => circle.id === Number(option.value))?.centerId === Number(filters.centerId)).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <div className="flex items-center gap-1.5 ms-2 shrink-0">
              <div className="flex items-center gap-1">
                {canManageCandidateNominations && (
                  <Button
                    type="button"
                    variant="primary"
                    className="h-[38px] px-3"
                    leftIcon={<Plus size={16} />}
                    onClick={openCreateModal}
                  >
                    {ar ? "إضافة مرشح" : "Add Candidate"}
                  </Button>
                )}
              </div>

              <div className="w-[1px] h-[24px] bg-slate-200 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                className="grade-scales-icon-btn"
                title={ar ? "إعادة ضبط الفلاتر" : "Reset Filters"}
                leftIcon={<RotateCcw size={16} />}
                onClick={() =>
                  setFilters({
                    year: String(CURRENT_YEAR),
                    centerId: centers.length === 1 ? String(centers[0].id) : "",
                    circleId: "",
                    search: "",
                    page: 1,
                    pageSize: filters.pageSize
                  })
                }
              />
            </div>
          </div>
        </div>

        {candidatesQ.isError ? (
          <ErrorState
            title={ar ? "تعذر تحميل المرشحين" : "Unable to load candidates"}
            description={getLocalizedApiErrorMessage(candidatesQ.error, {
              ar,
              fallback: entityFeedback.error(ar, "load", CANDIDATES_ENTITY)
            })}
            onRetry={() => void candidatesQ.refetch()}
          />
        ) : (
          
          <div className="gr-registry-list">
            {candidatesQ.data?.items.map((row) => (
              <div key={row.id} className="gr-registry-row">
                <div className="gr-row-right">
                  <div className="gr-student-avatar">
                    {row.studentName.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="gr-student-info">
                    <strong className="gr-student-name">{row.studentName}</strong>
                    <div className="gr-circle-name">
                      <span>{row.centerName}</span>
                      {row.circleName && <span style={{ opacity: 0.6 }}>• {row.circleName}</span>}
                    </div>
                  </div>
                </div>

                <div className="gr-row-center">
                  <strong className="gr-record-title">{ar ? "تاريخ الحفظ: " : "Memorization: "} {formatDateLabel(row.memorizationCompletionDate, ar)}</strong>
                  <span className="gr-record-type">{ar ? "اختبار المصحف: " : "Mushaf Exam: "} {formatDateLabel(row.khatmaTestDate, ar)}</span>
                </div>

                <div className="gr-row-left">
                  <div className="gr-date-box">
                    <span>{ar ? "تاريخ الترشيح" : "Nomination Date"}</span>
                    <strong>{formatDateLabel(row.createdAt, ar)}</strong>
                  </div>

                  <div style={{ minWidth: '100px', display: 'flex', justifyContent: 'center' }}>
                    <Badge variant={badgeVariantForStatus(row.status)} size="sm" className="text-[0.62rem]">
                      {candidateStatusLabel(row.status, ar)}
                    </Badge>
                  </div>

                  <div className="gr-result-box">
                    {row.examAttempt ? (
                      <>
                        <span className="gr-result-score" style={{ fontSize: '0.8rem' }}>{row.exam?.title ?? `#${row.examAttempt.examId}`}</span>
                        <span className="gr-result-grade">{attemptStatusLabel(row.examAttempt.status, ar)}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{ar ? "غير مرتبط باختبار" : "Not linked to exam"}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {canManageCandidateNominations && canEditCandidate(row) && (
                      <button className="gs-icon-btn" onClick={() => openEditModal(row)} title={ar ? "تعديل" : "Edit"}><Pencil size={14} /></button>
                    )}
                    {canManageCandidateNominations && canLinkCandidateExamAttempt(row) && (
                      <button className="gs-icon-btn" onClick={() => openExamLinkModal(row)} title={row.examAttemptId ? (ar ? "تحديث الربط" : "Update Link") : (ar ? "ربط المحاولة" : "Link Attempt")}><ClipboardCheck size={14} /></button>
                    )}
                    {isSuperAdmin && canTransitionCandidate(row, "APPROVED") && (
                      <button className="gs-icon-btn text-emerald-600 hover:bg-emerald-50" onClick={() => openDecisionModal("approve", row)} title={ar ? "اعتماد" : "Approve"}><CheckCircle2 size={14} /></button>
                    )}
                    {isSuperAdmin && canTransitionCandidate(row, "REJECTED") && (
                      <button className="gs-icon-btn text-rose-600 hover:bg-rose-50" onClick={() => openDecisionModal("reject", row)} title={ar ? "رفض" : "Reject"}><XCircle size={14} /></button>
                    )}
                    {canCreateRecordFromCandidate(row) && (
                      <Button type="button" variant="secondary" size="sm" leftIcon={<FileCheck2 size={14} />} onClick={() => navigate("/golden-records?tab=records", { state: { createFromCandidateId: row.id } })}>
                        {ar ? "إنشاء سجل نهائي" : "Create Final Record"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {candidatesQ.data && candidatesQ.data.total > 0 && (
              <div className="grade-scales-footer">
                <div className="gs-page-size">
                  <span>{ar ? "الصفوف لكل صفحة:" : "Rows per page:"}</span>
                  <select value={filters.pageSize} onChange={(e) => setFilters(c => ({ ...c, pageSize: Number(e.target.value), page: 1 }))}>
                    {PAGE_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                  </select>
                </div>
                <div className="gs-pagination-info">
                  {ar ? `عرض ${Math.min(candidatesQ.data.total, (filters.page - 1) * filters.pageSize + 1)} - ${Math.min(candidatesQ.data.total, filters.page * filters.pageSize)} من ${candidatesQ.data.total} مرشح` : `Showing ${Math.min(candidatesQ.data.total, (filters.page - 1) * filters.pageSize + 1)} - ${Math.min(candidatesQ.data.total, filters.page * filters.pageSize)} of ${candidatesQ.data.total} candidates`}
                </div>
                <div className="gs-pagination-controls">
                  <button type="button" className="gs-page-btn" disabled={filters.page === 1} onClick={() => setFilters(c => ({ ...c, page: filters.page - 1 }))}>
                    {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  </button>
                  <button type="button" className="gs-page-btn gs-page-btn--active">{filters.page}</button>
                  <button type="button" className="gs-page-btn" disabled={filters.page >= Math.ceil(candidatesQ.data.total / filters.pageSize)} onClick={() => setFilters(c => ({ ...c, page: filters.page + 1 }))}>
                    {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </section>

      <Modal isOpen={formOpen} onClose={closeModal} title={formMode === "create" ? (ar ? "إضافة مرشح تخرج" : "Add Graduation Candidate") : (ar ? "تعديل المرشح" : "Edit Candidate")} description={ar ? "ترشيح الطالب لمرحلة اختبار المصحف فقط. المركز والحلقة والسنة ومدة الحفظ تُشتق تلقائيًا من بيانات الطالب الحالية." : "Nominate the student for the planned mushaf exam only. Center, halaqa, year, and memorization duration are derived automatically from the current student context."} size="lg" panelClassName="golden-records-modal-panel" footer={<><Button type="button" variant="ghost" onClick={closeModal}>{ar ? "إلغاء" : "Cancel"}</Button><Button type="button" variant="primary" onClick={() => void submitForm()} isLoading={createM.isPending || updateM.isPending}>{formMode === "create" ? (ar ? "إضافة المرشح" : "Create Candidate") : (ar ? "حفظ التعديلات" : "Save Changes")}</Button></>}>
        <div className="golden-records-form-grid">
          <Select label={ar ? "الطالب" : "Student"} value={formDraft.studentId} onChange={(event) => setFormDraft((current) => ({ ...current, studentId: event.target.value }))} placeholder={ar ? "اختر الطالب" : "Select student"} options={studentOptions} disabled={formMode === "edit"} />
          <Input type="date" label={ar ? "تاريخ إكمال الحفظ" : "Completion Date"} value={formDraft.memorizationCompletionDate} onChange={(event) => setFormDraft((current) => ({ ...current, memorizationCompletionDate: event.target.value }))} />
          <Input type="date" label={ar ? "تاريخ اختبار المصحف المخطط" : "Planned Mushaf Exam Date"} value={formDraft.khatmaTestDate} onChange={(event) => setFormDraft((current) => ({ ...current, khatmaTestDate: event.target.value }))} />
          <Input label={ar ? "المركز" : "Center"} value={derivedCenterName} disabled />
          <Input label={ar ? "الحلقة" : "Halaqa"} value={derivedCircleName} disabled />
          <Input type="number" label={ar ? "السنة" : "Year"} value={String(derivedYear)} disabled />
          <Input label={ar ? "مدة الحفظ" : "Memorization Duration"} value={formatDurationLabel(derivedDurationMonths, ar)} disabled />

          {formDraft.studentId ? (
            <div className="golden-records-form-grid__full">
              <div className="golden-records-banner">
                <strong>{enrollmentError ? enrollmentError : ar ? "سيتم اعتماد المركز والحلقة من الارتباط الفعلي للطالب وقت الحفظ." : "Center and halaqa will be locked from the student's active enrollment when saved."}</strong>
                <span>{ar ? "تاريخ اختبار المصحف هنا تاريخ مخطط فقط، أما الجدولة والتنفيذ والنتيجة فتتم داخل وحدة الاختبارات." : "This mushaf exam date is a planned date only. Actual scheduling, execution, and results remain inside Exams."}</span>
              </div>
            </div>
          ) : null}

          <div className="golden-records-form-grid__full">
            <label className="golden-records-field__label">{ar ? "ملاحظات" : "Notes"}</label>
            <textarea className="golden-records-textarea" rows={4} value={formDraft.notes} onChange={(event) => setFormDraft((current) => ({ ...current, notes: event.target.value }))} placeholder={ar ? "أضف أي ملاحظات مرتبطة بالترشيح" : "Add nomination notes"} />
          </div>
        </div>
      </Modal>

      <Modal isOpen={examLinkOpen} onClose={closeExamLinkModal} title={examLinkTarget?.examAttemptId ? (ar ? "تحديث ربط محاولة الاختبار" : "Update Exam Attempt Link") : (ar ? "ربط المرشح بمحاولة اختبار" : "Link Candidate to Exam Attempt")} description={ar ? "يتم الربط بمحاولات اختبارات المصحف فقط، ويُشتق الامتحان تلقائيًا من المحاولة المرتبطة." : "Only mushaf exam attempts are available here. The linked exam is derived automatically from the selected attempt."} size="md" panelClassName="golden-records-modal-panel golden-records-modal-panel--narrow" footer={<><Button type="button" variant="ghost" onClick={closeExamLinkModal}>{ar ? "إلغاء" : "Cancel"}</Button><Button type="button" variant="primary" onClick={() => void submitExamLink()} isLoading={linkExamM.isPending}>{examLinkTarget?.examAttemptId ? (ar ? "حفظ الربط" : "Save Link") : (ar ? "ربط المحاولة" : "Link Attempt")}</Button></>}>
        {examLinkTarget ? (
          <>
            <div className="golden-records-banner">
              <strong>{examLinkTarget.studentName}</strong>
              <span>{examLinkTarget.centerName} {" - "} {examLinkTarget.circleName ?? (ar ? "بدون حلقة" : "No halaqa")}</span>
              <span>{ar ? "سيتم قبول محاولات اختبار المصحف المطابقة للطالب والمركز فقط." : "Only mushaf exam attempts that match the same student and center are accepted."}</span>
            </div>
            <div className="golden-records-form-grid">
              <Select label={ar ? "محاولة اختبار المصحف" : "Mushaf Exam Attempt"} value={examLinkDraft.examAttemptId} onChange={(event) => setExamLinkDraft({ examAttemptId: event.target.value })} placeholder={examLinkAttemptsQ.isLoading ? (ar ? "جاري تحميل المحاولات" : "Loading attempts") : (ar ? "اختر محاولة الاختبار" : "Select exam attempt")} options={examLinkAttempts.map((attempt) => ({ value: String(attempt.id), label: `${attempt.exam?.title ?? `#${attempt.examId}`} - ${attemptStatusLabel(attempt.status, ar)}` }))} disabled={examLinkAttemptsQ.isLoading} />
              <Input label={ar ? "الاختبار" : "Exam"} value={selectedExamLinkAttempt?.exam?.title ?? ""} disabled />
              <Input label={ar ? "الحالة التشغيلية" : "Attempt Status"} value={selectedExamLinkAttempt ? attemptStatusLabel(selectedExamLinkAttempt.status, ar) : ""} disabled />
            </div>
            {examLinkAttemptsQ.isError ? <p className="golden-records-form-error">{getLocalizedApiErrorMessage(examLinkAttemptsQ.error, { ar, fallback: entityFeedback.error(ar, "load", EXAM_ATTEMPTS_ENTITY) })}</p> : examLinkAttemptsQ.isLoading ? <p className="golden-records-form-hint">{ar ? "جاري تحميل محاولات اختبار المصحف المتاحة..." : "Loading available mushaf exam attempts..."}</p> : examLinkAttempts.length === 0 ? <p className="golden-records-form-hint">{ar ? "لا توجد حاليًا محاولات اختبار مصحف مرتبطة بهذا الطالب في وحدة الاختبارات." : "There are currently no mushaf exam attempts for this student in the Exams module."}</p> : null}
          </>
        ) : null}
      </Modal>

      <DecisionModal isOpen={Boolean(decision)} title={decision?.kind === "approve" ? (ar ? "اعتماد المرشح" : "Approve Candidate") : decision?.kind === "reject" ? (ar ? "رفض المرشح" : "Reject Candidate") : (ar ? "تأجيل المرشح" : "Defer Candidate")} description={decision?.kind === "approve" ? (ar ? "يمكن إضافة ملاحظة اعتماد اختيارية قبل تثبيت القرار." : "You may add an optional approval note before confirming.") : (ar ? "يرجى إدخال سبب واضح لهذا القرار." : "Please enter a clear reason for this decision.")} confirmLabel={decision?.kind === "approve" ? (ar ? "اعتماد" : "Approve") : decision?.kind === "reject" ? (ar ? "رفض" : "Reject") : (ar ? "تأجيل" : "Defer")} cancelLabel={ar ? "إلغاء" : "Cancel"} confirmVariant={decision?.kind === "approve" ? "success" : decision?.kind === "reject" ? "danger" : "warning"} note={decisionNote} noteLabel={ar ? "الملاحظة / السبب" : "Note / Reason"} notePlaceholder={decision?.kind === "approve" ? (ar ? "ملاحظة اعتماد اختيارية" : "Optional approval note") : (ar ? "سبب القرار" : "Decision reason")} requireNote={decision?.kind !== "approve"} summary={decision ? <div className="golden-records-banner"><strong>{decision.item.studentName}</strong><span>{decision.item.centerName}</span></div> : null} isLoading={approveM.isPending || rejectM.isPending || deferM.isPending} onClose={closeDecisionModal} onConfirm={() => void confirmDecision()} onNoteChange={setDecisionNote} />
    </div>
  );
}
