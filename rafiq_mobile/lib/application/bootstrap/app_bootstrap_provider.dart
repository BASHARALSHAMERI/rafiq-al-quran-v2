import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'app_bootstrap_service.dart';

final appBootstrapServiceProvider = Provider<AppBootstrapService>((ref) {
  return AppBootstrapService(ref.watch(authLocalDataSourceProvider));
});

final appBootstrapProvider = FutureProvider<AppBootstrapResult>((ref) async {
  final service = ref.watch(appBootstrapServiceProvider);
  return service.bootstrap();
});
