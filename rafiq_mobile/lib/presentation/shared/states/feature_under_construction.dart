import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../widgets/enterprise_card.dart';
import '../widgets/primary_button.dart';

class FeatureUnderConstruction extends StatelessWidget {
  final String title;
  final String description;
  final bool compact;
  final String? actionLabel;
  final VoidCallback? onAction;

  const FeatureUnderConstruction({
    super.key,
    required this.title,
    required this.description,
    this.compact = false,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final content = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment:
          compact ? CrossAxisAlignment.start : CrossAxisAlignment.center,
      children: [
        Container(
          width: compact ? 44 : 64,
          height: compact ? 44 : 64,
          decoration: BoxDecoration(
            color: AppColors.primaryLight.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(compact ? 14 : 20),
          ),
          child: const Icon(
            Icons.construction_rounded,
            color: AppColors.primaryLight,
          ),
        ),
        SizedBox(height: compact ? AppSpacing.sm : AppSpacing.lg),
        Text(
          title,
          textAlign: compact ? TextAlign.start : TextAlign.center,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          description,
          textAlign: compact ? TextAlign.start : TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondaryLight,
            height: 1.5,
          ),
        ),
        if (actionLabel != null && onAction != null) ...[
          const SizedBox(height: AppSpacing.lg),
          PrimaryButton(
            label: actionLabel!,
            onPressed: onAction,
            icon: Icons.arrow_forward_rounded,
            isFullWidth: !compact,
          ),
        ],
      ],
    );

    if (compact) {
      return EnterpriseCard(
        child: content,
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: content,
      ),
    );
  }
}
