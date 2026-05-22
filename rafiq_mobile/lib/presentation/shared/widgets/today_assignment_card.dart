import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// TodayAssignmentCard - Used in StudentHome
///
/// Layout:
/// - Hifz assignment (icon + title + content)
/// - Review assignment (icon + title + content)
/// - Progress bar
/// - Progress percentage
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: (isDark ? AppColors.borderDark : AppColors.borderLight)
              .withValues(alpha: 0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.08 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Hifz assignment
          _buildAssignmentRow(
            context,
            icon: Icons.menu_book,
            iconColor: isDark ? AppColors.primaryDark : AppColors.primaryLight,
            iconBgColor:
                (isDark ? AppColors.primaryDark : AppColors.primaryLight)
                    .withValues(alpha: 0.10),
            title: hifz.title,
            content: hifz.content,
          ),
          const SizedBox(height: 14),
          // Review assignment
          _buildAssignmentRow(
            context,
            icon: Icons.star,
            iconColor: isDark ? AppColors.infoDark : AppColors.infoLight,
            iconBgColor: (isDark ? AppColors.infoDark : AppColors.infoLight)
                .withValues(alpha: 0.10),
            title: review.title,
            content: review.content,
          ),
          const SizedBox(height: 16),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              backgroundColor: isDark
                  ? AppColors.borderDark
                  : AppColors.borderLight.withValues(alpha: 0.5),
              valueColor: AlwaysStoppedAnimation<Color>(
                isDark ? AppColors.primaryDark : AppColors.primaryLight,
              ),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 8),
          // Progress text
          Text(
            '${(progress * 100).toInt()}% مكتمل',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
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
    required Color iconBgColor,
    required String title,
    required String content,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      children: [
        // Icon container
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: iconBgColor,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            icon,
            size: 18,
            color: iconColor,
          ),
        ),
        const SizedBox(width: 12),
        // Title + Content
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                content,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontSize: 11,
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
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

/// Simple assignment data class
class AssignmentItem {
  final String title;
  final String content;

  const AssignmentItem({
    required this.title,
    required this.content,
  });
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color =
        iconColor ?? (isDark ? AppColors.primaryDark : AppColors.primaryLight);

    return Container(
      padding: const EdgeInsets.all(14),
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
                  color: color.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(8),
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
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: isDark
                                ? AppColors.textPrimaryDark
                                : AppColors.textPrimaryLight,
                          ),
                    ),
                    Text(
                      content,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontSize: 11,
                            color: isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight,
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
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                backgroundColor: isDark
                    ? AppColors.borderDark
                    : AppColors.borderLight.withValues(alpha: 0.5),
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
