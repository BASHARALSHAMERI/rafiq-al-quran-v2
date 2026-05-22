import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/org_remote_datasource.dart';
import '../../data/models/org_dtos.dart';
import '../../data/repositories_impl/org_repository_impl.dart';
import '../../domain/repositories/org_repository.dart';

final orgRemoteDataSourceProvider = Provider<OrgRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return OrgRemoteDataSourceImpl(dio: dio);
});

final orgRepositoryProvider = Provider<OrgRepository>((ref) {
  final remoteDataSource = ref.watch(orgRemoteDataSourceProvider);
  return OrgRepositoryImpl(remoteDataSource: remoteDataSource);
});

final orgCirclesProvider = FutureProvider.autoDispose
    .family<List<OrgCircleDto>, int?>((ref, centerId) {
  final repository = ref.watch(orgRepositoryProvider);
  return repository.listCircles(centerId: centerId);
});
