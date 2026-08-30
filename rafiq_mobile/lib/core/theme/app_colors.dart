import 'package:flutter/material.dart';

/// Semantic Design Tokens for Rafiq Al-Quran v2
/// Carefully crafted for both Light and Dark mode readability, contrast (WCAG AA/AAA),
/// and aesthetic harmony.
abstract class AppColors {
  // ===========================================================================
  // LIGHT PALETTE
  // ===========================================================================
  static const Color primaryLight = Color(0xFF166534); // Emerald 800
  static const Color primaryLightVariant = Color(0xFF15803D); // Emerald 700
  static const Color primaryForegroundLight = Color(0xFFFFFFFF);
  static const Color primaryContainerLight = Color(0xFFDCFCE7); // Emerald 100
  static const Color onPrimaryContainerLight = Color(0xFF14532D);

  static const Color secondaryLight = Color(0xFFD97706); // Amber 600
  static const Color secondaryForegroundLight = Color(0xFFFFFFFF);
  static const Color secondaryContainerLight = Color(0xFFFEF3C7);
  static const Color onSecondaryContainerLight = Color(0xFF78350F);

  static const Color accentLight = Color(0xFFEAB308); // Gold/Yellow 500
  static const Color accentForegroundLight = Color(0xFF0F172A);

  static const Color surfaceLight = Color(0xFFF7F8F5); // Warm clean background
  static const Color backgroundLight = Color(0xFFF7F8F5);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardForegroundLight = Color(0xFF0F172A);
  static const Color surfaceVariantLight = Color(0xFFEDEBE6);

  static const Color textPrimaryLight = Color(0xFF0F172A); // Slate 900
  static const Color textSecondaryLight = Color(0xFF64748B); // Slate 500
  static const Color textMutedLight = Color(0xFF94A3B8); // Slate 400

  static const Color borderLight = Color(0xFFE2E8F0); // Slate 200
  static const Color borderSubtleLight = Color(0xFFF1F5F9);
  static const Color dividerLight = Color(0xFFE2E8F0);

  // States (Light)
  static const Color successLight = Color(0xFF16A34A); // Green 600
  static const Color successContainerLight = Color(0xFFDCFCE7);
  static const Color onSuccessContainerLight = Color(0xFF14532D);

  static const Color warningLight = Color(0xFFD97706); // Amber 600
  static const Color warningContainerLight = Color(0xFFFEF3C7);
  static const Color onWarningContainerLight = Color(0xFF78350F);

  static const Color errorLight = Color(0xFFDC2626); // Red 600
  static const Color errorContainerLight = Color(0xFFFEE2E2);
  static const Color onErrorContainerLight = Color(0xFF7F1D1D);
  static const Color destructive = Color(0xFFDC2626);
  static const Color destructiveForeground = Color(0xFFFFFFFF);

  static const Color infoLight = Color(0xFF2563EB); // Blue 600
  static const Color infoContainerLight = Color(0xFFDBEAFE);
  static const Color onInfoContainerLight = Color(0xFF1E3A8A);

  // ===========================================================================
  // DARK PALETTE
  // ===========================================================================
  static const Color primaryDark = Color(0xFF34D399); // Emerald 400 (Vibrant & crisp)
  static const Color primaryDarkVariant = Color(0xFF10B981); // Emerald 500
  static const Color primaryForegroundDark = Color(0xFF022C1A);
  static const Color primaryContainerDark = Color(0xFF064E3B);
  static const Color onPrimaryContainerDark = Color(0xFFA7F3D0);

  static const Color secondaryDark = Color(0xFFFBBF24); // Amber 400
  static const Color secondaryForegroundDark = Color(0xFF451A03);
  static const Color secondaryContainerDark = Color(0xFF78350F);
  static const Color onSecondaryContainerDark = Color(0xFFFDE68A);

  static const Color accentDark = Color(0xFFFBBF24);
  static const Color accentForegroundDark = Color(0xFF0F172A);

  static const Color surfaceDark = Color(0xFF0F1319); // Deep Obsidian
  static const Color backgroundDark = Color(0xFF0F1319);
  static const Color cardDark = Color(0xFF171E28); // Slate Charcoal Card
  static const Color cardForegroundDark = Color(0xFFF8FAFC);
  static const Color surfaceVariantDark = Color(0xFF1E2633);

  static const Color textPrimaryDark = Color(0xFFF8FAFC); // Slate 50
  static const Color textSecondaryDark = Color(0xFF94A3B8); // Slate 400
  static const Color textMutedDark = Color(0xFF64748B); // Slate 500

  static const Color borderDark = Color(0xFF283545); // Refined dark border
  static const Color borderSubtleDark = Color(0xFF1E2633);
  static const Color dividerDark = Color(0xFF283545);

