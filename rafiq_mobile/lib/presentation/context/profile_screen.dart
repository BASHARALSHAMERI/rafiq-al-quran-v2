import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_controller.dart';
import '../../application/context/context_controller.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_gradients.dart';
import '../../core/theme/app_shadows.dart';
import '../shared/widgets/feature_status_chip.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final contextState = ref.watch(contextControllerProvider);
    final theme = Theme.of(context);
    final user = authState.user;

    ref.listen<AuthState>(authControllerProvider, (previous, next) {
      if (next.user == null && !next.isLoading) {
        context.go(RouteNames.login);
      }
    });

    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            elevation: 0,
            backgroundColor: AppColors.primaryLight,
            surfaceTintColor: Colors.transparent,
            automaticallyImplyLeading: false,
            centerTitle: false,
            title: InkWell(
              onTap: context.canPop() ? () => context.pop() : null,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'الملف الشخصي',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    if (context.canPop()) ...[
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 14,
                        color: Colors.white,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: AppGradients.deepPrimary,
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 50, 20, 0),
                    child: Column(
                      children: [
                        Container(
                          width: 82,
                          height: 82,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.15),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.4),
                              width: 3,
                            ),
                          ),
                          child: Icon(
                            Icons.person_rounded,
                            size: 40,
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          user?.name ?? 'مستخدم',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 20,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          alignment: WrapAlignment.center,
                          children: [
                            _HeaderPill(
                              icon: Icons.badge_rounded,
                              text: _roleLabel(user?.role),
                            ),
                            _HeaderPill(
                              icon: Icons.mosque_rounded,
                              text:
                                  'مركز ${contextState.selectedCenterId ?? '-'}',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const _SectionTitle(title: 'معلومات الحساب'),
            const SizedBox(height: 10),
            _InfoTile(
              icon: Icons.phone_rounded,
              iconColor: AppColors.primaryLight,
              label: 'رقم الهاتف',
              value: user?.phone?.trim().isNotEmpty == true
                  ? user!.phone!.trim()
                  : 'غير متوفر',
            ),
            const SizedBox(height: 8),
            _InfoTile(
              icon: Icons.groups_rounded,
              iconColor: AppColors.primaryLight,
              label: 'الحلقة الحالية',
              value: 'حلقة ${contextState.selectedCircleId ?? '-'}',
            ),
            const SizedBox(height: 24),
            const _SectionTitle(title: 'الإعدادات والأمان'),
            const SizedBox(height: 10),
            const _SettingsTile(
              icon: Icons.lock_rounded,
              iconColor: AppColors.primaryLight,
              title: 'تغيير كلمة المرور',
              trailing: FeatureStatusChip.custom(
                label: 'غير متاح حاليًا',
                color: AppColors.warningLight,
              ),
              showChevron: false,
            ),
            const SizedBox(height: 8),
            _SettingsTile(
              icon: Icons.language_rounded,
              iconColor: AppColors.primaryLight,
              title: 'اللغة',
              trailing: Text(
                'العربية',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
              ),
              showChevron: false,
            ),
            const SizedBox(height: 8),
            const _SettingsTile(
              icon: Icons.verified_user_rounded,
              iconColor: AppColors.successLight,
              title: 'سياسة الخصوصية',
              trailing: FeatureStatusChip.custom(
                label: 'لاحقًا',
                color: AppColors.warningLight,
              ),
              showChevron: false,
            ),
            const SizedBox(height: 8),
            _SettingsTile(
              icon: Icons.logout_rounded,
              iconColor: AppColors.errorLight,
              title: 'تسجيل الخروج',
              titleColor: AppColors.errorLight,
              showChevron: false,
              onTap: () async {
                await ref
                    .read(contextControllerProvider.notifier)
                    .clearContext();
                await ref.read(authControllerProvider.notifier).logout();
                if (!context.mounted) {
                  return;
                }
                context.go(RouteNames.login);
              },
            ),
            const SizedBox(height: 32),
            Text(
              'إصدار التطبيق 2.4.0',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondaryLight,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  static String _roleLabel(String? role) {
    switch ((role ?? '').toUpperCase()) {
      case 'SUPERVISOR':
        return 'مشرف';
      case 'CENTER_ADMIN':
        return 'مدير مركز';
      case 'PARENT':
        return 'ولي أمر';
      case 'STUDENT':
        return 'طالب';
      case 'SUPER_ADMIN':
        return 'مدير عام';
      default:
        return 'معلم قرآن';
    }
  }
}

class _HeaderPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _HeaderPill({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  const _InfoTile({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.xs,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondaryLight,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final Color? titleColor;
  final Widget? trailing;
  final bool showChevron;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.titleColor,
    this.trailing,
    this.showChevron = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final resolvedTitleColor = onTap == null
        ? AppColors.textSecondaryLight
        : titleColor ?? AppColors.textPrimaryLight;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            children: [
              if (showChevron)
                const Icon(
                  Icons.chevron_left_rounded,
                  color: AppColors.textSecondaryLight,
                  size: 22,
                ),
              if (trailing != null) ...[
                trailing!,
                const SizedBox(width: 8),
              ],
              const Spacer(),
              Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: resolvedTitleColor,
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
