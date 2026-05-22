import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/reports_remote_datasource.dart';
import '../../data/models/report_dtos.dart';
import '../../data/models/supervisor_dtos.dart';
import '../../data/repositories_impl/reports_repository_impl.dart';
import '../../domain/repositories/reports_repository.dart';

final reportsRemoteDataSourceProvider = Provider<ReportsRemoteDataSource>((
  ref,
) {
  final dio = ref.watch(apiClientProvider);
  return ReportsRemoteDataSourceImpl(dio: dio);
});

final reportsRepositoryProvider = Provider<ReportsRepository>((ref) {
  final remoteDataSource = ref.watch(reportsRemoteDataSourceProvider);
  return ReportsRepositoryImpl(remoteDataSource: remoteDataSource);
});

final studentReportProvider =
    FutureProvider.autoDispose.family<StudentReportDto, int>((ref, studentId) {
  final repository = ref.watch(reportsRepositoryProvider);
  return repository.getStudentReport(studentId);
});

final supervisorDashboardProvider = FutureProvider.autoDispose.family<
    SupervisorDashboardDto,
    ({int year, int month, int? centerId, int? circleId})?>((ref, params) {
  final repository = ref.watch(reportsRepositoryProvider);
  return repository.getSupervisorDashboard(
    year: params?.year,
    month: params?.month,
    centerId: params?.centerId,
    circleId: params?.circleId,
  );
});
