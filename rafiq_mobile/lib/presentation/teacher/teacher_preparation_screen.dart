import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';

import '../../application/context/context_controller.dart';
import '../../application/teacher/teacher_panel_providers.dart';
import '../../core/constants/app_radius.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_snack_bar.dart';
import '../../data/models/teacher_panel_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/states/app_error_state.dart';
import '../shared/states/app_loading_state.dart';
import '../shared/widgets/leave_request_sheet.dart';
import '../shared/widgets/standard_app_bar.dart';

class TeacherPreparationScreen extends ConsumerStatefulWidget {
  const TeacherPreparationScreen({super.key});

  @override
  ConsumerState<TeacherPreparationScreen> createState() =>
      _TeacherPreparationScreenState();
}

class _TeacherPreparationScreenState
    extends ConsumerState<TeacherPreparationScreen> {
  final YearMonth _period = currentYearMonth();
  bool _isSubmitting = false;
  bool _isRequestingExcuse = false;

  Future<void> _refresh() async {
    ref.invalidate(teacherPreparationProvider(_period));
    await ref.read(teacherPreparationProvider(_period).future);
  }

  Future<Position?> _resolveCurrentLocation() async {
    try {
      var permission = await Geolocator.checkPermission().timeout(
        const Duration(seconds: 3),
        onTimeout: () => LocationPermission.denied,
      );
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission().timeout(
          const Duration(seconds: 5),
          onTimeout: () => LocationPermission.denied,
        );
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).timeout(const Duration(seconds: 8));
    } catch (_) {
      return null;
    }
  }

  Future<void> _submitAttendanceAction({
    required TeacherPreparationDto preparation,
    required bool isCheckIn,
  }) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      final position = await _resolveCurrentLocation();
      final dataSource = ref.read(teacherPanelRemoteDataSourceProvider);
      if (isCheckIn) {
        await dataSource.checkIn(
          circleId: preparation.circle.id,
          latitude: position?.latitude,
          longitude: position?.longitude,
        );
      } else {
        await dataSource.checkOut(
          circleId: preparation.circle.id,
          latitude: position?.latitude,
          longitude: position?.longitude,
        );
      }
      await _refresh();

      if (!mounted) return;
      AppSnackBar.success(
        context,
        isCheckIn ? 'تم تسجيل حضورك بنجاح' : 'تم تسجيل انصرافك بنجاح',
      );
    } catch (error) {
      if (!mounted) return;
      String message = 'تعذر إتمام العملية. تحقق من الاتصال ثم أعد المحاولة.';
      if (error is DioException && error.response?.data != null) {
        final data = error.response!.data;
        if (data is Map && data['message'] != null) {
          message = data['message'];
        } else if (data is Map &&
            data['error'] != null &&
            data['error']['message'] != null) {
          message = data['error']['message'];
        }
      }
      AppSnackBar.error(context, 'تعذر تنفيذ العملية: $message');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  static const List<String> _excuseTypes = [
    'مرض',
    'سفر',
    'ظرف عائلي',
    'موعد رسمي',
    'أخرى',
  ];

  Future<void> _requestExcuse(TeacherPreparationDto preparation) async {
    final noteController = TextEditingController();
    String? selectedType;

    final approved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => _ExcuseBottomSheet(
        excuseTypes: _excuseTypes,
        noteController: noteController,
        onSubmit: (type) {
          selectedType = type;
          Navigator.of(sheetCtx).pop(true);
        },
        onCancel: () => Navigator.of(sheetCtx).pop(false),
      ),
    );

    if (approved != true || selectedType == null) {
      noteController.dispose();
      return;
    }

    final note = noteController.text.trim();
    final reason = note.isEmpty ? selectedType! : '$selectedType - $note';

    setState(() => _isRequestingExcuse = true);
    try {
      await ref.read(teacherPanelRemoteDataSourceProvider).requestExcuse(
            centerId: preparation.circle.centerId,
            date: DateFormat('yyyy-MM-dd').format(preparation.today.date),
            reason: reason,
          );
      await _refresh();

      if (!mounted) return;
      AppSnackBar.success(context, 'تم إرسال طلب العذر بنجاح');
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.error(
        context,
        'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      noteController.dispose();
      if (mounted) setState(() => _isRequestingExcuse = false);
    }
  }

  static const List<String> _leaveTypes = [
    'MEDICAL',
    'OFFICIAL',
    'PERSONAL',
    'UNPAID',
  ];

  static const Map<String, String> _leaveTypeLabels = {
    'MEDICAL': 'إجازة مرضية',
    'OFFICIAL': 'إجازة رسمية',
    'PERSONAL': 'إجازة شخصية',
    'UNPAID': 'إجازة بدون راتب',
  };

  Future<void> _requestLeave(TeacherPreparationDto preparation) async {
    final reasonController = TextEditingController();
    final startDateController = TextEditingController();
    final endDateController = TextEditingController();
    String? selectedType;

    final approved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => LeaveRequestSheet(
        leaveTypes: _leaveTypes,
        leaveTypeLabels: _leaveTypeLabels,
        noteController: reasonController,
        startDateController: startDateController,
        endDateController: endDateController,
        onSubmit: (type) {
          selectedType = type;
          Navigator.of(sheetCtx).pop(true);
        },
        onCancel: () => Navigator.of(sheetCtx).pop(false),
      ),
    );

    if (approved != true || selectedType == null) {
      reasonController.dispose();
      startDateController.dispose();
      endDateController.dispose();
      return;
    }

    setState(() => _isRequestingExcuse = true);
    try {
      await ref.read(teacherPanelRemoteDataSourceProvider).requestLeave(
            centerId: preparation.circle.centerId,
            leaveType: selectedType!,
            startDate: startDateController.text.trim(),
            endDate: endDateController.text.trim(),
            reason: reasonController.text.trim(),
          );
      await _refresh();

      if (!mounted) return;
      AppSnackBar.success(context, 'تم إرسال طلب الإجازة بنجاح');
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.error(
        context,
        'تعذر إرسال طلب الإجازة. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      reasonController.dispose();
      startDateController.dispose();
      endDateController.dispose();
      if (mounted) setState(() => _isRequestingExcuse = false);
    }
  }

  Future<void> _selectActiveCircle(int circleId) async {
    await ref
        .read(contextControllerProvider.notifier)
        .selectCircle(circleId);
    if (!mounted) return;
    await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final preparationAsync = ref.watch(teacherPreparationProvider(_period));
    final theme = Theme.of(context);
    final custom = context.customColors;

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(
        title: 'تحضيري',
      ),
      body: preparationAsync.when(
        loading: () =>
            const AppLoadingState(message: 'جار تحميل بيانات تحضيري...'),
        error: (error, _) => AppErrorState(
          title: 'تعذر تحميل تحضيري',
          message: error.toString(),
          onRetry: _refresh,
        ),
        data: (preparation) {
          if (preparation == null) {
            return const AppEmptyState(
              title: 'لا توجد حلقة مرتبطة',
              subtitle: 'يجب اختيار الحلقة أولًا حتى يظهر سجل تحضيري.',
              icon: Icons.login_rounded,
            );
          }

          final timeline = _buildTimeline(preparation);
          final isBusy = _isSubmitting || _isRequestingExcuse;

          return RefreshIndicator(
            onRefresh: _refresh,
            color: theme.colorScheme.primary,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              children: [
                if (preparation.activeCircles.length > 1) ...[
                  _CircleSelectorCard(
                    preparation: preparation,
                    onChanged: _selectActiveCircle,
                  ),
                  const SizedBox(height: 16),
                ],
                // ── TODAY CARD ──────────────────────────────────────
                _TodayCard(
                  preparation: preparation,
                  isBusy: isBusy,
                  onCheckIn: () => _submitAttendanceAction(
                      preparation: preparation, isCheckIn: true),
                  onCheckOut: () => _submitAttendanceAction(
                      preparation: preparation, isCheckIn: false),
                  onRequestExcuse: () => _requestExcuse(preparation),
                  onRequestLeave: () => _requestLeave(preparation),
                ),

                const SizedBox(height: 28),

                // ── STATS ────────────────────────────────────────────
                const _SectionTitle(text: 'إحصائيات الشهر'),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(
                    child: _StatCard(
                      value: '${preparation.stats.totalDays}',
                      label: 'الإجمالي',
                      icon: Icons.calendar_month_rounded,
                      iconColor: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatCard(
                      value: '${preparation.stats.absentDays}',
                      label: 'أيام الغياب',
                      icon: Icons.cancel_outlined,
                      iconColor: theme.colorScheme.error,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatCard(
                      value: '${preparation.stats.presentDays}',
                      label: 'أيام الحضور',
                      icon: Icons.check_circle_outline_rounded,
                      iconColor: custom.success,
                    ),
                  ),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    child: _StatCard(
                      value: '${preparation.stats.excusedDays}',
                      label: 'أعذار مقبولة',
                      icon: Icons.info_outline_rounded,
                      iconColor: custom.warning,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatCard(
                      value: '${preparation.stats.onLeaveDays}',
                      label: 'أيام الإجازة',
                      icon: Icons.beach_access_rounded,
                      iconColor: custom.info,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Spacer(),
                ]),

                const SizedBox(height: 28),

                // ── HISTORY ──────────────────────────────────────────
                const _SectionTitle(text: 'سجل الحضور'),
                const SizedBox(height: 14),

                if (timeline.isEmpty)
                  const AppEmptyState(
                    title: 'لا يوجد سجل',
                    subtitle: 'سيظهر هنا سجل الحضور والمغادرة.',
                    icon: Icons.event_note_outlined,
                  )
                else
                  ...timeline.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _HistoryRow(item: item),
                    ),
                  ),

                const SizedBox(height: 48),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _TodayCard extends StatelessWidget {
  final TeacherPreparationDto preparation;
  final bool isBusy;
  final VoidCallback onCheckIn;
  final VoidCallback onCheckOut;
  final VoidCallback onRequestExcuse;
  final VoidCallback onRequestLeave;

  const _TodayCard({
    required this.preparation,
    required this.isBusy,
    required this.onCheckIn,
    required this.onCheckOut,
    required this.onRequestExcuse,
    required this.onRequestLeave,
  });

  @override
  Widget build(BuildContext context) {
    final status = preparation.today.status;
    final geo = preparation.today.geoCheck;
    final att = preparation.today.attendance;
    final custom = context.customColors;
    final theme = Theme.of(context);

    final isNotCheckedIn = status == 'not_checked_in';
    final isCheckedIn = status == 'checked_in';
    final isCheckedOut = status == 'checked_out';
    final isExcuse = status == 'excuse_requested';
    final isOnLeave = status == 'on_leave';

    final (statusLabel, statusColor, statusIcon) = status == 'on_leave'
        ? ('في إجازة', custom.warning, Icons.beach_access_rounded)
        : switch (status) {
            'checked_in' => (
                'حاضر',
                custom.success,
                Icons.check_circle_outline_rounded
              ),
            'checked_out' => ('غادر', context.textSecondaryColor, Icons.exit_to_app_rounded),
            'excuse_requested' => (
                'مُقدم عذر',
                custom.warning,
                Icons.info_outline_rounded
              ),
            _ => ('لم يُسجّل', context.textSecondaryColor, Icons.info_outline_rounded),
          };

    final isOutside = geo.state == 'outside_range';
    final hasGeoDetail =
        geo.distanceMeters != null || geo.allowedRadiusMeters != null;
    final showGeoBanners = isCheckedIn || isCheckedOut;

    final inTimeLabel = _fmtTime(att?.checkInTime);
    final outTimeLabel = _fmtTime(att?.checkOutTime);
    final shift = preparation.effectiveShift;

    return Container(
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: context.borderColor),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(statusIcon, color: statusColor, size: 22),
                const SizedBox(width: 6),
                Text(statusLabel,
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: statusColor)),
              ]),
              const Spacer(),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text('حالة اليوم',
                    style: TextStyle(
                        color: context.textSecondaryColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  DateFormat('EEEE، d MMMM y', 'ar')
                      .format(preparation.today.date),
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: context.textPrimaryColor),
                ),
              ]),
            ],
          ),

          const SizedBox(height: 18),

          _ShiftSummary(
            circleName: preparation.circle.name,
            locationText: preparation.circle.locationText,
            shiftStart: shift?.start,
            shiftEnd: shift?.end,
          ),
          const SizedBox(height: 18),

          if (showGeoBanners) ...[
            _GeoBanner(
              icon: Icons.location_on_outlined,
              text: isOutside && hasGeoDetail
                  ? 'خارج النطاق (${geo.distanceMeters} م / ${geo.allowedRadiusMeters} م)'
                  : geo.message,
              color: isOutside ? theme.colorScheme.error : custom.success,
              isAlert: isOutside,
            ),
            if (hasGeoDetail) ...[
              const SizedBox(height: 10),
              _GeoBanner(
                icon: Icons.location_on_rounded,
                text:
                    '${isOutside ? 'تم التسجيل من خارج النطاق' : 'داخل النطاق'} — المسافة ${geo.distanceMeters} متر',
                color: custom.warning,
                isAlert: false,
              ),
            ],
            const SizedBox(height: 18),
          ],

          if (isNotCheckedIn || isExcuse) ...[
            const Row(children: [
              Expanded(
                  child: _LocationPill(
                text: 'التحقق من الموقع',
                icon: Icons.location_on_outlined,
              )),
              SizedBox(width: 10),
              Expanded(
                  child: _LocationPill(
                text: 'التحقق من الموقع',
                icon: Icons.radar_outlined,
              )),
            ]),
            const SizedBox(height: 18),
          ],

          if (isCheckedIn && att?.checkInTime != null) ...[
            _TimeTile(
                label: 'وقت الوصول',
                time: inTimeLabel,
                icon: Icons.login_rounded),
            const SizedBox(height: 18),
          ],

          if (isCheckedOut && att != null) ...[
            Row(children: [
              Expanded(
                  child: _TimeTile(
                      label: 'وقت الوصول',
                      time: inTimeLabel,
                      icon: Icons.login_rounded)),
              const SizedBox(width: 12),
              Expanded(
                  child: _TimeTile(
                      label: 'وقت المغادرة',
                      time: outTimeLabel,
                      icon: Icons.logout_rounded)),
            ]),
            const SizedBox(height: 18),
          ],

          if (isNotCheckedIn) ...[
            _ActionButtons(
              isBusy: isBusy,
              onCheckIn: preparation.eligibility?.canCheckIn == true ? onCheckIn : null,
              onRequestExcuse: onRequestExcuse,
              onRequestLeave: onRequestLeave,
              errorMsg: preparation.eligibility?.checkInBlockedReasons.isNotEmpty == true 
                  ? preparation.eligibility!.checkInBlockedReasons.first 
                  : null,
            ),
          ] else if (isCheckedIn) ...[
            _CheckOutButton(
              isBusy: isBusy, 
              onCheckOut: preparation.eligibility?.canCheckOut == true ? onCheckOut : null,
            ),
          ] else if (isCheckedOut) ...[
            const _CompletionBadge(),
          ] else if (isExcuse) ...[
            _ExcusedBadge(),
          ] else if (isOnLeave) ...[
            const _OnLeaveBadge(),
          ],
        ],
      ),
    );
  }
}

