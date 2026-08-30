import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../application/context/context_controller.dart';
import '../../application/org/org_providers.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/org_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/widgets/standard_app_bar.dart';

class SupervisorCirclesScreen extends ConsumerWidget {
  const SupervisorCirclesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contextState = ref.watch(contextControllerProvider);
    final centerId = contextState.selectedCenterId;
    final selectedCircleId = contextState.selectedCircleId;
    final circlesAsync = ref.watch(orgCirclesProvider(centerId));

    return Scaffold(
      backgroundColor: context.surfaceColor,
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
    final custom = context.customColors;
    final primary = Theme.of(context).colorScheme.primary;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(
        children: [
          Expanded(
            child: _StatTile(
              label: 'الإجمالي',
              value: '$totalCount',
              color: primary,
              icon: Icons.groups_rounded,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: _StatTile(
              label: 'النشطة',
              value: '$activeCount',
              color: custom.success,
              icon: Icons.check_circle_rounded,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: _StatTile(
              label: 'الانحرافات',
              value: '$alertsCount',
              color: custom.warning,
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
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.16 : 0.08),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: color,
                ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: context.textSecondaryColor,
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
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(
          color: isCurrent ? primary : context.borderColor,
          width: isCurrent ? 1.5 : 1,
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
                            color: context.textPrimaryColor,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      circle.centerName ?? 'المركز الحالي',
                      style: TextStyle(
                        fontSize: 12,
                        color: context.textSecondaryColor,
                      ),
                    ),
                  ],
                ),
              ),
              _StatusBadge(
                label: circle.isActive ? 'نشطة' : 'متوقفة',
                color: circle.isActive
                    ? custom.success
                    : Theme.of(context).colorScheme.error,
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
              style: TextStyle(
                fontSize: 13,
                color: context.textSecondaryColor,
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
                      color: custom.warning,
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
    final isDark = context.isDark;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? theme.colorScheme.surfaceContainerHighest : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: theme.colorScheme.primary),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: context.textPrimaryColor,
            ),
          ),
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
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.18 : 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w800,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _CurrentCircleBanner extends StatelessWidget {
  const _CurrentCircleBanner();

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final isDark = context.isDark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: primary.withValues(alpha: isDark ? 0.18 : 0.08),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle_rounded, color: primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'هذه هي الحلقة المحددة حاليًا في سياق التطبيق.',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: context.textPrimaryColor,
                fontSize: 13,
              ),
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
