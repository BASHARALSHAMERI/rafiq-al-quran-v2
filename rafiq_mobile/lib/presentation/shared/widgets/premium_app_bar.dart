import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PremiumAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool showBackIcon;
  final VoidCallback? onBackTap;

  const PremiumAppBar({
    super.key,
    required this.title,
    this.actions,
    this.showBackIcon = true,
    this.onBackTap,
  });

  @override
  Widget build(BuildContext context) {
    final canPop = context.canPop();
    final showBack = showBackIcon && (canPop || GoRouterState.of(context).uri.path != '/');

    return AppBar(
      automaticallyImplyLeading: false,
      centerTitle: false,
      actions: actions,
      leading: showBack
          ? IconButton(
              icon: const Icon(
                Icons.chevron_right_rounded,
                size: 28,
              ),
              onPressed: onBackTap ?? () {
                if (canPop) {
                  context.pop();
                } else {
                  context.go('/');
                }
              },
            )
          : null,
      title: Text(title),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
