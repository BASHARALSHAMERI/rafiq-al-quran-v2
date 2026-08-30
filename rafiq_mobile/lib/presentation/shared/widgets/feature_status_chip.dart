import 'package:flutter/material.dart';

import '../../context/role_navigation.dart';
import '../../../core/theme/app_colors.dart';

class FeatureStatusChip extends StatelessWidget {
  final FeatureAvailability? availability;
  final String? label;
  final Color? color;

  const FeatureStatusChip.availability({
    super.key,
    required this.availability,
  })  : label = null,
        color = null;

  const FeatureStatusChip.custom({
    super.key,
    required this.label,
    required this.color,
  }) : availability = null;

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    final resolved = _resolveStyle(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: resolved.color.withValues(alpha: isDark ? 0.16 : 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: resolved.color.withValues(alpha: isDark ? 0.28 : 0.18),
        ),
      ),
      child: Text(
        resolved.label,
        style: TextStyle(
          color: resolved.color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  _ChipStyle _resolveStyle(BuildContext context) {
    if (label != null && color != null) {
      return _ChipStyle(label!, color!);
    }

    final custom = context.customColors;

    return switch (availability ?? FeatureAvailability.later) {
      FeatureAvailability.available =>
        _ChipStyle('متاح', custom.success),
      FeatureAvailability.webOnly =>
        _ChipStyle('من الويب', custom.info),
      FeatureAvailability.later =>
        _ChipStyle('لاحقًا', custom.warning),
    };
  }
}

class _ChipStyle {
  final String label;
  final Color color;

  const _ChipStyle(this.label, this.color);
}
