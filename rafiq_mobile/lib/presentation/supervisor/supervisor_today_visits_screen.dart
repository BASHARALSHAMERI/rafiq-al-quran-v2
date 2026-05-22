import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../application/context/context_controller.dart';
import '../../application/org/org_providers.dart';
import '../../application/supervisor/supervisor_visit_providers.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/org_dtos.dart';
import '../../data/models/supervisor_visit_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/states/app_error_state.dart';
import '../shared/states/app_loading_state.dart';
import '../shared/widgets/enterprise_card.dart';
import '../shared/widgets/primary_button.dart';
import '../shared/widgets/section_header.dart';
import '../shared/widgets/standard_app_bar.dart';

class SupervisorTodayVisitsScreen extends ConsumerStatefulWidget {
  const SupervisorTodayVisitsScreen({super.key});

  @override
  ConsumerState<SupervisorTodayVisitsScreen> createState() =>
      _SupervisorTodayVisitsScreenState();
}

class _SupervisorTodayVisitsScreenState
    extends ConsumerState<SupervisorTodayVisitsScreen> {
  int? _startingPlanItemId;
  bool _startingEmergency = false;

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

  Future<void> _startPlanItem(SupervisorVisitPlanItemDto item) async {
    if (_startingPlanItemId != null) return;
    setState(() => _startingPlanItemId = item.id);
    try {
      final position = await _resolveCurrentLocation();
      final log =
          await ref.read(supervisorVisitRemoteDataSourceProvider).startVisit(
                centerId: item.centerId,
                circleId: item.circleId,
                planItemId: item.id,
                latitude: position?.latitude,
                longitude: position?.longitude,
              );
      ref.invalidate(supervisorTodayVisitsProvider);
      if (!mounted) return;
      setState(() => _startingPlanItemId = null);
      if (item.circleId != null) {
        context.push(
          RouteNames.supervisorHalqaVisit(item.circleId!),
          extra: {'log': log, 'planItemId': item.id},
        );
      } else {
        _showSnack('تم بدء زيارة المركز الطارئة ضمن سجل اليوم.',
            AppColors.successLight);
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _startingPlanItemId = null);
      _showSnack(
          'تعذر بدء الزيارة: ${_readError(error)}', AppColors.errorLight);
    }
  }

  Future<void> _startEmergencyVisit(List<OrgCircleDto> circles) async {
    if (_startingEmergency) return;
    final selected = await showModalBottomSheet<OrgCircleDto>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            const Text(
              'اختر الحلقة للزيارة الطارئة',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
            ),
            const SizedBox(height: AppSpacing.md),
            ...circles.map(
              (circle) => ListTile(
                leading: const Icon(Icons.groups_rounded),
                title: Text(circle.name),
                subtitle: Text(circle.teacherName ?? 'المعلم غير محدد'),
                onTap: () => Navigator.of(context).pop(circle),
              ),
            ),
          ],
        ),
      ),
    );
    if (selected == null) return;

    setState(() => _startingEmergency = true);
    try {
      final position = await _resolveCurrentLocation();
      final log =
          await ref.read(supervisorVisitRemoteDataSourceProvider).startVisit(
                centerId: selected.centerId,
                circleId: selected.id,
                latitude: position?.latitude,
                longitude: position?.longitude,
              );
      ref.invalidate(supervisorTodayVisitsProvider);
      if (!mounted) return;
      setState(() => _startingEmergency = false);
      context.push(
        RouteNames.supervisorHalqaVisit(selected.id),
        extra: {'log': log},
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _startingEmergency = false);
      _showSnack('تعذر بدء الزيارة الطارئة: ${_readError(error)}',
          AppColors.errorLight);
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
    final visitsAsync = ref.watch(supervisorTodayVisitsProvider);
    final centerId = int.tryParse(
        ref.watch(contextControllerProvider).selectedCenterId ?? '');
    final circlesAsync = ref.watch(orgCirclesProvider(centerId));

    return Scaffold(
      appBar: const StandardAppBar(
        title: 'زيارات اليوم',
        subtitle: 'الخطة اليومية والزيارات المكتملة',
      ),
      body: visitsAsync.when(
        loading: () =>
            const AppLoadingState(message: 'جاري تحميل زيارات اليوم...'),
        error: (error, _) => AppErrorState(
          title: 'تعذر تحميل زيارات اليوم',
          message: error.toString(),
          onRetry: () => ref.invalidate(supervisorTodayVisitsProvider),
        ),
        data: (data) {
          final openLogs = data.logs.where((log) => log.isOpen).toList();
          final completedLogs = data.logs.where((log) => !log.isOpen).toList();
          final circles = circlesAsync.valueOrNull ?? const <OrgCircleDto>[];

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(supervisorTodayVisitsProvider);
              await ref.read(supervisorTodayVisitsProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                PrimaryButton(
                  label: 'زيارة طارئة',
                  onPressed: circles.isEmpty || _startingEmergency
                      ? null
                      : () => _startEmergencyVisit(circles),
                  icon: Icons.add_location_alt_rounded,
                  isLoading: _startingEmergency,
                ),
                const SizedBox(height: AppSpacing.lg),
                SectionHeader(
                  title: 'الزيارات المخططة (${data.plannedItems.length})',
                ),
                const SizedBox(height: AppSpacing.sm),
                if (data.plannedItems.isEmpty)
                  const AppEmptyState(
                    title: 'لا توجد زيارات مخططة اليوم',
                    subtitle: 'يمكنك بدء زيارة طارئة عند الحاجة.',
                    icon: Icons.event_available_rounded,
                  )
                else
                  ...data.plannedItems.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: _PlanItemCard(
                        item: item,
                        isStarting: _startingPlanItemId == item.id,
                        onStart: () => _startPlanItem(item),
                      ).animate().fadeIn(),
                    ),
                  ),
                const SizedBox(height: AppSpacing.lg),
                SectionHeader(title: 'الجارية (${openLogs.length})'),
                const SizedBox(height: AppSpacing.sm),
                if (openLogs.isEmpty)
                  const _CompactEmpty(text: 'لا توجد زيارة جارية الآن.')
                else
                  ...openLogs.map(
                    (log) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: _VisitLogCard(log: log),
                    ),
                  ),
                const SizedBox(height: AppSpacing.lg),
                SectionHeader(title: 'المكتملة (${completedLogs.length})'),
                const SizedBox(height: AppSpacing.sm),
                if (completedLogs.isEmpty)
                  const _CompactEmpty(text: 'لم تكتمل أي زيارة اليوم.')
                else
                  ...completedLogs.map(
                    (log) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: _VisitLogCard(log: log),
                    ),
                  ),
                const SizedBox(height: 96),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _PlanItemCard extends StatelessWidget {
  final SupervisorVisitPlanItemDto item;
  final bool isStarting;
  final VoidCallback onStart;

  const _PlanItemCard({
    required this.item,
    required this.isStarting,
    required this.onStart,
  });

  @override
  Widget build(BuildContext context) {
    final date = DateFormat('EEEE، d MMMM', 'ar').format(item.plannedDate);

    return EnterpriseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.circle?.name ?? item.center?.name ?? 'زيارة مركز',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ),
              _Pill(label: item.priority, color: AppColors.warningLight),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          _InfoLine(icon: Icons.event_rounded, text: date),
          if (item.plannedTimeWindow != null) ...[
            const SizedBox(height: AppSpacing.xs),
            _InfoLine(
                icon: Icons.schedule_rounded, text: item.plannedTimeWindow!),
          ],
          if (item.notes != null) ...[
            const SizedBox(height: AppSpacing.xs),
            _InfoLine(icon: Icons.notes_rounded, text: item.notes!),
          ],
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: 'بدء الزيارة',
            onPressed: isStarting ? null : onStart,
            icon: Icons.play_arrow_rounded,
            isLoading: isStarting,
          ),
        ],
      ),
    );
  }
}

class _VisitLogCard extends StatelessWidget {
  final SupervisorVisitLogDto log;

  const _VisitLogCard({required this.log});

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      child: Row(
        children: [
          Icon(
            log.isOpen ? Icons.timer_rounded : Icons.check_circle_rounded,
            color: log.isOpen ? AppColors.warningLight : AppColors.successLight,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  log.circle?.name ?? log.center?.name ?? 'زيارة',
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                Text(
                  log.isOpen
                      ? 'بدأت ${DateFormat('hh:mm a', 'ar').format(log.startedAt)}'
                      : 'المدة ${log.durationMinutes ?? 0} دقيقة',
                  style: const TextStyle(color: AppColors.textSecondaryLight),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompactEmpty extends StatelessWidget {
  final String text;

  const _CompactEmpty({required this.text});

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppColors.textSecondaryLight),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final Color color;

  const _Pill({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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

class _InfoLine extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoLine({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 17, color: AppColors.textSecondaryLight),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}
