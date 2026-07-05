import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { useUsersQuery } from "../../users/users.hooks";
import { useCreateNominationRequestMutation, useExamsQuery } from "../exams.hooks";
import { EXAM_TYPE_LABELS } from "../constants/exam-templates";
import type { ExamNominationRequest } from "../types";

type CenterOption = { id: number; name: string };
type CircleOption = { id: number; name: string; centerId: number };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  centers: CenterOption[];
  circles: CircleOption[];
  initialCenterId?: number;
  onCreated?: (nomination: ExamNominationRequest) => void;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const parsePositiveId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const resolveDefaultCenterId = (centers: CenterOption[], initialCenterId?: number) => {
  if (initialCenterId && centers.some((center) => center.id === initialCenterId)) {
    return String(initialCenterId);
  }

  if (centers.length === 1) {
    return String(centers[0].id);
  }

  return "";
};

export function CenterDirectNominationModal({
  isOpen,
  onClose,
  centers,
  circles,
  initialCenterId,
  onCreated
}: Props) {
  const [centerId, setCenterId] = useState("");
  const [circleId, setCircleId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [examId, setExamId] = useState("");
  const [proposedDate, setProposedDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const createMutation = useCreateNominationRequestMutation();
  const examsQuery = useExamsQuery({ status: "PUBLISHED" }, isOpen);

  const selectedCenterId = parsePositiveId(centerId) ?? undefined;
  const selectedCircleId = parsePositiveId(circleId) ?? undefined;

  const studentsQuery = useUsersQuery(
    {
      role: "STUDENT",
      circleId: selectedCircleId,
      page: 1,
      pageSize: 200
    },
    isOpen && Boolean(selectedCircleId)
  );

  const filteredCircles = useMemo(
    () =>
      selectedCenterId
        ? circles.filter((circle) => circle.centerId === selectedCenterId)
        : circles,
    [circles, selectedCenterId]
  );

  const publishedExams = useMemo(
    () => examsQuery.data ?? [],
    [examsQuery.data]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const defaultCenterId = resolveDefaultCenterId(centers, initialCenterId);
    setCenterId(defaultCenterId);
    setCircleId("");
    setStudentId("");
    setExamId("");
    setProposedDate(todayIso());
    setNotes("");
    setError("");
  }, [centers, initialCenterId, isOpen]);

  const handleClose = () => {
    if (createMutation.isPending) {
      return;
    }

    onClose();
  };

  const validate = () => {
    if (!parsePositiveId(circleId)) {
      return "يرجى اختيار الحلقة.";
    }

    if (!parsePositiveId(studentId)) {
      return "يرجى اختيار الطالب.";
    }

    if (!parsePositiveId(examId)) {
      return "يرجى اختيار قالب الاختبار.";
    }

    if (!proposedDate) {
      return "يرجى تحديد موعد الاختبار.";
    }

    if (notes.trim().length > 2000) {
      return "الملاحظات طويلة جدًا. الحد الأقصى 2000 حرف.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        examId: Number(examId),
        studentId: Number(studentId),
        circleId: Number(circleId),
        proposedExamDate: proposedDate || undefined,
        teacherNotes: notes.trim() || undefined
      });

      onCreated?.(created);
      onClose();
    } catch (submissionError) {
      setError(
        getLocalizedApiErrorMessage(submissionError, {
          ar: true,
          fallback: "تعذر إنشاء الترشيح المباشر الآن. يرجى المحاولة مرة أخرى."
        })
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="ترشيح مباشر"
      size="md"
      panelClassName="exam-approval-modal"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={createMutation.isPending}>
            إلغاء
          </Button>
          <Button form="center-direct-nomination-form" type="submit" variant="primary" isLoading={createMutation.isPending}>
            ترشيح
          </Button>
        </>
      }
    >
      <form id="center-direct-nomination-form" className="exam-attempt-setup" onSubmit={handleSubmit} dir="rtl">
        {error ? (
          <div className="ctr-center-modal__alert" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <strong className="block text-sm">تعذر إكمال الطلب</strong>
              <span className="block text-xs">{error}</span>
            </div>
          </div>
        ) : null}

        <div className="exam-form-grid">
          <label className="exam-field">
            <span>الحلقة</span>
            <select
              value={circleId}
              onChange={(event) => {
                setCircleId(event.target.value);
                setStudentId("");
              }}
              disabled={createMutation.isPending}
            >
              <option value="">اختر الحلقة</option>
              {filteredCircles.map((circle) => (
                <option key={circle.id} value={circle.id}>
                  {circle.name}
                </option>
              ))}
            </select>
          </label>

          <label className="exam-field">
            <span>الطالب</span>
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              disabled={createMutation.isPending || !circleId || studentsQuery.isLoading}
            >
              <option value="">
                {!circleId
                  ? "اختر الحلقة أولًا"
                  : studentsQuery.isLoading
                    ? "جارٍ تحميل الطلاب..."
                    : "اختر الطالب"}
              </option>
              {(studentsQuery.data?.items ?? []).map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="exam-field">
            <span>قالب الاختبار</span>
            <select
              value={examId}
              onChange={(event) => setExamId(event.target.value)}
              disabled={createMutation.isPending || examsQuery.isLoading}
            >
              <option value="">
                {examsQuery.isLoading ? "جارٍ تحميل القوالب..." : "اختر قالب الاختبار"}
              </option>
              {publishedExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({EXAM_TYPE_LABELS[exam.type]})
                </option>
              ))}
            </select>
          </label>

          <label className="exam-field">
            <span>موعد الاختبار</span>
            <input
              type="date"
              value={proposedDate}
              onChange={(event) => setProposedDate(event.target.value)}
              disabled={createMutation.isPending}
            />
          </label>
        </div>

        <label className="exam-field">
          <span>ملاحظات</span>
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="أضف ملاحظات مختصرة مرتبطة بترشيح الطالب."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={createMutation.isPending}
          />
        </label>

      </form>
    </Modal>
  );
}
