import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_providers.dart';
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
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const StandardAppBar(
        title: 'استعادة الحساب',
        backgroundColor: Colors.white,
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
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: const BorderSide(
                      color: Color(0xFF7A9F78),
                      width: 1.5,
                    ),
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
                color: const Color(0xFFDC2626),
                backgroundColor: const Color(0xFFFEE2E2),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              height: 54,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7A9F78),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_rounded),
                label: Text(
                  _isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الاستعادة',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
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
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: Color(0xFFE8F3E8),
            child: Icon(
              Icons.mark_email_read_rounded,
              color: Color(0xFF7A9F78),
              size: 28,
            ),
          ),
          SizedBox(height: 16),
          Text(
            'نسيت كلمة المرور؟',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          SizedBox(height: 10),
          Text(
            'أدخل البريد الإلكتروني أو رقم الهاتف المرتبط بحسابك. سنرسل لك رابط استعادة لإكمال تعيين كلمة المرور خارج التطبيق.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              height: 1.6,
              color: Color(0xFF64748B),
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
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          const CircleAvatar(
            radius: 32,
            backgroundColor: Color(0xFFE8F3E8),
            child: Icon(
              Icons.check_circle_rounded,
              color: Color(0xFF16A34A),
              size: 34,
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'تم إرسال الطلب',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              height: 1.6,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'المعرّف: $identifier',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF7A9F78),
            ),
          ),
          const SizedBox(height: 18),
          const _InlineMessage(
            text:
                'أكمل إعادة التعيين من الرابط الذي سيصل إليك. لا يوجد إدخال OTP داخل التطبيق في هذه المرحلة.',
            color: Color(0xFF0F172A),
            backgroundColor: Color(0xFFE2E8F0),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: OutlinedButton(
              onPressed: onBackToLogin,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF0F172A),
                side: const BorderSide(color: Color(0xFFCBD5E1)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
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
        borderRadius: BorderRadius.circular(16),
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
