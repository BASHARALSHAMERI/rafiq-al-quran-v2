import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

import '../../core/network/api_client.dart';
import '../../data/datasources/auth_local_datasource.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories_impl/auth_repository_impl.dart';
import '../../domain/repositories/auth_repository.dart';
import 'auth_session_events.dart';

final secureStorageProvider = Provider((ref) => const FlutterSecureStorage());

final authLocalDataSourceProvider = Provider((ref) {
  return AuthLocalDataSource(ref.watch(secureStorageProvider));
});

final authSessionEventsProvider = Provider<AuthSessionEvents>((ref) {
  final events = AuthSessionEvents();
  ref.onDispose(events.dispose);
  return events;
});

final dioProvider = Provider((ref) {
  return ApiClient.createDio(
    ref.watch(authLocalDataSourceProvider),
    ref.watch(authSessionEventsProvider),
  );
});

final authRemoteDataSourceProvider = Provider((ref) {
  return AuthRemoteDataSource(ref.watch(dioProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    ref.watch(authRemoteDataSourceProvider),
    ref.watch(authLocalDataSourceProvider),
  );
});

// Alias for generic API Client usage across data layers
final apiClientProvider = Provider<Dio>((ref) => ref.watch(dioProvider));
