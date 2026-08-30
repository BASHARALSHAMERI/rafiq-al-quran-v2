import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_gradients.dart';

/// ChildTab - Used in ParentHome for switching between children
class ChildTab extends StatelessWidget {
  final String name;
  final bool isSelected;
  final VoidCallback onTap;

  const ChildTab({
    super.key,
    required this.name,
    this.isSelected = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = context.isDark;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            gradient: isSelected ? AppGradients.primary : null,
            color: isSelected ? null : context.cardColor,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: isSelected ? null : Border.all(color: context.borderColor),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: theme.colorScheme.primary.withValues(alpha: 0.28),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : (isDark
                    ? null
                    : [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ]),
          ),
          child: Text(
            name,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: isSelected ? Colors.white : context.textPrimaryColor,
            ),
          ),
        ),
      ),
    );
  }
}

/// ChildTabBar - Row of ChildTabs with spacing
class ChildTabBar extends StatelessWidget {
  final List<String> childrenNames;
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  const ChildTabBar({
    super.key,
    required this.childrenNames,
    required this.selectedIndex,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: childrenNames.asMap().entries.map((entry) {
        final index = entry.key;
        final name = entry.value;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              left: index > 0 ? 8 : 0,
            ),
            child: ChildTab(
              name: name,
              isSelected: index == selectedIndex,
              onTap: () => onSelect(index),
            ),
          ),
        );
      }).toList(),
    );
  }
}
