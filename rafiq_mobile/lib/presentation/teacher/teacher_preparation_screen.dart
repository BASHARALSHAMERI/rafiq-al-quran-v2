import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';

import '../../application/context/context_controller.dart';
import '../../application/teacher/teacher_panel_providers.dart';
import '../../data/models/teacher_panel_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/states/app_error_state.dart';
import '../shared/states/app_loading_state.dart';
import '../shared/widgets/leave_request_sheet.dart';
import '../shared/widgets/standard_app_bar.dart';

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const _kGreen = Color(0xFF4C9872);
const _kRed = Color(0xFFC65D65);
const _kOrange = Color(0xFFDDA638);
const _kGray = Color(0xFF8A9BAE);
const _kCardBg = Colors.white;
const _kPageBg = Color(0xFFF7F8F5);

// ─────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────
class TeacherPreparationScreen extends ConsumerStatefulWidget {
  const TeacherPreparationScreen({super.key});

  @override
  ConsumerState<TeacherPreparationScreen> createState() =>
      _TeacherPreparationScreenState();
}

class _TeacherPreparationScreenState
    extends ConsumerState<TeacherPreparationScreen> {
  // Always load current month – month navigation removed as per user request
  final YearMonth _period = currentYearMonth();
  bool _isSubmitting = false;
  bool _isRequestingExcuse = false;

  Future<void> _refresh() async {
    ref.invalidate(teacherPreparationProvider(_period));
    await ref.read(teacherPreparationProvider(_period).future);
  }

  Future<Position?> _resolveCurrentLocation() async {
    try {
      // Check permission quickly without blocking
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

      // Only send coordinates when the device returns a real location.
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      ).timeout(const Duration(seconds: 8));
    } catch (_) {
      return null;
    }
  }

  Future<void> _submitAttendanceAction({
    required TeacherPreparationDto preparation,
    required bool isCheckIn,
  }) async {
    if (_isSubmitting) return; // Guard against double-tap
    setState(() => _isSubmitting = true);
    try {
      // Get location in parallel — don't block the action
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
      // Refresh provider data and wait for it
      await _refresh();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: _kGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: Row(children: [
          const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
          const SizedBox(width: 12),
          Text(
            isCheckIn ? 'تم تسجيل حضورك بنجاح' : 'تم تسجيل انصرافك بنجاح',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700),
          ),
        ]),
      ));
    } catch (error) {
      if (!mounted) return;
      String message = error.toString();
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: Colors.red.shade700,
        content: Text(
          'تعذر تنفيذ العملية: $message',
          style: const TextStyle(color: Colors.white),
        ),
      ));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  // ── Excuse type options (frontend-only enum merged into reason string)
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

    // Merge excuseType + optional note into the `reason` field
    final note = noteController.text.trim();
    final reason = note.isEmpty ? selectedType! : '$selectedType - $note';

    setState(() => _isRequestingExcuse = true);
    try {
      await ref.read(teacherPanelRemoteDataSourceProvider).requestExcuse(
            centerId: preparation.circle.centerId,
            date: DateFormat('yyyy-MM-dd').format(preparation.today.date),
            reason: reason,
          );
      // Refresh provider data and wait for it
      await _refresh();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: _kGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: const Row(children: [
          Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
          SizedBox(width: 12),
          Text(
            'تم إرسال طلب العذر بنجاح',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          ),
        ]),
      ));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: _kRed,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: Text('تعذر إرسال الطلب: $error'),
      ));
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: _kGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: const Row(children: [
          Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
          SizedBox(width: 12),
          Text(
            'تم إرسال طلب الإجازة بنجاح',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          ),
        ]),
      ));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: _kRed,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: Text('تعذر إرسال طلب الإجازة: $error'),
      ));
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
        .selectCircle('$circleId');
    if (!mounted) return;
    await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final preparationAsync = ref.watch(teacherPreparationProvider(_period));

    return Scaffold(
      backgroundColor: _kPageBg,
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
            color: _kGreen,
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
                      iconColor: _kGreen,
                      iconBg: const Color(0xFFEFF9F4),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatCard(
                      value: '${preparation.stats.absentDays}',
                      label: 'أيام الغياب',
                      icon: Icons.cancel_outlined,
                      iconColor: _kRed,
                      iconBg: const Color(0xFFFCF2F2),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatCard(
                      value: '${preparation.stats.presentDays}',
                      label: 'أيام الحضور',
                      icon: Icons.check_circle_outline_rounded,
                      iconColor: _kGreen,
                      iconBg: const Color(0xFFEFF9F4),
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
                      iconColor: _kOrange,
                      iconBg: const Color(0xFFFEF9EF),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatCard(
                      value: '${preparation.stats.onLeaveDays}',
                      label: 'أيام الإجازة',
                      icon: Icons.beach_access_rounded,
                      iconColor: _kOrange,
                      iconBg: const Color(0xFFFEF9EF),
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

// ─────────────────────────────────────────────
//  TODAY CARD  — mirrors the 3 screenshot states
// ─────────────────────────────────────────────
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

    final isNotCheckedIn = status == 'not_checked_in';
    final isCheckedIn = status == 'checked_in';
    final isCheckedOut = status == 'checked_out';
    final isExcuse = status == 'excuse_requested';
    final isOnLeave = status == 'on_leave';

    // Status label + colour (right side header)
    final (statusLabel, statusColor, statusIcon) = status == 'on_leave'
        ? ('في إجازة', _kOrange, Icons.beach_access_rounded)
        : switch (status) {
            'checked_in' => (
                'حاضر',
                _kGreen,
                Icons.check_circle_outline_rounded
              ),
            'checked_out' => ('غادر', _kGray, Icons.exit_to_app_rounded),
            'excuse_requested' => (
                'مُقدم عذر',
                _kOrange,
                Icons.info_outline_rounded
              ),
            _ => ('لم يُسجّل', _kGray, Icons.info_outline_rounded),
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
        color: _kCardBg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ────────────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status (left — shown right of date in RTL)
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
              // Date (right — shown left in RTL, small label above)
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                const Text('حالة اليوم',
                    style: TextStyle(
                        color: Colors.black45,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  DateFormat('EEEE، d MMMM y', 'ar')
                      .format(preparation.today.date),
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Colors.black87),
                ),
              ]),
            ],
          ),

          const SizedBox(height: 18),

          // ── Geo banners (visible after check-in) ──────────
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
              color: isOutside ? _kRed : _kGreen,
              isAlert: isOutside,
            ),
            if (hasGeoDetail) ...[
              const SizedBox(height: 10),
              _GeoBanner(
                icon: Icons.location_on_rounded,
                text:
                    '${isOutside ? 'تم التسجيل من خارج النطاق' : 'داخل النطاق'} — المسافة ${geo.distanceMeters} متر',
                color: _kOrange,
                isAlert: false,
              ),
            ],
            const SizedBox(height: 18),
          ],

          // ── Location pills (visible when NOT checked in) ────
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

          // ── Times ─────────────────────────────────────────
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

          // ── Action buttons — conditional on status ─────────
          if (isNotCheckedIn) ...[
            _ActionButtons(
              isBusy: isBusy,
              onCheckIn: _isWithinShift(shift) ? onCheckIn : null,
              onRequestExcuse: onRequestExcuse,
              onRequestLeave: onRequestLeave,
              isOutsideShift: !_isWithinShift(shift),
            ),
          ] else if (isCheckedIn) ...[
            _CheckOutButton(isBusy: isBusy, onCheckOut: onCheckOut),
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

// ─────────────────────────────────────────────
//  GEO BANNER (red / orange full-width strip)
// ─────────────────────────────────────────────
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
        color: _kCardBg,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'اختيار الحلقة',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              color: Colors.black87,
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
              fillColor: const Color(0xFFF7F8F5),
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

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F8F5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _InfoLine(
            icon: Icons.groups_rounded,
            label: circleName,
            color: _kGreen,
          ),
          const SizedBox(height: 8),
          _InfoLine(
            icon: Icons.schedule_rounded,
            label: shiftText,
            color: _kOrange,
          ),
          if (locationText != null) ...[
            const SizedBox(height: 8),
            _InfoLine(
              icon: Icons.place_outlined,
              label: locationText!,
              color: _kGray,
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
            style: const TextStyle(
              color: Colors.black87,
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: _kOrange.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Text(
        'ط£ظ†طھ ظپظٹ ط¥ط¬ط§ط²ط© ط§ظ„ظٹظˆظ…طŒ ظˆظ„ط§ ظٹظ„ط²ظ… طھط³ط¬ظٹظ„ ط­ط¶ظˆط±.',
        textAlign: TextAlign.center,
        style: TextStyle(
          color: _kOrange,
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
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

// ─────────────────────────────────────────────
//  LOCATION PILL (before check-in)
// ─────────────────────────────────────────────
class _LocationPill extends StatelessWidget {
  final String text;
  final IconData icon;

  const _LocationPill({required this.text, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 15, color: Colors.black45),
        const SizedBox(width: 6),
        Flexible(
          child: Text(text,
              style: const TextStyle(
                  color: Colors.black54,
                  fontSize: 12,
                  fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis),
        ),
      ]),
    );
  }
}

// ─────────────────────────────────────────────
//  TIME TILE (وقت الوصول / وقت المغادرة)
// ─────────────────────────────────────────────
class _TimeTile extends StatelessWidget {
  final String label;
  final String time;
  final IconData icon;

  const _TimeTile(
      {required this.label, required this.time, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F8F6),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(children: [
        Icon(icon, color: _kGreen, size: 18),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: const TextStyle(
                  color: Colors.black45,
                  fontSize: 11,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(time,
              style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 18,
                  fontWeight: FontWeight.w900)),
        ]),
      ]),
    );
  }
}

// ─────────────────────────────────────────────
//  ACTION BUTTONS (not_checked_in state)
// ─────────────────────────────────────────────
class _ActionButtons extends StatelessWidget {
  final bool isBusy;
  final VoidCallback? onCheckIn;
  final VoidCallback onRequestExcuse;
  final VoidCallback onRequestLeave;

  final bool isOutsideShift;

  const _ActionButtons({
    required this.isBusy,
    required this.onCheckIn,
    required this.onRequestExcuse,
    required this.onRequestLeave,
    this.isOutsideShift = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      if (isOutsideShift)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _kRed.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _kRed.withValues(alpha: 0.15)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline_rounded, size: 16, color: _kRed),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'تسجيل الحضور متاح فقط خلال موعد الحلقة (±30 دقيقة)',
                    style: TextStyle(
                      color: _kRed,
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
        // طلب عذر (outline)
        Expanded(
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              foregroundColor: Colors.black87,
              side: const BorderSide(color: Colors.black12, width: 1.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: isBusy ? null : onRequestExcuse,
            icon: const Icon(Icons.description_outlined, size: 18),
            label: Text(isBusy ? '...' : 'طلب عذر',
                style:
                    const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          ),
        ),
        const SizedBox(width: 12),
        // تسجيل الحضور (filled green)
        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: isOutsideShift ? _kGray : _kGreen,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: (isBusy || isOutsideShift) ? null : onCheckIn,
            icon: isBusy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2))
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
            foregroundColor: Colors.black87,
            side: const BorderSide(color: Colors.black12, width: 1.5),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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

// ─────────────────────────────────────────────
//  CHECK-OUT BUTTON  (checked_in state)
// ─────────────────────────────────────────────
class _CheckOutButton extends StatelessWidget {
  final bool isBusy;
  final VoidCallback onCheckOut;

  const _CheckOutButton({required this.isBusy, required this.onCheckOut});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 15),
          foregroundColor: Colors.black87,
          side: const BorderSide(color: Colors.black12, width: 1.5),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        onPressed: isBusy ? null : onCheckOut,
        icon: isBusy
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    color: Colors.black54, strokeWidth: 2))
            : const Icon(Icons.logout_rounded, size: 18),
        label: Text(isBusy ? '...' : 'تسجيل المغادرة',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  COMPLETION BADGE (checked_out state)
// ─────────────────────────────────────────────
class _CompletionBadge extends StatelessWidget {
  const _CompletionBadge();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        '✓ تم تسجيل الحضور والمغادرة',
        style: TextStyle(
          color: _kGreen,
          fontWeight: FontWeight.w800,
          fontSize: 15,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  EXCUSED BADGE
// ─────────────────────────────────────────────
class _ExcusedBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: _kOrange.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Text('تم رفع طلب العذر وبانتظار المراجعة.',
          textAlign: TextAlign.center,
          style: TextStyle(
              color: _kOrange, fontWeight: FontWeight.w700, fontSize: 14)),
    );
  }
}

// ─────────────────────────────────────────────
//  SECTION TITLE
// ─────────────────────────────────────────────
class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      textAlign: TextAlign.right,
      style: const TextStyle(
          fontSize: 19, fontWeight: FontWeight.w900, color: Colors.black87),
    );
  }
}

