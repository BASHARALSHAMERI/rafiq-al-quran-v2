import 'package:flutter/material.dart';

import '../../../../core/constants/app_spacing.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../domain/entities/student_profile.dart';
import '../../../shared/widgets/app_card.dart';

class StudentProfileHeaderSliver extends StatelessWidget {
  final StudentProfile profile;
  final VoidCallback onBack;
  final VoidCallback onRefresh;
  final bool showAttendanceAction;
  final VoidCallback? onAttendanceTap;

  const StudentProfileHeaderSliver({
    super.key,
    required this.profile,
    required this.onBack,
    required this.onRefresh,
    required this.showAttendanceAction,
    this.onAttendanceTap,
  });

  @override
  Widget build(BuildContext context) {
    final status =
        profile.attendancePercentage >= 75 ? 'منتظم' : 'يحتاج متابعة';

    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      elevation: 0,
      backgroundColor: AppColors.primaryLight,
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.arrow_forward_rounded,
            color: Colors.white,
            size: 20,
          ),
        ),
        onPressed: onBack,
      ),
      actions: [
        if (showAttendanceAction)
          Padding(
            padding: const EdgeInsets.only(left: 4, top: 8, bottom: 8),
            child: TextButton.icon(
              onPressed: onAttendanceTap,
              style: TextButton.styleFrom(
                backgroundColor: Colors.white.withValues(alpha: 0.18),
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              icon: const Icon(Icons.fact_check_rounded, size: 15),
              label: const Text(
                'حضور',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ),
          )
        else
          const SizedBox.shrink(),
        IconButton(
          icon: Icon(
            Icons.refresh_rounded,
            color: Colors.white.withValues(alpha: 0.9),
          ),
          onPressed: onRefresh,
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(gradient: AppGradients.deepPrimary),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 40, 20, 0),
              child: Column(
                children: [
                  Stack(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.15),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.4),
                            width: 3,
                          ),
                          image: profile.avatarUrl != null
                              ? DecorationImage(
                                  image: NetworkImage(profile.avatarUrl!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: profile.avatarUrl == null
                            ? Center(
                                child: Text(
                                  profile.fullName.trim().isNotEmpty
                                      ? profile.fullName.trim()[0]
                                      : 'ط',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 30,
                                  ),
                                ),
                              )
                            : null,
                      ),
                      Positioned(
                        bottom: 2,
                        right: 4,
                        child: Container(
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            color: profile.attendancePercentage >= 75
                                ? AppColors.successLight
                                : AppColors.warningLight,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2.5),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    profile.fullName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _HeroBadge(
                        label: profile.level ?? 'غير محدد',
                        icon: Icons.layers_rounded,
                      ),
                      const SizedBox(width: 10),
                      _HeroBadge(
                        label: status,
                        icon: profile.attendancePercentage >= 75
                            ? Icons.check_circle_rounded
                            : Icons.warning_rounded,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class StudentProfileStatsSliver extends StatelessWidget {
  final String primaryMetricLabel;
  final String primaryMetricValue;
  final String attendanceText;
  final String memorizedText;

  const StudentProfileStatsSliver({
    super.key,
    required this.primaryMetricLabel,
    required this.primaryMetricValue,
    required this.attendanceText,
    required this.memorizedText,
  });

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          0,
        ),
        child: Row(
          children: [
            Expanded(
              child: _StatCard(
                icon: Icons.star_rounded,
                label: primaryMetricLabel,
                value: primaryMetricValue,
                color: AppColors.secondaryLight,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _StatCard(
                icon: Icons.calendar_today_rounded,
                label: 'الحضور',
                value: attendanceText,
                color: AppColors.infoLight,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _StatCard(
                icon: Icons.menu_book_rounded,
                label: 'المحفوظ',
                value: memorizedText,
                color: AppColors.primaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class StudentProfileFollowUpActionBar extends StatelessWidget {
  final TabController controller;
  final bool showAction;
  final VoidCallback? onPressed;

  const StudentProfileFollowUpActionBar({
    super.key,
    required this.controller,
    required this.showAction,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    if (!showAction) {
      return const SizedBox.shrink();
    }

    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          final isFollowUpTab = controller.index == 0;
          return AnimatedSlide(
            offset: isFollowUpTab ? Offset.zero : const Offset(0, 2),
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            child: AnimatedOpacity(
              opacity: isFollowUpTab ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 200),
              child: FilledButton.icon(
                onPressed: isFollowUpTab ? onPressed : null,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primaryLight,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 6,
                  shadowColor: AppColors.primaryLight.withValues(alpha: 0.35),
                ),
                icon: const Icon(Icons.auto_stories_rounded, size: 20),
                label: const Text(
                  'تسجيل جلسة اليوم',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class StudentProfileErrorState extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;

  const StudentProfileErrorState({
    super.key,
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.errorLight.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: AppColors.errorLight,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'تعذر تحميل ملف الطالب',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondaryLight,
              ),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRetry,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primaryLight,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroBadge extends StatelessWidget {
  final String label;
  final IconData icon;

  const _HeroBadge({
    required this.label,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.95),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 16,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ],
      ),
    );
  }
}
