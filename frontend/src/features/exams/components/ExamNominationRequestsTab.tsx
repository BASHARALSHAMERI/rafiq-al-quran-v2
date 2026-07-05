import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, CalendarCheck, CheckCircle2, ChevronDown, PlayCircle, Plus, Search, X } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import Modal from "../../../components/ui/Modal";
import { useAuthStore } from "../../auth/auth.store";
import { useUsersQuery } from "../../users/users.hooks";
import {
  useAllAttemptsQuery,
  useCenterApproveNominationMutation,
  useCenterReviewNominationMutation,
  useNominationRequestsQuery,
  useUpdateAttemptCommitteeMutation
} from "../exams.hooks";
import {
  ATTEMPT_STATUS_LABELS,
  ATTEMPT_STATUS_VARIANTS,
  EXAM_TYPE_LABELS,
  NOMINATION_STATUS_LABELS
} from "../constants/exam-templates";
import type {
  ExamAttempt,
  ExamCommitteeRole,
  ExamNominationRequest,
  NominationRequestStatus
} from "../types";
import { CenterDirectNominationModal } from "./CenterDirectNominationModal";
import { ExamEvaluationWorkspace } from "./ExamEvaluationWorkspace";

type CenterOption = { id: number; name: string };
type CircleOption = { id: number; name: string; centerId: number };
type CommitteeOption = { id: number; fullName: string; role: string };

type ApprovalFormState = {
  examDate: string;
  fullQuranCompletedAt: string;
  chairId: string;
  memberIds: number[];
};

const emptyApprovalForm = (): ApprovalFormState => ({
  examDate: "",
  fullQuranCompletedAt: "",
  chairId: "",
  memberIds: []
});

const dateFormatter = new Intl.DateTimeFormat("ar-SA-u-nu-latn");

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : dateFormatter.format(parsed);
};

const parsePositiveId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const roleLabel = (role?: string) => {
  if (role === "CENTER_ADMIN") return "مدير المركز";
  if (role === "SUPERVISOR") return "مشرف";
  if (role === "TEACHER") return "معلم";
  return role ?? "";
};

const nominationStatusVariant = (status: NominationRequestStatus) => {
  switch (status) {
    case "CENTER_APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    case "SUPERVISOR_APPROVED":
    case "SUBMITTED":
      return "warning";
    default:
      return "secondary";
  }
};

const canSetupNomination = (nomination: ExamNominationRequest) =>
  !nomination.attempt &&
  ["SUBMITTED", "SUPERVISOR_APPROVED", "CENTER_APPROVED"].includes(nomination.status);

const isDirectCenterNomination = (nomination: ExamNominationRequest, userId?: number) =>
  nomination.status === "CENTER_APPROVED" &&
  nomination.createdById === userId;

const approvalMutationErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("official attempt already exists")) {
    return "توجد محاولة رسمية مرتبطة بهذا الترشيح بالفعل.";
  }

  if (message.includes("committee")) {
    return "تعذر اعتماد اللجنة المحددة. تأكد أن الأعضاء من نفس المركز وبصلاحيات مناسبة.";
  }

  if (message.includes("Nomination must")) {
    return "لا يمكن إنشاء محاولة رسمية لهذا الترشيح في حالته الحالية.";
  }

  return "تعذر حفظ اللجنة الآن. راجع البيانات وحاول مرة أخرى.";
};

