import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';

class AppBottomSheet {
  static Future<T?> show<T>({
    required BuildContext context,
    required Widget child,
    String? title,
    bool isScrollControlled = true,
    bool useRootNavigator = true,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: isScrollControlled,
      useRootNavigator: useRootNavigator,
      backgroundColor: Colors.transparent,
      builder: (context) => _BottomSheetContainer(
        title: title,
        child: child,
      ),
    );
  }
}

class _BottomSheetContainer extends StatelessWidget {
  final String? title;
  final Widget child;

  const _BottomSheetContainer({
    this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    // Allows bottom sheet to span above keyboard when typing
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Container(
      margin: EdgeInsets.only(top: MediaQuery.paddingOf(context).top + 40),
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: const BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppRadius.lg),
        ),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle Bar
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Optional Title
            if (title != null) ...[
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title!,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                    IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.close_rounded))
                  ],
                ),
              ),
              const Divider(color: AppColors.borderLight),
            ] else ...[
              const SizedBox(height: AppSpacing.md),
            ],

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md)
                    .copyWith(bottom: AppSpacing.lg),
                child: child,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
