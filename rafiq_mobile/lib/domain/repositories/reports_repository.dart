import '../../data/models/report_dtos.dart';
import '../../data/models/supervisor_dtos.dart';

abstract class ReportsRepository {
  Future<StudentReportDto> getStudentReport(int studentId);
  Future<SupervisorDashboardDto> getSupervisorDashboard({
    int? year,
    int? month,
    int? centerId,
    int? circleId,
  });
}
