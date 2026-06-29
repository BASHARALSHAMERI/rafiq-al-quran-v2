import { useMemo } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { EvaluateAttemptPayload, ExamAttempt } from "../types";
import type { EvaluationQuestion } from "./evaluation-types";

type ScoreGroup = {
  memorization: number;
  tajweed: number;
  theoreticalTajweed: number;
  performance: number;
};

type DeductionGroup = {
  prompting: number;
  reminding: number;
  tajweed: number;
};

interface ExamCertificationScreenProps {
  exam: {
    title: string;
    maxScore: number;
    passScore: number;
  };
  attempt: ExamAttempt;
  scores: ScoreGroup;
  deductions: DeductionGroup;
  questions: EvaluationQuestion[];
  committeeNotes: string;
  strengthNotes: string;
  weaknessNotes: string;
  onCommitteeNotesChange: (value: string) => void;
  onStrengthNotesChange: (value: string) => void;
  onWeaknessNotesChange: (value: string) => void;
  onBackToWorkspace: () => void;
  onSubmit: (payload: EvaluateAttemptPayload) => Promise<void>;
  isSubmitting: boolean;
}

const clampInt = (value: number, min = 0, max = 1000) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? Math.round(value) : 0));
const clampHalf = (value: number, min = 0, max = 1000) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? Math.round(value * 2) / 2 : 0));

const round2 = (value: number) => Math.round(value * 100) / 100;

