import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/theme/app_colors.dart';

/// Achievement color variants
enum AchievementColor {
  primary,
  success,
  accent,
  info,
}

Color _getColor(BuildContext context, AchievementColor color) {
  final custom = context.customColors;
  final isDark = context.isDark;
  switch (color) {
    case AchievementColor.primary:
      return Theme.of(context).colorScheme.primary;
    case AchievementColor.success:
      return custom.success;
    case AchievementColor.accent:
      return isDark ? AppColors.accentDark : AppColors.accentLight;
    case AchievementColor.info:
      return custom.info;
  }
}

/// AchievementItem - Used in StudentHome for recent achievements
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

  @override
  Widget build(BuildContext context) {
    final resolvedColor = _getColor(context, color);
    final isDark = context.isDark;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: resolvedColor.withValues(alpha: isDark ? 0.20 : 0.10),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(
              icon,
              size: 18,
              color: resolvedColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  text,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: context.textPrimaryColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  time,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    color: context.textSecondaryColor,
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

  @override
  Widget build(BuildContext context) {
    final resolvedColor = _getColor(context, color);
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: resolvedColor,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.bodySmall?.copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: context.textPrimaryColor,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            time,
            style: theme.textTheme.bodySmall?.copyWith(
              fontSize: 10,
              color: context.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
