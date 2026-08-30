import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../application/context/context_controller.dart';
import '../../../../application/teacher/teacher_panel_providers.dart';
import '../../../../core/constants/app_radius.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/constants/quran_data.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/app_snack_bar.dart';
import '../../../../core/utils/data_parsing_helper.dart';
import '../../../../core/utils/period_label_formatter.dart';
import '../../../../data/models/teacher_panel_dtos.dart';
import '../../shared/states/app_empty_state.dart';
import '../../shared/states/app_error_state.dart';
import '../../shared/states/app_loading_state.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/standard_app_bar.dart';

class MonthlyPlanScreen extends ConsumerStatefulWidget {
  const MonthlyPlanScreen({super.key});

  @override
  ConsumerState<MonthlyPlanScreen> createState() => _MonthlyPlanScreenState();
}

class _MonthlyPlanScreenState extends ConsumerState<MonthlyPlanScreen> {
  final YearMonth _period = _suggestedPlanningPeriod();
  bool _isGenerating = false;
  bool _isApprovingAll = false;
  final Set<String> _autoSuggestedKeys = <String>{};

  Future<void> _refresh() async {
    ref.invalidate(teacherMonthlyPlansProvider(_period));
    await ref.read(teacherMonthlyPlansProvider(_period).future);
  }

  Future<void> _generatePlans({
    bool automatic = false,
  }) async {
    final circleId = ref.read(contextControllerProvider).selectedCircleId;
    if (circleId == null || _isGenerating) {
      return;
    }

    setState(() => _isGenerating = true);
    try {
      final result = await ref
          .read(teacherPanelRemoteDataSourceProvider)
          .generateMonthlyPlans(
            circleId: circleId,
            month: _period.month,
            year: _period.year,
          );
      ref.invalidate(teacherMonthlyPlansProvider(_period));
      if (!mounted) return;
      AppSnackBar.success(
        context,
        automatic
            ? 'تم اقتراح ${result.generated} خطة تلقائياً للشهر القادم.'
            : 'تم توليد ${result.generated} خطة مع المحافظة على ${result.preserved} خطة معدلة أو معتمدة.',
      );
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.error(
        context,
        'تعذر توليد الخطط. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      if (mounted) {
        setState(() => _isGenerating = false);
      }
    }
  }

  Future<void> _approveAllPlans() async {
    final circleId = ref.read(contextControllerProvider).selectedCircleId;
    if (circleId == null || _isApprovingAll) {
      return;
    }

    setState(() => _isApprovingAll = true);
    try {
      final approved = await ref
          .read(teacherPanelRemoteDataSourceProvider)
          .approveAllMonthlyPlans(
            circleId: circleId,
            month: _period.month,
            year: _period.year,
          );
      ref.invalidate(teacherMonthlyPlansProvider(_period));
      if (!mounted) return;
      AppSnackBar.success(context, 'تم اعتماد $approved خطة بنجاح.');
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.error(
        context,
        'تعذر اعتماد جميع الخطط. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      if (mounted) {
        setState(() => _isApprovingAll = false);
      }
    }
  }