export function ExamNominationRequestsTab({
  centers,
  circles
}: {
  centers: CenterOption[];
  circles: CircleOption[];
}) {
  const user = useAuthStore((state) => state.user);
  const isCenterAdmin = user?.role === "CENTER_ADMIN";

  const [search, setSearch] = useState("");
  const [circleId, setCircleId] = useState<number | undefined>();
  const [approvalTarget, setApprovalTarget] = useState<ExamNominationRequest | null>(null);
  const [attemptSetupTarget, setAttemptSetupTarget] = useState<ExamAttempt | null>(null);
  const [approvalForm, setApprovalForm] = useState<ApprovalFormState>(emptyApprovalForm());
  const [approvalError, setApprovalError] = useState("");
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [directNominationOpen, setDirectNominationOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const nominationsQuery = useNominationRequestsQuery({ circleId }, Boolean(user && isCenterAdmin));
  const attemptsQuery = useAllAttemptsQuery({ circleId }, Boolean(user && isCenterAdmin));

  const centerApproveMutation = useCenterApproveNominationMutation();
  const centerReviewMutation = useCenterReviewNominationMutation();
  const updateAttemptCommitteeMutation = useUpdateAttemptCommitteeMutation();

  const committeeCenterId = approvalTarget?.centerId ?? attemptSetupTarget?.circle?.centerId ?? centers[0]?.id;
  const committeeQueryEnabled = Boolean((approvalTarget || attemptSetupTarget) && committeeCenterId);
  const centerAdminsQuery = useUsersQuery(
    { role: "CENTER_ADMIN", centerId: committeeCenterId, page: 1, pageSize: 200 },
    committeeQueryEnabled
  );
  const supervisorsQuery = useUsersQuery(
    { role: "SUPERVISOR", centerId: committeeCenterId, page: 1, pageSize: 200 },
    committeeQueryEnabled
  );
  const teachersQuery = useUsersQuery(
    { role: "TEACHER", centerId: committeeCenterId, page: 1, pageSize: 200 },
    committeeQueryEnabled
  );

  const committeeUsers = useMemo(() => {
    const map = new Map<number, CommitteeOption>();

    [
      ...(centerAdminsQuery.data?.items ?? []),
      ...(supervisorsQuery.data?.items ?? []),
      ...(teachersQuery.data?.items ?? [])
    ].forEach((item) => {
      map.set(item.id, {
        id: item.id,
        fullName: item.fullName,
        role: roleLabel(item.role)
      });
    });

    if (user?.id && user.fullName && user.role === "CENTER_ADMIN") {
      map.set(user.id, { id: user.id, fullName: user.fullName, role: "مدير المركز" });
    }

    return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
  }, [centerAdminsQuery.data, supervisorsQuery.data, teachersQuery.data, user?.fullName, user?.id, user?.role]);

  const attemptsById = useMemo(() => {
    const map = new Map<number, ExamAttempt>();
    (attemptsQuery.data ?? []).forEach((attempt) => map.set(attempt.id, attempt));
    return map;
  }, [attemptsQuery.data]);

  const filteredCircles = useMemo(() => {
    const scopedCenterId = centers.length === 1 ? centers[0].id : undefined;
    return scopedCenterId ? circles.filter((circle) => circle.centerId === scopedCenterId) : circles;
  }, [centers, circles]);

  const visibleNominations = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (nominationsQuery.data ?? [])
      .filter(
        (nomination) =>
          canSetupNomination(nomination) || isDirectCenterNomination(nomination, user?.id)
      )
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));

    if (!q) return rows;

    return rows.filter((nomination) =>
      [
        nomination.student?.fullName,
        nomination.exam?.title,
        nomination.circle?.name,
        nomination.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [nominationsQuery.data, search, user?.id]);

  const activeSetupExamType = approvalTarget?.exam?.type ?? attemptSetupTarget?.exam?.type;
  const isSetupSaving = centerApproveMutation.isPending || updateAttemptCommitteeMutation.isPending;
  const setupExamDate = attemptSetupTarget?.examDate?.slice(0, 10) ?? approvalTarget?.proposedExamDate?.slice(0, 10) ?? "";
  const selectedChairId = parsePositiveId(approvalForm.chairId);
  const selectedChair = committeeUsers.find((member) => member.id === selectedChairId) ?? null;
  const selectedMembers = approvalForm.memberIds
    .map((id) => committeeUsers.find((member) => member.id === id))
    .filter(Boolean) as CommitteeOption[];

  const availableMemberOptions = committeeUsers.filter(
    (member) => member.id !== selectedChairId && !approvalForm.memberIds.includes(member.id)
  );

  useEffect(() => {
    if (!approvalTarget && !attemptSetupTarget) {
      setApprovalForm(emptyApprovalForm());
      setApprovalError("");
      return;
    }

    if (attemptSetupTarget) {
      const chair = attemptSetupTarget.committeeMembers?.find((member) => member.committeeRole === "CHAIR");
      const members =
        attemptSetupTarget.committeeMembers
          ?.filter((member) => member.committeeRole === "MEMBER")
          .map((member) => member.userId) ?? [];

      setApprovalForm({
        examDate: attemptSetupTarget.examDate?.slice(0, 10) ?? "",
        fullQuranCompletedAt: attemptSetupTarget.fullQuranCompletedAt?.slice(0, 10) ?? "",
        chairId: chair?.userId ? String(chair.userId) : "",
        memberIds: members
      });
      setApprovalError("");
      return;
    }

    setApprovalForm({
      examDate: approvalTarget?.proposedExamDate?.slice(0, 10) ?? "",
      fullQuranCompletedAt: "",
      chairId: "",
      memberIds: []
    });
    setApprovalError("");
  }, [approvalTarget, attemptSetupTarget]);

  const closeCommitteeModal = () => {
    if (isSetupSaving) return;
    setApprovalTarget(null);
    setAttemptSetupTarget(null);
  };

  const openCommitteeSetup = (nomination: ExamNominationRequest) => {
    setSuccessMessage("");
    setAttemptSetupTarget(null);
    setApprovalTarget(nomination);
  };

  const openCommitteeEdit = (attempt: ExamAttempt) => {
    setSuccessMessage("");
    setApprovalTarget(null);
    setAttemptSetupTarget(attempt);
  };

  const setChair = (member: CommitteeOption) => {
    setApprovalForm((current) => ({
      ...current,
      chairId: String(member.id),
      memberIds: current.memberIds.filter((id) => id !== member.id)
    }));
  };

  const addMember = (member: CommitteeOption) => {
    setApprovalForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(member.id) ? current.memberIds : [...current.memberIds, member.id]
    }));
  };

  const handleChairChange = (value: string) => {
    const member = committeeUsers.find((option) => option.id === Number(value));
    if (member) setChair(member);
  };

  const handleMemberSelect = (value: string) => {
    const member = committeeUsers.find((option) => option.id === Number(value));
    if (member) addMember(member);
  };

  const removeMember = (memberId: number) => {
    setApprovalForm((current) => ({
      ...current,
      memberIds: current.memberIds.filter((id) => id !== memberId)
    }));
  };

  const validateApprovalForm = () => {
    if (!approvalTarget && !attemptSetupTarget) return "تعذر تحديد الاختبار المطلوب.";
    if (!setupExamDate) return "يجب تحديد موعد الاختبار في الترشيح قبل تعيين اللجنة.";
    if (!selectedChairId) return "اختر رئيس اللجنة.";

    if (activeSetupExamType === "FULL_QURAN") {
      if (!approvalForm.fullQuranCompletedAt) return "أدخل تاريخ إتمام الحفظ.";
      if (approvalForm.fullQuranCompletedAt > setupExamDate) {
        return "تاريخ إتمام الحفظ لا يمكن أن يكون بعد موعد الاختبار.";
      }
    }

    return "";
  };

  const handleSaveCommittee = async (event: FormEvent) => {
    event.preventDefault();
    setApprovalError("");

    const validationError = validateApprovalForm();
    if (validationError) {
      setApprovalError(validationError);
      return;
    }

    if (!selectedChairId) return;

    const committeeMembers: Array<{ userId: number; committeeRole: ExamCommitteeRole }> = [
      { userId: selectedChairId, committeeRole: "CHAIR" },
      ...approvalForm.memberIds
        .filter((memberId) => memberId !== selectedChairId)
        .map((memberId) => ({ userId: memberId, committeeRole: "MEMBER" as const }))
    ];

    try {
      if (attemptSetupTarget) {
        await updateAttemptCommitteeMutation.mutateAsync({
          attemptId: attemptSetupTarget.id,
          payload: {
            examDate: setupExamDate,
            fullQuranCompletedAt:
              activeSetupExamType === "FULL_QURAN" ? approvalForm.fullQuranCompletedAt || null : null,
            lockVersion: attemptSetupTarget.lockVersion,
            committeeMembers
          }
        });

        setSuccessMessage("تم تحديث اللجنة.");
        closeCommitteeModal();
        return;
      }

      if (!approvalTarget) return;

      await centerApproveMutation.mutateAsync({
        nominationId: approvalTarget.id,
        payload: {
          examDate: setupExamDate,
          fullQuranCompletedAt:
            activeSetupExamType === "FULL_QURAN" ? approvalForm.fullQuranCompletedAt || null : null,
          committeeMembers
        }
      });

      setSuccessMessage("تم تعيين اللجنة وإنشاء الاختبار.");
      closeCommitteeModal();
    } catch (mutationError) {
      setApprovalError(approvalMutationErrorMessage(mutationError));
    }
  };

  const handleRejectNomination = async (nomination: ExamNominationRequest) => {
    const notes = window.prompt("اذكر سبب رفض الترشيح", "");
    if (notes === null) return;

    try {
      await centerReviewMutation.mutateAsync({
        nominationId: nomination.id,
        payload: { decision: "REJECT", notes: notes.trim() || undefined }
      });
    } catch {
      // Mutation state is already reflected through react-query invalidation.
    }
  };

  if (!isCenterAdmin) return null;

  return (
    <div className="exams-registry-tab" dir="rtl">
      <CenterDirectNominationModal
        isOpen={directNominationOpen}
        onClose={() => setDirectNominationOpen(false)}
        centers={centers}
        circles={circles}
        onCreated={() => setSuccessMessage("تم إنشاء الترشيح.")}
      />

      <div className="exams-toolbar exams-toolbar--registry">
        <div className="exams-toolbar__filters">
          <div className="exams-search-box">
            <Search size={15} className="exams-search-box__icon" />
            <input
              className="exams-search-box__input"
              placeholder="ابحث باسم الطالب أو الاختبار"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label="تصفية حسب الحلقة"
            className="exams-filters__select"
            value={circleId ?? ""}
            onChange={(event) => setCircleId(event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">كل الحلقات</option>
            {filteredCircles.map((circle) => (
              <option key={circle.id} value={circle.id}>
                {circle.name}
              </option>
            ))}
          </select>
        </div>

        <div className="exams-toolbar__actions">
          <Button
            variant="primary"
            onClick={() => {
              setSuccessMessage("");
              setDirectNominationOpen(true);
            }}
          >
            <Plus size={15} />
            ترشيح مباشر
          </Button>
        </div>
      </div>

      {successMessage ? (
        <div className="exam-evaluation__success" role="status">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <section className="exams-table-card exams-registry-section">
        <div className="exams-registry-section__header">
          <h3>طلبات الاختبار</h3>
          <Badge variant={visibleNominations.length ? "warning" : "secondary"} size="sm">
            {visibleNominations.length}
          </Badge>
        </div>

        {nominationsQuery.isLoading ? (
          <div className="exams-table-loading">جاري التحميل...</div>
        ) : visibleNominations.length === 0 ? (
          <div style={{ padding: 16 }}>
            <EmptyState icon={<Plus size={32} />} title="لا توجد طلبات" description="" />
          </div>
        ) : (
          <div className="exams-table-wrap">
            <table className="exams-table exams-table--attempts">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الاختبار</th>
                  <th>الحلقة</th>
                  <th>الموعد</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {visibleNominations.map((nomination) => {
                  const officialAttempt = nomination.attempt
                    ? attemptsById.get(nomination.attempt.id) ?? null
                    : null;
                  const canReject = nomination.status === "SUBMITTED";

                  return (
                    <tr key={nomination.id}>
                      <td>{nomination.student?.fullName ?? "—"}</td>
                      <td>
                        <div className="exam-registry__template">
                          <strong>{nomination.exam?.title ?? "—"}</strong>
                          <span>{EXAM_TYPE_LABELS[nomination.exam?.type ?? "JUZ"]}</span>
                        </div>
                      </td>
                      <td>{nomination.circle?.name ?? "—"}</td>
                      <td>{formatDate(nomination.attempt?.examDate ?? nomination.proposedExamDate)}</td>
                      <td>
                        {nomination.attempt ? (
                          <Badge variant={ATTEMPT_STATUS_VARIANTS[nomination.attempt.status]} size="sm">
                            {ATTEMPT_STATUS_LABELS[nomination.attempt.status]}
                          </Badge>
                        ) : (
                          <Badge variant={nominationStatusVariant(nomination.status)} size="sm">
                            {NOMINATION_STATUS_LABELS[nomination.status] ?? nomination.status}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div className="exam-table__actions">
                          {!nomination.attempt ? (
                            <Button variant="primary" onClick={() => openCommitteeSetup(nomination)}>
                              <CalendarCheck size={14} />
                              تعيين اللجنة
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="secondary"
                                disabled={!officialAttempt}
                                isLoading={attemptsQuery.isLoading}
                                onClick={() => officialAttempt && openCommitteeEdit(officialAttempt)}
                              >
                                <CalendarCheck size={14} />
                                تعديل اللجنة
                              </Button>
                              <Button
                                variant="primary"
                                disabled={!officialAttempt}
                                isLoading={attemptsQuery.isLoading}
                                onClick={() => officialAttempt && setSelectedAttempt(officialAttempt)}
                              >
                                <PlayCircle size={14} />
                                إجراء الاختبار
                              </Button>
                            </>
                          )}
                          {canReject ? (
                            <Button
                              variant="danger"
                              onClick={() => void handleRejectNomination(nomination)}
                              isLoading={centerReviewMutation.isPending}
                            >
                              رفض
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        isOpen={Boolean(approvalTarget || attemptSetupTarget)}
        onClose={closeCommitteeModal}
        title="تعيين اللجنة"
        size="md"
        panelClassName="exam-approval-modal"
        footer={
          <>
            <Button variant="ghost" onClick={closeCommitteeModal} disabled={isSetupSaving}>
              إلغاء
            </Button>
            <Button form="nomination-approval-form" type="submit" variant="primary" isLoading={isSetupSaving}>
              حفظ
            </Button>
          </>
        }
      >
        {approvalTarget || attemptSetupTarget ? (
          <form id="nomination-approval-form" className="exam-attempt-setup" onSubmit={handleSaveCommittee}>
            {approvalError ? (
              <div className="ctr-center-modal__alert" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="block text-xs">{approvalError}</span>
              </div>
            ) : null}

            <div className="exam-attempt-setup__summary">
              <div>
                <span>الطالب</span>
                <strong>{approvalTarget?.student?.fullName ?? attemptSetupTarget?.student?.fullName ?? "—"}</strong>
              </div>
              <div>
                <span>الاختبار</span>
                <strong>{approvalTarget?.exam?.title ?? attemptSetupTarget?.exam?.title ?? "—"}</strong>
              </div>
              <div>
                <span>الحلقة</span>
                <strong>{approvalTarget?.circle?.name ?? attemptSetupTarget?.circle?.name ?? "—"}</strong>
              </div>
              <div>
                <span>الموعد</span>
                <strong>{formatDate(setupExamDate)}</strong>
              </div>
            </div>

            {activeSetupExamType === "FULL_QURAN" ? (
              <label className="exam-field">
                <span>تاريخ إتمام الحفظ</span>
                <input
                  type="date"
                  value={approvalForm.fullQuranCompletedAt}
                  onChange={(event) =>
                    setApprovalForm((current) => ({ ...current, fullQuranCompletedAt: event.target.value }))
                  }
                />
              </label>
            ) : null}

            <div className="exam-form-section exam-committee-picker">
              <label className="exam-field">
                <span>رئيس اللجنة</span>
                <span className="exam-select-control">
                  <select value={approvalForm.chairId} onChange={(event) => handleChairChange(event.target.value)}>
                    <option value="">اختر رئيس اللجنة</option>
                    {committeeUsers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName} - {member.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </label>
              {selectedChair ? (
                <div className="exam-committee-picker__chips">
                  <span className="exam-committee-chip exam-committee-chip--chair">
                    {selectedChair.fullName} - {selectedChair.role}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="exam-form-section exam-committee-picker">
              <label className="exam-field">
                <span>أعضاء اللجنة</span>
                <span className="exam-select-control">
                  <select value="" onChange={(event) => handleMemberSelect(event.target.value)}>
                    <option value="">اختر الاعضاء</option>
                    {availableMemberOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName} - {member.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </label>
              {selectedMembers.length ? (
                <div className="exam-committee-picker__chips">
                  {selectedMembers.map((member) => (
                    <span key={member.id} className="exam-committee-chip">
                      {member.fullName} - {member.role}
                      <button type="button" onClick={() => removeMember(member.id)} aria-label="إزالة">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </form>
        ) : null}
      </Modal>

      {selectedAttempt ? (
        <ExamEvaluationWorkspace
          attempt={selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
          onUpdated={(nextAttempt) => setSelectedAttempt(nextAttempt)}
        />
      ) : null}
    </div>
  );
}
