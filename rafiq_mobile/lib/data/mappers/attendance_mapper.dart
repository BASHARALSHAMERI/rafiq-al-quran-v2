import '../../domain/entities/attendance.dart';
import '../models/attendance_dtos.dart';

AttendanceStatus _statusFromDto(String status) {
  switch (status.toUpperCase()) {
    case 'PRESENT':
      return AttendanceStatus.present;
    case 'ABSENT':
      return AttendanceStatus.absent;
    case 'LATE':
      return AttendanceStatus.late;
    case 'EXCUSED':
      return AttendanceStatus.excused;
    default:
      return AttendanceStatus.present;
  }
}

String _statusToDto(AttendanceStatus status) {
  switch (status) {
    case AttendanceStatus.present:
      return 'PRESENT';
    case AttendanceStatus.absent:
      return 'ABSENT';
    case AttendanceStatus.late:
      return 'LATE';
    case AttendanceStatus.excused:
      return 'EXCUSED';
  }
}

extension StudentDtoMapper on StudentDto {
  Student toEntity() => Student(
        id: id,
        name: name,
        enrollmentId: enrollmentId,
      );
}

extension AttendanceRecordDtoMapper on AttendanceRecordDto {
  AttendanceRecord toEntity() => AttendanceRecord(
        studentId: studentId,
        circleId: circleId,
        date: date,
        status: _statusFromDto(status),
        note: note,
      );
}

extension BulkAttendanceSubmissionMapper on BulkAttendanceSubmission {
  BulkAttendanceRequest toRequestDto() => BulkAttendanceRequest(
        circleId: circleId,
        date: date,
        records: records
            .map(
              (record) => AttendanceRecordDto(
                studentId: record.studentId,
                circleId: circleId,
                date: date,
                status: _statusToDto(record.status),
                note: record.note,
              ),
            )
            .toList(),
      );
}
