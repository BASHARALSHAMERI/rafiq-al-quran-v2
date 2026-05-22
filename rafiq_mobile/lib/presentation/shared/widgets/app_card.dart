import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import 'enterprise_card.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final Border? border;
  final double? width;
  final double? height;

  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.onTap,
    this.color,
    this.border,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      width: width,
      height: height,
      color: color,
      borderColor: border?.top.color,
      padding: padding,
      onTap: onTap,
      child: child,
    );
  }
}
