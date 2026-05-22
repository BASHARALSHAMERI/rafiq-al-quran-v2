import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// AchievementItem - Used in StudentHome for recent achievements
///
/// Layout: [Icon] Text + Time
/// Style: Card with left accent
class AchievementItem extends StatelessWidget {
  final IconData icon;
  final String text;
  final String time;
  final AchievementColor color;

  const AchievementItem({
    super.key,
    required this.icon,
    required this.text,
    required this.time,
    this.color = AchievementColor.primary,
  });

  Color _getColor(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (color) {
      case AchievementColor.primary:
        return isDark ? AppColors.primaryDark : AppColors.primaryLight;
      case AchievementColor.success:
        return isDark ? AppColors.successDark : AppColors.successLight;
      case AchievementColor.accent:
        return isDark ? AppColors.accentLight : const Color(0xFFD97706);
      case AchievementColor.info:
        return isDark ? AppColors.infoDark : AppColors.infoLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final resolvedColor = _getColor(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: (isDark ? AppColors.borderDark : AppColors.borderLight)
              .withValues(alpha: 0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.08 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: resolvedColor.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 16,
              color: resolvedColor,
            ),
          ),
          const SizedBox(width: 12),
          // Text + Time
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  text,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontSize: 13,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  time,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontSize: 10,
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Achievement color variants
enum AchievementColor {
  primary,
  success,
  accent,
  info,
}

/// Compact achievement item for dense lists
class AchievementItemCompact extends StatelessWidget {
  final IconData icon;
  final String text;
  final String time;
  final AchievementColor color;

  const AchievementItemCompact({
    super.key,
    required this.icon,
    required this.text,
    required this.time,
    this.color = AchievementColor.primary,
  });

  Color _getColor(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (color) {
      case AchievementColor.primary:
        return isDark ? AppColors.primaryDark : AppColors.primaryLight;
      case AchievementColor.success:
        return isDark ? AppColors.successDark : AppColors.successLight;
      case AchievementColor.accent:
        return isDark ? AppColors.accentLight : const Color(0xFFD97706);
      case AchievementColor.info:
        return isDark ? AppColors.infoDark : AppColors.infoLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final resolvedColor = _getColor(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: (isDark ? AppColors.borderDark : AppColors.borderLight)
              .withValues(alpha: 0.5),
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 14,
            color: resolvedColor,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 12,
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            time,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 10,
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
          ),
        ],
      ),
    );
  }
}