// ─────────────────────────────────────────────
//  STAT CARD  (إجمالي / غياب / حضور)
//  Mirrors the mockup: number + label left, icon circle right
// ─────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;

  const _StatCard({
    required this.value,
    required this.label,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: _kCardBg,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(children: [
        // Number + icon
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(value,
                style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: Colors.black87)),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
              child: Icon(icon, color: iconColor, size: 20),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerRight,
          child: Text(label,
              style: const TextStyle(
                  color: Colors.black45,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ),
      ]),
    );
  }
}

// ─────────────────────────────────────────────
//  HISTORY ROW
//  Right: day name + date | Left: time range + location icon | OR excuse badge
// ─────────────────────────────────────────────
class _HistoryItem {
  final DateTime date;
  final String dayName;
  final String formattedDate;
  final String status; // PRESENT | LATE | EXCUSED | ABSENT
  final String? timeRange; // 'HH:mm → HH:mm' or null
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

    final Color badgeColor = isAbsent ? _kRed : _kOrange;
    final String badgeLabel = isOnLeave ? 'إجازة' : (isExcuse ? 'مرض' : 'غياب');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: _kCardBg,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(children: [
        // ── Right icon (nav arrow or X)
        Icon(
          showBadge ? Icons.cancel_outlined : Icons.exit_to_app_rounded,
          color: showBadge ? badgeColor : _kGreen,
          size: 24,
        ),
        const SizedBox(width: 12),

        // ── Day + Date
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(item.dayName,
              style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: Colors.black87)),
          const SizedBox(height: 2),
          Text(item.formattedDate,
              style: const TextStyle(
                  color: Colors.black45,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
          if (item.note != null && item.note!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              item.note!,
              style: const TextStyle(
                color: Colors.black54,
                fontSize: 11,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ]),

        const Spacer(),

        // ── Left side: time range OR badge
        if (showBadge)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: badgeColor.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(badgeLabel,
                style: TextStyle(
                    color: badgeColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 13)),
          )
        else if (item.timeRange != null)
          Row(children: [
            const Icon(Icons.location_on_outlined, color: _kGreen, size: 15),
            const SizedBox(width: 4),
            Text(item.timeRange!,
                style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
          ]),
      ]),
    );
  }
}

