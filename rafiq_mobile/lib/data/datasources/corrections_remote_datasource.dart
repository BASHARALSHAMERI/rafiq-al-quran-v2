import 'package:dio/dio.dart';

import '../models/correction_dtos.dart';

abstract class CorrectionsRemoteDataSource {
  Future<ListCorrectionsResultDto> list({
    String? status,
    String? targetType,
    int? centerId,
    int? circleId,
    int page = 1,
    int pageSize = 100,
  });

  Future<CorrectionItemDto> approve(
    int correctionId, {
    required bool applyChanges,
    String? reviewNote,
  });

  Future<CorrectionItemDto> reject(
    int correctionId, {
    required String reviewNote,
  });
}

class CorrectionsRemoteDataSourceImpl implements CorrectionsRemoteDataSource {
  final Dio dio;

  CorrectionsRemoteDataSourceImpl({required this.dio});

  @override
  Future<ListCorrectionsResultDto> list({
    String? status,
    String? targetType,
    int? centerId,
    int? circleId,
    int page = 1,
    int pageSize = 100,
  }) async {
    final response = await dio.get(
      '/corrections',
      queryParameters: {
        if (status != null && status.isNotEmpty) 'status': status,
        if (targetType != null && targetType.isNotEmpty)
          'targetType': targetType,
        if (centerId != null) 'centerId': centerId,
        if (circleId != null) 'circleId': circleId,
        'page': page,
        'pageSize': pageSize,
      },
    );
    return ListCorrectionsResultDto.fromJson(_extractData(response.data));
  }

  @override
  Future<CorrectionItemDto> approve(
    int correctionId, {
    required bool applyChanges,
    String? reviewNote,
  }) async {
    final response = await dio.post(
      '/corrections/$correctionId/approve',
      data: {
        'applyChanges': applyChanges,
        if (reviewNote != null && reviewNote.trim().isNotEmpty)
          'reviewNote': reviewNote.trim(),
      },
    );
    return CorrectionItemDto.fromJson(_extractData(response.data));
  }

  @override
  Future<CorrectionItemDto> reject(
    int correctionId, {
    required String reviewNote,
  }) async {
    final response = await dio.post(
      '/corrections/$correctionId/reject',
      data: {'reviewNote': reviewNote.trim()},
    );
    return CorrectionItemDto.fromJson(_extractData(response.data));
  }

  Map<String, dynamic> _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) {
        return data;
      }
      return responseData;
    }
    return const <String, dynamic>{};
  }
}
