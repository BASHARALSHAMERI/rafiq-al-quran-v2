import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
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
    final theme = Theme.of(context);
    final reportKey = (
      month: _selectedMonth,
      year: _selectedYear,
    );
    final dashboardAsync = ref.watch(supervisorOpsDashboardProvider(reportKey));

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
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
        data: (dashboard) => _buildContent(context, theme, dashboard),
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
      BuildContext context, ThemeData theme, SupervisorOpsDashboardDto d) {
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
                            ? AppColors.primaryLight
                            : (isFuture
                                ? Colors.grey.shade200
                                : AppColors.cardLight),
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        border: Border.all(
                            color: isSelected
                                ? AppColors.primaryLight
                                : AppColors.borderLight),
                      ),
                      child: Text(
                        _monthNames[month],
                        style: TextStyle(
                          color: isSelected
                              ? Colors.white
                              : (isFuture
                                  ? Colors.grey.shade400
                                  : AppColors.textSecondaryLight),
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
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // Hours & Visits stats
          Row(
            children: [
              Expanded(
                child: _buildProgressCard(
                  title: 'ساعات الدوام',
                  value: '${d.hours.worked.toStringAsFixed(1)}h',
                  target: '${d.hours.target}h',
                  pct: d.hours.progressPct,
                  color: AppColors.primaryLight,
                  icon: Icons.access_time_rounded,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildProgressCard(
                  title: 'الزيارات',
                  value: '${d.visits.completed}',
                  target: '${d.visits.target}',
                  pct: d.visits.progressPct,
                  color: AppColors.successLight,
                  icon: Icons.location_on_rounded,
                ),
              ),
            ],
          ).animate().fadeIn().slideY(begin: 0.1, end: 0),
          const SizedBox(height: AppSpacing.md),

          // Visits breakdown
          _buildSectionTitle('تفاصيل الزيارات'),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              _buildMiniStat('مكتملة', d.visits.completed, AppColors.successLight),
              _buildMiniStat('جارية', d.visits.inProgress, AppColors.warningLight),
              _buildMiniStat('الكل', d.visits.total, AppColors.infoLight),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              _buildMiniStat('خطة منجزة', d.visits.planCompleted, AppColors.successLight),
              _buildMiniStat('خطة معلقة', d.visits.planPending, AppColors.warningLight),
              _buildMiniStat('خطة فائتة', d.visits.planMissed, AppColors.errorLight),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Assignments
          _buildSectionTitle('المراكز المسندة (${d.assignments.centersCount})'),
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
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Unvisited
          if (d.unvisitedCircles.isNotEmpty) ...[
            _buildSectionTitle('حلقات لم تُزر'),
            const SizedBox(height: AppSpacing.sm),
            ...d.unvisitedCircles.map((c) => _buildUnvisitedItem(
                  c.name,
                  c.centerName,
                  Icons.circle_outlined,
                )),
            const SizedBox(height: AppSpacing.lg),
          ],

          if (d.unvisitedCenters.isNotEmpty) ...[
            _buildSectionTitle('مراكز لم تُزر'),
            const SizedBox(height: AppSpacing.sm),
            ...d.unvisitedCenters.map((c) => _buildUnvisitedItem(
                  c.name,
                  '',
                  Icons.business_outlined,
                )),
            const SizedBox(height: AppSpacing.lg),
          ],

          // Recent visits
          if (d.recentVisits.isNotEmpty) ...[
            _buildSectionTitle('آخر الزيارات'),
            const SizedBox(height: AppSpacing.sm),
            ...d.recentVisits.map((v) => _buildRecentVisitItem(v)),
            const SizedBox(height: AppSpacing.lg),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        color: AppColors.textPrimaryLight,
      ),
    );
  }

  Widget _buildProgressCard({
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
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondaryLight)),
              Icon(icon, size: 18, color: color),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(value,
                  style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimaryLight)),
              const SizedBox(width: 4),
              Text('/ $target',
                  style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondaryLight)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (pct / 100).clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: AppColors.borderLight,
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

  Widget _buildMiniStat(String label, int value, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.all(2),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Text('$value',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(
                    fontSize: 10, color: AppColors.textSecondaryLight)),
          ],
        ),
      ),
    );
  }

  Widget _buildUnvisitedItem(String name, String centerName, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.errorLight),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
                if (centerName.isNotEmpty)
                  Text(centerName,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.textSecondaryLight)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentVisitItem(SupervisorOpsRecentVisitDto v) {
    final ended = v.endedAt != null;
    final duration = v.durationMinutes != null
        ? '${v.durationMinutes! ~/ 60}h ${v.durationMinutes! % 60}m'
        : '—';
    final date = DateFormat('dd/MM').format(v.startedAt);

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
                color: ended ? AppColors.successLight : AppColors.warningLight,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.centerName,
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w700)),
                  if (v.circleName != null && v.circleName!.isNotEmpty)
                    Text(v.circleName!,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.textSecondaryLight)),
                  Row(
                    children: [
                      Text(date,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textSecondaryLight)),
                      const SizedBox(width: 8),
                      Text(duration,
                          style: const TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
            if (v.rating != null)
              Row(
                children: [
                  const Icon(Icons.star_rounded,
                      size: 14, color: AppColors.warningLight),
                  const SizedBox(width: 2),
                  Text('${v.rating}',
                      style: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w700)),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
