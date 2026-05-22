import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_controller.dart';
import '../../application/auth/auth_providers.dart';

class ParentDashboardState {
  static const _sentinel = Object();

  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? parentData;
  final Map<int, Map<String, dynamic>> childrenProfiles;

  const ParentDashboardState({
    this.isLoading = false,
    this.error,
    this.parentData,
    this.childrenProfiles = const {},
  });

  ParentDashboardState copyWith({
    bool? isLoading,
    Object? error = _sentinel,
    Object? parentData = _sentinel,
    Map<int, Map<String, dynamic>>? childrenProfiles,
  }) {
    return ParentDashboardState(
      isLoading: isLoading ?? this.isLoading,
      error: identical(error, _sentinel) ? this.error : error as String?,
      parentData: identical(parentData, _sentinel)
          ? this.parentData
          : parentData as Map<String, dynamic>?,
      childrenProfiles: childrenProfiles ?? this.childrenProfiles,
    );
  }
}

class ParentDashboardController extends StateNotifier<ParentDashboardState> {
  final Dio _dio;
  final Ref _ref;

  ParentDashboardController(this._dio, this._ref)
      : super(const ParentDashboardState());

  Future<void> loadChildren() async {
    final authState = _ref.read(authControllerProvider);
    final userId = authState.user?.id;

    if (userId == null) {
      state = state.copyWith(error: 'User not logged in', isLoading: false);
      return;
    }

    state = state.copyWith(
      isLoading: true,
      error: null,
      childrenProfiles: const {},
    );

    try {
      final response = await _dio.get('/users/$userId');
      final parentData = _readDataMap(response.data);
      final parentLinks =
          parentData['parentLinks'] as List<dynamic>? ?? const [];
      final childIds = parentLinks
          .map(_readStudentId)
          .whereType<int>()
          .toSet()
          .toList(growable: false);
      final childEntries = await Future.wait(childIds.map(_loadChildProfile));
      final childrenProfiles = <int, Map<String, dynamic>>{
        for (final entry
            in childEntries.whereType<MapEntry<int, Map<String, dynamic>>>())
          entry.key: entry.value,
      };

      state = state.copyWith(
        isLoading: false,
        error: null,
        parentData: parentData,
        childrenProfiles: childrenProfiles,
      );
    } on DioException catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _readErrorMessage(error),
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
    }
  }

  Future<MapEntry<int, Map<String, dynamic>>?> _loadChildProfile(
    int studentId,
  ) async {
    try {
      final response = await _dio.get('/users/$studentId/student-profile');
      return MapEntry(studentId, _readDataMap(response.data));
    } catch (_) {
      return null;
    }
  }

  Map<String, dynamic> _readDataMap(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      final data = payload['data'];
      if (data is Map<String, dynamic>) {
        return data;
      }
      return payload;
    }

    if (payload is Map) {
      final normalized = Map<String, dynamic>.from(payload);
      final data = normalized['data'];
      if (data is Map) {
        return Map<String, dynamic>.from(data);
      }
      return normalized;
    }

    return const {};
  }

  int? _readStudentId(dynamic link) {
    if (link is! Map) {
      return null;
    }

    final rawValue = link['studentId'];
    if (rawValue is int) {
      return rawValue;
    }

    return int.tryParse('$rawValue');
  }

  String _readErrorMessage(DioException error) {
    final payload = error.response?.data;
    if (payload is Map<String, dynamic>) {
      final message = payload['message'] ?? payload['error'];
      if (message is String && message.trim().isNotEmpty) {
        return message.trim();
      }
    }

    final message = error.message?.trim();
    if (message != null && message.isNotEmpty) {
      return message;
    }

    return 'Failed to load parent dashboard.';
  }
}

final parentDashboardProvider =
    StateNotifierProvider<ParentDashboardController, ParentDashboardState>(
        (ref) {
  final dio = ref.watch(apiClientProvider);
  return ParentDashboardController(dio, ref);
});
