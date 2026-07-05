import 'package:dio/dio.dart';

import '../models/dashboard_dtos.dart';

abstract class DashboardRemoteDataSource {
  Future<DashboardMetricsDto> getMetrics({
    int? centerId,
    int? circleId,
    int? studentId,
  });

  Future<List<ActivityFeedItemDto>> getActivityFeed({
    int? centerId,
    int? circleId,
    int? studentId,
    int limit = 10,
    int offset = 0,
  });
}

class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final Dio dio;

  DashboardRemoteDataSourceImpl({required this.dio});

  @override
  Future<DashboardMetricsDto> getMetrics({
    int? centerId,
    int? circleId,
    int? studentId,
  }) async {
    final query = <String, dynamic>{};
    if (centerId != null) query['centerId'] = centerId;
    if (circleId != null) query['circleId'] = circleId;
    if (studentId != null) query['studentId'] = studentId;

    final response =
        await dio.get('/dashboard/metrics', queryParameters: query);
    return DashboardMetricsDto.fromJson(_extractMetricsData(response.data));
  }

  @override
  Future<List<ActivityFeedItemDto>> getActivityFeed({
    int? centerId,
    int? circleId,
    int? studentId,
    int limit = 10,
    int offset = 0,
  }) async {
    final query = <String, dynamic>{
      'limit': limit,
    };
    if (centerId != null) query['centerId'] = centerId;
    if (circleId != null) query['circleId'] = circleId;
    if (studentId != null) query['studentId'] = studentId;

    final response =
        await dio.get('/dashboard/activity-feed', queryParameters: query);
    final data = _extractList(response.data);
    return data.map(_toActivityFeedDto).toList(growable: false);
  }

  Map<String, dynamic> _extractMetricsData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) {
        final totals = data['totals'];
        final attendanceByStatus = data['attendanceByStatus'];
        if (totals is Map<String, dynamic>) {
          return {
            'totalStudents': _asInt(totals['totalStudents']),
            'activeCircles': _asInt(totals['totalCircles']),
            'attendanceRate': _asDouble(totals['attendanceRate']),
            'pendingTasks': _asInt(data['pendingTasks']),
            'extraMetrics': {
              if (attendanceByStatus is Map<String, dynamic>)
                ...attendanceByStatus,
              'attendanceTotal': _asInt(totals['attendanceTotal']),
              'attendanceTrend': totals['attendanceTrend'],
            },
          };
        }
        return data;
      }
      return responseData;
    }
    return <String, dynamic>{};
  }

  List<Map<String, dynamic>> _extractList(dynamic responseData) {
    if (responseData == null) return const [];

    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'] ??
          responseData['items'] ??
          responseData['feed'] ??
          responseData['results'];

      if (data is List) {
        return data.whereType<Map<String, dynamic>>().toList(growable: false);
      }
      
      if (data is Map<String, dynamic>) {
        if (data.containsKey('data') && data['data'] is List) {
          return (data['data'] as List)
              .whereType<Map<String, dynamic>>()
              .toList(growable: false);
        }
        if (data.containsKey('items') && data['items'] is List) {
          return (data['items'] as List)
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

  ActivityFeedItemDto _toActivityFeedDto(Map<String, dynamic> json) {
    return ActivityFeedItemDto(
      id: '${json['id'] ?? ''}',
      type: '${json['activityType'] ?? json['type'] ?? 'GENERIC'}',
      title: _stringValue(json['message']).isNotEmpty
          ? _stringValue(json['message'])
          : _formatActivityTitle(json),
      description: _formatActivityDescription(json),
      timestamp: '${json['createdAt'] ?? json['timestamp'] ?? ''}',
      metadata: json['metadata'] is Map<String, dynamic>
          ? json['metadata'] as Map<String, dynamic>
          : null,
    );
  }

  String _formatActivityTitle(Map<String, dynamic> json) {
    final entityType = _stringValue(json['entityType']);
    return entityType.isNotEmpty ? entityType : 'Activity';
  }

  String _formatActivityDescription(Map<String, dynamic> json) {
    final center = json['center'];
    final circle = json['circle'];
    final parts = <String>[];

    if (center is Map<String, dynamic>) {
      final centerName = _stringValue(center['name']);
      if (centerName.isNotEmpty) {
        parts.add(centerName);
      }
    }

    if (circle is Map<String, dynamic>) {
      final circleName = _stringValue(circle['name']);
      if (circleName.isNotEmpty) {
        parts.add(circleName);
      }
    }

    return parts.join(' - ');
  }

  int _asInt(dynamic value) {
    if (value is int) {
      return value;
    }
    return int.tryParse('${value ?? ''}') ?? 0;
  }

  double _asDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse('${value ?? ''}') ?? 0;
  }

  String _stringValue(dynamic value) {
    return value?.toString().trim() ?? '';
  }
}
