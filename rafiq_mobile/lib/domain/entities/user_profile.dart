/// Represents the general profile data for any user.
///
/// Maps to the `user_profiles` table in the database.
/// This is separated from [User] to follow the Schema design
/// where profile data is a distinct concern from authentication data.
class UserProfile {
  final int userId;
  final String fullName;
  final String gender;
  final DateTime? birthDate;
  final String? phone;
  final String? address;
  final String? avatarUrl;

  const UserProfile({
    required this.userId,
    required this.fullName,
    required this.gender,
    this.birthDate,
    this.phone,
    this.address,
    this.avatarUrl,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserProfile &&
          runtimeType == other.runtimeType &&
          userId == other.userId;

  @override
  int get hashCode => userId.hashCode;
}