class _CircleSelectorCard extends StatelessWidget {
  final TeacherPreparationDto preparation;
  final ValueChanged<int> onChanged;

  const _CircleSelectorCard({
    required this.preparation,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final selectedId = preparation.circle.id;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'اختيار الحلقة',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<int>(
            initialValue: preparation.activeCircles
                    .any((item) => item.circleId == selectedId)
                ? selectedId
                : preparation.activeCircles.first.circleId,
            decoration: InputDecoration(
              filled: true,
              fillColor: context.surfaceColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
            items: preparation.activeCircles
                .map(
                  (circle) => DropdownMenuItem<int>(
                    value: circle.circleId,
                    child: Text(circle.circleName),
                  ),
                )
                .toList(growable: false),
            onChanged: (value) {
              if (value != null && value != selectedId) {
                onChanged(value);
              }
            },
          ),
        ],
      ),
    );
  }
}

class _ShiftSummary extends StatelessWidget {
  final String circleName;
  final String? locationText;
  final DateTime? shiftStart;
  final DateTime? shiftEnd;

  const _ShiftSummary({
    required this.circleName,
    required this.locationText,
    required this.shiftStart,
    required this.shiftEnd,
  });

  @override
  Widget build(BuildContext context) {
    final shiftText = shiftStart == null || shiftEnd == null
        ? 'لا توجد وردية محددة لليوم'
        : '${_fmtTime(shiftStart)} - ${_fmtTime(shiftEnd)}';
    final custom = context.customColors;
    final isDark = context.isDark;
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? theme.colorScheme.surfaceContainerHighest : const Color(0xFFF7F8F5),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _InfoLine(
            icon: Icons.groups_rounded,
            label: circleName,
            color: theme.colorScheme.primary,
          ),
          const SizedBox(height: 8),
          _InfoLine(
            icon: Icons.schedule_rounded,
            label: shiftText,
            color: custom.warning,
          ),
          if (locationText != null) ...[
            const SizedBox(height: 8),
            _InfoLine(
              icon: Icons.place_outlined,
              label: locationText!,
              color: context.textSecondaryColor,
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _InfoLine({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              color: context.textPrimaryColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _OnLeaveBadge extends StatelessWidget {
  const _OnLeaveBadge();

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;
    final isDark = context.isDark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: custom.warning.withValues(alpha: isDark ? 0.18 : 0.10),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        'أنت في إجازة اليوم، ولا يلزم تسجيل حضور.',
        textAlign: TextAlign.center,
        style: TextStyle(
          color: custom.warning,
          fontWeight: FontWeight.w800,
          fontSize: 14,
        ),
      ),
    );
  }
}

class _GeoBanner extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  final bool isAlert;

  const _GeoBanner({
    required this.icon,
    required this.text,
    required this.color,
    required this.isAlert,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.18 : 0.10),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Text(text,
              style: TextStyle(
                  color: color, fontWeight: FontWeight.w700, fontSize: 13)),
        ),
      ]),
    );
  }
}

