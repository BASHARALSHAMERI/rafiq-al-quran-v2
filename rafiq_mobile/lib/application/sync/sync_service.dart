import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

import '../../data/datasources/sync_local_datasource.dart';
import '../auth/auth_providers.dart';

final syncServiceProvider = Provider<SyncService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return SyncService(dio, SyncLocalDataSource());
});

class SyncService {
  final Dio _dio;
  final SyncLocalDataSource _local;
  final _logger = Logger();

  SyncService(this._dio, this._local);

  Future<int> syncPendingTasks() async {
    return await _syncSqliteQueue();
  }

  Future<int> _syncSqliteQueue() async {
    final rows = await _local.listReadyPendingMutations(limit: 100);
    if (rows.isEmpty) {
      _logger.i('No SQLite pending mutations to sync.');
      return 0;
    }

    int successCount = 0;

    for (final row in rows) {
      try {
        _logger.i('Syncing sqlite mutation [${row.method}] ${row.endpoint}');

        final headers = <String, String>{
          'X-Idempotency-Key': row.idempotencyKey,
          'X-Client-Mutation-Id': row.mutationId,
        };
        if (row.baseVersion != null) {
          headers['If-Match-Version'] = row.baseVersion.toString();
        }

        await _sendRequest(
          method: row.method,
          path: row.endpoint,
          data: row.payload,
          headers: headers,
        );

        await _local.markMutationSynced(row.mutationId);
        successCount++;
      } on DioException catch (e) {
        final status = e.response?.statusCode ?? 0;
        final code = _extractServerErrorCode(e.response?.data);

        if (_isNetworkError(e) || status >= 500) {
          final nextAttempt = row.attemptCount + 1;
          final retryAt = DateTime.now().toUtc().add(_retryDelay(nextAttempt));
          await _local.scheduleMutationRetry(
            mutationId: row.mutationId,
            attemptCount: nextAttempt,
            nextRetryAt: retryAt,
          );
          continue;
        }

        if (status == 409 && code == 'LOCKED_RECORD') {
          final created = await _tryAutoCreateCorrection(row);
          if (created) {
            await _local.markMutationResolvedByCorrection(row.mutationId);
          } else {
            await _local.markMutationFailed(row.mutationId);
          }
          continue;
        }

        if (status == 409 && code == 'VERSION_CONFLICT') {
          await _local.insertConflict(
            mutationId: row.mutationId,
            endpoint: row.endpoint,
            reason: 'VERSION_CONFLICT',
            serverSnapshot: _extractServerSnapshot(e.response?.data),
          );
          await _local.markMutationFailed(row.mutationId);
          continue;
        }

        await _local.markMutationFailed(row.mutationId);
      } catch (e) {
        _logger.e('Unexpected sqlite sync error: $e');
        await _local.markMutationFailed(row.mutationId);
      }
    }

    return successCount;
  }

  Future<void> _sendRequest({
    required String method,
    required String path,
    dynamic data,
    Map<String, String>? headers,
  }) async {
    switch (method.toUpperCase()) {
      case 'POST':
        await _dio.post(path, data: data, options: Options(headers: headers));
        return;
      case 'PUT':
        await _dio.put(path, data: data, options: Options(headers: headers));
        return;
      case 'PATCH':
        await _dio.patch(path, data: data, options: Options(headers: headers));
        return;
      case 'DELETE':
        await _dio.delete(path, data: data, options: Options(headers: headers));
        return;
      default:
        throw UnsupportedError('Method $method not supported for offline sync');
    }
  }

  bool _isNetworkError(DioException e) {
    return e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout;
  }

  Duration _retryDelay(int attempt) {
    final seconds = min(300, pow(2, min(8, attempt)).toInt());
    return Duration(seconds: seconds);
  }

  String? _extractServerErrorCode(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final error = responseData['error'];
      if (error is Map<String, dynamic>) {
        final code = error['code'];
        if (code is String && code.trim().isNotEmpty) {
          return code.trim();
        }
      }
    }
    return null;
  }

  Map<String, dynamic>? _extractServerSnapshot(dynamic responseData) {
    if (responseData is! Map<String, dynamic>) return null;
    final details = responseData['details'];
    if (details is Map<String, dynamic>) {
      final snapshot = details['snapshot'];
      if (snapshot is Map<String, dynamic>) {
        return snapshot;
      }
    }
    return null;
  }

  Future<bool> _tryAutoCreateCorrection(PendingMutationRow row) async {
    final target = _resolveCorrectionTarget(row);
    if (target == null) {
      return false;
    }

    await _dio.post(
      '/corrections',
      data: {
        'targetType': target.targetType,
        'targetId': target.targetId,
        'reason':
            'Auto-created by offline sync because the original record is locked.',
        'proposedChanges': row.payload,
      },
    );

    return true;
  }

  _CorrectionTarget? _resolveCorrectionTarget(PendingMutationRow row) {
    final endpoint = row.endpoint;

    if (endpoint.startsWith('/follow-ups/')) {
      final id = _extractLastNumericSegment(endpoint);
      if (id != null) {
        return _CorrectionTarget('FOLLOW_UP', id);
      }
    }

    if (endpoint.startsWith('/attempts/')) {
      final id = _extractLastNumericSegment(endpoint);
      if (id != null) {
        return _CorrectionTarget('EXAM_ATTEMPT', id);
      }
    }

    if (row.entity.toUpperCase() == 'ATTENDANCE') {
      final id = _readTargetIdFromPayload(row.payload);
      if (id != null) {
        return _CorrectionTarget('ATTENDANCE', id);
      }
    }

    if (row.entity.toUpperCase() == 'FOLLOW_UP') {
      final id = _readTargetIdFromPayload(row.payload) ??
          _extractLastNumericSegment(endpoint);
      if (id != null) {
        return _CorrectionTarget('FOLLOW_UP', id);
      }
    }

    if (row.entity.toUpperCase() == 'EXAM_ATTEMPT') {
      final id = _readTargetIdFromPayload(row.payload) ??
          _extractLastNumericSegment(endpoint);
      if (id != null) {
        return _CorrectionTarget('EXAM_ATTEMPT', id);
      }
    }

    return null;
  }

  int? _extractLastNumericSegment(String endpoint) {
    final parts = endpoint
        .split('/')
        .where((item) => item.trim().isNotEmpty)
        .toList(growable: false);
    for (int i = parts.length - 1; i >= 0; i--) {
      final parsed = int.tryParse(parts[i]);
      if (parsed != null && parsed > 0) {
        return parsed;
      }
    }
    return null;
  }

  int? _readTargetIdFromPayload(Map<String, dynamic> payload) {
    const keys = ['targetId', 'id', 'followUpId', 'attemptId', 'attendanceId'];
    for (final key in keys) {
      final value = payload[key];
      if (value is int && value > 0) {
        return value;
      }
      if (value is String) {
        final parsed = int.tryParse(value);
        if (parsed != null && parsed > 0) {
          return parsed;
        }
      }
    }
    return null;
  }
}

class _CorrectionTarget {
  final String targetType;
  final int targetId;

  const _CorrectionTarget(this.targetType, this.targetId);
}
