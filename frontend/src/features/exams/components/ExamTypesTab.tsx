import { useMemo, useState } from "react";
import { AlertCircle, BookOpen, Edit2, Plus, Rocket, Trash2, FileText, Layout, Search, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
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
  fromJuz: number;
  toJuz: number;
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

const JUZ_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);

const emptyForm = (): FormState => ({
  title: "",
  type: "JUZ",
  examBranch: JUZ_BRANCH_OPTIONS[0],
  fromJuz: 1,
  toJuz: 5,
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

const parseJuzRangeBranch = (branch: string | null | undefined): { from: number; to: number } | null => {
  const normalized = branch?.trim();
  if (!normalized) return null;
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const w = normalized.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  const m = w.match(/من\s+الجزء\s+(\d+)\s+إلى\s+الجزء\s+(\d+)/);
  if (!m) return null;
  const from = Number(m[1]);
  const to = Number(m[2]);
  if (from < 1 || from > 30 || to < 1 || to > 30 || from > to) return null;
  return { from, to };
};

const toFormState = (exam: ExamListItem): FormState => {
  let fromJuz = 1;
  let toJuz = 5;
  if (exam.type === "JUZ_RANGE" && exam.examBranch) {
    const parsed = parseJuzRangeBranch(exam.examBranch);
    if (parsed) { fromJuz = parsed.from; toJuz = parsed.to; }
  }
  return {
    title: exam.title,
    type: exam.type === "FULL_QURAN" ? "FULL_QURAN" : exam.type === "JUZ_RANGE" ? "JUZ_RANGE" : "JUZ",
    examBranch:
      exam.type === "JUZ"
        ? exam.examBranch?.trim() || JUZ_BRANCH_OPTIONS[0]
        : JUZ_BRANCH_OPTIONS[0],
    fromJuz,
    toJuz,
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
  };
};

const criteriaTotal = (form: FormState) =>
  form.memorizationScore +
  form.tajweedScore +
  form.theoreticalTajweedScore +
  form.performanceScore;

const tableStatusVariant = (status: string) => {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  if (status === "CANCELLED") return "error";
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
  const juzRangeRequired = form.type === "JUZ_RANGE";
  
  // Immutability lock: if the exam has attempts, we disable editing scoring/type fields
  const isLocked = Boolean(editingExam && (editingExam._count?.attempts ?? 0) > 0);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setEditingExam(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (exam: ExamListItem) => {
    setEditingExam(exam);
    setForm(toFormState(exam));
    setIsModalOpen(true);
  };

  const openClone = (exam: ExamListItem) => {
    setEditingExam(null); // Treat as a new exam creation
    setForm({
      ...toFormState(exam),
      title: `${exam.title} (نسخة)`
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isPending) return;
    setIsModalOpen(false);
    setEditingExam(null);
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

  const buildExamBranch = (): string | null => {
    if (form.type === "JUZ") return form.examBranch;
    if (form.type === "JUZ_RANGE") return `من الجزء ${form.fromJuz} إلى الجزء ${form.toJuz}`;
    return null;
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return "يرجى إدخال اسم واضح للاختبار.";
    }

    if (branchRequired && !form.examBranch.trim()) {
      return "يرجى تحديد فرع الاختبار عند اختيار اختبار الأجزاء.";
    }

    if (juzRangeRequired && form.fromJuz > form.toJuz) {
      return "جزء البداية يجب أن يكون قبل أو يساوي جزء النهاية.";
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

    const validationMessage = validateForm();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      examBranch: buildExamBranch(),
      maxScore: form.maxScore,
      passScore: form.passScore,
      criteria: buildCriteria()
    } as const;

    try {
      if (editingExam) {
        // If locked, we still pass the values but the backend will ignore scoring/type changes 
        // to prevent validation errors on disabled fields.
        await updateMutation.mutateAsync({
          examId: editingExam.id,
          payload
        });
        toast.success("تم تعديل القالب بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إنشاء القالب بنجاح");
      }

      closeModal();
    } catch (error) {
      toast.error(getLocalizedApiErrorMessage(error, "تعذّر حفظ قالب الاختبار. حاول مرة أخرى."));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("تم حذف القالب بنجاح");
    } catch (error) {
      toast.error(getLocalizedApiErrorMessage(error, "تعذّر حذف قالب الاختبار."));
    }
  };

  const handlePublish = async (exam: ExamListItem) => {
    try {
      await publishMutation.mutateAsync(exam.id);
      toast.success("تم نشر قالب الاختبار بنجاح");
    } catch (error) {
      toast.error(getLocalizedApiErrorMessage(error, "تعذّر نشر قالب الاختبار."));
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
                      {/* زر النشر: يظهر فقط للمسودات */}
                      <button
                        className="gs-icon-btn gs-icon-btn--publish"
                        disabled={exam.status !== "DRAFT" || publishMutation.isPending}
                        onClick={() => void handlePublish(exam)}
                        title={exam.status === "DRAFT" ? "نشر القالب" : "القالب منشور بالفعل - عدّله أولاً لإعادة النشر"}
                      >
                        <Rocket size={13} />
                      </button>
                      {/* زر النسخ: متاح دائماً */}
                      <button
                        className="gs-icon-btn"
                        onClick={() => openClone(exam)}
                        title="استنساخ القالب لإنشاء نسخة جديدة"
                      >
                        <Copy size={13} />
                      </button>
                      {/* زر التعديل: مفعّل دائماً - تعديل المنشور يُعيده لمسودة */}
                      <button
                        className="gs-icon-btn"
                        onClick={() => openEdit(exam)}
                        title={
                          exam.status === "PUBLISHED"
                            ? "تعديل (سيُعاد إلى مسودة - يجب إعادة نشره)"
                            : "تعديل"
                        }
                      >
                        <Edit2 size={13} />
                      </button>
                      {/* زر الحذف: معطّل فقط إذا كانت هناك محاولات */}
                      <button
                        className="gs-icon-btn gs-icon-btn--delete"
                        disabled={(exam._count?.attempts ?? 0) > 0}
                        onClick={() => setDeleteTarget(exam)}
                        title={
                          (exam._count?.attempts ?? 0) > 0
                            ? `لا يمكن الحذف: يوجد ${exam._count?.attempts} محاولة مرتبطة`
                            : "حذف"
                        }
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
        description={
          editingExam?.status === "PUBLISHED"
            ? "⚠️ هذا القالب منشور. سيُعاد تلقائياً إلى المسودة عند الحفظ ويحتاج إعادة نشر."
            : "حدد بنية الاختبار والقيم الافتراضية للتقييم."
        }
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
          {isLocked && (
            <div className="grade-scales-alert" style={{ marginBottom: "1rem", backgroundColor: "rgba(234, 179, 8, 0.1)", color: "#ca8a04", padding: "10px", borderRadius: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.8rem' }}>
                لا يمكن تعديل معايير التقييم لأن هذا القالب مستخدم بالفعل لتقييم طلاب سابقين.
                الرجاء استنساخ القالب لتغيير المعايير.
              </span>
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
                <select disabled={isLocked} style={{ height: '38px', fontSize: '0.85rem', opacity: isLocked ? 0.7 : 1 }} value={form.type} onChange={(e) => {
                  const val = e.target.value as SupportedExamTemplateType;
                  setForm(c => ({
                    ...c,
                    type: val,
                    examBranch: val === "JUZ" ? c.examBranch || JUZ_BRANCH_OPTIONS[0] : "",
                    fromJuz: 1,
                    toJuz: 5
                  }));
                }}>
                  {EXAM_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </label>
            </div>

            {/* اختبار جزء واحد */}
            {branchRequired && (
              <label className="et-field">
                <span style={{ fontSize: '0.75rem' }}>فرع الاختبار (الجزء)</span>
                <select disabled={isLocked} style={{ height: '38px', fontSize: '0.85rem', opacity: isLocked ? 0.7 : 1 }} value={form.examBranch} onChange={(e) => setField("examBranch", e.target.value)}>
                  {JUZ_BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
            )}

            {/* فئات الأجزاء (من - إلى) */}
            {juzRangeRequired && (
              <div className="et-form-grid">
                <label className="et-field">
                  <span style={{ fontSize: '0.75rem' }}>من الجزء</span>
                  <select
                    disabled={isLocked}
                    style={{ height: '38px', fontSize: '0.85rem', opacity: isLocked ? 0.7 : 1 }}
                    value={form.fromJuz}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm(c => ({ ...c, fromJuz: val, toJuz: Math.max(val, c.toJuz) }));
                    }}
                  >
                    {JUZ_NUMBERS.map(n => <option key={n} value={n}>الجزء {n}</option>)}
                  </select>
                </label>
                <label className="et-field">
                  <span style={{ fontSize: '0.75rem' }}>إلى الجزء</span>
                  <select
                    disabled={isLocked}
                    style={{ height: '38px', fontSize: '0.85rem', opacity: isLocked ? 0.7 : 1 }}
                    value={form.toJuz}
                    onChange={(e) => setField("toJuz", Number(e.target.value))}
                  >
                    {JUZ_NUMBERS.filter(n => n >= form.fromJuz).map(n => <option key={n} value={n}>الجزء {n}</option>)}
                  </select>
                </label>
                <div className="et-field--hint" style={{ fontSize: '0.7rem', gridColumn: '1 / -1' }}>
                  النطاق المحدد: من الجزء {form.fromJuz} إلى الجزء {form.toJuz} ({form.toJuz - form.fromJuz + 1} جزء)
                </div>
              </div>
            )}

            {/* المصحف كاملاً */}
            {form.type === "FULL_QURAN" && (
              <div className="et-field--hint" style={{ fontSize: '0.7rem' }}>فرع الاختبار غير مطلوب في اختبار المصحف كاملاً.</div>
            )}
          </div>

          <div className="et-form-section">
            <h3 style={{ fontSize: '0.8rem' }}>توزيع الدرجات والنجاح</h3>
            <div className="et-form-grid">
              <label className="et-field">
                <span style={{ fontSize: '0.75rem' }}>الدرجة العظمى</span>
                <input disabled={isLocked} style={{ height: '38px', fontSize: '0.85rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={1} value={form.maxScore} onChange={(e) => setField("maxScore", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.75rem' }}>علامة النجاح</span>
                <input disabled={isLocked} style={{ height: '38px', fontSize: '0.85rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={0} value={form.passScore} onChange={(e) => setField("passScore", Number(e.target.value))} />
              </label>
            </div>
            
            <div className="et-criteria-header" style={{ fontSize: '0.7rem' }}>
              <span>تفصيل المعايير</span>
              <span>المجموع: {currentCriteriaTotal} / {form.maxScore}</span>
            </div>
            
            <div className="et-form-grid">
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>درجة الحفظ</span>
                <input disabled={isLocked} style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={0} value={form.memorizationScore} onChange={(e) => setField("memorizationScore", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>درجة التجويد</span>
                <input disabled={isLocked} style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={0} value={form.tajweedScore} onChange={(e) => setField("tajweedScore", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>تجويد نظري</span>
                <input disabled={isLocked} style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={0} value={form.theoreticalTajweedScore} onChange={(e) => setField("theoreticalTajweedScore", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>الأداء</span>
                <input disabled={isLocked} style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={0} value={form.performanceScore} onChange={(e) => setField("performanceScore", Number(e.target.value))} />
              </label>
            </div>
          </div>

          <div className="et-form-section">
            <h3 style={{ fontSize: '0.8rem' }}>سياسة الخصومات (التقييم)</h3>
            <div className="et-form-grid">
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>خصم التلقين</span>
                <input disabled={isLocked} style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={0} step="0.5" value={form.promptingPenalty} onChange={(e) => setField("promptingPenalty", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>خصم التنبيه</span>
                <input disabled={isLocked} style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={0} step="0.5" value={form.remindingPenalty} onChange={(e) => setField("remindingPenalty", Number(e.target.value))} />
              </label>
              <label className="et-field">
                <span style={{ fontSize: '0.72rem' }}>خصم التجويد</span>
                <input disabled={isLocked} style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }} type="number" min={0} step="0.25" value={form.tajweedPenalty} onChange={(e) => setField("tajweedPenalty", Number(e.target.value))} />
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
                  disabled={isLocked}
                  style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }}
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
                  disabled={isLocked}
                  style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }}
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
                  disabled={isLocked}
                  style={{ height: '36px', fontSize: '0.82rem', opacity: isLocked ? 0.7 : 1 }}
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
        message={`سيتم حذف قالب "${deleteTarget?.title ?? ""}" نهائيًا. هذا الإجراء لا يمكن التراجع عنه.`}
        confirmLabel="حذف القالب"
        cancelLabel="إلغاء"
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
}
