import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/supervisor_visit_dtos.dart';

class ActiveVisitState {
  final SupervisorVisitLogDto? log;
  final List<Map<String, dynamic>> checklist;

  const ActiveVisitState({this.log, this.checklist = const []});

  ActiveVisitState copyWith({
    SupervisorVisitLogDto? log,
    List<Map<String, dynamic>>? checklist,
  }) {
    return ActiveVisitState(
      log: log ?? this.log,
      checklist: checklist ?? this.checklist,
    );
  }
}

class ActiveVisitNotifier extends StateNotifier<ActiveVisitState> {
  ActiveVisitNotifier() : super(const ActiveVisitState());

  void startVisit(SupervisorVisitLogDto log) {
    state = ActiveVisitState(log: log);
  }

  void updateChecklist(List<Map<String, dynamic>> checklist) {
    state = state.copyWith(checklist: List.unmodifiable(checklist));
  }

  void endVisit() {
    state = const ActiveVisitState();
  }
}

final activeVisitProvider =
    StateNotifierProvider<ActiveVisitNotifier, ActiveVisitState>((ref) {
  return ActiveVisitNotifier();
});
