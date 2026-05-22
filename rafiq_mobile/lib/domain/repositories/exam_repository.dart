import '../../data/models/exam_dtos.dart';

abstract class ExamRepository {
  Future<List<ExamDto>> getExams({
    int? centerId,
    int? circleId,
    String? status,
    String? from,
    String? to,
  });

  Future<ExamDto> createExam(CreateExamRequestDto request);

  Future<ExamDto> publishExam(int examId);

  Future<List<ExamAttemptDto>> getAllAttempts({
    int? centerId,
    int? circleId,
    int? studentId,
  });

  Future<List<ExamAttemptDto>> getExamAttempts(int examId);

  Future<List<ExamNominationDto>> getNominationRequests({
    int? centerId,
    int? circleId,
    int? studentId,
    String? status,
  });

  Future<ExamNominationDto> createNominationRequest(
      CreateNominationRequestDto request);

  Future<ExamNominationDto> supervisorReviewNomination(
    int nominationId,
    SupervisorReviewNominationRequestDto request,
  );

  Future<ExamAttemptDto> updateAttemptCommittee(
    int attemptId,
    UpdateAttemptCommitteeRequestDto request,
  );

  Future<ExamAttemptDto> generateAttemptQuestions(
    int attemptId,
    GenerateAttemptQuestionsRequestDto request,
  );

  Future<ExamAttemptDto> createAttemptQuestion(
    int attemptId,
    CreateAttemptQuestionRequestDto request,
  );

  Future<ExamAttemptDto> deleteAttemptQuestion(
    int attemptId,
    int questionId,
  );

  Future<ExamAttemptDto> evaluateAttempt(
      int attemptId, EvaluateAttemptRequestDto request);

  Future<ExamAttemptDto> finalizeAttemptEvaluation(int attemptId);

  Future<ExamAttemptDto> approveAttempt(int attemptId);

  Future<ExamAttemptDto> publishAttempt(int attemptId);

  Future<ExamAttemptDto> reopenAttempt(
    int attemptId,
    ReopenAttemptRequestDto request,
  );

  Future<QuranRangePreviewDto> previewQuranRange({
    required int fromSurah,
    required int fromAyah,
    required int toSurah,
    required int toAyah,
  });
}
