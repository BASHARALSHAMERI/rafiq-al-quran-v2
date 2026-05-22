import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/corrections_remote_datasource.dart';
import '../../data/repositories_impl/corrections_repository_impl.dart';
import '../../domain/repositories/corrections_repository.dart';

final correctionsRemoteDataSourceProvider =
    Provider<CorrectionsRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return CorrectionsRemoteDataSourceImpl(dio: dio);
});

final correctionsRepositoryProvider = Provider<CorrectionsRepository>((ref) {
  final remoteDataSource = ref.watch(correctionsRemoteDataSourceProvider);
  return CorrectionsRepositoryImpl(remoteDataSource: remoteDataSource);
});
