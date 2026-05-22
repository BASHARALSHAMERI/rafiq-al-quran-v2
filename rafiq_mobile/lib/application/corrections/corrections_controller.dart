import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/correction_dtos.dart';
import '../../domain/repositories/corrections_repository.dart';
import '../sync/sync_queue_service.dart';
import 'corrections_providers.dart';

class CorrectionsState {
  final bool isLoading;
  final bool isActing;
  final String? error;
  final String? actionError;
  final List<CorrectionItemDto> items;

  const CorrectionsState({
    this.isLoading = false,
    this.isActing = false,
    this.error,
    this.actionError,
    this.items = const [],
  });

  CorrectionsState copyWith({
    bool? isLoading,
    bool? isActing,
    Object? error = _sentinel,
    Object? actionError = _sentinel,
    List<CorrectionItemDto>? items,
  }) {
    return CorrectionsState(
      isLoading: isLoading ?? this.isLoading,
      isActing: isActing ?? this.isActing,
      error: identical(error, _sentinel) ? this.error : error as String?,
      actionError: identical(actionError, _sentinel)
          ? this.actionError
          : actionError as String?,
      items: items ?? this.items,
    );
  }
}

const _sentinel = Object();

class CorrectionsController extends StateNotifier<CorrectionsState> {
  final Ref _ref;
  final CorrectionsRepository _repository;

  CorrectionsController(this._ref, this._repository) : super(const CorrectionsState());

  Future<void> load({
    int? centerId,
    int? circleId,
  }) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      actionError: null,
    );
    try {
      final response = await _repository.list(
        centerId: centerId,
        circleId: circleId,
        pageSize: 100,
      );
      state = state.copyWith(
        isLoading: false,
        items: response.data,
        error: null,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _readError(error),
      );
    }
  }

  Future<void> approve(
    int correctionId, {
    bool applyChanges = true,
    String? reviewNote,
  }) async {
    state = state.copyWith(isActing: true, actionError: null);
    try {
      final updated = await _repository.approve(
        correctionId,
        applyChanges: applyChanges,
        reviewNote: reviewNote,
      );
      state = state.copyWith(
        isActing: false,
        items: _replaceItem(updated),
      );
    } catch (error) {
      if (error.toString().contains('SocketException') || error.toString().contains('connection')) {
        await _ref.read(syncQueueServiceProvider.notifier).addToQueue(
          path: '/corrections/$correctionId/approve',
          method: 'POST',
          data: {'applyChanges': applyChanges, 'reviewNote': reviewNote},
          description: 'اعتماد طلب تصحيح #$correctionId',
        );
        state = state.copyWith(isActing: false);
        return;
      }
      state = state.copyWith(
        isActing: false,
        actionError: _readError(error),
      );
      rethrow;
    }
  }

  Future<void> reject(
    int correctionId, {
    required String reviewNote,
  }) async {
    state = state.copyWith(isActing: true, actionError: null);
    try {
      final updated = await _repository.reject(
        correctionId,
        reviewNote: reviewNote,
      );
      state = state.copyWith(
        isActing: false,
        items: _replaceItem(updated),
      );
    } catch (error) {
      if (error.toString().contains('SocketException') || error.toString().contains('connection')) {
        await _ref.read(syncQueueServiceProvider.notifier).addToQueue(
          path: '/corrections/$correctionId/reject',
          method: 'POST',
          data: {'reviewNote': reviewNote},
          description: 'رفض طلب تصحيح #$correctionId',
        );
        state = state.copyWith(isActing: false);
        return;
      }
      state = state.copyWith(
        isActing: false,
        actionError: _readError(error),
      );
      rethrow;
    }
  }

  void clearActionError() {
    state = state.copyWith(actionError: null);
  }

  List<CorrectionItemDto> _replaceItem(CorrectionItemDto updated) {
    return state.items
        .map((item) => item.id == updated.id ? updated : item)
        .toList(growable: false);
  }

  String _readError(Object error) {
    if (error is DioException) {
      final payload = error.response?.data;
      if (payload is Map<String, dynamic>) {
        final message = payload['message'] ?? payload['error'];
        if (message is String && message.trim().isNotEmpty) {
          return message.trim();
        }
      }
    }
    final fallback = error.toString().trim();
    return fallback.isEmpty ? 'تعذر تنفيذ الطلب.' : fallback;
  }
}

final correctionsControllerProvider =
    StateNotifierProvider<CorrectionsController, CorrectionsState>((ref) {
  final repository = ref.watch(correctionsRepositoryProvider);
  return CorrectionsController(ref, repository);
});
