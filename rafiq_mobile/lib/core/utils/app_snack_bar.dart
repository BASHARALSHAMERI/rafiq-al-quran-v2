import 'package:flutter/material.dart';

import '../constants/app_radius.dart';
import '../theme/app_colors.dart';

/// Unified SnackBar helper.
///
/// Use the [BuildContext] variants for normal in-screen feedback.
/// Use the [ScaffoldMessengerState] variants (`*OnState`) when the context
/// will be deactivated before the SnackBar is shown — e.g. after
/// `context.pop()` inside a modal bottom sheet.
///
/// Semantic mapping:
///   [success] — operation completed (save, submit, update).
///   [error]   — server/network failure; user should retry.
///   [warning] — validation or pre-condition not met; user must fix input.
///   [info]    — neutral informational message.
abstract class AppSnackBar {
  static void _show(
    BuildContext context,
    String message, {
    required Color backgroundColor,
    required Color textColor,
    Duration duration = const Duration(seconds: 3),
  }) {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      _buildSnackBar(
        message,
        backgroundColor: backgroundColor,
        textColor: textColor,
        duration: duration,
      ),
    );
  }

  static void _showOnState(
    ScaffoldMessengerState messenger,
    String message, {
    required Color backgroundColor,
    required Color textColor,
    Duration duration = const Duration(seconds: 3),
  }) {
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      _buildSnackBar(
        message,
        backgroundColor: backgroundColor,
        textColor: textColor,
        duration: duration,
      ),
    );
  }

  static SnackBar _buildSnackBar(
    String message, {
    required Color backgroundColor,
    required Color textColor,
    required Duration duration,
  }) {
    return SnackBar(
      content: Text(
        message,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
      backgroundColor: backgroundColor,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      duration: duration,
    );
  }

  // ── Context variants ──────────────────────────────────────────────────────

  static void success(BuildContext context, String message) => _show(
        context,
        message,
        backgroundColor: AppColors.successLight,
        textColor: AppColors.successForeground,
        duration: const Duration(seconds: 3),
      );

  static void error(BuildContext context, String message) => _show(
        context,
        message,
        backgroundColor: AppColors.errorLight,
        textColor: AppColors.errorForeground,
        duration: const Duration(seconds: 4),
      );

  static void warning(BuildContext context, String message) => _show(
        context,
        message,
        backgroundColor: AppColors.warningLight,
        textColor: AppColors.warningForeground,
        duration: const Duration(seconds: 4),
      );

  static void info(BuildContext context, String message) => _show(
        context,
        message,
        backgroundColor: AppColors.infoLight,
        textColor: AppColors.infoForeground,
        duration: const Duration(seconds: 3),
      );

  // ── ScaffoldMessengerState variants (use after context.pop()) ─────────────

  static void successOnState(
    ScaffoldMessengerState messenger,
    String message,
  ) =>
      _showOnState(
        messenger,
        message,
        backgroundColor: AppColors.successLight,
        textColor: AppColors.successForeground,
        duration: const Duration(seconds: 3),
      );

  static void errorOnState(
    ScaffoldMessengerState messenger,
    String message,
  ) =>
      _showOnState(
        messenger,
        message,
        backgroundColor: AppColors.errorLight,
        textColor: AppColors.errorForeground,
        duration: const Duration(seconds: 4),
      );
}
