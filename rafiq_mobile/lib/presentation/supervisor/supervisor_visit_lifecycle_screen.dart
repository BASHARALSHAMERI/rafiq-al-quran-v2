import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../application/context/context_controller.dart';
import '../../application/org/org_providers.dart';
import '../../application/supervisor/supervisor_visit_providers.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/org_dtos.dart';
import '../../data/models/supervisor_visit_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/widgets/custom_text_field.dart';
import '../shared/widgets/enterprise_card.dart';
import '../shared/widgets/primary_button.dart';
import '../shared/widgets/section_header.dart';
import '../shared/widgets/skeleton_loader.dart';
import '../shared/widgets/standard_app_bar.dart';

const _attendanceTaskKey = 'attendance_task_completed';

const _defaultChecklist = [
  {'key': 'teacher_on_time', 'label': 'المعلم حاضر في الموعد'},
  {'key': 'circle_prepared', 'label': 'الحلقة منظمة ومجهزة'},
  {'key': _attendanceTaskKey, 'label': 'سجل الحضور مكتمل'},
  {'key': 'individual_recitation', 'label': 'التسميع يتم بشكل فردي'},
  {'key': 'tajweed_follow_up', 'label': 'المعلم يتابع أخطاء التجويد'},
  {'key': 'students_engaged', 'label': 'الطلاب ملتزمون ومتفاعلون'},
];

class SupervisorVisitLifecycleScreen extends ConsumerStatefulWidget {
  final int circleId;
  final SupervisorVisitLogDto? initialLog;
  final int? initialPlanItemId;

  const SupervisorVisitLifecycleScreen({
    super.key,
    required this.circleId,
    this.initialLog,
    this.initialPlanItemId,
  });

  @override
  ConsumerState<SupervisorVisitLifecycleScreen> createState() =>
      _SupervisorVisitLifecycleScreenState();
}

