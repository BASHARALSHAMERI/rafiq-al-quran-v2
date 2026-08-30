import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_gradients.dart';

enum QuickActionVariant {
  primary,
  secondary,
}

class QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final QuickActionVariant variant;

  const QuickActionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.onTap,
    this.variant = QuickActionVariant.secondary,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = context.isDark;
    final isPrimary = variant == QuickActionVariant.primary;
    final foregroundColor = isPrimary
        ? Colors.white
        : theme.colorScheme.primary;
    final backgroundColor = isPrimary ? null : context.cardColor;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
          decoration: BoxDecoration(
            gradient: isPrimary ? AppGradients.primary : null,
            color: backgroundColor,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: isPrimary ? null : Border.all(color: context.borderColor),
            boxShadow: isPrimary
                ? [
                    BoxShadow(
                      color: theme.colorScheme.primary.withValues(alpha: 0.25),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    )
                  ]
                : (isDark ? null : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isPrimary
                      ? Colors.white.withValues(alpha: 0.20)
                      : foregroundColor.withValues(alpha: isDark ? 0.18 : 0.10),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: foregroundColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  height: 1.2,
                  color: isPrimary ? Colors.white : context.textPrimaryColor,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Compact version for 4-column grids
class QuickActionCardSmall extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final QuickActionVariant variant;

  const QuickActionCardSmall({
    super.key,
    required this.icon,
    required this.title,
    required this.onTap,
    this.variant = QuickActionVariant.secondary,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = context.isDark;
    final isPrimary = variant == QuickActionVariant.primary;
    final foregroundColor = isPrimary
        ? Colors.white
        : theme.colorScheme.primary;
    final backgroundColor = isPrimary ? null : context.cardColor;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Ink(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
          decoration: BoxDecoration(
            gradient: isPrimary ? AppGradients.primary : null,
            color: backgroundColor,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: isPrimary ? null : Border.all(color: context.borderColor),
            boxShadow: isPrimary
                ? [
                    BoxShadow(
                      color: theme.colorScheme.primary.withValues(alpha: 0.22),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    )
                  ]
                : (isDark ? null : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isPrimary
                      ? Colors.white.withValues(alpha: 0.20)
                      : foregroundColor.withValues(alpha: isDark ? 0.18 : 0.10),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 16,
                  color: foregroundColor,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                  height: 1.2,
                  color: isPrimary ? Colors.white : context.textPrimaryColor,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
