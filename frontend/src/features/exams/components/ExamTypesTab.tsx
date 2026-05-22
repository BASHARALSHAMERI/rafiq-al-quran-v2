import { useMemo, useState } from "react";
import { AlertCircle, BookOpen, Edit2, Plus, Rocket, Trash2, FileText, Layout, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import Modal from "../../../components/ui/Modal";
import {
  useCreateExamMutation,
  useDeleteExamMutation,
  useExamsQuery,
  usePublishExamMutation,
  useUpdateExamMutation
} from "../exams.hooks";
import {
  EXAM_STATUS_LABELS,
  EXAM_TYPE_LABELS,
  EXAM_TYPE_OPTIONS,
  JUZ_BRANCH_OPTIONS
} from "../constants/exam-templates";
import type {
  ExamCriteriaPayload,
  ExamListItem,
  SupportedExamTemplateType
} from "../types";
import "../../../styles/features/exam-types.css";

type FormState = {
  title: string;
  type: SupportedExamTemplateType;
  examBranch: string;
  maxScore: number;
  passScore: number;
  memorizationScore: number;
  tajweedScore: number;
  theoreticalTajweedScore: number;
  performanceScore: number;
  promptingPenalty: number;
  remindingPenalty: number;
  tajweedPenalty: number;
  minQuestionCount: number;
  defaultQuestionCount: number;
  maxQuestionCount: number;
};

const emptyForm = (): FormState => ({
  title: "",
  type: "JUZ",
  examBranch: JUZ_BRANCH_OPTIONS[0],
  maxScore: 100,
  passScore: 70,
  memorizationScore: 60,
  tajweedScore: 20,
  theoreticalTajweedScore: 10,
  performanceScore: 10,
  promptingPenalty: 1,
  remindingPenalty: 1,
  tajweedPenalty: 1,
  minQuestionCount: 1,
  defaultQuestionCount: 5,
  maxQuestionCount: 10
});

const toFormState = (exam: ExamListItem): FormState => ({
  title: exam.title,
  type: exam.type === "FULL_QURAN" ? "FULL_QURAN" : "JUZ",
  examBranch:
    exam.type === "JUZ"
      ? exam.examBranch?.trim() || JUZ_BRANCH_OPTIONS[0]
      : JUZ_BRANCH_OPTIONS[0],
  maxScore: exam.maxScore,
  passScore: exam.passScore,
  memorizationScore: exam.criteria?.memorizationScore ?? 60,
  tajweedScore: exam.criteria?.tajweedScore ?? 20,
  theoreticalTajweedScore: exam.criteria?.theoreticalTajweedScore ?? 10,
  performanceScore: exam.criteria?.performanceScore ?? 10,
  promptingPenalty: exam.criteria?.promptingPenalty ?? 1,
  remindingPenalty: exam.criteria?.remindingPenalty ?? 1,
  tajweedPenalty: exam.criteria?.tajweedPenalty ?? 1,
  minQuestionCount: exam.criteria?.minQuestionCount ?? 1,
  defaultQuestionCount: exam.criteria?.defaultQuestionCount ?? 5,
  maxQuestionCount: exam.criteria?.maxQuestionCount ?? 10
});

const criteriaTotal = (form: FormState) =>
  form.memorizationScore +
  form.tajweedScore +
  form.theoreticalTajweedScore +
  form.performanceScore;

const tableStatusVariant = (status: string) => {
  if (status === "PUBLISHED") {
    return "success";
  }

  if (status === "DRAFT") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "error";
  }

  return "secondary";
};

