import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/exam_dtos.dart';
import 'exam_shared_widgets.dart';

// ─── Model used by parent ────────────────────────────────────────────────────
class QuestionDraftResult {
  final int id;
  final int orderIndex;
  final int fromSurah;
  final int fromAyah;
  final int toSurah;
  final int toAyah;
  final double prompting;
  final double reminding;
  final double tajweed;
  final bool isEvaluated;

  const QuestionDraftResult({
    required this.id,
    required this.orderIndex,
    required this.fromSurah,
    required this.fromAyah,
    required this.toSurah,
    required this.toAyah,
    required this.prompting,
    required this.reminding,
    required this.tajweed,
    required this.isEvaluated,
  });

  double get totalDeduction => prompting + reminding + tajweed;
}

/// شاشة مراجعة التقييم قبل الحفظ النهائي (مكافئ ExamCertificationScreen في الويب)
class ExamCertificationSheet extends StatefulWidget {
  final ExamAttemptDto attempt;
  final double theoreticalTajweedScore;
  final double performanceScore;
  final List<QuestionDraftResult> questions;
  final String strengthNotes;
  final String weaknessNotes;
  final String committeeNotes;
  final ValueChanged<String> onStrengthNotesChanged;
  final ValueChanged<String> onWeaknessNotesChanged;
  final ValueChanged<String> onCommitteeNotesChanged;
  final VoidCallback onBack;
  final Future<void> Function() onSave;
  final bool isSubmitting;

  const ExamCertificationSheet({
    super.key,
    required this.attempt,
    required this.theoreticalTajweedScore,
    required this.performanceScore,
    required this.questions,
    required this.strengthNotes,
    required this.weaknessNotes,
    required this.committeeNotes,
    required this.onStrengthNotesChanged,
    required this.onWeaknessNotesChanged,
    required this.onCommitteeNotesChanged,
    required this.onBack,
    required this.onSave,
    this.isSubmitting = false,
  });

  @override
  State<ExamCertificationSheet> createState() => _ExamCertificationSheetState();
}

class _ExamCertificationSheetState extends State<ExamCertificationSheet> {
  late final TextEditingController _committeeController;

  @override
  void initState() {
    super.initState();
    _committeeController = TextEditingController(text: widget.committeeNotes);
  }