class _SupervisorVisitLifecycleScreenState
    extends ConsumerState<SupervisorVisitLifecycleScreen> {
  late final List<Map<String, dynamic>> _checklist = _defaultChecklist
      .map(
        (item) => {
          'key': item['key'],
          'label': item['label'],
          'checked': false,
        },
      )
      .toList(growable: true);

  final _notesController = TextEditingController();
  Timer? _timer;
  SupervisorVisitLogDto? _visitLog;
  Duration _elapsed = Duration.zero;
  int _rating = 0;
  bool _isStarting = false;
  bool _isEnding = false;

  @override
  void initState() {
    super.initState();
    _visitLog = widget.initialLog;
    if (_visitLog?.isOpen == true) {
      _startTimer(_visitLog!.startedAt);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _notesController.dispose();
    super.dispose();
  }

  void _startTimer(DateTime startedAt) {
    _timer?.cancel();
    _elapsed = DateTime.now().difference(startedAt);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _elapsed = DateTime.now().difference(startedAt));
    });
  }

  void _toggleItem(int index) {
    setState(() {
      _checklist[index]['checked'] = !(_checklist[index]['checked'] as bool);
    });
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
        desiredAccuracy: LocationAccuracy.medium,
      ).timeout(const Duration(seconds: 8));
    } catch (_) {
      return null;
    }
  }

  Future<void> _startVisit(OrgCircleDto circle) async {
    if (_isStarting || _visitLog?.isOpen == true) return;
    setState(() => _isStarting = true);
    try {
      final position = await _resolveCurrentLocation();
      final log =
          await ref.read(supervisorVisitRemoteDataSourceProvider).startVisit(
                centerId: circle.centerId,
                circleId: circle.id,
                planItemId: widget.initialPlanItemId,
                latitude: position?.latitude,
                longitude: position?.longitude,
              );
      ref.invalidate(supervisorTodayVisitsProvider);
      if (!mounted) return;
      setState(() {
        _visitLog = log;
        _isStarting = false;
      });
      _startTimer(log.startedAt);
      _showSnack('تم بدء الزيارة الإشرافية.', AppColors.successLight);
    } catch (error) {
      if (!mounted) return;
      setState(() => _isStarting = false);
      _showSnack(
          'تعذر بدء الزيارة: ${_readError(error)}', AppColors.errorLight);
    }
  }

  Future<void> _endVisit() async {
    final log = _visitLog;
    if (log == null || !log.isOpen || _isEnding) return;

    final attendanceTaskCompleted = _checklist.any(
      (item) => item['key'] == _attendanceTaskKey && item['checked'] == true,
    );
    if (!attendanceTaskCompleted) {
      _showSnack(
        'اعتمد مهمة الحضور من القائمة قبل إنهاء الزيارة.',
        AppColors.warningLight,
      );
      return;
    }

    setState(() => _isEnding = true);
    try {
      final position = await _resolveCurrentLocation();
      final updated =
          await ref.read(supervisorVisitRemoteDataSourceProvider).endVisit(
                logId: log.id,
                latitude: position?.latitude,
                longitude: position?.longitude,
                checklist: _checklist,
                rating: _rating > 0 ? _rating : null,
                observations: _notesController.text,
              );
      ref.invalidate(supervisorTodayVisitsProvider);
      if (!mounted) return;
      _timer?.cancel();
      setState(() {
        _visitLog = updated;
        _isEnding = false;
      });
      _showSnack('تم إنهاء الزيارة وحفظ التقرير.', AppColors.successLight);
    } catch (error) {
      if (!mounted) return;
      setState(() => _isEnding = false);
      _showSnack(
          'تعذر إنهاء الزيارة: ${_readError(error)}', AppColors.errorLight);
    }
  }

  void _showSnack(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String _readError(Object error) {
    if (error is DioException) {
      final payload = error.response?.data;
      if (payload is Map) {
        final message = payload['message'] ?? payload['error'];
        if (message is String && message.trim().isNotEmpty) return message;
      }
    }
    return error.toString();
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(contextControllerProvider);
    final centerId = int.tryParse(contextState.selectedCenterId ?? '');
    final circlesAsync = ref.watch(orgCirclesProvider(centerId));

    return Scaffold(
      appBar: const StandardAppBar(
        title: 'زيارة الحلقة',
        subtitle: 'دورة زيارة إشرافية مرتبطة بالخطة',
      ),
      body: circlesAsync.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: const [
            SkeletonCardLoader(),
            SkeletonCardLoader(),
            SkeletonCardLoader(),
          ],
        ),
        error: (error, _) => AppEmptyState(
          title: 'تعذر تحميل الحلقة',
          subtitle: error.toString(),
          icon: Icons.error_outline_rounded,
          actionLabel: 'إعادة المحاولة',
          onAction: () => ref.invalidate(orgCirclesProvider(centerId)),
        ),
        data: (circles) {
          final circle = _findCircle(circles, widget.circleId);
          if (circle == null) {
            return AppEmptyState(
              title: 'الحلقة غير موجودة',
              subtitle: 'لم يتم العثور على الحلقة ضمن نطاقك الحالي.',
              icon: Icons.group_off_rounded,
              actionLabel: 'العودة',
              onAction: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go('/');
                }
              },
            );
          }

          final completedCount =
              _checklist.where((item) => item['checked'] == true).length;
          final isOpen = _visitLog?.isOpen == true;
          final isDone = _visitLog != null && !isOpen;

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: [
              _VisitStatusCard(
                circle: circle,
                log: _visitLog,
                elapsed: _elapsed,
              ).animate().fadeIn().slideY(begin: 0.04, end: 0),
              const SizedBox(height: AppSpacing.lg),
              if (!isOpen && !isDone)
                PrimaryButton(
                  label: 'بدء الزيارة',
                  onPressed: _isStarting ? null : () => _startVisit(circle),
                  icon: Icons.play_arrow_rounded,
                  isLoading: _isStarting,
                )
              else if (isOpen)
                PrimaryButton(
                  label: 'إنهاء الزيارة وحفظ التقرير',
                  onPressed: _isEnding ? null : _endVisit,
                  icon: Icons.stop_circle_rounded,
                  isLoading: _isEnding,
                )
              else
                const _CompletedVisitBanner(),
              const SizedBox(height: AppSpacing.lg),
              SectionHeader(
                title: 'قائمة التحقق ($completedCount/${_checklist.length})',
              ),
              const SizedBox(height: AppSpacing.sm),
              ...List.generate(
                _checklist.length,
                (index) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: _ChecklistItemCard(
                    label: _checklist[index]['label'] as String,
                    checked: _checklist[index]['checked'] as bool,
                    enabled: isOpen,
                    onTap: () => _toggleItem(index),
                  ).animate().fadeIn(delay: (35 * index).ms),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              const SectionHeader(title: 'التقييم العام'),
              const SizedBox(height: AppSpacing.sm),
              _RatingCard(
                rating: _rating,
                enabled: isOpen,
                onChanged: (value) => setState(() => _rating = value),
              ),
              const SizedBox(height: AppSpacing.lg),
              const SectionHeader(title: 'ملاحظات الزيارة'),
              const SizedBox(height: AppSpacing.sm),
              EnterpriseCard(
                child: CustomTextField(
                  controller: _notesController,
                  readOnly: !isOpen,
                  hintText: 'أضف الملاحظات أو ما تم الاتفاق عليه...',
                  maxLines: 5,
                  minLines: 5,
                ),
              ),
              const SizedBox(height: 96),
            ],
          );
        },
      ),
    );
  }
}

