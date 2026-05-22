import 'package:freezed_annotation/freezed_annotation.dart';

part 'attendance_dtos.freezed.dart';
part 'attendance_dtos.g.dart';

// Represents a sub-entity for listing students in attendance
@freezed
class StudentDto with _$StudentDto {
  const factory StudentDto({
    required String id,
    required String name,
    required String enrollmentId,
  }) = _StudentDto;

  factory StudentDto.fromJson(Map<String, dynamic> json) =>
      _$StudentDtoFromJson(json);
}

// Attendance Status enum string values: PRESENT, ABSENT, LATE, EXCUSED
@freezed
class AttendanceRecordDto with _$AttendanceRecordDto {
  const factory AttendanceRecordDto({
    required String studentId,
    required String circleId,
    required String date, // ISO Format YYYY-MM-DD
    required String status,
    String? note,
  }) = _AttendanceRecordDto;

  factory AttendanceRecordDto.fromJson(Map<String, dynamic> json) =>
      _$AttendanceRecordDtoFromJson(json);
}

@freezed
class BulkAttendanceRequest with _$BulkAttendanceRequest {
  const factory BulkAttendanceRequest({
    required String circleId,
    required String date,
    required List<AttendanceRecordDto> records,
  }) = _BulkAttendanceRequest;

  factory BulkAttendanceRequest.fromJson(Map<String, dynamic> json) =>
      _$BulkAttendanceRequestFromJson(json);
}
