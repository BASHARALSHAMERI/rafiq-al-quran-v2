import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { getSurahAyahCount, getSurahLabel, SURAH_OPTIONS } from "../constants/surah-options";
import type { CreateAttemptQuestionPayload, ExamAttemptRange } from "../types";

type Props = {
  isOpen: boolean;
  examRange?: ExamAttemptRange | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAttemptQuestionPayload) => void;
};

const isOrderedRange = (payload: CreateAttemptQuestionPayload) =>
  payload.fromSurah < payload.toSurah ||
  (payload.fromSurah === payload.toSurah && payload.fromAyah <= payload.toAyah);

const isRangeWithinBoundary = (boundary: ExamAttemptRange, payload: CreateAttemptQuestionPayload) => {
  const startsInside =
    boundary.fromSurah < payload.fromSurah ||
    (boundary.fromSurah === payload.fromSurah && boundary.fromAyah <= payload.fromAyah);
  const endsInside =
    boundary.toSurah > payload.toSurah ||
    (boundary.toSurah === payload.toSurah && boundary.toAyah >= payload.toAyah);

  return startsInside && endsInside;
};

export function ManualAttemptQuestionModal({
  isOpen,
  examRange,
  isSubmitting,
  onClose,
  onSubmit
}: Props) {
  const [fromSurah, setFromSurah] = useState(1);
  const [fromAyah, setFromAyah] = useState(1);
  const [toSurah, setToSurah] = useState(1);
  const [toAyah, setToAyah] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    const defaultFromSurah = examRange?.fromSurah ?? 1;
    const defaultFromAyah = examRange?.fromAyah ?? 1;
    const defaultToSurah = defaultFromSurah;
    const defaultToAyah = Math.min(getSurahAyahCount(defaultToSurah), defaultFromAyah + 2);

    setFromSurah(defaultFromSurah);
    setFromAyah(defaultFromAyah);
    setToSurah(defaultToSurah);
    setToAyah(defaultToAyah);
  }, [examRange, isOpen]);

  useEffect(() => {
    const max = getSurahAyahCount(fromSurah);
    setFromAyah(current => Math.min(Math.max(1, current), max));
  }, [fromSurah]);

  useEffect(() => {
    const max = getSurahAyahCount(toSurah);
    setToAyah(current => Math.min(Math.max(1, current), max));
  }, [toSurah]);

  const payload = useMemo(() => ({ fromSurah, fromAyah, toSurah, toAyah }), [fromAyah, fromSurah, toAyah, toSurah]);

  const validationMessage = useMemo(() => {
    if (!isOrderedRange(payload)) return "ترتيب السؤال غير صحيح. يجب أن تكون البداية قبل النهاية.";
    if (examRange && !isRangeWithinBoundary(examRange, payload)) return "السؤال اليدوي يجب أن يبقى داخل نطاق الاختبار المحدد.";
    return "";
  }, [examRange, payload]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة سؤال يدوي للمحاولة"
      size="md"
      hideFooter
      panelClassName="ew-modal--manual"
    >
      <div className="eval-body" style={{ padding: '1.25rem' }}>
        {examRange && (
          <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', padding: '0.75rem', borderRadius: '10px', display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <Info size={14} color="#0369a1" style={{ marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', margin: 0 }}>نطاق الاختبار المعتمد</p>
              <p style={{ fontSize: '0.75rem', color: '#0c4a6e', margin: '0.15rem 0 0' }}>
                من {getSurahLabel(examRange.fromSurah)} ({examRange.fromAyah}) إلى {getSurahLabel(examRange.toSurah)} ({examRange.toAyah})
              </p>
            </div>
          </div>
        )}

        <div className="eval-range-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="eval-field">
            <label>من سورة</label>
            <select value={fromSurah} onChange={e => setFromSurah(Number(e.target.value))}>
              {SURAH_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="eval-field">
            <label>من آية</label>
            <select value={fromAyah} onChange={e => setFromAyah(Number(e.target.value))}>
              {Array.from({ length: getSurahAyahCount(fromSurah) }, (_, i) => i + 1).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="eval-field">
            <label>إلى سورة</label>
            <select value={toSurah} onChange={e => setToSurah(Number(e.target.value))}>
              {SURAH_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="eval-field">
            <label>إلى آية</label>
            <select value={toAyah} onChange={e => setToAyah(Number(e.target.value))}>
              {Array.from({ length: getSurahAyahCount(toSurah) }, (_, i) => i + 1).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {validationMessage && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '0.7rem', fontWeight: 600 }}>
            {validationMessage}
          </div>
        )}

        <div className="eval-footer" style={{ padding: '1.25rem 0 0', marginTop: '1.5rem' }}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>إلغاء</Button>
          <Button variant="primary" onClick={() => onSubmit(payload)} isLoading={isSubmitting} disabled={Boolean(validationMessage)}>
            إضافة السؤال للقائمة
          </Button>
        </div>
      </div>
    </Modal>
  );
}
