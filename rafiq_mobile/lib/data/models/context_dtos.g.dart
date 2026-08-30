// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'context_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CenterDtoImpl _$$CenterDtoImplFromJson(Map<String, dynamic> json) =>
    _$CenterDtoImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      code: json['code'] as String,
      isActive: json['isActive'] as bool? ?? true,
      gender: json['gender'] as String? ?? 'MALE',
      timezone: json['timezone'] as String?,
      mosqueName: json['mosqueName'] as String?,
      locationText: json['locationText'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      allowedRadiusMeters: (json['allowedRadiusMeters'] as num?)?.toInt(),
      logoUrl: json['logoUrl'] as String?,
      organizationId: (json['organizationId'] as num?)?.toInt() ?? 0,
      centerAdminUserId: (json['centerAdminUserId'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$CenterDtoImplToJson(_$CenterDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'code': instance.code,
      'isActive': instance.isActive,
      'gender': instance.gender,
      'timezone': instance.timezone,
      'mosqueName': instance.mosqueName,
      'locationText': instance.locationText,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'allowedRadiusMeters': instance.allowedRadiusMeters,
      'logoUrl': instance.logoUrl,
      'organizationId': instance.organizationId,
      'centerAdminUserId': instance.centerAdminUserId,
    };

_$CircleDtoImpl _$$CircleDtoImplFromJson(Map<String, dynamic> json) =>
    _$CircleDtoImpl(
      id: (json['id'] as num).toInt(),
      centerId: (json['centerId'] as num).toInt(),
      name: json['name'] as String,
      teacherId: (json['teacherId'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      gender: json['gender'] as String? ?? 'MALE',
      circleType: json['circleType'] as String? ?? 'HIFZ',
      approvalStatus: json['approvalStatus'] as String? ?? 'APPROVED',
      mosqueName: json['mosqueName'] as String?,
      locationText: json['locationText'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      allowedRadiusMeters: (json['allowedRadiusMeters'] as num?)?.toInt(),
      teacherName: json['teacherName'] as String?,
      studentsCount: (json['studentsCount'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$CircleDtoImplToJson(_$CircleDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'centerId': instance.centerId,
      'name': instance.name,
      'teacherId': instance.teacherId,
      'isActive': instance.isActive,
      'gender': instance.gender,
      'circleType': instance.circleType,
      'approvalStatus': instance.approvalStatus,
      'mosqueName': instance.mosqueName,
      'locationText': instance.locationText,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'allowedRadiusMeters': instance.allowedRadiusMeters,
      'teacherName': instance.teacherName,
      'studentsCount': instance.studentsCount,
    };
