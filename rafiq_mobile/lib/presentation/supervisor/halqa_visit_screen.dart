import 'package:flutter/material.dart';

import 'supervisor_visit_lifecycle_screen.dart';

/// Backward-compatible entry point for older imports.
///
/// The visit lifecycle is handled by [SupervisorVisitLifecycleScreen], which
/// starts and ends visits through the supervisor-visits API.
class HalqaVisitScreen extends StatelessWidget {
  final int circleId;

  const HalqaVisitScreen({super.key, required this.circleId});

  @override
  Widget build(BuildContext context) {
    return SupervisorVisitLifecycleScreen(circleId: circleId);
  }
}
