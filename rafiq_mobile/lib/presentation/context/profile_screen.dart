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

// ─────────────────────────────────────────────────────────────────────────────
// ProfileScreen — الملف الشخصي والإعدادات
// ─────────────────────────────────────────────────────────────────────────────

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isLoggingOut = false;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final contextState = ref.watch(contextControllerProvider);
    final theme = Theme.of(context);
    final user = authState.user;

    ref.listen<AuthState>(authControllerProvider, (previous, next) {
      if (next.user == null && !next.isLoading) {
        context.go(RouteNames.login);
      }
    });

    final role = (user?.role ?? '').toUpperCase();
    final roleConfig = _RoleConfig.from(role);

    final centerDisplay = contextState.selectedCenterName ??
        (contextState.selectedCenterId != null
            ? 'مركز ${contextState.selectedCenterId}'
            : null);

    final circleDisplay = contextState.selectedCircleName ??
        (contextState.selectedCircleId != null
            ? 'حلقة ${contextState.selectedCircleId}'
            : null);

    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          _buildSliverAppBar(
            theme: theme,
            user: user,
            roleConfig: roleConfig,
            centerDisplay: centerDisplay,
            circleDisplay: circleDisplay,
            innerBoxIsScrolled: innerBoxIsScrolled,
          ),
        ],
        body: _buildBody(
          theme: theme,
          user: user,
          roleConfig: roleConfig,
          centerDisplay: centerDisplay,
          circleDisplay: circleDisplay,
        ),
      ),
    );
  }

  // ── SliverAppBar ────────────────────────────────────────────────────────────

  Widget _buildSliverAppBar({
    required ThemeData theme,
    required dynamic user,
    required _RoleConfig roleConfig,
    required String? centerDisplay,
    required String? circleDisplay,
    required bool innerBoxIsScrolled,
  }) {
    return SliverAppBar(
      expandedHeight: 240,
      pinned: true,
      elevation: 0,
      scrolledUnderElevation: 2,
      backgroundColor: AppColors.primaryLight,
      surfaceTintColor: Colors.transparent,
      automaticallyImplyLeading: false,
      centerTitle: false,
      title: AnimatedOpacity(
        opacity: innerBoxIsScrolled ? 1.0 : 0.0,
        duration: const Duration(milliseconds: 200),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.20),
              ),
              child: Icon(
                roleConfig.icon,
                size: 18,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              user?.name ?? 'حسابي',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: _ProfileHeroHeader(
          userName: user?.name ?? 'مستخدم',
          roleConfig: roleConfig,
          centerDisplay: centerDisplay,
          circleDisplay: circleDisplay,
        ),
      ),
    );
  }

  // ── Body ────────────────────────────────────────────────────────────────────

  Widget _buildBody({
    required ThemeData theme,
    required dynamic user,
    required _RoleConfig roleConfig,
    required String? centerDisplay,
    required String? circleDisplay,
  }) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
      children: [
        // ── § 1 معلومات الحساب ─────────────────────────────────────────────
        const _SectionHeader(
          icon: Icons.person_pin_rounded,
          title: 'معلومات الحساب',
          iconColor: AppColors.primaryLight,
        ),
        const SizedBox(height: 10),
        _InfoCard(
          rows: [
            _InfoRow(
              icon: Icons.phone_rounded,
              iconColor: AppColors.primaryLight,
              label: 'رقم الهاتف',
              value: user?.phone?.trim().isNotEmpty == true
                  ? user!.phone!.trim()
                  : 'غير متوفر',
            ),
            if (centerDisplay != null)
              _InfoRow(
                icon: Icons.mosque_rounded,
                iconColor: AppColors.primaryLight,
                label: 'المركز',
                value: centerDisplay,
              ),
            if (circleDisplay != null)
              _InfoRow(
                icon: Icons.groups_rounded,
                iconColor: AppColors.primaryLight,
                label: 'الحلقة',
                value: circleDisplay,
              ),
            _InfoRow(
              icon: Icons.badge_rounded,
              iconColor: roleConfig.color,
              label: 'الدور',
              value: roleConfig.label,
              valueColor: roleConfig.color,
            ),
          ],
        ),

        const SizedBox(height: 28),

        // ── § 2 الإعدادات ──────────────────────────────────────────────────
        const _SectionHeader(
          icon: Icons.tune_rounded,
          title: 'الإعدادات',
          iconColor: AppColors.infoLight,
        ),
        const SizedBox(height: 10),
        _SettingsGroup(
          items: [
            _SettingsItem(
              icon: Icons.language_rounded,
              iconColor: AppColors.infoLight,
              title: 'اللغة',
              trailing: Text(
                'العربية',
                style: TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontSize: 13,
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w600,
                ),
              ),
              enabled: false,
            ),
            _SettingsItem(
              icon: Icons.notifications_rounded,
              iconColor: AppColors.warningLight,
              title: 'الإشعارات',
              trailing: const FeatureStatusChip.custom(
                label: 'لاحقًا',
                color: AppColors.warningLight,
              ),
              enabled: false,
            ),
            _SettingsItem(
              icon: Icons.dark_mode_rounded,
              iconColor: AppColors.textSecondaryLight,
              title: 'المظهر',
              trailing: const FeatureStatusChip.custom(
                label: 'لاحقًا',
                color: AppColors.warningLight,
              ),
              enabled: false,
            ),
          ],
        ),

        const SizedBox(height: 28),

        // ── § 3 الأمان والخصوصية ──────────────────────────────────────────
        _SectionHeader(
          icon: Icons.security_rounded,
          title: 'الأمان والخصوصية',
          iconColor: AppColors.successLight,
        ),
        const SizedBox(height: 10),
        _SettingsGroup(
          items: [
            _SettingsItem(
              icon: Icons.lock_reset_rounded,
              iconColor: AppColors.primaryLight,
              title: 'تغيير كلمة المرور',
              trailing: const FeatureStatusChip.custom(
                label: 'غير متاح حاليًا',
                color: AppColors.warningLight,
              ),
              enabled: false,
            ),
            _SettingsItem(
              icon: Icons.verified_user_rounded,
              iconColor: AppColors.successLight,
              title: 'سياسة الخصوصية',
              trailing: const FeatureStatusChip.custom(
                label: 'لاحقًا',
                color: AppColors.warningLight,
              ),
              enabled: false,
            ),
            _SettingsItem(
              icon: Icons.description_rounded,
              iconColor: AppColors.infoLight,
              title: 'شروط الاستخدام',
              trailing: const FeatureStatusChip.custom(
                label: 'لاحقًا',
                color: AppColors.warningLight,
              ),
              enabled: false,
            ),
          ],
        ),

        const SizedBox(height: 28),

        // ── § 4 عن التطبيق ─────────────────────────────────────────────────
        _SectionHeader(
          icon: Icons.info_outline_rounded,
          title: 'عن التطبيق',
          iconColor: AppColors.accentLight,
        ),
        const SizedBox(height: 10),
        _SettingsGroup(
          items: [
            _SettingsItem(
              icon: Icons.verified_rounded,
              iconColor: AppColors.accentLight,
              title: 'إصدار التطبيق',
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.accentLight.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'v 2.4.0',
                  style: TextStyle(
                    color: AppColors.accentLight,
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              enabled: false,
            ),
            _SettingsItem(
              icon: Icons.support_agent_rounded,
              iconColor: AppColors.infoLight,
              title: 'الدعم الفني',
              trailing: const FeatureStatusChip.custom(
                label: 'لاحقًا',
                color: AppColors.warningLight,
              ),
              enabled: false,
            ),
          ],
        ),

        const SizedBox(height: 36),

        // ── منطقة الخروج (Danger Zone) ─────────────────────────────────────
        _DangerZone(
          isLoading: _isLoggingOut,
          onLogout: _handleLogout,
        ),

        const SizedBox(height: 24),
      ],
    );
  }

  // ── Logout Logic ────────────────────────────────────────────────────────────

  Future<void> _handleLogout() async {
    final confirmed = await _showLogoutDialog();
    if (!confirmed || !mounted) return;

    setState(() => _isLoggingOut = true);

    try {
      await ref.read(contextControllerProvider.notifier).clearContext();
      await ref.read(authControllerProvider.notifier).logout();
      if (!mounted) return;
      context.go(RouteNames.login);
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoggingOut = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('حدث خطأ أثناء تسجيل الخروج. حاول مجدداً.'),
          backgroundColor: AppColors.errorLight,
        ),
      );
    }
  }

  Future<bool> _showLogoutDialog() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.errorLight.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.logout_rounded,
                color: AppColors.errorLight,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'تسجيل الخروج',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontWeight: FontWeight.w800,
                fontSize: 17,
              ),
            ),
          ],
        ),
        content: const Text(
          'هل أنت متأكد من تسجيل الخروج من حسابك؟',
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 14,
            color: AppColors.textSecondaryLight,
          ),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        actions: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    side: const BorderSide(color: AppColors.borderLight),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.errorLight,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () => Navigator.of(ctx).pop(true),
                  child: const Text(
                    'تسجيل الخروج',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    return result ?? false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _RoleConfig — إعداد بيانات الدور
// ─────────────────────────────────────────────────────────────────────────────

class _RoleConfig {
  final String label;
  final IconData icon;
  final Color color;

  const _RoleConfig({
    required this.label,
    required this.icon,
    required this.color,
  });

  factory _RoleConfig.from(String role) {
    switch (role) {
      case 'SUPERVISOR':
        return const _RoleConfig(
          label: 'مشرف',
          icon: Icons.supervisor_account_rounded,
          color: AppColors.roleSupervisor,
        );
      case 'CENTER_ADMIN':
        return const _RoleConfig(
          label: 'مدير مركز',
          icon: Icons.admin_panel_settings_rounded,
          color: AppColors.primaryLight,
        );
      case 'PARENT':
        return const _RoleConfig(
          label: 'ولي أمر',
          icon: Icons.family_restroom_rounded,
          color: AppColors.roleParent,
        );
      case 'STUDENT':
        return const _RoleConfig(
          label: 'طالب',
          icon: Icons.school_rounded,
          color: AppColors.roleStudent,
        );
      case 'SUPER_ADMIN':
        return const _RoleConfig(
          label: 'مدير عام',
          icon: Icons.manage_accounts_rounded,
          color: AppColors.primaryLight,
        );
      case 'TEACHER':
      default:
        return const _RoleConfig(
          label: 'معلم قرآن',
          icon: Icons.menu_book_rounded,
          color: AppColors.roleTeacher,
        );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _ProfileHeroHeader — رأس الصفحة التدرجي
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileHeroHeader extends StatelessWidget {
  final String userName;
  final _RoleConfig roleConfig;
  final String? centerDisplay;
  final String? circleDisplay;

  const _ProfileHeroHeader({
    required this.userName,
    required this.roleConfig,
    required this.centerDisplay,
    required this.circleDisplay,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppGradients.deepPrimary,
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 56, 20, 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // Avatar
              _AvatarWidget(roleConfig: roleConfig),

              const SizedBox(height: 14),

              // الاسم
              Text(
                userName,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 20,
                  fontFamily: 'Cairo',
                ),
              ),

              const SizedBox(height: 10),

              // pills
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [
                  _HeaderPill(
                    icon: roleConfig.icon,
                    text: roleConfig.label,
                  ),
                  if (centerDisplay != null)
                    _HeaderPill(
                      icon: Icons.mosque_rounded,
                      text: centerDisplay!,
                    ),
                  if (circleDisplay != null)
                    _HeaderPill(
                      icon: Icons.groups_rounded,
                      text: circleDisplay!,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _AvatarWidget
// ─────────────────────────────────────────────────────────────────────────────

class _AvatarWidget extends StatelessWidget {
  final _RoleConfig roleConfig;

  const _AvatarWidget({required this.roleConfig});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 88,
          height: 88,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.15),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.45),
              width: 3,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.20),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Icon(
            roleConfig.icon,
            size: 42,
            color: Colors.white.withValues(alpha: 0.92),
          ),
        ),
        // Badge دور صغير في الزاوية
        Positioned(
          bottom: -2,
          left: -2,
          child: Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: roleConfig.color,
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white,
                width: 2.5,
              ),
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Colors.white,
              size: 13,
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _HeaderPill — شريحة الرأس
// ─────────────────────────────────────────────────────────────────────────────

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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.25),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 13),
          const SizedBox(width: 5),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 12,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _SectionHeader — عنوان القسم مع خط وأيقونة
// ─────────────────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color iconColor;

  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: iconColor, size: 16),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryLight,
                fontSize: 14,
              ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Divider(
            color: AppColors.borderLight,
            thickness: 1,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _InfoCard + _InfoRow — بطاقة معلومات الحساب
// ─────────────────────────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  final List<_InfoRow> rows;

  const _InfoCard({required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.sm,
      ),
      child: Column(
        children: List.generate(rows.length, (i) {
          final row = rows[i];
          final isLast = i == rows.length - 1;
          return Column(
            children: [
              _buildRow(context, row),
              if (!isLast)
                Divider(
                  height: 1,
                  thickness: 1,
                  indent: 56,
                  color: AppColors.borderLight,
                ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildRow(BuildContext context, _InfoRow row) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: row.iconColor.withValues(alpha: 0.09),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(row.icon, color: row.iconColor, size: 18),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                row.label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondaryLight,
                  fontSize: 11,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(height: 2),
              Text(
                row.value,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: row.valueColor ?? AppColors.textPrimaryLight,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoRow {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    this.valueColor,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// _SettingsGroup + _SettingsItem — مجموعة إعدادات بنمط iOS
// ─────────────────────────────────────────────────────────────────────────────

class _SettingsGroup extends StatelessWidget {
  final List<_SettingsItem> items;

  const _SettingsGroup({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.sm,
      ),
      child: Column(
        children: List.generate(items.length, (i) {
          final item = items[i];
          final isLast = i == items.length - 1;
          return Column(
            children: [
              _buildItem(context, item),
              if (!isLast)
                Divider(
                  height: 1,
                  thickness: 1,
                  indent: 56,
                  color: AppColors.borderLight,
                ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildItem(BuildContext context, _SettingsItem item) {
    final theme = Theme.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          child: Row(
            children: [
              // أيقونة
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: item.enabled
                      ? item.iconColor.withValues(alpha: 0.10)
                      : AppColors.borderLight.withValues(alpha: 0.60),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  item.icon,
                  color: item.enabled
                      ? item.iconColor
                      : AppColors.textSecondaryLight.withValues(alpha: 0.45),
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              // عنوان
              Expanded(
                child: Text(
                  item.title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: item.enabled
                        ? AppColors.textPrimaryLight
                        : AppColors.textSecondaryLight.withValues(alpha: 0.60),
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
              // trailing
              if (item.trailing != null) ...[
                item.trailing!,
                const SizedBox(width: 6),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _SettingsItem {
  final IconData icon;
  final Color iconColor;
  final String title;
  final Widget? trailing;
  final bool enabled;

  const _SettingsItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.trailing,
    this.enabled = true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// _DangerZone — منطقة تسجيل الخروج
// ─────────────────────────────────────────────────────────────────────────────

class _DangerZone extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onLogout;

  const _DangerZone({
    required this.isLoading,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Divider with label
        Row(
          children: [
            Expanded(child: Divider(color: AppColors.errorLight.withValues(alpha: 0.25))),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'منطقة الخروج',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.errorLight.withValues(alpha: 0.70),
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Expanded(child: Divider(color: AppColors.errorLight.withValues(alpha: 0.25))),
          ],
        ),

        const SizedBox(height: 14),

        // Logout Button
        Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: isLoading ? null : onLogout,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.errorLight.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.errorLight.withValues(alpha: 0.25),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (isLoading)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: AppColors.errorLight,
                      ),
                    )
                  else
                    const Icon(
                      Icons.logout_rounded,
                      color: AppColors.errorLight,
                      size: 20,
                    ),
                  const SizedBox(width: 10),
                  Text(
                    isLoading ? 'جاري الخروج...' : 'تسجيل الخروج',
                    style: const TextStyle(
                      color: AppColors.errorLight,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
