import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/teacher/teacher_panel_providers.dart';

import '../../core/constants/app_spacing.dart';
import '../../core/constants/quran_data.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_snack_bar.dart';
import '../../core/utils/period_label_formatter.dart';
import '../../data/models/teacher_panel_dtos.dart';
import '../shared/states/app_error_state.dart';
import '../shared/states/app_loading_state.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/quran_range_picker.dart';
import '../shared/widgets/standard_app_bar.dart';

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
      AppSnackBar.warning(context, 'تأكد من صحة نطاق الآيات قبل الحفظ.');
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
      AppSnackBar.success(context, 'تم حفظ تعديل الخطة الشهرية.');
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.error(
        context,
        'تعذر حفظ التعديلات. يرجى المحاولة مرة أخرى.',
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
      AppSnackBar.success(context, 'تم اعتماد الخطة بنجاح.');
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.error(
        context,
        'تعذر اعتماد الخطة. يرجى المحاولة مرة أخرى.',
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
    final planAsync =
        ref.watch(teacherMonthlyPlanDetailsProvider(widget.planId));

    return Scaffold(

      backgroundColor: const Color(0xFFF7F8F5),
      appBar: const StandardAppBar(title: 'الخطة الشهرية'),
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
          final selectedSegment =
              _selectedTab == _PlanTab.hifz ? plan.hifz : plan.review;
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
                  periodLabel: planLabel,
                  levelLabel: _levelLabel(plan.student?.level),
                  dailyRateLabel:
                      '${_formatPages(plan.hifz.dailyRate)} صفحة/يوم',
                  attendanceLabel:
                      '${plan.progress.attendance.presentDays}/${plan.progress.attendance.totalDays}',
                  memorizedPagesLabel: '${plan.progress.memorizedPages ?? 0}',
                ),
                const SizedBox(height: AppSpacing.md),
                _PlanTabSelector(
                  selectedTab: _selectedTab,
                  onChanged: (tab) => setState(() => _selectedTab = tab),
                ),
                const SizedBox(height: AppSpacing.md),
                _PlanDetailsCard(
                  title: _selectedTab == _PlanTab.hifz
                      ? 'تفاصيل خطة الحفظ'
                      : 'تفاصيل خطة المراجعة',
                  segment: selectedSegment,
                  latestReached: plan.progress.latestReached,
                  note: _selectedTab == _PlanTab.review
                      ? 'تُراجع مادة الشهر مرتين افتراضياً ويمكن تعديلها.'
                      : plan.notes,
                  isApproved: isApproved,
                  accent: _selectedTab == _PlanTab.hifz
                      ? AppColors.primaryLight
                      : AppColors.infoLight,
                  pageSubtitle: _selectedTab == _PlanTab.review
                      ? 'النطاق نفسه محسوب للمراجعة مرتين'
                      : 'عدد الصفحات محسوب تلقائياً من نطاق الآيات',
                  onEdit: isApproved ? null : () => _openEditSheet(plan),
                ),
                if (isApproved) ...[
                  const SizedBox(height: AppSpacing.md),
                  const _ApprovedStateCard(),

                ] else ...[
                  const SizedBox(height: AppSpacing.lg),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _isApproving ? null : () => _approvePlan(plan),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
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
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          fontFamily: 'Cairo',
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
  final String periodLabel;
  final String? levelLabel;
  final String dailyRateLabel;
  final String attendanceLabel;
  final String memorizedPagesLabel;

  const _StudentHeaderCard({
    required this.studentName,
    required this.periodLabel,
    required this.levelLabel,
    required this.dailyRateLabel,
    required this.attendanceLabel,
    required this.memorizedPagesLabel,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: AppColors.primaryLight.withValues(alpha: 0.08),
                child: Text(
                  studentName.trim().isEmpty ? 'ط' : studentName.trim()[0],
                  style: const TextStyle(
                    color: AppColors.primaryLight,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      studentName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: AppColors.textPrimaryLight,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      periodLabel,
                      style: const TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (levelLabel != null)
                _StatusChip(
                  label: levelLabel!,
                  color: _levelColor(levelLabel!),
                  background: _levelColor(levelLabel!).withValues(alpha: 0.08),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.borderLight),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _HeaderMetric(
                  value: dailyRateLabel,
                  label: 'معدل الحفظ',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _HeaderMetric(
                  value: attendanceLabel,
                  label: 'يوم حضور',
                ),
              ),
              const SizedBox(width: 8),
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
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F3F0),
        borderRadius: BorderRadius.circular(16),
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
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 13,
            fontFamily: 'Cairo',
            color: selected
                ? AppColors.textPrimaryLight
                : AppColors.textSecondaryLight,
          ),
        ),
      ),
    );
  }
}

