import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';

class SecondaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isFullWidth;
  final Color? color;

  const SecondaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = true,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? AppColors.primaryLight;

    final defaultStyle = OutlinedButton.styleFrom(
      foregroundColor: effectiveColor,
      side: BorderSide(color: effectiveColor),
      minimumSize: isFullWidth ? const Size.fromHeight(52) : const Size(0, 52),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md), // 12px
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
    );

    if (isLoading) {
      return OutlinedButton(
        onPressed: null,
        style: defaultStyle,
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: effectiveColor,
          ),
        ),
      );
    }

    if (icon != null) {
      return OutlinedButton.icon(
        onPressed: onPressed,
        style: defaultStyle,
        icon: Icon(icon, size: 20),
        label: Text(label),
      );
    }

    return OutlinedButton(
      onPressed: onPressed,
      style: defaultStyle,
      child: Text(label),
    );
  }
}
