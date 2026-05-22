import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import 'primary_button.dart';

class PageStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const PageStateView({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  const PageStateView.empty({
    super.key,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  }) : icon = Icons.inbox_outlined;

  const PageStateView.error({
    super.key,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  }) : icon = Icons.error_outline_rounded;

  const PageStateView.loading({
    super.key,
    this.title = 'جارٍ تحميل البيانات',
    this.message = 'يرجى الانتظار أثناء تجهيز المحتوى.',
  })  : icon = Icons.hourglass_top_rounded,
        actionLabel = null,
        onAction = null;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final isLoading = actionLabel == null &&
        onAction == null &&
        icon == Icons.hourglass_top_rounded;

    if (isLoading) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 12),
            Text(title, style: theme.textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(message, style: theme.textTheme.bodyMedium),
          ],
        ),
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                icon,
                size: 36,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondaryLight,
              ),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppSpacing.lg),
              PrimaryButton(
                label: actionLabel!,
                onPressed: onAction,
                icon: Icons.refresh_rounded,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