export function ExamCertificationScreen({
  exam,
  attempt,
  scores,
  deductions,
  questions,
  committeeNotes,
  strengthNotes,
  weaknessNotes,
  onCommitteeNotesChange,
  onStrengthNotesChange,
  onWeaknessNotesChange,
  onBackToWorkspace,
  onSubmit,
  isSubmitting
}: ExamCertificationScreenProps) {
  const baseScore = exam.maxScore;

  const deductionTotal =
    Number(scores.theoreticalTajweed || 0) +
    Number(scores.performance || 0) +
    Number(deductions.prompting || 0) +
    Number(deductions.reminding || 0) +
    Number(deductions.tajweed || 0);

  const finalScore = Math.max(0, Math.min(exam.maxScore, baseScore - deductionTotal));
  const isPass = finalScore >= exam.passScore;

  const payload = useMemo<EvaluateAttemptPayload>(
    () => ({
      memorizationScore: clampInt(scores.memorization),
      tajweedScore: clampInt(scores.tajweed),
      theoreticalTajweedScore: clampHalf(scores.theoreticalTajweed),
      performanceScore: clampHalf(scores.performance),
      committeeNotes: committeeNotes.trim() || undefined,
      strengthNotes: strengthNotes.trim() || undefined,
      weaknessNotes: weaknessNotes.trim() || undefined,
      questions: questions.map((question) => ({
        id: question.id,
        promptingDeductions: clampHalf(question.prompting),
        remindingDeductions: clampHalf(question.reminding),
        tajweedDeductions: clampHalf(question.tajweed),
        isEvaluated: Boolean(question.evaluated)
      }))
    }),
    [
      committeeNotes,
      questions,
      scores.memorization,
      scores.performance,
      scores.tajweed,
      scores.theoreticalTajweed,
      strengthNotes,
      weaknessNotes
    ]
  );

  const hasUnevaluated = payload.questions.some((question) => !question.isEvaluated);

  return (
    <div className="cert-overlay" dir="rtl">
      <div className="cert-modal">
        <header className="cert-header">
          <div className="cert-header__left">
            <div className="cert-header__icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="cert-header__title">مراجعة التقييم النهائي</h3>
              <div className="cert-header__student">
                {attempt.student?.fullName ?? "الطالب"} | <strong>{exam.title}</strong>
              </div>
            </div>
          </div>
          <div className="cert-live-score">
            <div className={`cert-live-pill ${isPass ? "cert-live-pill--pass" : "cert-live-pill--fail"}`}>
              <span className="cert-live-pill__label">النتيجة الحالية</span>
              <span className="cert-live-pill__value">
                {round2(finalScore).toFixed(2)} <small>/ {exam.maxScore}</small>
              </span>
            </div>
          </div>
        </header>

        <div className="cert-body">
          <div className="cert-grid">
            <section className="cert-card">
              <div className="cert-section-label">
                <FileText size={14} />
                <span>درجات التقييم</span>
              </div>
              <div className="cert-ded cert-ded--blue">
                <span className="cert-ded__name">التجويد النظري</span>
                <span className="cert-ded__val cert-ded__val--blue">{scores.theoreticalTajweed}</span>
              </div>
              <div className="cert-ded cert-ded--blue">
                <span className="cert-ded__name">الأداء</span>
                <span className="cert-ded__val cert-ded__val--blue">{scores.performance}</span>
              </div>
              <div className="cert-ded-total">
                <span>الإجمالي قبل الخصومات</span>
                <span>{round2(baseScore).toFixed(2)}</span>
              </div>
            </section>

            <section className="cert-card">
              <div className="cert-section-label">
                <AlertCircle size={14} />
                <span>الخصومات</span>
              </div>
              <div className="cert-ded cert-ded--red">
                <span className="cert-ded__name">التلقين</span>
                <span className="cert-ded__val cert-ded__val--red">{deductions.prompting}</span>
              </div>
              <div className="cert-ded cert-ded--amber">
                <span className="cert-ded__name">التنبيه</span>
                <span className="cert-ded__val cert-ded__val--amber">{deductions.reminding}</span>
              </div>
              <div className="cert-ded cert-ded--red">
                <span className="cert-ded__name">أخطاء التجويد</span>
                <span className="cert-ded__val cert-ded__val--red">{deductions.tajweed}</span>
              </div>
              <div className="cert-ded-total">
                <span>إجمالي الخصومات</span>
                <span>{round2(deductionTotal).toFixed(2)}</span>
              </div>
            </section>

            <section className="cert-card cert-card--full">
              <div className="cert-section-label">
                <FileText size={14} />
                <span>تفاصيل الأسئلة</span>
              </div>
              <div className="eval-question-table-wrap">
                <table className="eval-question-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>النطاق</th>
                      <th>التلقين</th>
                      <th>التنبيه</th>
                      <th>التجويد</th>
                      <th>تم التقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.length ? (
                      questions.map((question, index) => (
                        <tr key={question.id}>
                          <td>{index + 1}</td>
                          <td>
                            سورة {question.fromSurah} - سورة {question.toSurah}
                          </td>
                          <td>{question.prompting}</td>
                          <td>{question.reminding}</td>
                          <td>{question.tajweed}</td>
                          <td>{question.evaluated ? "نعم" : "لا"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>لا توجد أسئلة مضافة لهذه المحاولة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="cert-card cert-card--full">
              <div className="cert-section-label">
                <FileText size={14} />
                <span>ملاحظات اللجنة</span>
              </div>
              <div className="cert-notes-grid">
                <label className="cert-notes-label">
                  <span>جوانب التميز</span>
                  <textarea
                    className="cert-textarea"
                    value={strengthNotes}
                    onChange={(event) => onStrengthNotesChange(event.target.value)}
                    placeholder="مثل: جمال الصوت، الثبات، حسن الأداء."
                  />
                </label>
                <label className="cert-notes-label">
                  <span>جوانب القصور</span>
                  <textarea
                    className="cert-textarea"
                    value={weaknessNotes}
                    onChange={(event) => onWeaknessNotesChange(event.target.value)}
                    placeholder="مثل: سرعة القراءة، ضعف بعض المواضع، ملاحظات التجويد."
                  />
                </label>
                <label className="cert-notes-label cert-notes-grid__full">
                  <span>الملاحظات النهائية</span>
                  <textarea
                    className="cert-textarea"
                    value={committeeNotes}
                    onChange={(event) => onCommitteeNotesChange(event.target.value)}
                    placeholder="اكتب الخلاصة النهائية المعتمدة قبل حفظ التقييم."
                  />
                </label>
              </div>
            </section>

            {hasUnevaluated ? (
              <div className="cert-callout cert-card--full">
                <AlertCircle size={16} />
                <span>يجب تعليم جميع الأسئلة بأنها مقيمة قبل حفظ التقييم النهائي.</span>
              </div>
            ) : null}
          </div>
        </div>

        <footer className="cert-footer">
          <Button
            variant="ghost"
            onClick={onBackToWorkspace}
            disabled={isSubmitting}
            leftIcon={<ArrowRight size={16} />}
          >
            العودة لمساحة العمل
          </Button>
          <button
            type="button"
            className="cert-submit-btn"
            onClick={() => void onSubmit(payload)}
            disabled={isSubmitting || hasUnevaluated || !payload.questions.length}
          >
            {isSubmitting ? <span className="cert-spinner" /> : <CheckCircle2 />}
            <span>حفظ التقييم</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
