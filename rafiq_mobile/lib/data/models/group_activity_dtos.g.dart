// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'group_activity_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CreateGroupActivityRequestDtoImpl
    _$$CreateGroupActivityRequestDtoImplFromJson(Map<String, dynamic> json) =>
        _$CreateGroupActivityRequestDtoImpl(
          circleId: (json['circleId'] as num).toInt(),
          activityDate: json['activityDate'] as String,
          activityType: json['activityType'] as String,
          title: json['title'] as String,
          description: json['description'] as String?,
        );

Map<String, dynamic> _$$CreateGroupActivityRequestDtoImplToJson(
        _$CreateGroupActivityRequestDtoImpl instance) =>
    <String, dynamic>{
      'circleId': instance.circleId,
      'activityDate': instance.activityDate,
      'activityType': instance.activityType,
      'title': instance.title,
      'description': instance.description,
    };

_$GroupActivityDtoImpl _$$GroupActivityDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$GroupActivityDtoImpl(
      id: (json['id'] as num).toInt(),
      circleId: (json['circleId'] as num).toInt(),
      teacherId: (json['teacherId'] as num).toInt(),
      activityDate: json['activityDate'] as String,
      activityType: json['activityType'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      participantsCount: (json['participantsCount'] as num).toInt(),
      participants: (json['participants'] as List<dynamic>)
          .map((e) =>
              GroupActivityParticipantDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );

Map<String, dynamic> _$$GroupActivityDtoImplToJson(
        _$GroupActivityDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'circleId': instance.circleId,
      'teacherId': instance.teacherId,
      'activityDate': instance.activityDate,
      'activityType': instance.activityType,
      'title': instance.title,
      'description': instance.description,
      'participantsCount': instance.participantsCount,
      'participants': instance.participants,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
    };

_$GroupActivityParticipantDtoImpl _$$GroupActivityParticipantDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$GroupActivityParticipantDtoImpl(
      studentId: (json['studentId'] as num).toInt(),
      fullName: json['fullName'] as String,
    );

Map<String, dynamic> _$$GroupActivityParticipantDtoImplToJson(
        _$GroupActivityParticipantDtoImpl instance) =>
    <String, dynamic>{
      'studentId': instance.studentId,
      'fullName': instance.fullName,
    };
