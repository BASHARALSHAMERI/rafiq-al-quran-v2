import 'package:flutter/material.dart';

/// Gradients matching quran-companions-app-main HSL-based design system
///
/// HSL to Flutter conversions:
/// --primary: 170 72% 28% -> Color(0xFF166534)
/// --secondary: 35 30% 93% -> Color(0xFFEDE8DF)
/// --accent: 42 75% 55% -> Color(0xFFEAB308)
/// --success: 152 60% 42% -> Color(0xFF22C55E)
/// --warning: 38 92% 55% -> Color(0xFFF59E0B)
/// --destructive: 0 72% 55% -> Color(0xFFEF4444)
/// --info: 205 75% 50% -> Color(0xFF3B82F6)
abstract class AppGradients {
  // ============================================
  // PRIMARY GRADIENTS (Emerald Green)
  // ============================================

  /// Primary gradient for buttons and CTAs
  /// Matches: linear-gradient(135deg, hsl(170 72% 28%), hsl(170 72% 38%))
  static const LinearGradient primary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF166534), Color(0xFF15803D)],
  );

  /// Hero/header gradient - deeper
  /// Matches: linear-gradient(180deg, hsl(170 72% 28%), hsl(170 72% 22%))
  static const LinearGradient hero = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF166534), Color(0xFF14532D)],
  );

  /// Deeper primary gradient used by prominent hero surfaces and forms.
  static const LinearGradient deepPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF14532D), Color(0xFF166534)],
  );

  /// Primary light variant for hover/active states
  static const LinearGradient primaryLight = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF15803D), Color(0xFF16A34A)],
  );

  // ============================================
  // ACCENT GRADIENTS (Gold)
  // ============================================

  /// Gold accent for achievements and highlights
  /// Matches: linear-gradient(135deg, hsl(42 75% 55%), hsl(35 80% 50%))
  static const LinearGradient gold = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFD97706), Color(0xFFEAB308)],
  );

  /// Gold light variant
  static const LinearGradient goldLight = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
  );

  // ============================================
  // STATE GRADIENTS
  // ============================================

  /// Success gradient - for attendance/present states
  static const LinearGradient success = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF15803D), Color(0xFF22C55E)],
  );

  /// Warning gradient - for alerts/excused absences
  static const LinearGradient warning = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
  );

  /// Error/Destructive gradient - for absent/unexcused
  static const LinearGradient error = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFDC2626), Color(0xFFEF4444)],
  );

  /// Info gradient - for notifications
  static const LinearGradient info = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6)],
  );

  // ============================================
  // SURFACE GRADIENTS
  // ============================================

  /// Light surface gradient for elevated cards
  static const LinearGradient surfaceLight = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFFFFFFF), Color(0xFFFBF9F5)],
  );

  /// Subtle gradient for backgrounds
  static const LinearGradient backgroundSubtle = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFFBF9F5), Color(0xFFF5F3EF)],
  );

  // ============================================
  // UTILITY GRADIENTS
  // ============================================

  /// Shimmer loading effect
  static LinearGradient shimmer(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return LinearGradient(
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
      colors: isDark
          ? [
              const Color(0xFF2A3440),
              const Color(0xFF3A4A58),
              const Color(0xFF2A3440),
            ]
          : [
              const Color(0xFFE8EEF4),
              const Color(0xFFF5F8FB),
              const Color(0xFFE8EEF4),
            ],
      stops: const [0.0, 0.5, 1.0],
    );
  }

  /// Glass effect overlay for cards
  static LinearGradient glass(Color color) => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          color.withValues(alpha: 0.12),
          color.withValues(alpha: 0.06),
        ],
      );

  /// Dark overlay for images
  static const LinearGradient darkOverlay = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Colors.transparent, Color(0xCC000000)],
  );
}

/// Extension for easy gradient decoration
extension GradientDecoration on BoxDecoration {
  static BoxDecoration withGradient({
    required LinearGradient gradient,
    BorderRadius? borderRadius,
    BoxBorder? border,
    List<BoxShadow>? boxShadow,
  }) {
    return BoxDecoration(
      gradient: gradient,
      borderRadius: borderRadius ?? BorderRadius.circular(16),
      border: border,
      boxShadow: boxShadow,
    );
  }
}
