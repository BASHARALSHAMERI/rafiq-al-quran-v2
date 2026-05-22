import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../application/auth/auth_providers.dart';
import '../../../application/context/context_controller.dart';

enum TeacherAttendanceStatus {
  present,
  absent,
  late,
}

enum TeacherAttentionSeverity {
  absent,
  late,
  pending,
}

class TeacherCircleStudentSummary {
  final int id;
  final String name;
  final String subtitle;
  final String? levelLabel;
  final TeacherAttendanceStatus? attendanceStatus;

  const TeacherCircleStudentSummary({
    required this.id,
    required this.name,
    required this.subtitle,
    this.levelLabel,
    this.attendanceStatus,
  });
}

class TeacherNeedsAttentionItem {
  final int studentId;
  final String name;
  final String issue;
  final TeacherAttentionSeverity severity;

  const TeacherNeedsAttentionItem({
    required this.studentId,
    required this.name,
    required this.issue,
    required this.severity,
  });
}

enum TeacherTaskAction {
  attendance,
  absences,
  lateness,
}

class TeacherTaskItemData {
  final String text;
  final bool done;
  final TeacherTaskAction action;

  const TeacherTaskItemData({
    required this.text,
    required this.done,
    required this.action,
  });
}

class TeacherCircleOverviewData {
  final String circleId;
  final String circleName;
  final String centerName;
  final int totalStudents;
  final int presentCount;
  final int absentCount;
  final int lateCount;
  final DateTime? latestAttendanceDate;
  final List<TeacherCircleStudentSummary> students;
  final List<TeacherNeedsAttentionItem> needsAttention;
  final List<TeacherTaskItemData> tasks;

  const TeacherCircleOverviewData({
    required this.circleId,
    required this.circleName,
    required this.centerName,
    required this.totalStudents,
    required this.presentCount,
    required this.absentCount,
    required this.lateCount,
    required this.latestAttendanceDate,
    required this.students,
    required this.needsAttention,
    required this.tasks,
  });
}

final teacherCircleOverviewProvider =
    FutureProvider<TeacherCircleOverviewData?>((ref) async {
  final selectedCircleId = ref.watch(
    contextControllerProvider.select((state) => state.selectedCircleId),
  );
  final selectedCircleName = ref.watch(
    contextControllerProvider.select((state) => state.selectedCircleName),
  );
  final selectedCenterName = ref.watch(
    contextControllerProvider.select((state) => state.selectedCenterName),
  );
  final circleId = int.tryParse(selectedCircleId ?? '');
  if (circleId == null) {
    return null;
  }

  final dio = ref.watch(apiClientProvider);
  final now = DateTime.now();
  final from = _formatDate(now.subtract(const Duration(days: 30)));
  final to = _formatDate(now);

  final responses = await Future.wait([
    dio.get(
      '/users',
      queryParameters: {
        'role': 'STUDENT',
        'circleId': circleId,
      },
    ),
    dio.get(
      '/reports/attendance',
      queryParameters: {
        'circleId': circleId,
        'from': from,
        'to': to,
      },
    ),
  ]);

  final userRows = _extractList(responses[0].data);
  final attendanceRows = _extractAttendanceRows(responses[1].data);

  final latestAttendanceDate = _latestAttendanceDate(attendanceRows);
  final latestRowsForDay = latestAttendanceDate == null
      ? const <Map<String, dynamic>>[]
      : attendanceRows
          .where((row) =>
              _sameDay(_readDate(row['attendanceDate']), latestAttendanceDate))
          .toList(growable: false);
  final latestRowsByStudent = _latestAttendanceRowsByStudent(attendanceRows);

  final circleName = _resolveCircleName(
    selectedCircleName,
    latestRowsForDay,
    userRows,
  );
  final centerName = _resolveCenterName(
    selectedCenterName,
    latestRowsForDay,
    userRows,
  );

  final students = userRows
      .map((row) {
        final studentId = _readInt(row['id']) ?? 0;
        final latestRow = latestRowsByStudent[studentId];
        final studentProfile = row['studentProfile'];
        return TeacherCircleStudentSummary(
          id: studentId,
          name: _resolveStudentName(row),
          levelLabel: studentProfile is Map<String, dynamic>
              ? _levelLabel(studentProfile['level'])
              : null,
          subtitle: _buildStudentSubtitle(row),
          attendanceStatus: _mapAttendanceStatus(latestRow?['status']),
        );
      })
      .where((student) => student.id > 0)
      .toList(growable: false)
    ..sort((a, b) => a.name.compareTo(b.name));

  final currentStudentIds = students.map((item) => item.id).toSet();
  var presentCount = 0;
  var absentCount = 0;
  var lateCount = 0;
  for (final row in latestRowsForDay) {
    final studentId = _readInt(row['studentId']);
    if (studentId == null || !currentStudentIds.contains(studentId)) {
      continue;
    }

    switch (_mapAttendanceStatus(row['status'])) {
      case TeacherAttendanceStatus.present:
        presentCount++;
        break;
      case TeacherAttendanceStatus.absent:
        absentCount++;
        break;
      case TeacherAttendanceStatus.late:
        lateCount++;
        break;
      case null:
        break;
    }
  }

  final todayRecorded = _sameDay(latestAttendanceDate, now);
  final needsAttention = <TeacherNeedsAttentionItem>[
    for (final student in students)
      if (student.attendanceStatus == TeacherAttendanceStatus.absent)
        TeacherNeedsAttentionItem(
          studentId: student.id,
          name: student.name,
          issue: 'غاب في آخر حضور مسجل',
          severity: TeacherAttentionSeverity.absent,
        )
      else if (student.attendanceStatus == TeacherAttendanceStatus.late)
        TeacherNeedsAttentionItem(
          studentId: student.id,
          name: student.name,
          issue: 'متأخر في آخر حضور مسجل',
          severity: TeacherAttentionSeverity.late,
        ),
  ];

  if (needsAttention.isEmpty && students.isNotEmpty && !todayRecorded) {
    for (final student in students.take(2)) {
      needsAttention.add(
        TeacherNeedsAttentionItem(
          studentId: student.id,
          name: student.name,
          issue: 'لم يُسجَّل حضور اليوم',
          severity: TeacherAttentionSeverity.pending,
        ),
      );
    }
  }

  final tasks = [
    TeacherTaskItemData(
      text: 'تسجيل حضور $circleName',
      done: todayRecorded,
      action: TeacherTaskAction.attendance,
    ),
    TeacherTaskItemData(
      text: 'متابعة حالات الغياب',
      done: latestAttendanceDate != null && absentCount == 0,
      action: TeacherTaskAction.absences,
    ),
    TeacherTaskItemData(
      text: 'مراجعة حالات التأخر',
      done: latestAttendanceDate != null && lateCount == 0,
      action: TeacherTaskAction.lateness,
    ),
  ];

  return TeacherCircleOverviewData(
    circleId: circleId.toString(),
    circleName: circleName,
    centerName: centerName,
    totalStudents: students.length,
    presentCount: presentCount,
    absentCount: absentCount,
    lateCount: lateCount,
    latestAttendanceDate: latestAttendanceDate,
    students: students,
    needsAttention: needsAttention,
    tasks: tasks,
  );
});

