import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/theme/app_colors.dart';

/// Simple assignment data class
class AssignmentItem {
  final String title;
  final String content;

  const AssignmentItem({
    required this.title,
    required this.content,
  });
}

/// TodayAssignmentCard - Used in StudentHome
class TodayAssignmentCard extends StatelessWidget {
  final AssignmentItem hifz;
  final AssignmentItem review;
  final double progress; // 0.0 to 1.0

  const TodayAssignmentCard({
    super.key,
    required this.hifz,
    required this.review,
    this.progress = 0.0,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final custom = context.customColors;
    final primary = theme.colorScheme.primary;
    final info = custom.info;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Hifz assignment
          _buildAssignmentRow(
            context,
            icon: Icons.menu_book_rounded,
            iconColor: primary,
            title: hifz.title,
            content: hifz.content,
          ),
          const SizedBox(height: 14),
          // Review assignment
          _buildAssignmentRow(
            context,
            icon: Icons.bookmark_outline_rounded,
            iconColor: info,
            title: review.title,
            content: review.content,
          ),
          const SizedBox(height: 16),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              backgroundColor: context.borderColor,
              valueColor: AlwaysStoppedAnimation<Color>(primary),
              minHeight: 7,
            ),
          ),
          const SizedBox(height: 8),
          // Progress text
          Text(
            '${(progress * 100).toInt()}% مكتمل',
            style: theme.textTheme.bodySmall?.copyWith(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: context.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignmentRow(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String content,
  }) {
    final isDark = context.isDark;
    final theme = Theme.of(context);

    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: isDark ? 0.18 : 0.10),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Icon(
            icon,
            size: 18,
            color: iconColor,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: context.textPrimaryColor,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                content,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  color: context.textSecondaryColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Compact version with only one assignment
class AssignmentCardCompact extends StatelessWidget {
  final IconData icon;
  final String title;
  final String content;
  final Color? iconColor;
  final double progress;

  const AssignmentCardCompact({
    super.key,
    required this.icon,
    required this.title,
    required this.content,
    this.iconColor,
    this.progress = 0.0,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = context.isDark;
    final color = iconColor ?? theme.colorScheme.primary;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: isDark ? 0.18 : 0.10),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(
                  icon,
                  size: 16,
                  color: color,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: context.textPrimaryColor,
                      ),
                    ),
                    Text(
                      content,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontSize: 11,
                        color: context.textSecondaryColor,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (progress > 0) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                backgroundColor: context.borderColor,
                valueColor: AlwaysStoppedAnimation<Color>(color),
                minHeight: 6,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
