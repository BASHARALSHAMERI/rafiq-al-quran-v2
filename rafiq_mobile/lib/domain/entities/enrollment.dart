/// Represents a student's enrollment in a circle.
///
/// Maps to the `student_circle_enrollments` table in the database.
class StudentEnrollment {
  final int id;
  final int studentId;
  final int circleId;
  final String status;
  final DateTime startDate;
  final DateTime? endDate;

  const StudentEnrollment({
    required this.id,
    required this.studentId,
    required this.circleId,
    required this.status,
    required this.startDate,
    this.endDate,
  });

  bool get isActive => status == 'ACTIVE';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StudentEnrollment &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
