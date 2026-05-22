import '../../domain/repositories/reports_repository.dart';
import '../datasources/reports_remote_datasource.dart';
import '../models/report_dtos.dart';
import '../models/supervisor_dtos.dart';

class ReportsRepositoryImpl implements ReportsRepository {
  final ReportsRemoteDataSource remoteDataSource;

  ReportsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<StudentReportDto> getStudentReport(int studentId) {
    return remoteDataSource.getStudentReport(studentId);
  }

  @override
  Future<SupervisorDashboardDto> getSupervisorDashboard({
    int? year,
    int? month,
    int? centerId,
    int? circleId,
  }) {
    return remoteDataSource.getSupervisorDashboard(
      year: year,
      month: month,
      centerId: centerId,
      circleId: circleId,
    );
  }
}
