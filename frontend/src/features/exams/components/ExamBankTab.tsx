import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { EmptyState } from "../../../components/ui/EmptyState";
import Modal from "../../../components/ui/Modal";
import { SURAH_OPTIONS, getSurahAyahCount, getSurahLabel } from "../constants/surah-options";
import {
  useCreateQuestionBankItemMutation,
  useDeleteQuestionBankItemMutation,
  useGenerateQuestionBankItemsMutation,
  useQuestionBankQuery,
  useUpdateQuestionBankItemMutation
} from "../exams.hooks";
import type { ExamQuestionBankItem, QuestionBankSource } from "../types";
import "../../../styles/features/exam-bank.css";

type ManualFormState = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  pageNumber: number;
  lineCount: number;
  difficultyLevel: number;
  suggestedText: string;
};

type AutoFormState = {
  fromSurah: number;
  toSurah: number;
  count: number;
  difficultyLevel?: number;
  suggestedTextPrefix: string;
};

const defaultManualForm: ManualFormState = {
  fromSurah: 2,
  fromAyah: 1,
  toSurah: 2,
  toAyah: 5,
  pageNumber: 1,
  lineCount: 1,
  difficultyLevel: 3,
  suggestedText: ""
};

const defaultAutoForm: AutoFormState = {
  fromSurah: 2,
  toSurah: 2,
  count: 3,
  difficultyLevel: 3,
  suggestedTextPrefix: ""
};

const AUTO_QUICK_RANGES = [
  { id: "mufassal", label: "المفصل", fromSurah: 67, toSurah: 114, helper: "من الملك إلى الناس" },
  { id: "juz-amma", label: "جزء عم", fromSurah: 78, toSurah: 114, helper: "للاختبارات السريعة" },
  { id: "juz-tabarak", label: "جزء تبارك", fromSurah: 67, toSurah: 77, helper: "مدى مناسب للمراجعة" },
  { id: "long-surahs", label: "السور الطويلة", fromSurah: 2, toSurah: 9, helper: "للاختبارات المتقدمة" }
] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? Math.round(value) : min));

const normalizeQuestionRange = (form: {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
}) => {
  if (form.fromSurah < form.toSurah) {
    return form;
  }

  if (form.fromSurah === form.toSurah && form.fromAyah <= form.toAyah) {
    return form;
  }

  return {
    fromSurah: form.toSurah,
    fromAyah: form.toAyah,
    toSurah: form.fromSurah,
    toAyah: form.fromAyah
  };
};

const normalizeSurahRange = (fromSurah: number, toSurah: number) => ({
  fromSurah: Math.min(fromSurah, toSurah),
  toSurah: Math.max(fromSurah, toSurah),
  wasSwapped: fromSurah > toSurah
});

const sourceLabel: Record<QuestionBankSource, string> = {
  MANUAL: "يدوي",
  AUTO: "تلقائي"
};

const sourceVariant: Record<QuestionBankSource, "secondary" | "info"> = {
  MANUAL: "secondary",
  AUTO: "info"
};

const difficultyVariant = (level: number): "success" | "warning" | "error" => {
  if (level <= 2) {
    return "success";
  }

  if (level === 3) {
    return "warning";
  }

  return "error";
};

const getRangeSummary = (item: Pick<ExamQuestionBankItem, "fromSurah" | "fromAyah" | "toSurah" | "toAyah">) =>
  `${getSurahLabel(item.fromSurah)} (${item.fromAyah}) - ${getSurahLabel(item.toSurah)} (${item.toAyah})`;

