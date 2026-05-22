import '../../data/models/dashboard_dtos.dart';

abstract class DashboardRepository {
  Future<DashboardMetricsDto> getMetrics({
    int? centerId,
    int? circleId,
    int? studentId,
  });

  Future<List<ActivityFeedItemDto>> getActivityFeed({
    int? centerId,
    int? circleId,
    int? studentId,
    int limit = 10,
    int offset = 0,
  });
}
