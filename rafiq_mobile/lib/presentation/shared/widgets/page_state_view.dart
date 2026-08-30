import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import 'primary_button.dart';

class PageStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final _PageStateVariant _variant;

  const PageStateView({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  }) : _variant = _PageStateVariant.generic;

  const PageStateView.empty({
    super.key,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  })  : icon = Icons.inbox_outlined,
        _variant = _PageStateVariant.empty;

  const PageStateView.error({
    super.key,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  })  : icon = Icons.error_outline_rounded,
        _variant = _PageStateVariant.error;

  const PageStateView.loading({
    super.key,
    this.title = 'جارٍ تحميل البيانات',
    this.message = 'يرجى الانتظار أثناء تجهيز المحتوى.',
  })  : icon = Icons.hourglass_top_rounded,
        _variant = _PageStateVariant.loading,
        actionLabel = null,
        onAction = null;

  Color _iconColor(BuildContext context) {
    final isDark = context.isDark;
    return switch (_variant) {
      _PageStateVariant.error => isDark ? AppColors.errorDark : AppColors.errorLight,
      _PageStateVariant.empty => context.textSecondaryColor,
      _ => Theme.of(context).colorScheme.primary,
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = context.isDark;
    final iconColor = _iconColor(context);

    if (_variant == _PageStateVariant.loading) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: context.textPrimaryColor,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                message,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: context.textSecondaryColor,
                ),
              ),
            ],
          ),
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
                color: iconColor.withValues(alpha: isDark ? 0.18 : 0.08),
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(
                  color: iconColor.withValues(alpha: isDark ? 0.25 : 0.15),
                ),
              ),
              child: Icon(
                icon,
                size: 36,
                color: iconColor,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: context.textPrimaryColor,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: context.textSecondaryColor,
              ),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppSpacing.lg),
              PrimaryButton(
                label: actionLabel!,
                onPressed: onAction,
                icon: Icons.refresh_rounded,
                isFullWidth: false,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

enum _PageStateVariant { generic, empty, error, loading }
