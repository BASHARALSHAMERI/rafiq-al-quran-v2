import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../core/constants/hive_keys.dart';
import '../../domain/entities/student_profile.dart';
import '../../domain/repositories/follow_up_repository.dart';
import '../datasources/follow_up_remote_datasource.dart';
import '../datasources/sync_local_datasource.dart';
import '../models/follow_up_dtos.dart';

class FollowUpRepositoryImpl implements FollowUpRepository {
  final FollowUpRemoteDataSource remoteDataSource;
  final SyncLocalDataSource _syncLocal = SyncLocalDataSource();

  FollowUpRepositoryImpl({required this.remoteDataSource});

  @override
  Future<StudentProfile> getStudentProfile(int studentId) async {
    final cacheKey = 'student_profile_$studentId';
    final box = Hive.box<dynamic>(HiveBoxes.appCache);

    try {
      final profile = await remoteDataSource.getStudentProfile(studentId);
      await box.put(cacheKey, jsonEncode(profile.toJson()));
      return profile;
    } on DioException catch (error) {
      if (_isOfflineError(error)) {
        final cachedString = box.get(cacheKey) as String?;
        if (cachedString != null && cachedString.trim().isNotEmpty) {
          final decoded = jsonDecode(cachedString);
          if (decoded is Map<String, dynamic>) {
            return StudentProfile.fromJson(decoded);
          }
        }
      }
      rethrow;
    }
  }

  @override
  Future<List<FollowUpRecordDto>> getFollowUps(
    ListFollowUpsRequestDto request,
  ) async {
    final cacheKey = '${HiveKeys.followUps}${request.studentId}';
    final box = Hive.box<dynamic>(HiveBoxes.appCache);

    try {
      final records = await remoteDataSource.getFollowUps(request);
      final jsonList = records.map((e) => e.toJson()).toList();
      await box.put(cacheKey, jsonEncode(jsonList));
      return records;
    } on DioException catch (error) {
      if (_isOfflineError(error)) {
        final cachedString = box.get(cacheKey) as String?;
        if (cachedString != null) {
          final decoded = jsonDecode(cachedString);
          if (decoded is List) {
            return decoded
                .whereType<Map<String, dynamic>>()
                .map(FollowUpRecordDto.fromJson)
                .toList(growable: false);
          }
        }
      }
      rethrow;
    }
  }

  @override
  Future<FollowUpRecordDto> createFollowUp(
    CreateFollowUpRequestDto request,
  ) async {
    try {
      return await remoteDataSource.createFollowUp(request);
    } on DioException catch (error) {
      if (_isOfflineError(error)) {
        await _enqueueSyncTask('POST', '/follow-ups', request.toJson());
        return FollowUpRecordDto(
          id: DateTime.now().millisecondsSinceEpoch,
          studentId: request.studentId,
          circleId: request.circleId,
          teacherId: 0,
          recordDate: request.recordDate,
          type: request.type,
          status: 'DRAFT',
          rating: 0,
          pagesCount: 0.0,
        );
      }
      rethrow;
    }
  }

  @override
  Future<FollowUpRecordDto> updateFollowUp(
    int followUpId,
    UpdateFollowUpRequestDto request,
  ) async {
    try {
      return await remoteDataSource.updateFollowUp(followUpId, request);
    } on DioException catch (error) {
      if (_isOfflineError(error)) {
        await _enqueueSyncTask(
          'PATCH',
          '/follow-ups/$followUpId',
          request.toJson(),
        );
        return FollowUpRecordDto(
          id: followUpId,
          studentId: 0,
          circleId: 0,
          teacherId: 0,
          recordDate: 'offline',
          type: request.type ?? 'BOTH',
          status: 'DRAFT',
          rating: 0,
          pagesCount: 0.0,
        );
      }
      rethrow;
    }
  }

  @override
  Future<FollowUpRecordDto> finalizeFollowUp(int followUpId) async {
    try {
      return await remoteDataSource.finalizeFollowUp(followUpId);
    } on DioException catch (error) {
      if (_isOfflineError(error)) {
        await _enqueueSyncTask('PATCH', '/follow-ups/$followUpId/finalize', {});
        return FollowUpRecordDto(
          id: followUpId,
          studentId: 0,
          circleId: 0,
          teacherId: 0,
          recordDate: 'offline',
          type: 'BOTH',
          status: 'FINAL',
          rating: 0,
          pagesCount: 0.0,
        );
      }
      rethrow;
    }
  }

  Future<void> _enqueueSyncTask(
    String method,
    String path,
    Map<String, dynamic> data,
  ) async {
    final taskId = DateTime.now().millisecondsSinceEpoch.toString();
    final baseVersionRaw = data['lockVersion'];
    final baseVersion = baseVersionRaw is int
        ? baseVersionRaw
        : int.tryParse(baseVersionRaw?.toString() ?? '');

    await _syncLocal.enqueuePendingMutation(
      mutationId: taskId,
      entity: 'FOLLOW_UP',
      method: method,
      endpoint: path,
      payload: data,
      baseVersion: baseVersion,
      idempotencyKey: taskId,
    );
  }

  bool _isOfflineError(DioException error) {
    return error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout;
  }
}
