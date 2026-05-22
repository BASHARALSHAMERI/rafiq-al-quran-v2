import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification_dtos.freezed.dart';
part 'notification_dtos.g.dart';

@freezed
class NotificationDto with _$NotificationDto {
  const factory NotificationDto({
    required int id,
    required String
        type, // SYSTEM, EXAM_RESULT, FOLLOW_UP, ASSIGNMENT, REMINDER
    required String title,
    required String message,
    required bool isRead,
    required int userId,
    Map<String, dynamic>? metadata,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _NotificationDto;

  factory NotificationDto.fromJson(Map<String, dynamic> json) =>
      _$NotificationDtoFromJson(json);
}

@freezed
class UnreadCountDto with _$UnreadCountDto {
  const factory UnreadCountDto({
    required int count,
  }) = _UnreadCountDto;

  factory UnreadCountDto.fromJson(Map<String, dynamic> json) =>
      _$UnreadCountDtoFromJson(json);
}