class _LocationPill extends StatelessWidget {
  final String text;
  final IconData icon;

  const _LocationPill({required this.text, required this.icon});

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: isDark ? theme.colorScheme.surfaceContainerHighest : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 15, color: context.textSecondaryColor),
        const SizedBox(width: 6),
        Flexible(
          child: Text(text,
              style: TextStyle(
                  color: context.textSecondaryColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis),
        ),
      ]),
    );
  }
}

class _TimeTile extends StatelessWidget {
  final String label;
  final String time;
  final IconData icon;

  const _TimeTile(
      {required this.label, required this.time, required this.icon});

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? theme.colorScheme.surfaceContainerHighest : const Color(0xFFF8F8F6),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(children: [
        Icon(icon, color: primary, size: 18),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: TextStyle(
                  color: context.textSecondaryColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(time,
              style: TextStyle(
                  color: context.textPrimaryColor,
                  fontSize: 17,
                  fontWeight: FontWeight.w900)),
        ]),
      ]),
    );
  }
}

class _ActionButtons extends StatelessWidget {
  final bool isBusy;
  final VoidCallback? onCheckIn;
  final VoidCallback onRequestExcuse;
  final VoidCallback onRequestLeave;
  final String? errorMsg;

  const _ActionButtons({
    required this.isBusy,
    required this.onCheckIn,
    required this.onRequestExcuse,
    required this.onRequestLeave,
    this.errorMsg,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    return Column(children: [
      if (errorMsg != null)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: theme.colorScheme.error.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.colorScheme.error.withValues(alpha: 0.15)),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline_rounded, size: 16, color: theme.colorScheme.error),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    errorMsg!,
                    style: TextStyle(
                      color: theme.colorScheme.error,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      Row(children: [
        Expanded(
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
            onPressed: isBusy ? null : onRequestExcuse,
            icon: const Icon(Icons.description_outlined, size: 18),
            label: Text(isBusy ? '...' : 'طلب عذر',
                style:
                    const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: primary,
              foregroundColor: theme.colorScheme.onPrimary,
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
            onPressed: isBusy ? null : onCheckIn,
            icon: isBusy
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        color: theme.colorScheme.onPrimary, strokeWidth: 2))
                : const Icon(Icons.login_rounded, size: 18),
            label: Text(isBusy ? '...' : 'تسجيل الحضور',
                style:
                    const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          ),
        ),
      ]),
      const SizedBox(height: 12),
      SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
          ),
          onPressed: isBusy ? null : onRequestLeave,
          icon: const Icon(Icons.beach_access_outlined, size: 18),
          label: Text(isBusy ? '...' : 'طلب إجازة',
              style:
                  const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        ),
      ),
    ]);
  }
}

