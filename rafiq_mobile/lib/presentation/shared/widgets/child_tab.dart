import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_gradients.dart';

/// ChildTab - Used in ParentHome for switching between children
///
/// Layout: Pill-shaped button (full width in row)
/// States: Selected (gradient), Unselected (outlined)
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            gradient: isSelected ? AppGradients.primary : null,
            color: isSelected
                ? null
                : (isDark ? AppColors.cardDark : AppColors.cardLight),
            borderRadius: BorderRadius.circular(12),
            border: isSelected
                ? null
                : Border.all(
                    color:
                        (isDark ? AppColors.borderDark : AppColors.borderLight)
                            .withValues(alpha: 0.5),
                  ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primaryLight.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                      spreadRadius: -2,
                    ),
                  ]
                : [
                    BoxShadow(
                      color:
                          Colors.black.withValues(alpha: isDark ? 0.08 : 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          child: Text(
            name,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: isSelected
                      ? Colors.white
                      : (isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight),
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

/// Compact Child Tab for smaller spaces
class ChildTabCompact extends StatelessWidget {
  final String name;
  final bool isSelected;
  final VoidCallback onTap;

  const ChildTabCompact({
    super.key,
    required this.name,
    this.isSelected = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          gradient: isSelected ? AppGradients.primary : null,
          color: isSelected
              ? null
              : (isDark ? AppColors.cardDark : AppColors.cardLight),
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? null
              : Border.all(
                  color: (isDark ? AppColors.borderDark : AppColors.borderLight)
                      .withValues(alpha: 0.5),
                ),
        ),
        child: Text(
          name,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                fontSize: 12,
                color: isSelected
                    ? Colors.white
                    : (isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight),
              ),
        ),
      ),
    );
  }
}
