import 'package:dio/dio.dart';

import '../models/supervisor_note_dtos.dart';

abstract class SupervisorNotesRemoteDataSource {
  Future<SupervisorNotesListDto> list({
    int? centerId,
    int? circleId,
    String? category,
    String? status,
    int page = 1,
    int pageSize = 50,
  });

  Future<SupervisorNoteDto> create({
    int? centerId,
    int? circleId,
    required String category,
    String? targetLabel,
    required String content,
    Map<String, dynamic>? scores,
    List<Map<String, dynamic>>? visitChecklist,
    int? rating,
  });

  Future<SupervisorNoteDto> updateStatus(int id, String status);
}

class SupervisorNotesRemoteDataSourceImpl
    implements SupervisorNotesRemoteDataSource {
  final Dio dio;

  SupervisorNotesRemoteDataSourceImpl({required this.dio});

  @override
  Future<SupervisorNotesListDto> list({
    int? centerId,
    int? circleId,
    String? category,
    String? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    final response = await dio.get(
      '/supervisor-notes',
      queryParameters: {
        if (centerId != null) 'centerId': centerId,
        if (circleId != null) 'circleId': circleId,
        if (category != null && category.isNotEmpty) 'category': category,
        if (status != null && status.isNotEmpty) 'status': status,
        'page': page,
        'pageSize': pageSize,
      },
    );
    return SupervisorNotesListDto.fromJson(_extractListData(response.data));
  }

  @override
  Future<SupervisorNoteDto> create({
    int? centerId,
    int? circleId,
    required String category,
    String? targetLabel,
    required String content,
    Map<String, dynamic>? scores,
    List<Map<String, dynamic>>? visitChecklist,
    int? rating,
  }) async {
    final response = await dio.post(
      '/supervisor-notes',
      data: {
        'category': category,
        'content': content,
        if (centerId != null) 'centerId': centerId,
        if (circleId != null) 'circleId': circleId,
        if (targetLabel != null && targetLabel.isNotEmpty)
          'targetLabel': targetLabel,
        if (scores != null) 'scores': scores,
        if (visitChecklist != null) 'visitChecklist': visitChecklist,
        if (rating != null) 'rating': rating,
      },
    );
    return SupervisorNoteDto.fromJson(_extractData(response.data));
  }

  @override
  Future<SupervisorNoteDto> updateStatus(int id, String status) async {
    final response = await dio.patch(
      '/supervisor-notes/$id/status',
      data: {'status': status},
    );
    return SupervisorNoteDto.fromJson(_extractData(response.data));
  }

  Map<String, dynamic> _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) return data;
      return responseData;
    }
    return const <String, dynamic>{};
  }

  Map<String, dynamic> _extractListData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) return data;
      return responseData;
    }
    return const <String, dynamic>{};
  }
}
