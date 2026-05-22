import 'dart:ui';
import 'package:flutter/material.dart';
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = borderRadius ?? BorderRadius.circular(20);
    final baseColor = tintColor ??
        (isDark ? const Color(0xFFFFFFFF) : const Color(0xFF166534));
    final bgColor = isDark
        ? const Color(0xFF1B2129).withValues(alpha: 0.70)
        : Colors.white.withValues(alpha: 0.70);

    return Container(
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: shadows ?? AppShadows.md,
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
                      color: baseColor.withValues(alpha: 0.15),
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
