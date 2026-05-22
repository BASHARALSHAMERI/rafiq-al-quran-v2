import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/parent/parent_dashboard_provider.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/section_header.dart';

class ChildAttendanceScreen extends ConsumerWidget {
  final String childId;

  const ChildAttendanceScreen({super.key, required this.childId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(parentDashboardProvider);
    final cId = int.tryParse(childId) ?? 0;

    final profile = state.childrenProfiles[cId];
    if (profile == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF7F8F5),
        appBar: AppBar(
          title: const Text('سجل الحضور'),
          centerTitle: false,
          backgroundColor: const Color(0xFFF7F8F5),
        ),
        body: const PageStateView.loading(message: 'جاري تحميل سجل الحضور...'),
      );
    }

    final name = profile['fullName'] ?? 'ابن';
    final metrics = profile['metrics'] as Map<String, dynamic>? ?? {};
    final attendanceRate = metrics['attendancePercentage'] ?? 0;

    final enrollments = profile['studentEnrollments'] as List<dynamic>? ?? [];
    final hasCircle = enrollments.isNotEmpty;
    final firstCircle =
        hasCircle ? enrollments.first['circle'] as Map<String, dynamic>? : null;
    final halqa = firstCircle?['name']?.toString() ?? 'غير مسجل';

    final attendanceLogs =
        profile['attendancesAsStudent'] as List<dynamic>? ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      appBar: AppBar(
        title: const Text('سجل الحضور'),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 2),
                Text('$halqa • نسبة الحضور $attendanceRate%',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondaryLight)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const SectionHeader(title: 'سجل الحضور'),
          const SizedBox(height: 8),
          if (attendanceLogs.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(
                  child: Text('لا يوجد سجل حضور مسجل.',
                      style: TextStyle(color: AppColors.textSecondaryLight))),
            ),
          ...attendanceLogs.map(
            (log) {
              final dateStr = log['date']?.toString();
              final dateObj =
                  dateStr != null ? DateTime.tryParse(dateStr) : null;
              final dateFormatted = dateObj != null
                  ? DateFormat('EEEE d/M', 'ar').format(dateObj)
                  : 'غير معروف';

              final status = log['status']?.toString() ?? 'PRESENT';
              final style = _getStatusStyle(status);

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppCard(
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded,
                          size: 16, color: AppColors.textSecondaryLight),
                      const SizedBox(width: 8),
                      Expanded(child: Text(dateFormatted)),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: style['color'].withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(style['label'],
                            style: TextStyle(
                                color: style['color'],
                                fontWeight: FontWeight.w700,
                                fontSize: 11)),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getStatusStyle(String status) {
    switch (status.toUpperCase()) {
      case 'PRESENT':
      case 'حاضر':
        return {'label': 'حاضر', 'color': AppColors.successLight};
      case 'ABSENT':
      case 'غائب':
        return {'label': 'غائب', 'color': AppColors.errorLight};
      case 'LATE':
      case 'متأخر':
        return {'label': 'متأخر', 'color': AppColors.warningLight};
      default:
        return {'label': status, 'color': AppColors.textSecondaryLight};
    }
  }
}
