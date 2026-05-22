import 'package:flutter/material.dart';
import '../role_navigation.dart';
import '../../shared/widgets/premium_bottom_bar.dart';

class RoleShellScaffold extends StatelessWidget {
  final Widget child;
  final List<RoleNavigationItem> items;
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;

  const RoleShellScaffold({
    super.key,
    required this.child,
    required this.items,
    required this.selectedIndex,
    required this.onDestinationSelected,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation:
          floatingActionButtonLocation ?? FloatingActionButtonLocation.endFloat,
      bottomNavigationBar: PremiumBottomBar(
        selectedIndex: selectedIndex,
        onItemSelected: onDestinationSelected,
        items: items
            .map(
              (item) => PremiumBottomBarItem(
                label: item.label,
                icon: item.icon,
                selectedIcon: item.selectedIcon,
              ),
            )
            .toList(),
      ),
    );
  }
}
