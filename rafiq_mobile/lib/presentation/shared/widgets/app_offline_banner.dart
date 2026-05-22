import 'package:flutter/material.dart';

class AppOfflineBanner extends StatelessWidget {
  final String message;

  const AppOfflineBanner({
    super.key,
    this.message =
        'لا يوجد اتصال بالإنترنت حاليًا. سيتم مزامنة التغييرات تلقائيًا عند عودة الاتصال.',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Colors.amber.shade100,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          Icon(
            Icons.wifi_off_rounded,
            size: 18,
            color: Colors.amber.shade900,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: Colors.amber.shade900,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