List<Map<String, dynamic>> _extractList(dynamic responseData) {
  if (responseData is List) {
    return responseData
        .whereType<Map<String, dynamic>>()
        .toList(growable: false);
  }

  if (responseData is Map<String, dynamic>) {
    final data = responseData['data'];
    if (data is List) {
      return data.whereType<Map<String, dynamic>>().toList(growable: false);
    }
  }

  return const [];
}

List<Map<String, dynamic>> _extractAttendanceRows(dynamic responseData) {
  if (responseData is Map<String, dynamic>) {
    final data = responseData['data'];
    if (data is Map<String, dynamic>) {
      final rows = data['rows'];
      if (rows is List) {
        return rows.whereType<Map<String, dynamic>>().toList(growable: false);
      }
    }
  }

  return const [];
}

Map<int, Map<String, dynamic>> _latestAttendanceRowsByStudent(
  List<Map<String, dynamic>> rows,
) {
  final sortedRows = [...rows]..sort((a, b) {
      final left = _readDate(a['attendanceDate']);
      final right = _readDate(b['attendanceDate']);
      if (left == null && right == null) {
        return 0;
      }
      if (left == null) {
        return 1;
      }
      if (right == null) {
        return -1;
      }
      return right.compareTo(left);
    });

  final output = <int, Map<String, dynamic>>{};
  for (final row in sortedRows) {
    final studentId = _readInt(row['studentId']);
    if (studentId == null || output.containsKey(studentId)) {
      continue;
    }
    output[studentId] = row;
  }
  return output;
}

DateTime? _latestAttendanceDate(List<Map<String, dynamic>> rows) {
  DateTime? latest;
  for (final row in rows) {
    final date = _readDate(row['attendanceDate']);
    if (date == null) {
      continue;
    }
    if (latest == null || date.isAfter(latest)) {
      latest = date;
    }
  }
  return latest;
}

TeacherAttendanceStatus? _mapAttendanceStatus(dynamic rawStatus) {
  switch ((rawStatus ?? '').toString().toUpperCase()) {
    case 'PRESENT':
      return TeacherAttendanceStatus.present;
    case 'ABSENT':
    case 'EXCUSED':
      return TeacherAttendanceStatus.absent;
    case 'LATE':
      return TeacherAttendanceStatus.late;
    default:
      return null;
  }
}

String _resolveStudentName(Map<String, dynamic> row) {
  final profile = row['profile'];
  final profileName =
      profile is Map<String, dynamic> ? profile['fullName']?.toString() : null;
  final fullName = row['fullName']?.toString();
  final name = profileName?.trim().isNotEmpty == true
      ? profileName!.trim()
      : (fullName?.trim().isNotEmpty == true ? fullName!.trim() : '');
  return name.isEmpty ? 'طالب' : name;
}