class _CheckOutButton extends StatelessWidget {
  final bool isBusy;
  final VoidCallback? onCheckOut;

  const _CheckOutButton({required this.isBusy, required this.onCheckOut});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 15),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
        ),
        onPressed: isBusy ? null : onCheckOut,
        icon: isBusy
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    color: Theme.of(context).colorScheme.primary, strokeWidth: 2))
            : const Icon(Icons.logout_rounded, size: 18),
        label: Text(isBusy ? '...' : 'تسجيل المغادرة',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
      ),
    );
  }
}

class _CompletionBadge extends StatelessWidget {
  const _CompletionBadge();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        '✓ تم تسجيل الحضور والمغادرة',
        style: TextStyle(
          color: context.customColors.success,
          fontWeight: FontWeight.w800,
          fontSize: 15,
        ),
      ),
    );
  }
}

class _ExcusedBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: custom.warning.withValues(alpha: context.isDark ? 0.18 : 0.10),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text('تم رفع طلب العذر وبانتظار المراجعة.',
          textAlign: TextAlign.center,
          style: TextStyle(
              color: custom.warning, fontWeight: FontWeight.w700, fontSize: 14)),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      textAlign: TextAlign.right,
      style: TextStyle(
          fontSize: 18, fontWeight: FontWeight.w800, color: context.textPrimaryColor),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color iconColor;

  const _StatCard({
    required this.value,
    required this.label,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: context.textPrimaryColor)),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: isDark ? 0.20 : 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerRight,
          child: Text(label,
              style: TextStyle(
                  color: context.textSecondaryColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ),
      ]),
    );
  }
}

