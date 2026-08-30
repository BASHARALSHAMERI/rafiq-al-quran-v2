import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../core/constants/hive_keys.dart';

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system) {
    _loadThemeMode();
  }

  void _loadThemeMode() {
    try {
      if (Hive.isBoxOpen(HiveBoxes.appCache)) {
        final box = Hive.box<dynamic>(HiveBoxes.appCache);
        final raw = box.get(HiveKeys.themeMode) as String?;
        if (raw != null) {
          switch (raw) {
            case 'light':
              state = ThemeMode.light;
              break;
            case 'dark':
              state = ThemeMode.dark;
              break;
            case 'system':
            default:
              state = ThemeMode.system;
              break;
          }
        }
      }
    } catch (_) {
      // Keep default system
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    try {
      if (Hive.isBoxOpen(HiveBoxes.appCache)) {
        final box = Hive.box<dynamic>(HiveBoxes.appCache);
        await box.put(HiveKeys.themeMode, mode.name);
      }
    } catch (_) {
      // Ignore cache write errors
    }
  }

  Future<void> toggleTheme(BuildContext context) async {
    final isCurrentlyDark = Theme.of(context).brightness == Brightness.dark;
    await setThemeMode(isCurrentlyDark ? ThemeMode.light : ThemeMode.dark);
  }
}

final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});
