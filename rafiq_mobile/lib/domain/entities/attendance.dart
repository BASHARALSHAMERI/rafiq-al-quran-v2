enum AttendanceStatus {
  present,
  absent,
  late,
  excused,
}

enum AttendanceSubmitResult {
  submitted,
  queuedOffline,
}

class Student {
  final String id;
  final String name;
  final String enrollmentId;

  const Student({
    required this.id,
    required this.name,
    required this.enrollmentId,
  });
}

class AttendanceRecord {
  final String studentId;
  final String circleId;
  final String date;
  final AttendanceStatus status;
  final String? note;

  const AttendanceRecord({
    required this.studentId,
    required this.circleId,
    required this.date,
    required this.status,
    this.note,
  });
}

class BulkAttendanceSubmission {
  final String circleId;
  final String date;
  final List<AttendanceRecord> records;

  const BulkAttendanceSubmission({
    required this.circleId,
    required this.date,
    required this.records,
  });
}
