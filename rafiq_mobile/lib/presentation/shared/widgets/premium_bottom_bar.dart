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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    const int homeIndex = 2;
    final bool isHomeSelected = selectedIndex == homeIndex;

    return Container(
      height: 100, // Safe height to prevent overflow
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(35),
          topRight: Radius.circular(35),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Standard Row for all items
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(items.length, (index) {
                if (index == homeIndex && isHomeSelected) {
                  return const Expanded(child: SizedBox.shrink());
                }

                final isSelected = selectedIndex == index;
                final item = items[index];

                return Expanded(
                  child: GestureDetector(
                    onTap: () => onItemSelected(index),
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(height: 8),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: isSelected && !isHomeSelected 
                                ? AppColors.primaryLight.withValues(alpha: 0.1) 
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(
                            isSelected ? item.selectedIcon : item.icon,
                            color: isSelected 
                                ? AppColors.primaryLight 
                                : AppColors.textSecondaryLight.withValues(alpha: 0.4),
                            size: 24,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          style: TextStyle(
                            color: isSelected 
                                ? AppColors.primaryLight 
                                : AppColors.textSecondaryLight.withValues(alpha: 0.4),
                            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                );
              }),
            ),

            // Special Bulging Home Button
            if (isHomeSelected)
              Positioned(
                top: -35,
                left: 0,
                right: 0,
                child: Center(
                  child: GestureDetector(
                    onTap: () => onItemSelected(homeIndex),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 74,
                          height: 74,
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryLight.withValues(alpha: 0.4),
                                blurRadius: 18,
                                offset: const Offset(0, 10),
                              )
                            ],
                            border: Border.all(
                              color: isDark ? AppColors.cardDark : Colors.white,
                              width: 6,
                            ),
                          ),
                          child: Center(
                            child: Icon(
                              items[homeIndex].selectedIcon,
                              color: Colors.white,
                              size: 34,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          items[homeIndex].label,
                          style: const TextStyle(
                            color: AppColors.primaryLight,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
