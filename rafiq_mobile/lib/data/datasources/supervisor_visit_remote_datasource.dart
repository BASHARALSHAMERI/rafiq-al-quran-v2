import 'package:dio/dio.dart';

import '../models/supervisor_ops_dtos.dart';
import '../models/supervisor_visit_dtos.dart';

abstract class SupervisorVisitRemoteDataSource {
  Future<SupervisorTodayVisitsDto> getTodayVisits();

  Future<SupervisorOpsDashboardDto> getDashboard({
    required int month,
    required int year,
  });

  Future<SupervisorVisitLogDto> startVisit({
    required int centerId,
    int? circleId,
    int? planItemId,
    double? latitude,
    double? longitude,
  });

  Future<SupervisorVisitLogDto> endVisit({
    required int logId,
    double? latitude,
    double? longitude,
    List<Map<String, dynamic>>? checklist,
    int? rating,
    String? observations,
  });
}

class SupervisorVisitRemoteDataSourceImpl
    implements SupervisorVisitRemoteDataSource {
  final Dio dio;

  SupervisorVisitRemoteDataSourceImpl({required this.dio});

  @override
  Future<SupervisorTodayVisitsDto> getTodayVisits() async {
    final response = await dio.get('/supervisor-visits/today');
    return SupervisorTodayVisitsDto.fromJson(_extractData(response.data));
  }

  @override
  Future<SupervisorOpsDashboardDto> getDashboard({
    required int month,
    required int year,
  }) async {
    final response = await dio.get(
      '/staff-operations/supervisor/dashboard',
      queryParameters: {'month': month, 'year': year},
    );
    return SupervisorOpsDashboardDto.fromJson(_extractData(response.data));
  }

  @override
  Future<SupervisorVisitLogDto> startVisit({
    required int centerId,
    int? circleId,
    int? planItemId,
    double? latitude,
    double? longitude,
  }) async {
    final response = await dio.post(
      '/supervisor-visits/start',
      data: {
        'centerId': centerId,
        if (circleId != null) 'circleId': circleId,
        if (planItemId != null) 'planItemId': planItemId,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
      },
    );
    return SupervisorVisitLogDto.fromJson(_extractData(response.data));
  }

  @override
  Future<SupervisorVisitLogDto> endVisit({
    required int logId,
    double? latitude,
    double? longitude,
    List<Map<String, dynamic>>? checklist,
    int? rating,
    String? observations,
  }) async {
    final response = await dio.patch(
      '/supervisor-visits/$logId/end',
      data: {
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (checklist != null) 'checklist': checklist,
        if (rating != null) 'rating': rating,
        if (observations != null && observations.trim().isNotEmpty)
          'observations': observations.trim(),
      },
    );
    return SupervisorVisitLogDto.fromJson(_extractData(response.data));
  }

  Map<String, dynamic> _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final payload = responseData['data'];
      if (payload is Map<String, dynamic>) return payload;
      if (payload is Map) return Map<String, dynamic>.from(payload);
      return responseData;
    }
    if (responseData is Map) return Map<String, dynamic>.from(responseData);
    return const <String, dynamic>{};
  }
}
