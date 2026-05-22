import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_controller.dart';
import '../../application/auth/auth_providers.dart';

class StudentDashboardState {
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? profileData;

  const StudentDashboardState({
    this.isLoading = false,
    this.error,
    this.profileData,
  });

  StudentDashboardState copyWith({
    bool? isLoading,
    String? error,
    Map<String, dynamic>? profileData,
  }) {
    return StudentDashboardState(
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      profileData: profileData ?? this.profileData,
    );
  }
}

class StudentDashboardController extends StateNotifier<StudentDashboardState> {
  final Dio _dio;
  final Ref _ref;

  StudentDashboardController(this._dio, this._ref)
      : super(const StudentDashboardState());

  Future<void> loadProfile() async {
    final authState = _ref.read(authControllerProvider);
    final userId = authState.user?.id;

    if (userId == null) {
      state = state.copyWith(error: 'User not logged in', isLoading: false);
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _dio.get('/users/$userId/student-profile');
      state =
          state.copyWith(isLoading: false, profileData: response.data['data']);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final studentDashboardProvider =
    StateNotifierProvider<StudentDashboardController, StudentDashboardState>(
        (ref) {
  final dio = ref.watch(apiClientProvider);
  return StudentDashboardController(dio, ref);
});
