/// Represents an authenticated user in the system.
///
/// Maps to the `users` table in the database.
/// Role-specific profile data lives in separate entities
/// (StudentProfile, TeacherProfile, etc.).
class User {
  final int id;
  final int organizationId;
  final String fullName;
  final String email;
  final String role;
  final bool isActive;
  final String accountStatus;
  final String? username;

  const User({
    required this.id,
    required this.organizationId,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
    required this.accountStatus,
    this.username,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'User(id: $id, fullName: $fullName, role: $role)';
}
