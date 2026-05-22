import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../context/context_controller.dart';

class ExamStudentOption {
  final int id;
  final String fullName;
  final String levelLabel;
  final String statusLabel;

  const ExamStudentOption({
    required this.id,
    required this.fullName,
    required this.levelLabel,
    required this.statusLabel,
  });
}

final examStudentOptionsProvider =
    FutureProvider.autoDispose<List<ExamStudentOption>>((ref) async {
  final contextState = ref.watch(contextControllerProvider);
  final selectedCircleId = contextState.selectedCircleId?.trim();
  final selectedCenterId = contextState.selectedCenterId?.trim();

  final query = <String, dynamic>{'role': 'STUDENT'};
  if (selectedCircleId != null && selectedCircleId.isNotEmpty) {
    query['circleId'] = selectedCircleId;
  } else if (selectedCenterId != null && selectedCenterId.isNotEmpty) {
    query['centerId'] = selectedCenterId;
  }

  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/users', queryParameters: query);
  final rows = _extractUserRows(response.data);
  final output = <ExamStudentOption>[];

  for (final row in rows) {
    final id = int.tryParse('${row['id'] ?? ''}');
    if (id == null || id <= 0) {
      continue;
    }

    final profile = row['profile'] is Map<String, dynamic>
        ? row['profile'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final studentProfile = row['studentProfile'] is Map<String, dynamic>
        ? row['studentProfile'] as Map<String, dynamic>
        : const <String, dynamic>{};

    final rawName = profile['fullName'] ?? row['fullName'] ?? row['name'];
    final fullName = rawName is String && rawName.trim().isNotEmpty
        ? rawName.trim()
        : 'طالب #$id';

    output.add(
      ExamStudentOption(
        id: id,
        fullName: fullName,
        levelLabel: _levelLabel(studentProfile['level']?.toString()),
        statusLabel: _statusLabel(studentProfile['studentStatus']?.toString()),
      ),
    );
  }

  output.sort((a, b) => a.fullName.compareTo(b.fullName));
  return output;
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

String readExamStudentError(Object error) {
  if (error is DioException) {
    final payload = error.response?.data;
    if (payload is Map<String, dynamic>) {
      final message = payload['message'] ?? payload['error'];
      if (message is String && message.trim().isNotEmpty) {
        return message.trim();
      }
    }
  }

  return 'تعذر تحميل الطلاب';
}

String _levelLabel(String? raw) {
  switch ((raw ?? '').toUpperCase()) {
    case 'BEGINNER':
      return 'مبتدئ';
    case 'INTERMEDIATE':
      return 'متوسط';
    case 'ADVANCED':
      return 'متقدم';
    default:
      return 'غير محدد';
  }
}

String _statusLabel(String? raw) {
  switch ((raw ?? '').toUpperCase()) {
    case 'REGULAR':
      return 'منتظم';
    case 'GRADUATED':
      return 'متخرج';
    case 'DROPPED':
      return 'منقطع';
    default:
      return 'غير محدد';
  }
}
