import 'dart:ui';
import 'package:flutter/material.dart';
import '../../context/role_navigation.dart';
import '../../../core/theme/app_colors.dart';

class PremiumBottomBar extends StatelessWidget {
  final List<PremiumBottomBarItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;

  const PremiumBottomBar({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const SizedBox.shrink();
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final safeSelectedIndex =
        selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0;

    // Harmonious colors tailored for Noor Theme
    final backgroundColor = isDark
        ? const Color(0xFF131815).withValues(alpha: 0.76)
        : Colors.white.withValues(alpha: 0.76);
    final borderColor = isDark
        ? Colors.white.withValues(alpha: 0.08)
        : Colors.black.withValues(alpha: 0.06);

    // Calculate dynamic safe area bottom padding to prevent overflow on notched screens
    final double bottomPadding = MediaQuery.of(context).padding.bottom;
    final double totalHeight = 66.0 + bottomPadding;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18.0, sigmaY: 18.0),
        child: Container(
          height: totalHeight,
          padding: EdgeInsets.only(bottom: bottomPadding),
          decoration: BoxDecoration(
            color: backgroundColor,
            border: Border(
              top: BorderSide(color: borderColor, width: 1.2),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (index) {
              final isSelected = safeSelectedIndex == index;
              final item = items[index];

              return Expanded(
                child: GestureDetector(
                  onTap: () => onItemSelected(index),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOutQuint,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primaryLight.withValues(alpha: 0.12)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          isSelected ? item.selectedIcon : item.icon,
                          color: isSelected
                              ? AppColors.primaryLight
                              : AppColors.textSecondaryLight
                                  .withValues(alpha: 0.45),
                          size: 24,
                        ),
                      ),
                      const SizedBox(height: 3),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: isSelected
                              ? AppColors.primaryLight
                              : AppColors.textSecondaryLight
                                  .withValues(alpha: 0.5),
                          fontWeight:
                              isSelected ? FontWeight.w900 : FontWeight.w600,
                          fontSize: 10,
                        ),
                        child: Text(item.label),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
