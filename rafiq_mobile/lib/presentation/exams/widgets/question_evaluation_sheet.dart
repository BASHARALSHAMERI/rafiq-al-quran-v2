import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../application/exams/exam_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/exam_dtos.dart';
import 'exam_shared_widgets.dart';

// ponytail: surahName shared in exam_shared_widgets.dart

double _clampHalf(double v) => (v * 2).round() / 2;

// ─── Question Evaluation Sheet ──────────────────────────────────────────────

class QuestionEvaluationSheet extends ConsumerStatefulWidget {
  final ExamAttemptQuestionDto question;
  final bool canEdit;
  final ExamCriteriaDto? criteria;
  final void Function({
    required int id,
    required double promptingDeductions,
    required double remindingDeductions,
    required double tajweedDeductions,
    required bool isEvaluated,
  }) onConfirm;

  const QuestionEvaluationSheet({
    super.key,
    required this.question,
    required this.canEdit,
    required this.onConfirm,
    this.criteria,
  });

  @override
  ConsumerState<QuestionEvaluationSheet> createState() =>
      _QuestionEvaluationSheetState();
}

class _QuestionEvaluationSheetState
    extends ConsumerState<QuestionEvaluationSheet> {
  late double _prompting;
  late double _reminding;
  late double _tajweed;

  QuranRangePreviewDto? _preview;
  bool _isLoadingPreview = false;
  String? _previewError;
  bool _showFullMushaf = false;

  @override
  void initState() {
    super.initState();
    _prompting = widget.question.promptingDeductions;
    _reminding = widget.question.remindingDeductions;
    _tajweed = widget.question.tajweedDeductions;
    _loadPreview();
  }

  Future<void> _loadPreview() async {
    setState(() {
      _isLoadingPreview = true;
      _previewError = null;
    });
    try {
      final preview = await ref
          .read(examControllerProvider.notifier)
          .previewQuranRange(
            fromSurah: widget.question.fromSurah,
            fromAyah: widget.question.fromAyah,
            toSurah: widget.question.toSurah,
            toAyah: widget.question.toAyah,
          );
      if (mounted) setState(() => _preview = preview);
    } catch (e) {
      if (mounted) setState(() => _previewError = 'تعذر تحميل الآيات المرجعية');
    } finally {
      if (mounted) setState(() => _isLoadingPreview = false);
    }
  }

  double get _promptingPenalty => widget.criteria?.promptingPenalty ?? 0.5;
  double get _remindingPenalty => widget.criteria?.remindingPenalty ?? 0.5;
  double get _tajweedPenalty => widget.criteria?.tajweedPenalty ?? 0.5;
  double get _totalDeductions => _prompting + _reminding + _tajweed;

  @override
  Widget build(BuildContext context) {
    final q = widget.question;
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return ExamSheetScaffold(
      title: 'تقييم إجابة السؤال',
      subtitle:
          'سؤال رقم ${q.orderIndex} • من ${surahName(q.fromSurah)} إلى ${surahName(q.toSurah)}',
      bottom: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('إلغاء'),
            ),
          ),
          if (widget.canEdit) ...[
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: FilledButton(
                onPressed: () {
                  widget.onConfirm(
                    id: q.id,
                    promptingDeductions: _prompting,
                    remindingDeductions: _reminding,
                    tajweedDeductions: _tajweed,
                    isEvaluated: true,
                  );
                  Navigator.of(context).pop();
                },
                style: FilledButton.styleFrom(
                  backgroundColor: primary,
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('اعتماد التقييم للسؤال'),
              ),
            ),
          ],
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── النطاق المرجعي ───────────────────────────────────────────
          _SectionCard(
            title: 'النطاق المرجعي للسؤال',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_preview != null) ...[
                  Text(
                    ' ص ${_preview!.fromPage}-${_preview!.toPage}',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: primary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () =>
                        setState(() => _showFullMushaf = !_showFullMushaf),
                    icon: Icon(
                      _showFullMushaf
                          ? Icons.visibility_off_rounded
                          : Icons.menu_book_rounded,
                      color: primary,
                      size: 20,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    tooltip: _showFullMushaf ? 'إخفاء المصحف' : 'عرض المصحف الكامل',
                  ),
                ],
              ],
            ),
            child: Column(
              children: [
                if (_isLoadingPreview)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Center(
                      child: CircularProgressIndicator(
                          color: primary),
                    ),
                  ),
                if (_previewError != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.error.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(Icons.error_outline_rounded,
                                color: Theme.of(context).colorScheme.error, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _previewError!,
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Theme.of(context).colorScheme.error,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        TextButton.icon(
                          onPressed: _loadPreview,
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: const Text('إعادة محاولة تحميل الآيات'),
                        ),
                      ],
                    ),
                  )
                else if (_preview != null && !_showFullMushaf)
                  Row(
                    children: [
                      Expanded(
                          child: _AyahCard(
                        label: 'بداية المقطع',
                        ayah: _preview!.startAyah,
                        surah: _preview!.fromSurah,
                        ayahNum: _preview!.fromAyah,
                      )),
                      const SizedBox(width: 8),
                      Expanded(
                          child: _AyahCard(
                        label: 'نهاية المقطع',
                        ayah: _preview!.endAyah,
                        surah: _preview!.toSurah,
                        ayahNum: _preview!.toAyah,
                      )),
                    ],
                  ),
                if (_preview != null && _showFullMushaf) ...[
                  const SizedBox(height: 8),
                  _MushafView(surahs: _preview!.surahs),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),

          // ─── رصد الأخطاء والخصومات ────────────────────────────────────
          _SectionCard(
            title: 'رصد الأخطاء والخصومات',
            trailing: widget.canEdit
                ? TextButton.icon(
                    onPressed: () => setState(() {
                      _prompting = 0;
                      _reminding = 0;
                      _tajweed = 0;
                    }),
                    icon: const Icon(Icons.refresh_rounded, size: 15),
                    label: const Text('تصفير الكل'),
                    style: TextButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.error),
                  )
                : null,
            child: Column(
              children: [
                _DeductionCounter(
                  label: 'خطأ تلقيني',
                  penaltyLabel: 'لكل مرة: -$_promptingPenalty',
                  value: _prompting,
                  color: Theme.of(context).colorScheme.error,
                  canEdit: widget.canEdit,
                  onDecrement: () => setState(() {
                    _prompting = _clampHalf(_prompting - _promptingPenalty);
                  }),
                  onIncrement: () => setState(() {
                    _prompting = _clampHalf(_prompting + _promptingPenalty);
                  }),
                ),
                const SizedBox(height: 8),
                _DeductionCounter(
                  label: 'خطأ تنبيهي',
                  penaltyLabel: 'لكل مرة: -$_remindingPenalty',
                  value: _reminding,
                  color: custom.warning,
                  canEdit: widget.canEdit,
                  onDecrement: () => setState(() {
                    _reminding = _clampHalf(_reminding - _remindingPenalty);
                  }),
                  onIncrement: () => setState(() {
                    _reminding = _clampHalf(_reminding + _remindingPenalty);
                  }),
                ),
                const SizedBox(height: 8),
                _DeductionCounter(
                  label: 'خطأ تجويدي',
                  penaltyLabel: 'لكل مرة: -$_tajweedPenalty',
                  value: _tajweed,
                  color: custom.info,
                  canEdit: widget.canEdit,
                  onDecrement: () => setState(() {
                    _tajweed = _clampHalf(_tajweed - _tajweedPenalty);
                  }),
                  onIncrement: () => setState(() {
                    _tajweed = _clampHalf(_tajweed + _tajweedPenalty);
                  }),
                ),
                const SizedBox(height: 12),
                // إجمالي الخصم
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: Theme.of(context).colorScheme.error.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('إجمالي الخصم',
                                style: TextStyle(fontWeight: FontWeight.w800, color: context.textPrimaryColor)),
                            Text('سيتم خصمه من الدرجة النهائية',
                                style: TextStyle(
                                    color: context.textSecondaryColor, fontSize: 12)),
                          ],
                        ),
                      ),
                      Text(
                        '-${_totalDeductions % 1 == 0 ? _totalDeductions.toInt() : _totalDeductions}',
                        style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                              fontWeight: FontWeight.w900,
                              fontSize: 20,
                            ),
                      ),
                    ],
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

