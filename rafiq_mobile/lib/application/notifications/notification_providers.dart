import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/notification_remote_datasource.dart';
import '../../data/repositories_impl/notification_repository_impl.dart';
import '../../domain/repositories/notification_repository.dart';

final notificationRemoteDataSourceProvider =
    Provider<NotificationRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return NotificationRemoteDataSourceImpl(dio: dio);
});

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final remoteDataSource = ref.watch(notificationRemoteDataSourceProvider);
  return NotificationRepositoryImpl(remoteDataSource: remoteDataSource);
});
