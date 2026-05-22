import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  Minus,
  PencilLine,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  BookOpen
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { useAuthStore } from "../../auth/auth.store";
import { certificatesApi } from "../../certificates/certificates.api";
import { openCertificatePrintWindow, writeCertificateToWindow } from "../../certificates/certificate-print";
import {
  useCreateAttemptQuestionMutation,
  useDeleteAttemptQuestionMutation,
  useEvaluateAttemptMutation,
  useFinalizeAttemptEvaluationMutation,
  useGenerateAttemptQuestionsMutation,
  usePublishAttemptMutation,
  useReopenAttemptForQuestionAdjustmentMutation
} from "../exams.hooks";
import {
  ATTEMPT_STATUS_LABELS,
  ATTEMPT_STATUS_VARIANTS,
  COMMITTEE_ROLE_LABELS
} from "../constants/exam-templates";
import { getSurahLabel } from "../constants/surah-options";
import type { EvaluateAttemptPayload, ExamAttempt } from "../types";
import { ExamCertificationScreen } from "./ExamCertificationScreen";
import type { EvaluationQuestion } from "./evaluation-types";
import { ManualAttemptQuestionModal } from "./ManualAttemptQuestionModal";
import { QuestionEvaluationModal } from "./QuestionEvaluationModal";
import "../../../styles/features/exam-workspace.css";

type ViewStep = "workspace" | "review";

type Props = {
  attempt: ExamAttempt;
  onClose: () => void;
  onUpdated?: (attempt: ExamAttempt) => void;
};

const STRENGTH_OPTIONS = ["جمال الصوت", "حسن الأداء", "قوة الحفظ"];
const WEAKNESS_OPTIONS = ["سرعة القراءة", "ضعف التجويد", "ضعف الحفظ", "كثرة التأتأة"];

const JUZ_BOUNDARIES = [
  { fromSurah: 1, fromAyah: 1, toSurah: 2, toAyah: 141 },
  { fromSurah: 2, fromAyah: 142, toSurah: 2, toAyah: 252 },
  { fromSurah: 2, fromAyah: 253, toSurah: 3, toAyah: 92 },
  { fromSurah: 3, fromAyah: 93, toSurah: 4, toAyah: 23 },
  { fromSurah: 4, fromAyah: 24, toSurah: 4, toAyah: 147 },
  { fromSurah: 4, fromAyah: 148, toSurah: 5, toAyah: 81 },
  { fromSurah: 5, fromAyah: 82, toSurah: 6, toAyah: 110 },
  { fromSurah: 6, fromAyah: 111, toSurah: 7, toAyah: 87 },
  { fromSurah: 7, fromAyah: 88, toSurah: 8, toAyah: 40 },
  { fromSurah: 8, fromAyah: 41, toSurah: 9, toAyah: 92 },
  { fromSurah: 9, fromAyah: 93, toSurah: 11, toAyah: 5 },
  { fromSurah: 11, fromAyah: 6, toSurah: 12, toAyah: 52 },
  { fromSurah: 12, fromAyah: 53, toSurah: 14, toAyah: 52 },
  { fromSurah: 15, fromAyah: 1, toSurah: 16, toAyah: 128 },
  { fromSurah: 17, fromAyah: 1, toSurah: 18, toAyah: 74 },
  { fromSurah: 18, fromAyah: 75, toSurah: 20, toAyah: 135 },
  { fromSurah: 21, fromAyah: 1, toSurah: 22, toAyah: 78 },
  { fromSurah: 23, fromAyah: 1, toSurah: 25, toAyah: 20 },
  { fromSurah: 25, fromAyah: 21, toSurah: 27, toAyah: 55 },
  { fromSurah: 27, fromAyah: 56, toSurah: 29, toAyah: 45 },
  { fromSurah: 29, fromAyah: 46, toSurah: 33, toAyah: 30 },
  { fromSurah: 33, fromAyah: 31, toSurah: 36, toAyah: 27 },
  { fromSurah: 36, fromAyah: 28, toSurah: 39, toAyah: 31 },
  { fromSurah: 39, fromAyah: 32, toSurah: 41, toAyah: 46 },
  { fromSurah: 41, fromAyah: 47, toSurah: 45, toAyah: 37 },
  { fromSurah: 46, fromAyah: 1, toSurah: 51, toAyah: 30 },
  { fromSurah: 51, fromAyah: 31, toSurah: 57, toAyah: 29 },
  { fromSurah: 58, fromAyah: 1, toSurah: 66, toAyah: 12 },
  { fromSurah: 67, fromAyah: 1, toSurah: 77, toAyah: 50 },
  { fromSurah: 78, fromAyah: 1, toSurah: 114, toAyah: 6 }
] as const;

const ARABIC_NUMERAL_MAP: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9"
};

