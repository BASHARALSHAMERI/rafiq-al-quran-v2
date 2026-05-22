import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/supervisor_visit_remote_datasource.dart';
import '../../data/models/supervisor_visit_dtos.dart';

final supervisorVisitRemoteDataSourceProvider =
    Provider<SupervisorVisitRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return SupervisorVisitRemoteDataSourceImpl(dio: dio);
});

final supervisorTodayVisitsProvider =
    FutureProvider.autoDispose<SupervisorTodayVisitsDto>((ref) {
  return ref.read(supervisorVisitRemoteDataSourceProvider).getTodayVisits();
});