// ─────────────────────────────────────────────
//  HELPER: build timeline from DTO
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  HELPER: format time
// ─────────────────────────────────────────────
String _fmtTime(DateTime? value) {
  if (value == null) return '--:--';
  return DateFormat('hh:mm a', 'ar').format(value.toLocal());
}

bool _isWithinShift(TeacherEffectiveShiftDto? shift) {
  if (shift == null) return true; // No shift defined, allow check-in
  final now = DateTime.now();
  
  // Add 30 mins grace period before and after
  final start = shift.start.subtract(const Duration(minutes: 30));
  final end = shift.end.add(const Duration(minutes: 30));
  
  // Normalize dates to today for comparison if they are only times
  final nowTime = now.hour * 60 + now.minute;
  final startTime = start.hour * 60 + start.minute;
  final endTime = end.hour * 60 + end.minute;
  
  return nowTime >= startTime && nowTime <= endTime;
}

// ─────────────────────────────────────────────
//  EXCUSE BOTTOM SHEET
//  Matches the web mockup: type dropdown + optional note + send button
// ─────────────────────────────────────────────
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

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 24 + bottomPadding),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.black12,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Title row
          Row(
            children: [
              const Expanded(
                child: Text(
                  'طلب عذر غياب',
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Colors.black87,
                  ),
                ),
              ),
              GestureDetector(
                onTap: widget.onCancel,
                child: const Icon(Icons.close_rounded,
                    color: Colors.black45, size: 22),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // ── Excuse type label
          const Text(
            'نوع العذر',
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),

          // ── Dropdown
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _kGreen, width: 1.5),
            ),
            child: DropdownButtonHideUnderline(
              child: ButtonTheme(
                alignedDropdown: true,
                child: DropdownButton<String>(
                  value: _selectedType,
                  hint: const Text(
                    'اختر نوع العذر',
                    style: TextStyle(color: Colors.black45, fontSize: 15),
                  ),
                  icon: const Icon(Icons.keyboard_arrow_down_rounded,
                      color: Colors.black54),
                  isExpanded: true,
                  borderRadius: BorderRadius.circular(16),
                  items: widget.excuseTypes.map((type) {
                    return DropdownMenuItem<String>(
                      value: type,
                      child: Text(
                        type,
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
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

          // ── Note field
          const Text(
            'وصف العذر (اختياري)',
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: widget.noteController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'اكتب تفاصيل العذر...',
              hintStyle: const TextStyle(color: Colors.black38, fontSize: 14),
              filled: true,
              fillColor: const Color(0xFFF8F8F8),
              contentPadding: const EdgeInsets.all(14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Colors.black12, width: 0.8),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Colors.black12, width: 0.8),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: _kGreen, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // ── Submit button
          SizedBox(
            height: 52,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    _selectedType != null ? _kGreen : Colors.black12,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
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
