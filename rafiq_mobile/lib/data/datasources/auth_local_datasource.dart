import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class CachedAuthUser {
  final int id;
  final int organizationId;
  final String fullName;
  final String email;
  final String role;
  final bool isActive;
  final String accountStatus;

  const CachedAuthUser({
    required this.id,
    required this.organizationId,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
    required this.accountStatus,
  });
}

class AuthLocalDataSource {
  final FlutterSecureStorage _storage;

  AuthLocalDataSource(this._storage);

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userRoleKey = 'user_role';
  static const _userIdKey = 'user_id';
  static const _userOrgIdKey = 'user_org_id';
  static const _userFullNameKey = 'user_full_name';
  static const _userEmailKey = 'user_email';
  static const _userIsActiveKey = 'user_is_active';
  static const _userAccountStatusKey = 'user_account_status';

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
    required int userId,
    required int organizationId,
    required String fullName,
    required String email,
    required String role,
    required bool isActive,
    required String accountStatus,
  }) async {
    await _storage.write(key: _userIdKey, value: userId.toString());
    await _storage.write(key: _userOrgIdKey, value: organizationId.toString());
    await _storage.write(key: _userFullNameKey, value: fullName);
    await _storage.write(key: _userEmailKey, value: email);
    await _storage.write(key: _userRoleKey, value: role);
    await _storage.write(key: _userIsActiveKey, value: isActive.toString());
    await _storage.write(key: _userAccountStatusKey, value: accountStatus);
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);
  Future<String?> getUserRole() => _storage.read(key: _userRoleKey);
  Future<String?> getUserId() => _storage.read(key: _userIdKey);
  Future<String?> getUserOrgId() => _storage.read(key: _userOrgIdKey);
  Future<String?> getUserFullName() => _storage.read(key: _userFullNameKey);
  Future<String?> getUserEmail() => _storage.read(key: _userEmailKey);
  Future<String?> getUserIsActive() => _storage.read(key: _userIsActiveKey);
  Future<String?> getUserAccountStatus() => _storage.read(key: _userAccountStatusKey);

  Future<CachedAuthUser?> getCachedUser() async {
    final role = (await getUserRole())?.trim();
    if (role == null || role.isEmpty) {
      return null;
    }

    final userIdStr = await getUserId();
    if (userIdStr == null || int.tryParse(userIdStr) == null) return null;
    final userId = int.parse(userIdStr);

    final orgIdStr = await getUserOrgId();
    final organizationId = orgIdStr != null ? int.tryParse(orgIdStr) ?? 0 : 0;

    final fullName = (await getUserFullName())?.trim() ?? 'User';
    final email = (await getUserEmail())?.trim() ?? '';
    final isActiveStr = await getUserIsActive();
    final isActive = isActiveStr == 'true';
    final accountStatus = (await getUserAccountStatus())?.trim() ?? 'ACTIVE';

    return CachedAuthUser(
      id: userId,
      organizationId: organizationId,
      fullName: fullName,
      email: email,
      role: role,
      isActive: isActive,
      accountStatus: accountStatus,
    );
  }

  Future<void> clearAll() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _userRoleKey);
    await _storage.delete(key: _userIdKey);
    await _storage.delete(key: _userOrgIdKey);
    await _storage.delete(key: _userFullNameKey);
    await _storage.delete(key: _userEmailKey);
    await _storage.delete(key: _userIsActiveKey);
    await _storage.delete(key: _userAccountStatusKey);
  }
}
