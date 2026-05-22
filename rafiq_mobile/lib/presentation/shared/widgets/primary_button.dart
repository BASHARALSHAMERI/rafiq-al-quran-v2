import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_shadows.dart';

class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isFullWidth;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double height;

  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = true,
    this.backgroundColor,
    this.foregroundColor,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedBackground = backgroundColor ?? AppColors.primaryLight;
    final resolvedForeground = foregroundColor ?? Colors.white;

    final button = FilledButton.icon(
      onPressed: isLoading ? null : onPressed,
      icon: isLoading
          ? SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                color: resolvedForeground,
              ),
            )
          : Icon(icon ?? Icons.arrow_forward_rounded, size: 18),
      label: Text(label),
      style: FilledButton.styleFrom(
        backgroundColor: resolvedBackground,
        foregroundColor: resolvedForeground,
        disabledBackgroundColor: resolvedBackground.withValues(alpha: 0.55),
        disabledForegroundColor: resolvedForeground.withValues(alpha: 0.9),
        minimumSize: Size(isFullWidth ? double.infinity : 0, height),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        textStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
        ),
        elevation: 0,
        shadowColor: Colors.transparent,
      ),
    );

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 180),
      opacity: onPressed == null && !isLoading ? 0.7 : 1,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: onPressed == null && !isLoading
              ? null
              : [
                  ...AppShadows.primaryGlow.map((shadow) => shadow.copyWith(
                      color: resolvedBackground.withValues(alpha: 0.18))),
                ],
        ),
        child: button,
      ),
    );
  }
}