const parseJuzBranchIndex = (branch?: string | null) => {
  const normalized = branch?.trim();
  if (!normalized) return null;

  if (normalized.includes("الثلاثون")) {
    return 30;
  }

  const westernDigits = normalized.replace(/[٠-٩]/g, (digit) => ARABIC_NUMERAL_MAP[digit] ?? digit);
  const matchedNumber = westernDigits.match(/\d+/)?.[0];
  if (!matchedNumber) return null;

  const parsed = Number(matchedNumber);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) return null;
  return parsed;
};

const getSurahName = (index?: number | null) => {
  if (!index || index < 1 || index > 114) return "";
  return getSurahLabel(index).replace(/^سورة\s+/, "");
};

const resolveAttemptRange = (attempt: ExamAttempt) => {
  if (attempt.examRange) return attempt.examRange;
  if (attempt.exam?.type === "FULL_QURAN") {
    return { fromSurah: 1, fromAyah: 1, toSurah: 114, toAyah: 6 };
  }
  if (attempt.exam?.type !== "JUZ") return null;

  const branchIndex = parseJuzBranchIndex(attempt.exam.examBranch);
  if (!branchIndex || branchIndex < 1 || branchIndex > JUZ_BOUNDARIES.length) return null;
  return JUZ_BOUNDARIES[branchIndex - 1];
};

const clamp = (value: number) => Math.max(0, Number.isFinite(value) ? Math.round(value) : 0);
const clampHalf = (value: number) => Math.max(0, Number.isFinite(value) ? Math.round(value * 2) / 2 : 0);
const clampQuestionCount = (
  value: number,
  policy: { minQuestionCount: number; maxQuestionCount: number }
) => Math.min(policy.maxQuestionCount, Math.max(policy.minQuestionCount, clamp(value)));
const dateFormatter = new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : dateFormatter.format(parsed);
};

const getStudentInitials = (name?: string) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] + (name[1] || "")).toUpperCase();
};

const toEvaluationQuestions = (attempt: ExamAttempt): EvaluationQuestion[] =>
  (attempt.questions ?? []).map((question) => ({
    id: question.id,
    orderIndex: question.orderIndex,
    fromSurah: question.fromSurah,
    fromAyah: question.fromAyah,
    toSurah: question.toSurah,
    toAyah: question.toAyah,
    prompting: clampHalf(question.promptingDeductions),
    reminding: clampHalf(question.remindingDeductions),
    tajweed: clampHalf(question.tajweedDeductions),
    evaluated: question.isEvaluated
  }));

const resolveDefaultScores = () => {
  return {
    memorization: 0,
    tajweed: 0,
    theoreticalTajweed: 0,
    performance: 0
  };
};

