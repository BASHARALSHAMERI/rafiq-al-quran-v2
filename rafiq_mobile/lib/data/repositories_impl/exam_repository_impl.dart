import '../../domain/repositories/exam_repository.dart';
import '../datasources/exam_remote_datasource.dart';
import '../models/exam_dtos.dart';

class ExamRepositoryImpl implements ExamRepository {
  final ExamRemoteDataSource remoteDataSource;

  ExamRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<ExamDto>> getExams({
    int? centerId,
    int? circleId,
    String? status,
    String? from,
    String? to,
  }) async {
    return remoteDataSource.getExams(
      centerId: centerId,
      circleId: circleId,
      status: status,
      from: from,
      to: to,
    );
  }

  @override
  Future<ExamDto> createExam(CreateExamRequestDto request) async {
    return remoteDataSource.createExam(request);
  }

  @override
  Future<ExamDto> publishExam(int examId) async {
    return remoteDataSource.publishExam(examId);
  }

  @override
  Future<List<ExamAttemptDto>> getAllAttempts({
    int? centerId,
    int? circleId,
    int? studentId,
  }) async {
    return remoteDataSource.getAllAttempts(
      centerId: centerId,
      circleId: circleId,
      studentId: studentId,
    );
  }

  @override
  Future<List<ExamAttemptDto>> getExamAttempts(int examId) async {
    return remoteDataSource.getExamAttempts(examId);
  }

  @override
  Future<List<ExamNominationDto>> getNominationRequests({
    int? centerId,
    int? circleId,
    int? studentId,
    String? status,
  }) async {
    return remoteDataSource.getNominationRequests(
      centerId: centerId,
      circleId: circleId,
      studentId: studentId,
      status: status,
    );
  }

  @override
  Future<ExamNominationDto> createNominationRequest(
      CreateNominationRequestDto request) async {
    return remoteDataSource.createNominationRequest(request);
  }

  @override
  Future<ExamNominationDto> supervisorReviewNomination(
    int nominationId,
    SupervisorReviewNominationRequestDto request,
  ) async {
    return remoteDataSource.supervisorReviewNomination(nominationId, request);
  }

  @override
  Future<ExamAttemptDto> updateAttemptCommittee(
    int attemptId,
    UpdateAttemptCommitteeRequestDto request,
  ) async {
    return remoteDataSource.updateAttemptCommittee(attemptId, request);
  }

  @override
  Future<ExamAttemptDto> generateAttemptQuestions(
    int attemptId,
    GenerateAttemptQuestionsRequestDto request,
  ) async {
    return remoteDataSource.generateAttemptQuestions(attemptId, request);
  }

  @override
  Future<ExamAttemptDto> createAttemptQuestion(
    int attemptId,
    CreateAttemptQuestionRequestDto request,
  ) async {
    return remoteDataSource.createAttemptQuestion(attemptId, request);
  }

  @override
  Future<ExamAttemptDto> deleteAttemptQuestion(
    int attemptId,
    int questionId,
  ) async {
    return remoteDataSource.deleteAttemptQuestion(attemptId, questionId);
  }

  @override
  Future<ExamAttemptDto> evaluateAttempt(
    int attemptId,
    EvaluateAttemptRequestDto request,
  ) async {
    return remoteDataSource.evaluateAttempt(attemptId, request);
  }

  @override
  Future<ExamAttemptDto> finalizeAttemptEvaluation(int attemptId) async {
    return remoteDataSource.finalizeAttemptEvaluation(attemptId);
  }

  @override
  Future<ExamAttemptDto> approveAttempt(int attemptId) async {
    return remoteDataSource.approveAttempt(attemptId);
  }

  @override
  Future<ExamAttemptDto> publishAttempt(int attemptId) async {
    return remoteDataSource.publishAttempt(attemptId);
  }

  @override
  Future<ExamAttemptDto> reopenAttempt(
    int attemptId,
    ReopenAttemptRequestDto request,
  ) async {
    return remoteDataSource.reopenAttempt(attemptId, request);
  }

  @override
  Future<QuranRangePreviewDto> previewQuranRange({
    required int fromSurah,
    required int fromAyah,
    required int toSurah,
    required int toAyah,
  }) async {
    return remoteDataSource.previewQuranRange(
      fromSurah: fromSurah,
      fromAyah: fromAyah,
      toSurah: toSurah,
      toAyah: toAyah,
    );
  }
}
