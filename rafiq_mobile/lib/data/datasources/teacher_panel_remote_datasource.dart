import 'package:dio/dio.dart';

import '../models/teacher_panel_dtos.dart';

abstract class TeacherPanelRemoteDataSource {
  Future<TeacherMonthlyPlansListDto> getMonthlyPlans({
    required int circleId,
    required int month,
    required int year,
  });
  Future<TeacherMonthlyPlansListDto> generateMonthlyPlans({
    required int circleId,
    required int month,
    required int year,
  });
  Future<TeacherMonthlyPlanDto> getMonthlyPlan(int planId);
  Future<TeacherMonthlyPlanDto> updateMonthlyPlan(
    int planId,
    Map<String, dynamic> payload,
  );
  Future<TeacherMonthlyPlanDto> approveMonthlyPlan(int planId);
  Future<int> approveAllMonthlyPlans({
    required int circleId,
    required int month,
    required int year,
  });
  Future<TeacherPreparationDto> getTeacherPreparation({
    int? circleId,
    int? month,
    int? year,
  });
  Future<TeacherPreparationDto> checkIn({
    required int circleId,
    double? latitude,
    double? longitude,
  });
  Future<TeacherPreparationDto> checkOut({
    required int circleId,
    double? latitude,
    double? longitude,
  });
  Future<void> requestExcuse({
    required int centerId,
    required String date,
    required String reason,
  });
  Future<void> requestLeave({
    required int centerId,
    required String leaveType,
    required String startDate,
    required String endDate,
    required String reason,
  });
  Future<TeacherHalqaReportDto> getTeacherHalqaMonthlyReport({
    int? circleId,
    int? month,
    int? year,
  });
  Future<ReportExportDto> exportTeacherHalqaMonthlyReport({
    int? circleId,
    int? month,
    int? year,
    required String format,
  });
  Future<Map<String, dynamic>> getStudentMonthlyReport({
    required int studentId,
    int? month,
    int? year,
  });
  Future<ReportExportDto> exportStudentMonthlyReport({
    required int studentId,
    int? month,
    int? year,
    required String format,
  });
}

class TeacherPanelRemoteDataSourceImpl implements TeacherPanelRemoteDataSource {
  final Dio dio;

  TeacherPanelRemoteDataSourceImpl({required this.dio});

  @override
  Future<TeacherMonthlyPlansListDto> getMonthlyPlans({
    required int circleId,
    required int month,
    required int year,
  }) async {
    final response = await dio.get(
      '/monthly-plans',
      queryParameters: {
        'circleId': circleId,
        'month': month,
        'year': year,
      },
    );
    return TeacherMonthlyPlansListDto.fromJson(_extractData(response.data));
  }

  @override
  Future<TeacherMonthlyPlansListDto> generateMonthlyPlans({
    required int circleId,
    required int month,
    required int year,
  }) async {
    final response = await dio.post(
      '/monthly-plans/generate',
      data: {
        'circleId': circleId,
        'month': month,
        'year': year,
      },
    );
    return TeacherMonthlyPlansListDto.fromJson(_extractData(response.data));
  }

  @override
  Future<TeacherMonthlyPlanDto> getMonthlyPlan(int planId) async {
    final response = await dio.get('/monthly-plans/$planId');
    return TeacherMonthlyPlanDto.fromJson(_extractData(response.data));
  }

  @override
  Future<TeacherMonthlyPlanDto> updateMonthlyPlan(
    int planId,
    Map<String, dynamic> payload,
  ) async {
    final response = await dio.put('/monthly-plans/$planId', data: payload);
    return TeacherMonthlyPlanDto.fromJson(_extractData(response.data));
  }

  @override
  Future<TeacherMonthlyPlanDto> approveMonthlyPlan(int planId) async {
    final response = await dio.post('/monthly-plans/$planId/approve');
    return TeacherMonthlyPlanDto.fromJson(_extractData(response.data));
  }

  @override
  Future<int> approveAllMonthlyPlans({
    required int circleId,
    required int month,
    required int year,
  }) async {
    final response = await dio.post(
      '/monthly-plans/approve-all',
      data: {
        'circleId': circleId,
        'month': month,
        'year': year,
      },
    );
    return _asInt(_extractData(response.data)['approved']);
  }

  @override
  Future<TeacherPreparationDto> getTeacherPreparation({
    int? circleId,
    int? month,
    int? year,
  }) async {
    final response = await dio.get(
      '/staff-operations/self',
      queryParameters: {
        if (circleId != null) 'circleId': circleId,
        if (month != null) 'month': month,
        if (year != null) 'year': year,
      },
    );
    return TeacherPreparationDto.fromJson(_extractData(response.data));
  }

  @override
  Future<TeacherPreparationDto> checkIn({
    required int circleId,
    double? latitude,
    double? longitude,
  }) async {
    await dio.post(
      '/staff-operations/self/check-in',
      data: {
        'circleId': circleId,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
      },
    );
    return getTeacherPreparation(circleId: circleId);
  }

  @override
  Future<TeacherPreparationDto> checkOut({
    required int circleId,
    double? latitude,
    double? longitude,
  }) async {
    await dio.post(
      '/staff-operations/self/check-out',
      data: {
        'circleId': circleId,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
      },
    );
    return getTeacherPreparation(circleId: circleId);
  }

  @override
  Future<void> requestExcuse({
    required int centerId,
    required String date,
    required String reason,
  }) async {
    await dio.post(
      '/staff-operations/excuses',
      data: {
        'centerId': centerId,
        'date': date,
        'reason': reason,
      },
    );
  }

  @override
  Future<void> requestLeave({
    required int centerId,
    required String leaveType,
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    await dio.post(
      '/staff-operations/leaves',
      data: {
        'centerId': centerId,
        'leaveType': leaveType,
        'startDate': startDate,
        'endDate': endDate,
        'reason': reason,
      },
    );
  }

  @override
  Future<TeacherHalqaReportDto> getTeacherHalqaMonthlyReport({
    int? circleId,
    int? month,
    int? year,
  }) async {
    final response = await dio.get(
      '/reports/teacher/halqa-monthly',
      queryParameters: {
        if (circleId != null) 'circleId': circleId,
        if (month != null) 'month': month,
        if (year != null) 'year': year,
      },
    );
    return TeacherHalqaReportDto.fromJson(_extractData(response.data));
  }

  @override
  Future<ReportExportDto> exportTeacherHalqaMonthlyReport({
    int? circleId,
    int? month,
    int? year,
    required String format,
  }) async {
    final response = await dio.post(
      '/reports/teacher/halqa-monthly/export',
      data: {
        if (circleId != null) 'circleId': circleId,
        if (month != null) 'month': month,
        if (year != null) 'year': year,
        'format': format,
      },
    );
    return ReportExportDto.fromJson(_extractData(response.data));
  }

  @override
  Future<Map<String, dynamic>> getStudentMonthlyReport({
    required int studentId,
    int? month,
    int? year,
  }) async {
    final response = await dio.get(
      '/reports/student/$studentId',
      queryParameters: {
        if (month != null) 'month': month,
        if (year != null) 'year': year,
      },
    );
    return _extractData(response.data);
  }

  @override
  Future<ReportExportDto> exportStudentMonthlyReport({
    required int studentId,
    int? month,
    int? year,
    required String format,
  }) async {
    final response = await dio.post(
      '/reports/student/$studentId/monthly/export',
      data: {
        if (month != null) 'month': month,
        if (year != null) 'year': year,
        'format': format,
      },
    );
    return ReportExportDto.fromJson(_extractData(response.data));
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

int _asInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}
