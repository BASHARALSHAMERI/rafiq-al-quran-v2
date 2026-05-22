import '../../domain/repositories/dashboard_repository.dart';
import '../datasources/dashboard_remote_datasource.dart';
import '../models/dashboard_dtos.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final DashboardRemoteDataSource remoteDataSource;

  DashboardRepositoryImpl({required this.remoteDataSource});

  @override
  Future<DashboardMetricsDto> getMetrics({
    int? centerId,
    int? circleId,
    int? studentId,
  }) async {
    return await remoteDataSource.getMetrics(
      centerId: centerId,
      circleId: circleId,
      studentId: studentId,
    );
  }

  @override
  Future<List<ActivityFeedItemDto>> getActivityFeed({
    int? centerId,
    int? circleId,
    int? studentId,
    int limit = 10,
    int offset = 0,
  }) async {
    return await remoteDataSource.getActivityFeed(
      centerId: centerId,
      circleId: circleId,
      studentId: studentId,
      limit: limit,
      offset: offset,
    );
  }
}
