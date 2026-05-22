import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../data/models/dashboard_dtos.dart';
import '../../domain/repositories/dashboard_repository.dart';
import 'dashboard_providers.dart';

part 'dashboard_controller.freezed.dart';

@freezed
class DashboardState with _$DashboardState {
  const factory DashboardState.initial() = _Initial;
  const factory DashboardState.loading() = _Loading;
  const factory DashboardState.loaded(
    DashboardMetricsDto metrics,
    List<ActivityFeedItemDto> feed,
  ) = _Loaded;
  const factory DashboardState.error(String message) = _Error;
}

class DashboardController extends StateNotifier<DashboardState> {
  final DashboardRepository _repository;

  DashboardController(this._repository) : super(const DashboardState.initial());

  Future<void> loadDashboard({
    int? centerId,
    int? circleId,
    int? studentId,
  }) async {
    state = const DashboardState.loading();
    try {
      final metrics = await _repository.getMetrics(
        centerId: centerId,
        circleId: circleId,
        studentId: studentId,
      );

      List<ActivityFeedItemDto> feed = [];
      try {
        feed = await _repository.getActivityFeed(
          centerId: centerId,
          circleId: circleId,
          studentId: studentId,
        );
      } catch (feedError) {
        // Fallback for activity feed, preventing full screen crash
      }

      state = DashboardState.loaded(metrics, feed);
    } catch (e) {
      state = const DashboardState.error(
          'تعذر تحميل بيانات اللوحة الأساسية. حاول لاحقاً.');
    }
  }
}

final dashboardControllerProvider =
    StateNotifierProvider<DashboardController, DashboardState>((ref) {
  final repository = ref.watch(dashboardRepositoryProvider);
  return DashboardController(repository);
});
