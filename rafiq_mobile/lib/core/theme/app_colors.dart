import 'package:flutter/material.dart';

/// Colors matching quran-companions-app-main CSS variables
/// Converted from HSL to Flutter Color
abstract class AppColors {
  // ============================================
  // PRIMARY COLORS (Emerald Green)
  // --primary: 170 72% 28%
  // ============================================
  static const Color primaryLight = Color(0xFF166534);
  static const Color primaryForeground = Color(0xFFFFFFFF);

  // ============================================
  // SECONDARY COLORS (Warm Beige)
  // --secondary: 35 30% 93%
  // ============================================
  static const Color secondaryLight = Color(0xFFEAB308);
  static const Color secondaryForeground = Color(0xFF0F172A);

  // ============================================
  // BACKGROUND & SURFACE
  // --background: 40 33% 98%
  // --card: 0 0% 100%
  // ============================================
  static const Color background = Color(0xFFFBF9F5);
  static const Color foreground = Color(0xFF0F172A);
  static const Color surfaceLight = Color(0xFFFBF9F5);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardForeground = Color(0xFF0F172A);

  // ============================================
  // TEXT COLORS
  // ============================================
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color mutedForeground = Color(0xFF64748B);
  static const Color textPrimaryDark = Color(0xFFE8EEF5);
  static const Color textSecondaryDark = Color(0xFFA8B3C2);

  // ============================================
  // BORDER COLORS
  // --border: 40 15% 90%
  // ============================================
  static const Color borderLight = Color(0xFFEDE8DF);
  static const Color borderDark = Color(0xFF2A3440);
  static const Color input = Color(0xFFEDE8DF);
  static const Color ring = Color(0xFF166534);

  // ============================================
  // ACCENT COLORS (Gold)
  // --accent: 42 75% 55%
  // ============================================
  static const Color accentLight = Color(0xFFEAB308);
  static const Color accentForeground = Color(0xFF0F172A);

  // ============================================
  // STATE COLORS
  // ============================================

  // Success - Present
  // --success: 152 60% 42%
  static const Color successLight = Color(0xFF22C55E);
  static const Color successForeground = Color(0xFFFFFFFF);
  static const Color successDark = Color(0xFF34C27A);

  // Warning - Excused absence
  // --warning: 38 92% 55%
  static const Color warningLight = Color(0xFFF59E0B);
  static const Color warningForeground = Color(0xFF0F172A);
  static const Color warningDark = Color(0xFFE0A300);

  // Error/Destructive - Unexcused absence
  // --destructive: 0 72% 55%
  static const Color errorLight = Color(0xFFEF4444);
  static const Color errorForeground = Color(0xFFFFFFFF);
  static const Color errorDark = Color(0xFFFF6B6B);
  static const Color destructive = Color(0xFFEF4444);
  static const Color destructiveForeground = Color(0xFFFFFFFF);

  // Info
  // --info: 205 75% 50%
  static const Color infoLight = Color(0xFF3B82F6);
  static const Color infoForeground = Color(0xFFFFFFFF);
  static const Color infoDark = Color(0xFF60A5FA);

  // ============================================
  // DARK MODE COLORS
  // ============================================
  static const Color primaryDark = Color(0xFF3CB39A);
  static const Color secondaryDark = Color(0xFF6CB6FF);
  static const Color surfaceDark = Color(0xFF12161B);
  static const Color cardDark = Color(0xFF1B2129);
  static const Color backgroundDark = Color(0xFF12161B);

  // ============================================
  // ROLE COLORS
  // ============================================
  static const Color roleTeacher = Color(0xFF166534);
  static const Color roleSupervisor = Color(0xFF8B5CF6);
  static const Color roleStudent = Color(0xFF3B82F6);
  static const Color roleParent = Color(0xFFEAB308);

  // ============================================
  // MUTED COLORS
  // --muted: 40 20% 95%
  // --muted-foreground: 220 10% 50%
  // ============================================
  static const Color muted = Color(0xFFF5F3EF);

  // ============================================
  // POPOVER & OVERLAY
  // ============================================
  static const Color popover = Color(0xFFFFFFFF);
  static const Color popoverForeground = Color(0xFF0F172A);

  // ============================================
  // UTILITY METHODS
  // ============================================

  /// Get color by name for dynamic usage
  static Color? fromName(String name, {bool dark = false}) {
    final map = dark ? _darkColors : _lightColors;
    return map[name];
  }

  static final Map<String, Color> _lightColors = {
    'primary': primaryLight,
    'secondary': secondaryLight,
    'background': background,
    'foreground': foreground,
    'card': cardLight,
    'cardForeground': cardForeground,
    'border': borderLight,
    'input': input,
    'ring': ring,
    'accent': accentLight,
    'accentForeground': accentForeground,
    'destructive': destructive,
    'destructiveForeground': destructiveForeground,
    'muted': muted,
    'mutedForeground': mutedForeground,
    'success': successLight,
    'successForeground': successForeground,
    'warning': warningLight,
    'warningForeground': warningForeground,
    'info': infoLight,
    'infoForeground': infoForeground,
  };

  static final Map<String, Color> _darkColors = {
    'primary': primaryDark,
    'secondary': secondaryDark,
    'background': backgroundDark,
    'foreground': textPrimaryDark,
    'card': cardDark,
    'cardForeground': textPrimaryDark,
    'border': borderDark,
    'input': borderDark,
    'ring': primaryDark,
    'accent': accentLight,
    'accentForeground': textPrimaryDark,
    'destructive': errorDark,
    'destructiveForeground': Colors.white,
    'muted': surfaceDark,
    'mutedForeground': textSecondaryDark,
    'success': successDark,
    'successForeground': Colors.white,
    'warning': warningDark,
    'warningForeground': textPrimaryDark,
    'info': infoDark,
    'infoForeground': Colors.white,
  };
}

/// Color scheme mapping for ThemeData
extension AppColorScheme on AppColors {
  static ColorScheme get lightColorScheme => ColorScheme.fromSeed(
        seedColor: AppColors.primaryLight,
        brightness: Brightness.light,
        primary: AppColors.primaryLight,
        onPrimary: AppColors.primaryForeground,
        secondary: AppColors.secondaryLight,
        onSecondary: AppColors.secondaryForeground,
        surface: AppColors.cardLight,
        onSurface: AppColors.cardForeground,
        error: AppColors.destructive,
        onError: AppColors.destructiveForeground,
        outline: AppColors.borderLight,
      );

  static ColorScheme get darkColorScheme => ColorScheme.fromSeed(
        seedColor: AppColors.primaryDark,
        brightness: Brightness.dark,
        primary: AppColors.primaryDark,
        onPrimary: Colors.white,
        secondary: AppColors.secondaryDark,
        onSecondary: Colors.white,
        surface: AppColors.cardDark,
        onSurface: AppColors.textPrimaryDark,
        error: AppColors.errorDark,
        onError: Colors.white,
        outline: AppColors.borderDark,
      );
}
