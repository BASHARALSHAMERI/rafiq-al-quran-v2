import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Palette,
  Plus,
  ShieldAlert,
  Search,
  Sliders,
  Trash2
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { EmptyState } from "../../../components/ui/EmptyState";
import Modal from "../../../components/ui/Modal";
import toast from "react-hot-toast";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import {
  useCreateGradeScaleMutation,
  useDeleteGradeScaleMutation,
  useGradeScalesQuery,
  useUpdateGradeScaleMutation
} from "../grade-scales.hooks";
import type { GradeScale } from "../types";

const emptyForm = () => ({
  label: "",
  minPercentage: 0,
  maxPercentage: 100,
  color: "#0f766e",
  sortOrder: 0,
  isActive: true
});

type FormState = ReturnType<typeof emptyForm>;

type ScaleDiagnostics = {
  overlapIds: Set<number>;
  gapIds: Set<number>;
  activeCount: number;
  inactiveCount: number;
  gapCount: number;
  overlapCount: number;
  coverageStart: number | null;
  coverageEnd: number | null;
};

const byRangeAsc = (left: GradeScale, right: GradeScale) =>
  Number(left.minPercentage) - Number(right.minPercentage);

const formatPercentage = (value: number) => {
  const normalized = Number(value);
  if (Number.isInteger(normalized)) {
    return `${normalized}`;
  }

  return normalized.toFixed(2).replace(/\.?0+$/, "");
};

const RANGE_EPSILON = 0.01;

const rangesOverlap = (
  left: Pick<GradeScale, "minPercentage" | "maxPercentage">,
  right: Pick<GradeScale, "minPercentage" | "maxPercentage">
) => Number(left.minPercentage) <= Number(right.maxPercentage) && Number(right.minPercentage) <= Number(left.maxPercentage);

const analyzeScales = (scales: GradeScale[]): ScaleDiagnostics => {
  const activeScales = scales.filter((scale) => scale.isActive).sort(byRangeAsc);
  const overlapIds = new Set<number>();
  const gapIds = new Set<number>();
  let overlapCount = 0;
  let gapCount = 0;

  activeScales.forEach((scale, index) => {
    const next = activeScales[index + 1];
    if (!next) {
      return;
    }

    if (rangesOverlap(scale, next)) {
      overlapCount += 1;
      overlapIds.add(scale.id);
      overlapIds.add(next.id);
      return;
    }

    if (Number(next.minPercentage) > Number(scale.maxPercentage) + RANGE_EPSILON) {
      gapCount += 1;
      gapIds.add(scale.id);
      gapIds.add(next.id);
    }
  });

  return {
    overlapIds,
    gapIds,
    activeCount: activeScales.length,
    inactiveCount: scales.length - activeScales.length,
    gapCount,
    overlapCount,
    coverageStart: activeScales[0] ? Number(activeScales[0].minPercentage) : null,
    coverageEnd: activeScales[activeScales.length - 1]
      ? Number(activeScales[activeScales.length - 1].maxPercentage)
      : null
  };
};

const buildConflictList = (
  scales: GradeScale[],
  editingId: number | null,
  form: FormState
) => {
  if (!form.isActive) {
    return [];
  }

  return scales.filter((scale) => {
    if (!scale.isActive) {
      return false;
    }

    if (editingId !== null && scale.id === editingId) {
      return false;
    }

    return rangesOverlap(scale, form);
  });
};