const buildCommitteeSummary = (attempt: ExamAttempt) =>
  (attempt.committeeMembers ?? [])
    .map((member) => `${member.user?.fullName ?? `#${member.userId}`} - ${COMMITTEE_ROLE_LABELS[member.committeeRole]}`)
    .join("، ");

const localizeStoredNote = (value?: string | null) => {
  const normalized = value?.trim();
  if (!normalized) {
    return "";
  }

  if (/^member evaluation saved$/i.test(normalized)) {
    return "تم حفظ ملاحظة عضو اللجنة.";
  }

  if (/^chair evaluation saved$/i.test(normalized)) {
    return "تم حفظ ملاحظة رئيس اللجنة.";
  }

  return normalized;
};

const resolveQuestionCountPolicy = (attempt: ExamAttempt) => ({
  minQuestionCount: attempt.exam?.criteria?.minQuestionCount ?? 1,
  defaultQuestionCount: attempt.exam?.criteria?.defaultQuestionCount ?? 5,
  maxQuestionCount: attempt.exam?.criteria?.maxQuestionCount ?? 10
});

const splitSelectedNotes = (value: string) =>
  value
    .split(/[،,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function ExamEvaluationWorkspace({ attempt, onClose, onUpdated }: Props) {
  const user = useAuthStore((state) => state.user);

  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt>(attempt);
  const [viewStep, setViewStep] = useState<ViewStep>("workspace");
  const [questions, setQuestions] = useState<EvaluationQuestion[]>(toEvaluationQuestions(attempt));
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isQuestionEvaluationOpen, setIsQuestionEvaluationOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPrintingCertificate, setIsPrintingCertificate] = useState(false);

  const defaults = useMemo(() => resolveDefaultScores(), []);
  const [theoreticalTajweedScore, setTheoreticalTajweedScore] = useState<number>(
    currentAttempt.breakdown?.theoreticalTajweedScore ?? defaults.theoreticalTajweed
  );
  const [performanceScore, setPerformanceScore] = useState<number>(
    currentAttempt.breakdown?.performanceScore ?? defaults.performance
  );
  const initialQuestionCountPolicy = resolveQuestionCountPolicy(currentAttempt);
  const [questionCount, setQuestionCount] = useState<number>(
    clampQuestionCount(
      currentAttempt.questions?.length || initialQuestionCountPolicy.defaultQuestionCount,
      initialQuestionCountPolicy
    )
  );
  const [committeeNotes, setCommitteeNotes] = useState<string>(currentAttempt.committeeNotes ?? "");
  const [strengthNotes, setStrengthNotes] = useState<string>(
    currentAttempt.breakdown?.strengthNotes ?? ""
  );
  const [weaknessNotes, setWeaknessNotes] = useState<string>(
    currentAttempt.breakdown?.weaknessNotes ?? ""
  );

  const generateQuestionsMutation = useGenerateAttemptQuestionsMutation();
  const createQuestionMutation = useCreateAttemptQuestionMutation();
  const deleteQuestionMutation = useDeleteAttemptQuestionMutation();
  const evaluateMutation = useEvaluateAttemptMutation();
  const finalizeMutation = useFinalizeAttemptEvaluationMutation();
  const publishMutation = usePublishAttemptMutation();
  const reopenMutation = useReopenAttemptForQuestionAdjustmentMutation();

  useEffect(() => {
    setCurrentAttempt(attempt);
    setQuestions(toEvaluationQuestions(attempt));
    const nextDefaults = resolveDefaultScores();
    setTheoreticalTajweedScore(
      attempt.breakdown?.theoreticalTajweedScore ?? nextDefaults.theoreticalTajweed
    );
    setPerformanceScore(attempt.breakdown?.performanceScore ?? nextDefaults.performance);
    const nextQuestionCountPolicy = resolveQuestionCountPolicy(attempt);
    setQuestionCount(
      clampQuestionCount(
        attempt.questions?.length || nextQuestionCountPolicy.defaultQuestionCount,
        nextQuestionCountPolicy
      )
    );
    setCommitteeNotes(attempt.committeeNotes ?? "");
    setStrengthNotes(attempt.breakdown?.strengthNotes ?? "");
    setWeaknessNotes(attempt.breakdown?.weaknessNotes ?? "");
    setViewStep("workspace");
    setSelectedQuestionId(null);
    setIsQuestionEvaluationOpen(false);
    setError("");
    setSuccess("");
  }, [attempt]);

  const selectedQuestion = useMemo(
    () => {
      const question = questions.find((item) => item.id === selectedQuestionId);
      if (!question) return null;

      return {
        id: question.id,
        orderIndex: question.orderIndex,
        fromSurah: question.fromSurah,
        fromAyah: question.fromAyah,
        toSurah: question.toSurah,
        toAyah: question.toAyah,
        promptingDeductions: question.prompting,
        remindingDeductions: question.reminding,
        tajweedDeductions: question.tajweed,
        isEvaluated: Boolean(question.evaluated)
      };
    },
    [questions, selectedQuestionId]
  );

  const deductions = useMemo(
    () => ({
      prompting: questions.reduce((sum, question) => sum + question.prompting, 0),
      reminding: questions.reduce((sum, question) => sum + question.reminding, 0),
      tajweed: questions.reduce((sum, question) => sum + question.tajweed, 0)
    }),
    [questions]
  );

  const baseScore = currentAttempt.exam?.maxScore ?? 100;
  const scoreDeductions = theoreticalTajweedScore + performanceScore;
  const finalScore = Math.max(
    0,
    Math.min(
      currentAttempt.exam?.maxScore ?? 100,
      baseScore - scoreDeductions - deductions.prompting - deductions.reminding - deductions.tajweed
    )
  );
  const passScore = currentAttempt.exam?.passScore ?? 0;
  const isPass = finalScore >= passScore;

  const myMembership =
    currentAttempt.committeeMembers?.find((member) => member.userId === user?.id) ?? null;
  const canGenerateQuestions =
    ["SCHEDULED", "IN_PROGRESS"].includes(currentAttempt.status) &&
    (user?.role === "CENTER_ADMIN" ||
      (myMembership?.committeeRole === "CHAIR" &&
        (user?.role === "TEACHER" || user?.role === "SUPERVISOR")));

  const canEditQuestionPool = Boolean(
    myMembership &&
      myMembership.committeeRole === "CHAIR" &&
      ["SCHEDULED", "IN_PROGRESS"].includes(currentAttempt.status)
  );
  const canEvaluate = Boolean(
    myMembership && ["SCHEDULED", "IN_PROGRESS"].includes(currentAttempt.status)
  );
  const canFinalize =
    Boolean(myMembership && myMembership.committeeRole === "CHAIR") &&
    ["SCHEDULED", "IN_PROGRESS"].includes(currentAttempt.status) &&
    questions.length > 0 &&
    questions.every((question) => question.evaluated);
  const canPublish =
    user?.role === "CENTER_ADMIN" && ["EVALUATED", "APPROVED"].includes(currentAttempt.status);
  const canReopen =
    user?.role === "CENTER_ADMIN" &&
    currentAttempt.status !== "PUBLISHED" &&
    currentAttempt.status !== "CANCELLED";
  const canPrintCertificate =
    (currentAttempt.status === "APPROVED" || currentAttempt.status === "PUBLISHED") &&
    currentAttempt.totalScore !== null &&
    currentAttempt.totalScore >= passScore;

  const isReadOnlyView = !(
    canGenerateQuestions ||
    canEditQuestionPool ||
    canEvaluate ||
    canFinalize ||
    canPublish ||
    canReopen
  );

  const committeeSummary = buildCommitteeSummary(currentAttempt) || "لم تعتمد اللجنة بعد";
  const evaluatedQuestionsCount = questions.filter((question) => question.evaluated).length;
  const questionDeductions = deductions.prompting + deductions.reminding + deductions.tajweed;
  const totalDeductions = questionDeductions + scoreDeductions;
  const questionCountPolicy = resolveQuestionCountPolicy(currentAttempt);
  const evaluationCriteria = currentAttempt.exam?.criteria ?? null;
  const currentExamRange = resolveAttemptRange(currentAttempt);

  const toggleSelectedNote = (
    value: string,
    currentValue: string,
    setter: (nextValue: string) => void
  ) => {
    const values = splitSelectedNotes(currentValue);
    const nextValues = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
    setter(nextValues.join("، "));
  };

  const openSelectedQuestionEvaluation = () => {
    if (!selectedQuestionId) return;
    setIsQuestionEvaluationOpen(true);
  };

  const handleDeleteSelectedQuestion = () => {
    if (!selectedQuestionId) return;
    void withMutation(
      () =>
        deleteQuestionMutation.mutateAsync({
          attemptId: currentAttempt.id,
          questionId: selectedQuestionId
        }),
      "تم حذف السؤال من المحاولة."
    );
    setSelectedQuestionId(null);
  };

  const syncAttempt = (nextAttempt: ExamAttempt) => {
    setCurrentAttempt(nextAttempt);
    setQuestions(toEvaluationQuestions(nextAttempt));
    const nextQuestionCountPolicy = resolveQuestionCountPolicy(nextAttempt);
    setQuestionCount(
      clampQuestionCount(
        nextAttempt.questions?.length || nextQuestionCountPolicy.defaultQuestionCount,
        nextQuestionCountPolicy
      )
    );
    setCommitteeNotes(nextAttempt.committeeNotes ?? "");
    setStrengthNotes(nextAttempt.breakdown?.strengthNotes ?? "");
    setWeaknessNotes(nextAttempt.breakdown?.weaknessNotes ?? "");
    onUpdated?.(nextAttempt);
  };

  const withMutation = async (action: () => Promise<ExamAttempt>, successMessage: string) => {
    setError("");
    setSuccess("");

    try {
      const nextAttempt = await action();
      syncAttempt(nextAttempt);
      setSuccess(successMessage);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error && mutationError.message
          ? mutationError.message
          : "تعذر تنفيذ الإجراء المطلوب. حاول مرة أخرى."
      );
    }
  };

  const handleGenerateQuestions = () => {
    void withMutation(
      () =>
        generateQuestionsMutation.mutateAsync({
          attemptId: currentAttempt.id,
          payload: { count: questionCount }
        }),
      "تم توليد الأسئلة وربطها بالمحاولة."
    );
  };

  const handleManualQuestion = (payload: {
    fromSurah: number;
    fromAyah: number;
    toSurah: number;
    toAyah: number;
  }) => {
    void withMutation(
      () => createQuestionMutation.mutateAsync({ attemptId: currentAttempt.id, payload }),
      "تمت إضافة السؤال اليدوي بنجاح."
    );

    setManualModalOpen(false);
  };

  const handleConfirmQuestionEvaluation = (payload: {
    id: number;
    promptingDeductions: number;
    remindingDeductions: number;
    tajweedDeductions: number;
    isEvaluated: boolean;
  }) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === payload.id
          ? {
              ...question,
              prompting: clampHalf(payload.promptingDeductions),
              reminding: clampHalf(payload.remindingDeductions),
              tajweed: clampHalf(payload.tajweedDeductions),
              evaluated: payload.isEvaluated
            }
          : question
      )
    );
    setIsQuestionEvaluationOpen(false);
  };

  const handleSaveEvaluation = async (payload: EvaluateAttemptPayload) => {
    await withMutation(
      () => evaluateMutation.mutateAsync({ attemptId: currentAttempt.id, payload }),
      "تم حفظ التقييم بنجاح."
    );
    setViewStep("workspace");
  };

  const handleFinalize = () => {
    void withMutation(
      () => finalizeMutation.mutateAsync(currentAttempt.id),
      "تم إغلاق التقييم واعتماد المحاولة تلقائيا."
    );
  };

  const handlePublish = () => {
    void withMutation(() => publishMutation.mutateAsync(currentAttempt.id), "تم نشر النتيجة.");
  };

  const handleReopen = () => {
    const reason = window.prompt("اذكر سبب إعادة فتح المحاولة", "الحاجة إلى تعديل الأسئلة أو المراجعة");
    if (!reason?.trim()) {
      return;
    }

    void withMutation(
      () =>
        reopenMutation.mutateAsync({
          attemptId: currentAttempt.id,
          payload: { reason: reason.trim() }
        }),
      "تمت إعادة فتح المحاولة لتعديل الأسئلة."
    );
  };

  const handlePrintCertificate = async () => {
    if (!canPrintCertificate) {
      setError("لا تتاح الشهادة إلا بعد نجاح المحاولة واعتمادها أو نشرها.");
      return;
    }

    setError("");
    setSuccess("");
    setIsPrintingCertificate(true);
    let printWindow: Window | null = null;
    try {
      printWindow = openCertificatePrintWindow();
      const certificate = await certificatesApi.getExamAttemptCertificate(currentAttempt.id);
      writeCertificateToWindow(printWindow, certificate);
      setSuccess("تم تجهيز شهادة الاختبار للطباعة.");
    } catch (printError) {
      printWindow?.close();
      setError(
        getLocalizedApiErrorMessage(printError, {
          ar: true,
          fallback: "تعذر تجهيز شهادة الاختبار للطباعة."
        })
      );
    } finally {
      setIsPrintingCertificate(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={currentAttempt.exam?.title ?? "تفاصيل الاختبار"}
      size={isReadOnlyView ? "lg" : "xl"}
      hideFooter
      panelClassName={`ew-modal ${isReadOnlyView ? "ew-modal--compact" : "ew-modal--workspace"}`}
    >
      <div className="exam-evaluation" dir="rtl">
        {error && <div className="modal-error"><AlertCircle size={16} /><span>{error}</span></div>}
        {success && <div className="exam-evaluation__success"><CheckCircle2 size={16} /><span>{success}</span></div>}

        {/* Unified Compact Header */}
        <div className="ew-header-compact">
          <div className="ew-header-left">
            <div className="ew-header-avatar">
              {getStudentInitials(currentAttempt.student?.fullName)}
            </div>
            <div className="ew-header-info">
              <h2>{currentAttempt.student?.fullName ?? "—"}</h2>
              <p>
                <BookOpen size={13} />
                <span>{currentAttempt.exam?.title ?? "—"}</span>
                <span style={{ margin: '0 0.35rem', opacity: 0.4 }}>•</span>
                <Badge variant={ATTEMPT_STATUS_VARIANTS[currentAttempt.status]} size="sm" className="text-[0.62rem]">
                  {ATTEMPT_STATUS_LABELS[currentAttempt.status]}
                </Badge>
              </p>
            </div>
          </div>
          <div className="ew-header-right">
            <div className="ew-score-badge">
              <span className="val">{currentAttempt.totalScore ?? finalScore}</span>
              <span className="lbl">النتيجة النهائية</span>
            </div>
            <div className="ew-score-badge">
              <span className="val" style={{ color: isPass ? 'var(--success)' : 'var(--error)', fontSize: '1.2rem' }}>
                {currentAttempt.gradeLabel ?? (isPass ? "ناجح" : "لم يجتز")}
              </span>
              <span className="lbl">التقدير العام</span>
            </div>
          </div>
        </div>

        {viewStep === "review" ? (
          <ExamCertificationScreen
            exam={{
              title: currentAttempt.exam?.title ?? "الاختبار",
              maxScore: currentAttempt.exam?.maxScore ?? 100,
              passScore: currentAttempt.exam?.passScore ?? 0
            }}
            attempt={currentAttempt}
            scores={{
              memorization: 0,
              tajweed: 0,
              theoreticalTajweed: theoreticalTajweedScore,
              performance: performanceScore
            }}
            deductions={deductions}
            questions={questions}
            committeeNotes={committeeNotes}
            strengthNotes={strengthNotes}
            weaknessNotes={weaknessNotes}
            onCommitteeNotesChange={setCommitteeNotes}
            onStrengthNotesChange={setStrengthNotes}
            onWeaknessNotesChange={setWeaknessNotes}
            onBackToWorkspace={() => setViewStep("workspace")}
            onSubmit={handleSaveEvaluation}
            isSubmitting={evaluateMutation.isPending}
          />
        ) : isReadOnlyView ? (
          <div className="exam-evaluation-view">
            {/* Matrix Stats */}
            <div className="ew-result-grid" style={{ marginTop: '0.5rem' }}>
              <div className="ew-result-card">
                <label>درجة التجويد النظري</label>
                <strong>{currentAttempt.breakdown?.theoreticalTajweedScore ?? "—"}</strong>
              </div>
              <div className="ew-result-card">
                <label>الأداء العام</label>
                <strong>{currentAttempt.breakdown?.performanceScore ?? "—"}</strong>
              </div>
              <div className="ew-result-card highlight">
                <label>إجمالي الخصومات</label>
                <strong style={{ color: 'var(--error)' }}>{totalDeductions}</strong>
              </div>
            </div>

            {/* Context & Committee */}
            <div className="ew-info-grid" style={{ marginTop: '1rem' }}>
              <div className="ew-section">
                <div className="ew-section-title">
                  <MapPin size={15} />
                  <h4>بيانات الاختبار</h4>
                </div>
                <div className="ew-info-grid" style={{ gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                  <div className="ew-info-item">
                    <div className="ew-info-icon"><Calendar size={13} /></div>
                    <div className="ew-info-text">
                      <label>تاريخ الاختبار</label>
                      <span>{formatDate(currentAttempt.examDate ?? currentAttempt.createdAt)}</span>
                    </div>
                  </div>
                  <div className="ew-info-item">
                    <div className="ew-info-icon"><User size={13} /></div>
                    <div className="ew-info-text">
                      <label>المركز والحلقة</label>
                      <span>{currentAttempt.circle?.center?.name} / {currentAttempt.circle?.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ew-section">
                <div className="ew-section-title">
                  <ShieldCheck size={15} />
                  <h4>لجنة التقييم</h4>
                </div>
                <div className="ew-info-item">
                  <div className="ew-info-text">
                    <label>الأعضاء</label>
                    <span style={{ fontSize: '0.78rem' }}>{committeeSummary}</span>
                  </div>
                </div>
                {currentAttempt.breakdown?.strengthNotes ? (
                  <div className="ew-notes-card ew-notes-card--soft">
                    <strong>جوانب التميز</strong>
                    <p>{currentAttempt.breakdown.strengthNotes}</p>
                  </div>
                ) : null}
                {currentAttempt.breakdown?.weaknessNotes ? (
                  <div className="ew-notes-card ew-notes-card--soft">
                    <strong>جوانب القصور</strong>
                    <p>{currentAttempt.breakdown.weaknessNotes}</p>
                  </div>
                ) : null}
                {currentAttempt.committeeNotes ? (
                  <div className="ew-notes-card">
                    <strong>الملاحظات النهائية</strong>
                    <p>{localizeStoredNote(currentAttempt.committeeNotes)}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Detailed Questions Table */}
            <div className="ew-section" style={{ marginTop: '1rem' }}>
              <div className="ew-section-title">
                <FileText size={15} />
                <h4>نطاق الأسئلة والخصومات</h4>
              </div>
              <table className="ew-mistakes-table">
                <thead>
                  <tr>
                    <th>السؤال</th>
                    <th>تلقين</th>
                    <th>تنبيه</th>
                    <th>تجويد</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id} className="ew-mistakes-row">
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        {getSurahName(q.fromSurah)} {q.fromAyah} - {getSurahName(q.toSurah)} {q.toAyah}
                      </td>
                      <td>{q.prompting}</td>
                      <td>{q.reminding}</td>
                      <td>{q.tajweed}</td>
                      <td style={{ color: 'var(--error)' }}>{q.prompting + q.reminding + q.tajweed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ew-footer-actions" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <Button variant="ghost" onClick={onClose} style={{ fontSize: '0.8rem' }}>إغلاق</Button>
              {canPrintCertificate && (
                <Button
                  variant="primary"
                  leftIcon={<Printer size={15} />}
                  onClick={() => void handlePrintCertificate()}
                  isLoading={isPrintingCertificate}
                  style={{ fontSize: '0.8rem' }}
                >
                  طباعة الشهادة
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ① بيانات الاختبار */}
            <div className="ew-section-block">
              <div className="ew-section-title-bar">
                <h3><span className="section-num">①</span> بيانات الاختبار</h3>
                <span className="section-sub">{ATTEMPT_STATUS_LABELS[currentAttempt.status]}</span>
              </div>
              <div className="ew-section-body">
                {currentExamRange ? (
                  <div className="ew-exam-info-grid">
                    <div className="ew-info-chip ew-info-chip--range">
                      <label>من سورة</label>
                      <span>{getSurahName(currentExamRange?.fromSurah) || `سورة ${currentExamRange?.fromSurah ?? "—"}`}</span>
                      <small>آية {currentExamRange?.fromAyah ?? "—"}</small>
                    </div>
                    <div className="ew-info-chip ew-info-chip--range">
                      <label>إلى سورة</label>
                      <span>{getSurahName(currentExamRange?.toSurah) || `سورة ${currentExamRange?.toSurah ?? "—"}`}</span>
                      <small>آية {currentExamRange?.toAyah ?? "—"}</small>
                    </div>
                  </div>
                ) : (
                  <div className="eval-range-banner eval-range-banner--compact">
                    <div className="eval-range-banner__copy">
                      <span>نطاق القالب</span>
                      <strong>غير مرتبط بنطاق سور صريح</strong>
                      <small>
                        الربط الحالي يعمل فقط لقوالب `JUZ` عبر `examBranch` أو `FULL_QURAN` بالنطاق الكامل.
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ② أسئلة الاختبار */}
            <div className="ew-section-block ew-section-block--accent">
              <div className="ew-section-title-bar">
                <h3><span className="section-num">②</span> أسئلة الاختبار</h3>
                <span className="section-sub">{questions.length} سؤال • {evaluatedQuestionsCount} مقيّم</span>
              </div>
              {/* شريط الإجراءات */}
              <div className="ew-questions-action-bar">
                {canGenerateQuestions ? (
                  <>
                    <div className="ew-question-count-control">
                      <label>عدد الأسئلة</label>
                      <div className="ew-count-stepper">
                        <button type="button" aria-label="تقليل" onClick={() => setQuestionCount(c => clampQuestionCount(c - 1, questionCountPolicy))} disabled={questionCount <= questionCountPolicy.minQuestionCount}><Minus size={12} /></button>
                        <strong>{questionCount}</strong>
                        <button type="button" aria-label="زيادة" onClick={() => setQuestionCount(c => clampQuestionCount(c + 1, questionCountPolicy))} disabled={questionCount >= questionCountPolicy.maxQuestionCount}><Plus size={12} /></button>
                      </div>
                    </div>
                    <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={handleGenerateQuestions} isLoading={generateQuestionsMutation.isPending}>
                      توليد الأسئلة
                    </Button>
                  </>
                ) : null}
                {canEditQuestionPool ? (
                  <Button variant="ghost" leftIcon={<Plus size={14} />} onClick={() => setManualModalOpen(true)}>
                    إضافة
                  </Button>
                ) : null}
                {canEvaluate ? (
                  <Button
                    variant="ghost"
                    leftIcon={<PencilLine size={14} />}
                    onClick={openSelectedQuestionEvaluation}
                    disabled={!selectedQuestionId}
                  >
                    تقييم
                  </Button>
                ) : null}
                {canEditQuestionPool ? (
                  <Button
                    variant="ghost"
                    onClick={handleDeleteSelectedQuestion}
                    disabled={!selectedQuestionId || deleteQuestionMutation.isPending}
                  >
                    حذف
                  </Button>
                ) : null}
              </div>

              {/* جدول الأسئلة */}
              {!questions.length ? (
                <div className="ew-empty-questions">
                  <FileText size={32} />
                  <p>لا توجد أسئلة بعد.</p>
                  <small>{canGenerateQuestions ? "قم بتوليد الأسئلة أو إضافتها يدويًا." : "لم توزع أسئلة على هذه المحاولة."}</small>
                </div>
              ) : (
                <div className="eval-question-table-wrap">
                  <table className="eval-question-table eval-question-table--workspace">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>من سورة</th>
                        <th>من آية</th>
                        <th>إلى سورة</th>
                        <th>إلى آية</th>
                        <th>مقدار الخصم</th>
                      </tr>
                    </thead>
                    <tbody>
                  {questions.map((question) => {
                    const total = question.prompting + question.reminding + question.tajweed;
                    const isSelected = selectedQuestionId === question.id;
                    return (
                      <tr
                        key={question.id}
                        className={`eval-question-row${isSelected ? ' eval-question-row--selected' : ''}`}
                        onClick={() => setSelectedQuestionId(isSelected ? null : question.id)}
                      >
                        <td>{question.orderIndex}</td>
                        <td>{getSurahName(question.fromSurah)}</td>
                        <td>{question.fromAyah}</td>
                        <td>{getSurahName(question.toSurah)}</td>
                        <td>{question.toAyah}</td>
                        <td>
                          <span className={`q-deduct${total === 0 ? ' q-deduct--zero' : ''}`}>{total === 0 ? '—' : total}</span>
                        </td>
                      </tr>
                    );
                  })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ③ الدرجات والملاحظات */}
            <div className="ew-section-block">
              <div className="ew-section-title-bar">
                <h3><span className="section-num">③</span> الدرجات والملاحظات</h3>
                <span className="section-sub">تستخدم عند الحفظ النهائي</span>
              </div>
              <div className="ew-section-body">
                <div className="ew-scores-grid">
                  <div className="ew-score-field">
                    <label>درجة التجويد النظري <small>الحد الأعلى: {currentAttempt.exam?.criteria?.theoreticalTajweedScore ?? '—'}</small></label>
                    <input type="number" min={0} step={0.5} value={theoreticalTajweedScore} onChange={e => setTheoreticalTajweedScore(clampHalf(Number(e.target.value)))} disabled={!canEvaluate} />
                  </div>
                  <div className="ew-score-field">
                    <label>درجة الأداء <small>الحد الأعلى: {currentAttempt.exam?.criteria?.performanceScore ?? '—'}</small></label>
                    <input type="number" min={0} step={0.5} value={performanceScore} onChange={e => setPerformanceScore(clampHalf(Number(e.target.value)))} disabled={!canEvaluate} />
                  </div>
                </div>
                <div className="ew-notes-grid">
                  <div className="ew-notes-field ew-notes-field--strength">
                    <label>جوانب التميز</label>
                    <details className="ew-multi-select">
                      <summary>{strengthNotes || "اختر جوانب التميز"}</summary>
                      <div className="ew-multi-select__menu">
                        {STRENGTH_OPTIONS.map((option) => (
                          <label key={option}>
                            <input
                              type="checkbox"
                              checked={splitSelectedNotes(strengthNotes).includes(option)}
                              onChange={() => toggleSelectedNote(option, strengthNotes, setStrengthNotes)}
                              disabled={!canEvaluate}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </details>
                  </div>
                  <div className="ew-notes-field ew-notes-field--weakness">
                    <label>جوانب القصور</label>
                    <details className="ew-multi-select">
                      <summary>{weaknessNotes || "اختر جوانب القصور"}</summary>
                      <div className="ew-multi-select__menu">
                        {WEAKNESS_OPTIONS.map((option) => (
                          <label key={option}>
                            <input
                              type="checkbox"
                              checked={splitSelectedNotes(weaknessNotes).includes(option)}
                              onChange={() => toggleSelectedNote(option, weaknessNotes, setWeaknessNotes)}
                              disabled={!canEvaluate}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
                <div className="ew-final-notes-field">
                  <label>الملاحظات الختامية للجنة</label>
                  <textarea rows={3} value={committeeNotes} onChange={e => setCommitteeNotes(e.target.value)} disabled={!canEvaluate} placeholder="الخلاصة النهائية المعتمدة للجنة..." />
                </div>
              </div>

              {/* ملخص الدرجات */}
              <div className="ew-score-summary-bar">
                <div className="ew-summary-chip ew-summary-chip--warning">
                  <label>خصم الدرجات</label>
                  <strong>{scoreDeductions}</strong>
                </div>
                <div className="ew-summary-chip ew-summary-chip--warning ew-summary-chip--stacked">
                  <label>خصومات الأسئلة</label>
                  <div className="ew-inline-deductions">
                    <span>تلقين: <strong>{deductions.prompting}</strong></span>
                    <span>تنبيه: <strong>{deductions.reminding}</strong></span>
                    <span>تجويد: <strong>{deductions.tajweed}</strong></span>
                    <span>الإجمالي: <strong>{questionDeductions}</strong></span>
                  </div>
                </div>
                <div className="ew-summary-chip ew-summary-chip--highlight">
                  <label>النتيجة الحالية</label>
                  <strong>{finalScore} / {currentAttempt.exam?.maxScore ?? 100}</strong>
                </div>
                <div className={`ew-summary-chip ${isPass ? 'ew-summary-chip--success' : 'ew-summary-chip--warning'}`}>
                  <label>حالة الاجتياز</label>
                  <strong>{isPass ? "مجتاز ✓" : "غير مجتاز"}</strong>
                </div>
              </div>
            </div>

            {/* ④ شريط الحالة والأزرار */}
            <div className="ew-status-bar">
              <span><ShieldCheck size={13} /> {ATTEMPT_STATUS_LABELS[currentAttempt.status]}</span>
              <span><Eye size={13} /> الأسئلة: {questions.length}</span>
              <span><FileCheck2 size={13} /> المقيّم: {evaluatedQuestionsCount}</span>
            </div>

            <div className="ew-footer-actions">
              <div className="spacer" />
              {canReopen ? (
                <Button variant="ghost" onClick={handleReopen} isLoading={reopenMutation.isPending}>إعادة فتح</Button>
              ) : null}
              {canPublish ? (
                <Button variant="secondary" onClick={handlePublish} isLoading={publishMutation.isPending}>نشر النتيجة</Button>
              ) : null}
              {canPrintCertificate ? (
                <Button
                  variant="ghost"
                  leftIcon={<Printer size={15} />}
                  onClick={() => void handlePrintCertificate()}
                  isLoading={isPrintingCertificate}
                >
                  طباعة الشهادة
                </Button>
              ) : null}
              {canFinalize ? (
                <Button variant="secondary" onClick={handleFinalize} isLoading={finalizeMutation.isPending}>إغلاق التقييم</Button>
              ) : null}
              {viewStep === "workspace" && canEvaluate ? (
                <Button variant="primary" onClick={() => setViewStep("review")}>
                  مراجعة وحفظ التقييم
                </Button>
              ) : null}
              <Button variant="ghost" onClick={onClose}>إغلاق</Button>
            </div>
          </>
        )}

        <QuestionEvaluationModal
          isOpen={isQuestionEvaluationOpen && Boolean(selectedQuestion)}
          question={selectedQuestion}
          canEdit={canEvaluate}
          criteria={evaluationCriteria}
          onClose={() => setIsQuestionEvaluationOpen(false)}
          onConfirm={handleConfirmQuestionEvaluation}
        />

        <ManualAttemptQuestionModal
          isOpen={manualModalOpen}
          examRange={currentExamRange ?? null}
          isSubmitting={createQuestionMutation.isPending}
          onClose={() => setManualModalOpen(false)}
          onSubmit={handleManualQuestion}
        />
      </div>
    </Modal>
  );
}

