import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../application/context/context_controller.dart';
import '../../application/org/org_providers.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../shared/widgets/standard_app_bar.dart';
import '../../data/models/org_dtos.dart';
import '../shared/states/app_empty_state.dart';

class SupervisorCirclesScreen extends ConsumerWidget {
  const SupervisorCirclesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contextState = ref.watch(contextControllerProvider);
    final centerId = int.tryParse(contextState.selectedCenterId ?? '');
    final selectedCircleId = int.tryParse(contextState.selectedCircleId ?? '');
    final circlesAsync = ref.watch(orgCirclesProvider(centerId));

    return Scaffold(
      appBar: const StandardAppBar(title: 'الحلقات المكلف بها'),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(orgCirclesProvider(centerId)),
        child: circlesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              AppEmptyState(
                title: 'تعذر تحميل الحلقات',
                subtitle: error.toString(),
                icon: Icons.error_outline_rounded,
                actionLabel: 'إعادة المحاولة',
                onAction: () => ref.invalidate(orgCirclesProvider(centerId)),
              ),
            ],
          ),
          data: (circles) {
            if (circles.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  AppEmptyState(
                    title: 'لا توجد حلقات',
                    subtitle: 'لم يتم العثور على حلقات ضمن نطاق المركز الحالي.',
                    icon: Icons.groups_rounded,
                  ),
                ],
              );
            }

            final activeCount = circles.where((item) => item.isActive).length;
            final alertsCount = circles.where(_hasAlert).length;

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                _CirclesSummaryCard(
                  totalCount: circles.length,
                  activeCount: activeCount,
                  alertsCount: alertsCount,
                )
                    .animate()
                    .fadeIn()
                    .slideY(begin: -0.1, end: 0, duration: 400.ms),
                const SizedBox(height: AppSpacing.md),
                ...List.generate(circles.length, (index) {
                  final circle = circles[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: _CircleCard(
                      circle: circle,
                      isCurrent: selectedCircleId == circle.id,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: (100 + index * 50).ms)
                      .slideY(begin: 0.1, end: 0, duration: 300.ms);
                }),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _CirclesSummaryCard extends StatelessWidget {
  final int totalCount;
  final int activeCount;
  final int alertsCount;

  const _CirclesSummaryCard({
    required this.totalCount,
    required this.activeCount,
    required this.alertsCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          Expanded(
            child: _StatTile(
              label: 'الإجمالي',
              value: '$totalCount',
              color: AppColors.primaryLight,
              icon: Icons.groups_rounded,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: _StatTile(
              label: 'النشطة',
              value: '$activeCount',
              color: AppColors.successLight,
              icon: Icons.check_circle_rounded,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: _StatTile(
              label: 'الانحرافات',
              value: '$alertsCount',
              color: AppColors.warningLight,
              icon: Icons.warning_amber_rounded,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  const _StatTile({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
          ),
        ],
      ),
    );
  }
}

class _CircleCard extends StatelessWidget {
  final OrgCircleDto circle;
  final bool isCurrent;

  const _CircleCard({
    required this.circle,
    required this.isCurrent,
  });

  @override
  Widget build(BuildContext context) {
    final alerts = _circleAlerts(circle);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isCurrent ? AppColors.primaryLight : AppColors.borderLight,
          width: isCurrent ? 1.4 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      circle.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      circle.centerName ?? 'المركز الحالي',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                    ),
                  ],
                ),
              ),
              _StatusBadge(
                label: circle.isActive ? 'نشطة' : 'متوقفة',
                color: circle.isActive
                    ? AppColors.successLight
                    : AppColors.errorLight,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _InfoChip(
                icon: Icons.person_rounded,
                text: circle.teacherName ?? 'لم يحدد المعلم',
              ),
              _InfoChip(
                icon: Icons.people_rounded,
                text: '${circle.studentsCount} طالب',
              ),
              _InfoChip(
                icon: Icons.schedule_rounded,
                text: circle.weeklyScheduleCount > 0
                    ? '${circle.weeklyScheduleCount} مواعيد'
                    : 'بلا جدول',
              ),
            ],
          ),
          if ((circle.locationText ?? '').trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              circle.locationText!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
            ),
          ],
          if (alerts.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: alerts
                  .map(
                    (alert) => _StatusBadge(
                      label: alert,
                      color: AppColors.warningLight,
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
          if (isCurrent) ...[
            const SizedBox(height: AppSpacing.md),
            const _CurrentCircleBanner(),
          ],
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoChip({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primaryLight),
          const SizedBox(width: 6),
          Text(text),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusBadge({
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _CurrentCircleBanner extends StatelessWidget {
  const _CurrentCircleBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        children: [
          Icon(Icons.check_circle_rounded, color: AppColors.primaryLight),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'هذه هي الحلقة المحددة حاليًا في سياق التطبيق.',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

bool _hasAlert(OrgCircleDto circle) =>
    !circle.isActive ||
    circle.studentsCount == 0 ||
    circle.weeklyScheduleCount == 0;

List<String> _circleAlerts(OrgCircleDto circle) {
  final alerts = <String>[];
  if (!circle.isActive) {
    alerts.add('الحلقة غير نشطة');
  }
  if (circle.studentsCount == 0) {
    alerts.add('لا يوجد طلاب');
  }
  if (circle.weeklyScheduleCount == 0) {
    alerts.add('لا يوجد جدول');
  }
  return alerts;
}
