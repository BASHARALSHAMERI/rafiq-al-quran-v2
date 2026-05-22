import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../application/context/context_controller.dart';
import '../../../../application/teacher/teacher_panel_providers.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/constants/quran_data.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/data_parsing_helper.dart';
import '../../../../core/utils/period_label_formatter.dart';
import '../../../../data/models/teacher_panel_dtos.dart';
import '../../shared/states/app_empty_state.dart';
import '../../shared/states/app_error_state.dart';
import '../../shared/states/app_loading_state.dart';
import '../../shared/widgets/app_card.dart';

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
    final circleId = int.tryParse(
      ref.read(contextControllerProvider).selectedCircleId ?? '',
    );
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            automatic
                ? 'تم اقتراح ${result.generated} خطة تلقائياً للشهر القادم.'
                : 'تم توليد ${result.generated} خطة مع المحافظة على ${result.preserved} خطة معدلة أو معتمدة.',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر توليد الخطط: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _isGenerating = false);
      }
    }
  }

  Future<void> _approveAllPlans() async {
    final circleId = int.tryParse(
      ref.read(contextControllerProvider).selectedCircleId ?? '',
    );
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم اعتماد $approved خطة بنجاح.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر اعتماد جميع الخطط: $error')),
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
    final circleId = int.tryParse(contextState.selectedCircleId ?? '');

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      appBar: AppBar(
        title: const Text('التخطيط الشهري'),
        centerTitle: false,
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
                      const Text(
                        'خطط الطلاب',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 30,
                          height: 1.2,
                        ),
                      ),
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
    return AppCard(
      padding: EdgeInsets.zero,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFF8FBF8), Colors.white],
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
          ),
          borderRadius: BorderRadius.circular(28),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(
                      Icons.calendar_month_rounded,
                      color: AppColors.primaryLight,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'خطة $monthLabel',
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w900,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          circleName,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.textSecondaryLight,
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: _SummaryBox(
                      value: '$waitingCount',
                      label: 'في انتظار الاعتماد',
                      color: AppColors.warningLight,
                      background: const Color(0xFFFFF8EC),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _SummaryBox(
                      value: '$approvedCount',
                      label: 'خطط معتمدة',
                      color: AppColors.successLight,
                      background: const Color(0xFFF2FBF5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              if (!hasPlans)
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: OutlinedButton.icon(
                    onPressed: isGenerating ? null : () => onGenerate(),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: AppColors.primaryLight.withValues(alpha: 0.25),
                      ),
                      foregroundColor: AppColors.primaryLight,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    icon: isGenerating
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.auto_awesome_rounded),
                    label: Text(
                      isGenerating ? 'جار الاقتراح...' : 'اقتراح خطط الطلاب',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                )
              else if (waitingCount > 0)
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton.icon(
                    onPressed: isApprovingAll ? null : onApproveAll,
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          AppColors.primaryLight.withValues(alpha: 0.10),
                      foregroundColor: AppColors.primaryLight,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(
                          color: AppColors.primaryLight.withValues(alpha: 0.18),
                        ),
                      ),
                    ),
                    icon: isApprovingAll
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primaryLight,
                            ),
                          )
                        : const Icon(Icons.check_rounded),
                    label: const Text(
                      'اعتماد جميع الخطط',
                      style: TextStyle(fontWeight: FontWeight.w900),
                    ),
                  ),
                )
              else
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.successLight.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_rounded, color: AppColors.successLight),
                      SizedBox(width: 8),
                      Text(
                        'تم اعتماد جميع الخطط',
                        style: TextStyle(
                          color: AppColors.successLight,
                          fontWeight: FontWeight.w900,
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
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w900,
              fontSize: 34,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondaryLight,
                  fontWeight: FontWeight.w700,
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
    final isApproved = plan.status.toUpperCase() == 'APPROVED';
    final progress = plan.progress.hifzCompletionRate.clamp(0, 100);

    return AppCard(
      onTap: () => context.push(RouteNames.teacherMonthlyPlanDetails(plan.id)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (levelLabel != null)
                      _LevelPill(
                        label: levelLabel,
                        color: levelColor,
                      ),
                    if (levelLabel != null) const SizedBox(height: 10),
                    Text(
                      studentName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 24,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_hifzStartLabel(plan.hifz)} · ${_formatPages(plan.hifz.dailyRate)} صفحة/يوم',
                      style: const TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _StudentAvatar(name: studentName),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _PlanStateChip(
                label: isApproved ? 'خطة الحفظ' : 'خطة الحفظ',
                approved: isApproved,
              ),
              _PlanStateChip(
                label: isApproved ? 'خطة المراجعة' : 'خطة المراجعة',
                approved: isApproved,
              ),
            ],
          ),
          if (isApproved) ...[
            const SizedBox(height: 14),
            Text(
              '${progress.toStringAsFixed(0)}%',
              style: const TextStyle(
                color: AppColors.textSecondaryLight,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: (progress / 100).clamp(0.0, 1.0),
                minHeight: 8,
                color: AppColors.primaryLight,
                backgroundColor: AppColors.borderLight.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 6),
            const Align(
              alignment: Alignment.centerRight,
              child: Text(
                'التقدم',
                style: TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PlanStateChip extends StatelessWidget {
  final String label;
  final bool approved;

  const _PlanStateChip({
    required this.label,
    required this.approved,
  });

  @override
  Widget build(BuildContext context) {
    final color = approved ? AppColors.successLight : AppColors.warningLight;
    final background =
        approved ? const Color(0xFFEEF9F1) : const Color(0xFFFFF8EC);
    final icon = approved ? Icons.check_rounded : Icons.hourglass_top_rounded;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
        ],
      ),
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
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

class _StudentAvatar extends StatelessWidget {
  final String name;

  const _StudentAvatar({required this.name});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 58,
      height: 58,
      decoration: const BoxDecoration(
        color: Color(0xFFE8F0ED),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          name.trim().isEmpty ? '؟' : name.trim().characters.first,
          style: const TextStyle(
            color: AppColors.primaryLight,
            fontWeight: FontWeight.w900,
            fontSize: 28,
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

String _hifzStartLabel(TeacherPlanSegmentDto segment) {
  if (segment.fromSurah == null || segment.fromAyah == null) {
    return 'لم يحدد النطاق';
  }

  final surah = QuranData.findByNumber(segment.fromSurah!);
  return '${surah?.name ?? 'سورة ${segment.fromSurah}'} آية ${segment.fromAyah}';
}

String _formatPages(double? value) {
  if (value == null) {
    return '0';
  }

  return value == value.roundToDouble()
      ? value.toStringAsFixed(0)
      : value.toStringAsFixed(1);
}
