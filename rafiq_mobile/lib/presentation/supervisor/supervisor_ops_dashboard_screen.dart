import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/supervisor/supervisor_ops_providers.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/supervisor_ops_dtos.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/standard_app_bar.dart';

class SupervisorOpsDashboardScreen extends ConsumerStatefulWidget {
  const SupervisorOpsDashboardScreen({super.key});

  @override
  ConsumerState<SupervisorOpsDashboardScreen> createState() =>
      _SupervisorOpsDashboardScreenState();
}

class _SupervisorOpsDashboardScreenState
    extends ConsumerState<SupervisorOpsDashboardScreen> {
  int _selectedMonth = DateTime.now().month;
  final int _selectedYear = DateTime.now().year;

  final List<String> _monthNames = [
    '',
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];

  @override
  Widget build(BuildContext context) {
    final reportKey = (
      month: _selectedMonth,
      year: _selectedYear,
    );
    final dashboardAsync = ref.watch(supervisorOpsDashboardProvider(reportKey));

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: StandardAppBar(
        title: 'لوحة العمليات',
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () =>
                ref.invalidate(supervisorOpsDashboardProvider(reportKey)),
          ),
        ],
      ),
      body: dashboardAsync.when(
        loading: () => const PageStateView.loading(),
        error: (err, stack) => PageStateView.error(
          title: 'حدث خطأ في التحميل',
          message: _formatError(err),
          actionLabel: 'إعادة المحاولة',
          onAction: () =>
              ref.invalidate(supervisorOpsDashboardProvider(reportKey)),
        ),
        data: (dashboard) => _buildContent(context, dashboard),
      ),
    );
  }

  String _formatError(Object err) {
    if (err is DioException) {
      final msg = err.message;
      if (msg != null && msg.trim().isNotEmpty) return msg.trim();
    }
    return err.toString();
  }

  Widget _buildContent(
      BuildContext context, SupervisorOpsDashboardDto d) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final custom = context.customColors;
    final isDark = context.isDark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Month selector
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 12,
              itemBuilder: (context, index) {
                final month = index + 1;
                final isSelected = month == _selectedMonth;
                final isFuture = _selectedYear == DateTime.now().year &&
                    month > DateTime.now().month;
                return Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: GestureDetector(
                    onTap: () {
                      if (isFuture) return;
                      setState(() => _selectedMonth = month);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? primary
                            : (isFuture
                                ? (isDark ? Colors.grey.shade800 : Colors.grey.shade200)
                                : context.cardColor),
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        border: Border.all(
                            color: isSelected
                                ? primary
                                : context.borderColor),
                      ),
                      child: Text(
                        _monthNames[month],
                        style: TextStyle(
                          color: isSelected
                              ? theme.colorScheme.onPrimary
                              : (isFuture
                                  ? (isDark ? Colors.grey.shade600 : Colors.grey.shade400)
                                  : context.textSecondaryColor),
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w500,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ).animate().fadeIn(),
          const SizedBox(height: AppSpacing.lg),

          // Profile name
          Text(
            '${d.profile.fullName} — ${_monthNames[d.period.month]} ${d.period.year}',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // Hours & Visits stats
          Row(
            children: [
              Expanded(
                child: _buildProgressCard(
                  context: context,
                  title: 'ساعات الدوام',
                  value: '${d.hours.worked.toStringAsFixed(1)}h',
                  target: '${d.hours.target}h',
                  pct: d.hours.progressPct,
                  color: primary,
                  icon: Icons.access_time_rounded,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildProgressCard(
                  context: context,
                  title: 'الزيارات',
                  value: '${d.visits.completed}',
                  target: '${d.visits.target}',
                  pct: d.visits.progressPct,
                  color: custom.success,
                  icon: Icons.location_on_rounded,
                ),
              ),
            ],
          ).animate().fadeIn().slideY(begin: 0.1, end: 0),
          const SizedBox(height: AppSpacing.md),

          // Visits breakdown
          _buildSectionTitle(context, 'تفاصيل الزيارات'),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              _buildMiniStat(context, 'مكتملة', d.visits.completed, custom.success),
              _buildMiniStat(context, 'جارية', d.visits.inProgress, custom.warning),
              _buildMiniStat(context, 'الكل', d.visits.total, custom.info),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              _buildMiniStat(context, 'خطة منجزة', d.visits.planCompleted, custom.success),
              _buildMiniStat(context, 'خطة معلقة', d.visits.planPending, custom.warning),
              _buildMiniStat(context, 'خطة فائتة', d.visits.planMissed, theme.colorScheme.error),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Assignments
          _buildSectionTitle(context, 'المراكز المسندة (${d.assignments.centersCount})'),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: d.assignments.centerList
                .map((c) => AppCard(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      child: Text(
                        c.name,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: context.textPrimaryColor,
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Unvisited
          if (d.unvisitedCircles.isNotEmpty) ...[
            _buildSectionTitle(context, 'حلقات لم تُزر'),
            const SizedBox(height: AppSpacing.sm),
            ...d.unvisitedCircles.map((c) => _buildUnvisitedItem(
                  context,
                  c.name,
                  c.centerName,
                  Icons.circle_outlined,
                )),
            const SizedBox(height: AppSpacing.lg),
          ],

          if (d.unvisitedCenters.isNotEmpty) ...[
            _buildSectionTitle(context, 'مراكز لم تُزر'),
            const SizedBox(height: AppSpacing.sm),
            ...d.unvisitedCenters.map((c) => _buildUnvisitedItem(
                  context,
                  c.name,
                  '',
                  Icons.business_outlined,
                )),
            const SizedBox(height: AppSpacing.lg),
          ],

          // Recent visits
          if (d.recentVisits.isNotEmpty) ...[
            _buildSectionTitle(context, 'آخر الزيارات'),
            const SizedBox(height: AppSpacing.sm),
            ...d.recentVisits.map((v) => _buildRecentVisitItem(context, v)),
            const SizedBox(height: AppSpacing.lg),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        color: context.textPrimaryColor,
      ),
    );
  }

  Widget _buildProgressCard({
    required BuildContext context,
    required String title,
    required String value,
    required String target,
    required int pct,
    required Color color,
    required IconData icon,
  }) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: context.textSecondaryColor)),
              Icon(icon, size: 18, color: color),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(value,
                  style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: context.textPrimaryColor)),
              const SizedBox(width: 4),
              Text('/ $target',
                  style: TextStyle(
                      fontSize: 12,
                      color: context.textSecondaryColor)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (pct / 100).clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: context.borderColor,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text('$pct%',
              style: TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }

  Widget _buildMiniStat(BuildContext context, String label, int value, Color color) {
    final isDark = context.isDark;

    return Expanded(
      child: Container(
        margin: const EdgeInsets.all(2),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: isDark ? 0.16 : 0.08),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: color.withValues(alpha: isDark ? 0.28 : 0.2)),
        ),
        child: Column(
          children: [
            Text('$value',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    fontSize: 10, color: context.textSecondaryColor)),
          ],
        ),
      ),
    );
  }

  Widget _buildUnvisitedItem(BuildContext context, String name, String centerName, IconData icon) {
    final errColor = Theme.of(context).colorScheme.error;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: errColor),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: context.textPrimaryColor)),
                if (centerName.isNotEmpty)
                  Text(centerName,
                      style: TextStyle(
                          fontSize: 11, color: context.textSecondaryColor)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentVisitItem(BuildContext context, SupervisorOpsRecentVisitDto v) {
    final ended = v.endedAt != null;
    final duration = v.durationMinutes != null
        ? '${v.durationMinutes! ~/ 60}h ${v.durationMinutes! % 60}m'
        : '—';
    final date = DateFormat('dd/MM').format(v.startedAt);
    final custom = context.customColors;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: ended ? custom.success : custom.warning,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.centerName,
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: context.textPrimaryColor)),
                  if (v.circleName != null && v.circleName!.isNotEmpty)
                    Text(v.circleName!,
                        style: TextStyle(
                            fontSize: 11, color: context.textSecondaryColor)),
                  Row(
                    children: [
                      Text(date,
                          style: TextStyle(
                              fontSize: 11, color: context.textSecondaryColor)),
                      const SizedBox(width: 8),
                      Text(duration,
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: context.textPrimaryColor)),
                    ],
                  ),
                ],
              ),
            ),
            if (v.rating != null)
              Row(
                children: [
                  Icon(Icons.star_rounded,
                      size: 14, color: custom.warning),
                  const SizedBox(width: 2),
                  Text('${v.rating}',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: context.textPrimaryColor)),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
