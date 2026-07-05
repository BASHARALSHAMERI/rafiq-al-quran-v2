import 'package:freezed_annotation/freezed_annotation.dart';

part 'group_activity_dtos.freezed.dart';
part 'group_activity_dtos.g.dart';

@freezed
class CreateGroupActivityRequestDto with _$CreateGroupActivityRequestDto {
  const factory CreateGroupActivityRequestDto({
    required int circleId,
    required String activityDate, // YYYY-MM-DD
    required String activityType, // LECTURE|TAFSEER|SEERAH|FIQH|TAJWEED|HADITH|EDUCATIONAL
    required String title,
    String? description,
  }) = _CreateGroupActivityRequestDto;

  factory CreateGroupActivityRequestDto.fromJson(Map<String, dynamic> json) =>
      _$CreateGroupActivityRequestDtoFromJson(json);
}

@freezed
class GroupActivityDto with _$GroupActivityDto {
  const factory GroupActivityDto({
    required int id,
    required int circleId,
    required int teacherId,
    required String activityDate,
    required String activityType,
    required String title,
    String? description,
    required int participantsCount,
    required List<GroupActivityParticipantDto> participants,
    required String createdAt,
    required String updatedAt,
  }) = _GroupActivityDto;

  factory GroupActivityDto.fromJson(Map<String, dynamic> json) =>
      _$GroupActivityDtoFromJson(json);
}

@freezed
class GroupActivityParticipantDto with _$GroupActivityParticipantDto {
  const factory GroupActivityParticipantDto({
    required int studentId,
    required String fullName,
  }) = _GroupActivityParticipantDto;

  factory GroupActivityParticipantDto.fromJson(Map<String, dynamic> json) =>
      _$GroupActivityParticipantDtoFromJson(json);
}