OrgCircleDto? _findCircle(List<OrgCircleDto> circles, int id) {
  for (final circle in circles) {
    if (circle.id == id) return circle;
  }
  return null;
}

class _VisitStatusCard extends StatelessWidget {
  final OrgCircleDto circle;
  final SupervisorVisitLogDto? log;
  final Duration elapsed;

  const _VisitStatusCard({
    required this.circle,
    required this.log,
    required this.elapsed,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isOpen = log?.isOpen == true;
    final isDone = log != null && !isOpen;

    return EnterpriseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  circle.name,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              _StatusPill(
                label: isOpen
                    ? 'جارية'
                    : isDone
                        ? 'مكتملة'
                        : 'لم تبدأ',
                color: isOpen
                    ? AppColors.warningLight
                    : isDone
                        ? AppColors.successLight
                        : AppColors.textSecondaryLight,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _InfoRow(
            icon: Icons.person_outline_rounded,
            text: circle.teacherName?.trim().isNotEmpty == true
                ? 'المعلم: ${circle.teacherName}'
                : 'المعلم غير محدد',
          ),
          const SizedBox(height: AppSpacing.sm),
          _InfoRow(
            icon: Icons.groups_rounded,
            text: 'عدد الطلاب: ${circle.studentsCount}',
            iconColor: AppColors.successLight,
          ),
          const SizedBox(height: AppSpacing.sm),
          _InfoRow(
            icon: Icons.timer_rounded,
            text: isOpen
                ? 'المدة: ${_formatDuration(elapsed)}'
                : isDone
                    ? 'مدة الزيارة: ${log?.durationMinutes ?? 0} دقيقة'
                    : 'ابدأ الزيارة لتفعيل المؤقت',
            iconColor: AppColors.primaryLight,
          ),
          if (log != null) ...[
            const SizedBox(height: AppSpacing.sm),
            _InfoRow(
              icon: Icons.location_on_outlined,
              text: 'حالة الموقع: ${_geoLabel(log!.startGeoState)}',
              iconColor: AppColors.infoLight,
            ),
          ],
        ],
      ),
    );
  }
}

class _ChecklistItemCard extends StatelessWidget {
  final String label;
  final bool checked;
  final bool enabled;
  final VoidCallback onTap;

  const _ChecklistItemCard({
    required this.label,
    required this.checked,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(18),
      child: EnterpriseCard(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          children: [
            Icon(
              checked ? Icons.check_circle_rounded : Icons.circle_outlined,
              color: checked
                  ? AppColors.successLight
                  : AppColors.textSecondaryLight,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RatingCard extends StatelessWidget {
  final int rating;
  final bool enabled;
  final ValueChanged<int> onChanged;

  const _RatingCard({
    required this.rating,
    required this.enabled,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(5, (index) {
          final value = index + 1;
          return IconButton(
            onPressed: enabled ? () => onChanged(value) : null,
            icon: Icon(
              value <= rating ? Icons.star_rounded : Icons.star_border_rounded,
              color: AppColors.warningLight,
              size: 32,
            ),
          );
        }),
      ),
    );
  }
}

class _CompletedVisitBanner extends StatelessWidget {
  const _CompletedVisitBanner();

  @override
  Widget build(BuildContext context) {
    return const EnterpriseCard(
      accentColor: AppColors.successLight,
      child: Row(
        children: [
          Icon(Icons.check_circle_rounded, color: AppColors.successLight),
          SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'تم إنهاء الزيارة وحفظها ضمن سجل الزيارات الإشرافية.',
              style: TextStyle(
                color: AppColors.successLight,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusPill({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color iconColor;

  const _InfoRow({
    required this.icon,
    required this.text,
    this.iconColor = AppColors.textSecondaryLight,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: iconColor),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

String _formatDuration(Duration duration) {
  final hours = duration.inHours;
  final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
  final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
  return hours > 0 ? '$hours:$minutes:$seconds' : '$minutes:$seconds';
}

String _geoLabel(String state) {
  switch (state.toUpperCase()) {
    case 'INSIDE':
      return 'داخل النطاق';
    case 'OUTSIDE':
      return 'خارج النطاق';
    default:
      return 'لم يرسل الموقع';
  }
}