String _buildStudentSubtitle(Map<String, dynamic> userRow) {
  final profile = userRow;
  final followUps = (profile['followUpsAsStudent'] as List?)
          ?.whereType<Map<String, dynamic>>()
          .toList() ??
      const <Map<String, dynamic>>[];
  if (followUps.isNotEmpty) {
    final latest = [...followUps]..sort((a, b) =>
        ((b['recordDate'] ?? '').toString())
            .compareTo((a['recordDate'] ?? '').toString()));
    final record = latest.first;
    final surah = (record['surah'] ?? '').toString().trim();
    final fromAyah = record['fromAyah']?.toString();
    final toAyah = record['toAyah']?.toString();
    if (surah.isNotEmpty && fromAyah != null && toAyah != null) {
      return '$surah $fromAyah-$toAyah';
    }
    final notes = (record['notes'] ?? '').toString().trim();
    if (notes.isNotEmpty) {
      return notes;
    }
  }

  final memorizedJuzz = _readInt(profile['metrics']?['memorizedJuzz']);
  if (memorizedJuzz != null && memorizedJuzz > 0) {
    return 'المحفوظ: $memorizedJuzz جزء';
  }

  final level = _levelLabel(profile['studentProfile']?['level']);
  if (level != null) {
    return 'المستوى: $level';
  }

  final nickname =
      (profile['studentProfile']?['nickname'] ?? '').toString().trim();
  if (nickname.isNotEmpty) {
    return nickname;
  }

  final studentProfile = userRow['studentProfile'];
  if (studentProfile is Map<String, dynamic>) {
    final currentJuzz = _readInt(studentProfile['currentJuzz']);
    if (currentJuzz != null && currentJuzz > 0) {
      return 'المحفوظ: $currentJuzz جزء';
    }

    final rawLevel = studentProfile['level'];
    final fallbackLevel = _levelLabel(rawLevel);
    if (fallbackLevel != null) {
      return 'المستوى: $fallbackLevel';
    }
  }

  return 'لا يوجد سجل متابعة بعد';
}

String? _levelLabel(dynamic rawLevel) {
  switch ((rawLevel ?? '').toString().toUpperCase()) {
    case 'BEGINNER':
      return 'مبتدئ';
    case 'INTERMEDIATE':
      return 'متوسط';
    case 'ADVANCED':
      return 'متقدم';
    default:
      return null;
  }
}

String _resolveCircleName(
  String? selectedCircleName,
  List<Map<String, dynamic>> latestRows,
  Iterable<Map<String, dynamic>> profiles,
) {
  final selected = selectedCircleName?.trim() ?? '';
  if (selected.isNotEmpty) {
    return selected;
  }

  for (final row in latestRows) {
    final name = (row['circleName'] ?? '').toString().trim();
    if (name.isNotEmpty) {
      return name;
    }
  }

  for (final profile in profiles) {
    final enrollments = (profile['studentEnrollments'] as List?)
            ?.whereType<Map<String, dynamic>>() ??
        const <Map<String, dynamic>>[];
    for (final enrollment in enrollments) {
      final circle = enrollment['circle'];
      if (circle is Map<String, dynamic>) {
        final name = (circle['name'] ?? '').toString().trim();
        if (name.isNotEmpty) {
          return name;
        }
      }
    }
  }

  return 'الحلقة';
}

String _resolveCenterName(
  String? selectedCenterName,
  List<Map<String, dynamic>> latestRows,
  Iterable<Map<String, dynamic>> profiles,
) {
  final selected = selectedCenterName?.trim() ?? '';
  if (selected.isNotEmpty) {
    return selected;
  }

  for (final row in latestRows) {
    final name = (row['centerName'] ?? '').toString().trim();
    if (name.isNotEmpty) {
      return name;
    }
  }

  for (final profile in profiles) {
    final enrollments = (profile['studentEnrollments'] as List?)
            ?.whereType<Map<String, dynamic>>() ??
        const <Map<String, dynamic>>[];
    for (final enrollment in enrollments) {
      final circle = enrollment['circle'];
      if (circle is! Map<String, dynamic>) {
        continue;
      }
      final center = circle['center'];
      if (center is Map<String, dynamic>) {
        final name = (center['name'] ?? '').toString().trim();
        if (name.isNotEmpty) {
          return name;
        }
      }
    }
  }

  return 'المركز';
}

DateTime? _readDate(dynamic rawDate) {
  final value = (rawDate ?? '').toString();
  if (value.trim().isEmpty) {
    return null;
  }
  return DateTime.tryParse(value);
}

int? _readInt(dynamic rawValue) {
  return int.tryParse('${rawValue ?? ''}');
}

bool _sameDay(DateTime? left, DateTime? right) {
  if (left == null || right == null) {
    return false;
  }
  return left.year == right.year &&
      left.month == right.month &&
      left.day == right.day;
}

String _formatDate(DateTime value) {
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  return '${value.year}-$month-$day';
}