export function ExamTypesTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const examsQuery = useExamsQuery({}, true);
  const createMutation = useCreateExamMutation();
  const updateMutation = useUpdateExamMutation();
  const deleteMutation = useDeleteExamMutation();
  const publishMutation = usePublishExamMutation();

  const allExams = useMemo(() => examsQuery.data ?? [], [examsQuery.data]);

  const filteredExams = useMemo(() => {
    if (!search.trim()) return allExams;
    const lower = search.toLowerCase();
    return allExams.filter(e =>
      e.title.toLowerCase().includes(lower) ||
      EXAM_TYPE_LABELS[e.type].toLowerCase().includes(lower)
    );
  }, [allExams, search]);

  const totalPages = Math.ceil(filteredExams.length / pageSize);
  const paginatedExams = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExams.slice(start, start + pageSize);
  }, [filteredExams, page, pageSize]);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingExam, setEditingExam] = useState<ExamListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExamListItem | null>(null);
  const [formError, setFormError] = useState("");
  const [publishError, setPublishError] = useState("");

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    publishMutation.isPending;

  const summary = useMemo(() => {
    const total = allExams.length;
    const published = allExams.filter(e => e.status === "PUBLISHED").length;
    const draft = total - published;
    return { total, published, draft };
  }, [allExams]);

  const currentCriteriaTotal = criteriaTotal(form);
  const branchRequired = form.type === "JUZ";

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setEditingExam(null);
    setForm(emptyForm());
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (exam: ExamListItem) => {
    setEditingExam(exam);
    setForm(toFormState(exam));
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isPending) {
      return;
    }

    setIsModalOpen(false);
    setEditingExam(null);
    setFormError("");
  };

  const buildCriteria = (): ExamCriteriaPayload => ({
    memorizationScore: form.memorizationScore,
    tajweedScore: form.tajweedScore,
    theoreticalTajweedScore: form.theoreticalTajweedScore,
    performanceScore: form.performanceScore,
    promptingPenalty: form.promptingPenalty,
    remindingPenalty: form.remindingPenalty,
    tajweedPenalty: form.tajweedPenalty,
    minQuestionCount: form.minQuestionCount,
    defaultQuestionCount: form.defaultQuestionCount,
    maxQuestionCount: form.maxQuestionCount
  });

  const validateForm = () => {
    if (!form.title.trim()) {
      return "يرجى إدخال اسم واضح للاختبار.";
    }

    if (branchRequired && !form.examBranch.trim()) {
      return "يرجى تحديد فرع الاختبار عند اختيار اختبار الأجزاء.";
    }

    if (form.passScore > form.maxScore) {
      return "علامة النجاح لا يمكن أن تتجاوز الدرجة العظمى.";
    }

    if (currentCriteriaTotal !== form.maxScore) {
      return `مجموع درجات المعايير (${currentCriteriaTotal}) يجب أن يساوي الدرجة العظمى (${form.maxScore}).`;
    }

    const questionCountValues = [
      form.minQuestionCount,
      form.defaultQuestionCount,
      form.maxQuestionCount
    ];

    if (
      questionCountValues.some(
        (value) => !Number.isInteger(value) || value < 1 || value > 20
      )
    ) {
      return "سياسة عدد الأسئلة يجب أن تكون أعدادًا صحيحة بين 1 و20.";
    }

    if (form.minQuestionCount > form.defaultQuestionCount) {
      return "العدد الافتراضي للأسئلة يجب أن يكون أكبر من أو يساوي الحد الأدنى.";
    }

    if (form.defaultQuestionCount > form.maxQuestionCount) {
      return "العدد الافتراضي للأسئلة يجب أن يكون أقل من أو يساوي الحد الأعلى.";
    }

    return "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      examBranch: form.type === "JUZ" ? form.examBranch : null,
      maxScore: form.maxScore,
      passScore: form.passScore,
      criteria: buildCriteria()
    } as const;

    try {
      if (editingExam) {
        await updateMutation.mutateAsync({
          examId: editingExam.id,
          payload
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      closeModal();
    } catch (error) {
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : "تعذر حفظ قالب الاختبار. حاول مرة أخرى."
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setFormError(
        error instanceof Error && error.message ? error.message : "تعذر حذف قالب الاختبار."
      );
    }
  };

  const handlePublish = async (exam: ExamListItem) => {
    try {
      setPublishError("");
      await publishMutation.mutateAsync(exam.id);
    } catch (error) {
      setPublishError(
        error instanceof Error && error.message ? error.message : "تعذر نشر قالب الاختبار."
      );
    }
  };

  return (
    <div className="exam-types-tab" dir="rtl">
      <div className="exam-bank-controls">
        <div className="exam-bank-search-group">
          <div className="eb-search-wrap">
            <Search className="eb-search-icon" size={16} />
            <input
              className="eb-search-input"
              style={{ fontSize: '0.75rem' }}
              placeholder="ابحث عن قالب اختبار..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="exam-bank-stats">
            <div className="eb-stat-pill" style={{ fontSize: '0.68rem' }}>قوالب: <strong>{summary.total}</strong></div>
            <div className="eb-stat-pill" style={{ fontSize: '0.68rem' }}>منشورة: <strong>{summary.published}</strong></div>
          </div>
        </div>

        <div className="exam-bank-actions">
          <Button variant="primary" className="eb-action-btn" leftIcon={<Plus size={16} />} onClick={openCreate}>
            إضافة قالب
          </Button>
        </div>
      </div>

      {publishError && (
        <div className="grade-scales-alert grade-scales-alert--error" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={14} />
          <span style={{ fontSize: '0.75rem' }}>{publishError}</span>
        </div>
      )}

      <div className="exam-types-tab__workspace">
        {examsQuery.isLoading ? (
          <div className="grade-scales-loading" style={{ fontSize: '0.8rem' }}>جارٍ تحميل القوالب...</div>
        ) : filteredExams.length === 0 ? (
          <div className="et-empty">
            <BookOpen size={40} className="et-empty-icon" />
            <p style={{ fontSize: '0.85rem' }}>لا توجد قوالب اختبارات معرفة حالياً.</p>
            <Button variant="secondary" size="sm" onClick={openCreate}>إنشاء أول قالب</Button>
          </div>
        ) : (
          <>
            <div className="exam-types-list">
              {paginatedExams.map((exam) => (
                <div key={exam.id} className="exam-type-row">
                  <div className="et-row-right">
                    <div className="et-icon-box" style={{ 
                      width: '36px', height: '36px',
                      background: exam.status === 'PUBLISHED' ? 'var(--primary)' : 'var(--text-muted)' 
                    }}>
                      {exam.type === 'FULL_QURAN' ? <Layout size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="et-info">
                      <strong className="et-title" style={{ fontSize: '0.88rem' }}>{exam.title}</strong>
                      <div className="et-badges">
                        <Badge variant="secondary" size="sm" className="text-[0.6rem]">{EXAM_TYPE_LABELS[exam.type]}</Badge>
                        {exam.examBranch && <Badge variant="info" size="sm" className="text-[0.6rem]">{exam.examBranch}</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="et-row-center" style={{ gap: '1.5rem' }}>
                    <div className="et-score-item">
                      <span>العظمى</span>
                      <strong style={{ fontSize: '0.85rem' }}>{exam.maxScore}</strong>
                    </div>
                    <div className="et-score-item">
                      <span>النجاح</span>
                      <strong style={{ fontSize: '0.85rem' }}>{exam.passScore}</strong>
                    </div>
                    <div className="et-score-item">
                      <span>الحالة</span>
                      <Badge variant={tableStatusVariant(exam.status)} size="sm" className="text-[0.6rem]">
                        {EXAM_STATUS_LABELS[exam.status]}
                      </Badge>
                    </div>
                  </div>

                  <div className="et-row-left" style={{ gap: '1.25rem' }}>
                    <div className="et-attempts">
                      <strong style={{ fontSize: '0.9rem' }}>{exam._count?.attempts ?? 0}</strong>
                      <span style={{ fontSize: '0.6rem' }}>محاولة</span>
                    </div>
                    <div className="et-actions">
                      <button
                        className="gs-icon-btn gs-icon-btn--publish"
                        disabled={exam.status !== "DRAFT" || publishMutation.isPending}
                        onClick={() => void handlePublish(exam)}
                        title="نشر القالب"
                      >
                        <Rocket size={13} />
                      </button>
                      <button
                        className="gs-icon-btn"
                        disabled={exam.status !== "DRAFT"}
                        onClick={() => openEdit(exam)}
                        title="تعديل"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="gs-icon-btn gs-icon-btn--delete"
                        disabled={exam.status !== "DRAFT"}
                        onClick={() => setDeleteTarget(exam)}
                        title="حذف"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="et-pagination-footer">
              <div className="et-page-size">
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

              <div className="et-pagination-info">
                عرض {Math.min(filteredExams.length, (page - 1) * pageSize + 1)} - {Math.min(filteredExams.length, page * pageSize)} من {filteredExams.length} قالب
              </div>

              <div className="et-pagination-controls">
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingExam ? "تعديل قالب اختبار" : "إضافة قالب اختبار جديد"}
        description="حدد بنية الاختبار والقيم الافتراضية للتقييم."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={isPending}>إلغاء</Button>
            <Button form="exam-template-form" type="submit" variant="primary" isLoading={isPending}>
              {editingExam ? "حفظ التعديلات" : "حفظ القالب"}
            </Button>
          </>
        }
      >
        <form id="exam-template-form" className="et-modal-form" dir="rtl" onSubmit={handleSubmit}>
          {formError && (
            <div className="grade-scales-alert grade-scales-alert--error" style={{ marginBottom: "0.5rem" }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="et-form-section">
            <h3 style={{ fontSize: '0.8rem' }}>المعلومات الأساسية</h3>
            <div className="et-form-grid">
              <label className="et-field">
                <span style={{ fontSize: '0.75rem' }}>اسم القالب</span>
                <input style={{ height: '38px', fontSize: '0.85rem' }} value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="مثال: اختبار الأجزاء الخمسة" />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.75rem' }}>نوع الاختبار</span>
                <select style={{ height: '38px', fontSize: '0.85rem' }} value={form.type} onChange={(e) => {
                  const val = e.target.value as SupportedExamTemplateType;
                  setForm(c => ({ ...c, type: val, examBranch: val === "JUZ" ? c.examBranch || JUZ_BRANCH_OPTIONS[0] : "" }));
                }}>
                  {EXAM_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </label>
            </div>
            {branchRequired ? (
              <label className="et-field">
                <span style={{ fontSize: '0.75rem' }}>فرع الاختبار (الأجزاء)</span>
                <select style={{ height: '38px', fontSize: '0.85rem' }} value={form.examBranch} onChange={(e) => setField("examBranch", e.target.value)}>
                  {JUZ_BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
            ) : (
              <div className="et-field--hint" style={{ fontSize: '0.7rem' }}>فرع الاختبار غير مطلوب في اختبار المصحف كاملاً.</div>
            )}
          </div>

          <div className="et-form-section">
            <h3 style={{ fontSize: '0.8rem' }}>توزيع الدرجات والنجاح</h3>
            <div className="et-form-grid">
              <label className="et-field">
                <span style={{ fontSize: '0.75rem' }}>الدرجة العظمى</span>
                <input style={{ height: '38px', fontSize: '0.85rem' }} type="number" min={1} value={form.maxScore} onChange={(e) => setField("maxScore", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.75rem' }}>علامة النجاح</span>
                <input style={{ height: '38px', fontSize: '0.85rem' }} type="number" min={0} value={form.passScore} onChange={(e) => setField("passScore", Number(e.target.value))} />
              </label>
            </div>
            
            <div className="et-criteria-header" style={{ fontSize: '0.7rem' }}>
              <span>تفصيل المعايير</span>
              <span>المجموع: {currentCriteriaTotal} / {form.maxScore}</span>
            </div>
            
            <div className="et-form-grid">
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>درجة الحفظ</span>
                <input style={{ height: '36px', fontSize: '0.82rem' }} type="number" min={0} value={form.memorizationScore} onChange={(e) => setField("memorizationScore", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>درجة التجويد</span>
                <input style={{ height: '36px', fontSize: '0.82rem' }} type="number" min={0} value={form.tajweedScore} onChange={(e) => setField("tajweedScore", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>تجويد نظري</span>
                <input style={{ height: '36px', fontSize: '0.82rem' }} type="number" min={0} value={form.theoreticalTajweedScore} onChange={(e) => setField("theoreticalTajweedScore", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>الأداء</span>
                <input style={{ height: '36px', fontSize: '0.82rem' }} type="number" min={0} value={form.performanceScore} onChange={(e) => setField("performanceScore", Number(e.target.value))} />
              </label>
            </div>
          </div>

          <div className="et-form-section">
            <h3 style={{ fontSize: '0.8rem' }}>سياسة الخصومات (التقييم)</h3>
            <div className="et-form-grid">
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>تلقين (-0.5)</span>
                <input style={{ height: '36px', fontSize: '0.82rem' }} type="number" step="0.5" value={form.promptingPenalty} onChange={(e) => setField("promptingPenalty", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>تنبيه (-0.5)</span>
                <input style={{ height: '36px', fontSize: '0.82rem' }} type="number" step="0.5" value={form.remindingPenalty} onChange={(e) => setField("remindingPenalty", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>تجويد (-0.25)</span>
                <input style={{ height: '36px', fontSize: '0.82rem' }} type="number" step="0.25" value={form.tajweedPenalty} onChange={(e) => setField("tajweedPenalty", Number(e.target.value))} />
              </label>
            </div>
          </div>

          <div className="et-form-section">
            <h3 style={{ fontSize: '0.8rem' }}>سياسة عدد الأسئلة</h3>
            <div className="et-criteria-header" style={{ fontSize: '0.7rem' }}>
              <span>تُستخدم هذه الحدود داخل شاشة التقييم في الويب عند التوليد التلقائي للأسئلة.</span>
              <span>
                المسموح: {form.minQuestionCount} - {form.maxQuestionCount} | الافتراضي:{" "}
                {form.defaultQuestionCount}
              </span>
            </div>
            <div className="et-form-grid">
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>الحد الأدنى</span>
                <input
                  style={{ height: '36px', fontSize: '0.82rem' }}
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={form.minQuestionCount}
                  onChange={(e) => setField("minQuestionCount", Number(e.target.value))}
                />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>العدد الافتراضي</span>
                <input
                  style={{ height: '36px', fontSize: '0.82rem' }}
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={form.defaultQuestionCount}
                  onChange={(e) => setField("defaultQuestionCount", Number(e.target.value))}
                />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>الحد الأعلى</span>
                <input
                  style={{ height: '36px', fontSize: '0.82rem' }}
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={form.maxQuestionCount}
                  onChange={(e) => setField("maxQuestionCount", Number(e.target.value))}
                />
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف قالب الاختبار"
        message={`سيتم حذف قالب "${deleteTarget?.title ?? ""}" نهائيًا ما دام ما زال في حالة مسودة.`}
        confirmLabel="حذف القالب"
        cancelLabel="إلغاء"
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
}
