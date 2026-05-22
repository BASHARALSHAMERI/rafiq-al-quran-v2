import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  AttemptFilters,
  CenterApprovalResult,
  CenterApproveNominationPayload,
  CenterReviewNominationPayload,
  CreateAttemptQuestionPayload,
  CreateExamPayload,
  CreateNominationPayload,
  CreateQuestionBankItemPayload,
  EvaluateAttemptPayload,
  ExamAttempt,
  ExamListItem,
  ExamNominationRequest,
  ExamQuestionBankItem,
  ExamsFilters,
  GenerateAttemptQuestionsPayload,
  GenerateQuestionBankPayload,
  NominationFilters,
  QuestionBankFilters,
  ReopenAttemptPayload,
  SupervisorReviewNominationPayload,
  UpdateAttemptCommitteePayload,
  UpdateExamPayload,
  UpdateQuestionBankItemPayload,
  QuranRangePreview
} from "./types";

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

export const examsApi = {
  async getExams(filters: ExamsFilters) {
    const response = await apiClient.get<ApiResponse<ExamListItem[]>>("/exams", {
      params: cleanParams(filters)
    });
    return response.data.data;
  },

  async createExam(payload: CreateExamPayload) {
    const response = await apiClient.post<ApiResponse<ExamListItem>>("/exams", payload);
    return response.data.data;
  },

  async updateExam(examId: number, payload: UpdateExamPayload) {
    const response = await apiClient.patch<ApiResponse<ExamListItem>>(`/exams/${examId}`, payload);
    return response.data.data;
  },

  async deleteExam(examId: number) {
    const response = await apiClient.delete<ApiResponse<ExamListItem>>(`/exams/${examId}`);
    return response.data.data;
  },

  async publishExam(examId: number) {
    const response = await apiClient.post<ApiResponse<ExamListItem>>(`/exams/${examId}/publish`);
    return response.data.data;
  },

  async getNominationRequests(filters: NominationFilters) {
    const response = await apiClient.get<ApiResponse<ExamNominationRequest[]>>("/exam-nominations", {
      params: cleanParams(filters)
    });
    return response.data.data;
  },

  async createNominationRequest(payload: CreateNominationPayload) {
    const response = await apiClient.post<ApiResponse<ExamNominationRequest>>("/exam-nominations", payload);
    return response.data.data;
  },

  async supervisorReviewNominationRequest(
    nominationId: number,
    payload: SupervisorReviewNominationPayload
  ) {
    const response = await apiClient.post<ApiResponse<ExamNominationRequest>>(
      `/exam-nominations/${nominationId}/supervisor-review`,
      payload
    );
    return response.data.data;
  },

  async centerApproveNominationRequest(nominationId: number, payload: CenterApproveNominationPayload) {
    const response = await apiClient.post<ApiResponse<CenterApprovalResult>>(
      `/exam-nominations/${nominationId}/center-approve`,
      payload
    );
    return response.data.data;
  },

  async centerReviewNominationRequest(nominationId: number, payload: CenterReviewNominationPayload) {
    const response = await apiClient.post<ApiResponse<ExamNominationRequest>>(
      `/exam-nominations/${nominationId}/center-review`,
      payload
    );
    return response.data.data;
  },

  async getExamAttempts(examId: number) {
    const response = await apiClient.get<ApiResponse<ExamAttempt[]>>(`/exams/${examId}/attempts`);
    return response.data.data;
  },

  async getAllAttempts(filters: AttemptFilters) {
    const response = await apiClient.get<ApiResponse<ExamAttempt[]>>("/attempts", {
      params: cleanParams(filters)
    });
    return response.data.data;
  },

  async updateAttemptCommittee(attemptId: number, payload: UpdateAttemptCommitteePayload) {
    const response = await apiClient.patch<ApiResponse<ExamAttempt>>(`/attempts/${attemptId}/committee`, payload);
    return response.data.data;
  },

  async generateAttemptQuestions(attemptId: number, payload: GenerateAttemptQuestionsPayload) {
    const response = await apiClient.post<ApiResponse<ExamAttempt>>(
      `/attempts/${attemptId}/questions/generate`,
      payload
    );
    return response.data.data;
  },

  async createAttemptQuestion(attemptId: number, payload: CreateAttemptQuestionPayload) {
    const response = await apiClient.post<ApiResponse<ExamAttempt>>(`/attempts/${attemptId}/questions`, payload);
    return response.data.data;
  },

  async deleteAttemptQuestion(attemptId: number, questionId: number) {
    const response = await apiClient.delete<ApiResponse<ExamAttempt>>(
      `/attempts/${attemptId}/questions/${questionId}`
    );
    return response.data.data;
  },

  async evaluateAttempt(attemptId: number, payload: EvaluateAttemptPayload) {
    const response = await apiClient.post<ApiResponse<ExamAttempt>>(`/attempts/${attemptId}/evaluate`, payload);
    return response.data.data;
  },

  async finalizeAttemptEvaluation(attemptId: number) {
    const response = await apiClient.post<ApiResponse<ExamAttempt>>(
      `/attempts/${attemptId}/finalize-evaluation`,
      {}
    );
    return response.data.data;
  },

  async approveAttempt(attemptId: number) {
    const response = await apiClient.post<ApiResponse<ExamAttempt>>(`/attempts/${attemptId}/approve`, {});
    return response.data.data;
  },

  async publishAttempt(attemptId: number) {
    const response = await apiClient.post<ApiResponse<ExamAttempt>>(`/attempts/${attemptId}/publish`, {});
    return response.data.data;
  },

  async reopenAttemptForQuestionAdjustment(attemptId: number, payload: ReopenAttemptPayload) {
    const response = await apiClient.post<ApiResponse<ExamAttempt>>(
      `/attempts/${attemptId}/reopen-for-question-adjustment`,
      payload
    );
    return response.data.data;
  },

  async getQuestionBank(filters: QuestionBankFilters) {
    const response = await apiClient.get<ApiResponse<ExamQuestionBankItem[]>>("/question-bank", {
      params: cleanParams(filters)
    });
    return response.data.data;
  },

  async createQuestionBankItem(payload: CreateQuestionBankItemPayload) {
    const response = await apiClient.post<ApiResponse<ExamQuestionBankItem>>("/question-bank", payload);
    return response.data.data;
  },

  async updateQuestionBankItem(itemId: number, payload: UpdateQuestionBankItemPayload) {
    const response = await apiClient.patch<ApiResponse<ExamQuestionBankItem>>(
      `/question-bank/${itemId}`,
      payload
    );
    return response.data.data;
  },

  async generateQuestionBankItems(payload: GenerateQuestionBankPayload) {
    const response = await apiClient.post<ApiResponse<ExamQuestionBankItem[]>>(
      "/question-bank/generate",
      payload
    );
    return response.data.data;
  },

  async deleteQuestionBankItem(itemId: number) {
    const response = await apiClient.delete<ApiResponse<ExamQuestionBankItem>>(`/question-bank/${itemId}`);
    return response.data.data;
  },

  async previewQuranRange(payload: {
    fromSurah: number;
    fromAyah: number;
    toSurah: number;
    toAyah: number;
  }) {
    const response = await apiClient.post<ApiResponse<QuranRangePreview>>("/quran/range/preview", payload);
    return response.data.data;
  }
};
