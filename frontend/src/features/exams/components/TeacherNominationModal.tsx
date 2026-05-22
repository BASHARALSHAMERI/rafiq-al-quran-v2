import { useState } from "react";
import { AlertCircle, BookOpen, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Button } from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { useUsersQuery } from "../../users/users.hooks";
import { useCreateNominationRequestMutation, useExamsQuery } from "../exams.hooks";
import type { CreateNominationPayload } from "../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  circleId: number;
  initialStudentId?: number;
};

const EXAM_TYPE_LABELS = {
  JUZ: { ar: "جزء", en: "Juz" },
  FULL_QURAN: { ar: "القرآن كاملًا", en: "Full Quran" },
  SURAH_RANGE: { ar: "نطاق سور", en: "Surah range" },
  OTHER: { ar: "اختبار آخر", en: "Other exam" }
} as const;

export function TeacherNominationModal({ isOpen, onClose, circleId, initialStudentId }: Props) {
  const { language } = useI18n();
  const ar = language === "ar";

  const [studentId, setStudentId] = useState(initialStudentId ? String(initialStudentId) : "");
  const [examId, setExamId] = useState("");
  const [proposedDate, setProposedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const createMutation = useCreateNominationRequestMutation();
  const examsQuery = useExamsQuery({ status: "PUBLISHED" }, isOpen);
  const exams = examsQuery.data ?? [];
  const studentsQuery = useUsersQuery(
    { circleId, role: "STUDENT", page: 1, pageSize: 200 },
    isOpen && Boolean(circleId)
  );
  const students = studentsQuery.data?.items ?? [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!studentId) {
      setError(ar ? "يرجى اختيار الطالب." : "Please select a student.");
      return;
    }

    if (!examId) {
      setError(ar ? "يرجى اختيار نوع الاختبار." : "Please select an exam type.");
      return;
    }

    if (!proposedDate) {
      setError(ar ? "يرجى تحديد التاريخ المقترح." : "Please choose the proposed date.");
      return;
    }

    const payload: CreateNominationPayload = {
      studentId: Number(studentId),
      examId: Number(examId),
      circleId,
      proposedExamDate: proposedDate,
      teacherNotes: notes.trim() || undefined
    };

    try {
      await createMutation.mutateAsync(payload);
      setExamId("");
      setNotes("");
      onClose();
    } catch (submissionError) {
      setError(
        getLocalizedApiErrorMessage(submissionError, {
          ar,
          fallback: ar
            ? "تعذر إرسال طلب الترشيح. يرجى المحاولة مرة أخرى."
            : "Unable to submit the nomination request. Please try again."
        })
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ar ? "طلب ترشيح طالب لاختبار" : "Student nomination request"}
      description={
        ar
          ? "سيُرسل هذا الطلب إلى مدير المركز للمراجعة والاعتماد النهائي."
          : "This request will be sent to the center manager for review and final approval."
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={createMutation.isPending}>
            {ar ? "إرسال الطلب" : "Submit request"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="nomination-form" dir={ar ? "rtl" : "ltr"}>
        {error ? (
          <div className="tp-alert tp-alert--error mb-4">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="exam-form-grid">
          <label className="exam-field">
            <span>{ar ? "الطالب" : "Student"}</span>
            <div className="relative">
              <UserIcon className="absolute right-3 top-3 text-gray-400" size={16} />
              <select
                className="pr-10"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                disabled={Boolean(initialStudentId)}
              >
                <option value="">{ar ? "اختر الطالب..." : "Select student..."}</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="exam-field">
            <span>{ar ? "نوع الاختبار" : "Exam type"}</span>
            <div className="relative">
              <BookOpen className="absolute right-3 top-3 text-gray-400" size={16} />
              <select className="pr-10" value={examId} onChange={(event) => setExamId(event.target.value)}>
                <option value="">{ar ? "اختر الاختبار..." : "Select exam..."}</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} (
                    {ar
                      ? EXAM_TYPE_LABELS[exam.type as keyof typeof EXAM_TYPE_LABELS]?.ar ?? exam.type
                      : EXAM_TYPE_LABELS[exam.type as keyof typeof EXAM_TYPE_LABELS]?.en ?? exam.type}
                    )
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="exam-field">
            <span>{ar ? "التاريخ المقترح" : "Proposed date"}</span>
            <div className="relative">
              <CalendarIcon className="absolute right-3 top-3 text-gray-400" size={16} />
              <input
                type="date"
                className="pr-10"
                value={proposedDate}
                onChange={(event) => setProposedDate(event.target.value)}
              />
            </div>
          </label>
        </div>

        <label className="exam-field mt-4">
          <span>{ar ? "ملاحظات إضافية" : "Additional notes"} ({ar ? "اختياري" : "optional"})</span>
          <textarea
            placeholder={
              ar
                ? "أضف ملاحظات موجزة تدعم طلب الترشيح..."
                : "Add brief notes to support the nomination request..."
            }
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
        </label>
      </form>
    </Modal>
  );
}
