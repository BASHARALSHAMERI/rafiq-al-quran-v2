// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$NotificationDtoImpl _$$NotificationDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$NotificationDtoImpl(
      id: (json['id'] as num).toInt(),
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      isRead: json['isRead'] as bool,
      userId: (json['userId'] as num).toInt(),
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$$NotificationDtoImplToJson(
        _$NotificationDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'title': instance.title,
      'message': instance.message,
      'isRead': instance.isRead,
      'userId': instance.userId,
      'metadata': instance.metadata,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

_$UnreadCountDtoImpl _$$UnreadCountDtoImplFromJson(Map<String, dynamic> json) =>
    _$UnreadCountDtoImpl(
      count: (json['count'] as num).toInt(),
    );

Map<String, dynamic> _$$UnreadCountDtoImplToJson(
        _$UnreadCountDtoImpl instance) =>
    <String, dynamic>{
      'count': instance.count,
    };
