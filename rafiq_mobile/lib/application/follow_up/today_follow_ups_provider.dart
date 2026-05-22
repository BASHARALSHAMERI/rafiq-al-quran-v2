import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';

class _FollowUpPageResult {
  final List<Map<String, dynamic>> items;
  final int total;

  const _FollowUpPageResult({
    required this.items,
    required this.total,
  });
}

_FollowUpPageResult _extractFollowUpPage(dynamic raw) {
  List<Map<String, dynamic>> items = const [];
  var total = 0;

  if (raw is Map<String, dynamic>) {
    final data = raw['data'];
    if (data is List) {
      items = data.whereType<Map<String, dynamic>>().toList();
    } else if (data is Map<String, dynamic>) {
      final nested = data['data'] ?? data['items'];
      if (nested is List) {
        items = nested.whereType<Map<String, dynamic>>().toList();
      }

      final rawTotal = data['total'];
      if (rawTotal is num) {
        total = rawTotal.toInt();
      }
    }
  }

  return _FollowUpPageResult(
    items: items,
    total: total,
  );
}

Future<List<Map<String, dynamic>>> _fetchAllTodayFollowUps(
  dynamic dio, {
  required int circleId,
  required String today,
}) async {
  const pageSize = 100;
  final items = <Map<String, dynamic>>[];

  for (var page = 1; page <= 100; page++) {
    final response = await dio.get('/follow-ups', queryParameters: {
      'circleId': circleId,
      'from': today,
      'to': today,
      'page': page,
      'pageSize': pageSize,
    });

    final pageResult = _extractFollowUpPage(response.data);
    items.addAll(pageResult.items);

    final fetchedAll =
        pageResult.total > 0 ? items.length >= pageResult.total : false;
    if (fetchedAll || pageResult.items.length < pageSize) {
      break;
    }
  }

  return items;
}

/// Fetches today's follow-up records for a given circle and returns
/// a Map: studentId → Set<FollowUpType> recorded today.
///
/// Usage:
///   final todayMap = ref.watch(todayFollowUpsProvider(circleId));
final todayFollowUpsProvider =
    FutureProvider.family<Map<int, Set<String>>, int>((ref, circleId) async {
  final dio = ref.watch(apiClientProvider);
  final today = DateTime.now().toIso8601String().split('T').first;

  final items = await _fetchAllTodayFollowUps(
    dio,
    circleId: circleId,
    today: today,
  );

  final result = <int, Set<String>>{};
  for (final item in items) {
    final studentId = item['studentId'];
    final type = item['type'];
    if (studentId is int && type is String) {
      result.putIfAbsent(studentId, () => <String>{}).add(type);
    }
  }

  return result;
});
