import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../application/context/context_controller.dart';
import '../../../../application/teacher/teacher_panel_providers.dart';
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
    final circleId = int.tryParse(contextState.selectedCircleId ?? '');

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
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
            style: const TextStyle(
              color: AppColors.textPrimaryLight,
              fontWeight: FontWeight.w800,
              fontSize: 16,
              fontFamily: 'Cairo',
            ),
          ),
          Container(
            width: 24,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.15),
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
    return AppCard(
      padding: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.cardLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.8)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
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
                      color: AppColors.primaryLight.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primaryLight.withValues(alpha: 0.1)),
                    ),
                    child: const Icon(
                      Icons.calendar_month_rounded,
                      color: AppColors.primaryLight,
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
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: AppColors.textPrimaryLight,
                            fontFamily: 'Cairo',
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          circleName,
                          style: const TextStyle(
                            color: AppColors.textSecondaryLight,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            fontFamily: 'Cairo',
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
                      color: AppColors.successLight,
                      background: const Color(0xFFEEF9F1),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _SummaryBox(
                      value: '$waitingCount',
                      label: 'في انتظار الاعتماد',
                      color: AppColors.warningLight,
                      background: const Color(0xFFFFF8EC),
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
                      side: BorderSide(
                        color: AppColors.primaryLight.withValues(alpha: 0.25),
                      ),
                      foregroundColor: AppColors.primaryLight,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    icon: isGenerating
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryLight),
                          )
                        : const Icon(Icons.auto_awesome_rounded, size: 18),
                    label: Text(
                      isGenerating ? 'جار الاقتراح...' : 'اقتراح خطط الطلاب',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        fontFamily: 'Cairo',
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
                      backgroundColor: AppColors.primaryLight.withValues(alpha: 0.08),
                      foregroundColor: AppColors.primaryLight,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(
                          color: AppColors.primaryLight.withValues(alpha: 0.15),
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
                        : const Icon(Icons.check_rounded, size: 18),
                    label: const Text(
                      'اعتماد جميع الخطط',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ),
                )
              else
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.successLight.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_rounded, color: AppColors.successLight, size: 18),
                      SizedBox(width: 6),
                      Text(
                        'تم اعتماد جميع الخطط',
                        style: TextStyle(
                          color: AppColors.successLight,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Cairo',
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
        borderRadius: BorderRadius.circular(14),
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
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w700,
              fontSize: 12,
              fontFamily: 'Cairo',
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
    
    final hifzRange = _formatPlanRange(plan.hifz);
    final reviewRange = _formatPlanRange(plan.review);
    
    final isApproved = plan.status.toUpperCase() == 'APPROVED';

    final statusColor = isApproved ? AppColors.successLight : AppColors.warningLight;
    final statusBg = isApproved ? const Color(0xFFEEF9F1) : const Color(0xFFFFF8EC);
    final statusText = isApproved ? 'معتمد' : 'مسودة';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push(RouteNames.teacherMonthlyPlanDetails(plan.id)),
          borderRadius: BorderRadius.circular(16),
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
                                  style: const TextStyle(
                                    color: AppColors.textPrimaryLight,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                    fontFamily: 'Cairo',
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
                                fontFamily: 'Cairo',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(
                      Icons.keyboard_arrow_left_rounded,
                      size: 20,
                      color: AppColors.textSecondaryLight,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(height: 1, color: AppColors.borderLight),
                const SizedBox(height: 12),
                _PlanRowItem(
                  title: 'خطة الحفظ',
                  range: hifzRange,
                  pages: plan.hifz.targetPages,
                  color: AppColors.primaryLight,
                  backgroundColor: AppColors.primaryLight.withValues(alpha: 0.08),
                ),
                const SizedBox(height: 10),
                _PlanRowItem(
                  title: 'خطة المراجعة',
                  range: reviewRange,
                  pages: plan.review.targetPages,
                  color: AppColors.infoLight,
                  backgroundColor: AppColors.infoLight.withValues(alpha: 0.08),
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
              fontFamily: 'Cairo',
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            range,
            style: const TextStyle(
              color: AppColors.textPrimaryLight,
              fontWeight: FontWeight.w700,
              fontSize: 13,
              fontFamily: 'Cairo',
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
              fontFamily: 'Cairo',
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 11,
          fontFamily: 'Cairo',
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

    return Container(
      width: 44,
      height: 44,
      decoration: const BoxDecoration(
        color: Color(0xFFE8F0ED),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            color: Color(0xFF1E2A25),
            fontWeight: FontWeight.w900,
            fontSize: 20,
            fontFamily: 'Cairo',
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


