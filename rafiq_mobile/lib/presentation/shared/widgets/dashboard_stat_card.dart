import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_shadows.dart';

/// StatCard component matching quran-companions design
///
/// Layout: Icon (square) | Value (large) + Label (small)
/// Used in: TeacherHome, SupervisorHome grids
enum StatColor {
  primary,
  success,
  warning,
  destructive,
  info,
  accent,
}

Color _resolveStatColor(BuildContext context, StatColor color) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  switch (color) {
    case StatColor.primary:
      return isDark ? AppColors.primaryDark : AppColors.primaryLight;
    case StatColor.success:
      return isDark ? AppColors.successDark : AppColors.successLight;
    case StatColor.warning:
      return isDark ? AppColors.warningDark : AppColors.warningLight;
    case StatColor.destructive:
      return isDark ? AppColors.errorDark : AppColors.errorLight;
    case StatColor.info:
      return isDark ? AppColors.infoDark : AppColors.infoLight;
    case StatColor.accent:
      return isDark ? AppColors.accentLight : AppColors.accentLight;
  }
}

class DashboardStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final StatColor color;

  const DashboardStatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color = StatColor.primary,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedColor = _resolveStatColor(context, color);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: (isDark ? AppColors.borderDark : AppColors.borderLight)
              .withValues(alpha: 0.65),
        ),
        boxShadow: isDark ? AppShadows.xs : AppShadows.sm,
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: resolvedColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: resolvedColor.withValues(alpha: 0.14),
              ),
            ),
            child: Icon(
              icon,
              size: 22,
              color: resolvedColor,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 22,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                        height: 1,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Simplified version for grid layouts (3 columns)
class DashboardStatCardCompact extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final StatColor color;

  const DashboardStatCardCompact({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color = StatColor.primary,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedColor = _resolveStatColor(context, color);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: (isDark ? AppColors.borderDark : AppColors.borderLight)
              .withValues(alpha: 0.65),
        ),
        boxShadow: isDark ? AppShadows.xs : AppShadows.sm,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: resolvedColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: resolvedColor.withValues(alpha: 0.14),
              ),
            ),
            child: Icon(
              icon,
              size: 18,
              color: resolvedColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 19,
                  color: isDark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight,
                  height: 1,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// Variant for teacher dashboard with side icon and large value
class DashboardStatCardTeacher extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final StatColor color;

  const DashboardStatCardTeacher({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color = StatColor.primary,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedColor = _resolveStatColor(context, color);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                        fontSize: 20,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                        height: 1,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: resolvedColor.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 18,
              color: resolvedColor,
            ),
          ),
        ],
      ),
    );
  }
}
