import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_controller.dart';
import 'role_navigation.dart';
import 'scaffolds/role_shell_scaffold.dart';

class RoleBasedShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const RoleBasedShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final role = authState.user?.role.toUpperCase() ?? 'TEACHER';
    final items = navigationItemsForRole(role);
    final location = GoRouterState.of(context).matchedLocation;
    final selectedIndex = navigationIndexForLocation(items, location);

    return RoleShellScaffold(
      items: items,
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) => _navigateTo(context, items[index]),
      child: navigationShell,
    );
  }

  void _navigateTo(BuildContext context, RoleNavigationItem item) {
    final location = GoRouterState.of(context).matchedLocation;
    if (item.matches(location)) {
      return;
    }
    GoRouter.of(context).go(item.route);
  }
}
