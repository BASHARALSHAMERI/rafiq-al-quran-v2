import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';

class StandardAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final List<Widget>? actions;
  final Widget? leading;
  final PreferredSizeWidget? bottom;
  final bool centerTitle;
  final Color? backgroundColor;
  final VoidCallback? onBackTap;

  const StandardAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.actions,
    this.leading,
    this.bottom,
    this.centerTitle = false,
    this.backgroundColor,
    this.onBackTap,
  });

  @override
  Size get preferredSize => Size.fromHeight(
        kToolbarHeight + (bottom?.preferredSize.height ?? 0),
      );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final canPop = context.canPop();
    final showBack = canPop || onBackTap != null || GoRouterState.of(context).uri.path != '/';

    return AppBar(
      automaticallyImplyLeading: false,
      centerTitle: centerTitle,
      actions: actions,
      backgroundColor: backgroundColor, // Inherits global theme if null
      bottom: bottom,
      leading: leading ?? (showBack
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
          : null),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(title),
          if (subtitle != null && subtitle!.trim().isNotEmpty)
            Text(
              subtitle!,
              style: theme.textTheme.bodySmall?.copyWith(
                fontSize: 11,
                color: theme.brightness == Brightness.dark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight,
              ),
            ),
        ],
      ),
    );
  }
}
