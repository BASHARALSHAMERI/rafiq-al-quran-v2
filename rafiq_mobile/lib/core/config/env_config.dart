import 'package:flutter/foundation.dart';

import 'app_config.dart';
import 'app_flavor.dart';

class EnvConfig {
  static const String _androidEmulatorBaseUrl = 'http://10.0.2.2:4000';
  static const String _physicalDeviceBaseUrl = 'https://every-bobcats-train.loca.lt'; // Localtunnel URL
  static const String _localhostBaseUrl = 'http://localhost:4000';
  static const String _defaultProdBaseUrl = 'https://api.example.com';

  static String get _defaultDevBaseUrl {
    if (kIsWeb) {
      return _localhostBaseUrl;
    }

    return switch (defaultTargetPlatform) {
      TargetPlatform.android => _physicalDeviceBaseUrl, // Public URL bypassing Firewall
      _ => _localhostBaseUrl,
    };
  }

  static AppConfig loadFromDefines() {
    const flavorRaw = String.fromEnvironment('APP_FLAVOR', defaultValue: 'dev');
    const baseUrlRaw = String.fromEnvironment('API_BASE_URL', defaultValue: '');

    final flavor = switch (flavorRaw.toLowerCase()) {
      'prod' => AppFlavor.prod,
      _ => AppFlavor.dev,
    };

    final fallbackBaseUrl =
        flavor == AppFlavor.prod ? _defaultProdBaseUrl : _defaultDevBaseUrl;
    final baseUrl = baseUrlRaw.isEmpty ? fallbackBaseUrl : baseUrlRaw;

    return AppConfig(
      flavor: flavor,
      baseUrl: baseUrl,
      enableNetworkLogs: flavor == AppFlavor.dev,
    );
  }

  static AppConfig get current => loadFromDefines();
  static String get baseUrl => current.baseUrl;
  static bool get enableNetworkLogs => current.enableNetworkLogs;
}
