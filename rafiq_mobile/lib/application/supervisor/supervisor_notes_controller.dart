import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/supervisor_notes_remote_datasource.dart';
import '../../data/models/supervisor_note_dtos.dart';
import '../../data/repositories_impl/supervisor_notes_repository_impl.dart';
import '../../domain/repositories/supervisor_notes_repository.dart';

// --- Providers ---

final supervisorNotesDataSourceProvider =
    Provider<SupervisorNotesRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return SupervisorNotesRemoteDataSourceImpl(dio: dio);
});

final supervisorNotesRepositoryProvider =
    Provider<SupervisorNotesRepository>((ref) {
  final dataSource = ref.watch(supervisorNotesDataSourceProvider);
  return SupervisorNotesRepositoryImpl(dataSource: dataSource);
});

final supervisorNotesControllerProvider = StateNotifierProvider.autoDispose<
    SupervisorNotesController, SupervisorNotesState>((ref) {
  final repository = ref.watch(supervisorNotesRepositoryProvider);
  return SupervisorNotesController(repository);
});

// --- State ---

class SupervisorNotesState {
  final bool isLoading;
  final bool isActing;
  final String? error;
  final String? actionError;
  final List<SupervisorNoteDto> items;

  const SupervisorNotesState({
    this.isLoading = false,
    this.isActing = false,
    this.error,
    this.actionError,
    this.items = const [],
  });

  SupervisorNotesState copyWith({
    bool? isLoading,
    bool? isActing,
    Object? error = _sentinel,
    Object? actionError = _sentinel,
    List<SupervisorNoteDto>? items,
  }) {
    return SupervisorNotesState(
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

// --- Controller ---

class SupervisorNotesController extends StateNotifier<SupervisorNotesState> {
  final SupervisorNotesRepository _repository;

  SupervisorNotesController(this._repository)
      : super(const SupervisorNotesState());

  Future<void> load({int? centerId, int? circleId}) async {
    state = state.copyWith(isLoading: true, error: null, actionError: null);
    try {
      final result = await _repository.list(
        centerId: centerId,
        circleId: circleId,
        pageSize: 100,
      );
      state = state.copyWith(isLoading: false, items: result.data, error: null);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _readError(e));
    }
  }

  Future<void> create({
    int? centerId,
    int? circleId,
    required String category,
    String? targetLabel,
    required String content,
    Map<String, dynamic>? scores,
    List<Map<String, dynamic>>? visitChecklist,
    int? rating,
  }) async {
    state = state.copyWith(isActing: true, actionError: null);
    try {
      final created = await _repository.create(
        centerId: centerId,
        circleId: circleId,
        category: category,
        targetLabel: targetLabel,
        content: content,
        scores: scores,
        visitChecklist: visitChecklist,
        rating: rating,
      );
      state = state.copyWith(
        isActing: false,
        items: [created, ...state.items],
      );
    } catch (e) {
      state = state.copyWith(isActing: false, actionError: _readError(e));
      rethrow;
    }
  }

  Future<void> markResolved(int id) async {
    state = state.copyWith(isActing: true, actionError: null);
    try {
      final updated = await _repository.updateStatus(id, 'RESOLVED');
      state = state.copyWith(
        isActing: false,
        items: state.items
            .map((n) => n.id == id ? updated : n)
            .toList(growable: false),
      );
    } catch (e) {
      state = state.copyWith(isActing: false, actionError: _readError(e));
    }
  }

  String _readError(Object error) {
    if (error is DioException) {
      final payload = error.response?.data;
      if (payload is Map<String, dynamic>) {
        final msg = payload['message'] ?? payload['error'];
        if (msg is String && msg.trim().isNotEmpty) return msg.trim();
      }
    }
    final fallback = error.toString().trim();
    return fallback.isEmpty ? 'تعذر تنفيذ الطلب.' : fallback;
  }
}
