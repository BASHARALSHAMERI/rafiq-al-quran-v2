import 'dart:async';

import 'package:dio/dio.dart';

import '../../application/auth/auth_session_events.dart';
import '../../data/datasources/auth_local_datasource.dart';
import '../config/env_config.dart';
import 'global_error_interceptor.dart';

const _defaultJsonHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  'Bypass-Tunnel-Reminder': 'true',
};

const _verboseNetworkLogs =
    bool.fromEnvironment('VERBOSE_NETWORK_LOGS', defaultValue: false);

class AuthInterceptor extends Interceptor {
  final AuthLocalDataSource localDataSource;
  final AuthSessionEvents sessionEvents;
  final Dio dio;

  Future<_RefreshResult>? _refreshInFlight;

  AuthInterceptor(this.dio, this.localDataSource, this.sessionEvents);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    options.headers['X-Requested-With'] = 'XMLHttpRequest';

    if (_isAuthExempt(options.path)) {
      handler.next(options);
      return;
    }

    final accessToken = await localDataSource.getAccessToken();
    if (accessToken != null && accessToken.trim().isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (!_shouldTryRefresh(err)) {
      if (_isUnrecoverableUnauthorized(err)) {
        err.requestOptions.extra['session_expired'] = true;
        await _expireSession();
      }
      handler.next(err);
      return;
    }

    final refreshResult = await _refreshAccessToken();
    final newAccessToken = refreshResult.accessToken;
    if (newAccessToken == null) {
      err.requestOptions.extra['session_expired'] = true;
      if (refreshResult.reason != _RefreshFailureReason.invalidSession) {
        await _expireSession();
      }
      handler.next(err);
      return;
    }

    try {
      final requestOptions = err.requestOptions;
      requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
      requestOptions.extra['retried_after_refresh'] = true;
      final response = await dio.fetch(requestOptions);
      handler.resolve(response);
    } on DioException catch (retryError) {
      if (_isUnrecoverableUnauthorized(retryError)) {
        retryError.requestOptions.extra['session_expired'] = true;
        await _expireSession();
      }
      handler.next(retryError);
    } catch (_) {
      handler.next(err);
    }
  }

  bool _shouldTryRefresh(DioException err) {
    final statusCode = err.response?.statusCode;
    if (statusCode != 401) {
      return false;
    }

    final requestOptions = err.requestOptions;
    if (_isAuthExempt(requestOptions.path)) {
      return false;
    }

    final alreadyRetried =
        requestOptions.extra['retried_after_refresh'] == true;
    return !alreadyRetried;
  }

  bool _isAuthExempt(String path) {
    return path.contains('/auth/login') || path.contains('/auth/refresh');
  }

  bool _isUnrecoverableUnauthorized(DioException err) {
    final statusCode = err.response?.statusCode;
    if (statusCode != 401) {
      return false;
    }

    return !_isAuthExempt(err.requestOptions.path);
  }

  Future<void> _expireSession() async {
    await localDataSource.clearAll();
    sessionEvents.notifyExpired();
  }

  Future<_RefreshResult> _refreshAccessToken() {
    final inFlight = _refreshInFlight;
    if (inFlight != null) {
      return inFlight;
    }

    final future = _performRefresh();
    _refreshInFlight = future;

    future.whenComplete(() {
      if (identical(_refreshInFlight, future)) {
        _refreshInFlight = null;
      }
    });

    return future;
  }

  Future<_RefreshResult> _performRefresh() async {
    final refreshToken = await localDataSource.getRefreshToken();
    if (refreshToken == null || refreshToken.trim().isEmpty) {
      await _expireSession();
      return const _RefreshResult.failure(_RefreshFailureReason.invalidSession);
    }

    try {
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: EnvConfig.baseUrl,
          headers: _defaultJsonHeaders,
        ),
      );

      final response = await refreshDio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(
          headers: const {'X-Requested-With': 'XMLHttpRequest'},
        ),
      );

      final raw = response.data;
      if (raw is! Map<String, dynamic>) {
        return const _RefreshResult.failure(_RefreshFailureReason.transient);
      }

      final data = raw['data'];
      final payload = data is Map<String, dynamic> ? data : raw;
      final accessToken = payload['accessToken'] as String?;
      final rotatedRefreshToken =
          payload['refreshToken'] as String? ?? refreshToken;

      if (accessToken == null || accessToken.trim().isEmpty) {
        return const _RefreshResult.failure(_RefreshFailureReason.transient);
      }

      await localDataSource.saveTokens(
        accessToken: accessToken,
        refreshToken: rotatedRefreshToken,
      );

      return _RefreshResult.success(accessToken);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.unknown) {
        return const _RefreshResult.failure(_RefreshFailureReason.transient);
      }

      if (e.response?.statusCode == 401) {
        await _expireSession();
        return const _RefreshResult.failure(
            _RefreshFailureReason.invalidSession);
      }

      return const _RefreshResult.failure(_RefreshFailureReason.transient);
    } catch (_) {
      return const _RefreshResult.failure(_RefreshFailureReason.transient);
    }
  }
}

enum _RefreshFailureReason {
  none,
  transient,
  invalidSession,
}

class _RefreshResult {
  final String? accessToken;
  final _RefreshFailureReason reason;

  const _RefreshResult.success(this.accessToken)
      : reason = _RefreshFailureReason.none;

  const _RefreshResult.failure(this.reason) : accessToken = null;
}

class ApiClient {
  static Dio createDio(
    AuthLocalDataSource localDataSource,
    AuthSessionEvents sessionEvents,
  ) {
    final config = EnvConfig.current;
    final dio = Dio(
      BaseOptions(
        baseUrl: config.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: _defaultJsonHeaders,
      ),
    );

    dio.interceptors.add(AuthInterceptor(dio, localDataSource, sessionEvents));
    dio.interceptors.add(
      GlobalErrorInterceptor(),
    ); // Must be after auth to map any unresolved HTTP errors

    if (config.enableNetworkLogs) {
      dio.interceptors.add(
        LogInterceptor(
          requestBody: _verboseNetworkLogs,
          responseBody: _verboseNetworkLogs,
          requestHeader: false,
          responseHeader: false,
        ),
      );
    }

    return dio;
  }
}
