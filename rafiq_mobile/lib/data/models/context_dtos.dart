import 'package:freezed_annotation/freezed_annotation.dart';

part 'context_dtos.freezed.dart';
part 'context_dtos.g.dart';

@freezed
class CenterDto with _$CenterDto {
  const factory CenterDto({
    required int id,
    required String name,
    required String code,
    @Default(true) bool isActive,
    @Default('MALE') String gender,
    String? timezone,
    String? mosqueName,
    String? locationText,
    double? latitude,
    double? longitude,
    int? allowedRadiusMeters,
    String? logoUrl,
    @Default(0) int organizationId,
    @Default(0) int centerAdminUserId,
  }) = _CenterDto;

  factory CenterDto.fromJson(Map<String, dynamic> json) =>
      _$CenterDtoFromJson(json);
}

@freezed
class CircleDto with _$CircleDto {
  const factory CircleDto({
    required int id,
    required int centerId,
    required String name,
    @Default(0) int teacherId,
    @Default(true) bool isActive,
    @Default('MALE') String gender,
    @Default('HIFZ') String circleType,
    @Default('APPROVED') String approvalStatus,
    String? mosqueName,
    String? locationText,
    double? latitude,
    double? longitude,
    int? allowedRadiusMeters,
    String? teacherName,
    int? studentsCount,
  }) = _CircleDto;

  factory CircleDto.fromJson(Map<String, dynamic> json) =>
      _$CircleDtoFromJson(json);
}
