import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// CountBadge - Used in AttendancePage summary
///
/// Layout: Large count number on top, small label below
/// Colors: success, warning, destructive, accent
enum BadgeColor {
  success,
  warning,
  destructive,
  accent,
  primary,
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

  Color _getBackgroundColor(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (color) {
      case BadgeColor.success:
        return isDark
            ? AppColors.successDark.withValues(alpha: 0.15)
            : AppColors.successLight.withValues(alpha: 0.10);
      case BadgeColor.warning:
        return isDark
            ? AppColors.warningDark.withValues(alpha: 0.15)
            : AppColors.warningLight.withValues(alpha: 0.10);
      case BadgeColor.destructive:
        return isDark
            ? AppColors.errorDark.withValues(alpha: 0.15)
            : AppColors.errorLight.withValues(alpha: 0.10);
      case BadgeColor.accent:
        return isDark
            ? AppColors.accentLight.withValues(alpha: 0.15)
            : AppColors.accentLight.withValues(alpha: 0.10);
      case BadgeColor.primary:
        return isDark
            ? AppColors.primaryDark.withValues(alpha: 0.15)
            : AppColors.primaryLight.withValues(alpha: 0.10);
    }
  }

  Color _getForegroundColor(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (color) {
      case BadgeColor.success:
        return isDark ? AppColors.successDark : AppColors.successLight;
      case BadgeColor.warning:
        return isDark ? AppColors.warningDark : AppColors.warningLight;
      case BadgeColor.destructive:
        return isDark ? AppColors.errorDark : AppColors.errorLight;
      case BadgeColor.accent:
        return isDark ? AppColors.accentLight : const Color(0xFFD97706);
      case BadgeColor.primary:
        return isDark ? AppColors.primaryDark : AppColors.primaryLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: _getBackgroundColor(context),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            count.toString(),
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 20,
                  color: _getForegroundColor(context),
                ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: _getForegroundColor(context),
                ),
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

  Color _getBackgroundColor(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (color) {
      case BadgeColor.success:
        return isDark
            ? AppColors.successDark.withValues(alpha: 0.15)
            : AppColors.successLight.withValues(alpha: 0.10);
      case BadgeColor.warning:
        return isDark
            ? AppColors.warningDark.withValues(alpha: 0.15)
            : AppColors.warningLight.withValues(alpha: 0.10);
      case BadgeColor.destructive:
        return isDark
            ? AppColors.errorDark.withValues(alpha: 0.15)
            : AppColors.errorLight.withValues(alpha: 0.10);
      case BadgeColor.accent:
        return isDark
            ? AppColors.accentLight.withValues(alpha: 0.15)
            : AppColors.accentLight.withValues(alpha: 0.10);
      case BadgeColor.primary:
        return isDark
            ? AppColors.primaryDark.withValues(alpha: 0.15)
            : AppColors.primaryLight.withValues(alpha: 0.10);
    }
  }

  Color _getForegroundColor(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (color) {
      case BadgeColor.success:
        return isDark ? AppColors.successDark : AppColors.successLight;
      case BadgeColor.warning:
        return isDark ? AppColors.warningDark : AppColors.warningLight;
      case BadgeColor.destructive:
        return isDark ? AppColors.errorDark : AppColors.errorLight;
      case BadgeColor.accent:
        return isDark ? AppColors.accentLight : const Color(0xFFD97706);
      case BadgeColor.primary:
        return isDark ? AppColors.primaryDark : AppColors.primaryLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getBackgroundColor(context),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            count.toString(),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: _getForegroundColor(context),
                ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  color: _getForegroundColor(context).withValues(alpha: 0.8),
                ),
          ),
        ],
      ),
    );
  }
}