  // States (Dark)
  static const Color successDark = Color(0xFF4ADE80); // Green 400
  static const Color successContainerDark = Color(0xFF052E16);
  static const Color onSuccessContainerDark = Color(0xFF86EFAC);

  static const Color warningDark = Color(0xFFFBBF24); // Amber 400
  static const Color warningContainerDark = Color(0xFF451A03);
  static const Color onWarningContainerDark = Color(0xFFFDE68A);

  static const Color errorDark = Color(0xFFF87171); // Red 400
  static const Color errorContainerDark = Color(0xFF450A0A);
  static const Color onErrorContainerDark = Color(0xFFFECACA);

  static const Color infoDark = Color(0xFF60A5FA); // Blue 400
  static const Color infoContainerDark = Color(0xFF172554);
  static const Color onInfoContainerDark = Color(0xFFBFDBFE);

  // ===========================================================================
  // ROLE COLORS
  // ===========================================================================
  static const Color roleTeacher = Color(0xFF166534);
  static const Color roleTeacherDark = Color(0xFF34D399);

  static const Color roleSupervisor = Color(0xFF7C3AED);
  static const Color roleSupervisorDark = Color(0xFFA78BFA);

  static const Color roleStudent = Color(0xFF2563EB);
  static const Color roleStudentDark = Color(0xFF60A5FA);

  static const Color roleParent = Color(0xFFD97706);
  static const Color roleParentDark = Color(0xFFFBBF24);

  // Legacy fallback aliases to preserve backwards compatibility
  static const Color background = backgroundLight;
  static const Color foreground = textPrimaryLight;
  static const Color input = borderLight;
  static const Color ring = primaryLight;
  static const Color muted = surfaceVariantLight;
  static const Color mutedForeground = textSecondaryLight;
  static const Color popover = cardLight;
  static const Color popoverForeground = cardForegroundLight;
  static const Color successForeground = Colors.white;
  static const Color warningForeground = Colors.white;
  static const Color errorForeground = Colors.white;
  static const Color infoForeground = Colors.white;
}

/// ThemeExtension for non-Material semantic tokens
@immutable
class AppCustomColors extends ThemeExtension<AppCustomColors> {
  final Color success;
  final Color onSuccess;
  final Color successContainer;
  final Color onSuccessContainer;

  final Color warning;
  final Color onWarning;
  final Color warningContainer;
  final Color onWarningContainer;

  final Color info;
  final Color onInfo;
  final Color infoContainer;
  final Color onInfoContainer;

  final Color accent;
  final Color onAccent;

  final Color cardBorder;
  final Color subtleBackground;
  final Color textMuted;

  final Color roleTeacher;
  final Color roleSupervisor;
  final Color roleStudent;
  final Color roleParent;

  const AppCustomColors({
    required this.success,
    required this.onSuccess,
    required this.successContainer,
    required this.onSuccessContainer,
    required this.warning,
    required this.onWarning,
    required this.warningContainer,
    required this.onWarningContainer,
    required this.info,
    required this.onInfo,
    required this.infoContainer,
    required this.onInfoContainer,
    required this.accent,
    required this.onAccent,
    required this.cardBorder,
    required this.subtleBackground,
    required this.textMuted,
    required this.roleTeacher,
    required this.roleSupervisor,
    required this.roleStudent,
    required this.roleParent,
  });

  static const AppCustomColors light = AppCustomColors(
    success: AppColors.successLight,
    onSuccess: Colors.white,
    successContainer: AppColors.successContainerLight,
    onSuccessContainer: AppColors.onSuccessContainerLight,
    warning: AppColors.warningLight,
    onWarning: Colors.white,
    warningContainer: AppColors.warningContainerLight,
    onWarningContainer: AppColors.onWarningContainerLight,
    info: AppColors.infoLight,
    onInfo: Colors.white,
    infoContainer: AppColors.infoContainerLight,
    onInfoContainer: AppColors.onInfoContainerLight,
    accent: AppColors.accentLight,
    onAccent: AppColors.accentForegroundLight,
    cardBorder: AppColors.borderLight,
    subtleBackground: AppColors.surfaceVariantLight,
    textMuted: AppColors.textMutedLight,
    roleTeacher: AppColors.roleTeacher,
    roleSupervisor: AppColors.roleSupervisor,
    roleStudent: AppColors.roleStudent,
    roleParent: AppColors.roleParent,
  );