class _HistoryItem {
  final DateTime date;
  final String dayName;
  final String formattedDate;
  final String status;
  final String? timeRange;
  final String? note;

  const _HistoryItem({
    required this.date,
    required this.dayName,
    required this.formattedDate,
    required this.status,
    this.timeRange,
    this.note,
  });
}

class _HistoryRow extends StatelessWidget {
  final _HistoryItem item;

  const _HistoryRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final isExcuse = item.status == 'EXCUSED';
    final isAbsent = item.status == 'ABSENT';
    final isOnLeave = item.status == 'ON_LEAVE';
    final showBadge = isExcuse || isAbsent || isOnLeave;
    final custom = context.customColors;
    final isDark = context.isDark;

    final Color badgeColor = isAbsent ? Theme.of(context).colorScheme.error : custom.warning;
    final String badgeLabel = isOnLeave ? 'إجازة' : (isExcuse ? 'مرض' : 'غياب');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(children: [
        Icon(
          showBadge ? Icons.cancel_outlined : Icons.exit_to_app_rounded,
          color: showBadge ? badgeColor : custom.success,
          size: 24,
        ),
        const SizedBox(width: 12),

        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(item.dayName,
              style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: context.textPrimaryColor)),
          const SizedBox(height: 2),
          Text(item.formattedDate,
              style: TextStyle(
                  color: context.textSecondaryColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
          if (item.note != null && item.note!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              item.note!,
              style: TextStyle(
                color: context.textSecondaryColor,
                fontSize: 11,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ]),

        const Spacer(),

        if (showBadge)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: badgeColor.withValues(alpha: isDark ? 0.18 : 0.10),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(badgeLabel,
                style: TextStyle(
                    color: badgeColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 12)),
          )
        else if (item.timeRange != null)
          Row(children: [
            Icon(Icons.location_on_outlined, color: custom.success, size: 15),
            const SizedBox(width: 4),
            Text(item.timeRange!,
                style: TextStyle(
                    color: context.textSecondaryColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
          ]),
      ]),
    );
  }
}

