import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/attendance/attendance_controller.dart';
import '../../application/attendance/attendance_state.dart';
import '../../application/context/context_controller.dart';
import '../../core/router/route_names.dart';
import '../../core/utils/app_snack_bar.dart';
import '../../domain/entities/attendance.dart';
import '../../core/theme/app_colors.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/standard_app_bar.dart';

class AttendanceMarkScreen extends ConsumerStatefulWidget {
  final String dateIso;

  const AttendanceMarkScreen({
    super.key,
    required this.dateIso,
  });

  @override
  ConsumerState<AttendanceMarkScreen> createState() =>
      _AttendanceMarkScreenState();
}

class _AttendanceMarkScreenState extends ConsumerState<AttendanceMarkScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAttendance());
  }

  Future<void> _loadAttendance() async {
    final contextState = ref.read(contextControllerProvider);
    final circleId = contextState.selectedCircleId;
    if (circleId == null || circleId <= 0) return;

    final date = DateTime.tryParse(widget.dateIso);
    await ref.read(attendanceControllerProvider.notifier).loadForDate(
          circleId: circleId.toString(),
          date: date,
        );
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(contextControllerProvider);
    final att = ref.watch(attendanceControllerProvider);
    final controller = ref.read(attendanceControllerProvider.notifier);
    final circleId = contextState.selectedCircleId;
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;
    final isDark = context.isDark;

    final selectedDate = DateTime.tryParse(widget.dateIso) ?? att.selectedDate;
    final now = DateTime.now();
    final isLocked = now.difference(selectedDate).inHours >= 24 &&
        selectedDate.isBefore(now);

    ref.listen<AttendanceState>(attendanceControllerProvider, (prev, next) {
      if (next.error != null && next.error != prev?.error) {
        AppSnackBar.error(context, next.error!);
      }
    });

    if (circleId == null || circleId <= 0) {
      return Scaffold(
        backgroundColor: context.surfaceColor,
        appBar: const StandardAppBar(title: 'تسجيل الحضور'),
        body: PageStateView.error(
          title: 'لا توجد حلقة محددة',
          message: 'اختر الحلقة أولًا قبل تسجيل الحضور.',
          actionLabel: 'اختيار الحلقة',
          onAction: () => context.go(RouteNames.selectCircle),
        ),
      );
    }

    final presentCount = att.draftByStudentId.values
        .where((e) => e.status == AttendanceStatus.present)
        .length;
    final excusedCount = att.draftByStudentId.values
        .where((e) => e.status == AttendanceStatus.excused)
        .length;
    final absentCount = att.draftByStudentId.values
        .where((e) => e.status == AttendanceStatus.absent)
        .length;
    final lateCount = att.draftByStudentId.values
        .where((e) => e.status == AttendanceStatus.late)
        .length;

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(title: 'تسجيل الحضور'),
      body: att.isLoading
          ? const PageStateView.loading()
          : att.students.isEmpty
              ? const PageStateView.empty(
                  title: 'لا يوجد طلاب',
                  message: 'تأكد من وجود طلاب مرتبطين بهذه الحلقة.',
                )
              : SafeArea(
                  child: Column(
                    children: [
                      // Top Tally Cards and "Mark all present" button
                      Container(
                        color: Colors.transparent,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                _StatPill(
                                  label: 'حاضر',
                                  value: '$presentCount',
                                  textColor: custom.success,
                                  bgColor: custom.success.withValues(alpha: isDark ? 0.20 : 0.10),
                                ),
                                const SizedBox(width: 8),
                                _StatPill(
                                  label: 'بعذر',
                                  value: '$excusedCount',
                                  textColor: custom.warning,
                                  bgColor: custom.warning.withValues(alpha: isDark ? 0.20 : 0.10),
                                ),
                                const SizedBox(width: 8),
                                _StatPill(
                                  label: 'بلا عذر',
                                  value: '$absentCount',
                                  textColor: Theme.of(context).colorScheme.error,
                                  bgColor: Theme.of(context).colorScheme.error.withValues(alpha: isDark ? 0.20 : 0.10),
                                ),
                                const SizedBox(width: 8),
                                _StatPill(
                                  label: 'متأخر',
                                  value: '$lateCount',
                                  textColor: custom.accent,
                                  bgColor: custom.accent.withValues(alpha: isDark ? 0.20 : 0.10),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            GestureDetector(
                              onTap:
                                  isLocked ? null : controller.markAllPresent,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  Text(
                                    'تحديد الكل حاضرون ✓',
                                    style: TextStyle(
                                      color: custom.success,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // List of Students
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: att.students.length,
                          itemBuilder: (context, index) {
                            final student = att.students[index];
                            final draft = att.draftByStudentId[student.id] ??
                                const AttendanceDraftItem(
                                    status: AttendanceStatus.present);

                            return _StudentAttendanceCard(
                              student: student,
                              draft: draft,
                              isLocked: isLocked,
                              onStatusChanged: (status) =>
                                  controller.updateStatus(student.id, status),
                              onNoteChanged: (note) =>
                                  controller.updateNote(student.id, note),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
      bottomNavigationBar: att.students.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              decoration: const BoxDecoration(
                color: Colors.transparent,
              ),
              child: SafeArea(
                top: false,
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    onPressed: isLocked || att.isSubmitting
                        ? null
                        : () async {
                            final outcome = await controller.submit(
                                circleId: circleId.toString());
                            if (!context.mounted ||
                                outcome == AttendanceSubmitOutcome.failed) {
                              return;
                            }
                            if (outcome ==
                                AttendanceSubmitOutcome.queuedOffline) {
                              AppSnackBar.info(
                                context,
                                'تم حفظ الحضور محلياً وسيُرفع تلقائياً عند عودة الاتصال.',
                              );
                            } else {
                              AppSnackBar.success(
                                context,
                                'تم حفظ الحضور بنجاح.',
                              );
                            }
                          },
                    icon: att.isSubmitting
                        ? const SizedBox.shrink()
                        : const Icon(Icons.save_outlined, size: 20),
                    label: att.isSubmitting
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2.5),
                          )
                        : const Text(
                            'حفظ الحضور',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
              ),
            ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final Color textColor;
  final Color bgColor;

  const _StatPill({
    required this.label,
    required this.value,
    required this.textColor,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w900,
                color: textColor,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentAttendanceCard extends StatelessWidget {
  final dynamic student;
  final AttendanceDraftItem draft;
  final bool isLocked;
  final ValueChanged<AttendanceStatus> onStatusChanged;
  final ValueChanged<String> onNoteChanged;

  const _StudentAttendanceCard({
    required this.student,
    required this.draft,
    required this.isLocked,
    required this.onStatusChanged,
    required this.onNoteChanged,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.borderColor, width: 0.8),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: Column(
        children: [
          Row(
            children: [
              // Avatar
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: primary,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    student.name.isNotEmpty ? student.name.trim()[0] : '؟',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              // Name
              Expanded(
                child: Text(
                  student.name,
                  style: TextStyle(
                    color: context.textPrimaryColor,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
              ),
              // Circular Icons Buttons Row
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _CircularStatusButton(
                    icon: Icons.check_circle_outline_rounded,
                    isSelected: draft.status == AttendanceStatus.present,
                    selectedColor: custom.success,
                    onTap: isLocked
                        ? null
                        : () => onStatusChanged(AttendanceStatus.present),
                  ),
                  const SizedBox(width: 6),
                  _CircularStatusButton(
                    icon: Icons.sick_outlined,
                    isSelected: draft.status == AttendanceStatus.excused,
                    selectedColor: custom.warning,
                    onTap: isLocked
                        ? null
                        : () => onStatusChanged(AttendanceStatus.excused),
                  ),
                  const SizedBox(width: 6),
                  _CircularStatusButton(
                    icon: Icons.highlight_off_rounded,
                    isSelected: draft.status == AttendanceStatus.absent,
                    selectedColor: Theme.of(context).colorScheme.error,
                    onTap: isLocked
                        ? null
                        : () => onStatusChanged(AttendanceStatus.absent),
                  ),
                  const SizedBox(width: 6),
                  _CircularStatusButton(
                    icon: Icons.schedule_rounded,
                    isSelected: draft.status == AttendanceStatus.late,
                    selectedColor: custom.accent,
                    onTap: isLocked
                        ? null
                        : () => onStatusChanged(AttendanceStatus.late),
                  ),
                ],
              ),
            ],
          ),

          // Excuse note field
          if (draft.status == AttendanceStatus.excused) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: context.surfaceColor,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: context.borderColor, width: 0.5),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      initialValue: draft.note,
                      enabled: !isLocked,
                      onChanged: onNoteChanged,
                      style: TextStyle(
                          fontSize: 13,
                          color: context.textPrimaryColor,
                          fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        hintText: 'سبب الغياب...',
                        hintStyle: TextStyle(
                            color: context.textSecondaryColor,
                            fontSize: 13,
                            fontWeight: FontWeight.w500),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Icon(Icons.error_outline_rounded,
                      color: custom.warning, size: 18),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CircularStatusButton extends StatelessWidget {
  final IconData icon;
  final bool isSelected;
  final Color selectedColor;
  final VoidCallback? onTap;

  const _CircularStatusButton({
    required this.icon,
    required this.isSelected,
    required this.selectedColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: isSelected ? selectedColor : context.surfaceColor,
          borderRadius: BorderRadius.circular(10),
          border:
              isSelected ? null : Border.all(color: context.borderColor, width: 0.8),
        ),
        child: Center(
          child: Icon(
            icon,
            size: 20,
            color: isSelected ? Colors.white : context.textSecondaryColor,
          ),
        ),
      ),
    );
  }
}
