import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../auth/auth_providers.dart';
import '../context/context_controller.dart';

/// Data model for the halqa (circle) monthly report
class HalqaReportData {
  final int totalStudents;
  final double attendanceRate;
  final int totalFollowUps;
  final int finalizedFollowUps;
  final List<HalqaAttendanceRow> attendanceRows;
  final List<HalqaStudentSummary> studentSummaries;

  const HalqaReportData({
    required this.totalStudents,
    required this.attendanceRate,
    required this.totalFollowUps,
    required this.finalizedFollowUps,
    required this.attendanceRows,
    required this.studentSummaries,
  });

  double get followUpRate =>
      totalFollowUps > 0 ? (finalizedFollowUps / totalFollowUps) * 100 : 0;
}

class HalqaAttendanceRow {
  final String date;
  final int present;
  final int absent;
  final int late;

  const HalqaAttendanceRow({
    required this.date,
    required this.present,
    required this.absent,
    required this.late,
  });
}

class HalqaStudentSummary {
  final int id;
  final String name;
  final int attendancePercent;
  final int followUpCount;
  final double avgRating;

  const HalqaStudentSummary({
    required this.id,
    required this.name,
    required this.attendancePercent,
    required this.followUpCount,
    required this.avgRating,
  });
}

/// Provider that fetches halqa-level report data for a given month.
/// Parameter is the month key e.g. "2026-03".
final halqaReportProvider =
    FutureProvider.family<HalqaReportData, String>((ref, monthKey) async {
  final dio = ref.watch(apiClientProvider);
  final circleId = ref.watch(
    contextControllerProvider.select((state) => state.selectedCircleId),
  );

  if (circleId == null || circleId.isEmpty) {
    return const HalqaReportData(
      totalStudents: 0,
      attendanceRate: 0,
      totalFollowUps: 0,
      finalizedFollowUps: 0,
      attendanceRows: [],
      studentSummaries: [],
    );
  }

  // Parse month key to get from/to dates
  final parts = monthKey.split('-');
  final year = int.tryParse(parts.firstOrNull ?? '') ?? DateTime.now().year;
  final month =
      parts.length > 1 ? int.tryParse(parts[1]) ?? DateTime.now().month : 1;
  final from = DateTime(year, month, 1);
  final to = DateTime(year, month + 1, 0); // Last day of month
  final fmt = DateFormat('yyyy-MM-dd');

  // Fetch attendance report
  final attendanceRes = await dio.get('/reports/attendance', queryParameters: {
    'circleId': circleId,
    'from': fmt.format(from),
    'to': fmt.format(to),
  });

  // Parse attendance data
  final attData = _extractData(attendanceRes.data);
  final attKpis = _asMap(attData['kpis']);
  final attRows = _asList(attData['rows']);

  final totalRecords = _asInt(attKpis['totalRecords']);
  final presentCount = _asInt(attKpis['present']);
  final attendanceRate =
      totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0.0;

  // Group attendance by date for table
  final byDate = <String, Map<String, int>>{};
  for (final row in attRows) {
    final dateStr = row['attendanceDate']?.toString().split('T').first ?? '';
    if (dateStr.isEmpty) continue;
    byDate.putIfAbsent(dateStr, () => {'present': 0, 'absent': 0, 'late': 0});
    final status = row['status']?.toString() ?? '';
    if (status == 'PRESENT') {
      byDate[dateStr]!['present'] = (byDate[dateStr]!['present'] ?? 0) + 1;
    } else if (status == 'ABSENT' || status == 'EXCUSED') {
      byDate[dateStr]!['absent'] = (byDate[dateStr]!['absent'] ?? 0) + 1;
    } else if (status == 'LATE') {
      byDate[dateStr]!['late'] = (byDate[dateStr]!['late'] ?? 0) + 1;
    }
  }

  final sortedDates = byDate.keys.toList()..sort();
  final attendanceTableRows = sortedDates.map((d) {
    final dayMonth = d.substring(5); // "MM-dd"
    final dayParts = dayMonth.split('-');
    final displayDate =
        dayParts.length == 2 ? '${dayParts[1]}/${dayParts[0]}' : d;
    return HalqaAttendanceRow(
      date: displayDate,
      present: byDate[d]!['present'] ?? 0,
      absent: byDate[d]!['absent'] ?? 0,
      late: byDate[d]!['late'] ?? 0,
    );
  }).toList(growable: false);

  // Unique students from attendance
  final studentSet = <int>{};
  final studentNames = <int, String>{};
  final studentPresent = <int, int>{};
  final studentTotal = <int, int>{};
  for (final row in attRows) {
    final sid = _asInt(row['studentId']);
    if (sid <= 0) continue;
    studentSet.add(sid);
    studentNames.putIfAbsent(sid, () => row['studentName']?.toString() ?? '');
    studentTotal[sid] = (studentTotal[sid] ?? 0) + 1;
    if (row['status'] == 'PRESENT') {
      studentPresent[sid] = (studentPresent[sid] ?? 0) + 1;
    }
  }

  // Fetch follow-ups for the same month
  final fuItems = await _fetchAllFollowUps(
    dio,
    circleId: circleId,
    from: fmt.format(from),
    to: fmt.format(to),
  );

  final totalFollowUps = fuItems.length;
  final finalizedFollowUps =
      fuItems.where((item) => item['status'] == 'FINAL').length;

  // Per-student follow-up stats
  final studentFUCount = <int, int>{};
  final studentRatingSum = <int, double>{};
  final studentRatingCount = <int, int>{};
  for (final fu in fuItems) {
    final sid = _asInt(fu['studentId']);
    if (sid <= 0) continue;
    studentSet.add(sid);
    studentFUCount[sid] = (studentFUCount[sid] ?? 0) + 1;
    final rating = fu['rating'];
    if (rating is num && rating > 0) {
      studentRatingSum[sid] = (studentRatingSum[sid] ?? 0) + rating.toDouble();
      studentRatingCount[sid] = (studentRatingCount[sid] ?? 0) + 1;
    }
  }

  // Build student summaries
  final summaries = studentSet.map((sid) {
    final total = studentTotal[sid] ?? 0;
    final present = studentPresent[sid] ?? 0;
    final attPct = total > 0 ? ((present / total) * 100).round() : 0;
    final rCount = studentRatingCount[sid] ?? 0;
    final rSum = studentRatingSum[sid] ?? 0;
    final avgR = rCount > 0 ? rSum / rCount : 0.0;

    return HalqaStudentSummary(
      id: sid,
      name: studentNames[sid] ?? 'طالب #$sid',
      attendancePercent: attPct,
      followUpCount: studentFUCount[sid] ?? 0,
      avgRating: avgR,
    );
  }).toList(growable: false)
    ..sort((a, b) => b.attendancePercent.compareTo(a.attendancePercent));

  return HalqaReportData(
    totalStudents: studentSet.length,
    attendanceRate: attendanceRate,
    totalFollowUps: totalFollowUps,
    finalizedFollowUps: finalizedFollowUps,
    attendanceRows: attendanceTableRows,
    studentSummaries: summaries,
  );
});

