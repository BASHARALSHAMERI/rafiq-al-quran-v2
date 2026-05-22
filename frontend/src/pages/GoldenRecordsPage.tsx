import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  Medal,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  XCircle,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useI18n } from "../app/i18n";
import { Badge } from "../components/ui/Badge";
import { Button, type ButtonVariant } from "../components/ui/Button";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { useAuthStore } from "../features/auth/auth.store";
import { certificatesApi } from "../features/certificates/certificates.api";
import { openCertificatePrintWindow, writeCertificateToWindow } from "../features/certificates/certificate-print";
import {
  GOLDEN_RECORDS_QUERY_KEYS,
  useApproveGoldenRecordMutation,
  useCreateGoldenRecordMutation,
  useGoldenRecordsQuery,
  useGoldenRecordStatsQuery,
  useGraduationCandidatesQuery,
  useRejectGoldenRecordMutation,
  useSubmitGoldenRecordMutation,
  useUpdateGoldenRecordMutation
} from "../features/golden-records/golden-records.hooks";
import type {
  CreateGoldenRecordPayload,
  GoldenRecordItem,
  GoldenRecordStatsBreakdownItem,
  GoldenRecordType,
  RiwayaType,
  UpdateGoldenRecordPayload,
  GoldenRecordSource
} from "../features/golden-records/types";
import {
  badgeVariantForStatus,
  canApproveRecord,
  canEditRecord,
  canSubmitRecord,
  formatAverageLabel,
  formatDateLabel,
  goldenRecordStatusLabel,
  goldenRecordTypeLabel,
  hasEligibleGoldenRecordAttempt,
  riwayaLabel,
  toNullableNumber,
  toOptionalNumber,
  toPositiveNumber
} from "../features/golden-records/utils";
import { useCentersQuery, useCirclesQuery } from "../features/org/org.hooks";
import { canReadCenters, canReadCircles } from "../features/org/org.permissions";
import { useUsersQuery } from "../features/users/users.hooks";
import GraduationCandidatesPage from "./GraduationCandidatesPage";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import { entityFeedback, notifyError, notifySuccess, type LocalizedLabel } from "../shared/ui/feedback";

type TabId = "candidates" | "records" | "stats";
type RecordFormMode = "create" | "edit";
type RecordDecisionKind = "submit" | "approve" | "reject";
type SelectedSourceMode = GoldenRecordSource;

type StatsFiltersState = {
  year: string;
  centerId: string;
};

type RecordFiltersState = {
  year: string;
  centerId: string;
  circleId: string;
  search: string;
  type: string;
  riwaya: string;
  page: number;
  pageSize: number;
};

type RecordFormState = {
  sourceMode: SelectedSourceMode;
  candidateId: string;
  studentId: string;
  centerId: string;
  circleId: string;
  year: string;
  examId: string;
  examAttemptId: string;
  type: GoldenRecordType;
  riwaya: string;
  grade: string;
  average: string;
  appreciation: string;
  examDate: string;
  notes: string;
};

const PAGE_SIZES = [5, 10, 15, 20] as const;
const CURRENT_YEAR = new Date().getFullYear();
const GOLDEN_RECORD_TABS: readonly TabId[] = ["candidates", "records", "stats"];
const FINAL_RECORD_ENTITY: LocalizedLabel = { ar: "السجل النهائي", en: "final record" };
const FINAL_RECORDS_ENTITY: LocalizedLabel = { ar: "السجلات النهائية", en: "final records" };

const resolveActiveTab = (searchParams: URLSearchParams): TabId => {
  const requestedTab = searchParams.get("tab");

  return GOLDEN_RECORD_TABS.includes(requestedTab as TabId)
    ? (requestedTab as TabId)
    : "records";
};

const blankRecordForm = (defaults?: Partial<RecordFormState>): RecordFormState => ({
  sourceMode: "CANDIDATE",
  candidateId: "",
  studentId: "",
  centerId: "",
  circleId: "",
  year: String(CURRENT_YEAR),
  examId: "",
  examAttemptId: "",
  type: "KHATEM",
  riwaya: "",
  grade: "",
  average: "",
  appreciation: "",
  examDate: "",
  notes: "",
  ...defaults
});

const escapeCsvCell = (value: unknown) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
};

