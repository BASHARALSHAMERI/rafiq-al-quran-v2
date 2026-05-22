import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/context_local_datasource.dart';
import '../../data/datasources/context_remote_datasource.dart';
import '../../data/repositories_impl/context_repository_impl.dart';
import '../../domain/repositories/context_repository.dart';
import '../auth/auth_providers.dart';

final contextLocalDataSourceProvider = Provider((ref) {
  return ContextLocalDataSource(ref.watch(authLocalDataSourceProvider));
});

final contextRemoteDataSourceProvider = Provider((ref) {
  return ContextRemoteDataSource(ref.watch(dioProvider));
});

final contextRepositoryProvider = Provider<ContextRepository>((ref) {
  return ContextRepositoryImpl(
    ref.watch(contextRemoteDataSourceProvider),
    ref.watch(contextLocalDataSourceProvider),
  );
});
