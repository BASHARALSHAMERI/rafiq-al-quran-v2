import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../application/attendance/attendance_controller.dart';
import '../../application/context/context_controller.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../shared/widgets/app_card.dart';
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
        backgroundColor: context.surfaceColor,
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
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(title: 'تحضير الطلاب'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(title: 'السياق الحالي'),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'المركز: ${contextState.selectedCenterName ?? contextState.selectedCenterId ?? '-'}',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: context.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'الحلقة: ${contextState.selectedCircleName ?? contextState.selectedCircleId ?? '-'}',
                  style: TextStyle(
                    color: context.textSecondaryColor,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const SectionHeader(title: 'اختيار التاريخ'),
          const SizedBox(height: 8),
          AppCard(
            onTap: pickDate,
            child: Row(
              children: [
                Icon(Icons.calendar_today_rounded, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'تاريخ التحضير',
                        style: TextStyle(
                          color: context.textSecondaryColor,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formatter.format(selectedDate),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: context.textPrimaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.edit_calendar_rounded, color: context.textSecondaryColor),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
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