const downloadRecordsCsv = (rows: GoldenRecordItem[], ar: boolean) => {
  const headers = [
    ar ? "الطالب" : "Student",
    ar ? "السنة" : "Year",
    ar ? "المركز" : "Center",
    ar ? "الحلقة" : "Halaqa",
    ar ? "النوع" : "Type",
    ar ? "الرواية" : "Riwaya",
    ar ? "الدرجة" : "Grade",
    ar ? "المتوسط" : "Average",
    ar ? "التقدير" : "Appreciation",
    ar ? "تاريخ الاختبار" : "Exam Date",
    ar ? "الحالة" : "Status",
    ar ? "الرقم التسلسلي" : "Registry Serial"
  ];

  const lines = rows.map((row) =>
    [
      row.studentName,
      row.year,
      row.centerName,
      row.circleName ?? "",
      goldenRecordTypeLabel(row.type, ar),
      riwayaLabel(row.riwaya, ar),
      row.grade,
      formatAverageLabel(row.average, ar),
      row.appreciation,
      row.examDate ?? "",
      goldenRecordStatusLabel(row.status, ar),
      row.registrySerial ?? ""
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  const blob = new Blob([[headers.map(escapeCsvCell).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `golden-records-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const printRecordsTable = (rows: GoldenRecordItem[], ar: boolean) => {
  const printWindow = window.open("about:blank", "_blank", "width=1200,height=900");
  if (!printWindow) {
    throw new Error(ar ? "تعذر فتح نافذة الطباعة" : "Unable to open print window");
  }

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.studentName}</td>
          <td>${row.year}</td>
          <td>${row.centerName}</td>
          <td>${row.circleName ?? "-"}</td>
          <td>${goldenRecordTypeLabel(row.type, ar)}</td>
          <td>${riwayaLabel(row.riwaya, ar)}</td>
          <td>${row.grade}</td>
          <td>${formatAverageLabel(row.average, ar)}</td>
          <td>${row.appreciation}</td>
          <td>${row.examDate ?? "-"}</td>
          <td>${goldenRecordStatusLabel(row.status, ar)}</td>
          <td>${row.registrySerial ?? "-"}</td>
        </tr>
      `
    )
    .join("");

  printWindow.document.write(`
    <html dir="${ar ? "rtl" : "ltr"}" lang="${ar ? "ar" : "en"}">
      <head>
        <title>${ar ? "السجل الذهبي النهائي" : "Final Golden Records"}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          h1 { margin: 0 0 12px; font-size: 22px; }
          p { margin: 0 0 24px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: ${ar ? "right" : "left"}; font-size: 12px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>${ar ? "السجل الذهبي النهائي" : "Final Golden Records"}</h1>
        <p>${ar ? "طباعة الصفحة الحالية من نتائج السجل الذهبي" : "Current page printout of final golden records"}</p>
        <table>
          <thead>
            <tr>
              <th>${ar ? "الطالب" : "Student"}</th>
              <th>${ar ? "السنة" : "Year"}</th>
              <th>${ar ? "المركز" : "Center"}</th>
              <th>${ar ? "الحلقة" : "Halaqa"}</th>
              <th>${ar ? "النوع" : "Type"}</th>
              <th>${ar ? "الرواية" : "Riwaya"}</th>
              <th>${ar ? "الدرجة" : "Grade"}</th>
              <th>${ar ? "المتوسط" : "Average"}</th>
              <th>${ar ? "التقدير" : "Appreciation"}</th>
              <th>${ar ? "تاريخ الاختبار" : "Exam Date"}</th>
              <th>${ar ? "الحالة" : "Status"}</th>
              <th>${ar ? "الرقم التسلسلي" : "Registry Serial"}</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

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
  error?: string | null;
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
  error,
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
        {error ? <p className="golden-records-form-error">{error}</p> : null}
      </div>
    </ConfirmModal>
  );
}

export default function GoldenRecordsPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const canLoadCenters = canReadCenters(user?.role);
  const canLoadCircles = canReadCircles(user?.role);

  const [activeTab, setActiveTab] = useState<TabId>(() => resolveActiveTab(searchParams));

  const [statsFilters, setStatsFilters] = useState<StatsFiltersState>({
    year: String(CURRENT_YEAR),
    centerId: ""
  });
  const [recordFilters, setRecordFilters] = useState<RecordFiltersState>({
    year: String(CURRENT_YEAR),
    centerId: "",
    circleId: "",
    search: "",
    type: "",
    riwaya: "",
    page: 1,
    pageSize: PAGE_SIZES[1]
  });

  const [recordFormMode, setRecordFormMode] = useState<RecordFormMode | null>(null);
  const [recordFormDraft, setRecordFormDraft] = useState<RecordFormState>(blankRecordForm());
  const [recordFormTarget, setRecordFormTarget] = useState<GoldenRecordItem | null>(null);
  const [recordFormError, setRecordFormError] = useState<string | null>(null);

  const [recordDecision, setRecordDecision] = useState<{
    kind: RecordDecisionKind;
    item: GoldenRecordItem;
  } | null>(null);
  const [recordDecisionNote, setRecordDecisionNote] = useState("");
  const [recordDecisionError, setRecordDecisionError] = useState<string | null>(null);
  const [printingRecordId, setPrintingRecordId] = useState<number | null>(null);

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const circlesQ = useCirclesQuery(undefined, { enabled: canLoadCircles });
  const centers = centersQ.data?.items ?? [];
  const circles = circlesQ.data?.items ?? [];

  const statsQuery = {
    centerId: toPositiveNumber(statsFilters.centerId),
    year: toPositiveNumber(statsFilters.year) ?? CURRENT_YEAR
  };
  const statsQ = useGoldenRecordStatsQuery(statsQuery, activeTab === "stats");

  const recordsQuery = {
    centerId: toPositiveNumber(recordFilters.centerId),
    circleId: toPositiveNumber(recordFilters.circleId),
    search: recordFilters.search.trim() || undefined,
    year: toPositiveNumber(recordFilters.year) ?? CURRENT_YEAR,
    type: (recordFilters.type || undefined) as GoldenRecordType | undefined,
    riwaya: (recordFilters.riwaya || undefined) as RiwayaType | undefined,
    page: recordFilters.page,
    pageSize: recordFilters.pageSize
  };
  const recordsQ = useGoldenRecordsQuery(recordsQuery, activeTab === "records");

  const recordFormOpen = Boolean(recordFormMode);

  const recordFormCenterId = toPositiveNumber(recordFormDraft.centerId);
  const recordStudentsQ = useUsersQuery(
    {
      role: "STUDENT",
      centerId: recordFormCenterId,
      circleId: toPositiveNumber(recordFormDraft.circleId),
      page: 1,
      pageSize: 200
    },
    recordFormOpen && recordFormDraft.sourceMode === "MANUAL" && Boolean(recordFormCenterId)
  );
  const approvedCandidatesQ = useGraduationCandidatesQuery(
    {
      centerId: toPositiveNumber(recordFormDraft.centerId),
      year: toPositiveNumber(recordFormDraft.year) ?? CURRENT_YEAR,
      status: "APPROVED",
      page: 1,
      pageSize: 100
    },
    recordFormOpen && recordFormDraft.sourceMode === "CANDIDATE"
  );

  const createGoldenRecordM = useCreateGoldenRecordMutation();
  const updateGoldenRecordM = useUpdateGoldenRecordMutation();
  const submitGoldenRecordM = useSubmitGoldenRecordMutation();
  const approveGoldenRecordM = useApproveGoldenRecordMutation();
  const rejectGoldenRecordM = useRejectGoldenRecordMutation();

  const availableRecordCircles = circles.filter(
    (circle) => !recordFormCenterId || circle.centerId === recordFormCenterId
  );

  const recordStudents = recordStudentsQ.data?.items ?? [];
  const recordExams: Array<{ id: number; title: string }> = [];
  const recordExamAttempts: Array<{
    id: number;
    student?: { fullName?: string | null } | null;
    studentId: number;
    gradeLabel?: string | null;
    status: string;
  }> = [];
  const approvedCandidates = (approvedCandidatesQ.data?.items ?? []).filter(
    (item) =>
      item.status === "APPROVED" &&
      !item.goldenRecord &&
      hasEligibleGoldenRecordAttempt(item.examAttempt)
  );
  const selectedApprovedCandidate =
    approvedCandidates.find((item) => item.id === toPositiveNumber(recordFormDraft.candidateId)) ??
    null;

  useEffect(() => {
    const nextTab = resolveActiveTab(searchParams);
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    if (centers.length === 1 && !statsFilters.centerId) {
      setStatsFilters((current) => ({
        ...current,
        centerId: String(centers[0].id)
      }));
    }
    if (centers.length === 1 && !recordFilters.centerId) {
      setRecordFilters((current) => ({
        ...current,
        centerId: String(centers[0].id)
      }));
    }
  }, [centers, statsFilters.centerId, recordFilters.centerId]);

  useEffect(() => {
    const state = location.state as { createFromCandidateId?: number };
    if (state?.createFromCandidateId && centers.length > 0) {
      setRecordFormMode("create");
      setRecordFormTarget(null);
      setRecordFormError(null);
      setActiveTab("records");
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("tab", "records");
        return next;
      });
      setRecordFormDraft(
        blankRecordForm({
          sourceMode: "CANDIDATE",
          candidateId: String(state.createFromCandidateId),
          type: "KHATEM"
        })
      );
      navigate(`${location.pathname}?tab=records`, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, centers.length, setSearchParams]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("tab", tab);
      return next;
    });
  };

  const tabItems: Array<{ id: TabId; label: string; icon: ReactNode }> = [
    {
      id: "candidates",
      label: ar ? "مرشحو التخرج" : "Graduation Candidates",
      icon: <ClipboardCheck className="w-4 h-4" />
    },
    {
      id: "records",
      label: ar ? "السجل الذهبي النهائي" : "Final Golden Records",
      icon: <FileCheck2 className="w-4 h-4" />
    },
    {
      id: "stats",
      label: ar ? "إحصاءات نهاية العام" : "Year-End Statistics",
      icon: <BarChart3 className="w-4 h-4" />
    }
  ];

  const centerOptions = centers.map((center) => ({
    value: String(center.id),
    label: center.name
  }));
  const recordCircleOptions = circles
    .filter((circle) => !recordFilters.centerId || circle.centerId === Number(recordFilters.centerId))
    .map((circle) => ({
      value: String(circle.id),
      label: circle.name
    }));

  const refreshModule = async () => {
    await queryClient.invalidateQueries({ queryKey: GOLDEN_RECORDS_QUERY_KEYS.all });
    notifySuccess(entityFeedback.success(ar, "refresh", FINAL_RECORD_ENTITY));
  };

  const openCreateRecordModal = () => {
    setRecordFormMode("create");
    setRecordFormTarget(null);
    setRecordFormError(null);
    setRecordFormDraft(
      blankRecordForm({
        sourceMode: "CANDIDATE",
        centerId: recordFilters.centerId || (centers.length === 1 ? String(centers[0].id) : ""),
        year: recordFilters.year || String(CURRENT_YEAR)
      })
    );
  };

  const openEditRecordModal = (item: GoldenRecordItem) => {
    setRecordFormMode("edit");
    setRecordFormTarget(item);
    setRecordFormError(null);
    setRecordFormDraft(
      blankRecordForm({
        sourceMode: item.source === "MANUAL" ? "MANUAL" : "CANDIDATE",
        candidateId: item.candidateId ? String(item.candidateId) : "",
        studentId: String(item.studentId),
        centerId: String(item.centerId),
        circleId: item.circleId ? String(item.circleId) : "",
        year: String(item.year),
        type: item.type,
        riwaya: item.riwaya ?? "",
        grade: item.grade,
        average: item.average !== null ? String(item.average) : "",
        appreciation: item.appreciation,
        examDate: item.examDate ?? "",
        notes: item.notes ?? ""
      })
    );
  };

  const closeRecordModal = () => {
    setRecordFormMode(null);
    setRecordFormTarget(null);
    setRecordFormError(null);
  };

  const openRecordDecisionModal = (kind: RecordDecisionKind, item: GoldenRecordItem) => {
    setRecordDecision({ kind, item });
    setRecordDecisionNote(item.statusNote ?? "");
    setRecordDecisionError(null);
  };

  const closeRecordDecisionModal = () => {
    setRecordDecision(null);
    setRecordDecisionNote("");
    setRecordDecisionError(null);
  };

  const validateRecordForm = () => {
    if (!recordFormDraft.type) {
      return ar ? "نوع السجل مطلوب" : "Record type is required";
    }

    if (recordFormDraft.type === "IJAZAH" && !recordFormDraft.riwaya) {
      return ar ? "الرواية مطلوبة للإجازة" : "Riwaya is required for IJAZAH";
    }

    if (recordFormDraft.sourceMode === "CANDIDATE") {
      if (!toPositiveNumber(recordFormDraft.candidateId)) {
        return ar ? "اختيار مرشح معتمد مطلوب" : "Approved candidate is required";
      }

      if (!selectedApprovedCandidate && recordFormMode === "create") {
        return ar
          ? "يجب اختيار مرشح معتمد لديه محاولة اختبار مراجعة ومؤهلة"
          : "Select an approved candidate with an eligible reviewed exam attempt";
      }
      return null;
    }

    if (!toPositiveNumber(recordFormDraft.centerId)) {
      return ar ? "اختيار المركز مطلوب" : "Center is required";
    }

    if (!toPositiveNumber(recordFormDraft.studentId)) {
      return ar ? "اختيار الطالب مطلوب" : "Student is required";
    }

    const average = toOptionalNumber(recordFormDraft.average);
    if (recordFormDraft.average.trim() && (average === undefined || average < 0 || average > 100)) {
      return ar ? "المتوسط يجب أن يكون بين 0 و100" : "Average must be between 0 and 100";
    }

    if (recordFormDraft.sourceMode === "EXAM_BASED") {
      if (!toPositiveNumber(recordFormDraft.examId)) {
        return ar ? "ربط الاختبار مطلوب" : "Linked exam is required";
      }
      if (!toPositiveNumber(recordFormDraft.examAttemptId)) {
         return ar ? "المحاولة مطلوبة للإدخال المرتبط باختبار" : "Attempt is required for exam-based entry";
      }
    } else if (recordFormDraft.sourceMode === "MANUAL") {
      if (!recordFormDraft.grade.trim()) {
        return ar ? "الدرجة مطلوبة" : "Grade is required";
      }
      if (average === undefined) {
        return ar ? "المتوسط مطلوب" : "Average is required";
      }
      if (!recordFormDraft.appreciation.trim()) {
        return ar
          ? "التقدير مطلوب"
          : "Appreciation is required";
      }
      if (!recordFormDraft.examDate.trim()) {
        return ar
          ? "تاريخ الاختبار مطلوب"
          : "Exam date is required";
      }
    }

    return null;
  };

  const submitRecordForm = async () => {
    const validationError = validateRecordForm();
    if (validationError) {
      setRecordFormError(validationError);
      return;
    }

    try {
      setRecordFormError(null);

      if (recordFormMode === "create") {
        const payload: CreateGoldenRecordPayload = {
          candidateId: toNullableNumber(recordFormDraft.candidateId) ?? undefined,
          studentId: recordFormDraft.sourceMode === "CANDIDATE" && selectedApprovedCandidate ? selectedApprovedCandidate.studentId : toPositiveNumber(recordFormDraft.studentId)!,
          centerId: recordFormDraft.sourceMode === "CANDIDATE" && selectedApprovedCandidate ? selectedApprovedCandidate.centerId : toPositiveNumber(recordFormDraft.centerId)!,
          type: recordFormDraft.type,
          riwaya: (recordFormDraft.riwaya || null) as RiwayaType | null,
          grade: recordFormDraft.grade.trim() || undefined,
          average: toOptionalNumber(recordFormDraft.average),
          appreciation: recordFormDraft.appreciation.trim() || undefined,
          examDate: recordFormDraft.examDate.trim() || undefined,
          notes: recordFormDraft.notes.trim() || null
        };

        await createGoldenRecordM.mutateAsync(payload);
        notifySuccess(entityFeedback.success(ar, "create", FINAL_RECORD_ENTITY));
      } else if (recordFormTarget) {
        const payload: UpdateGoldenRecordPayload = {
          circleId:
            recordFormTarget.candidateId || recordFormDraft.sourceMode === "CANDIDATE"
              ? undefined
              : toNullableNumber(recordFormDraft.circleId),
          type: recordFormDraft.type,
          riwaya: (recordFormDraft.riwaya || null) as RiwayaType | null,
          grade: recordFormDraft.grade.trim() || undefined,
          average: toOptionalNumber(recordFormDraft.average),
          appreciation: recordFormDraft.appreciation.trim() || undefined,
          examDate: recordFormDraft.examDate.trim() || undefined,
          notes: recordFormDraft.notes.trim() || null,
          lockVersion: recordFormTarget.lockVersion
        };

        await updateGoldenRecordM.mutateAsync({
          recordId: recordFormTarget.id,
          payload
        });
        notifySuccess(entityFeedback.success(ar, "update", FINAL_RECORD_ENTITY));
      }

      closeRecordModal();
    } catch (error) {
      setRecordFormError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: entityFeedback.error(ar, "save", FINAL_RECORD_ENTITY)
        })
      );
    }
  };

  const confirmRecordDecision = async () => {
    if (!recordDecision) {
      return;
    }

    try {
      setRecordDecisionError(null);

      if (recordDecision.kind === "submit") {
        await submitGoldenRecordM.mutateAsync({
          recordId: recordDecision.item.id,
          payload: {
            statusNote: recordDecisionNote.trim() || null,
            lockVersion: recordDecision.item.lockVersion
          }
        });
        notifySuccess(entityFeedback.success(ar, "submit", FINAL_RECORD_ENTITY));
      } else if (recordDecision.kind === "approve") {
        await approveGoldenRecordM.mutateAsync({
          recordId: recordDecision.item.id,
          payload: {
            statusNote: recordDecisionNote.trim() || null,
            lockVersion: recordDecision.item.lockVersion
          }
        });
        notifySuccess(entityFeedback.success(ar, "approve", FINAL_RECORD_ENTITY));
      } else {
        await rejectGoldenRecordM.mutateAsync({
          recordId: recordDecision.item.id,
          payload: {
            statusNote: recordDecisionNote.trim(),
            lockVersion: recordDecision.item.lockVersion
          }
        });
        notifySuccess(entityFeedback.success(ar, "reject", FINAL_RECORD_ENTITY));
      }

      closeRecordDecisionModal();
    } catch (error) {
      setRecordDecisionError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: entityFeedback.error(ar, recordDecision.kind, FINAL_RECORD_ENTITY)
        })
      );
    }
  };

  const exportCurrentRecords = () => {
    const rows = recordsQ.data?.items ?? [];
    if (!rows.length) {
      notifyError(ar ? "لا توجد سجلات جاهزة للتصدير حاليًا" : "There are no records available to export right now.");
      return;
    }

    downloadRecordsCsv(rows, ar);
    notifySuccess(entityFeedback.success(ar, "export", FINAL_RECORDS_ENTITY));
  };

  const printCurrentRecords = () => {
    const rows = recordsQ.data?.items ?? [];
    if (!rows.length) {
      notifyError(ar ? "لا توجد سجلات جاهزة للطباعة حاليًا" : "There are no records available to print right now.");
      return;
    }

    try {
      printRecordsTable(rows, ar);
      notifySuccess(entityFeedback.success(ar, "print", FINAL_RECORDS_ENTITY));
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: entityFeedback.error(ar, "print", FINAL_RECORDS_ENTITY)
        })
      );
    }
  };

  const printCompletionCertificate = async (row: GoldenRecordItem) => {
    if (row.status !== "APPROVED" || row.type !== "KHATEM") {
      notifyError(ar ? "لا تتاح شهادة الختم إلا للسجلات النهائية المعتمدة من نوع خاتم." : "Completion certificates are available only for approved Khatem records.");
      return;
    }

    setPrintingRecordId(row.id);
    let printWindow: Window | null = null;
    try {
      printWindow = openCertificatePrintWindow();
      const certificate = await certificatesApi.getGoldenRecordCertificate(row.id);
      writeCertificateToWindow(printWindow, certificate);
      notifySuccess(ar ? "تم تجهيز شهادة إتمام الحفظ للطباعة." : "Completion certificate is ready to print.");
    } catch (error) {
      printWindow?.close();
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: ar ? "تعذر تجهيز شهادة إتمام الحفظ للطباعة." : "Unable to prepare the completion certificate."
        })
      );
    } finally {
      setPrintingRecordId(null);
    }
  };

  const recordColumns: Array<DataTableColumn<GoldenRecordItem>> = [
    {
      id: "student",
      header: ar ? "الطالب" : "Student",
      cell: (row) => (
        <div className="golden-records-cell">
          <strong>{row.studentName}</strong>
          <span>{row.centerName}</span>
        </div>
      )
    },
    {
      id: "type",
      header: ar ? "النوع / الرواية" : "Type / Riwaya",
      cell: (row) => (
        <div className="golden-records-cell">
          <strong>{goldenRecordTypeLabel(row.type, ar)}</strong>
          <span>{riwayaLabel(row.riwaya, ar)}</span>
        </div>
      )
    },
    {
      id: "grade",
      header: ar ? "الدرجة / المتوسط" : "Grade / Average",
      cell: (row) => (
        <div className="golden-records-cell">
          <strong>{row.grade}</strong>
          <span>{formatAverageLabel(row.average, ar)}</span>
        </div>
      )
    },
    {
      id: "appreciation",
      header: ar ? "التقدير / التاريخ" : "Appreciation / Date",
      cell: (row) => (
        <div className="golden-records-cell">
          <strong>{row.appreciation}</strong>
          <span>{formatDateLabel(row.examDate, ar)}</span>
        </div>
      )
    },
    {
      id: "source",
      header: ar ? "المصدر" : "Source",
      cell: (row) => (
        <Badge variant="default">
          {row.source === "CANDIDATE" ? (ar ? "مرشح" : "Candidate") : row.source === "EXAM_BASED" ? (ar ? "اختبار" : "Exam") : (ar ? "يدوي" : "Manual")}
        </Badge>
      )
    },
    {
      id: "status",
      header: ar ? "الحالة" : "Status",
      cell: (row) => (
        <Badge variant={badgeVariantForStatus(row.status)}>
          {goldenRecordStatusLabel(row.status, ar)}
        </Badge>
      )
    },
    {
      id: "registry",
      header: ar ? "الرقم التسلسلي" : "Registry Serial",
      cell: (row) => row.registrySerial ?? (ar ? "غير مولد بعد" : "Not generated yet")
    },
    {
      id: "actions",
      header: ar ? "الإجراءات" : "Actions",
      isActions: true,
      width: 320,
      cell: (row) => (
        <div className="golden-records-row-actions">
          {canEditRecord(row) ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Pencil className="w-4 h-4" />}
              onClick={() => openEditRecordModal(row)}
            >
              {ar ? "تعديل" : "Edit"}
            </Button>
          ) : null}
          {row.status === "APPROVED" && row.type === "KHATEM" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => void printCompletionCertificate(row)}
              isLoading={printingRecordId === row.id}
            >
              {ar ? "شهادة الختم" : "Certificate"}
            </Button>
          ) : null}
          {canSubmitRecord(row) ? (
            <Button
              type="button"
              variant="warning"
              size="sm"
              leftIcon={<ShieldCheck className="w-4 h-4" />}
              onClick={() => openRecordDecisionModal("submit", row)}
            >
              {ar ? "إرسال" : "Submit"}
            </Button>
          ) : null}
          {isSuperAdmin && canApproveRecord(row) ? (
            <Button
              type="button"
              variant="success"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => openRecordDecisionModal("approve", row)}
            >
              {ar ? "اعتماد" : "Approve"}
            </Button>
          ) : null}
          {isSuperAdmin && canApproveRecord(row) ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              leftIcon={<XCircle className="w-4 h-4" />}
              onClick={() => openRecordDecisionModal("reject", row)}
            >
              {ar ? "رفض" : "Reject"}
            </Button>
          ) : null}
        </div>
      )
    }
  ];

  const statsColumns: Array<DataTableColumn<GoldenRecordStatsBreakdownItem>> = [
    {
      id: "center",
      header: ar ? "المركز" : "Center",
      cell: (row) => (
        <div className="golden-records-cell">
          <strong>{row.centerName}</strong>
          <span>{row.centerCode}</span>
        </div>
      )
    },
    {
      id: "lt10",
      header: ar ? "أقل من 10" : "< 10",
      align: "center",
      cell: (row) => row.lessThan10Juz
    },
    {
      id: "j10",
      header: ar ? "10 أجزاء" : "10 Juz",
      align: "center",
      cell: (row) => row.juz10
    },
    {
      id: "j20",
      header: ar ? "20 جزءًا" : "20 Juz",
      align: "center",
      cell: (row) => row.juz20
    },
    {
      id: "j30",
      header: ar ? "30 جزءًا" : "30 Juz",
      align: "center",
      cell: (row) => row.juz30
    },
    {
      id: "total",
      header: ar ? "الإجمالي" : "Total",
      align: "center",
      cell: (row) => row.total
    }
  ];

  const isRefreshing =
    activeTab === "stats" ? statsQ.isFetching : activeTab === "records" ? recordsQ.isFetching : false;

  const pageHeaderActions = (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} size={16} />}
        onClick={() => void refreshModule()}
      >
        {ar ? "تحديث الكل" : "Refresh All"}
      </Button>
      {activeTab === "records" ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreateRecordModal}
        >
          {ar ? "إضافة سجل نهائي" : "Add Final Record"}
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="page admin-modern-page users-enterprise-shell golden-records-page">
      <PageHeader
        title={ar ? "السجل الذهبي" : "Golden Record"}
        description={
          ar
            ? "إدارة مرشحي التخرج والسجلات النهائية وإحصاءات الإنجاز السنوي ضمن مسار موحد"
            : "Manage graduation candidates, final approved records, and annual achievement statistics in one workflow"
        }
        icon={<ClipboardCheck className="w-6 h-6" />}
        actions={pageHeaderActions}
      />

      <section className="golden-records-tabs" role="tablist" aria-label={ar ? "تبويبات السجل الذهبي" : "Golden Record tabs"}>
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`golden-records-tab ${activeTab === tab.id ? "golden-records-tab--active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </section>

      {activeTab === "candidates" ? <GraduationCandidatesPage embedded /> : null}

      {activeTab === "stats" ? (
        <section className="golden-records-tab-panel">
          <div className="grade-scales-controls">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 h-[38px]">
                 <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-tight">{ar ? "السنة" : "Year"}</span>
                 <input
                   type="number"
                   className="bg-transparent border-none outline-none w-[60px] text-sm font-bold text-slate-700"
                   value={statsFilters.year}
                   onChange={(event) => setStatsFilters((current) => ({ ...current, year: event.target.value }))}
                 />
              </div>

              <select
                className="users-filter-select-modern"
                value={statsFilters.centerId}
                onChange={(event) => setStatsFilters((current) => ({ ...current, centerId: event.target.value }))}
              >
                <option value="">{ar ? "على مستوى الجهة" : "Organization level"}</option>
                {centerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1.5 ms-2 shrink-0">
              <div className="grade-scales-stats-pills !bg-transparent !border-none !p-0">
                <div className="grade-scales-pill">
                  {ar ? "إجمالي السجلات:" : "Total Records:"} <strong>{statsQ.data?.summary.total ?? 0}</strong>
                </div>
              </div>
              
              <div className="w-[1px] h-[24px] bg-slate-200 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                className="grade-scales-icon-btn"
                title={ar ? "إعادة ضبط الفلاتر" : "Reset Filters"}
                leftIcon={<RotateCcw size={16} />}
                onClick={() =>
                  setStatsFilters({
                    year: String(CURRENT_YEAR),
                    centerId: centers.length === 1 ? String(centers[0].id) : ""
                  })
                }
              />
            </div>
          </div>

          {statsQ.isError ? (
            <ErrorState
              title={ar ? "تعذر تحميل الإحصاءات" : "Unable to load statistics"}
              description={getLocalizedApiErrorMessage(statsQ.error, {
                ar,
                fallback: entityFeedback.error(ar, "load", { ar: "الإحصاءات", en: "statistics" })
              })}
              onRetry={() => void statsQ.refetch()}
            />
          ) : (
            <>
              <section className="golden-records-summary-grid">
                <div className="golden-records-summary-card">
                  <div className="golden-records-summary-card__icon golden-records-summary-card__icon--muted">
                    <TimerReset className="w-5 h-5" />
                  </div>
                  <div>
                    <strong>{statsQ.data?.summary.lessThan10Juz ?? 0}</strong>
                    <span>{ar ? "أقل من 10 أجزاء" : "Less than 10 Juz"}</span>
                  </div>
                </div>
                <div className="golden-records-summary-card">
                  <div className="golden-records-summary-card__icon golden-records-summary-card__icon--brand">
                    <Medal className="w-5 h-5" />
                  </div>
                  <div>
                    <strong>{statsQ.data?.summary.juz10 ?? 0}</strong>
                    <span>{ar ? "10 أجزاء" : "10 Juz"}</span>
                  </div>
                </div>
                <div className="golden-records-summary-card">
                  <div className="golden-records-summary-card__icon golden-records-summary-card__icon--info">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <strong>{statsQ.data?.summary.juz20 ?? 0}</strong>
                    <span>{ar ? "20 جزءًا" : "20 Juz"}</span>
                  </div>
                </div>
                <div className="golden-records-summary-card">
                  <div className="golden-records-summary-card__icon golden-records-summary-card__icon--success">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <strong>{statsQ.data?.summary.juz30 ?? 0}</strong>
                    <span>{ar ? "30 جزءًا" : "30 Juz"}</span>
                  </div>
                </div>
                <div className="golden-records-summary-card">
                  <div className="golden-records-summary-card__icon golden-records-summary-card__icon--warning">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <strong>{statsQ.data?.summary.total ?? 0}</strong>
                    <span>{ar ? "الإجمالي" : "Total"}</span>
                  </div>
                </div>
              </section>

              <DataTable className="golden-records-table golden-records-table--stats" columns={statsColumns} rows={statsQ.data?.breakdown ?? []} rowKey="centerId" loading={statsQ.isLoading} emptyState={<EmptyState title={ar ? "لا توجد إحصاءات لهذه السنة" : "No statistics for this year"} description={ar ? "ستظهر الإحصاءات بعد وجود لقطات سنوية أو سجلات ذهبية معتمدة." : "Statistics will appear when yearly snapshots or approved golden records exist."} />} />

              {statsQ.data && statsQ.data.breakdown.length > 0 && (
                <div className="grade-scales-footer">
                  <div className="gs-page-size">
                    <span>{ar ? "الصفوف:" : "Rows:"}</span>
                    <select disabled>
                      <option value="all">{ar ? "الكل" : "All"}</option>
                    </select>
                  </div>

                  <div className="gs-pagination-info">
                    {ar 
                      ? `إجمالي المراكز: ${statsQ.data.breakdown.length}` 
                      : `Total Centers: ${statsQ.data.breakdown.length}`
                    }
                  </div>

                  <div className="gs-pagination-controls">
                    <button type="button" className="gs-page-btn" disabled>
                      {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    <button type="button" className="gs-page-btn gs-page-btn--active">1</button>
                    <button type="button" className="gs-page-btn" disabled>
                      {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      ) : null}

      {activeTab === "records" ? (
        <section className="golden-records-tab-panel">
          <div className="grade-scales-controls">
            <div className="grade-scales-search-wrap">
              <Search size={16} className="grade-scales-search-icon" />
              <input
                type="text"
                className="grade-scales-search-input"
                value={recordFilters.search}
                onChange={(event) => setRecordFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
                placeholder={ar ? "ابحث بالاسم، الدرجة، الرقم التسلسلي..." : "Search records..."}
              />
            </div>

            <div className="grade-scales-stats-pills">
              <div className="grade-scales-pill">
                {ar ? "الإجمالي:" : "Total:"} <strong>{recordsQ.data?.total ?? 0}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="users-filter-select-modern !w-[90px]"
                value={recordFilters.year}
                onChange={(event) => setRecordFilters((current) => ({ ...current, year: event.target.value, page: 1 }))}
              >
                {[...Array(5)].map((_, i) => {
                  const y = CURRENT_YEAR - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>

              <select
                className="users-filter-select-modern"
                value={recordFilters.centerId}
                onChange={(event) => setRecordFilters((current) => ({ ...current, centerId: event.target.value, circleId: "", page: 1 }))}
              >
                <option value="">{ar ? "كل المراكز" : "All centers"}</option>
                {centerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>

              <select
                className="users-filter-select-modern"
                value={recordFilters.circleId}
                onChange={(event) => setRecordFilters((current) => ({ ...current, circleId: event.target.value, page: 1 }))}
              >
                <option value="">{ar ? "كل الحلقات" : "All halaqas"}</option>
                {recordCircleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>

              <select
                className="users-filter-select-modern"
                value={recordFilters.type}
                onChange={(event) => setRecordFilters((current) => ({ ...current, type: event.target.value, page: 1 }))}
              >
                <option value="">{ar ? "كل الأنواع" : "All types"}</option>
                <option value="KHATEM">{goldenRecordTypeLabel("KHATEM", ar)}</option>
                <option value="IJAZAH">{goldenRecordTypeLabel("IJAZAH", ar)}</option>
              </select>

              <div className="flex items-center gap-1.5 ms-2 shrink-0">
                 <Button
                   variant="ghost"
                   size="sm"
                   className="grade-scales-icon-btn"
                   title={ar ? "إعادة ضبط الفلاتر" : "Reset Filters"}
                   leftIcon={<RotateCcw size={16} />}
                   onClick={() =>
                     setRecordFilters({
                       year: String(CURRENT_YEAR),
                       centerId: centers.length === 1 ? String(centers[0].id) : "",
                       circleId: "",
                       search: "",
                       type: "",
                       riwaya: "",
                       page: 1,
                       pageSize: recordFilters.pageSize
                     })
                   }
                 />

                 <div className="w-[1px] h-[24px] bg-slate-200 mx-1" />

                 <Button type="button" variant="ghost" className="grade-scales-icon-btn" onClick={exportCurrentRecords} title={ar ? "تصدير" : "Export"} leftIcon={<Download size={16} />} />
                 <Button type="button" variant="ghost" className="grade-scales-icon-btn" onClick={printCurrentRecords} title={ar ? "طباعة" : "Print"} leftIcon={<Printer size={16} />} />
              </div>
            </div>
          </div>

          {recordsQ.isError ? (
            <ErrorState
              title={ar ? "تعذر تحميل السجلات النهائية" : "Unable to load final records"}
              description={getLocalizedApiErrorMessage(recordsQ.error, {
                ar,
                fallback: entityFeedback.error(ar, "load", FINAL_RECORDS_ENTITY)
              })}
              onRetry={() => void recordsQ.refetch()}
            />
          ) : (
            <div className="golden-records-table-wrap">
              <DataTable
                className="golden-records-table"
                columns={recordColumns}
                rows={recordsQ.data?.items ?? []}
                rowKey="id"
                loading={recordsQ.isLoading}
                emptyState={<EmptyState title={ar ? "لا توجد سجلات نهائية" : "No final records found"} description={ar ? "أنشئ أول سجل نهائي يدويًا أو من مرشح معتمد." : "Create the first final record manually or from an approved candidate."} />}
              />










              {recordsQ.data && recordsQ.data.total > 0 && (
                <div className="grade-scales-footer">
                  <div className="gs-page-size">
                    <span>{ar ? "الصفوف لكل صفحة:" : "Rows per page:"}</span>
                    <select
                      value={recordFilters.pageSize}
                      onChange={(e) => setRecordFilters(c => ({ ...c, pageSize: Number(e.target.value), page: 1 }))}
                    >
                      {PAGE_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </select>
                  </div>

                  <div className="gs-pagination-info">
                    {ar
                      ? `عرض ${Math.min(recordsQ.data.total, (recordFilters.page - 1) * recordFilters.pageSize + 1)} - ${Math.min(recordsQ.data.total, recordFilters.page * recordFilters.pageSize)} من ${recordsQ.data.total} سجل`
                      : `Showing ${Math.min(recordsQ.data.total, (recordFilters.page - 1) * recordFilters.pageSize + 1)} - ${Math.min(recordsQ.data.total, recordFilters.page * recordFilters.pageSize)} of ${recordsQ.data.total} records`
                    }
                  </div>

                  <div className="gs-pagination-controls">
                    <button
                      type="button"
                      className="gs-page-btn"
                      disabled={recordFilters.page === 1}
                      onClick={() => setRecordFilters(c => ({ ...c, page: recordFilters.page - 1 }))}
                    >
                      {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    {Array.from({ length: Math.min(5, Math.ceil(recordsQ.data.total / recordFilters.pageSize)) }, (_, i) => {
                      const totalPages = Math.ceil(recordsQ.data.total / recordFilters.pageSize);
                      let p = recordFilters.page;
                      if (recordFilters.page <= 3) p = i + 1;
                      else if (recordFilters.page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = recordFilters.page - 2 + i;

                      if (p <= 0 || p > totalPages) return null;

                      return (
                        <button
                          key={p}
                          type="button"
                          className={`gs-page-btn ${recordFilters.page === p ? "gs-page-btn--active" : ""}`}
                          onClick={() => setRecordFilters(c => ({ ...c, page: p }))}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      className="gs-page-btn"
                      disabled={recordFilters.page >= Math.ceil(recordsQ.data.total / recordFilters.pageSize)}
                      onClick={() => setRecordFilters(c => ({ ...c, page: recordFilters.page + 1 }))}
                    >
                      {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      <Modal
        isOpen={recordFormOpen}
        onClose={closeRecordModal}
        title={recordFormMode === "create" ? (ar ? "إضافة سجل ذهبي نهائي" : "Add Final Golden Record") : ar ? "تعديل السجل النهائي" : "Edit Final Record"}
        description={ar ? "يمكن إنشاء السجل من مرشح معتمد، استيراد محاولة اختبار، أو إدخال المعلومات يدويًا." : "You can create a record from an approved candidate, import an exam attempt, or explicitly input manually."}
        size="lg"
        panelClassName="golden-records-modal-panel"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeRecordModal}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="button" variant="primary" onClick={() => void submitRecordForm()} isLoading={createGoldenRecordM.isPending || updateGoldenRecordM.isPending}>
              {recordFormMode === "create" ? (ar ? "إنشاء السجل" : "Create Record") : ar ? "حفظ التعديلات" : "Save Changes"}
            </Button>
          </>
        }
      >
        <div className="golden-records-form-grid">
           {recordFormMode === "create" && (
             <div className="golden-records-form-grid__full golden-records-source-toggle">
                <button
                    type="button"
                    title="Manual"
                    className={`golden-records-source-toggle__btn ${recordFormDraft.sourceMode === "MANUAL" ? "golden-records-source-toggle__btn--active" : ""}`}
                    onClick={() => setRecordFormDraft(current => blankRecordForm({ ...current, sourceMode: "MANUAL", candidateId: "" }))}
                >
                    {ar ? "إدخال يدوي" : "Manual Entry"}
                </button>
                <button
                    type="button" hidden
                >
                    {ar ? "استيراد اختبار" : "Import from Exam"}
                </button>
                <button
                    type="button"
                    title="Candidate"
                    className={`golden-records-source-toggle__btn ${recordFormDraft.sourceMode === "CANDIDATE" ? "golden-records-source-toggle__btn--active" : ""}`}
                    onClick={() => setRecordFormDraft(current => blankRecordForm({ ...current, sourceMode: "CANDIDATE" }))}
                >
                    {ar ? "من مرشح معتمد" : "Approved Candidate"}
                </button>
             </div>
           )}

          {recordFormDraft.sourceMode === "CANDIDATE" ? (
             <div className="golden-records-form-grid__full">
                <Select
                  label={ar ? "المرشح المعتمد" : "Approved Candidate"}
                  value={recordFormDraft.candidateId}
                  onChange={(event) => setRecordFormDraft((current) => ({ ...current, candidateId: event.target.value }))}
                  placeholder={ar ? "اختر مرشحًا معتمدًا" : "Select approved candidate"}
                  options={approvedCandidates.map((candidate) => ({
                    value: String(candidate.id),
                    label: `${candidate.studentName} - ${candidate.centerName}`
                  }))}
                  disabled={Boolean(recordFormTarget)}
                />
             </div>
          ) : (
            <>
              <Input type="number" label={ar ? "السنة" : "Year"} value={recordFormDraft.year} onChange={(event) => setRecordFormDraft((current) => ({ ...current, year: event.target.value }))} />
              <Select label={ar ? "المركز" : "Center"} value={recordFormDraft.centerId} onChange={(event) => setRecordFormDraft((current) => ({ ...current, centerId: event.target.value, studentId: "" }))} placeholder={ar ? "اختر المركز" : "Select center"} options={centerOptions} disabled={Boolean(recordFormTarget?.candidateId)} />
              <Select label={ar ? "الحلقة" : "Halaqa"} value={recordFormDraft.circleId} onChange={(event) => setRecordFormDraft((current) => ({ ...current, circleId: event.target.value, studentId: "", examId: "", examAttemptId: "" }))} placeholder={ar ? "اختياري" : "Optional"} options={availableRecordCircles.map((circle) => ({ value: String(circle.id), label: circle.name }))} disabled={Boolean(recordFormTarget?.candidateId)} />
              <Select label={ar ? "الطالب" : "Student"} value={recordFormDraft.studentId} onChange={(event) => setRecordFormDraft((current) => ({ ...current, studentId: event.target.value, examAttemptId: "" }))} placeholder={ar ? "اختر الطالب" : "Select student"} options={recordStudents.map((student) => ({ value: String(student.id), label: student.fullName }))} />
              
              {recordFormDraft.sourceMode === "EXAM_BASED" && (
                 <>
                   <Select label={ar ? "الاختبار" : "Exam"} value={recordFormDraft.examId} onChange={(event) => setRecordFormDraft((current) => ({ ...current, examId: event.target.value, examAttemptId: "" }))} placeholder={ar ? "اختر الاختبار" : "Select exam"} options={recordExams.map((exam) => ({ value: String(exam.id), label: exam.title }))} disabled={Boolean(recordFormTarget?.candidateId)} />
                   <Select label={ar ? "المحاولة" : "Attempt"} value={recordFormDraft.examAttemptId} onChange={(event) => setRecordFormDraft((current) => ({ ...current, examAttemptId: event.target.value }))} placeholder={ar ? "اختيار المحاولة" : "Select attempt"} options={recordExamAttempts.map((attempt) => ({ value: String(attempt.id), label: `${attempt.student?.fullName ?? attempt.studentId} - ${attempt.gradeLabel ?? attempt.status}` }))} disabled={Boolean(recordFormTarget?.candidateId)} />
                 </>
              )}
            </>
          )}

          <Select label={ar ? "النوع" : "Type"} value={recordFormDraft.type} onChange={(event) => setRecordFormDraft((current) => ({ ...current, type: event.target.value as GoldenRecordType, riwaya: event.target.value === "IJAZAH" ? current.riwaya : "" }))} options={[{ value: "KHATEM", label: goldenRecordTypeLabel("KHATEM", ar) }, { value: "IJAZAH", label: goldenRecordTypeLabel("IJAZAH", ar) }]} />
          <Select label={ar ? "الرواية" : "Riwaya"} value={recordFormDraft.riwaya} onChange={(event) => setRecordFormDraft((current) => ({ ...current, riwaya: event.target.value }))} placeholder={recordFormDraft.type === "IJAZAH" ? (ar ? "مطلوبة" : "Required") : ar ? "اختيار اختياري" : "Optional"} options={[{ value: "HAFS", label: riwayaLabel("HAFS", ar) }, { value: "WARSH", label: riwayaLabel("WARSH", ar) }]} />
          
          <Input label={ar ? "الدرجة" : "Grade"} value={recordFormDraft.grade} onChange={(event) => setRecordFormDraft((current) => ({ ...current, grade: event.target.value }))} disabled={recordFormDraft.sourceMode !== "MANUAL"} />
          <Input type="number" step="0.01" label={ar ? "المتوسط" : "Average"} value={recordFormDraft.average} onChange={(event) => setRecordFormDraft((current) => ({ ...current, average: event.target.value }))} disabled={recordFormDraft.sourceMode !== "MANUAL"} />
          <Input label={ar ? "التقدير" : "Appreciation"} value={recordFormDraft.appreciation} onChange={(event) => setRecordFormDraft((current) => ({ ...current, appreciation: event.target.value }))} disabled={recordFormDraft.sourceMode !== "MANUAL"} />
          <Input type="date" label={ar ? "تاريخ الاختبار" : "Exam Date"} value={recordFormDraft.examDate} onChange={(event) => setRecordFormDraft((current) => ({ ...current, examDate: event.target.value }))} disabled={recordFormDraft.sourceMode !== "MANUAL"} />

          {recordFormDraft.sourceMode === "CANDIDATE" && selectedApprovedCandidate ? (
            <div className="golden-records-form-grid__full">
              <div className="golden-records-banner">
                <strong>{selectedApprovedCandidate.studentName}</strong>
                <span>
                  {selectedApprovedCandidate.centerName}
                  {" - "}
                  {selectedApprovedCandidate.circleName ?? (ar ? "بدون حلقة" : "No halaqa")}
                </span>
                <span>
                  {ar ? "تاريخ اختبار المصحف المخطط:" : "Planned mushaf exam date:"} {formatDateLabel(selectedApprovedCandidate.khatmaTestDate, ar)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="golden-records-form-grid__full">
            <label className="golden-records-field__label">{ar ? "ملاحظات" : "Notes"}</label>
            <textarea className="golden-records-textarea" rows={4} value={recordFormDraft.notes} onChange={(event) => setRecordFormDraft((current) => ({ ...current, notes: event.target.value }))} placeholder={ar ? "أضف أي ملاحظات مرتبطة بالسجل النهائي" : "Add notes related to the final record"} />
          </div>
        </div>
        <p className="golden-records-form-hint">
          {ar ? "لا يمكن متابعة السجل النهائي إلا بعد ضمان الموثوقية وعدم التعارض مع المدخلات الأخرى." : "The final record can only proceed when data is validated to be trustworthy without colliding."}
        </p>
        {recordFormError ? <p className="golden-records-form-error">{recordFormError}</p> : null}
      </Modal>

      <DecisionModal
        isOpen={Boolean(recordDecision)}
        title={recordDecision?.kind === "submit" ? (ar ? "إرسال السجل للاعتماد" : "Submit Final Record") : recordDecision?.kind === "approve" ? (ar ? "اعتماد السجل النهائي" : "Approve Final Record") : ar ? "رفض السجل النهائي" : "Reject Final Record"}
        description={recordDecision?.kind === "reject" ? (ar ? "سبب الرفض مطلوب قبل إرجاع السجل للمراجعة." : "A rejection reason is required before sending the record back.") : ar ? "يمكن إضافة ملاحظة حالة اختيارية." : "You can add an optional status note."}
        confirmLabel={recordDecision?.kind === "submit" ? (ar ? "إرسال" : "Submit") : recordDecision?.kind === "approve" ? (ar ? "اعتماد" : "Approve") : ar ? "رفض" : "Reject"}
        cancelLabel={ar ? "إلغاء" : "Cancel"}
        confirmVariant={recordDecision?.kind === "approve" ? "success" : recordDecision?.kind === "reject" ? "danger" : "warning"}
        note={recordDecisionNote}
        noteLabel={ar ? "ملاحظة الحالة" : "Status Note"}
        notePlaceholder={recordDecision?.kind === "reject" ? (ar ? "سبب رفض السجل النهائي" : "Reason for rejecting the final record") : ar ? "ملاحظة اختيارية" : "Optional note"}
        requireNote={recordDecision?.kind === "reject"}
        summary={recordDecision ? <div className="golden-records-banner"><strong>{recordDecision.item.studentName}</strong><span>{goldenRecordTypeLabel(recordDecision.item.type, ar)} - {goldenRecordStatusLabel(recordDecision.item.status, ar)}</span></div> : null}
        error={recordDecisionError}
        isLoading={submitGoldenRecordM.isPending || approveGoldenRecordM.isPending || rejectGoldenRecordM.isPending}
        onClose={closeRecordDecisionModal}
        onConfirm={() => void confirmRecordDecision()}
        onNoteChange={setRecordDecisionNote}
      />
    </div>
  );
}
