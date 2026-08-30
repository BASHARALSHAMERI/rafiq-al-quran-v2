import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/theme/app_colors.dart';

/// CountBadge - Used in AttendancePage summary
enum BadgeColor {
  success,
  warning,
  destructive,
  accent,
  primary,
  info,
}

class CountBadge extends StatelessWidget {
  final int count;
  final String label;
  final BadgeColor color;

  const CountBadge({
    super.key,
    required this.count,
    required this.label,
    this.color = BadgeColor.primary,
  });

  Color _getForegroundColor(BuildContext context) {
    final custom = context.customColors;
    final isDark = context.isDark;
    switch (color) {
      case BadgeColor.success:
        return custom.success;
      case BadgeColor.warning:
        return custom.warning;
      case BadgeColor.destructive:
        return isDark ? AppColors.errorDark : AppColors.errorLight;
      case BadgeColor.accent:
        return isDark ? AppColors.accentDark : AppColors.accentLight;
      case BadgeColor.primary:
        return Theme.of(context).colorScheme.primary;
      case BadgeColor.info:
        return custom.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    final fg = _getForegroundColor(context);
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: fg.withValues(alpha: isDark ? 0.16 : 0.08),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(
          color: fg.withValues(alpha: isDark ? 0.25 : 0.15),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            count.toString(),
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
              fontSize: 20,
              color: fg,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: fg.withValues(alpha: 0.9),
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// Horizontal version for inline displays
class CountBadgeHorizontal extends StatelessWidget {
  final int count;
  final String label;
  final BadgeColor color;

  const CountBadgeHorizontal({
    super.key,
    required this.count,
    required this.label,
    this.color = BadgeColor.primary,
  });

  Color _getForegroundColor(BuildContext context) {
    final custom = context.customColors;
    final isDark = context.isDark;
    switch (color) {
      case BadgeColor.success:
        return custom.success;
      case BadgeColor.warning:
        return custom.warning;
      case BadgeColor.destructive:
        return isDark ? AppColors.errorDark : AppColors.errorLight;
      case BadgeColor.accent:
        return isDark ? AppColors.accentDark : AppColors.accentLight;
      case BadgeColor.primary:
        return Theme.of(context).colorScheme.primary;
      case BadgeColor.info:
        return custom.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    final fg = _getForegroundColor(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: fg.withValues(alpha: isDark ? 0.16 : 0.08),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: fg.withValues(alpha: isDark ? 0.25 : 0.15),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            count.toString(),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: fg,
                ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: fg.withValues(alpha: 0.85),
                ),
          ),
        ],
      ),
    );
  }
}
