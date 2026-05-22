import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/exam_dtos.dart';
import '../../domain/repositories/exam_repository.dart';
import 'exam_providers.dart';

class ExamState {
  static const _sentinel = Object();

  final bool isLoading;
  final bool isSubmitting;
  final bool hasLoaded;
  final String? error;
  final String? actionError;
  final List<ExamDto> publishedExams;
  final List<ExamAttemptDto> attempts;
  final List<ExamNominationDto> nominations;

  const ExamState({
    this.isLoading = false,
    this.isSubmitting = false,
    this.hasLoaded = false,
    this.error,
    this.actionError,
    this.publishedExams = const [],
    this.attempts = const [],
    this.nominations = const [],
  });

  bool get hasContent =>
      publishedExams.isNotEmpty ||
      attempts.isNotEmpty ||
      nominations.isNotEmpty;

  ExamState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    bool? hasLoaded,
    Object? error = _sentinel,
    Object? actionError = _sentinel,
    List<ExamDto>? publishedExams,
    List<ExamAttemptDto>? attempts,
    List<ExamNominationDto>? nominations,
  }) {
    return ExamState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      hasLoaded: hasLoaded ?? this.hasLoaded,
      error: identical(error, _sentinel) ? this.error : error as String?,
      actionError: identical(actionError, _sentinel)
          ? this.actionError
          : actionError as String?,
      publishedExams: publishedExams ?? this.publishedExams,
      attempts: attempts ?? this.attempts,
      nominations: nominations ?? this.nominations,
    );
  }
}

class ExamController extends StateNotifier<ExamState> {
  final ExamRepository _repository;

  ExamController(this._repository) : super(const ExamState());

