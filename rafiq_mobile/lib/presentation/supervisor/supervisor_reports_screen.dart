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

  Map<String, dynamic> _getPerformanceLabel(int overallPercent) {
    if (overallPercent >= 85) {
      return {
        "label": "ممتاز",
        "bg": AppColors.successLight.withValues(alpha: 0.1),
        "color": AppColors.successLight
      };
    }
    if (overallPercent >= 75) {
      return {
        "label": "جيد جداً",
        "bg": AppColors.primaryLight.withValues(alpha: 0.1),
        "color": AppColors.primaryLight
      };
    }
    if (overallPercent >= 65) {
      return {
        "label": "جيد",
        "bg": AppColors.infoLight.withValues(alpha: 0.1),
        "color": AppColors.infoLight
      };
    }
    if (overallPercent >= 50) {
      return {
        "label": "مقبول",
        "bg": AppColors.warningLight.withValues(alpha: 0.1),
        "color": AppColors.warningLight
      };
    }
    return {
      "label": "ضعيف",
      "bg": AppColors.errorLight.withValues(alpha: 0.1),
      "color": AppColors.errorLight
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final contextState = ref.watch(contextControllerProvider);
    final centerId = int.tryParse(contextState.selectedCenterId ?? '');
    final circleId = int.tryParse(contextState.selectedCircleId ?? '');
    final reportKey = (
      year: _selectedYear,
      month: _selectedMonth,
      centerId: centerId,
      circleId: circleId,
    );
    final reportAsync = ref.watch(supervisorDashboardProvider(reportKey));

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('التقارير الإشرافية'),
        centerTitle: true,
        backgroundColor: theme.scaffoldBackgroundColor,
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

          return _buildContent(context, theme, dashboard, filteredHalaqat);
        },
      ),
    );
  }

  Widget _buildContent(BuildContext context, ThemeData theme,
      SupervisorDashboardDto dashboard, List<HalqaReportDto> filteredHalaqat) {
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
                        'شهر $month',
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
                  'إجمالي الطلاب',
                  '${dashboard.overallStats.totalStudents}',
                  Icons.people_alt_rounded,
                  AppColors.primaryLight,
                  theme),
              _buildStatCard(
                  'متوسط الحضور',
                  '${dashboard.overallStats.avgAttendance}%',
                  Icons.check_circle_rounded,
                  AppColors.successLight,
                  theme),
              _buildStatCard(
                  'صفحات محفوظة',
                  '${dashboard.overallStats.totalHifzPages}',
                  Icons.menu_book_rounded,
                  AppColors.infoLight,
                  theme),
              _buildStatCard(
                  'تنفيذ الخطط',
                  '${dashboard.overallStats.avgPlanCompletion}%',
                  Icons.bar_chart_rounded,
                  AppColors.warningLight,
                  theme),
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
                      const Icon(Icons.star_rounded,
                          color: AppColors.warningLight, size: 20),
                      const SizedBox(height: 4),
                      Text('${dashboard.overallStats.avgRating}',
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800)),
                      Text('متوسط التقدير العام',
                          style: theme.textTheme.labelSmall?.copyWith(
                              color: AppColors.textSecondaryLight,
                              fontSize: 10)),
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
                      const Icon(Icons.person_off_rounded,
                          color: AppColors.errorLight, size: 20),
                      const SizedBox(height: 4),
                      Text('${dashboard.overallStats.strugglingStudents}',
                          style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: AppColors.errorLight)),
                      Text('طلاب متعثرون',
                          style: theme.textTheme.labelSmall?.copyWith(
                              color: AppColors.textSecondaryLight,
                              fontSize: 10)),
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
                  decoration: InputDecoration(
                    hintText: 'ابحث عن حلقة أو معلم...',
                    filled: true,
                    fillColor: AppColors.cardLight,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    prefixIcon: const Icon(Icons.search_rounded,
                        size: 18, color: AppColors.textSecondaryLight),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide:
                            const BorderSide(color: AppColors.borderLight)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide:
                            const BorderSide(color: AppColors.borderLight)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide: BorderSide(
                            color:
                                AppColors.primaryLight.withValues(alpha: 0.5))),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: AppColors.cardLight,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedHalqa,
                      isExpanded: true,
                      icon: const Icon(Icons.keyboard_arrow_down_rounded,
                          size: 18),
                      style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textPrimaryLight,
                          fontFamily: 'Tajawal',
                          fontWeight: FontWeight.w500),
                      onChanged: (String? newValue) {
                        if (newValue != null) {
                          setState(() => _selectedHalqa = newValue);
                        }
                      },
                      items: [
                        const DropdownMenuItem(
                            value: "all", child: Text("كل الحلقات")),
                        ...dashboard.halaqat.map((h) => DropdownMenuItem(
                            value: h.id,
                            child:
                                Text(h.name, overflow: TextOverflow.ellipsis))),
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
            final perfInfo = _getPerformanceLabel(overallPercent);
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
                                  ? AppColors.successLight
                                  : AppColors.errorLight,
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(h.name,
                                    style: theme.textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w700)),
                                Text('${h.teacher} · ${h.students} طالب',
                                    style: theme.textTheme.labelSmall?.copyWith(
                                        color: AppColors.textSecondaryLight,
                                        fontSize: 10)),
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
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        _buildProgressBar(
                            'الحضور',
                            h.avgAttendance,
                            h.avgAttendance > 80
                                ? AppColors.successLight
                                : AppColors.warningLight),
                        const SizedBox(width: 8),
                        _buildProgressBar(
                            'الحفظ',
                            h.avgHifz,
                            h.avgHifz > 70
                                ? AppColors.primaryLight
                                : AppColors.errorLight),
                        const SizedBox(width: 8),
                        _buildProgressBar(
                            'المراجعة',
                            h.avgReview,
                            h.avgReview > 60
                                ? AppColors.infoLight
                                : AppColors.warningLight),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            size: 14, color: AppColors.warningLight),
                        const SizedBox(width: 4),
                        Text('${h.avgRating}',
                            style: theme.textTheme.labelSmall
                                ?.copyWith(fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ],
                ),
              )
                  .animate()
                  .fadeIn(delay: (200 + index * 50).ms)
                  .slideY(begin: 0.1, end: 0, duration: 300.ms),
            );
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
                        color: AppColors.successLight.withValues(alpha: 0.5)),
                    const SizedBox(height: 16),
                    const Text('لا يوجد طلاب متعثرون حالياً',
                        style: TextStyle(color: AppColors.textSecondaryLight)),
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
                  color: AppColors.cardLight,
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                  border: Border.all(
                      color: AppColors.errorLight.withValues(alpha: 0.3)),
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
                                  color: AppColors.errorLight
                                      .withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(999)),
                              alignment: Alignment.center,
                              child: Text(
                                  s.name.characters.isNotEmpty
                                      ? s.name.characters.first
                                      : '؟',
                                  style: const TextStyle(
                                      color: AppColors.errorLight,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 14)),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(s.name,
                                    style: theme.textTheme.labelMedium
                                        ?.copyWith(
                                            fontWeight: FontWeight.w700)),
                                Text(s.halqa,
                                    style: theme.textTheme.labelSmall?.copyWith(
                                        color: AppColors.textSecondaryLight,
                                        fontSize: 10)),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                              color:
                                  AppColors.errorLight.withValues(alpha: 0.1),
                              borderRadius:
                                  BorderRadius.circular(AppRadius.sm)),
                          child: Text(s.reason,
                              style: const TextStyle(
                                  color: AppColors.errorLight,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700)),
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
                              const Text('إنجاز الحفظ',
                                  style: TextStyle(
                                      fontSize: 10,
                                      color: AppColors.textSecondaryLight)),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: (s.hifzPercent / 100).clamp(0.0, 1.0),
                                minHeight: 6,
                                backgroundColor: AppColors.borderLight,
                                color: AppColors.errorLight,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              const SizedBox(height: 4),
                              Text('${s.hifzPercent}%',
                                  style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('الحضور',
                                  style: TextStyle(
                                      fontSize: 10,
                                      color: AppColors.textSecondaryLight)),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: (s.attendance / 100).clamp(0.0, 1.0),
                                minHeight: 6,
                                backgroundColor: AppColors.borderLight,
                                color: s.attendance < 70
                                    ? AppColors.errorLight
                                    : AppColors.warningLight,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              const SizedBox(height: 4),
                              Text('${s.attendance}%',
                                  style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700)),
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
          const SizedBox(height: 100), // BottomNav padding
        ],
      ),
    );
  }

  Widget _buildProgressBar(String label, int value, Color color) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: const TextStyle(
                      fontSize: 10, color: AppColors.textSecondaryLight)),
              Text('$value%',
                  style: const TextStyle(
                      fontSize: 10, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: (value / 100).clamp(0.0, 1.0),
            minHeight: 6,
            backgroundColor: AppColors.borderLight,
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color, ThemeData theme) {
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
                  style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondaryLight, fontSize: 10),
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
                style: theme.textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
