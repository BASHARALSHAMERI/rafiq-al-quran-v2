import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../data/models/follow_up_dtos.dart';
import '../../domain/repositories/follow_up_repository.dart';
import '../sync/sync_queue_service.dart';
import 'follow_up_providers.dart';

part 'follow_up_controller.freezed.dart';

@freezed
class FollowUpState with _$FollowUpState {
  const factory FollowUpState.initial() = _Initial;
  const factory FollowUpState.loading() = _Loading;
  const factory FollowUpState.loaded(List<FollowUpRecordDto> records) = _Loaded;
  const factory FollowUpState.error(String message) = _Error;
}

class FollowUpController extends StateNotifier<FollowUpState> {
  final Ref _ref;
  final FollowUpRepository _repository;

  FollowUpController(this._ref, this._repository) : super(const FollowUpState.initial());

  Future<void> loadFollowUps(ListFollowUpsRequestDto request) async {
    state = const FollowUpState.loading();
    try {
      final records = await _repository.getFollowUps(request);
      state = FollowUpState.loaded(records);
    } catch (e) {
      state = FollowUpState.error(e.toString());
    }
  }

  Future<FollowUpRecordDto?> createFollowUp(
      CreateFollowUpRequestDto request) async {
    try {
      final newRecord = await _repository.createFollowUp(request);
      // Automatically refresh the list if we were in loaded state
      if (state is _Loaded) {
        final currentRecords = (state as _Loaded).records;
        state = FollowUpState.loaded([newRecord, ...currentRecords]);
      }
      return newRecord;
    } catch (e) {
      // If network error, add to sync queue
      if (e.toString().contains('SocketException') || e.toString().contains('connection')) {
        await _ref.read(syncQueueServiceProvider.notifier).addToQueue(
          path: '/follow-ups',
          method: 'POST',
          data: request.toJson(),
          description: 'تسجيل متابعة: ${request.type}',
        );
        
        // Return a mock success so UI continues
        return null;
      }
      rethrow;
    }
  }

  Future<FollowUpRecordDto?> updateFollowUp(
      int followUpId, UpdateFollowUpRequestDto request) async {
    try {
      final updatedRecord =
          await _repository.updateFollowUp(followUpId, request);
      if (state is _Loaded) {
        final currentRecords = (state as _Loaded).records;
        final updatedList = currentRecords.map((r) {
          return r.id == followUpId ? updatedRecord : r;
        }).toList();
        state = FollowUpState.loaded(updatedList);
      }
      return updatedRecord;
    } catch (e) {
      rethrow;
    }
  }

  Future<FollowUpRecordDto?> finalizeFollowUp(int followUpId) async {
    try {
      final finalizedRecord = await _repository.finalizeFollowUp(followUpId);
      if (state is _Loaded) {
        final currentRecords = (state as _Loaded).records;
        final updatedList = currentRecords.map((r) {
          return r.id == followUpId ? finalizedRecord : r;
        }).toList();
        state = FollowUpState.loaded(updatedList);
      }
      return finalizedRecord;
    } catch (e) {
      rethrow;
    }
  }
}

final followUpControllerProvider =
    StateNotifierProvider<FollowUpController, FollowUpState>((ref) {
  final repository = ref.watch(followUpRepositoryProvider);
  return FollowUpController(ref, repository);
});