List<_HistoryItem> _buildTimeline(TeacherPreparationDto preparation) {
  final items = <_HistoryItem>[];
  final recordsByDate = {
    for (final r in preparation.history)
      DateFormat('yyyy-MM-dd').format(r.attendanceDate): r,
  };

  for (final record in preparation.history) {
    final status = record.status.toUpperCase();
    final inT = record.checkInTime != null
        ? DateFormat('hh:mm').format(record.checkInTime!)
        : null;
    final outT = record.checkOutTime != null
        ? DateFormat('hh:mm').format(record.checkOutTime!)
        : null;
    final timeRange =
        (inT != null && outT != null) ? '$outT → $inT' : inT ?? outT;

    items.add(_HistoryItem(
      date: record.attendanceDate,
      dayName: DateFormat('EEEE', 'ar').format(record.attendanceDate),
      formattedDate: DateFormat('yyyy/MM/dd').format(record.attendanceDate),
      status: status,
      timeRange: timeRange,
      note: record.note,
    ));
  }

  for (final excuse in preparation.excuses) {
    final date = DateTime.tryParse(excuse['absenceDate']?.toString() ?? '');
    if (date == null) continue;
    final key = DateFormat('yyyy-MM-dd').format(date);
    if (recordsByDate.containsKey(key)) continue;

    items.add(_HistoryItem(
      date: date,
      dayName: DateFormat('EEEE', 'ar').format(date),
      formattedDate: DateFormat('yyyy/MM/dd').format(date),
      status: 'EXCUSED',
      timeRange: null,
      note: excuse['reason']?.toString(),
    ));
  }

  items.sort((a, b) => b.date.compareTo(a.date));
  return items;
}

