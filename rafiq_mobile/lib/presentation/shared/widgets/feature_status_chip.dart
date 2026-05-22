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
    final resolved = _resolveStyle();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: resolved.color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: resolved.color.withValues(alpha: 0.18)),
      ),
      child: Text(
        resolved.label,
        style: TextStyle(
          color: resolved.color,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  _ChipStyle _resolveStyle() {
    if (label != null && color != null) {
      return _ChipStyle(label!, color!);
    }

    return switch (availability ?? FeatureAvailability.later) {
      FeatureAvailability.available =>
        const _ChipStyle('متاح', AppColors.successLight),
      FeatureAvailability.webOnly =>
        const _ChipStyle('من الويب', AppColors.infoLight),
      FeatureAvailability.later =>
        const _ChipStyle('لاحقًا', AppColors.warningLight),
    };
  }
}

class _ChipStyle {
  final String label;
  final Color color;

  const _ChipStyle(this.label, this.color);
}
