import '../entities/user.dart';

abstract class AuthRepository {
  Future<User> login(String email, String password);
  Future<User?> getCachedUser();
  Future<User?> getCurrentUser();
  Future<void> logout();
  Future<bool> checkAuthStatus();
  Future<String> forgotPassword(String identifier);
}
