import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'context_providers.dart';
import 'context_state.dart';

class ContextController extends StateNotifier<ContextState> {
  final Ref _ref;

  ContextController(this._ref) : super(const ContextState()) {
    init();
  }

  Future<void> init() async {
    final repo = _ref.read(contextRepositoryProvider);
    try {
      final savedCenterId = await repo.getCurrentCenterId();
      final savedCircleId = await repo.getCurrentCircleId();

      state = state.copyWith(
        isInitialized: true,
        selectedCenterId: savedCenterId,
        selectedCircleId: savedCircleId,
        clearError: true,
      );

      if (savedCenterId != null) {
        try {
          final centers = await repo.getMyCenters();
          final circles = await repo.getMyCircles(centerId: savedCenterId);
          state = state.copyWith(
            centers: centers,
            circles: circles,
          );
        } catch (_) {
          // Ignore network errors during app startup initialization
        }
      }
    } catch (_) {
      state = state.copyWith(
        isInitialized: true,
        clearCenter: true,
        clearCircle: true,
      );
    }
  }


  Future<void> loadCenters() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(contextRepositoryProvider);
      final centers = await repo.getMyCenters();

      if (centers.length == 1) {
        await selectCenter(centers.first.id);
        state = state.copyWith(centers: centers);
        return;
      }

      state = state.copyWith(
        isLoading: false,
        centers: centers,
        circles: const [],
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'تعذر جلب المراكز المتاحة.',
      );
    }
  }

  Future<void> loadCirclesForSelectedCenter() async {
    final centerId = state.selectedCenterId;
    if (centerId == null) {
      state = state.copyWith(error: 'الرجاء اختيار المركز أولًا.');
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(contextRepositoryProvider);
      final circles = await repo.getMyCircles(centerId: centerId);

      if (circles.length == 1) {
        await selectCircle(circles.first.id);
        state = state.copyWith(circles: circles);
        return;
      }

      state = state.copyWith(
        isLoading: false,
        circles: circles,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'تعذر جلب الحلقات المتاحة.',
      );
    }
  }

  Future<void> selectCenter(int centerId) async {
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      selectedCenterId: centerId,
      clearCircle: true,
      circles: const [],
    );

    try {
      final repo = _ref.read(contextRepositoryProvider);
      await repo.clearContext();
      await repo.saveCurrentCenter(centerId);

      final circles = await repo.getMyCircles(centerId: centerId);

      if (circles.length == 1) {
        await selectCircle(circles.first.id);
      } else {
        state = state.copyWith(isLoading: false, circles: circles);
      }
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'تعذر تحميل حلقات المركز المحدد.',
      );
    }
  }

  Future<void> selectCircle(int circleId) async {
    try {
      final repo = _ref.read(contextRepositoryProvider);
      await repo.saveCurrentCircle(circleId);
      state = state.copyWith(
        selectedCircleId: circleId,
        isLoading: false,
        clearError: true,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'حدث خطأ أثناء حفظ الحلقة.',
      );
    }
  }

  Future<void> clearContext() async {
    final repo = _ref.read(contextRepositoryProvider);
    await repo.clearContext();
    state = state.copyWith(
      clearCenter: true,
      clearCircle: true,
      centers: const [],
      circles: const [],
      clearError: true,
      isLoading: false,
      isInitialized: true,
    );
  }

  Future<void> clearSelection() => clearContext();
}

final contextControllerProvider =
    StateNotifierProvider<ContextController, ContextState>((ref) {
  return ContextController(ref);
});
