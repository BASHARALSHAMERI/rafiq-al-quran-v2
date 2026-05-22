import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/context/context_controller.dart';
import '../../application/teacher/teacher_panel_providers.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/quran_data.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/period_label_formatter.dart';
import '../../data/models/teacher_panel_dtos.dart';
import '../shared/states/app_error_state.dart';
import '../shared/states/app_loading_state.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/quran_range_picker.dart';

enum _PlanTab { hifz, review }

class TeacherMonthlyPlanDetailsScreen extends ConsumerStatefulWidget {
  final int planId;

  const TeacherMonthlyPlanDetailsScreen({
    super.key,
    required this.planId,
  });

  @override
  ConsumerState<TeacherMonthlyPlanDetailsScreen> createState() =>
      _TeacherMonthlyPlanDetailsScreenState();
}

class _TeacherMonthlyPlanDetailsScreenState
    extends ConsumerState<TeacherMonthlyPlanDetailsScreen> {
  _PlanTab _selectedTab = _PlanTab.hifz;
  bool _isApproving = false;
  bool _isSavingEdits = false;

  Future<void> _refresh() async {
    ref.invalidate(teacherMonthlyPlanDetailsProvider(widget.planId));
    await ref.read(teacherMonthlyPlanDetailsProvider(widget.planId).future);
  }

  Future<void> _saveEdits(
    TeacherMonthlyPlanDto plan,
    _PlanEditResult result,
  ) async {
    if (!_isValidOrderedRange(result.hifzRange) ||
        !_isValidOrderedRange(result.reviewRange)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تأكد من صحة نطاق الآيات قبل الحفظ.')),
      );
      return;
    }

    final payload = <String, dynamic>{
      ..._buildSegmentPayload(
        prefix: 'hifz',
        range: result.hifzRange,
        pageMultiplier: 1,
      ),
      ..._buildSegmentPayload(
        prefix: 'review',
        range: result.reviewRange,
        pageMultiplier: 2,
      ),
      'notes': result.notes.trim().isEmpty ? null : result.notes.trim(),
    };

    setState(() => _isSavingEdits = true);
    try {
      await ref
          .read(teacherPanelRemoteDataSourceProvider)
          .updateMonthlyPlan(plan.id, payload);
      ref.invalidate(teacherMonthlyPlanDetailsProvider(widget.planId));
      ref.invalidate(
        teacherMonthlyPlansProvider((month: plan.month, year: plan.year)),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حفظ تعديل الخطة الشهرية.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر حفظ التعديلات: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSavingEdits = false);
      }
    }
  }

  Future<void> _approvePlan(TeacherMonthlyPlanDto plan) async {
    if (_isApproving) return;
    setState(() => _isApproving = true);
    try {
      await ref
          .read(teacherPanelRemoteDataSourceProvider)
          .approveMonthlyPlan(plan.id);
      ref.invalidate(teacherMonthlyPlanDetailsProvider(widget.planId));
      ref.invalidate(
        teacherMonthlyPlansProvider((month: plan.month, year: plan.year)),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم اعتماد الخطة بنجاح.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر اعتماد الخطة: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _isApproving = false);
      }
    }
  }

  Future<void> _openEditSheet(TeacherMonthlyPlanDto plan) async {
    if (_isSavingEdits || _isApproving || _isApproved(plan.status)) return;

    final result = await showModalBottomSheet<_PlanEditResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _MonthlyPlanEditSheet(plan: plan),
    );

    if (!mounted || result == null) return;
    await _saveEdits(plan, result);
  }

  @override
  Widget build(BuildContext context) {
    final circleName = ref.watch(
      contextControllerProvider.select((state) => state.selectedCircleName),
    );
    final planAsync =
        ref.watch(teacherMonthlyPlanDetailsProvider(widget.planId));

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      appBar: AppBar(
        title: const Text('الخطة الشهرية'),
        centerTitle: false,
      ),
      body: planAsync.when(
        loading: () => const AppLoadingState(
          message: 'جار تحميل تفاصيل الخطة...',
        ),
        error: (error, _) => AppErrorState(
          title: 'تعذر تحميل الخطة',
          message: error.toString(),
          onRetry: _refresh,
        ),
        data: (plan) {
          final rosterAsync = ref.watch(
            teacherMonthlyPlansProvider((month: plan.month, year: plan.year)),
          );
          final studentOrder = _resolveStudentOrder(rosterAsync, plan.id);
          final selectedSegment =
              _selectedTab == _PlanTab.hifz ? plan.hifz : plan.review;
          final completionRate = _selectedTab == _PlanTab.hifz
              ? plan.progress.hifzCompletionRate
              : plan.progress.reviewCompletionRate;
          final executedPages = _selectedTab == _PlanTab.hifz
              ? plan.progress.hifzExecutedPages
              : plan.progress.reviewExecutedPages;
          final remainingPages = _remainingPages(
            target: selectedSegment.targetPages,
            executed: executedPages,
          );
          final isApproved = _isApproved(plan.status);
          final studentName = plan.student?.fullName ?? 'طالب';
          final planLabel = formatGregorianMonthLabel(
            month: plan.month,
            year: plan.year,
          );

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.md,
                40,
              ),
              children: [
                _StudentHeaderCard(
                  studentName: studentName,
                  circleName: circleName ?? 'الحلقة الحالية',
                  periodLabel: planLabel,
                  levelLabel: _levelLabel(plan.student?.level),
                  rankLabel: studentOrder,
                  dailyRateLabel:
                      '${_formatPages(plan.hifz.dailyRate)} صفحة/يوم',
                  attendanceLabel:
                      '${plan.progress.attendance.presentDays}/${plan.progress.attendance.totalDays}',
                  memorizedPagesLabel: '${plan.progress.memorizedPages ?? 0}',
                ),
                const SizedBox(height: AppSpacing.lg),
                _PlanTabSelector(
                  selectedTab: _selectedTab,
                  onChanged: (tab) => setState(() => _selectedTab = tab),
                ),
                const SizedBox(height: AppSpacing.md),
                _LatestReachedCard(latestReached: plan.progress.latestReached),
                const SizedBox(height: AppSpacing.md),
                _ProposedPlanCard(
                  title: _selectedTab == _PlanTab.hifz
                      ? 'خطة الحفظ المقترحة'
                      : 'خطة المراجعة المقترحة',
                  segment: selectedSegment,
                  note: _selectedTab == _PlanTab.review
                      ? 'تُراجع مادة الشهر مرتين افتراضياً ويمكن تعديلها.'
                      : plan.notes,
                  isApproved: isApproved,
                  onEdit: isApproved ? null : () => _openEditSheet(plan),
                ),
                const SizedBox(height: AppSpacing.md),
                _TargetPagesCard(
                  targetPages: selectedSegment.targetPages ?? 0,
                  dailyRate: selectedSegment.dailyRate ?? 0,
                  accent: _selectedTab == _PlanTab.hifz
                      ? AppColors.primaryLight
                      : AppColors.infoLight,
                  subtitle: _selectedTab == _PlanTab.review
                      ? 'النطاق نفسه محسوب للمراجعة مرتين'
                      : 'عدد الصفحات محسوب تلقائياً من نطاق الآيات',
                ),
                if (isApproved) ...[
                  const SizedBox(height: AppSpacing.md),
                  _ProgressCard(
                    title: 'التقدم الحالي',
                    completionRate: completionRate,
                    executedPages: executedPages,
                    remainingPages: remainingPages,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  const _ApprovedStateCard(),
                ] else ...[
                  const SizedBox(height: AppSpacing.lg),
                  SizedBox(
                    height: 60,
                    child: ElevatedButton.icon(
                      onPressed: _isApproving ? null : () => _approvePlan(plan),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(22),
                        ),
                        elevation: 0,
                      ),
                      icon: _isApproving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.check_rounded),
                      label: Text(
                        _isApproving ? 'جار اعتماد الخطة...' : 'اعتماد الخطة',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StudentHeaderCard extends StatelessWidget {
  final String studentName;
  final String circleName;
  final String periodLabel;
  final String? levelLabel;
  final String? rankLabel;
  final String dailyRateLabel;
  final String attendanceLabel;
  final String memorizedPagesLabel;

  const _StudentHeaderCard({
    required this.studentName,
    required this.circleName,
    required this.periodLabel,
    required this.levelLabel,
    required this.rankLabel,
    required this.dailyRateLabel,
    required this.attendanceLabel,
    required this.memorizedPagesLabel,
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
              CircleAvatar(
                radius: 36,
                backgroundColor: AppColors.primaryLight.withValues(alpha: 0.10),
                child: Text(
                  studentName.trim().isEmpty ? 'ط' : studentName.trim()[0],
                  style: const TextStyle(
                    color: AppColors.primaryLight,
                    fontWeight: FontWeight.w900,
                    fontSize: 28,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                studentName,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                '$circleName · $periodLabel',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondaryLight,
                      fontWeight: FontWeight.w600,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (levelLabel != null)
                    _StatusChip(
                      label: levelLabel!,
                      color: _levelColor(levelLabel!),
                      background:
                          _levelColor(levelLabel!).withValues(alpha: 0.12),
                    ),
                  if (rankLabel != null)
                    _StatusChip(
                      label: rankLabel!,
                      color: AppColors.textSecondaryLight,
                      background: const Color(0xFFF2F4F5),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              const Divider(height: 1),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: _HeaderMetric(
                      value: dailyRateLabel,
                      label: 'صفحة/يوم',
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _HeaderMetric(
                      value: attendanceLabel,
                      label: 'يوم حضور',
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _HeaderMetric(
                      value: memorizedPagesLabel,
                      label: 'صفحة محفوظة',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlanTabSelector extends StatelessWidget {
  final _PlanTab selectedTab;
  final ValueChanged<_PlanTab> onChanged;

  const _PlanTabSelector({
    required this.selectedTab,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F2ED),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: [
          Expanded(
            child: _TabButton(
              title: 'خطة الحفظ',
              selected: selectedTab == _PlanTab.hifz,
              onTap: () => onChanged(_PlanTab.hifz),
            ),
          ),
          Expanded(
            child: _TabButton(
              title: 'خطة المراجعة',
              selected: selectedTab == _PlanTab.review,
              onTap: () => onChanged(_PlanTab.review),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String title;
  final bool selected;
  final VoidCallback onTap;

  const _TabButton({
    required this.title,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(18),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: selected
                ? AppColors.textPrimaryLight
                : AppColors.textSecondaryLight,
          ),
        ),
      ),
    );
  }
}

class _LatestReachedCard extends StatelessWidget {
  final TeacherPlanLatestReachedDto? latestReached;

  const _LatestReachedCard({required this.latestReached});

  @override
  Widget build(BuildContext context) {
    final label = _formatLatestReached(latestReached);

    return AppCard(
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppColors.infoLight.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.menu_book_outlined,
              color: AppColors.infoLight,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'آخر موضع وصل إليه',
                  style: TextStyle(
                    color: AppColors.textSecondaryLight,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 19,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProposedPlanCard extends StatelessWidget {
  final String title;
  final TeacherPlanSegmentDto segment;
  final String? note;
  final bool isApproved;
  final VoidCallback? onEdit;

  const _ProposedPlanCard({
    required this.title,
    required this.segment,
    required this.note,
    required this.isApproved,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                  ),
                ),
              ),
              if (!isApproved && onEdit != null)
                TextButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  label: const Text('تعديل'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primaryLight,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _PlanRangeColumn(
                  label: 'من',
                  value: _formatSegmentStart(segment),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _PlanRangeColumn(
                  label: 'إلى',
                  value: _formatSegmentEnd(segment),
                ),
              ),
            ],
          ),
          if (note != null && note!.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF7F8F5),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Text(
                note!,
                style: const TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontWeight: FontWeight.w700,
                  height: 1.45,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PlanRangeColumn extends StatelessWidget {
  final String label;
  final String value;

  const _PlanRangeColumn({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textSecondaryLight,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 18,
            height: 1.3,
          ),
        ),
      ],
    );
  }
}

class _TargetPagesCard extends StatelessWidget {
  final double targetPages;
  final double dailyRate;
  final Color accent;
  final String subtitle;

  const _TargetPagesCard({
    required this.targetPages,
    required this.dailyRate,
    required this.accent,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: accent.withValues(alpha: 0.18)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(Icons.adjust_rounded, color: accent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'الصفحات المستهدفة',
                  style: TextStyle(
                    color: AppColors.textSecondaryLight,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatPages(targetPages)} صفحة',
                  style: TextStyle(
                    color: accent,
                    fontWeight: FontWeight.w900,
                    fontSize: 28,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$subtitle · ${_formatPages(dailyRate)} صفحة/يوم',
                  style: TextStyle(
                    color: accent.withValues(alpha: 0.85),
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  final String title;
  final double completionRate;
  final double executedPages;
  final double remainingPages;

  const _ProgressCard({
    required this.title,
    required this.completionRate,
    required this.executedPages,
    required this.remainingPages,
  });

  @override
  Widget build(BuildContext context) {
    final safeValue = (completionRate / 100).isFinite
        ? (completionRate / 100).clamp(0.0, 1.0)
        : 0.0;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                  ),
                ),
              ),
              Text(
                '${completionRate.toStringAsFixed(0)}%',
                style: const TextStyle(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w900,
                  fontSize: 28,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: safeValue,
              minHeight: 9,
              color: AppColors.primaryLight,
              backgroundColor: AppColors.borderLight.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  'تم تنفيذ ${_formatPages(executedPages)} صفحة',
                  style: const TextStyle(
                    color: AppColors.textSecondaryLight,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                'المتبقي ${_formatPages(remainingPages)} صفحة',
                style: const TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ApprovedStateCard extends StatelessWidget {
  const _ApprovedStateCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 18),
      decoration: BoxDecoration(
        color: AppColors.successLight.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: AppColors.successLight.withValues(alpha: 0.16),
        ),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_rounded, color: AppColors.successLight),
          SizedBox(width: 8),
          Text(
            'تم اعتماد الخطة',
            style: TextStyle(
              color: AppColors.successLight,
              fontWeight: FontWeight.w900,
              fontSize: 18,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderMetric extends StatelessWidget {
  final String value;
  final String label;

  const _HeaderMetric({
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Text(
            value,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 20,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  final Color background;

  const _StatusChip({
    required this.label,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
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

class _MonthlyPlanEditSheet extends StatefulWidget {
  final TeacherMonthlyPlanDto plan;

  const _MonthlyPlanEditSheet({required this.plan});

  @override
  State<_MonthlyPlanEditSheet> createState() => _MonthlyPlanEditSheetState();
}

class _MonthlyPlanEditSheetState extends State<_MonthlyPlanEditSheet> {
  late _PlanTab _selectedTab;
  late QuranRangeValue _hifzRange;
  late QuranRangeValue _reviewRange;
  late final TextEditingController _notesController;

  @override
  void initState() {
    super.initState();
    _selectedTab = _PlanTab.hifz;
    _hifzRange = QuranRangeValue(
      fromSurah: widget.plan.hifz.fromSurah,
      fromAyah: widget.plan.hifz.fromAyah,
      toSurah: widget.plan.hifz.toSurah,
      toAyah: widget.plan.hifz.toAyah,
    );
    _reviewRange = QuranRangeValue(
      fromSurah: widget.plan.review.fromSurah,
      fromAyah: widget.plan.review.fromAyah,
      toSurah: widget.plan.review.toSurah,
      toAyah: widget.plan.review.toAyah,
    );
    _notesController = TextEditingController(text: widget.plan.notes ?? '');
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final selectedRange =
        _selectedTab == _PlanTab.hifz ? _hifzRange : _reviewRange;
    final pageMultiplier = _selectedTab == _PlanTab.hifz ? 1 : 2;
    final targetPages = selectedRange.estimatedPages * pageMultiplier;
    final dailyRate = targetPages / 22;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFFF7F8F5),
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 46,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD9DDD4),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'تعديل الخطة',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'يمكنك تعديل نطاق الحفظ والمراجعة ثم حفظ الخطة قبل اعتمادها.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                ),
                const SizedBox(height: AppSpacing.md),
                _PlanTabSelector(
                  selectedTab: _selectedTab,
                  onChanged: (tab) => setState(() => _selectedTab = tab),
                ),
                const SizedBox(height: AppSpacing.md),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedTab == _PlanTab.hifz
                            ? 'نطاق الحفظ'
                            : 'نطاق المراجعة',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _selectedTab == _PlanTab.hifz
                            ? 'عند اختيار السورة تُضبط الآية تلقائياً ويمكن اختيار آية أخرى من القائمة المقيدة.'
                            : 'خطة المراجعة مضبوطة افتراضياً لتكرار المادة مرتين خلال الشهر.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondaryLight,
                              fontWeight: FontWeight.w600,
                              height: 1.35,
                            ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      QuranRangePicker(
                        value: selectedRange,
                        onChanged: (range) {
                          setState(() {
                            if (_selectedTab == _PlanTab.hifz) {
                              _hifzRange = range;
                            } else {
                              _reviewRange = range;
                            }
                          });
                        },
                        accent: _selectedTab == _PlanTab.hifz
                            ? AppColors.primaryLight
                            : AppColors.infoLight,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                _TargetPagesCard(
                  targetPages: targetPages,
                  dailyRate: dailyRate,
                  accent: _selectedTab == _PlanTab.hifz
                      ? AppColors.primaryLight
                      : AppColors.infoLight,
                  subtitle: _selectedTab == _PlanTab.hifz
                      ? 'محسوبة تلقائياً من النطاق'
                      : 'محسوبة تلقائياً من النطاق × مرتين',
                ),
                const SizedBox(height: AppSpacing.md),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ملاحظات المعلم',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _notesController,
                        maxLines: 4,
                        decoration: const InputDecoration(
                          hintText: 'أضف ملاحظة مرتبطة بالخطة أو بالتعديل...',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).pop(
                        _PlanEditResult(
                          hifzRange: _hifzRange,
                          reviewRange: _reviewRange,
                          notes: _notesController.text,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryLight,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(22),
                      ),
                    ),
                    icon: const Icon(Icons.save_outlined),
                    label: const Text(
                      'حفظ التعديلات',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PlanEditResult {
  final QuranRangeValue hifzRange;
  final QuranRangeValue reviewRange;
  final String notes;

  const _PlanEditResult({
    required this.hifzRange,
    required this.reviewRange,
    required this.notes,
  });
}

Map<String, dynamic> _buildSegmentPayload({
  required String prefix,
  required QuranRangeValue range,
  required int pageMultiplier,
}) {
  final targetPages = range.estimatedPages * pageMultiplier;
  final output = <String, dynamic>{};

  if (range.fromSurah != null) output['${prefix}FromSurah'] = range.fromSurah;
  if (range.fromAyah != null) output['${prefix}FromAyah'] = range.fromAyah;
  if (range.toSurah != null) output['${prefix}ToSurah'] = range.toSurah;
  if (range.toAyah != null) output['${prefix}ToAyah'] = range.toAyah;
  output['${prefix}TargetPages'] = double.parse(targetPages.toStringAsFixed(1));
  output['${prefix}DailyRate'] =
      double.parse((targetPages / 22).toStringAsFixed(2));

  return output;
}

bool _isValidOrderedRange(QuranRangeValue range) {
  if (!range.isComplete) return false;

  return range.fromSurah! < range.toSurah! ||
      (range.fromSurah == range.toSurah && range.fromAyah! <= range.toAyah!);
}

bool _isApproved(String status) => status.trim().toUpperCase() == 'APPROVED';

double _remainingPages({
  required double? target,
  required double executed,
}) {
  final resolvedTarget = target ?? 0;
  return (resolvedTarget - executed).clamp(0, double.infinity).toDouble();
}

String? _resolveStudentOrder(
  AsyncValue<TeacherMonthlyPlansListDto> rosterAsync,
  int currentPlanId,
) {
  final plans = rosterAsync.valueOrNull?.plans.toList(growable: false);
  if (plans == null || plans.isEmpty) return null;

  final sorted = plans.toList(growable: false)
    ..sort(
      (a, b) => (a.student?.fullName ?? '').compareTo(
        b.student?.fullName ?? '',
      ),
    );
  final index = sorted.indexWhere((plan) => plan.id == currentPlanId);
  if (index < 0) return null;

  return 'الطالب ${index + 1} من ${sorted.length}';
}

String _formatLatestReached(TeacherPlanLatestReachedDto? latestReached) {
  if (latestReached?.toSurah == null || latestReached?.toAyah == null) {
    return 'لا يوجد سجل حفظ نهائي بعد';
  }

  final surah = QuranData.findByNumber(latestReached!.toSurah!);
  final surahName = surah?.name ?? 'سورة ${latestReached.toSurah}';
  return '$surahName - آية ${latestReached.toAyah}';
}

String _formatSegmentStart(TeacherPlanSegmentDto segment) {
  if (segment.fromSurah == null || segment.fromAyah == null) {
    return 'غير محدد';
  }

  final surah = QuranData.findByNumber(segment.fromSurah!);
  return '${surah?.name ?? 'سورة ${segment.fromSurah}'} - آية ${segment.fromAyah}';
}

String _formatSegmentEnd(TeacherPlanSegmentDto segment) {
  if (segment.toSurah == null || segment.toAyah == null) {
    return 'غير محدد';
  }

  final surah = QuranData.findByNumber(segment.toSurah!);
  return '${surah?.name ?? 'سورة ${segment.toSurah}'} - آية ${segment.toAyah}';
}

String _formatPages(double? value) {
  if (value == null) return '0';

  return value == value.roundToDouble()
      ? value.toStringAsFixed(0)
      : value.toStringAsFixed(1);
}

String? _levelLabel(String? level) {
  final raw = level?.trim();
  if (raw == null || raw.isEmpty) return null;

  switch (raw.toUpperCase()) {
    case 'BEGINNER':
      return 'مبتدئ';
    case 'INTERMEDIATE':
      return 'متوسط';
    case 'ADVANCED':
      return 'متقدم';
    default:
      return raw;
  }
}

Color _levelColor(String level) {
  switch (level) {
    case 'مبتدئ':
      return AppColors.warningLight;
    case 'متوسط':
      return AppColors.infoLight;
    case 'متقدم':
      return AppColors.successLight;
    default:
      return AppColors.primaryLight;
  }
}
