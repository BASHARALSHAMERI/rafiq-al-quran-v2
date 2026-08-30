import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_providers.dart';
import '../../core/constants/app_radius.dart';
import '../../core/theme/app_colors.dart';
import '../shared/widgets/standard_app_bar.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _identifierController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isSubmitting = false;
  String? _successMessage;
  String? _submittedIdentifier;
  String? _errorMessage;

  @override
  void dispose() {
    _identifierController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final identifier = _identifierController.text.trim();
      final message =
          await ref.read(authRepositoryProvider).forgotPassword(identifier);
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitting = false;
        _submittedIdentifier = identifier;
        _successMessage = message;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitting = false;
        _errorMessage = _mapError(error);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: const StandardAppBar(
        title: 'استعادة الحساب',
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (_successMessage == null) ...[
            const _ForgotPasswordIntro(),
            const SizedBox(height: 28),
            Form(
              key: _formKey,
              child: TextFormField(
                controller: _identifierController,
                textAlign: TextAlign.right,
                decoration: InputDecoration(
                  labelText: 'البريد الإلكتروني أو رقم الهاتف',
                  hintText: 'example@mail.com',
                  suffixIcon: const Icon(Icons.person_search_rounded),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'أدخل البريد الإلكتروني أو رقم الهاتف.';
                  }
                  return null;
                },
              ),
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 14),
              _InlineMessage(
                text: _errorMessage!,
                color: theme.colorScheme.error,
                backgroundColor: theme.colorScheme.error.withValues(alpha: 0.12),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                ),
                icon: _isSubmitting
                    ? SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: theme.colorScheme.onPrimary,
                        ),
                      )
                    : const Icon(Icons.send_rounded),
                label: Text(
                  _isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الاستعادة',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ] else ...[
            _SuccessState(
              message: _successMessage!,
              identifier: _submittedIdentifier ?? '',
              onBackToLogin: context.pop,
            ),
          ],
        ],
      ),
    );
  }

  String _mapError(Object error) {
    if (error is DioException) {
      final payload = error.response?.data;
      if (payload is Map<String, dynamic>) {
        final message = payload['message'] ?? payload['error'];
        if (message is String && message.trim().isNotEmpty) {
          return message.trim();
        }
      }
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        return 'تعذر الاتصال بالخادم. أعد المحاولة بعد التحقق من الشبكة.';
      }
    }
    return 'تعذر إرسال طلب الاستعادة. حاول مرة أخرى.';
  }
}

class _ForgotPasswordIntro extends StatelessWidget {
  const _ForgotPasswordIntro();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: theme.colorScheme.primary.withValues(alpha: isDark ? 0.20 : 0.10),
            child: Icon(
              Icons.mark_email_read_rounded,
              color: theme.colorScheme.primary,
              size: 28,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'نسيت كلمة المرور؟',
            textAlign: TextAlign.center,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w900,
              fontSize: 20,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'أدخل البريد الإلكتروني أو رقم الهاتف المرتبط بحسابك. سنرسل لك رابط استعادة لإكمال تعيين كلمة المرور خارج التطبيق.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              height: 1.6,
              color: context.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _SuccessState extends StatelessWidget {
  final String message;
  final String identifier;
  final VoidCallback onBackToLogin;

  const _SuccessState({
    required this.message,
    required this.identifier,
    required this.onBackToLogin,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final custom = context.customColors;
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: custom.success.withValues(alpha: isDark ? 0.20 : 0.12),
            child: Icon(
              Icons.check_circle_rounded,
              color: custom.success,
              size: 34,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'تم إرسال الطلب',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w900,
              fontSize: 20,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              height: 1.6,
              color: context.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'المعرّف: $identifier',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 18),
          _InlineMessage(
            text:
                'أكمل إعادة التعيين من الرابط الذي سيصل إليك. لا يوجد إدخال OTP داخل التطبيق في هذه المرحلة.',
            color: context.textPrimaryColor,
            backgroundColor: context.isDark
                ? theme.colorScheme.surfaceContainerHighest
                : AppColors.surfaceVariantLight,
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton(
              onPressed: onBackToLogin,
              child: const Text(
                'العودة لتسجيل الدخول',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InlineMessage extends StatelessWidget {
  final String text;
  final Color color;
  final Color backgroundColor;

  const _InlineMessage({
    required this.text,
    required this.color,
    required this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          height: 1.5,
        ),
      ),
    );
  }
}
