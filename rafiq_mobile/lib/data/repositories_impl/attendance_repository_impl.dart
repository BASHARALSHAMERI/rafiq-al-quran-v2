import 'package:dio/dio.dart';

import '../../data/datasources/attendance_local_datasource.dart';
import '../../domain/repositories/attendance_repository.dart';
import '../../data/datasources/attendance_remote_datasource.dart';
import '../../domain/entities/attendance.dart';
import '../mappers/attendance_mapper.dart';

class AttendanceRepositoryImpl implements AttendanceRepository {
  final AttendanceRemoteDataSource _remoteDataSource;
  final AttendanceLocalDataSource _localDataSource;

  AttendanceRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
  );

  @override
  Future<List<Student>> getCircleStudents(String circleId) async {
    try {
      final dtos = await _remoteDataSource.getCircleStudents(circleId);
      await _localDataSource.saveCachedStudents(circleId, dtos);
      return dtos.map((dto) => dto.toEntity()).toList(growable: false);
    } on DioException catch (error) {
      if (!_isOfflineError(error)) {
        rethrow;
      }

      final cached = await _localDataSource.getCachedStudents(circleId);
      if (cached.isEmpty) {
        rethrow;
      }
      return cached.map((dto) => dto.toEntity()).toList(growable: false);
    }
  }

  @override
  Future<List<AttendanceRecord>> getAttendanceForDate(
      String circleId, String date) async {
    try {
      final dtos = await _remoteDataSource.getAttendanceForDate(circleId, date);
      await _localDataSource.saveCachedAttendance(circleId, date, dtos);
      await _flushPendingSubmissions();
      return dtos.map((dto) => dto.toEntity()).toList(growable: false);
    } on DioException catch (error) {
      if (!_isOfflineError(error)) {
        rethrow;
      }

      final cached = await _localDataSource.getCachedAttendance(circleId, date);
      if (cached.isEmpty) {
        rethrow;
      }
      return cached.map((dto) => dto.toEntity()).toList(growable: false);
    }
  }

  @override
  Future<AttendanceSubmitResult> submitBulkAttendance(
      BulkAttendanceSubmission submission) async {
    final request = submission.toRequestDto();

    try {
      await _remoteDataSource.submitBulkAttendance(request);
      await _localDataSource.removePendingByCircleAndDate(
        request.circleId,
        request.date,
      );
      await _localDataSource.saveCachedAttendance(
        request.circleId,
        request.date,
        request.records,
      );
      await _flushPendingSubmissions();
      return AttendanceSubmitResult.submitted;
    } on DioException catch (error) {
      if (!_isOfflineError(error)) {
        rethrow;
      }

      await _localDataSource.enqueuePending(request);
      await _localDataSource.saveCachedAttendance(
        request.circleId,
        request.date,
        request.records,
      );
      return AttendanceSubmitResult.queuedOffline;
    }
  }

  Future<void> _flushPendingSubmissions() async {
    final pending = await _localDataSource.getPendingSubmissions();
    if (pending.isEmpty) {
      return;
    }

    for (final item in pending) {
      try {
        await _remoteDataSource.submitBulkAttendance(item.request);
        await _localDataSource.removePendingSubmission(item.id);
        await _localDataSource.saveCachedAttendance(
          item.request.circleId,
          item.request.date,
          item.request.records,
        );
      } on DioException catch (error) {
        if (_isOfflineError(error)) {
          break;
        }

        final statusCode = error.response?.statusCode ?? 0;
        if (statusCode >= 400 && statusCode < 500) {
          await _localDataSource.removePendingSubmission(item.id);
        }
      }
    }
  }

  bool _isOfflineError(Object error) {
    if (error is! DioException) {
      return false;
    }
    return error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout;
  }
}