export function GradeScalesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const scalesQuery = useGradeScalesQuery();
  const createMutation = useCreateGradeScaleMutation();
  const updateMutation = useUpdateGradeScaleMutation();
  const deleteMutation = useDeleteGradeScaleMutation();

  const [modal, setModal] = useState<{ open: boolean; editing: GradeScale | null }>({
    open: false,
    editing: null
  });
  const [deleteConfirm, setDeleteConfirm] = useState<GradeScale | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const allScales = useMemo(
    () => [...(scalesQuery.data ?? [])].sort(byRangeAsc),
    [scalesQuery.data]
  );

  const filteredScales = useMemo(() => {
    if (!searchTerm.trim()) return allScales;
    return allScales.filter(s => 
      s.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allScales, searchTerm]);

  const totalPages = Math.ceil(filteredScales.length / pageSize);
  const paginatedScales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredScales.slice(start, start + pageSize);
  }, [filteredScales, currentPage, pageSize]);

  // Reset to page 1 on search
  useMemo(() => setCurrentPage(1), [searchTerm, pageSize]);

  const diagnostics = useMemo(() => analyzeScales(allScales), [allScales]);
  const conflictingScales = useMemo(
    () => buildConflictList(allScales, modal.editing?.id ?? null, form),
    [form, modal.editing?.id, allScales]
  );
  const isPending = createMutation.isPending || updateMutation.isPending;

  const setFormField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const openCreate = () => {
    setForm(emptyForm());
    setModal({ open: true, editing: null });
  };

  const openEdit = (scale: GradeScale) => {
    setForm({
      label: scale.label,
      minPercentage: Number(scale.minPercentage),
      maxPercentage: Number(scale.maxPercentage),
      color: scale.color ?? "#0f766e",
      sortOrder: scale.sortOrder,
      isActive: scale.isActive
    });
    setModal({ open: true, editing: scale });
  };

  const closeModal = () => {
    if (isPending) {
      return;
    }

    setModal({ open: false, editing: null });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.label.trim()) {
      toast.error("يرجى إدخال اسم واضح للتقدير.");
      return;
    }

    if (
      form.minPercentage < 0 ||
      form.maxPercentage > 100 ||
      form.minPercentage > form.maxPercentage
    ) {
      toast.error("يجب أن تكون النسبة بين 0 و100 وأن يكون الحد الأدنى أقل من الحد الأعلى أو مساويًا له.");
      return;
    }

    const payload = {
      label: form.label.trim(),
      minPercentage: form.minPercentage,
      maxPercentage: form.maxPercentage,
      color: form.color.trim() || undefined,
      sortOrder: form.sortOrder,
      isActive: form.isActive
    };

    try {
      if (modal.editing) {
        await updateMutation.mutateAsync({
          id: modal.editing.id,
          payload
        });
        toast.success("تم تعديل التقدير بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إضافة التقدير بنجاح");
      }

      closeModal();
    } catch (error) {
      toast.error(getLocalizedApiErrorMessage(error, "تعذر حفظ التقدير."));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
      toast.success("تم حذف التقدير بنجاح");
    } catch (error) {
      toast.error(getLocalizedApiErrorMessage(error, "تعذر حذف التقدير."));
    }
  };

  return (
    <div className="grade-scales-tab" dir="rtl">
      <div className="grade-scales-controls">
        <div className="grade-scales-search-wrap">
          <Search className="grade-scales-search-icon" size={16} />
          <input
            type="text"
            className="grade-scales-search-input"
            placeholder="البحث في سلم التقديرات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grade-scales-stats-pills">
          <div className="grade-scales-pill">
            تغطية: <strong>{diagnostics.coverageStart ?? 0}% - {diagnostics.coverageEnd ?? 0}%</strong>
          </div>
          <div className="grade-scales-pill">
            تقديرات فعالة: <strong>{diagnostics.activeCount}</strong>
          </div>
        </div>

        <Button
          className="grade-scales-add-btn"
          leftIcon={<Plus size={18} />}
          onClick={openCreate}
        >
          إضافة تقدير جديد
        </Button>
      </div>

      {(diagnostics.overlapCount > 0 || diagnostics.gapCount > 0) && (
        <div className="grade-scales-warning" role="status">
          <ShieldAlert size={16} />
          <div>
            <strong>تحتاج مراجعة بسيطة</strong>
            <span>
              {diagnostics.overlapCount > 0
                ? ` يوجد ${diagnostics.overlapCount} تداخل في النطاقات.`
                : ""}
              {diagnostics.gapCount > 0
                ? ` ويوجد ${diagnostics.gapCount} فجوة بين بعض التقديرات الفعالة.`
                : ""}
            </span>
          </div>
        </div>
      )}

      <div className="grade-scales-workspace">
        {scalesQuery.isLoading ? (
          <div className="grade-scales-loading">جارٍ تحميل سلم التقديرات...</div>
        ) : filteredScales.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed rounded-3xl">
            <EmptyState
              icon={<GraduationCap size={44} />}
              title={searchTerm ? "لا توجد نتائج بحث" : "لا توجد تقديرات مخصصة بعد"}
              description={searchTerm ? "جرب البحث بكلمة أخرى." : "أضف أول تقدير لتجهيز السلم الذي سيعتمد عليه النظام في النتيجة النهائية."}
              action={!searchTerm && (
                <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={openCreate}>
                  إنشاء أول تقدير
                </Button>
              )}
            />
          </div>
        ) : (
          <>
            <div className="grade-scales-grid">
              {paginatedScales.map((scale) => (
                <div key={scale.id} className="grade-scale-modern-card">
                  <div className="gs-card-right">
                    <div
                      className="gs-card-icon-box"
                      style={{ backgroundColor: scale.color ?? "#94a3b8" }}
                    >
                      <GraduationCap size={22} />
                    </div>
                    <div className="gs-card-text">
                      <h3 className="gs-card-label">{scale.label}</h3>
                      <span className="gs-card-range">
                        من {formatPercentage(Number(scale.minPercentage))}% إلى {formatPercentage(Number(scale.maxPercentage))}%
                      </span>
                    </div>
                  </div>

                  <div className="gs-card-left">
                    <div className="gs-card-order">الترتيب: #{scale.sortOrder}</div>
                    <div className={`gs-card-status-pill ${!scale.isActive ? 'gs-card-status-pill--inactive' : ''}`}>
                      {scale.isActive ? "فعال" : "معطل"}
                    </div>
                    <div className="gs-card-actions">
                      <button
                        className="gs-icon-btn"
                        title="تعديل"
                        onClick={() => openEdit(scale)}
                      >
                        <Sliders size={14} />
                      </button>
                      <button
                        className="gs-icon-btn gs-icon-btn--delete"
                        title="حذف"
                        onClick={() => setDeleteConfirm(scale)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="grade-scales-footer">
              <div className="gs-page-size">
                <span>الصفوف لكل صفحة:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="gs-pagination-info">
                عرض {Math.min(filteredScales.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredScales.length, currentPage * pageSize)} من {filteredScales.length} تقدير
              </div>

              <div className="gs-pagination-controls">
                <button 
                  className="gs-page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronRight size={16} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`gs-page-btn ${currentPage === page ? 'gs-page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  className="gs-page-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.editing ? "تعديل تقدير" : "إضافة تقدير جديد"}
        description="حدد النطاق واللون والحالة، وسيعتمد النظام هذا السلم عند استخراج التقدير النهائي."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={isPending}>
              إلغاء
            </Button>
            <Button
              form="grade-scale-form"
              type="submit"
              variant="primary"
              isLoading={isPending}
            >
              {modal.editing ? "حفظ التعديلات" : "حفظ التقدير"}
            </Button>
          </>
        }
      >
        <form id="grade-scale-form" className="grade-scales-editor" onSubmit={handleSubmit} dir="rtl">
          {conflictingScales.length > 0 ? (
            <div className="grade-scales-alert grade-scales-alert--warning" role="status">
              <ShieldAlert size={16} />
              <span>
                هذا النطاق يتقاطع مع: {conflictingScales.map((scale) => scale.label).join("، ")}.
              </span>
            </div>
          ) : null}

          <div className="gs-editor-section">
            <div className="gs-editor-group">
              <label className="grade-scales-field">
                <span>اسم التقدير</span>
                <input
                  type="text"
                  value={form.label}
                  onChange={(event) => setFormField("label", event.target.value)}
                  placeholder="مثال: ممتاز"
                  required
                />
              </label>

              <label className="grade-scales-field">
                <span>ترتيب الظهور</span>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => setFormField("sortOrder", Number(event.target.value))}
                />
              </label>
            </div>

            <div className="gs-editor-group">
              <label className="grade-scales-field">
                <span>من نسبة (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.minPercentage}
                  onChange={(event) => setFormField("minPercentage", Number(event.target.value))}
                  required
                />
              </label>

              <label className="grade-scales-field">
                <span>إلى نسبة (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.maxPercentage}
                  onChange={(event) => setFormField("maxPercentage", Number(event.target.value))}
                  required
                />
              </label>
            </div>

            <div className="gs-editor-group">
              <div className="grade-scales-field">
                <span>اللون المميز</span>
                <div className="gs-color-input-wrap">
                  <input
                    className="gs-color-swatch-input"
                    type="color"
                    value={form.color}
                    onChange={(event) => setFormField("color", event.target.value)}
                  />
                  <code className="gs-color-code">{form.color}</code>
                </div>
              </div>

              <div className="grade-scales-field">
                <span>الحالة</span>
                <label className="grade-scales-switch">
                  <span>{form.isActive ? "فعال ويستخدم في النظام" : "معطل مؤقتاً"}</span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setFormField("isActive", event.target.checked)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="gs-preview-section">
            <div className="gs-preview-label">
              <Palette size={14} />
              معاينة حية للبطاقة
            </div>
            
            <div className="grade-scale-modern-card gs-modal-preview-card">
              <div className="gs-card-right">
                <div
                  className="gs-card-icon-box"
                  style={{ backgroundColor: form.color || "#94a3b8" }}
                >
                  <GraduationCap size={22} />
                </div>
                <div className="gs-card-text">
                  <h3 className="gs-card-label">{form.label.trim() || "اسم التقدير"}</h3>
                  <span className="gs-card-range">
                    من {formatPercentage(form.minPercentage)}% إلى {formatPercentage(form.maxPercentage)}%
                  </span>
                </div>
              </div>

              <div className="gs-card-left">
                <div className="gs-card-order">الترتيب: #{form.sortOrder}</div>
                <div className={`gs-card-status-pill ${!form.isActive ? 'gs-card-status-pill--inactive' : ''}`}>
                  {form.isActive ? "فعال" : "معطل"}
                </div>
                <div className="gs-card-actions">
                  <div className="gs-icon-btn"><Sliders size={14} /></div>
                  <div className="gs-icon-btn"><Trash2 size={14} /></div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="حذف التقدير"
        message={`هل أنت متأكد من حذف التقدير "${deleteConfirm?.label ?? ""}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="تأكيد الحذف"
        cancelLabel="إلغاء"
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
}

export default GradeScalesTab;
