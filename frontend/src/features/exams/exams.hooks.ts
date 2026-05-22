import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi } from "./exams.api";
import type {
  AttemptFilters,
  CenterApproveNominationPayload,
  CenterReviewNominationPayload,
  CreateAttemptQuestionPayload,
  CreateExamPayload,
  CreateNominationPayload,
  CreateQuestionBankItemPayload,
  EvaluateAttemptPayload,
  ExamsFilters,
  GenerateAttemptQuestionsPayload,
  GenerateQuestionBankPayload,
  NominationFilters,
  QuestionBankFilters,
  ReopenAttemptPayload,
  SupervisorReviewNominationPayload,
  UpdateAttemptCommitteePayload,
  UpdateExamPayload,
  UpdateQuestionBankItemPayload
} from "./types";

const examsFiltersKey = (filters: ExamsFilters) =>
  [
    filters.centerId ?? null,
    filters.circleId ?? null,
    filters.purpose ?? null,
    filters.status ?? null,
    filters.from ?? null,
    filters.to ?? null
  ] as const;

const attemptFiltersKey = (filters: AttemptFilters) =>
  [
    filters.centerId ?? null,
    filters.circleId ?? null,
    filters.studentId ?? null,
    filters.purpose ?? null
  ] as const;

const nominationFiltersKey = (filters: NominationFilters) =>
  [
    filters.centerId ?? null,
    filters.circleId ?? null,
    filters.studentId ?? null,
    filters.status ?? null
  ] as const;

const questionBankFiltersKey = (filters: QuestionBankFilters) =>
  [
    filters.fromSurah ?? null,
    filters.toSurah ?? null,
    filters.difficultyLevel ?? null,
    filters.source ?? null,
    filters.search ?? null
  ] as const;

export const EXAMS_QUERY_KEYS = {
  all: ["exams"] as const,
  list: (filters: ExamsFilters) => [...EXAMS_QUERY_KEYS.all, "list", ...examsFiltersKey(filters)] as const,
  allAttempts: (filters: AttemptFilters) =>
    [...EXAMS_QUERY_KEYS.all, "attempts_all", ...attemptFiltersKey(filters)] as const,
  nominations: (filters: NominationFilters) =>
    [...EXAMS_QUERY_KEYS.all, "nominations", ...nominationFiltersKey(filters)] as const,
  questionBank: (filters: QuestionBankFilters) =>
    [...EXAMS_QUERY_KEYS.all, "question_bank", ...questionBankFiltersKey(filters)] as const
};

const invalidateExamState = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: EXAMS_QUERY_KEYS.all });
};

export const useExamsQuery = (filters: ExamsFilters, enabled = true) =>
  useQuery({
    queryKey: EXAMS_QUERY_KEYS.list(filters),
    queryFn: () => examsApi.getExams(filters),
    enabled,
    staleTime: 30_000
  });

export const useAllAttemptsQuery = (filters: AttemptFilters, enabled = true) =>
  useQuery({
    queryKey: EXAMS_QUERY_KEYS.allAttempts(filters),
    queryFn: () => examsApi.getAllAttempts(filters),
    enabled,
    staleTime: 15_000
  });

export const useExamAttemptsQuery = (examId: number | null, enabled: boolean) =>
  useQuery({
    queryKey: [...EXAMS_QUERY_KEYS.all, "attempts_by_exam", examId ?? 0] as const,
    queryFn: () => examsApi.getExamAttempts(examId ?? 0),
    enabled: enabled && Boolean(examId),
    staleTime: 15_000
  });

export const useNominationRequestsQuery = (filters: NominationFilters, enabled = true) =>
  useQuery({
    queryKey: EXAMS_QUERY_KEYS.nominations(filters),
    queryFn: () => examsApi.getNominationRequests(filters),
    enabled,
    staleTime: 15_000
  });

export const useQuestionBankQuery = (filters: QuestionBankFilters, enabled = true) =>
  useQuery({
    queryKey: EXAMS_QUERY_KEYS.questionBank(filters),
    queryFn: () => examsApi.getQuestionBank(filters),
    enabled,
    staleTime: 20_000
  });

export const useCreateExamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExamPayload) => examsApi.createExam(payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useUpdateExamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { examId: number; payload: UpdateExamPayload }) =>
      examsApi.updateExam(input.examId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useDeleteExamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: number) => examsApi.deleteExam(examId),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const usePublishExamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: number) => examsApi.publishExam(examId),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useCreateNominationRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNominationPayload) => examsApi.createNominationRequest(payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useSupervisorReviewNominationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { nominationId: number; payload: SupervisorReviewNominationPayload }) =>
      examsApi.supervisorReviewNominationRequest(input.nominationId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useCenterApproveNominationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { nominationId: number; payload: CenterApproveNominationPayload }) =>
      examsApi.centerApproveNominationRequest(input.nominationId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useCenterReviewNominationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { nominationId: number; payload: CenterReviewNominationPayload }) =>
      examsApi.centerReviewNominationRequest(input.nominationId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useUpdateAttemptCommitteeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { attemptId: number; payload: UpdateAttemptCommitteePayload }) =>
      examsApi.updateAttemptCommittee(input.attemptId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useGenerateAttemptQuestionsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { attemptId: number; payload: GenerateAttemptQuestionsPayload }) =>
      examsApi.generateAttemptQuestions(input.attemptId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useCreateAttemptQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { attemptId: number; payload: CreateAttemptQuestionPayload }) =>
      examsApi.createAttemptQuestion(input.attemptId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useDeleteAttemptQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { attemptId: number; questionId: number }) =>
      examsApi.deleteAttemptQuestion(input.attemptId, input.questionId),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useEvaluateAttemptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { attemptId: number; payload: EvaluateAttemptPayload }) =>
      examsApi.evaluateAttempt(input.attemptId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useFinalizeAttemptEvaluationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attemptId: number) => examsApi.finalizeAttemptEvaluation(attemptId),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useApproveAttemptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attemptId: number) => examsApi.approveAttempt(attemptId),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const usePublishAttemptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attemptId: number) => examsApi.publishAttempt(attemptId),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useReopenAttemptForQuestionAdjustmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { attemptId: number; payload: ReopenAttemptPayload }) =>
      examsApi.reopenAttemptForQuestionAdjustment(input.attemptId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useCreateQuestionBankItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuestionBankItemPayload) => examsApi.createQuestionBankItem(payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useUpdateQuestionBankItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { itemId: number; payload: UpdateQuestionBankItemPayload }) =>
      examsApi.updateQuestionBankItem(input.itemId, input.payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useGenerateQuestionBankItemsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateQuestionBankPayload) => examsApi.generateQuestionBankItems(payload),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};

export const useDeleteQuestionBankItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => examsApi.deleteQuestionBankItem(itemId),
    onSuccess: async () => {
      await invalidateExamState(queryClient);
    }
  });
};