export function ExamBankTab() {
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<number | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<QuestionBankSource | undefined>(undefined);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamQuestionBankItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamQuestionBankItem | null>(null);
  const [manualForm, setManualForm] = useState<ManualFormState>(defaultManualForm);
  const [autoForm, setAutoForm] = useState<AutoFormState>(defaultAutoForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      difficultyLevel: difficultyFilter,
      source: sourceFilter
    }),
    [difficultyFilter, search, sourceFilter]
  );

  const questionBankQuery = useQuestionBankQuery(listFilters, true);
  const createMutation = useCreateQuestionBankItemMutation();
  const updateMutation = useUpdateQuestionBankItemMutation();
  const generateMutation = useGenerateQuestionBankItemsMutation();
  const deleteMutation = useDeleteQuestionBankItemMutation();

  const items = questionBankQuery.data ?? [];
  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    generateMutation.isPending ||
    deleteMutation.isPending;

  const totalPages = Math.ceil(items.length / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  // Reset page on search/filter
  useMemo(() => setCurrentPage(1), [search, difficultyFilter, sourceFilter, pageSize]);

  const summary = useMemo(() => {
    const total = items.length;
    const manualCount = items.filter((item) => item.source === "MANUAL").length;
    const autoCount = total - manualCount;
    const difficultyAverage = total
      ? (items.reduce((sum, item) => sum + item.difficultyLevel, 0) / total).toFixed(1)
      : "0.0";

    return {
      total,
      manualCount,
      autoCount,
      difficultyAverage
    };
  }, [items]);

  const resetManualForm = () => {
    setManualForm(defaultManualForm);
    setEditingItem(null);
  };

  const openCreateManual = () => {
    setError("");
    setSuccessMessage("");
    resetManualForm();
    setManualModalOpen(true);
  };

  const openEditManual = (item: ExamQuestionBankItem) => {
    setError("");
    setSuccessMessage("");
    setEditingItem(item);
    setManualForm({
      fromSurah: item.fromSurah,
      fromAyah: item.fromAyah,
      toSurah: item.toSurah,
      toAyah: item.toAyah,
      pageNumber: item.pageNumber,
      lineCount: item.lineCount,
      difficultyLevel: item.difficultyLevel,
      suggestedText: item.suggestedText ?? ""
    });
    setManualModalOpen(true);
  };

  const closeManualModal = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    setManualModalOpen(false);
    resetManualForm();
  };

  const closeAutoModal = () => {
    if (generateMutation.isPending) {
      return;
    }

    setAutoModalOpen(false);
    setAutoForm(defaultAutoForm);
  };

  const handleCreateOrUpdateManual = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const fromMax = getSurahAyahCount(manualForm.fromSurah);
    const toMax = getSurahAyahCount(manualForm.toSurah);

    if (manualForm.fromAyah < 1 || manualForm.fromAyah > fromMax) {
      setError(`رقم آية البداية يجب أن يكون بين 1 و ${fromMax}.`);
      return;
    }

    if (manualForm.toAyah < 1 || manualForm.toAyah > toMax) {
      setError(`رقم آية النهاية يجب أن يكون بين 1 و ${toMax}.`);
      return;
    }

    const normalized = normalizeQuestionRange({
      fromSurah: manualForm.fromSurah,
      fromAyah: manualForm.fromAyah,
      toSurah: manualForm.toSurah,
      toAyah: manualForm.toAyah
    });

    const payload = {
      fromSurah: normalized.fromSurah,
      fromAyah: normalized.fromAyah,
      toSurah: normalized.toSurah,
      toAyah: normalized.toAyah,
      pageNumber: clamp(manualForm.pageNumber, 1, 604),
      lineCount: clamp(manualForm.lineCount, 1, 15),
      difficultyLevel: clamp(manualForm.difficultyLevel, 1, 5),
      suggestedText: manualForm.suggestedText.trim() || undefined
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          itemId: editingItem.id,
          payload
        });
        setSuccessMessage("تم تحديث السؤال في بنك الأسئلة.");
      } else {
        await createMutation.mutateAsync(payload);
        setSuccessMessage("تمت إضافة السؤال إلى بنك الأسئلة.");
      }

      closeManualModal();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error && mutationError.message
          ? mutationError.message
          : editingItem
            ? "تعذر تحديث السؤال."
            : "تعذر حفظ السؤال في بنك الأسئلة."
      );
    }
  };

  const handleGenerate = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const normalized = normalizeSurahRange(autoForm.fromSurah, autoForm.toSurah);

    try {
      const generatedItems = await generateMutation.mutateAsync({
        fromSurah: normalized.fromSurah,
        toSurah: normalized.toSurah,
        count: clamp(autoForm.count, 1, 100),
        difficultyLevel: autoForm.difficultyLevel ? clamp(autoForm.difficultyLevel, 1, 5) : undefined,
        suggestedTextPrefix: autoForm.suggestedTextPrefix.trim() || undefined
      });

      setSuccessMessage(
        generatedItems.length > 0
          ? `تم توليد ${generatedItems.length} سؤالًا وحفظها في البنك.`
          : "تم تنفيذ التوليد، لكن لم يتم إرجاع أسئلة جديدة."
      );
      closeAutoModal();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error && mutationError.message
          ? mutationError.message
          : "تعذر توليد الأسئلة تلقائيًا."
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setSuccessMessage("تم حذف السؤال من بنك الأسئلة.");
      setDeleteTarget(null);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error && mutationError.message
          ? mutationError.message
          : "تعذر حذف السؤال."
      );
    }
  };

  return (
    <div className="exam-bank-tab" dir="rtl">
      {/* Search, Filters & Stats Row */}
      <div className="exam-bank-controls">
        <div className="exam-bank-search-group">
          <div className="eb-search-wrap">
            <Search className="eb-search-icon" size={16} />
            <input
              className="eb-search-input"
              placeholder="ابحث بالنص المقترح أو باسم المُدخل..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="eb-filter-select"
            value={sourceFilter ?? ""}
            onChange={(e) => setSourceFilter((e.target.value || undefined) as QuestionBankSource | undefined)}
          >
            <option value="">كل المصادر</option>
            <option value="MANUAL">يدوي</option>
            <option value="AUTO">تلقائي</option>
          </select>

          <select
            className="eb-filter-select"
            value={difficultyFilter ?? ""}
            onChange={(e) => setDifficultyFilter(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">كل الصعوبات</option>
            {[1, 2, 3, 4, 5].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
          </select>

          <div className="exam-bank-stats">
            <div className="eb-stat-pill">يدوي: <strong>{summary.manualCount}</strong></div>
            <div className="eb-stat-pill">تلقائي: <strong>{summary.autoCount}</strong></div>
          </div>
        </div>

        <div className="exam-bank-actions">
          <Button variant="secondary" className="eb-action-btn" leftIcon={<Plus size={16} />} onClick={openCreateManual}>
            إضافة سؤال
          </Button>
          <Button
            variant="primary"
            className="eb-action-btn"
            leftIcon={<Sparkles size={16} />}
            onClick={() => {
              setError("");
              setSuccessMessage("");
              setAutoModalOpen(true);
            }}
          >
            توليد ذكي
          </Button>
        </div>
      </div>

      {error && (
        <div className="grade-scales-alert grade-scales-alert--error" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="grade-scales-alert grade-scales-alert--success" style={{ marginBottom: "1rem", backgroundColor: "var(--bg-success-light)", color: "var(--success)" }}>
          <Sparkles size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="exam-bank-workspace">
        {questionBankQuery.isLoading ? (
          <div className="grade-scales-loading">جارٍ تحميل بنك الأسئلة...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={42} />}
            title="لا توجد أسئلة محفوظة بعد"
            description="أضف سؤالاً يدوياً أو استخدم التوليد الذكي لإعداد بنك أسئلة جاهز للاختبارات."
            action={
              <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={openCreateManual}>
                إضافة سؤال
              </Button>
            }
          />
        ) : (
          <>
            <div className="exam-bank-grid">
              {paginatedItems.map((item) => (
                <div key={item.id} className="question-modern-card">
                  <div className="q-card-right">
                    <div className="q-card-icon-box" style={{ backgroundColor: item.source === "AUTO" ? "#0284c7" : "#0f766e" }}>
                      {item.source === "AUTO" ? <Sparkles size={18} /> : <BookOpen size={18} />}
                    </div>
                    <div className="q-card-info">
                      <strong className="q-card-range">{getRangeSummary(item)}</strong>
                      <div className="q-meta-item">
                        <Badge variant={difficultyVariant(item.difficultyLevel)} size="sm">
                          {item.difficultyLevel}/5
                        </Badge>
                        <Badge variant={sourceVariant[item.source]} size="sm">
                          {sourceLabel[item.source]}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="q-card-text-preview" title={item.suggestedText || ""}>
                    {item.suggestedText?.trim() || "لا يوجد نص مقترح"}
                  </div>

                  <div className="q-card-left">
                    <div className="q-card-meta">
                      <div className="q-meta-item" style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        ص {item.pageNumber} / {item.lineCount} س
                      </div>
                      <div className="q-meta-item">
                        <User size={10} />
                        <span>{item.createdBy?.fullName?.split(' ')[0] || "إداري"}</span>
                      </div>
                    </div>
                    <div className="q-card-actions">
                      <button className="gs-icon-btn" onClick={() => openEditManual(item)} title="تعديل">
                        <Edit2 size={13} />
                      </button>
                      <button className="gs-icon-btn gs-icon-btn--delete" onClick={() => setDeleteTarget(item)} title="حذف">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="eb-pagination-footer">
              <div className="eb-page-size">
                <span>الصفوف لكل صفحة:</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="eb-pagination-info">
                عرض {Math.min(items.length, (currentPage - 1) * pageSize + 1)} - {Math.min(items.length, currentPage * pageSize)} من {items.length} سؤال
              </div>

              <div className="eb-pagination-controls">
                <button className="gs-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronRight size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(page => (
                  <button key={page} className={`gs-page-btn ${currentPage === page ? 'gs-page-btn--active' : ''}`} onClick={() => setCurrentPage(page)}>
                    {page}
                  </button>
                ))}
                <button className="gs-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual Add/Edit Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={closeManualModal}
        title={editingItem ? "تعديل سؤال" : "إضافة سؤال يدوي"}
        description="أدخل المدى القرآني وبيانات الصفحة والصعوبة ليبقى السؤال منظماً."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeManualModal} disabled={busy}>إلغاء</Button>
            <Button form="eb-manual-form" type="submit" variant="primary" isLoading={busy}>
              {editingItem ? "حفظ التعديلات" : "حفظ السؤال"}
            </Button>
          </>
        }
      >
        <form id="eb-manual-form" className="eb-modal-form" onSubmit={handleCreateOrUpdateManual} dir="rtl">
          <div className="eb-form-section">
            <h3>نطاق السور</h3>
            <div className="eb-form-grid">
              <label className="eb-field">
                <span>من سورة</span>
                <select value={manualForm.fromSurah} onChange={(e) => setManualForm(p => ({ ...p, fromSurah: Number(e.target.value), fromAyah: 1 }))}>
                  {SURAH_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="eb-field">
                <span>من آية</span>
                <input type="number" min={1} value={manualForm.fromAyah} onChange={(e) => setManualForm(p => ({ ...p, fromAyah: Number(e.target.value) }))} />
              </label>
            </div>
            <div className="eb-form-grid">
              <label className="eb-field">
                <span>إلى سورة</span>
                <select value={manualForm.toSurah} onChange={(e) => setManualForm(p => ({ ...p, toSurah: Number(e.target.value), toAyah: 1 }))}>
                  {SURAH_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="eb-field">
                <span>إلى آية</span>
                <input type="number" min={1} value={manualForm.toAyah} onChange={(e) => setManualForm(p => ({ ...p, toAyah: Number(e.target.value) }))} />
              </label>
            </div>
          </div>

          <div className="eb-form-section">
            <h3>تفاصيل السؤال</h3>
            <div className="eb-form-grid">
              <label className="eb-field">
                <span>رقم الصفحة</span>
                <input type="number" min={1} max={604} value={manualForm.pageNumber} onChange={(e) => setManualForm(p => ({ ...p, pageNumber: Number(e.target.value) }))} />
              </label>
              <label className="eb-field">
                <span>عدد الأسطر</span>
                <input type="number" min={1} max={15} value={manualForm.lineCount} onChange={(e) => setManualForm(p => ({ ...p, lineCount: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="eb-field">
              <span>درجة الصعوبة (1-5)</span>
              <input type="number" min={1} max={5} value={manualForm.difficultyLevel} onChange={(e) => setManualForm(p => ({ ...p, difficultyLevel: Number(e.target.value) }))} />
            </label>
            <label className="eb-field">
              <span>النص المقترح</span>
              <input type="text" value={manualForm.suggestedText} onChange={(e) => setManualForm(p => ({ ...p, suggestedText: e.target.value }))} placeholder="مثال: مراجعة مركزة..." />
            </label>
          </div>
        </form>
      </Modal>

      {/* Auto Generation Modal */}
      <Modal
        isOpen={autoModalOpen}
        onClose={closeAutoModal}
        title="توليد ذكي لبنك الأسئلة"
        description="اختر نطاق السور وعدد الأسئلة، وسيقوم النظام بتوليدها تلقائياً."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeAutoModal} disabled={busy}>إلغاء</Button>
            <Button form="eb-auto-form" type="submit" variant="primary" isLoading={busy}>توليد وحفظ</Button>
          </>
        }
      >
        <form id="eb-auto-form" className="eb-modal-form" onSubmit={handleGenerate} dir="rtl">
          <div className="eb-form-section">
            <h3>نطاق السور</h3>
            <div className="eb-form-grid">
              <label className="eb-field">
                <span>من سورة</span>
                <select value={autoForm.fromSurah} onChange={(e) => setAutoForm(p => ({ ...p, fromSurah: Number(e.target.value) }))}>
                  {SURAH_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="eb-field">
                <span>إلى سورة</span>
                <select value={autoForm.toSurah} onChange={(e) => setAutoForm(p => ({ ...p, toSurah: Number(e.target.value) }))}>
                  {SURAH_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            </div>
            <div className="eb-quick-ranges">
              {AUTO_QUICK_RANGES.map(range => (
                <button key={range.id} type="button" className="eb-quick-range-btn" onClick={() => setAutoForm(p => ({ ...p, fromSurah: range.fromSurah, toSurah: range.toSurah }))}>
                  <strong>{range.label}</strong>
                  <small>{range.helper}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="eb-form-section">
            <h3>إعدادات التوليد</h3>
            <div className="eb-form-grid">
              <label className="eb-field">
                <span>عدد الأسئلة</span>
                <input type="number" min={1} max={100} value={autoForm.count} onChange={(e) => setAutoForm(p => ({ ...p, count: Number(e.target.value) }))} />
              </label>
              <label className="eb-field">
                <span>الصعوبة المفضلة</span>
                <input type="number" min={1} max={5} value={autoForm.difficultyLevel} onChange={(e) => setAutoForm(p => ({ ...p, difficultyLevel: Number(e.target.value) }))} />
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف سؤال"
        message="هل أنت متأكد من حذف هذا السؤال نهائياً؟"
        confirmLabel="تأكيد الحذف"
        cancelLabel="إلغاء"
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
}

export default ExamBankTab;