// ── Helpers ──────────────────────────────────────────────
Map<String, dynamic> _extractData(dynamic responseData) {
  if (responseData is Map<String, dynamic>) {
    final data = responseData['data'];
    if (data is Map<String, dynamic>) return data;
    return responseData;
  }
  return const <String, dynamic>{};
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  return const <String, dynamic>{};
}

List<Map<String, dynamic>> _asList(dynamic value) {
  if (value is List) {
    return value.whereType<Map<String, dynamic>>().toList(growable: false);
  }
  return const [];
}

({List<Map<String, dynamic>> items, int total}) _extractFollowUpPage(
  dynamic responseData,
) {
  List<Map<String, dynamic>> items = const [];
  var total = 0;

  if (responseData is Map<String, dynamic>) {
    final data = responseData['data'];
    if (data is List) {
      items = data.whereType<Map<String, dynamic>>().toList(growable: false);
    } else if (data is Map<String, dynamic>) {
      final nested = data['data'] ?? data['items'];
      if (nested is List) {
        items =
            nested.whereType<Map<String, dynamic>>().toList(growable: false);
      }

      final rawTotal = data['total'];
      if (rawTotal is num) {
        total = rawTotal.toInt();
      }
    }
  }

  return (items: items, total: total);
}

Future<List<Map<String, dynamic>>> _fetchAllFollowUps(
  Dio dio, {
  required String circleId,
  required String from,
  required String to,
}) async {
  const pageSize = 100;
  final allItems = <Map<String, dynamic>>[];

  for (var page = 1; page <= 100; page++) {
    final response = await dio.get('/follow-ups', queryParameters: {
      'circleId': circleId,
      'from': from,
      'to': to,
      'page': page,
      'pageSize': pageSize,
    });

    final pageResult = _extractFollowUpPage(response.data);
    allItems.addAll(pageResult.items);

    final fetchedAll =
        pageResult.total > 0 ? allItems.length >= pageResult.total : false;
    if (fetchedAll || pageResult.items.length < pageSize) {
      break;
    }
  }

  return allItems;
}

int _asInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}
