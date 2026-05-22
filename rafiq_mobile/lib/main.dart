import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app.dart';
import 'core/constants/hive_keys.dart';

export 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Hive.initFlutter();
  if (!Hive.isBoxOpen(HiveBoxes.appCache)) {
    await Hive.openBox<dynamic>(HiveBoxes.appCache);
  }

  runApp(
    const ProviderScope(
      child: RafiqApp(),
    ),
  );
}