  static const AppCustomColors dark = AppCustomColors(
    success: AppColors.successDark,
    onSuccess: Color(0xFF022C1A),
    successContainer: AppColors.successContainerDark,
    onSuccessContainer: AppColors.onSuccessContainerDark,
    warning: AppColors.warningDark,
    onWarning: Color(0xFF451A03),
    warningContainer: AppColors.warningContainerDark,
    onWarningContainer: AppColors.onWarningContainerDark,
    info: AppColors.infoDark,
    onInfo: Color(0xFF172554),
    infoContainer: AppColors.infoContainerDark,
    onInfoContainer: AppColors.onInfoContainerDark,
    accent: AppColors.accentDark,
    onAccent: AppColors.accentForegroundDark,
    cardBorder: AppColors.borderDark,
    subtleBackground: AppColors.surfaceVariantDark,
    textMuted: AppColors.textMutedDark,
    roleTeacher: AppColors.roleTeacherDark,
    roleSupervisor: AppColors.roleSupervisorDark,
    roleStudent: AppColors.roleStudentDark,
    roleParent: AppColors.roleParentDark,
  );

  @override
  AppCustomColors copyWith({
    Color? success,
    Color? onSuccess,
    Color? successContainer,
    Color? onSuccessContainer,
    Color? warning,
    Color? onWarning,
    Color? warningContainer,
    Color? onWarningContainer,
    Color? info,
    Color? onInfo,
    Color? infoContainer,
    Color? onInfoContainer,
    Color? accent,
    Color? onAccent,
    Color? cardBorder,
    Color? subtleBackground,
    Color? textMuted,
    Color? roleTeacher,
    Color? roleSupervisor,
    Color? roleStudent,
    Color? roleParent,
  }) {
    return AppCustomColors(
      success: success ?? this.success,
      onSuccess: onSuccess ?? this.onSuccess,
      successContainer: successContainer ?? this.successContainer,
      onSuccessContainer: onSuccessContainer ?? this.onSuccessContainer,
      warning: warning ?? this.warning,
      onWarning: onWarning ?? this.onWarning,
      warningContainer: warningContainer ?? this.warningContainer,
      onWarningContainer: onWarningContainer ?? this.onWarningContainer,
      info: info ?? this.info,
      onInfo: onInfo ?? this.onInfo,
      infoContainer: infoContainer ?? this.infoContainer,
      onInfoContainer: onInfoContainer ?? this.onInfoContainer,
      accent: accent ?? this.accent,
      onAccent: onAccent ?? this.onAccent,
      cardBorder: cardBorder ?? this.cardBorder,
      subtleBackground: subtleBackground ?? this.subtleBackground,
      textMuted: textMuted ?? this.textMuted,
      roleTeacher: roleTeacher ?? this.roleTeacher,
      roleSupervisor: roleSupervisor ?? this.roleSupervisor,
      roleStudent: roleStudent ?? this.roleStudent,
      roleParent: roleParent ?? this.roleParent,
    );
  }

  @override
  AppCustomColors lerp(ThemeExtension<AppCustomColors>? other, double t) {
    if (other is! AppCustomColors) return this;
    return AppCustomColors(
      success: Color.lerp(success, other.success, t)!,
      onSuccess: Color.lerp(onSuccess, other.onSuccess, t)!,
      successContainer: Color.lerp(successContainer, other.successContainer, t)!,
      onSuccessContainer: Color.lerp(onSuccessContainer, other.onSuccessContainer, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      onWarning: Color.lerp(onWarning, other.onWarning, t)!,
      warningContainer: Color.lerp(warningContainer, other.warningContainer, t)!,
      onWarningContainer: Color.lerp(onWarningContainer, other.onWarningContainer, t)!,
      info: Color.lerp(info, other.info, t)!,
      onInfo: Color.lerp(onInfo, other.onInfo, t)!,
      infoContainer: Color.lerp(infoContainer, other.infoContainer, t)!,
      onInfoContainer: Color.lerp(onInfoContainer, other.onInfoContainer, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      onAccent: Color.lerp(onAccent, other.onAccent, t)!,
      cardBorder: Color.lerp(cardBorder, other.cardBorder, t)!,
      subtleBackground: Color.lerp(subtleBackground, other.subtleBackground, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      roleTeacher: Color.lerp(roleTeacher, other.roleTeacher, t)!,
      roleSupervisor: Color.lerp(roleSupervisor, other.roleSupervisor, t)!,
      roleStudent: Color.lerp(roleStudent, other.roleStudent, t)!,
      roleParent: Color.lerp(roleParent, other.roleParent, t)!,
    );
  }
}

/// Handy BuildContext extension for convenient theme and semantic color access
extension ThemeContextExtension on BuildContext {
  ThemeData get theme => Theme.of(this);
  ColorScheme get colorScheme => Theme.of(this).colorScheme;
  TextTheme get textTheme => Theme.of(this).textTheme;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
  AppCustomColors get customColors =>
      Theme.of(this).extension<AppCustomColors>() ??
      (isDark ? AppCustomColors.dark : AppCustomColors.light);

  // Quick semantic shortcuts
  Color get surfaceColor => colorScheme.surface;
  Color get cardColor => Theme.of(this).cardColor;
  Color get borderColor => customColors.cardBorder;
  Color get textPrimaryColor => colorScheme.onSurface;
  Color get textSecondaryColor => isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
}
