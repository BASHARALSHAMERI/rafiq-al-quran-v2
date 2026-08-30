import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

import '../../application/context/context_controller.dart';
import '../../application/reports/reports_providers.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/supervisor_dtos.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/standard_app_bar.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/section_header.dart';

class SupervisorReportsScreen extends ConsumerStatefulWidget {
  const SupervisorReportsScreen({super.key});

  @override
  ConsumerState<SupervisorReportsScreen> createState() =>
      _SupervisorReportsScreenState();
}

class _SupervisorReportsScreenState
    extends ConsumerState<SupervisorReportsScreen> {
  int _selectedMonth = DateTime.now().month;
  final int _selectedYear = DateTime.now().year;
  String _searchQuery = "";
  String _selectedHalqa = "all";

  Map<String, dynamic> _getPerformanceLabel(BuildContext context, int overallPercent) {
    final custom = context.customColors;
    final primary = Theme.of(context).colorScheme.primary;
    final isDark = context.isDark;

    if (overallPercent >= 85) {
      return {
        "label": "ممتاز",
        "bg": custom.success.withValues(alpha: isDark ? 0.20 : 0.10),
        "color": custom.success
      };
    }
    if (overallPercent >= 75) {
      return {
        "label": "جيد جداً",
        "bg": primary.withValues(alpha: isDark ? 0.20 : 0.10),
        "color": primary
      };
    }
    if (overallPercent >= 65) {
      return {
        "label": "جيد",
        "bg": custom.info.withValues(alpha: isDark ? 0.20 : 0.10),
        "color": custom.info
      };
    }
    if (overallPercent >= 50) {
      return {
        "label": "مقبول",
        "bg": custom.warning.withValues(alpha: isDark ? 0.20 : 0.10),
        "color": custom.warning
      };
    }
    return {
      "label": "ضعيف",
      "bg": Theme.of(context).colorScheme.error.withValues(alpha: isDark ? 0.20 : 0.10),
      "color": Theme.of(context).colorScheme.error
    };
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(contextControllerProvider);
    final centerId = contextState.selectedCenterId;
    final circleId = contextState.selectedCircleId;
    final reportKey = (
      year: _selectedYear,
      month: _selectedMonth,
      centerId: centerId,
      circleId: circleId,
    );
    final reportAsync = ref.watch(supervisorDashboardProvider(reportKey));

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: StandardAppBar(
        title: 'التقارير الإشرافية',
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () =>
                ref.invalidate(supervisorDashboardProvider(reportKey)),
          ),
        ],
      ),
      body: reportAsync.when(
        loading: () => const PageStateView.loading(),
        error: (err, stack) => PageStateView.error(
          title: 'حدث خطأ في تحميل التقارير',
          message: err.toString(),
          actionLabel: 'إعادة المحاولة',
          onAction: () =>
              ref.invalidate(supervisorDashboardProvider(reportKey)),
        ),
        data: (dashboard) {
          final filteredHalaqat = dashboard.halaqat.where((h) {
            if (_selectedHalqa != "all" && h.id != _selectedHalqa) {
              return false;
            }
            if (_searchQuery.isNotEmpty &&
                !h.name.contains(_searchQuery) &&
                !h.teacher.contains(_searchQuery)) {
              return false;
            }
            return true;
          }).toList();

          return _buildContent(context, dashboard, filteredHalaqat);
        },
      ),
    );
  }

  Widget _buildContent(BuildContext context,
      SupervisorDashboardDto dashboard, List<HalqaReportDto> filteredHalaqat) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final custom = context.customColors;
    final isDark = context.isDark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        children: [
          // Month Selector
          SizedBox(
            height: 48,
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
                      setState(() {
                        _selectedMonth = month;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
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
                        'شهر $month',
                        style: TextStyle(
                          color: isSelected
                              ? theme.colorScheme.onPrimary
                              : (isFuture
                                  ? (isDark ? Colors.grey.shade600 : Colors.grey.shade400)
                                  : context.textSecondaryColor),
                          fontWeight:
                              isSelected ? FontWeight.w800 : FontWeight.w600,
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

          // Overall Stats
          const SectionHeader(title: 'نظرة عامة'),
          const SizedBox(height: AppSpacing.sm),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 2.25,
            children: [
              _buildStatCard(
                  context,
                  'إجمالي الطلاب',
                  '${dashboard.overallStats.totalStudents}',
                  Icons.people_alt_rounded,
                  primary),
              _buildStatCard(
                  context,
                  'متوسط الحضور',
                  '${dashboard.overallStats.avgAttendance}%',
                  Icons.check_circle_rounded,
                  custom.success),
              _buildStatCard(
                  context,
                  'صفحات محفوظة',
                  '${dashboard.overallStats.totalHifzPages}',
                  Icons.menu_book_rounded,
                  custom.info),
              _buildStatCard(
                  context,
                  'تنفيذ الخطط',
                  '${dashboard.overallStats.avgPlanCompletion}%',
                  Icons.bar_chart_rounded,
                  custom.warning),
            ],
          ).animate().fadeIn().slideY(begin: 0.1, end: 0),
          const SizedBox(height: 8),

          // Extra Stats
          Row(
            children: [
              Expanded(
                child: AppCard(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Icon(Icons.star_rounded,
                          color: custom.warning, size: 20),
                      const SizedBox(height: 4),
                      Text('${dashboard.overallStats.avgRating}',
                          style: TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                              color: context.textPrimaryColor)),
                      Text('متوسط التقدير العام',
                          style: TextStyle(
                              color: context.textSecondaryColor,
                              fontSize: 11)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppCard(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Icon(Icons.person_off_rounded,
                          color: theme.colorScheme.error, size: 20),
                      const SizedBox(height: 4),
                      Text('${dashboard.overallStats.strugglingStudents}',
                          style: TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                              color: theme.colorScheme.error)),
                      Text('طلاب متعثرون',
                          style: TextStyle(
                              color: context.textSecondaryColor,
                              fontSize: 11)),
                    ],
                  ),
                ),
              ),
            ],
          ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0),
          const SizedBox(height: AppSpacing.lg),

          // Halqa Filter
          const SectionHeader(title: 'مقارنة الحلقات'),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  style: TextStyle(color: context.textPrimaryColor),
                  decoration: InputDecoration(
                    hintText: 'ابحث عن حلقة أو معلم...',
                    filled: true,
                    fillColor: context.cardColor,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    prefixIcon: Icon(Icons.search_rounded,
                        size: 18, color: context.textSecondaryColor),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide: BorderSide(color: context.borderColor)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide: BorderSide(color: context.borderColor)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide: BorderSide(color: primary, width: 1.5)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: context.cardColor,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    border: Border.all(color: context.borderColor),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedHalqa,
                      dropdownColor: context.cardColor,
                      isExpanded: true,
                      icon: Icon(Icons.keyboard_arrow_down_rounded,
                          size: 18, color: context.textSecondaryColor),
                      style: TextStyle(
                          fontSize: 12,
                          color: context.textPrimaryColor,
                          fontWeight: FontWeight.w600),
                      onChanged: (String? newValue) {
                        if (newValue != null) {
                          setState(() => _selectedHalqa = newValue);
                        }
                      },
                      items: [
                        DropdownMenuItem(
                            value: "all",
                            child: Text("كل الحلقات",
                                style: TextStyle(color: context.textPrimaryColor))),
                        ...dashboard.halaqat.map((h) => DropdownMenuItem(
                            value: h.id,
                            child: Text(h.name,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(color: context.textPrimaryColor)))),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Halqa Cards
          ...List.generate(filteredHalaqat.length, (index) {
            final h = filteredHalaqat[index];
            final overallPercent =
                ((h.avgAttendance + h.avgHifz + h.avgReview) / 3).round();
            final perfInfo = _getPerformanceLabel(context, overallPercent);
            final halqaIntId = int.tryParse(h.id) ?? 0;

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AppCard(
                padding: const EdgeInsets.all(AppSpacing.md),
                onTap: halqaIntId > 0
                    ? () => context
                        .push(RouteNames.supervisorHalqaReport(halqaIntId))
                    : null,
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              h.trend == 'up'
                                  ? Icons.trending_up_rounded
                                  : Icons.trending_down_rounded,
                              size: 18,
                              color: h.trend == 'up'
                                  ? custom.success
                                  : theme.colorScheme.error,
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(h.name,
                                    style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 14,
                                        color: context.textPrimaryColor)),
                                Text('${h.teacher} · ${h.students} طالب',
                                    style: TextStyle(
                                        color: context.textSecondaryColor,
                                        fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                              color: perfInfo['bg'],
                              borderRadius:
                                  BorderRadius.circular(AppRadius.sm)),
                          child: Text(perfInfo['label'],
                              style: TextStyle(
                                  color: perfInfo['color'],
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        _buildProgressBar(
                            context,
                            'الحضور',
                            h.avgAttendance,
                            h.avgAttendance > 80
                                ? custom.success
                                : custom.warning),
                        const SizedBox(width: 8),
                        _buildProgressBar(
                            context,
                            'الحفظ',
                            h.avgHifz,
                            h.avgHifz > 70
                                ? primary
                                : theme.colorScheme.error),
                        const SizedBox(width: 8),
                        _buildProgressBar(
                            context,
                            'المراجعة',
                            h.avgReview,
                            h.avgReview > 60
                                ? custom.info
                                : custom.warning),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.star_rounded,
                            size: 14, color: custom.warning),
                        const SizedBox(width: 4),
                        Text('${h.avgRating}',
                            style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 12,
                                color: context.textPrimaryColor)),
                      ],
                    ),
                  ],
                ),
              ),
            )
                .animate()
                .fadeIn(delay: (200 + index * 50).ms)
                .slideY(begin: 0.1, end: 0, duration: 300.ms);
          }),
          const SizedBox(height: AppSpacing.lg),

          // Struggling Students
          const SectionHeader(title: 'الطلاب المتعثرون'),
          const SizedBox(height: AppSpacing.sm),
          if (dashboard.strugglingStudents.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.check_circle_outline_rounded,
                        size: 48,
                        color: custom.success.withValues(alpha: 0.5)),
                    const SizedBox(height: 16),
                    Text('لا يوجد طلاب متعثرون حالياً',
                        style: TextStyle(color: context.textSecondaryColor)),
                  ],
                ),
              ),
            ),
          ...List.generate(dashboard.strugglingStudents.length, (index) {
            final s = dashboard.strugglingStudents[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: context.cardColor,
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                  border: Border.all(
                      color: theme.colorScheme.error.withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                  color: theme.colorScheme.error
                                      .withValues(alpha: isDark ? 0.20 : 0.10),
                                  borderRadius: BorderRadius.circular(999)),
                              alignment: Alignment.center,
                              child: Text(
                                  s.name.characters.isNotEmpty
                                      ? s.name.characters.first
                                      : '؟',
                                  style: TextStyle(
                                      color: theme.colorScheme.error,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 14)),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(s.name,
                                    style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13,
                                        color: context.textPrimaryColor)),
                                Text(s.halqa,
                                    style: TextStyle(
                                        color: context.textSecondaryColor,
                                        fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                              color: theme.colorScheme.error
                                  .withValues(alpha: isDark ? 0.20 : 0.10),
                              borderRadius:
                                  BorderRadius.circular(AppRadius.sm)),
                          child: Text(s.reason,
                              style: TextStyle(
                                  color: theme.colorScheme.error,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('إنجاز الحفظ',
                                  style: TextStyle(
                                      fontSize: 10,
                                      color: context.textSecondaryColor)),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: (s.hifzPercent / 100).clamp(0.0, 1.0),
                                minHeight: 6,
                                backgroundColor: context.borderColor,
                                color: theme.colorScheme.error,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              const SizedBox(height: 4),
                              Text('${s.hifzPercent}%',
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: context.textPrimaryColor)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('الحضور',
                                  style: TextStyle(
                                      fontSize: 10,
                                      color: context.textSecondaryColor)),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: (s.attendance / 100).clamp(0.0, 1.0),
                                minHeight: 6,
                                backgroundColor: context.borderColor,
                                color: s.attendance < 70
                                    ? theme.colorScheme.error
                                    : custom.warning,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              const SizedBox(height: 4),
                              Text('${s.attendance}%',
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: context.textPrimaryColor)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              )
                  .animate()
                  .fadeIn(delay: (300 + index * 50).ms)
                  .slideY(begin: 0.1, end: 0, duration: 300.ms),
            );
          }),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildProgressBar(BuildContext context, String label, int value, Color color) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: TextStyle(
                      fontSize: 10, color: context.textSecondaryColor)),
              Text('$value%',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: context.textPrimaryColor)),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: (value / 100).clamp(0.0, 1.0),
            minHeight: 6,
            backgroundColor: context.borderColor,
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      BuildContext context, String title, String value, IconData icon, Color color) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      color: context.textSecondaryColor, fontSize: 11),
                ),
              ),
              const SizedBox(width: 8),
              Icon(icon, size: 16, color: color),
            ],
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: AlignmentDirectional.centerStart,
            child: Text(value,
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 17,
                    color: context.textPrimaryColor)),
          ),
        ],
      ),
    );
  }
}
