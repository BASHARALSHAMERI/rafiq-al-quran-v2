import 'package:flutter/material.dart';

/// Animation duration tokens — مدد الأنيميشن الموحدة
abstract class AppDurations {
  /// 100ms — للـ Hover effects والـ Ripple
  static const Duration instant = Duration(milliseconds: 100);

  /// 200ms — لعناصر UI الفورية (Checkbox, Switch)
  static const Duration fast = Duration(milliseconds: 200);

  /// 300ms — المعيار لمعظم الأنيميشن
  static const Duration normal = Duration(milliseconds: 300);

  /// 450ms — للعناصر الأكبر (Cards, Sections)
  static const Duration medium = Duration(milliseconds: 450);

  /// 600ms — للـ Hero transitions وشاشة البداية
  static const Duration slow = Duration(milliseconds: 600);

  /// 900ms — للـ Page transitions المعقدة
  static const Duration xSlow = Duration(milliseconds: 900);

  /// مدة stagger بين عناصر القائمة
  static const Duration stagger = Duration(milliseconds: 80);
}

/// Animation curve tokens — منحنيات الحركة الموحدة
abstract class AppCurves {
  /// Standard ease in-out
  static const Curve standard = Curves.easeInOut;

  /// Spring — يرتد قليلاً في النهاية (للـ FAB وبطاقات الدخول)
  static const Curve spring = Curves.easeOutBack;

  /// Ease out — للعناصر التي تدخل الشاشة
  static const Curve enter = Curves.easeOut;

  /// Ease in — للعناصر التي تخرج
  static const Curve exit = Curves.easeIn;

  /// Decelerate — للصفحات المنزلقة
  static const Curve decelerate = Curves.decelerate;

  /// Emphasized — Material Design 3 emphasized
  static const Curve emphasized = Curves.fastEaseInToSlowEaseOut;
}

/// Page transition builders
class AppPageTransitions {
  /// Fade + Scale (للشاشات الجديدة)
  static Widget fadeScale(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return FadeTransition(
      opacity: CurvedAnimation(parent: animation, curve: AppCurves.enter),
      child: ScaleTransition(
        scale: Tween<double>(begin: 0.94, end: 1.0).animate(
          CurvedAnimation(parent: animation, curve: AppCurves.spring),
        ),
        child: child,
      ),
    );
  }

  /// Slide from right (للـ Push navigation في RTL سيكون من اليسار)
  static Widget slideRight(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    const begin = Offset(1.0, 0.0);
    const end = Offset.zero;
    return SlideTransition(
      position: Tween(begin: begin, end: end).animate(
        CurvedAnimation(parent: animation, curve: AppCurves.decelerate),
      ),
      child: FadeTransition(
        opacity: animation,
        child: child,
      ),
    );
  }

  /// Fade through (للـ Tab switching)
  static Widget fadeThrough(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return FadeTransition(
      opacity: animation,
      child: child,
    );
  }
}

/// Staggered list animation helper
class StaggeredAnimationConfig {
  final int index;
  final int totalItems;
  final Duration baseDuration;
  final Duration staggerDelay;

  const StaggeredAnimationConfig({
    required this.index,
    required this.totalItems,
    this.baseDuration = AppDurations.normal,
    this.staggerDelay = AppDurations.stagger,
  });

  Duration get delay => Duration(
        milliseconds: staggerDelay.inMilliseconds * index,
      );

  Duration get totalDuration => Duration(
        milliseconds: baseDuration.inMilliseconds + delay.inMilliseconds,
      );
}
