import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/constants/app_spacing.dart';

class SecondaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isFullWidth;
  final Color? color;
  final double height;

  const SecondaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = true,
    this.color,
    this.height = 50,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectiveColor = color ?? theme.colorScheme.primary;

    final defaultStyle = OutlinedButton.styleFrom(
      foregroundColor: effectiveColor,
      side: BorderSide(color: effectiveColor.withValues(alpha: 0.8), width: 1.2),
      minimumSize: Size(isFullWidth ? double.infinity : 0, height),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      textStyle: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
    );

    if (isLoading) {
      return OutlinedButton(
        onPressed: null,
        style: defaultStyle,
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2.2,
            color: effectiveColor,
          ),
        ),
      );
    }

    if (icon != null) {
      return OutlinedButton.icon(
        onPressed: onPressed,
        style: defaultStyle,
        icon: Icon(icon, size: 18),
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
