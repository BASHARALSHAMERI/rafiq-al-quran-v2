import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rafiq_mobile/application/auth/auth_providers.dart';
import 'package:rafiq_mobile/domain/entities/user.dart';
import 'package:rafiq_mobile/domain/repositories/auth_repository.dart';
import 'package:rafiq_mobile/presentation/auth/forgot_password_screen.dart';

void main() {
  testWidgets('forgot password sends request and shows success state',
      (tester) async {
    final repository = _FakeAuthRepository();
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (_, __) => const ForgotPasswordScreen(),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(repository),
        ],
        child: MaterialApp.router(
          routerConfig: router,
        ),
      ),
    );

    final field = find.descendant(
      of: find.byType(TextFormField),
      matching: find.byType(EditableText),
    );
    expect(find.byType(TextFormField), findsOneWidget);

    await tester.enterText(
      field,
      'teacher@example.com',
    );
    await tester.tap(find.text('إرسال طلب الاستعادة'));
    await tester.pump();
    await tester.pumpAndSettle();

    expect(repository.lastForgotIdentifier, 'teacher@example.com');
    expect(find.text('تم إرسال الطلب'), findsOneWidget);
    expect(find.byType(TextFormField), findsNothing);
    expect(find.text('العودة لتسجيل الدخول'), findsOneWidget);
  });
}

class _FakeAuthRepository implements AuthRepository {
  String? lastForgotIdentifier;

  @override
  Future<bool> checkAuthStatus() async => false;

  @override
  Future<String> forgotPassword(String identifier) async {
    lastForgotIdentifier = identifier;
    return 'تم إرسال رابط الاستعادة إلى القناة المسجلة.';
  }

  @override
  Future<User?> getCachedUser() async => null;

  @override
  Future<User?> getCurrentUser() async => null;

  @override
  Future<User> login(String email, String password) {
    throw UnimplementedError();
  }

  @override
  Future<void> logout() async {}
}
