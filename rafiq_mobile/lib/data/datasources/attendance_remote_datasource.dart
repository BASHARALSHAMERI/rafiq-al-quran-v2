import 'package:dio/dio.dart';

import '../models/attendance_dtos.dart';

class AttendanceRemoteDataSource {
  final Dio _dio;

  AttendanceRemoteDataSource(this._dio);

  Future<List<StudentDto>> getCircleStudents(String circleId) async {
    try {
      final response = await _dio.get(
        '/users',
        queryParameters: {
          'role': 'STUDENT',
          'circleId': circleId,
        },
      );
      final data = _extractList(response.data);
      return data
          .map((item) => StudentDto.fromJson(_normalizeStudent(item, circleId)))
          .toList(growable: false);
    } on DioException catch (e) {
      if (e.response?.statusCode != 404) {
        rethrow;
      }
      final fallback = await _dio.get('/circles/$circleId/students');
      final data = _extractList(fallback.data);
      return data
          .map((item) => StudentDto.fromJson(_normalizeStudent(item, circleId)))
          .toList(growable: false);
    }
  }

  Future<List<AttendanceRecordDto>> getAttendanceForDate(
    String circleId,
    String date,
  ) async {
    try {
      final response = await _dio.get(
        '/reports/attendance',
        queryParameters: {
          'from': date,
          'to': date,
          'circleId': circleId,
        },
      );
      final data = _extractRows(response.data);
      return data
          .map((item) => AttendanceRecordDto.fromJson(_normalizeRecord(item)))
          .toList(growable: false);
    } on DioException catch (e) {
      if (e.response?.statusCode != 404) {
        rethrow;
      }
      final fallback = await _dio.get(
        '/attendance',
        queryParameters: {
          'circleId': circleId,
          'date': date,
        },
      );
      final data = _extractList(fallback.data);
      return data
          .map((item) => AttendanceRecordDto.fromJson(_normalizeRecord(item)))
          .toList(growable: false);
    }
  }

  Future<void> submitBulkAttendance(BulkAttendanceRequest request) async {
    final payload = {
      'circleId': request.circleId,
      'date': request.date,
      'records': request.records
          .map(
            (record) => {
              'studentId': record.studentId,
              'status': record.status,
              'note': (record.note?.trim().isEmpty ?? true)
                  ? null
                  : record.note?.trim(),
            },
          )
          .toList(growable: false),
    };
    await _dio.post('/attendance/bulk', data: payload);
  }

  List<Map<String, dynamic>> _extractRows(dynamic responseData) {
    if (responseData is! Map<String, dynamic>) {
      return _extractList(responseData);
    }
    final topData = responseData['data'];
    if (topData is Map<String, dynamic>) {
      final rows = topData['rows'];
      if (rows is List) {
        return rows.whereType<Map<String, dynamic>>().toList(growable: false);
      }
    }
    return _extractList(responseData);
  }

  List<Map<String, dynamic>> _extractList(dynamic responseData) {
    if (responseData is List) {
      return responseData
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }

    if (responseData is Map<String, dynamic>) {
      final payload = responseData['data'];
      if (payload is List) {
        return payload
            .whereType<Map<String, dynamic>>()
            .toList(growable: false);
      }
    }

    return const [];
  }

  Map<String, dynamic> _normalizeStudent(
      Map<String, dynamic> json, String circleId) {
    final profile = json['profile'];
    final studentEnrollments = json['studentEnrollments'];

    String enrollmentId = '';
    if (json['enrollmentId'] != null || json['enrollment_id'] != null) {
      enrollmentId = (json['enrollmentId'] ?? json['enrollment_id']).toString();
    } else if (studentEnrollments is List && studentEnrollments.isNotEmpty) {
      final enrollment = studentEnrollments
          .whereType<Map<String, dynamic>>()
          .where((e) => e['circleId']?.toString() == circleId)
          .cast<Map<String, dynamic>?>()
          .firstWhere(
            (e) => e != null,
            orElse: () => studentEnrollments.first as Map<String, dynamic>?,
          );
      enrollmentId = 'ENR-${enrollment?['circleId'] ?? circleId}';
    } else {
      enrollmentId = 'ENR-$circleId';
    }

    final profileName = profile is Map<String, dynamic>
        ? profile['fullName']?.toString()
        : null;

    return {
      'id': (json['id'] ?? '').toString(),
      'name':
          (json['name'] ?? json['fullName'] ?? profileName ?? '').toString(),
      'enrollmentId': enrollmentId,
    };
  }

  Map<String, dynamic> _normalizeRecord(Map<String, dynamic> json) {
    final status = (json['status'] ?? 'PRESENT').toString().toUpperCase();
    return {
      'studentId': (json['studentId'] ?? json['student_id'] ?? '').toString(),
      'circleId': (json['circleId'] ?? json['circle_id'] ?? '').toString(),
      'date': (json['date'] ?? json['attendanceDate'] ?? '').toString(),
      'status': status,
      'note': json['note']?.toString(),
    };
  }
}