  @override
  void dispose() {
    _committeeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final exam = widget.attempt.exam;
    final maxScore = (exam?.maxScore ?? 100);
    final passScore = (exam?.passScore ?? 0);
    final questionDeductions = widget.questions.fold<double>(
      0,
      (s, q) => s + q.totalDeduction,
    );
    final scoreDeductions =
        widget.theoreticalTajweedScore + widget.performanceScore;
    final totalDeductions = scoreDeductions + questionDeductions;
    final finalScore = (maxScore - totalDeductions).clamp(0.0, maxScore);
    final isPass = finalScore >= passScore;
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return ExamSheetScaffold(
      title: 'مراجعة وحفظ التقييم',
      subtitle: widget.attempt.student?.fullName ?? 'الطالب',
      bottom: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: widget.onBack,
              icon: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
              label: const Text('رجوع'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: FilledButton.icon(
              onPressed: widget.isSubmitting ? null : widget.onSave,
              style: FilledButton.styleFrom(
                backgroundColor: primary,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              icon: widget.isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.save_alt_rounded, size: 20),
              label: const Text('حفظ التقييم'),
            ),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── ملخص الدرجات ─────────────────────────────────────────────
          _sectionTitle(context, 'ملخص الدرجات', Icons.bar_chart_rounded),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 2.4,
            children: [
              _ScoreChip(
                label: 'التجويد النظري',
                value: widget.theoreticalTajweedScore,
                color: custom.info,
              ),
              _ScoreChip(
                label: 'الأداء العام',
                value: widget.performanceScore,
                color: custom.info,
              ),
              _ScoreChip(
                label: 'خصومات الأسئلة',
                value: -questionDeductions,
                color: custom.warning,
              ),
              _ScoreChip(
                label: 'الإجمالي الكلي للخصم',
                value: -totalDeductions,
                color: Theme.of(context).colorScheme.error,
              ),
              _ScoreChip(
                label: 'النتيجة الحالية',
                value: finalScore,
                color: isPass ? custom.success : custom.warning,
                bold: true,
              ),
              _ScoreChip(
                label: 'حالة الاجتياز',
                valueText: isPass ? 'مجتاز ✓' : 'غير مجتاز',
                color: isPass ? custom.success : Theme.of(context).colorScheme.error,
                bold: true,
              ),
            ],
          ),
          const SizedBox(height: 18),

          // ─── جدول الأسئلة ─────────────────────────────────────────────
          _sectionTitle(context, 'الأسئلة والخصومات', Icons.list_alt_rounded),
          const SizedBox(height: 8),
          _QuestionsTable(questions: widget.questions),
          const SizedBox(height: 18),

          // ─── ملاحظات اللجنة ──────────────────────────────────────────
          _sectionTitle(context, 'ملاحظات اللجنة', Icons.comment_rounded),
          const SizedBox(height: 10),

          // جوانب التميز
          _SearchableMultiSelect(
            label: 'جوانب التميز',
            options: examStrengthSuggestions,
            selected: splitListText(widget.strengthNotes),
            color: custom.success,
            onChanged: (list) => widget.onStrengthNotesChanged(list.join('، ')),
          ),
          const SizedBox(height: 12),
          // جوانب القصور
          _SearchableMultiSelect(
            label: 'جوانب القصور',
            options: examWeaknessSuggestions,
            selected: splitListText(widget.weaknessNotes),
            color: custom.warning,
            onChanged: (list) => widget.onWeaknessNotesChanged(list.join('، ')),
          ),
          const SizedBox(height: 10),

          // ملاحظات ختامية
          TextField(
            controller: _committeeController,
            minLines: 3,
            maxLines: 5,
            style: TextStyle(color: context.textPrimaryColor),
            decoration: examInputDecoration(context, 'الملاحظات الختامية للجنة...'),
            onChanged: widget.onCommitteeNotesChanged,
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(BuildContext ctx, String text, IconData icon) {
    final primary = Theme.of(ctx).colorScheme.primary;

    return Row(
      children: [
        Icon(icon, size: 18, color: primary),
        const SizedBox(width: 8),
        Text(text,
            style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  color: ctx.textPrimaryColor,
                )),
      ],
    );
  }
}

// ─── Sub-widgets ─────────────────────────────────────────────────────────────

class _SearchableMultiSelect extends StatelessWidget {
  final String label;
  final List<String> options;
  final List<String> selected;
  final Color color;
  final ValueChanged<List<String>> onChanged;

  const _SearchableMultiSelect({
    required this.label,
    required this.options,
    required this.selected,
    required this.color,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
                color: context.textSecondaryColor,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () async {
            final result = await showModalBottomSheet<List<String>>(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (ctx) => _MultiSelectSearchSheet(
                title: label,
                options: options,
                initialSelected: selected,
                color: color,
              ),
            );
            if (result != null) {
              onChanged(result);
            }
          },
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.borderColor),
            ),
            child: Row(
              children: [
                Expanded(
                  child: selected.isEmpty
                      ? Text(
                          'اختر من القائمة...',
                          style: TextStyle(
                                color: context.textSecondaryColor,
                                fontSize: 13,
                              ),
                        )
                      : Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: selected
                              .map((s) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: context.isDark ? 0.20 : 0.10),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                          color: color.withValues(alpha: context.isDark ? 0.35 : 0.20)),
                                    ),
                                    child: Text(
                                      s,
                                      style: TextStyle(
                                        color: color,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                ),
                Icon(Icons.search_rounded,
                    size: 18, color: context.textSecondaryColor),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MultiSelectSearchSheet extends StatefulWidget {
  final String title;
  final List<String> options;
  final List<String> initialSelected;
  final Color color;

  const _MultiSelectSearchSheet({
    required this.title,
    required this.options,
    required this.initialSelected,
    required this.color,
  });

  @override
  State<_MultiSelectSearchSheet> createState() =>
      _MultiSelectSearchSheetState();
}

class _MultiSelectSearchSheetState extends State<_MultiSelectSearchSheet> {
  late List<String> _selected;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _selected = List.from(widget.initialSelected);
  }

  @override
  Widget build(BuildContext context) {
    final filtered =
        widget.options.where((opt) => opt.contains(_query)).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: context.borderColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title,
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      color: context.textPrimaryColor,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, _selected),
                  child: const Text('تم'),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: TextField(
              autofocus: true,
              style: TextStyle(color: context.textPrimaryColor),
              decoration: InputDecoration(
                hintText: 'بحث...',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: context.surfaceColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: context.borderColor),
                ),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: filtered.length,
              itemBuilder: (ctx, i) {
                final opt = filtered[i];
                final isSel = _selected.contains(opt);
                return ListTile(
                  onTap: () {
                    setState(() {
                      if (isSel) {
                        _selected.remove(opt);
                      } else {
                        _selected.add(opt);
                      }
                    });
                  },
                  title: Text(
                    opt,
                    style: TextStyle(
                      fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                      color: isSel ? widget.color : context.textPrimaryColor,
                    ),
                  ),
                  trailing: Checkbox(
                    value: isSel,
                    activeColor: widget.color,
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          _selected.add(opt);
                        } else {
                          _selected.remove(opt);
                        }
                      });
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ScoreChip extends StatelessWidget {
  final String label;
  final double? value;
  final String? valueText;
  final Color color;
  final bool bold;

  const _ScoreChip({
    required this.label,
    required this.color,
    this.value,
    this.valueText,
    this.bold = false,
  });

  String get _displayValue {
    if (valueText != null) return valueText!;
    final v = value ?? 0;
    return v % 1 == 0 ? v.toInt().toString() : v.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: context.isDark ? 0.12 : 0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: context.isDark ? 0.25 : 0.20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label,
              style: TextStyle(
                    color: context.textSecondaryColor,
                    fontSize: 11,
                  ),
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Text(_displayValue,
              style: TextStyle(
                    color: color,
                    fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
                    fontSize: 14,
                  )),
        ],
      ),
    );
  }
}

class _QuestionsTable extends StatelessWidget {
  final List<QuestionDraftResult> questions;

  const _QuestionsTable({required this.questions});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    if (questions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.borderColor),
        ),
        child: Text('لا توجد أسئلة مرتبطة',
            style: TextStyle(color: context.textSecondaryColor, fontSize: 13)),
      );
    }

    final headerStyle = TextStyle(
          color: context.textSecondaryColor,
          fontWeight: FontWeight.w800,
          fontSize: 11,
        );
    final cellStyle = TextStyle(color: context.textPrimaryColor, fontSize: 12);

    return Container(
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.borderColor),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Table(
          columnWidths: const {
            0: FlexColumnWidth(0.5),
            1: FlexColumnWidth(2.5),
            2: FlexColumnWidth(1),
            3: FlexColumnWidth(1),
            4: FlexColumnWidth(1),
            5: FlexColumnWidth(1),
          },
          children: [
            // رأس الجدول
            TableRow(
              decoration: BoxDecoration(
                color: primary.withValues(alpha: context.isDark ? 0.15 : 0.07),
              ),
              children: [
                _Cell(child: Text('#', style: headerStyle)),
                _Cell(child: Text('النطاق', style: headerStyle)),
                _Cell(
                    child: Text('تلقين',
                        style: headerStyle, textAlign: TextAlign.center)),
                _Cell(
                    child: Text('تنبيه',
                        style: headerStyle, textAlign: TextAlign.center)),
                _Cell(
                    child: Text('تجويد',
                        style: headerStyle, textAlign: TextAlign.center)),
                _Cell(
                  child: Text('إجمالي',
                      style: headerStyle, textAlign: TextAlign.center),
                ),
              ],
            ),
            // صفوف الأسئلة
            ...questions.map((q) {
              final total = q.totalDeduction;
              return TableRow(
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: context.borderColor),
                  ),
                ),
                children: [
                  _Cell(
                    child: Text('${q.orderIndex}',
                        style:
                            cellStyle.copyWith(fontWeight: FontWeight.w800)),
                  ),
                  _Cell(
                    child: Text(
                      '${surahName(q.fromSurah).replaceFirst('سورة ', '')} ${q.fromAyah} - ${surahName(q.toSurah).replaceFirst('سورة ', '')} ${q.toAyah}',
                      style: cellStyle.copyWith(fontSize: 10),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _Cell(
                    child: Text(
                      _fmt(q.prompting),
                      style: cellStyle.copyWith(
                        color: q.prompting > 0 ? Theme.of(context).colorScheme.error : null,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  _Cell(
                    child: Text(
                      _fmt(q.reminding),
                      style: cellStyle.copyWith(
                        color: q.reminding > 0 ? context.customColors.warning : null,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  _Cell(
                    child: Text(
                      _fmt(q.tajweed),
                      style: cellStyle.copyWith(
                        color: q.tajweed > 0 ? context.customColors.info : null,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  _Cell(
                    child: Text(
                      total == 0 ? '—' : _fmt(total),
                      style: cellStyle.copyWith(
                        color: total > 0 ? Theme.of(context).colorScheme.error : null,
                        fontWeight: total > 0 ? FontWeight.w800 : null,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }

  String _fmt(double v) => v % 1 == 0 ? v.toInt().toString() : v.toString();
}

class _Cell extends StatelessWidget {
  final Widget child;
  const _Cell({required this.child});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: child,
    );
  }
}
