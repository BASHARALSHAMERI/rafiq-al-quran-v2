import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/library_remote_datasource.dart';
import '../../data/repositories_impl/library_repository_impl.dart';
import '../../domain/repositories/library_repository.dart';

final libraryRemoteDataSourceProvider =
    Provider<LibraryRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return LibraryRemoteDataSourceImpl(dio: dio);
});

final libraryRepositoryProvider = Provider<LibraryRepository>((ref) {
  final remoteDataSource = ref.watch(libraryRemoteDataSourceProvider);
  return LibraryRepositoryImpl(remoteDataSource: remoteDataSource);
});
