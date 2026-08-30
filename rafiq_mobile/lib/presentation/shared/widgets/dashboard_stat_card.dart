import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_shadows.dart';

/// StatCard component for Dashboard overview
enum StatColor {
  primary,
  success,
  warning,
  destructive,
  info,
  accent,
}

Color _resolveStatColor(BuildContext context, StatColor color) {
  final custom = context.customColors;
  final isDark = context.isDark;
  switch (color) {
    case StatColor.primary:
      return Theme.of(context).colorScheme.primary;
    case StatColor.success:
      return custom.success;
    case StatColor.warning:
      return custom.warning;
    case StatColor.destructive:
      return isDark ? AppColors.errorDark : AppColors.errorLight;
    case StatColor.info:
      return custom.info;
    case StatColor.accent:
      return isDark ? AppColors.accentDark : AppColors.accentLight;
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
    final isDark = context.isDark;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
        boxShadow: isDark ? null : AppShadows.xs,
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: resolvedColor.withValues(alpha: isDark ? 0.18 : 0.10),
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(
                color: resolvedColor.withValues(alpha: isDark ? 0.28 : 0.16),
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
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    fontSize: 22,
                    color: context.textPrimaryColor,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: context.textSecondaryColor,
                    fontSize: 12,
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
    final isDark = context.isDark;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
        boxShadow: isDark ? null : AppShadows.xs,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: resolvedColor.withValues(alpha: isDark ? 0.18 : 0.10),
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(
                color: resolvedColor.withValues(alpha: isDark ? 0.28 : 0.16),
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
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
              fontSize: 19,
              color: context.textPrimaryColor,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: context.textSecondaryColor,
              fontSize: 11,
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
    final isDark = context.isDark;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
        boxShadow: isDark ? null : AppShadows.xs,
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
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                    color: context.textPrimaryColor,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: context.textSecondaryColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: resolvedColor.withValues(alpha: isDark ? 0.20 : 0.10),
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
