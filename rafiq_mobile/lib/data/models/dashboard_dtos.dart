import 'package:freezed_annotation/freezed_annotation.dart';

part 'dashboard_dtos.freezed.dart';
part 'dashboard_dtos.g.dart';

@freezed
class DashboardMetricsDto with _$DashboardMetricsDto {
  const factory DashboardMetricsDto({
    required int totalStudents,
    required int activeCircles,
    required double attendanceRate,
    int? pendingTasks,
    Map<String, dynamic>?
        extraMetrics, // For role-specific metrics like memorization stats
  }) = _DashboardMetricsDto;

  factory DashboardMetricsDto.fromJson(Map<String, dynamic> json) =>
      _$DashboardMetricsDtoFromJson(json);
}

@freezed
class ActivityFeedItemDto with _$ActivityFeedItemDto {
  const factory ActivityFeedItemDto({
    required String id,
    required String type, // FOLLOW_UP, EXAM, ATTENDANCE, ACHIEVEMENT
    required String title,
    required String description,
    required String timestamp,
    Map<String, dynamic>? metadata,
  }) = _ActivityFeedItemDto;

  factory ActivityFeedItemDto.fromJson(Map<String, dynamic> json) =>
      _$ActivityFeedItemDtoFromJson(json);
}
