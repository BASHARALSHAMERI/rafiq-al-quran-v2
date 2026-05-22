// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$StudentDtoImpl _$$StudentDtoImplFromJson(Map<String, dynamic> json) =>
    _$StudentDtoImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      enrollmentId: json['enrollmentId'] as String,
    );

Map<String, dynamic> _$$StudentDtoImplToJson(_$StudentDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'enrollmentId': instance.enrollmentId,
    };

_$AttendanceRecordDtoImpl _$$AttendanceRecordDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$AttendanceRecordDtoImpl(
      studentId: json['studentId'] as String,
      circleId: json['circleId'] as String,
      date: json['date'] as String,
      status: json['status'] as String,
      note: json['note'] as String?,
    );

Map<String, dynamic> _$$AttendanceRecordDtoImplToJson(
        _$AttendanceRecordDtoImpl instance) =>
    <String, dynamic>{
      'studentId': instance.studentId,
      'circleId': instance.circleId,
      'date': instance.date,
      'status': instance.status,
      'note': instance.note,
    };

_$BulkAttendanceRequestImpl _$$BulkAttendanceRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$BulkAttendanceRequestImpl(
      circleId: json['circleId'] as String,
      date: json['date'] as String,
      records: (json['records'] as List<dynamic>)
          .map((e) => AttendanceRecordDto.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$BulkAttendanceRequestImplToJson(
        _$BulkAttendanceRequestImpl instance) =>
    <String, dynamic>{
      'circleId': instance.circleId,
      'date': instance.date,
      'records': instance.records,
    };
