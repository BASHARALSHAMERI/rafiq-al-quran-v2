/// Represents a Quran memorization circle (Halqa) within a center.
///
/// Maps to the `circles` table in the database.
class Circle {
  final int id;
  final int centerId;
  final String name;
  final int teacherId;
  final bool isActive;
  final String gender;
  final String circleType;
  final String approvalStatus;
  final String? mosqueName;
  final String? locationText;
  final double? latitude;
  final double? longitude;
  final int? allowedRadiusMeters;
  final String? teacherName;
  final int? studentsCount;

  const Circle({
    required this.id,
    required this.centerId,
    required this.name,
    required this.teacherId,
    required this.isActive,
    required this.gender,
    required this.circleType,
    required this.approvalStatus,
    this.mosqueName,
    this.locationText,
    this.latitude,
    this.longitude,
    this.allowedRadiusMeters,
    this.teacherName,
    this.studentsCount,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Circle && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Circle(id: $id, name: $name, centerId: $centerId)';
}
