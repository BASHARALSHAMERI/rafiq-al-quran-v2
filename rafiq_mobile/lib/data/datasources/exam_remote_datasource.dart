import 'package:dio/dio.dart';

import '../models/exam_dtos.dart';

abstract class ExamRemoteDataSource {
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

class ExamRemoteDataSourceImpl implements ExamRemoteDataSource {
  final Dio dio;

  ExamRemoteDataSourceImpl({required this.dio});

  @override
  Future<List<ExamDto>> getExams({
    int? centerId,
    int? circleId,
    String? status,
    String? from,
    String? to,
  }) async {
    final query = <String, dynamic>{};
    if (centerId != null) query['centerId'] = centerId;
    if (circleId != null) query['circleId'] = circleId;
    if (status != null) query['status'] = status;
    if (from != null) query['from'] = from;
    if (to != null) query['to'] = to;

    final response = await dio.get('/exams', queryParameters: query);
    final data = _extractList(response.data);
    return data.map((e) => ExamDto.fromJson(e)).toList(growable: false);
  }

  @override
  Future<ExamDto> createExam(CreateExamRequestDto request) async {
    final response = await dio.post('/exams', data: request.toJson());
    return ExamDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamDto> publishExam(int examId) async {
    final response = await dio.post('/exams/$examId/publish');
    return ExamDto.fromJson(_extractData(response.data));
  }

  @override
  Future<List<ExamAttemptDto>> getAllAttempts({
    int? centerId,
    int? circleId,
    int? studentId,
  }) async {
    final query = <String, dynamic>{};
    if (centerId != null) query['centerId'] = centerId;
    if (circleId != null) query['circleId'] = circleId;
    if (studentId != null) query['studentId'] = studentId;

    final response = await dio.get('/attempts', queryParameters: query);
    final data = _extractList(response.data);
    return data.map((e) => ExamAttemptDto.fromJson(e)).toList(growable: false);
  }

  @override
  Future<List<ExamAttemptDto>> getExamAttempts(int examId) async {
    final response = await dio.get('/exams/$examId/attempts');
    final data = _extractList(response.data);
    return data.map((e) => ExamAttemptDto.fromJson(e)).toList(growable: false);
  }

  @override
  Future<List<ExamNominationDto>> getNominationRequests({
    int? centerId,
    int? circleId,
    int? studentId,
    String? status,
  }) async {
    final query = <String, dynamic>{};
    if (centerId != null) query['centerId'] = centerId;
    if (circleId != null) query['circleId'] = circleId;
    if (studentId != null) query['studentId'] = studentId;
    if (status != null && status.trim().isNotEmpty) query['status'] = status;

    final response = await dio.get('/exam-nominations', queryParameters: query);
    final data = _extractList(response.data);
    return data
        .map((e) => ExamNominationDto.fromJson(e))
        .toList(growable: false);
  }

  @override
  Future<ExamNominationDto> createNominationRequest(
      CreateNominationRequestDto request) async {
    final response =
        await dio.post('/exam-nominations', data: request.toJson());
    return ExamNominationDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamNominationDto> supervisorReviewNomination(
    int nominationId,
    SupervisorReviewNominationRequestDto request,
  ) async {
    final response = await dio.post(
      '/exam-nominations/$nominationId/supervisor-review',
      data: request.toJson(),
    );
    return ExamNominationDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> updateAttemptCommittee(
    int attemptId,
    UpdateAttemptCommitteeRequestDto request,
  ) async {
    final response = await dio.patch('/attempts/$attemptId/committee',
        data: request.toJson());
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> generateAttemptQuestions(
    int attemptId,
    GenerateAttemptQuestionsRequestDto request,
  ) async {
    final response = await dio.post(
      '/attempts/$attemptId/questions/generate',
      data: request.toJson(),
    );
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> createAttemptQuestion(
    int attemptId,
    CreateAttemptQuestionRequestDto request,
  ) async {
    final response = await dio.post(
      '/attempts/$attemptId/questions',
      data: request.toJson(),
    );
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> deleteAttemptQuestion(
    int attemptId,
    int questionId,
  ) async {
    final response =
        await dio.delete('/attempts/$attemptId/questions/$questionId');
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> evaluateAttempt(
      int attemptId, EvaluateAttemptRequestDto request) async {
    final response =
        await dio.post('/attempts/$attemptId/evaluate', data: request.toJson());
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> finalizeAttemptEvaluation(int attemptId) async {
    final response = await dio
        .post('/attempts/$attemptId/finalize-evaluation', data: const {});
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> approveAttempt(int attemptId) async {
    final response =
        await dio.post('/attempts/$attemptId/approve', data: const {});
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> publishAttempt(int attemptId) async {
    final response =
        await dio.post('/attempts/$attemptId/publish', data: const {});
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ExamAttemptDto> reopenAttempt(
    int attemptId,
    ReopenAttemptRequestDto request,
  ) async {
    final response = await dio.post(
      '/attempts/$attemptId/reopen',
      data: request.toJson(),
    );
    return ExamAttemptDto.fromJson(_extractData(response.data));
  }

  @override
  Future<QuranRangePreviewDto> previewQuranRange({
    required int fromSurah,
    required int fromAyah,
    required int toSurah,
    required int toAyah,
  }) async {
    final response = await dio.post(
      '/quran/range/preview',
      data: {
        'fromSurah': fromSurah,
        'fromAyah': fromAyah,
        'toSurah': toSurah,
        'toAyah': toAyah,
      },
    );
    return QuranRangePreviewDto.fromJson(_extractData(response.data));
  }

  Map<String, dynamic> _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) {
        return data;
      }
      return responseData;
    }
    return <String, dynamic>{};
  }

  List<Map<String, dynamic>> _extractList(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is List) {
        return data.whereType<Map<String, dynamic>>().toList(growable: false);
      }
      if (data is Map<String, dynamic> && data.containsKey('items')) {
        final items = data['items'];
        if (items is List) {
          return items
              .whereType<Map<String, dynamic>>()
              .toList(growable: false);
        }
      }
    } else if (responseData is List) {
      return responseData
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }
    return const [];
  }
}
