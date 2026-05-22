import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_shadows.dart';

class EnterpriseCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;
  final double radius;
  final double? width;
  final double? height;
  final Clip clipBehavior;
  final List<BoxShadow>? boxShadow;
  final Color? accentColor;

  const EnterpriseCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.onTap,
    this.color,
    this.borderColor,
    this.radius = AppRadius.lg,
    this.width,
    this.height,
    this.clipBehavior = Clip.antiAlias,
    this.boxShadow,
    this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final resolvedBorderColor =
        borderColor ?? theme.colorScheme.outline.withValues(alpha: 0.14);
    final resolvedColor = color ?? theme.cardColor;
    final resolvedShadow = boxShadow ?? AppShadows.xs;
    final borderRadius = BorderRadius.circular(radius);

    Widget content = Padding(
      padding: padding,
      child: child,
    );

    if (onTap != null) {
      content = InkWell(
        onTap: onTap,
        child: content,
      );
    }

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: resolvedColor,
        borderRadius: borderRadius,
        border: Border.all(color: resolvedBorderColor),
        boxShadow: resolvedShadow,
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        clipBehavior: clipBehavior,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: accentColor == null
                ? null
                : Border(
                    right: BorderSide(
                      color: accentColor!,
                      width: 3,
                    ),
                  ),
          ),
          child: Material(
            color: Colors.transparent,
            child: content,
          ),
        ),
      ),
    );
  }
}
