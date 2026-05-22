import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class CachedAuthUser {
  final String id;
  final String name;
  final String role;
  final String? phone;
  final String? gender;

  const CachedAuthUser({
    required this.id,
    required this.name,
    required this.role,
    this.phone,
    this.gender,
  });
}

class AuthLocalDataSource {
  final FlutterSecureStorage _storage;

  AuthLocalDataSource(this._storage);

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userRoleKey = 'user_role';
  static const _userIdKey = 'user_id';
  static const _userNameKey = 'user_name';
  static const _userPhoneKey = 'user_phone';
  static const _userGenderKey = 'user_gender';

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<void> saveUserRole(String role) async {
    await _storage.write(key: _userRoleKey, value: role);
  }

  Future<void> saveUserProfile({
    required String userId,
    required String name,
    required String role,
    String? phone,
    String? gender,
  }) async {
    await _storage.write(key: _userIdKey, value: userId);
    await _storage.write(key: _userNameKey, value: name);
    await _storage.write(key: _userRoleKey, value: role);

    if (phone == null || phone.trim().isEmpty) {
      await _storage.delete(key: _userPhoneKey);
    } else {
      await _storage.write(key: _userPhoneKey, value: phone);
    }

    if (gender == null || gender.trim().isEmpty) {
      await _storage.delete(key: _userGenderKey);
    } else {
      await _storage.write(key: _userGenderKey, value: gender);
    }
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);
  Future<String?> getUserRole() => _storage.read(key: _userRoleKey);
  Future<String?> getUserId() => _storage.read(key: _userIdKey);
  Future<String?> getUserName() => _storage.read(key: _userNameKey);
  Future<String?> getUserPhone() => _storage.read(key: _userPhoneKey);
  Future<String?> getUserGender() => _storage.read(key: _userGenderKey);

  Future<CachedAuthUser?> getCachedUser() async {
    final role = (await getUserRole())?.trim();
    if (role == null || role.isEmpty) {
      return null;
    }

    final userId = (await getUserId())?.trim() ?? '';
    final storedName = (await getUserName())?.trim();
    final name = storedName == null || storedName.isEmpty ? 'User' : storedName;

    return CachedAuthUser(
      id: userId,
      name: name,
      role: role,
      phone: (await getUserPhone())?.trim(),
      gender: (await getUserGender())?.trim(),
    );
  }

  Future<void> clearAll() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _userRoleKey);
    await _storage.delete(key: _userIdKey);
    await _storage.delete(key: _userNameKey);
    await _storage.delete(key: _userPhoneKey);
    await _storage.delete(key: _userGenderKey);
  }
}
