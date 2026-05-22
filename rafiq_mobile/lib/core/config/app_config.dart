import 'app_flavor.dart';

class AppConfig {
  final AppFlavor flavor;
  final String baseUrl;
  final bool enableNetworkLogs;

  const AppConfig({
    required this.flavor,
    required this.baseUrl,
    required this.enableNetworkLogs,
  });
}
