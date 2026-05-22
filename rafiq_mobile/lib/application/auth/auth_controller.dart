import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../context/context_controller.dart';
import '../../domain/entities/user.dart';
import 'auth_providers.dart';
import 'auth_session_events.dart';

class AuthState {
  final bool isInitialized;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;
  final User? user;

  const AuthState({
    this.isInitialized = false,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
    this.user,
  });

  AuthState copyWith({
    bool? isInitialized,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
    User? user,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return AuthState(
      isInitialized: isInitialized ?? this.isInitialized,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: clearError ? null : (error ?? this.error),
      user: clearUser ? null : (user ?? this.user),
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  final Ref _ref;
  StreamSubscription<AuthSessionEvent>? _sessionSubscription;

  AuthController(this._ref) : super(const AuthState()) {
    _sessionSubscription =
        _ref.read(authSessionEventsProvider).stream.listen(_onSessionEvent);
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final repository = _ref.read(authRepositoryProvider);
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await repository.getCurrentUser();
      if (!mounted) {
        return;
      }

      if (user == null) {
        await _ref.read(contextControllerProvider.notifier).clearContext();
        if (!mounted) {
          return;
        }
        state = const AuthState(
          isInitialized: true,
          isLoading: false,
          isAuthenticated: false,
        );
        return;
      }

      state = AuthState(
        isInitialized: true,
        isLoading: false,
        isAuthenticated: true,
        user: user,
      );
    } catch (_) {
      await _ref.read(contextControllerProvider.notifier).clearContext();
      if (!mounted) {
        return;
      }
      state = const AuthState(
        isInitialized: true,
        isLoading: false,
        isAuthenticated: false,
      );
    }
  }

  Future<void> login(String usernameOrPhone, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final repository = _ref.read(authRepositoryProvider);
      final user = await repository.login(usernameOrPhone, password);
      await _ref.read(contextControllerProvider.notifier).init();

      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
        isAuthenticated: true,
        user: user,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
        isAuthenticated: false,
        error: _mapLoginError(error),
      );
    }
  }

  Future<void> logout() async {
    final repository = _ref.read(authRepositoryProvider);
    try {
      await repository.logout();
    } finally {
      await _ref.read(contextControllerProvider.notifier).clearContext();
      state = const AuthState(
        isInitialized: true,
        isLoading: false,
        isAuthenticated: false,
      );
    }
  }

  void _onSessionEvent(AuthSessionEvent event) {
    if (event != AuthSessionEvent.expired) {
      return;
    }
    unawaited(_ref.read(contextControllerProvider.notifier).clearContext());
    state = const AuthState(
      isInitialized: true,
      isLoading: false,
      isAuthenticated: false,
      error: 'Session expired. Please sign in again.',
    );
  }

  String _mapLoginError(Object error) {
    if (error is DioException) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) {
        return 'بيانات الدخول غير صحيحة.';
      }
      if (statusCode == 429) {
        return 'عدد محاولات كبير. انتظر قليلًا ثم أعد المحاولة.';
      }
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        return 'تعذر الاتصال بالخادم. تأكد من تشغيل الخدمة ثم أعد المحاولة.';
      }
      return 'حدث خطأ من الخادم (${statusCode ?? '-'}) أثناء تسجيل الدخول.';
    }

    return 'فشل تسجيل الدخول. تحقق من البيانات ثم أعد المحاولة.';
  }

  @override
  void dispose() {
    _sessionSubscription?.cancel();
    super.dispose();
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});