// ─── Sub-widgets ─────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget? trailing;
  final Widget child;

  const _SectionCard({
    required this.title,
    required this.child,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: context.textPrimaryColor),
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _AyahCard extends StatelessWidget {
  final String label;
  final QuranPreviewAyahDto? ayah;
  final int surah;
  final int ayahNum;

  const _AyahCard({
    required this.label,
    required this.ayah,
    required this.surah,
    required this.ayahNum,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: primary.withValues(alpha: context.isDark ? 0.12 : 0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: primary.withValues(alpha: context.isDark ? 0.25 : 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                    color: primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  )),
          const SizedBox(height: 6),
          if (ayah != null)
            Text(
              ayah!.text,
              style: TextStyle(
                    fontFamily: 'Amiri',
                    fontSize: 15,
                    height: 1.8,
                    color: context.textPrimaryColor,
                  ),
              textDirection: TextDirection.rtl,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
            ),
          const SizedBox(height: 6),
          Text(
            'سورة ${surahName(surah).replaceFirst('سورة ', '')} • آية $ayahNum',
            style: TextStyle(color: context.textSecondaryColor, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _MushafView extends StatelessWidget {
  final List<QuranSurahPreviewDto> surahs;

  const _MushafView({required this.surahs});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Container(
      constraints: const BoxConstraints(maxHeight: 320),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: surahs.map((s) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: primary.withValues(alpha: context.isDark ? 0.15 : 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      surahName(s.surahNumber),
                      style: TextStyle(
                            color: primary,
                            fontWeight: FontWeight.w800,
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    textDirection: TextDirection.rtl,
                    children: s.ayahs.map((a) {
                      return Text(
                        '${a.text} ﴿${a.ayahNumber}﴾ ',
                        style: TextStyle(
                              fontFamily: 'Amiri',
                              fontSize: 15,
                              height: 2,
                              color: context.textPrimaryColor,
                            ),
                        textDirection: TextDirection.rtl,
                      );
                    }).toList(),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _DeductionCounter extends StatelessWidget {
  final String label;
  final String penaltyLabel;
  final double value;
  final Color color;
  final bool canEdit;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  const _DeductionCounter({
    required this.label,
    required this.penaltyLabel,
    required this.value,
    required this.color,
    required this.canEdit,
    required this.onDecrement,
    required this.onIncrement,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: context.isDark ? 0.12 : 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: context.isDark ? 0.25 : 0.18)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: color,
                        )),
                Text(penaltyLabel,
                    style: TextStyle(
                          color: context.textSecondaryColor,
                          fontSize: 11,
                        )),
              ],
            ),
          ),
          // عداد − value +
          Row(
            children: [
              _CounterBtn(
                icon: Icons.remove_rounded,
                onPressed: canEdit && value > 0 ? onDecrement : null,
                color: color,
              ),
              SizedBox(
                width: 44,
                child: Text(
                  value % 1 == 0 ? value.toInt().toString() : value.toString(),
                  style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        color: value > 0 ? color : context.textSecondaryColor,
                      ),
                  textAlign: TextAlign.center,
                ),
              ),
              _CounterBtn(
                icon: Icons.add_rounded,
                onPressed: canEdit ? onIncrement : null,
                color: color,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CounterBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final Color color;

  const _CounterBtn({
    required this.icon,
    required this.color,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: onPressed != null
          ? color.withValues(alpha: context.isDark ? 0.20 : 0.10)
          : Colors.transparent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon,
              size: 18,
              color: onPressed != null
                  ? color
                  : context.textSecondaryColor),
        ),
      ),
    );
  }
}
