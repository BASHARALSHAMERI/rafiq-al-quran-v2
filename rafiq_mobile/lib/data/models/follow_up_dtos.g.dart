// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'follow_up_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$FollowUpRecordDtoImpl _$$FollowUpRecordDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$FollowUpRecordDtoImpl(
      id: (json['id'] as num).toInt(),
      studentId: (json['studentId'] as num).toInt(),
      circleId: (json['circleId'] as num).toInt(),
      teacherId: (json['teacherId'] as num).toInt(),
      recordDate: json['recordDate'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
      surah: json['surah'] as String?,
      fromSurah: (json['fromSurah'] as num?)?.toInt(),
      toSurah: (json['toSurah'] as num?)?.toInt(),
      fromAyah: (json['fromAyah'] as num?)?.toInt(),
      toAyah: (json['toAyah'] as num?)?.toInt(),
      fromPage: (json['fromPage'] as num?)?.toInt(),
      toPage: (json['toPage'] as num?)?.toInt(),
      pagesCount: (json['pagesCount'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toInt(),
      matnId: (json['matnId'] as num?)?.toInt(),
      matnName: json['matnName'] as String?,
      matnStatus: json['matnStatus'] as String?,
      notes: json['notes'] as String?,
      idempotencyKey: json['idempotencyKey'] as String?,
      lockVersion: (json['lockVersion'] as num?)?.toInt(),
      student: json['student'] as Map<String, dynamic>?,
      teacher: json['teacher'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$FollowUpRecordDtoImplToJson(
        _$FollowUpRecordDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'studentId': instance.studentId,
      'circleId': instance.circleId,
      'teacherId': instance.teacherId,
      'recordDate': instance.recordDate,
      'type': instance.type,
      'status': instance.status,
      'surah': instance.surah,
      'fromSurah': instance.fromSurah,
      'toSurah': instance.toSurah,
      'fromAyah': instance.fromAyah,
      'toAyah': instance.toAyah,
      'fromPage': instance.fromPage,
      'toPage': instance.toPage,
      'pagesCount': instance.pagesCount,
      'rating': instance.rating,
      'matnId': instance.matnId,
      'matnName': instance.matnName,
      'matnStatus': instance.matnStatus,
      'notes': instance.notes,
      'idempotencyKey': instance.idempotencyKey,
      'lockVersion': instance.lockVersion,
      'student': instance.student,
      'teacher': instance.teacher,
    };

_$CreateFollowUpRequestDtoImpl _$$CreateFollowUpRequestDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateFollowUpRequestDtoImpl(
      studentId: (json['studentId'] as num).toInt(),
      circleId: (json['circleId'] as num).toInt(),
      recordDate: json['recordDate'] as String,
      type: json['type'] as String,
      status: json['status'] as String?,
      surah: json['surah'] as String?,
      fromSurah: (json['fromSurah'] as num?)?.toInt(),
      toSurah: (json['toSurah'] as num?)?.toInt(),
      fromAyah: (json['fromAyah'] as num?)?.toInt(),
      toAyah: (json['toAyah'] as num?)?.toInt(),
      fromPage: (json['fromPage'] as num?)?.toInt(),
      toPage: (json['toPage'] as num?)?.toInt(),
      pagesCount: (json['pagesCount'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toInt(),
      matnId: (json['matnId'] as num?)?.toInt(),
      matnName: json['matnName'] as String?,
      matnStatus: json['matnStatus'] as String?,
      notes: json['notes'] as String?,
      idempotencyKey: json['idempotencyKey'] as String?,
    );

Map<String, dynamic> _$$CreateFollowUpRequestDtoImplToJson(
        _$CreateFollowUpRequestDtoImpl instance) =>
    <String, dynamic>{
      'studentId': instance.studentId,
      'circleId': instance.circleId,
      'recordDate': instance.recordDate,
      'type': instance.type,
      'status': instance.status,
      'surah': instance.surah,
      'fromSurah': instance.fromSurah,
      'toSurah': instance.toSurah,
      'fromAyah': instance.fromAyah,
      'toAyah': instance.toAyah,
      'fromPage': instance.fromPage,
      'toPage': instance.toPage,
      'pagesCount': instance.pagesCount,
      'rating': instance.rating,
      'matnId': instance.matnId,
      'matnName': instance.matnName,
      'matnStatus': instance.matnStatus,
      'notes': instance.notes,
      'idempotencyKey': instance.idempotencyKey,
    };

_$UpdateFollowUpRequestDtoImpl _$$UpdateFollowUpRequestDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$UpdateFollowUpRequestDtoImpl(
      recordDate: json['recordDate'] as String?,
      type: json['type'] as String?,
      surah: json['surah'] as String?,
      fromSurah: (json['fromSurah'] as num?)?.toInt(),
      toSurah: (json['toSurah'] as num?)?.toInt(),
      fromAyah: (json['fromAyah'] as num?)?.toInt(),
      toAyah: (json['toAyah'] as num?)?.toInt(),
      fromPage: (json['fromPage'] as num?)?.toInt(),
      toPage: (json['toPage'] as num?)?.toInt(),
      pagesCount: (json['pagesCount'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toInt(),
      matnId: (json['matnId'] as num?)?.toInt(),
      matnName: json['matnName'] as String?,
      matnStatus: json['matnStatus'] as String?,
      notes: json['notes'] as String?,
      lockVersion: (json['lockVersion'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$UpdateFollowUpRequestDtoImplToJson(
        _$UpdateFollowUpRequestDtoImpl instance) =>
    <String, dynamic>{
      'recordDate': instance.recordDate,
      'type': instance.type,
      'surah': instance.surah,
      'fromSurah': instance.fromSurah,
      'toSurah': instance.toSurah,
      'fromAyah': instance.fromAyah,
      'toAyah': instance.toAyah,
      'fromPage': instance.fromPage,
      'toPage': instance.toPage,
      'pagesCount': instance.pagesCount,
      'rating': instance.rating,
      'matnId': instance.matnId,
      'matnName': instance.matnName,
      'matnStatus': instance.matnStatus,
      'notes': instance.notes,
      'lockVersion': instance.lockVersion,
    };

_$ListFollowUpsRequestDtoImpl _$$ListFollowUpsRequestDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$ListFollowUpsRequestDtoImpl(
      centerId: (json['centerId'] as num?)?.toInt(),
      circleId: (json['circleId'] as num?)?.toInt(),
      studentId: (json['studentId'] as num?)?.toInt(),
      from: json['from'] as String?,
      to: json['to'] as String?,
      status: json['status'] as String?,
      page: (json['page'] as num?)?.toInt(),
      pageSize: (json['pageSize'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$ListFollowUpsRequestDtoImplToJson(
        _$ListFollowUpsRequestDtoImpl instance) =>
    <String, dynamic>{
      'centerId': instance.centerId,
      'circleId': instance.circleId,
      'studentId': instance.studentId,
      'from': instance.from,
      'to': instance.to,
      'status': instance.status,
      'page': instance.page,
      'pageSize': instance.pageSize,
    };
