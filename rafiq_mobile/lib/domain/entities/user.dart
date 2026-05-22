class User {
  final String id;
  final String name;
  final String role;
  final String? phone;
  final String? gender;

  User({
    required this.id,
    required this.name,
    required this.role,
    this.phone,
    this.gender,
  });
}
