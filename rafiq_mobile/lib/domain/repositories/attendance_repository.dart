import '../entities/attendance.dart';

abstract class AttendanceRepository {
  Future<List<Student>> getCircleStudents(String circleId);
  Future<List<AttendanceRecord>> getAttendanceForDate(
      String circleId, String date);
  Future<AttendanceSubmitResult> submitBulkAttendance(
      BulkAttendanceSubmission submission);
}
