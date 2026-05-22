import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_controller.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_gradients.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_animations.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _rememberMe = true;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    await ref.read(authControllerProvider.notifier).login(
          _identifierController.text.trim(),
          _passwordController.text,
        );
    final state = ref.read(authControllerProvider);
    if (!mounted) return;
    if (state.isAuthenticated && state.user != null) {
      context.go(RouteNames.homeForRole(state.user?.role));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final theme = Theme.of(context);
    final size = MediaQuery.sizeOf(context);

    ref.listen<AuthState>(authControllerProvider, (previous, next) {
      if (next.error != null && next.error != previous?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppColors.errorLight,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    });

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // === Green background top section ===
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: size.height * 0.42,
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppGradients.deepPrimary,
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo
                      Container(
                        width: 84,
                        height: 84,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.15),
                          border: Border.all(
                              color: Colors.white.withValues(alpha: 0.30),
                              width: 2),
                          boxShadow: AppShadows.primaryGlow,
                        ),
                        child: const Icon(
                          Icons.menu_book_rounded,
                          size: 42,
                          color: Colors.white,
                        ),
                      )
                          .animate()
                          .scale(
                            duration: AppDurations.slow,
                            curve: AppCurves.spring,
                            begin: const Offset(0.5, 0.5),
                            end: const Offset(1.0, 1.0),
                          )
                          .fadeIn(duration: AppDurations.medium),

                      const SizedBox(height: 16),

                      Text(
                        'رفقاء القرآن',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 28,
                        ),
                      )
                          .animate()
                          .slideY(
                            begin: 0.3,
                            end: 0,
                            duration: AppDurations.medium,
                            curve: AppCurves.decelerate,
                          )
                          .fadeIn(delay: 200.ms),

                      const SizedBox(height: 6),
                      Text(
                        'تسجيل الدخول إلى نظام الحلقات',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.80),
                          fontSize: 14,
                        ),
                      )
                          .animate()
                          .fadeIn(delay: 300.ms, duration: AppDurations.medium),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // === Form card ===
          Positioned.fill(
            top: size.height * 0.33,
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                  20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 24),
              child: Container(
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(28),
                    topRight: Radius.circular(28),
                  ),
                  boxShadow: AppShadows.xl,
                ),
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Drag handle
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 20),
                          decoration: BoxDecoration(
                            color: AppColors.borderLight,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),

                      Text(
                        'أهلاً بك',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ).animate().fadeIn(delay: 250.ms),

                      const SizedBox(height: 4),
                      Text(
                        'يرجى تسجيل الدخول للمتابعة',
                        style: theme.textTheme.bodyMedium,
                      ).animate().fadeIn(delay: 320.ms),

                      const SizedBox(height: 24),

                      // Identifier field
                      TextFormField(
                        controller: _identifierController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'البريد الإلكتروني أو رقم الهاتف',
                          prefixIcon: const Icon(Icons.person_outline_rounded),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'يرجى إدخال البريد الإلكتروني';
                          }
                          return null;
                        },
                      )
                          .animate()
                          .slideX(
                            begin: 0.1,
                            end: 0,
                            delay: 350.ms,
                            duration: AppDurations.medium,
                            curve: AppCurves.decelerate,
                          )
                          .fadeIn(delay: 350.ms),

                      const SizedBox(height: 14),

                      // Password field
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'كلمة المرور',
                          prefixIcon: const Icon(Icons.lock_outline_rounded),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          suffixIcon: IconButton(
                            onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword),
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'يرجى إدخال كلمة المرور';
                          }
                          return null;
                        },
                      )
                          .animate()
                          .slideX(
                            begin: 0.1,
                            end: 0,
                            delay: 420.ms,
                            duration: AppDurations.medium,
                            curve: AppCurves.decelerate,
                          )
                          .fadeIn(delay: 420.ms),

                      const SizedBox(height: 8),

                      // Remember me + Forgot password row
                      Row(
                        children: [
                          SizedBox(
                            width: 24,
                            height: 24,
                            child: Checkbox(
                              value: _rememberMe,
                              onChanged: (v) =>
                                  setState(() => _rememberMe = v ?? true),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(5)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text('تذكرني',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurface)),
                          const Spacer(),
                          TextButton(
                            onPressed: () =>
                                context.push(RouteNames.forgotPassword),
                            child: Text(
                              'نسيت كلمة المرور؟',
                              style: TextStyle(
                                  color: theme.colorScheme.primary,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ).animate().fadeIn(delay: 480.ms),

                      const SizedBox(height: 20),

                      // Login button with gradient
                      _GradientLoginButton(
                        isLoading: authState.isLoading,
                        onPressed: authState.isLoading ? null : _submit,
                      )
                          .animate()
                          .slideY(
                            begin: 0.3,
                            end: 0,
                            delay: 520.ms,
                            duration: AppDurations.medium,
                            curve: AppCurves.spring,
                          )
                          .fadeIn(delay: 520.ms),

                      const SizedBox(height: 16),

                      Text(
                        'بالدخول أنت توافق على شروط الاستخدام وسياسة الخصوصية',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondaryLight, fontSize: 11),
                      ).animate().fadeIn(delay: 600.ms),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// زر الدخول بـ gradient ومؤشر تحميل متكامل
class _GradientLoginButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback? onPressed;

  const _GradientLoginButton({
    required this.isLoading,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: AnimatedContainer(
        duration: AppDurations.fast,
        height: 56,
        decoration: BoxDecoration(
          gradient: onPressed != null
              ? AppGradients.deepPrimary
              : const LinearGradient(
                  colors: [Color(0xFFCBD5E1), Color(0xFFCBD5E1)]),
          borderRadius: BorderRadius.circular(14),
          boxShadow: onPressed != null ? AppShadows.primaryGlow : null,
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'تسجيل الدخول',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(Icons.arrow_forward_rounded,
                        color: Colors.white, size: 20),
                  ],
                ),
        ),
      ),
    );
  }
}
