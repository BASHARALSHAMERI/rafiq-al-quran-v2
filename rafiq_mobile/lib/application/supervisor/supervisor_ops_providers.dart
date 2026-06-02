import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/supervisor_ops_dtos.dart';
import 'supervisor_visit_providers.dart';

final supervisorOpsDashboardProvider = FutureProvider.autoDispose.family<
    SupervisorOpsDashboardDto,
    ({int month, int year})>((ref, params) {
  final remote = ref.watch(supervisorVisitRemoteDataSourceProvider);
  return remote.getDashboard(month: params.month, year: params.year);
});
