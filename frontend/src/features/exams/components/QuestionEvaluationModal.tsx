import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  AlertCircle,
  BookOpen,
  Eye,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  X
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { examsApi } from "../exams.api";
import { getSurahLabel } from "../constants/surah-options";
import type { QuranRangePreview } from "../types";

type QuestionInput = {
  id: number;
  orderIndex: number;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  promptingDeductions: number;
  remindingDeductions: number;
  tajweedDeductions: number;
  isEvaluated: boolean;
};

type Props = {
  isOpen: boolean;
  question: QuestionInput | null;
  canEdit: boolean;
  criteria?: {
    promptingPenalty: number;
    remindingPenalty: number;
    tajweedPenalty: number;
  } | null;
  onClose: () => void;
  onConfirm: (payload: {
    id: number;
    promptingDeductions: number;
    remindingDeductions: number;
    tajweedDeductions: number;
    isEvaluated: boolean;
  }) => void;
};

const clamp = (value: number) => Math.max(0, Math.round(value * 2) / 2);
const formatAyahNumber = (value: number) => `﴿${new Intl.NumberFormat("ar-SA-u-nu-latn").format(value)}﴾`;

export function QuestionEvaluationModal({
  isOpen,
  question,
  canEdit,
  criteria,
  onClose,
  onConfirm
}: Props) {
  const [promptingDeductions, setPromptingDeductions] = useState(0);
  const [remindingDeductions, setRemindingDeductions] = useState(0);
  const [tajweedDeductions, setTajweedDeductions] = useState(0);
  const [preview, setPreview] = useState<QuranRangePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [showMushaf, setShowMushaf] = useState(false);

  useEffect(() => {
    if (!isOpen || !question) return;
    setPromptingDeductions(Number(question.promptingDeductions || 0));
    setRemindingDeductions(Number(question.remindingDeductions || 0));
    setTajweedDeductions(Number(question.tajweedDeductions || 0));
    setShowMushaf(false);
  }, [isOpen, question]);

  useEffect(() => {
    if (!isOpen || !question) return;

    let isCancelled = false;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setPreviewError("");

      try {
        const data = await examsApi.previewQuranRange({
          fromSurah: question.fromSurah,
          fromAyah: question.fromAyah,
          toSurah: question.toSurah,
          toAyah: question.toAyah
        });

        if (!isCancelled) {
          setPreview(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setPreview(null);
          setPreviewError(error instanceof Error ? error.message : "تعذر تحميل المعاينة.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPreview(false);
        }
      }
    };

    void loadPreview();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, question]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape, true);
    return () => document.removeEventListener("keydown", handleEscape, true);
  }, [isOpen, onClose]);

  if (!isOpen || !question) return null;

  const promptingPenalty = criteria?.promptingPenalty ?? 0.5;
  const remindingPenalty = criteria?.remindingPenalty ?? 0.5;
  const tajweedPenalty = criteria?.tajweedPenalty ?? 0.5;
  const totalDeductions = promptingDeductions + remindingDeductions + tajweedDeductions;
  const shouldEnableScroll = showMushaf;

  const changeCounter = (setter: Dispatch<SetStateAction<number>>, delta: number) => {
    setter((current) => clamp(current + delta));
  };

  return (
    <div className="eval-overlay" dir="rtl" onClick={onClose}>
      <div
        className={`eval-shell ${shouldEnableScroll ? "eval-shell--mushaf" : "eval-shell--compact"}`}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: shouldEnableScroll ? "min(720px, 94vw)" : "min(660px, 92vw)",
          maxHeight: "90vh"
        }}
      >
        <header className="eval-header">
          <div className="eval-header__left">
            <h3 className="eval-title">تقييم إجابة السؤال</h3>
            <p className="eval-subtitle">
              سؤال رقم {question.orderIndex} • من {getSurahLabel(question.fromSurah)} إلى{" "}
              {getSurahLabel(question.toSurah)}
            </p>
          </div>
          <button
            type="button"
            className="eval-close-btn"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "50%"
            }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </header>

        <div className="eval-body eval-body--scroll">
          {/* Reference Range Section */}
          <section className="eval-panel eval-panel--refined">
            <div className="eval-panel__head">
              <div className="eval-panel__title">
                <BookOpen size={16} className="eval-panel__icon" />
                <h4>النطاق المرجعي للسؤال</h4>
              </div>
              {preview && (
                <div className="eval-panel__badge">
                  <span>{preview.ayahCount} آية</span>
                  <span className="divider"></span>
                  <span>صفحات {preview.fromPage}-{preview.toPage}</span>
                </div>
              )}
            </div>

            <div className="qem-ayah-panel qem-ayah-panel--modern">
              <div className="qem-ayah-panel__controls">
                <button
                  type="button"
                  className={`qem-action-pill ${showMushaf ? "active" : ""}`}
                  onClick={() => setShowMushaf(!showMushaf)}
                  disabled={!preview || isLoadingPreview}
                >
                  <Eye size={14} />
                  <span>{showMushaf ? "إخفاء المصحف" : "عرض المصحف الكامل"}</span>
                </button>
              </div>

              {isLoadingPreview ? (
                <div className="qem-loading-state">
                  <LoaderCircle size={28} className="animate-spin" />
                  <p>جارٍ جلب الآيات المرجعية...</p>
                </div>
              ) : previewError ? (
                <div className="qem-error-state">
                  <AlertCircle size={24} />
                  <p>{previewError}</p>
                </div>
              ) : preview ? (
                <div className="qem-content-area">
                  {!showMushaf ? (
                    <div className="qem-preview-grid">
                      <div className="qem-preview-item">
                        <header>بداية المقطع</header>
                        <div className="qem-preview-text">
                          <p className="quran-text">{preview.startAyah?.text}</p>
                        </div>
                        <footer>
                          {getSurahLabel(preview.fromSurah)} • آية {preview.fromAyah}
                        </footer>
                      </div>
                      <div className="qem-preview-item">
                        <header>نهاية المقطع</header>
                        <div className="qem-preview-text">
                          <p className="quran-text">{preview.endAyah?.text}</p>
                        </div>
                        <footer>
                          {getSurahLabel(preview.toSurah)} • آية {preview.toAyah}
                        </footer>
                      </div>
                    </div>
                  ) : (
                    <div className="qem-mushaf-view">
                      {preview.surahs.map((surah) => (
                        <div key={surah.surahNumber} className="qem-mushaf-surah">
                          <header>{getSurahLabel(surah.surahNumber)}</header>
                          <div className="qem-mushaf-text">
                            {surah.ayahs.map((ayah) => (
                              <span key={ayah.ayahNumber} className="qem-mushaf-ayah">
                                {ayah.text}
                                <span className="ayah-number">{formatAyahNumber(ayah.ayahNumber)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {/* Deductions Section */}
          <section className="eval-panel eval-panel--refined">
            <div className="eval-panel__head">
              <div className="eval-panel__title">
                <AlertCircle size={16} className="eval-panel__icon" />
                <h4>رصد الأخطاء والخصومات</h4>
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="eval-reset-btn"
                  onClick={() => {
                    setPromptingDeductions(0);
                    setRemindingDeductions(0);
                    setTajweedDeductions(0);
                  }}
                >
                  <RotateCcw size={14} />
                  تصفير الكل
                </button>
              )}
            </div>

            <div className="eval-deductions-grid">
              {[
                {
                  id: "prompting",
                  label: "خطأ تلقيني",
                  value: promptingDeductions,
                  penalty: promptingPenalty,
                  setter: setPromptingDeductions,
                  color: "red",
                },
                {
                  id: "reminding",
                  label: "خطأ تنبيهي",
                  value: remindingDeductions,
                  penalty: remindingPenalty,
                  setter: setRemindingDeductions,
                  color: "amber",
                },
                {
                  id: "tajweed",
                  label: "خطأ تجويدي",
                  value: tajweedDeductions,
                  penalty: tajweedPenalty,
                  setter: setTajweedDeductions,
                  color: "blue",
                },
              ].map((item) => (
                <article key={item.id} className={`eval-deduction-card-v2 eval-deduction-card-v2--${item.color}`}>
                  <div className="eval-deduction-card-v2__info">
                    <h5>{item.label}</h5>
                    <small>لكل مرة: {item.penalty}</small>
                  </div>
                  <div className="eval-deduction-card-v2__counter">
                    <button
                      type="button"
                      onClick={() => changeCounter(item.setter, -item.penalty)}
                      disabled={!canEdit || item.value <= 0}
                      className="counter-btn minus"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="counter-value">{item.value}</span>
                    <button
                      type="button"
                      onClick={() => changeCounter(item.setter, item.penalty)}
                      disabled={!canEdit}
                      className="counter-btn plus"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="eval-total-summary">
              <div className="eval-total-summary__label">
                <span>إجمالي الخصم</span>
                <small>سيتم خصمه من الدرجة النهائية</small>
              </div>
              <div className="eval-total-summary__value">
                {totalDeductions}
              </div>
            </div>
          </section>
        </div>

        <footer className="eval-footer">
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          {canEdit ? (
            <Button
              variant="primary"
              onClick={() =>
                onConfirm({
                  id: question.id,
                  promptingDeductions,
                  remindingDeductions,
                  tajweedDeductions,
                  isEvaluated: true
                })
              }
            >
              اعتماد التقييم للسؤال
            </Button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
