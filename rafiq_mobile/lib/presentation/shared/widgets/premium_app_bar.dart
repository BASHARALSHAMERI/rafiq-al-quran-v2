import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

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
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      title: InkWell(
        onTap: showBack 
          ? (onBackTap ?? () {
              if (canPop) {
                context.pop();
              } else {
                context.go('/');
              }
            }) 
          : null,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (showBack) ...[
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: AppColors.textPrimaryLight,
                ),
                const SizedBox(width: 10),
              ],
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      fontSize: 19,
                    ),
              ),
            ],
          ),
        ),
      ),
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