  void _maybeAutoGenerate(
    TeacherMonthlyPlansListDto result,
    int? circleId,
  ) {
    if (circleId == null ||
        result.plans.isNotEmpty ||
        !_isAutomaticSuggestionWindow(_period)) {
      return;
    }

    final key = '${_period.year}-${_period.month}';
    if (_autoSuggestedKeys.contains(key)) {
      return;
    }

    _autoSuggestedKeys.add(key);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _generatePlans(automatic: true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(contextControllerProvider);
    final plansAsync = ref.watch(teacherMonthlyPlansProvider(_period));
    final circleId = contextState.selectedCircleId;

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(
        title: 'التخطيط الشهري',
      ),
      body: circleId == null
          ? const AppEmptyState(
              title: 'لا توجد حلقة محددة',
              subtitle: 'اختر الحلقة أولاً حتى تظهر الخطة الشهرية للطلاب.',
              icon: Icons.calendar_month_outlined,
            )
          : plansAsync.when(
              loading: () => const AppLoadingState(
                message: 'جار تحميل الخطة الشهرية...',
              ),
              error: (error, _) => AppErrorState(
                title: 'تعذر تحميل الخطة الشهرية',
                message: error.toString(),
                onRetry: _refresh,
              ),
              data: (result) {
                _maybeAutoGenerate(result, circleId);
                final sortedPlans = result.plans.toList(growable: false)
                  ..sort(
                    (a, b) => (a.student?.fullName ?? '').compareTo(
                      b.student?.fullName ?? '',
                    ),
                  );
                final waitingCount =
                    result.summary.pending + result.summary.modified;

                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.md,
                      AppSpacing.md,
                      AppSpacing.md,
                      96,
                    ),
                    children: [
                      _MonthlyPlanOverviewCard(
                        monthLabel: formatGregorianMonthLabel(
                          month: result.month,
                          year: result.year,
                        ),
                        circleName:
                            contextState.selectedCircleName ?? 'الحلقة الحالية',
                        waitingCount: waitingCount,
                        approvedCount: result.summary.approved,
                        hasPlans: sortedPlans.isNotEmpty,
                        isGenerating: _isGenerating,
                        isApprovingAll: _isApprovingAll,
                        onGenerate: _generatePlans,
                        onApproveAll: _approveAllPlans,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      const _SectionTitle(title: 'خطط الطلاب'),
                      const SizedBox(height: AppSpacing.md),
                      if (sortedPlans.isEmpty)
                        const AppEmptyState(
                          title: 'لا توجد خطط لهذا الشهر',
                          subtitle:
                              'سيتم اقتراح خطط الطلاب تلقائياً عند اقتراب نهاية الشهر، ويمكنك أيضاً توليدها يدوياً.',
                          icon: Icons.auto_awesome_outlined,
                        )
                      else
                        ...sortedPlans.map(
                          (plan) => Padding(
                            padding: const EdgeInsets.only(
                              bottom: AppSpacing.md,
                            ),
                            child: _StudentPlanCard(plan: plan),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: context.textPrimaryColor,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
          ),
          Container(
            width: 24,
            height: 4,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.20),
              borderRadius: BorderRadius.circular(999),
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthlyPlanOverviewCard extends StatelessWidget {
  final String monthLabel;
  final String circleName;
  final int waitingCount;
  final int approvedCount;
  final bool hasPlans;
  final bool isGenerating;
  final bool isApprovingAll;
  final Future<void> Function({bool automatic}) onGenerate;
  final Future<void> Function() onApproveAll;

  const _MonthlyPlanOverviewCard({
    required this.monthLabel,
    required this.circleName,
    required this.waitingCount,
    required this.approvedCount,
    required this.hasPlans,
    required this.isGenerating,
    required this.isApprovingAll,
    required this.onGenerate,
    required this.onApproveAll,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final custom = context.customColors;
    final primary = theme.colorScheme.primary;
    final isDark = context.isDark;

    return AppCard(
      padding: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: context.borderColor),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: primary.withValues(alpha: isDark ? 0.30 : 0.15)),
                    ),
                    child: Icon(
                      Icons.calendar_month_rounded,
                      color: primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'خطة $monthLabel',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: context.textPrimaryColor,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          circleName,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: context.textSecondaryColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _SummaryBox(
                      value: '$approvedCount',
                      label: 'خطط معتمدة',
                      color: custom.success,
                      background: custom.success.withValues(alpha: isDark ? 0.16 : 0.08),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _SummaryBox(
                      value: '$waitingCount',
                      label: 'في انتظار الاعتماد',
                      color: custom.warning,
                      background: custom.warning.withValues(alpha: isDark ? 0.16 : 0.08),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (!hasPlans)
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: isGenerating ? null : () => onGenerate(),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                    ),
                    icon: isGenerating
                        ? SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: primary),
                          )
                        : const Icon(Icons.auto_awesome_rounded, size: 18),
                    label: Text(
                      isGenerating ? 'جار الاقتراح...' : 'اقتراح خطط الطلاب',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ),
                )
              else if (waitingCount > 0)
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: isApprovingAll ? null : onApproveAll,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primary,
                      foregroundColor: theme.colorScheme.onPrimary,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                    ),
                    icon: isApprovingAll
                        ? SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: theme.colorScheme.onPrimary,
                            ),
                          )
                        : const Icon(Icons.check_rounded, size: 18),
                    label: const Text(
                      'اعتماد جميع الخطط',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: custom.success.withValues(alpha: isDark ? 0.16 : 0.08),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_rounded, color: custom.success, size: 18),
                      const SizedBox(width: 6),
                      Text(
                        'تم اعتماد جميع الخطط',
                        style: TextStyle(
                          color: custom.success,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryBox extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  final Color background;

  const _SummaryBox({
    required this.value,
    required this.label,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 24,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              color: context.textSecondaryColor,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _StudentPlanCard extends StatelessWidget {
  final TeacherMonthlyPlanDto plan;

  const _StudentPlanCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    final studentName = plan.student?.fullName ?? 'طالب';
    final levelLabel = DataParsingHelper.studentLevelLabel(plan.student?.level);
    final levelColor = DataParsingHelper.studentLevelColor(levelLabel);
    final custom = context.customColors;
    final isDark = context.isDark;
    final theme = Theme.of(context);
    
    final hifzRange = _formatPlanRange(plan.hifz);
    final reviewRange = _formatPlanRange(plan.review);
    
    final isApproved = plan.status.toUpperCase() == 'APPROVED';

    final statusColor = isApproved ? custom.success : custom.warning;
    final statusBg = statusColor.withValues(alpha: isDark ? 0.18 : 0.10);
    final statusText = isApproved ? 'معتمد' : 'مسودة';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push(RouteNames.teacherMonthlyPlanDetails(plan.id)),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _StudentAvatar(name: studentName),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  studentName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    color: context.textPrimaryColor,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                              if (levelLabel != null) ...[
                                const SizedBox(width: 6),
                                _LevelPill(label: levelLabel, color: levelColor),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: statusBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              statusText,
                              style: TextStyle(
                                color: statusColor,
                                fontWeight: FontWeight.w700,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      Icons.keyboard_arrow_left_rounded,
                      size: 20,
                      color: context.textSecondaryColor,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Divider(height: 1, color: context.borderColor),
                const SizedBox(height: 12),
                _PlanRowItem(
                  title: 'خطة الحفظ',
                  range: hifzRange,
                  pages: plan.hifz.targetPages,
                  color: theme.colorScheme.primary,
                  backgroundColor: theme.colorScheme.primary.withValues(alpha: isDark ? 0.18 : 0.08),
                ),
                const SizedBox(height: 10),
                _PlanRowItem(
                  title: 'خطة المراجعة',
                  range: reviewRange,
                  pages: plan.review.targetPages,
                  color: custom.info,
                  backgroundColor: custom.info.withValues(alpha: isDark ? 0.18 : 0.08),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PlanRowItem extends StatelessWidget {
  final String title;
  final String range;
  final double? pages;
  final Color color;
  final Color backgroundColor;

  const _PlanRowItem({
    required this.title,
    required this.range,
    required this.pages,
    required this.color,
    required this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 80,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            title,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 11,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            range,
            style: TextStyle(
              color: context.textPrimaryColor,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 12),
        if (pages != null)
          Text(
            '${_formatPages(pages)} صفحة',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
      ],
    );
  }
}

class _LevelPill extends StatelessWidget {
  final String label;
  final Color color;

  const _LevelPill({
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.18 : 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 11,
        ),
      ),
    );
  }
}

class _StudentAvatar extends StatelessWidget {
  final String name;

  const _StudentAvatar({required this.name});

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? '؟' : name.trim().characters.first;
    final isDark = context.isDark;
    final primary = Theme.of(context).colorScheme.primary;

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
        shape: BoxShape.circle,
        border: Border.all(color: primary.withValues(alpha: isDark ? 0.35 : 0.20)),
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            color: isDark ? Colors.white : primary,
            fontWeight: FontWeight.w900,
            fontSize: 18,
          ),
        ),
      ),
    );
  }
}

YearMonth _suggestedPlanningPeriod() {
  final now = DateTime.now();
  final lastDay = DateTime(now.year, now.month + 1, 0);
  final remainingDays = lastDay.day - now.day;

  if (remainingDays <= 7) {
    final nextMonth = DateTime(now.year, now.month + 1, 1);
    return (month: nextMonth.month, year: nextMonth.year);
  }

  return (month: now.month, year: now.year);
}

bool _isAutomaticSuggestionWindow(YearMonth period) {
  final suggested = _suggestedPlanningPeriod();
  return suggested.month == period.month && suggested.year == period.year;
}

String _formatPlanRange(TeacherPlanSegmentDto segment) {
  if (segment.fromSurah == null) return 'غير محدد';
  
  final fromSurahName = QuranData.findByNumber(segment.fromSurah!)?.name ?? 'سورة ${segment.fromSurah}';
  final toSurahNum = segment.toSurah;
  final toSurahName = toSurahNum != null ? (QuranData.findByNumber(toSurahNum)?.name ?? 'سورة $toSurahNum') : null;
  
  if (toSurahNum == null || toSurahNum == segment.fromSurah) {
    if (segment.fromAyah != null && segment.toAyah != null) {
      return '$fromSurahName (${segment.fromAyah}-${segment.toAyah})';
    }
    return fromSurahName;
  }
  
  final fromAyahStr = segment.fromAyah != null ? ' (${segment.fromAyah})' : '';
  final toAyahStr = segment.toAyah != null ? ' (${segment.toAyah})' : '';
  return '$fromSurahName$fromAyahStr - $toSurahName$toAyahStr';
}

String _formatPages(double? value) {
  if (value == null) return '0';
  return value == value.roundToDouble()
      ? value.toStringAsFixed(0)
      : value.toStringAsFixed(1);
}
