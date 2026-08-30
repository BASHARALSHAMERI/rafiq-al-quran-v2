import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/constants/app_radius.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_shadows.dart';

/// بطاقة Glassmorphism — تأثير الزجاج المثلج
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final Color? tintColor;
  final double blurSigma;
  final double backgroundOpacity;
  final List<BoxShadow>? shadows;
  final bool showBorder;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius,
    this.tintColor,
    this.blurSigma = 16,
    this.backgroundOpacity = 0.10,
    this.shadows,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    final radius = borderRadius ?? BorderRadius.circular(AppRadius.lg);
    final baseColor = tintColor ??
        (isDark ? Colors.white : Theme.of(context).colorScheme.primary);
    final bgColor = isDark
        ? context.cardColor.withValues(alpha: 0.75)
        : Colors.white.withValues(alpha: 0.75);

    return Container(
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: shadows ?? (isDark ? null : AppShadows.sm),
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: Container(
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: radius,
              border: showBorder
                  ? Border.all(
                      color: baseColor.withValues(alpha: isDark ? 0.20 : 0.12),
                      width: 1,
                    )
                  : null,
            ),
            padding: padding ?? const EdgeInsets.all(16),
            child: child,
          ),
        ),
      ),
    );
  }
}
