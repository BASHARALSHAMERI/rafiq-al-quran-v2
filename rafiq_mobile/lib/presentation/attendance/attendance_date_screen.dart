import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../application/attendance/attendance_controller.dart';
import '../../application/context/context_controller.dart';
import '../../core/router/route_names.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/section_header.dart';
import '../shared/widgets/standard_app_bar.dart';

class AttendanceDateScreen extends ConsumerWidget {
  const AttendanceDateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceState = ref.watch(attendanceControllerProvider);
    final contextState = ref.watch(contextControllerProvider);
    final formatter = DateFormat('yyyy-MM-dd');
    final selectedDate = attendanceState.selectedDate;

    Future<void> pickDate() async {
      final picked = await showDatePicker(
        context: context,
        initialDate: selectedDate,
        firstDate: DateTime(2023, 1, 1),
        lastDate: DateTime.now().add(const Duration(days: 365)),
        locale: const Locale('ar'),
      );
      if (picked != null) {
        ref.read(attendanceControllerProvider.notifier).setSelectedDate(picked);
      }
    }

    if (!contextState.hasSelectedCircle) {
      return Scaffold(
        appBar: const StandardAppBar(title: 'تحضير الطلاب'),
        body: PageStateView.error(
          title: 'لا توجد حلقة محددة',
          message: 'اختر المركز والحلقة أولًا قبل تسجيل الحضور.',
          actionLabel: 'اختيار الحلقة',
          onAction: () => context.go(RouteNames.selectCircle),
        ),
      );
    }

    return Scaffold(
      appBar: const StandardAppBar(title: 'تحضير الطلاب'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(title: 'السياق الحالي'),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('المركز: ${contextState.selectedCenterId ?? '-'}'),
                  const SizedBox(height: 4),
                  Text('الحلقة: ${contextState.selectedCircleId ?? '-'}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          const SectionHeader(title: 'اختيار التاريخ'),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              title: const Text('تاريخ التحضير'),
              subtitle: Text(formatter.format(selectedDate)),
              trailing: const Icon(Icons.calendar_today_rounded),
              onTap: pickDate,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              final date = formatter.format(selectedDate);
              context.go(RouteNames.attendanceMarkWithDate(date));
            },
            icon: const Icon(Icons.arrow_forward_rounded),
            label: const Text('الانتقال إلى ورقة التحضير'),
          ),
        ],
      ),
    );
  }
}
