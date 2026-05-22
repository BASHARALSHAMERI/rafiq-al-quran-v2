import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../context/context_controller.dart';

class ExamCommitteeOption {
  final int id;
  final String fullName;
  final String role;

  const ExamCommitteeOption({
    required this.id,
    required this.fullName,
    required this.role,
  });

  String get roleLabel => role == 'SUPERVISOR' ? 'مشرف' : 'معلم';
}

final examCommitteeOptionsProvider =
    FutureProvider.autoDispose<List<ExamCommitteeOption>>((ref) async {
  final contextState = ref.watch(contextControllerProvider);
  final selectedCenterId = contextState.selectedCenterId?.trim();

  if (selectedCenterId == null || selectedCenterId.isEmpty) {
    return const [];
  }

  final dio = ref.watch(apiClientProvider);
  final roles = ['SUPERVISOR', 'TEACHER'];
  final output = <ExamCommitteeOption>[];

  for (final role in roles) {
    final response = await dio.get(
      '/users',
      queryParameters: {
        'role': role,
        'centerId': selectedCenterId,
      },
    );

    for (final row in _extractUserRows(response.data)) {
      final id = int.tryParse('${row['id'] ?? ''}');
      if (id == null || id <= 0) {
        continue;
      }

      final rawName = row['fullName'] ?? row['name'];
      final fullName = rawName is String && rawName.trim().isNotEmpty
          ? rawName.trim()
          : 'عضو لجنة #$id';

      output.add(
        ExamCommitteeOption(
          id: id,
          fullName: fullName,
          role: role,
        ),
      );
    }
  }

  final unique = <int, ExamCommitteeOption>{};
  for (final item in output) {
    unique[item.id] = item;
  }

  final values = unique.values.toList(growable: false)
    ..sort((a, b) => a.fullName.compareTo(b.fullName));
  return values;
});

List<Map<String, dynamic>> _extractUserRows(dynamic responseData) {
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
    if (data is Map<String, dynamic>) {
      final items = data['items'];
      if (items is List) {
        return items.whereType<Map<String, dynamic>>().toList(growable: false);
      }
    }
  }

  return const [];
}

String readExamCommitteeError(Object error) {
  if (error is DioException) {
    final payload = error.response?.data;
    if (payload is Map<String, dynamic>) {
      final message = payload['message'] ?? payload['error'];
      if (message is String && message.trim().isNotEmpty) {
        return message.trim();
      }
    }
  }

  return 'تعذر تحميل أعضاء اللجنة';
}
