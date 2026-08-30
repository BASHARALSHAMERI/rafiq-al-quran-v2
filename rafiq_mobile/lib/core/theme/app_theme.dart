import 'package:flutter/material.dart';

import '../constants/app_radius.dart';
import '../constants/app_spacing.dart';
import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  // ===========================================================================
  // LIGHT THEME
  // ===========================================================================
  static ThemeData get lightTheme {
    const colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.primaryLight,
      onPrimary: AppColors.primaryForegroundLight,
      primaryContainer: AppColors.primaryContainerLight,
      onPrimaryContainer: AppColors.onPrimaryContainerLight,
      secondary: AppColors.secondaryLight,
      onSecondary: AppColors.secondaryForegroundLight,
      secondaryContainer: AppColors.secondaryContainerLight,
      onSecondaryContainer: AppColors.onSecondaryContainerLight,
      surface: AppColors.cardLight,
      onSurface: AppColors.textPrimaryLight,
      surfaceContainerHighest: AppColors.surfaceVariantLight,
      onSurfaceVariant: AppColors.textSecondaryLight,
      error: AppColors.errorLight,
      onError: Colors.white,
      errorContainer: AppColors.errorContainerLight,
      onErrorContainer: AppColors.onErrorContainerLight,
      outline: AppColors.borderLight,
      outlineVariant: AppColors.borderSubtleLight,
      shadow: Colors.black12,
    );

    final base = ThemeData.light(useMaterial3: true);
    final textTheme = AppTypography.textThemeLight(base.textTheme);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      fontFamily: AppTypography.fontFamily,
      fontFamilyFallback: AppTypography.fallbackFamily,
      textTheme: textTheme,
      scaffoldBackgroundColor: AppColors.surfaceLight,
      canvasColor: AppColors.surfaceLight,
      cardColor: AppColors.cardLight,
      dividerColor: AppColors.dividerLight,
      extensions: const [AppCustomColors.light],

      // AppBar
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppColors.cardLight,
        foregroundColor: AppColors.textPrimaryLight,
        iconTheme: const IconThemeData(color: AppColors.textPrimaryLight, size: 22),
        actionsIconTheme: const IconThemeData(color: AppColors.textPrimaryLight, size: 22),
        shape: const Border(
          bottom: BorderSide(
            color: AppColors.borderLight,
            width: 1,
          ),
        ),
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: AppColors.textPrimaryLight,
          fontWeight: FontWeight.w800,
        ),
      ),

      // Card
      cardTheme: CardThemeData(
        color: AppColors.cardLight,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: const BorderSide(
            color: AppColors.borderLight,
            width: 1,
          ),
        ),
      ),

      // Buttons
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primaryLight,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
          elevation: 0,
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryLight,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          elevation: 0,
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimaryLight,
          minimumSize: const Size(double.infinity, 50),
          side: const BorderSide(color: AppColors.borderLight, width: 1.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryLight,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.cardLight,
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: AppColors.textMutedLight,
        ),
        labelStyle: textTheme.bodyMedium?.copyWith(
          color: AppColors.textSecondaryLight,
        ),
        floatingLabelStyle: textTheme.bodySmall?.copyWith(
          color: AppColors.primaryLight,
          fontWeight: FontWeight.w700,
        ),
        prefixIconColor: AppColors.textSecondaryLight,
        suffixIconColor: AppColors.textSecondaryLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.primaryLight, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.errorLight, width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.errorLight, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
      ),

      // BottomSheet
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.cardLight,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(AppRadius.xl),
            topRight: Radius.circular(AppRadius.xl),
          ),
        ),
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.cardLight,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.xl),
          side: const BorderSide(color: AppColors.borderLight),
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: AppColors.dividerLight,
        thickness: 1,
        space: 1,
      ),

      // SnackBar
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.textPrimaryLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w600,
        ),
      ),

      // NavigationBar
      navigationBarTheme: NavigationBarThemeData(
        height: 72,
        elevation: 0,
        backgroundColor: AppColors.cardLight,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.primaryLight.withValues(alpha: 0.12),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return textTheme.labelSmall?.copyWith(
            color: selected ? AppColors.primaryLight : AppColors.textSecondaryLight,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
          );
        }),
      ),

      // TabBar
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.primaryLight,
        unselectedLabelColor: AppColors.textSecondaryLight,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
        unselectedLabelStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500),
        dividerColor: AppColors.dividerLight,
      ),

      // Progress Indicator
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primaryLight,
        linearTrackColor: AppColors.borderLight,
        circularTrackColor: AppColors.borderLight,
      ),

      // Chips
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: AppColors.surfaceVariantLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: const BorderSide(color: AppColors.borderLight),
        ),
        labelStyle: textTheme.labelMedium?.copyWith(
          color: AppColors.textPrimaryLight,
        ),
      ),

      // Checkbox
      checkboxTheme: CheckboxThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primaryLight;
          }
          return Colors.transparent;
        }),
      ),
    );
  }

  // ===========================================================================
  // DARK THEME
  // ===========================================================================
  static ThemeData get darkTheme {
    const colorScheme = ColorScheme(
      brightness: Brightness.dark,
      primary: AppColors.primaryDark,
      onPrimary: AppColors.primaryForegroundDark,
      primaryContainer: AppColors.primaryContainerDark,
      onPrimaryContainer: AppColors.onPrimaryContainerDark,
      secondary: AppColors.secondaryDark,
      onSecondary: AppColors.secondaryForegroundDark,
      secondaryContainer: AppColors.secondaryContainerDark,
      onSecondaryContainer: AppColors.onSecondaryContainerDark,
      surface: AppColors.cardDark,
      onSurface: AppColors.textPrimaryDark,
      surfaceContainerHighest: AppColors.surfaceVariantDark,
      onSurfaceVariant: AppColors.textSecondaryDark,
      error: AppColors.errorDark,
      onError: Colors.black,
      errorContainer: AppColors.errorContainerDark,
      onErrorContainer: AppColors.onErrorContainerDark,
      outline: AppColors.borderDark,
      outlineVariant: AppColors.borderSubtleDark,
      shadow: Colors.black54,
    );

    final base = ThemeData.dark(useMaterial3: true);
    final textTheme = AppTypography.textThemeDark(base.textTheme);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      fontFamily: AppTypography.fontFamily,
      fontFamilyFallback: AppTypography.fallbackFamily,
      textTheme: textTheme,
      scaffoldBackgroundColor: AppColors.surfaceDark,
      canvasColor: AppColors.surfaceDark,
      cardColor: AppColors.cardDark,
      dividerColor: AppColors.dividerDark,
      extensions: const [AppCustomColors.dark],

      // AppBar
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppColors.cardDark,
        foregroundColor: AppColors.textPrimaryDark,
        iconTheme: const IconThemeData(color: AppColors.textPrimaryDark, size: 22),
        actionsIconTheme: const IconThemeData(color: AppColors.textPrimaryDark, size: 22),
        shape: const Border(
          bottom: BorderSide(
            color: AppColors.borderDark,
            width: 1,
          ),
        ),
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: AppColors.textPrimaryDark,
          fontWeight: FontWeight.w800,
        ),
      ),

      // Card
      cardTheme: CardThemeData(
        color: AppColors.cardDark,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: const BorderSide(
            color: AppColors.borderDark,
            width: 1,
          ),
        ),
      ),

      // Buttons
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primaryDark,
          foregroundColor: AppColors.primaryForegroundDark,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w800,
            fontSize: 15,
          ),
          elevation: 0,
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryDark,
          foregroundColor: AppColors.primaryForegroundDark,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          elevation: 0,
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w800,
            fontSize: 15,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimaryDark,
          minimumSize: const Size(double.infinity, 50),
          side: const BorderSide(color: AppColors.borderDark, width: 1.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.cardDark,
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: AppColors.textMutedDark,
        ),
        labelStyle: textTheme.bodyMedium?.copyWith(
          color: AppColors.textSecondaryDark,
        ),
        floatingLabelStyle: textTheme.bodySmall?.copyWith(
          color: AppColors.primaryDark,
          fontWeight: FontWeight.w700,
        ),
        prefixIconColor: AppColors.textSecondaryDark,
        suffixIconColor: AppColors.textSecondaryDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.borderDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.primaryDark, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.errorDark, width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.errorDark, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
      ),

      // BottomSheet
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.cardDark,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(AppRadius.xl),
            topRight: Radius.circular(AppRadius.xl),
          ),
        ),
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.cardDark,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.xl),
          side: const BorderSide(color: AppColors.borderDark),
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: AppColors.dividerDark,
        thickness: 1,
        space: 1,
      ),

      // SnackBar
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.cardDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: const BorderSide(color: AppColors.borderDark),
        ),
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: AppColors.textPrimaryDark,
          fontWeight: FontWeight.w600,
        ),
      ),

      // NavigationBar
      navigationBarTheme: NavigationBarThemeData(
        height: 72,
        elevation: 0,
        backgroundColor: AppColors.cardDark,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.primaryDark.withValues(alpha: 0.18),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return textTheme.labelSmall?.copyWith(
            color: selected ? AppColors.primaryDark : AppColors.textSecondaryDark,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
          );
        }),
      ),

      // TabBar
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.primaryDark,
        unselectedLabelColor: AppColors.textSecondaryDark,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
        unselectedLabelStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500),
        dividerColor: AppColors.dividerDark,
      ),

      // Progress Indicator
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primaryDark,
        linearTrackColor: AppColors.borderDark,
        circularTrackColor: AppColors.borderDark,
      ),

      // Chips
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: AppColors.surfaceVariantDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: const BorderSide(color: AppColors.borderDark),
        ),
        labelStyle: textTheme.labelMedium?.copyWith(
          color: AppColors.textPrimaryDark,
        ),
      ),

      // Checkbox
      checkboxTheme: CheckboxThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primaryDark;
          }
          return Colors.transparent;
        }),
      ),
    );
  }
}
