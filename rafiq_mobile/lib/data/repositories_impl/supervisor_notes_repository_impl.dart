import '../../data/datasources/supervisor_notes_remote_datasource.dart';
import '../../data/models/supervisor_note_dtos.dart';
import '../../domain/repositories/supervisor_notes_repository.dart';

class SupervisorNotesRepositoryImpl implements SupervisorNotesRepository {
  final SupervisorNotesRemoteDataSource _dataSource;

  SupervisorNotesRepositoryImpl(
      {required SupervisorNotesRemoteDataSource dataSource})
      : _dataSource = dataSource;

  @override
  Future<SupervisorNotesListDto> list({
    int? centerId,
    int? circleId,
    String? category,
    String? status,
    int page = 1,
    int pageSize = 50,
  }) =>
      _dataSource.list(
        centerId: centerId,
        circleId: circleId,
        category: category,
        status: status,
        page: page,
        pageSize: pageSize,
      );

  @override
  Future<SupervisorNoteDto> create({
    int? centerId,
    int? circleId,
    required String category,
    String? targetLabel,
    required String content,
    Map<String, dynamic>? scores,
    List<Map<String, dynamic>>? visitChecklist,
    int? rating,
  }) =>
      _dataSource.create(
        centerId: centerId,
        circleId: circleId,
        category: category,
        targetLabel: targetLabel,
        content: content,
        scores: scores,
        visitChecklist: visitChecklist,
        rating: rating,
      );

  @override
  Future<SupervisorNoteDto> updateStatus(int id, String status) =>
      _dataSource.updateStatus(id, status);
}
