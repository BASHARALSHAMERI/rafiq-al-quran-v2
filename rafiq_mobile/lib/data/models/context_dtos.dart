import 'package:freezed_annotation/freezed_annotation.dart';

part 'context_dtos.freezed.dart';
part 'context_dtos.g.dart';

@freezed
class CenterDto with _$CenterDto {
  const factory CenterDto({
    required String id,
    required String name,
    required String domain,
  }) = _CenterDto;

  factory CenterDto.fromJson(Map<String, dynamic> json) =>
      _$CenterDtoFromJson(json);
}

@freezed
class CircleDto with _$CircleDto {
  const factory CircleDto({
    required String id,
    required String name,
    required String centerId,
  }) = _CircleDto;

  factory CircleDto.fromJson(Map<String, dynamic> json) =>
      _$CircleDtoFromJson(json);
}
