import 'package:flutter/material.dart';

/// Elevation shadow tokens — منهجية Shadow hierarchy
abstract class AppShadows {
  /// XS shadow — للـ Chips والـ Tags الصغيرة
  static const List<BoxShadow> xs = [
    BoxShadow(
      color: Color(0x0A000000),
      blurRadius: 4,
      offset: Offset(0, 1),
    ),
  ];

  /// SM shadow — للـ Buttons والعناصر التفاعلية
  static const List<BoxShadow> sm = [
    BoxShadow(
      color: Color(0x14000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  /// MD shadow — للـ Cards العادية
  static const List<BoxShadow> md = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
    BoxShadow(
      color: Color(0x08000000),
      blurRadius: 4,
      offset: Offset(0, 1),
    ),
  ];

  /// LG shadow — للـ Modals والـ Bottom Sheets
  static const List<BoxShadow> lg = [
    BoxShadow(
      color: Color(0x26000000),
      blurRadius: 24,
      offset: Offset(0, 8),
    ),
    BoxShadow(
      color: Color(0x0C000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  /// XL shadow — للـ Hero sections والعناصر المتميزة
  static const List<BoxShadow> xl = [
    BoxShadow(
      color: Color(0x33000000),
      blurRadius: 40,
      offset: Offset(0, 16),
    ),
    BoxShadow(
      color: Color(0x14000000),
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
  ];

  /// Colored shadow — ظل ملون حسب اللون البأسي
  static List<BoxShadow> colored(Color color, {double opacity = 0.30}) => [
        BoxShadow(
          color: color.withValues(alpha: opacity),
          blurRadius: 16,
          offset: const Offset(0, 6),
          spreadRadius: -2,
        ),
      ];

  /// Green brand shadow
  static const List<BoxShadow> primaryGlow = [
    BoxShadow(
      color: Color(0x40166534),
      blurRadius: 20,
      offset: Offset(0, 8),
      spreadRadius: -4,
    ),
  ];

  /// Gold glow shadow
  static const List<BoxShadow> goldGlow = [
    BoxShadow(
      color: Color(0x40EAB308),
      blurRadius: 20,
      offset: Offset(0, 8),
      spreadRadius: -4,
    ),
  ];
}
