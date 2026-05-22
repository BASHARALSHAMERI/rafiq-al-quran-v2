import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import 'package:rafiq_mobile/main.dart';
import 'package:rafiq_mobile/presentation/splash/splash_screen.dart';

void main() {
  late Directory hiveTempDir;

  setUpAll(() async {
    hiveTempDir = await Directory.systemTemp.createTemp('rafiq_mobile_test_');
    Hive.init(hiveTempDir.path);
  });

  tearDownAll(() async {
    await Hive.deleteFromDisk();
    if (hiveTempDir.existsSync()) {
      hiveTempDir.deleteSync(recursive: true);
    }
  });

  testWidgets('smoke test: app builds', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: RafiqApp(),
      ),
    );
    expect(find.byType(SplashScreen), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 1200));
  });
}
