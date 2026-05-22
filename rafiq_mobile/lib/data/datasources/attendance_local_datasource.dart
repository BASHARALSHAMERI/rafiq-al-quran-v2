import 'package:hive_flutter/hive_flutter.dart';

import '../models/attendance_dtos.dart';
import 'sync_local_datasource.dart';

class PendingAttendanceSubmission {
  final String id;
  final DateTime createdAt;
  final BulkAttendanceRequest request;

  const PendingAttendanceSubmission({
    required this.id,
    required this.createdAt,
    required this.request,
  });
}

class AttendanceLocalDataSource {
  static const _boxName = 'app_cache';
  static const _pendingKey = 'attendance_pending_submissions';
  static const _studentsPrefix = 'attendance_students_';
  static const _recordsPrefix = 'attendance_records_';
  final SyncLocalDataSource _syncLocal = SyncLocalDataSource();

  Future<Box<dynamic>> _box() async {
    if (Hive.isBoxOpen(_boxName)) {
      return Hive.box<dynamic>(_boxName);
    }
    return Hive.openBox<dynamic>(_boxName);
  }

  String _studentsKey(String circleId) => '$_studentsPrefix$circleId';

  String _recordsKey(String circleId, String date) =>
      '$_recordsPrefix${circleId}_$date';

  Future<void> saveCachedStudents(
    String circleId,
    List<StudentDto> students,
  ) async {
    final box = await _box();
    final payload =
        students.map((item) => item.toJson()).toList(growable: false);
    await box.put(_studentsKey(circleId), payload);
  }

  Future<List<StudentDto>> getCachedStudents(String circleId) async {
    final box = await _box();
    final raw = box.get(_studentsKey(circleId));
    final list = _toListOfMaps(raw);
    return list
        .map(_safeStudentFromJson)
        .whereType<StudentDto>()
        .toList(growable: false);
  }

  Future<void> saveCachedAttendance(
    String circleId,
    String date,
    List<AttendanceRecordDto> records,
  ) async {
    final box = await _box();
    final payload =
        records.map((item) => item.toJson()).toList(growable: false);
    await box.put(_recordsKey(circleId, date), payload);
  }

  Future<List<AttendanceRecordDto>> getCachedAttendance(
    String circleId,
    String date,
  ) async {
    final box = await _box();
    final raw = box.get(_recordsKey(circleId, date));
    final list = _toListOfMaps(raw);
    return list
        .map(_safeAttendanceFromJson)
        .whereType<AttendanceRecordDto>()
        .toList(growable: false);
  }

  Future<void> enqueuePending(BulkAttendanceRequest request) async {
    final box = await _box();
    final entries = _pendingRawEntries(box);
    final now = DateTime.now();
    final mutationId =
        '${now.microsecondsSinceEpoch}-${request.circleId}-${request.date}';

    entries.add({
      'id': mutationId,
      'createdAt': now.toIso8601String(),
      'request': request.toJson(),
    });

    await box.put(_pendingKey, entries);

    await _syncLocal.enqueuePendingMutation(
      mutationId: mutationId,
      entity: 'ATTENDANCE',
      method: 'POST',
      endpoint: '/attendance/submit',
      payload: request.toJson(),
      idempotencyKey: mutationId,
    );
  }

  Future<List<PendingAttendanceSubmission>> getPendingSubmissions() async {
    final box = await _box();
    final entries = _pendingRawEntries(box);

    final submissions = <PendingAttendanceSubmission>[];
    for (final entry in entries) {
      final id = entry['id']?.toString().trim() ?? '';
      final createdAtRaw = entry['createdAt']?.toString();
      final requestRaw = entry['request'];
      if (id.isEmpty || requestRaw is! Map) {
        continue;
      }

      final request = _safeBulkFromJson(_toStringDynamicMap(requestRaw));
      if (request == null) {
        continue;
      }

      submissions.add(
        PendingAttendanceSubmission(
          id: id,
          createdAt: DateTime.tryParse(createdAtRaw ?? '') ?? DateTime.now(),
          request: request,
        ),
      );
    }

    submissions.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return submissions;
  }

  Future<void> removePendingSubmission(String id) async {
    final normalized = id.trim();
    if (normalized.isEmpty) {
      return;
    }

    final box = await _box();
    final entries = _pendingRawEntries(box)
      ..removeWhere((item) => item['id']?.toString() == normalized);
    await box.put(_pendingKey, entries);
  }

  Future<void> removePendingByCircleAndDate(
      String circleId, String date) async {
    final box = await _box();
    final entries = _pendingRawEntries(box);

    entries.removeWhere((entry) {
      final requestRaw = entry['request'];
      if (requestRaw is! Map) {
        return false;
      }
      final request = _safeBulkFromJson(_toStringDynamicMap(requestRaw));
      if (request == null) {
        return false;
      }
      return request.circleId == circleId && request.date == date;
    });

    await box.put(_pendingKey, entries);
  }

  List<Map<String, dynamic>> _pendingRawEntries(Box<dynamic> box) {
    final raw = box.get(_pendingKey);
    return _toListOfMaps(raw);
  }

  List<Map<String, dynamic>> _toListOfMaps(dynamic raw) {
    if (raw is! List) {
      return <Map<String, dynamic>>[];
    }

    return raw.whereType<Map>().map(_toStringDynamicMap).toList(growable: true);
  }

  Map<String, dynamic> _toStringDynamicMap(Map<dynamic, dynamic> map) {
    return map.map(
      (key, value) => MapEntry(key.toString(), value),
    );
  }

  StudentDto? _safeStudentFromJson(Map<String, dynamic> json) {
    try {
      return StudentDto.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  AttendanceRecordDto? _safeAttendanceFromJson(Map<String, dynamic> json) {
    try {
      return AttendanceRecordDto.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  BulkAttendanceRequest? _safeBulkFromJson(Map<String, dynamic> json) {
    try {
      return BulkAttendanceRequest.fromJson(json);
    } catch (_) {
      return null;
    }
  }
}
