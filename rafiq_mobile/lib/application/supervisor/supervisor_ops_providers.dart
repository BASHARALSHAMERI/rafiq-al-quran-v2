import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/supervisor_visit_remote_datasource.dart';
import '../../data/models/supervisor_ops_dtos.dart';

final supervisorOpsDashboardProvider = FutureProvider.autoDispose.family<
    SupervisorOpsDashboardDto,
    ({int month, int year})>((ref, params) {
  final remote = ref.watch(supervisorVisitRemoteDataSourceProvider);
  return remote.getDashboard(month: params.month, year: params.year);
});
