import 'package:hive_flutter/hive_flutter.dart';

import '../../core/router/route_names.dart';
import '../../data/datasources/auth_local_datasource.dart';

class AppBootstrapResult {
  final bool hasToken;
  final String nextRoute;

  const AppBootstrapResult({
    required this.hasToken,
    required this.nextRoute,
  });
}

class AppBootstrapService {
  static bool _hiveInitialized = false;
  static const _appCacheBox = 'app_cache';

  final AuthLocalDataSource _authLocalDataSource;

  AppBootstrapService(this._authLocalDataSource);

  Future<AppBootstrapResult> bootstrap() async {
    final startedAt = DateTime.now();

    await _ensureHiveReady();

    final accessToken = await _authLocalDataSource.getAccessToken();
    final refreshToken = await _authLocalDataSource.getRefreshToken();
    final hasToken = accessToken != null &&
        accessToken.trim().isNotEmpty &&
        refreshToken != null &&
        refreshToken.trim().isNotEmpty;
    final nextRoute = hasToken ? RouteNames.root : RouteNames.login;

    const minDuration = Duration(milliseconds: 900);
    final elapsed = DateTime.now().difference(startedAt);
    if (elapsed < minDuration) {
      await Future.delayed(minDuration - elapsed);
    }

    return AppBootstrapResult(
      hasToken: hasToken,
      nextRoute: nextRoute,
    );
  }

  Future<void> _ensureHiveReady() async {
    if (_hiveInitialized) {
      return;
    }

    if (!Hive.isBoxOpen(_appCacheBox)) {
      await Hive.openBox<dynamic>(_appCacheBox);
    }
    _hiveInitialized = true;
  }
}
