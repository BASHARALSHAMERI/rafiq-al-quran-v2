import 'package:dio/dio.dart';

import '../models/report_dtos.dart';
import '../models/supervisor_dtos.dart';

abstract class ReportsRemoteDataSource {
  Future<StudentReportDto> getStudentReport(int studentId);
  Future<SupervisorDashboardDto> getSupervisorDashboard({
    int? year,
    int? month,
    int? centerId,
    int? circleId,
  });
}

class ReportsRemoteDataSourceImpl implements ReportsRemoteDataSource {
  final Dio dio;

  ReportsRemoteDataSourceImpl({required this.dio});

  @override
  Future<StudentReportDto> getStudentReport(int studentId) async {
    final response = await dio.get('/reports/student/$studentId');
    return StudentReportDto.fromJson(_extractData(response.data));
  }

  @override
  Future<SupervisorDashboardDto> getSupervisorDashboard({
    int? year,
    int? month,
    int? centerId,
    int? circleId,
  }) async {
    final Map<String, dynamic> queryParams = {};
    if (year != null && month != null) {
      final from = DateTime(year, month, 1).toIso8601String();
      final to = DateTime(year, month + 1, 0, 23, 59, 59).toIso8601String();
      queryParams['from'] = from;
      queryParams['to'] = to;
    } else {
      final now = DateTime.now();
      final from = DateTime(now.year, now.month, 1).toIso8601String();
      final to =
          DateTime(now.year, now.month + 1, 0, 23, 59, 59).toIso8601String();
      queryParams['from'] = from;
      queryParams['to'] = to;
    }

    if (centerId != null) {
      queryParams['centerId'] = centerId;
    }
    if (circleId != null) {
      queryParams['circleId'] = circleId;
    }

    final response = await dio.get('/reports/supervisor/dashboard',
        queryParameters: queryParams);
    return SupervisorDashboardDto.fromJson(_extractData(response.data));
  }

  Map<String, dynamic> _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final payload = responseData['data'];
      if (payload is Map<String, dynamic>) {
        return payload;
      }
      return responseData;
    }
    return const <String, dynamic>{};
  }
}
