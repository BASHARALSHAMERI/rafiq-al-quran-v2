import 'package:freezed_annotation/freezed_annotation.dart';

part 'follow_up_dtos.freezed.dart';
part 'follow_up_dtos.g.dart';

@freezed
class FollowUpRecordDto with _$FollowUpRecordDto {
  const factory FollowUpRecordDto({
    required int id,
    required int studentId,
    required int circleId,
    required int teacherId,
    required String recordDate, // ISO 8601 YYYY-MM-DD
    required String type, // RECITE, REVIEW, BOTH
    required String status, // DRAFT, FINAL
    String? surah,
    int? fromAyah,
    int? toAyah,
    double? pagesCount,
    int? rating,
    String? matnName,
    String? matnStatus, // PENDING, COMPLETED, FAILED
    String? notes,
    // Joined standard fields might exist but we map what we need
    Map<String, dynamic>? student,
    Map<String, dynamic>? teacher,
  }) = _FollowUpRecordDto;

  factory FollowUpRecordDto.fromJson(Map<String, dynamic> json) =>
      _$FollowUpRecordDtoFromJson(json);
}

@freezed
class CreateFollowUpRequestDto with _$CreateFollowUpRequestDto {
  const factory CreateFollowUpRequestDto({
    required int studentId,
    required int circleId,
    required String recordDate, // YYYY-MM-DD
    required String type, // RECITE, REVIEW, BOTH
    String? status, // DRAFT, FINAL (default FINAL usually if not draft)
    String? surah,
    int? fromAyah,
    int? toAyah,
    double? pagesCount,
    int? rating,
    String? matnName,
    String? matnStatus,
    String? notes,
  }) = _CreateFollowUpRequestDto;

  factory CreateFollowUpRequestDto.fromJson(Map<String, dynamic> json) =>
      _$CreateFollowUpRequestDtoFromJson(json);
}

@freezed
class UpdateFollowUpRequestDto with _$UpdateFollowUpRequestDto {
  const factory UpdateFollowUpRequestDto({
    String? recordDate,
    String? type,
    String? surah,
    int? fromAyah,
    int? toAyah,
    double? pagesCount,
    int? rating,
    String? matnName,
    String? matnStatus,
    String? notes,
  }) = _UpdateFollowUpRequestDto;

  factory UpdateFollowUpRequestDto.fromJson(Map<String, dynamic> json) =>
      _$UpdateFollowUpRequestDtoFromJson(json);
}

@freezed
class ListFollowUpsRequestDto with _$ListFollowUpsRequestDto {
  const factory ListFollowUpsRequestDto({
    int? centerId,
    int? circleId,
    int? studentId,
    String? from,
    String? to,
    String? status,
    int? page,
    int? pageSize,
  }) = _ListFollowUpsRequestDto;

  factory ListFollowUpsRequestDto.fromJson(Map<String, dynamic> json) =>
      _$ListFollowUpsRequestDtoFromJson(json);
}