String _fmtTime(DateTime? value) {
  if (value == null) return '--:--';
  return DateFormat('hh:mm a', 'ar').format(value.toLocal());
}

class _ExcuseBottomSheet extends StatefulWidget {
  final List<String> excuseTypes;
  final TextEditingController noteController;
  final ValueChanged<String> onSubmit;
  final VoidCallback onCancel;

  const _ExcuseBottomSheet({
    required this.excuseTypes,
    required this.noteController,
    required this.onSubmit,
    required this.onCancel,
  });

  @override
  State<_ExcuseBottomSheet> createState() => _ExcuseBottomSheetState();
}

class _ExcuseBottomSheetState extends State<_ExcuseBottomSheet> {
  String? _selectedType;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    return Container(
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 24 + bottomPadding),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: context.borderColor,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ),
          const SizedBox(height: 20),

          Row(
            children: [
              Expanded(
                child: Text(
                  'طلب عذر غياب',
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: context.textPrimaryColor,
                  ),
                ),
              ),
              GestureDetector(
                onTap: widget.onCancel,
                child: Icon(Icons.close_rounded,
                    color: context.textSecondaryColor, size: 22),
              ),
            ],
          ),
          const SizedBox(height: 24),

          Text(
            'نوع العذر',
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 8),

          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: primary, width: 1.5),
            ),
            child: DropdownButtonHideUnderline(
              child: ButtonTheme(
                alignedDropdown: true,
                child: DropdownButton<String>(
                  value: _selectedType,
                  dropdownColor: context.cardColor,
                  hint: Text(
                    'اختر نوع العذر',
                    style: TextStyle(color: context.textSecondaryColor, fontSize: 15),
                  ),
                  icon: Icon(Icons.keyboard_arrow_down_rounded,
                      color: context.textSecondaryColor),
                  isExpanded: true,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  items: widget.excuseTypes.map((type) {
                    return DropdownMenuItem<String>(
                      value: type,
                      child: Text(
                        type,
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: context.textPrimaryColor,
                        ),
                      ),
                    );
                  }).toList(),
                  onChanged: (value) => setState(() => _selectedType = value),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'وصف العذر (اختياري)',
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: widget.noteController,
            maxLines: 4,
            style: TextStyle(color: context.textPrimaryColor),
            decoration: const InputDecoration(
              hintText: 'اكتب تفاصيل العذر...',
            ),
          ),
          const SizedBox(height: 24),

          SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                foregroundColor: theme.colorScheme.onPrimary,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
              ),
              onPressed: _selectedType == null
                  ? null
                  : () => widget.onSubmit(_selectedType!),
              icon: const Icon(Icons.send_rounded, size: 20),
              label: const Text(
                'إرسال الطلب',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
