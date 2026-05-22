import '../../data/models/supervisor_note_dtos.dart';

abstract class SupervisorNotesRepository {
  Future<SupervisorNotesListDto> list({
    int? centerId,
    int? circleId,
    String? category,
    String? status,
    int page = 1,
    int pageSize = 50,
  });

  Future<SupervisorNoteDto> create({
    int? centerId,
    int? circleId,
    required String category,
    String? targetLabel,
    required String content,
    Map<String, dynamic>? scores,
    List<Map<String, dynamic>>? visitChecklist,
    int? rating,
  });

  Future<SupervisorNoteDto> updateStatus(int id, String status);
}
