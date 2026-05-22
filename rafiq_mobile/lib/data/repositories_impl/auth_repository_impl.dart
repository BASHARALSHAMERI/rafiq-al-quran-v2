import 'package:dio/dio.dart';

import '../../domain/repositories/auth_repository.dart';
import '../../domain/entities/user.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/auth_dtos.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;

  AuthRepositoryImpl(this._remoteDataSource, this._localDataSource);

  @override
  Future<User> login(String email, String password) async {
    final request = LoginRequest(identifier: email, password: password);
    final response = await _remoteDataSource.login(request);

    await _persistSession(response);
    return _mapUser(response.user);
  }

  @override
  Future<void> logout() async {
    final refreshToken = await _localDataSource.getRefreshToken();
    if (refreshToken != null && refreshToken.isNotEmpty) {
      try {
        await _remoteDataSource
            .logout(RefreshRequest(refreshToken: refreshToken));
      } catch (_) {
        // Always clear local session even if backend revoke fails.
      }
    }

    await _localDataSource.clearAll();
  }

  @override
  Future<bool> checkAuthStatus() async {
    final token = await _localDataSource.getAccessToken();
    if (token == null || token.isEmpty) {
      return false;
    }

    final user = await getCurrentUser();
    return user != null;
  }

  @override
  Future<User?> getCachedUser() async {
    final token = await _localDataSource.getAccessToken();
    if (token == null || token.isEmpty) {
      return null;
    }

    final cachedUser = await _localDataSource.getCachedUser();
    return _mapCachedUser(cachedUser);
  }

  @override
  Future<User?> getCurrentUser() async {
    final token = await _localDataSource.getAccessToken();
    if (token == null || token.isEmpty) {
      return null;
    }

    final cachedUser = await _localDataSource.getCachedUser();

    try {
      final userDto = await _remoteDataSource.me();
      await _persistUser(userDto);
      return _mapUser(userDto);
    } on DioException catch (error) {
      if (_shouldKeepLocalSession(error)) {
        return _mapCachedUser(cachedUser);
      }
      return null;
    } catch (_) {
      return _mapCachedUser(cachedUser);
    }
  }

  @override
  Future<String> forgotPassword(String identifier) {
    return _remoteDataSource.forgotPassword(
      ForgotPasswordRequest(identifier: identifier),
    );
  }

  Future<void> _persistSession(AuthSessionDto response) async {
    await _localDataSource.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );
    await _persistUser(response.user);
  }

  Future<void> _persistUser(AuthUserDto user) {
    return _localDataSource.saveUserProfile(
      userId: user.id.toString(),
      name: _displayNameFor(user),
      role: user.role,
      phone: user.phone,
      gender: user.gender,
    );
  }

  bool _shouldKeepLocalSession(DioException error) {
    return _isRecoverable(error);
  }

  bool _isRecoverable(DioException error) {
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.unknown) {
      return true;
    }

    final statusCode = error.response?.statusCode;
    return statusCode == 403 || (statusCode != null && statusCode >= 500);
  }

  String _displayNameFor(AuthUserDto dto) {
    final displayName = dto.fullName.trim().isEmpty ? dto.email : dto.fullName;
    return displayName.trim();
  }

  User? _mapCachedUser(CachedAuthUser? cachedUser) {
    if (cachedUser == null) {
      return null;
    }

    return User(
      id: cachedUser.id,
      name: cachedUser.name,
      role: cachedUser.role,
      phone: cachedUser.phone,
      gender: cachedUser.gender,
    );
  }

  User _mapUser(AuthUserDto dto) {
    return User(
      id: dto.id.toString(),
      name: _displayNameFor(dto),
      role: dto.role,
      phone: dto.phone,
      gender: dto.gender,
    );
  }
}
