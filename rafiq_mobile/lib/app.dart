import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'application/theme/theme_mode_provider.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

class RafiqApp extends ConsumerWidget {
  const RafiqApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);
    const supportedLocales = [Locale('ar'), Locale('en')];

    return MaterialApp.router(
      title: 'رفقاء القرآن',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      supportedLocales: supportedLocales,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      builder: (context, child) {
        final locale = Localizations.maybeLocaleOf(context);
        final isArabic = (locale?.languageCode ?? 'ar') == 'ar';
        return Directionality(
          textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
