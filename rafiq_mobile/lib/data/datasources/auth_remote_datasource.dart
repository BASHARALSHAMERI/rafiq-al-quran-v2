import 'package:dio/dio.dart';
import '../models/auth_dtos.dart';

class AuthRemoteDataSource {
  final Dio _dio;

  AuthRemoteDataSource(this._dio);

  Future<AuthSessionDto> login(LoginRequest request) async {
    try {
      final response = await _dio.post('/auth/login', data: request.toJson());
      final payload = _readDataPayload(response.data);
      return AuthSessionDto.fromJson(payload);
    } catch (e) {
      rethrow;
    }
  }

  Future<AuthSessionDto> refresh(RefreshRequest request) async {
    try {
      final response = await _dio.post('/auth/refresh', data: request.toJson());
      final payload = _readDataPayload(response.data);
      return AuthSessionDto.fromJson(payload);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout(RefreshRequest request) async {
    try {
      await _dio.post('/auth/logout', data: request.toJson());
    } catch (e) {
      rethrow;
    }
  }

  Future<AuthUserDto> me() async {
    try {
      final response = await _dio.get('/auth/me');
      final payload = _readDataPayload(response.data);
      return AuthUserDto.fromJson(payload);
    } catch (e) {
      rethrow;
    }
  }

  Future<String> forgotPassword(ForgotPasswordRequest request) async {
    final response = await _dio.post(
      '/auth/forgot-password',
      data: request.toJson(),
    );
    final payload = _readRootPayload(response.data);
    final message = payload['message'];
    if (message is String && message.trim().isNotEmpty) {
      return message.trim();
    }
    return 'تم استلام طلب استعادة كلمة المرور.';
  }

  Map<String, dynamic> _readDataPayload(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) {
        return data;
      }
      return responseData;
    }
    return <String, dynamic>{};
  }

  Map<String, dynamic> _readRootPayload(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) {
        return data;
      }
      return responseData;
    }
    return <String, dynamic>{};
  }
}