class _PlanDetailsCard extends StatelessWidget {
  final String title;
  final TeacherPlanSegmentDto segment;
  final TeacherPlanLatestReachedDto? latestReached;
  final String? note;
  final bool isApproved;
  final Color accent;
  final String pageSubtitle;
  final VoidCallback? onEdit;

  const _PlanDetailsCard({
    required this.title,
    required this.segment,
    required this.latestReached,
    required this.note,
    required this.isApproved,
    required this.accent,
    required this.pageSubtitle,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final rangeStart = _formatSegmentStart(segment);
    final rangeEnd = _formatSegmentEnd(segment);
    final latestReachedStr = _formatLatestReached(latestReached);

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: AppColors.textPrimaryLight,
                  fontFamily: 'Cairo',
                ),
              ),
              if (!isApproved && onEdit != null)
                SizedBox(
                  height: 32,
                  child: TextButton.icon(
                    onPressed: onEdit,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                      foregroundColor: accent,
                    ),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text(
                      'تعديل النطاق',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.borderLight),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'النطاق المقترح للشهر',
                      style: TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$rangeStart - $rangeEnd',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: AppColors.textPrimaryLight,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 1,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'آخر موضع وصل إليه',
                      style: TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      latestReachedStr,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: AppColors.textPrimaryLight,
                        fontFamily: 'Cairo',
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: accent.withValues(alpha: 0.12)),
            ),
            child: Row(
              children: [
                Icon(Icons.adjust_rounded, color: accent, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'الصفحات المستهدفة: ${_formatPages(segment.targetPages)} صفحة',
                        style: TextStyle(
                          color: accent,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$pageSubtitle · ${_formatPages(segment.dailyRate)} صفحة/يوم',
                        style: TextStyle(
                          color: accent.withValues(alpha: 0.8),
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (note != null && note!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                note!,
                style: const TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                  fontFamily: 'Cairo',
                  height: 1.4,
                ),
              ),
            ),
          ],
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
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.successLight.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.successLight.withValues(alpha: 0.16),
        ),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_rounded, color: AppColors.successLight, size: 20),
          SizedBox(width: 8),
          Text(
            'تم اعتماد الخطة',
            style: TextStyle(
              color: AppColors.successLight,
              fontWeight: FontWeight.w800,
              fontSize: 15,
              fontFamily: 'Cairo',
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
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: [
          Text(
            value,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 15,
              height: 1.2,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w700,
              fontSize: 11,
              fontFamily: 'Cairo',
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w800,
          fontSize: 11,
          fontFamily: 'Cairo',
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: accent.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: accent.withValues(alpha: 0.1)),
            ),
            child: Icon(Icons.adjust_rounded, color: accent, size: 20),
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
                    fontSize: 11,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_formatPages(targetPages)} صفحة',
                  style: TextStyle(
                    color: accent,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    fontFamily: 'Cairo',
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$subtitle · ${_formatPages(dailyRate)} صفحة/يوم',
                  style: TextStyle(
                    color: accent.withValues(alpha: 0.8),
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    fontFamily: 'Cairo',
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

