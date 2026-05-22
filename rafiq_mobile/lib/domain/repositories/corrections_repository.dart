import '../../data/models/correction_dtos.dart';

abstract class CorrectionsRepository {
  Future<ListCorrectionsResultDto> list({
    String? status,
    String? targetType,
    int? centerId,
    int? circleId,
    int page = 1,
    int pageSize = 100,
  });

  Future<CorrectionItemDto> approve(
    int correctionId, {
    required bool applyChanges,
    String? reviewNote,
  });

  Future<CorrectionItemDto> reject(
    int correctionId, {
    required String reviewNote,
  });
}
