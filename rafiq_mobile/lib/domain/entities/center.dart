/// Represents a Quran Center within the organization.
///
/// Maps to the `centers` table in the database.
class Center {
  final int id;
  final int organizationId;
  final String name;
  final String code;
  final bool isActive;
  final String gender;
  final String? timezone;
  final String? mosqueName;
  final String? locationText;
  final double? latitude;
  final double? longitude;
  final int? allowedRadiusMeters;
  final String? logoUrl;
  final int centerAdminUserId;

  const Center({
    required this.id,
    required this.organizationId,
    required this.name,
    required this.code,
    required this.isActive,
    required this.gender,
    this.timezone,
    this.mosqueName,
    this.locationText,
    this.latitude,
    this.longitude,
    this.allowedRadiusMeters,
    this.logoUrl,
    required this.centerAdminUserId,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Center && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Center(id: $id, name: $name, code: $code)';
}
