import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/dashboard_remote_datasource.dart';
import '../../data/repositories_impl/dashboard_repository_impl.dart';
import '../../domain/repositories/dashboard_repository.dart';

final dashboardRemoteDataSourceProvider =
    Provider<DashboardRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return DashboardRemoteDataSourceImpl(dio: dio);
});

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  final remoteDataSource = ref.watch(dashboardRemoteDataSourceProvider);
  return DashboardRepositoryImpl(remoteDataSource: remoteDataSource);
});