  Future<void> loadDashboard({
    int? centerId,
    int? circleId,
    int? studentId,
    bool includeTemplates = true,
    bool includeNominations = false,
    String? nominationStatus,
  }) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      actionError: null,
    );

    try {
      final futures = <Future<dynamic>>[
        includeTemplates
            ? _repository
                .getExams(
                  centerId: centerId,
                  circleId: circleId,
                  status: 'PUBLISHED',
                )
                .catchError((_) => const <ExamDto>[])
            : Future.value(const <ExamDto>[]),
        _repository
            .getAllAttempts(
              centerId: centerId,
              circleId: circleId,
              studentId: studentId,
            )
            .catchError((_) => const <ExamAttemptDto>[]),
        includeNominations
            ? _repository
                .getNominationRequests(
                  centerId: centerId,
                  circleId: circleId,
                  studentId: studentId,
                  status: nominationStatus,
                )
                .catchError((_) => const <ExamNominationDto>[])
            : Future.value(const <ExamNominationDto>[]),
      ];

      final results = await Future.wait(futures);

      state = state.copyWith(
        isLoading: false,
        hasLoaded: true,
        publishedExams: results[0] as List<ExamDto>,
        attempts: results[1] as List<ExamAttemptDto>,
        nominations: results[2] as List<ExamNominationDto>,
        error: null,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        hasLoaded: true,
        error: 'تعذر تحميل بيانات الاختبارات بالكامل. يرجى إعادة المحاولة.',
      );
    }
  }

  Future<ExamNominationDto> createNomination({
    required int examId,
    required int studentId,
    required int circleId,
    String? teacherNotes,
    int? readinessScore,
    String? proposedExamDate,
  }) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final nomination = await _repository.createNominationRequest(
        CreateNominationRequestDto(
          examId: examId,
          studentId: studentId,
          circleId: circleId,
          teacherNotes: teacherNotes,
          readinessScore: readinessScore,
          proposedExamDate: proposedExamDate,
        ),
      );

      state = state.copyWith(
        isSubmitting: false,
        nominations: [nomination, ...state.nominations],
      );

      return nomination;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<ExamNominationDto> reviewNomination({
    required int nominationId,
    required String decision,
    String? notes,
  }) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final nomination = await _repository.supervisorReviewNomination(
        nominationId,
        SupervisorReviewNominationRequestDto(
          decision: decision,
          notes: notes,
        ),
      );

      state = state.copyWith(
        isSubmitting: false,
        nominations: state.nominations
            .map((item) => item.id == nomination.id ? nomination : item)
            .toList(growable: false),
      );

      return nomination;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<ExamAttemptDto> generateAttemptQuestions(
    int attemptId, {
    int? count,
  }) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final updatedAttempt = await _repository.generateAttemptQuestions(
        attemptId,
        GenerateAttemptQuestionsRequestDto(count: count),
      );

      _replaceAttempt(updatedAttempt);
      state = state.copyWith(isSubmitting: false);
      return updatedAttempt;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<ExamAttemptDto> createAttemptQuestion(
    int attemptId, {
    required int fromSurah,
    required int fromAyah,
    required int toSurah,
    required int toAyah,
  }) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final updatedAttempt = await _repository.createAttemptQuestion(
        attemptId,
        CreateAttemptQuestionRequestDto(
          fromSurah: fromSurah,
          fromAyah: fromAyah,
          toSurah: toSurah,
          toAyah: toAyah,
        ),
      );

      _replaceAttempt(updatedAttempt);
      state = state.copyWith(isSubmitting: false);
      return updatedAttempt;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<ExamAttemptDto> deleteAttemptQuestion(
    int attemptId,
    int questionId,
  ) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final updatedAttempt = await _repository.deleteAttemptQuestion(
        attemptId,
        questionId,
      );

      _replaceAttempt(updatedAttempt);
      state = state.copyWith(isSubmitting: false);
      return updatedAttempt;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<ExamAttemptDto> evaluateAttempt(
    int attemptId,
    EvaluateAttemptRequestDto request,
  ) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final updatedAttempt =
          await _repository.evaluateAttempt(attemptId, request);

      _replaceAttempt(updatedAttempt);
      state = state.copyWith(isSubmitting: false);
      return updatedAttempt;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<ExamAttemptDto> finalizeAttemptEvaluation(int attemptId) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final updatedAttempt =
          await _repository.finalizeAttemptEvaluation(attemptId);
      _replaceAttempt(updatedAttempt);
      state = state.copyWith(isSubmitting: false);
      return updatedAttempt;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<ExamAttemptDto> publishAttemptResult(int attemptId) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final updatedAttempt = await _repository.publishAttempt(attemptId);
      _replaceAttempt(updatedAttempt);
      state = state.copyWith(isSubmitting: false);
      return updatedAttempt;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<ExamAttemptDto> reopenAttempt(
    int attemptId, {
    required String reason,
  }) async {
    state = state.copyWith(isSubmitting: true, actionError: null);

    try {
      final updatedAttempt = await _repository.reopenAttempt(
        attemptId,
        ReopenAttemptRequestDto(reason: reason),
      );
      _replaceAttempt(updatedAttempt);
      state = state.copyWith(isSubmitting: false);
      return updatedAttempt;
    } catch (error) {
      state = state.copyWith(
        isSubmitting: false,
        actionError: _readErrorMessage(error),
      );
      rethrow;
    }
  }

  Future<QuranRangePreviewDto> previewQuranRange({
    required int fromSurah,
    required int fromAyah,
    required int toSurah,
    required int toAyah,
  }) async {
    return _repository.previewQuranRange(
      fromSurah: fromSurah,
      fromAyah: fromAyah,
      toSurah: toSurah,
      toAyah: toAyah,
    );
  }

  void clearActionError() {
    state = state.copyWith(actionError: null);
  }

  void _replaceAttempt(ExamAttemptDto updatedAttempt) {
    state = state.copyWith(
      attempts: state.attempts
          .map((attempt) =>
              attempt.id == updatedAttempt.id ? updatedAttempt : attempt)
          .toList(growable: false),
    );
  }

  String _readErrorMessage(Object error) {
    if (error is DioException) {
      final payload = error.response?.data;
      if (payload is Map<String, dynamic>) {
        final message = payload['message'] ?? payload['error'];
        if (message is String && message.trim().isNotEmpty) {
          return message.trim();
        }
      }
    }

    final message = error.toString().trim();
    if (message.isEmpty) {
      return 'Unable to process request';
    }
    return message;
  }
}

final examControllerProvider =
    StateNotifierProvider<ExamController, ExamState>((ref) {
  final repository = ref.watch(examRepositoryProvider);
  return ExamController(repository);
});
