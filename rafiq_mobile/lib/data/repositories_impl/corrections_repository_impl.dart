import '../../domain/repositories/corrections_repository.dart';
import '../datasources/corrections_remote_datasource.dart';
import '../models/correction_dtos.dart';

class CorrectionsRepositoryImpl implements CorrectionsRepository {
  final CorrectionsRemoteDataSource remoteDataSource;

  CorrectionsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ListCorrectionsResultDto> list({
    String? status,
    String? targetType,
    int? centerId,
    int? circleId,
    int page = 1,
    int pageSize = 100,
  }) {
    return remoteDataSource.list(
      status: status,
      targetType: targetType,
      centerId: centerId,
      circleId: circleId,
      page: page,
      pageSize: pageSize,
    );
  }

  @override
  Future<CorrectionItemDto> approve(
    int correctionId, {
    required bool applyChanges,
    String? reviewNote,
  }) {
    return remoteDataSource.approve(
      correctionId,
      applyChanges: applyChanges,
      reviewNote: reviewNote,
    );
  }

  @override
  Future<CorrectionItemDto> reject(
    int correctionId, {
    required String reviewNote,
  }) {
    return remoteDataSource.reject(
      correctionId,
      reviewNote: reviewNote,
    );
  }
}
