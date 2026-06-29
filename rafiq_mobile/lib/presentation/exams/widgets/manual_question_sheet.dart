import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import 'exam_shared_widgets.dart';

/// Sheet لإضافة سؤال يدوياً لمحاولة الاختبار
class ManualQuestionSheet extends StatefulWidget {
  final bool isSubmitting;
  final Future<void> Function({
    required int fromSurah,
    required int fromAyah,
    required int toSurah,
    required int toAyah,
  }) onSubmit;

  const ManualQuestionSheet({
    super.key,
    required this.onSubmit,
    this.isSubmitting = false,
  });

  @override
  State<ManualQuestionSheet> createState() => _ManualQuestionSheetState();
}

class _ManualQuestionSheetState extends State<ManualQuestionSheet> {
  int _fromSurah = 1;
  int _toSurah = 1;
  final _fromAyahController = TextEditingController(text: '1');
  final _toAyahController = TextEditingController(text: '1');
  String? _error;

  @override
  void dispose() {
    _fromAyahController.dispose();
    _toAyahController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);

    final fromAyah = int.tryParse(_fromAyahController.text.trim()) ?? 0;
    final toAyah = int.tryParse(_toAyahController.text.trim()) ?? 0;

    if (fromAyah < 1) {
      setState(() => _error = 'رقم الآية الأولى غير صحيح');
      return;
    }
    if (toAyah < 1) {
      setState(() => _error = 'رقم الآية الأخيرة غير صحيح');
      return;
    }

    try {
      await widget.onSubmit(
        fromSurah: _fromSurah,
        fromAyah: fromAyah,
        toSurah: _toSurah,
        toAyah: toAyah,
      );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return ExamSheetScaffold(
      title: 'إضافة سؤال يدوياً',
      subtitle: 'تحديد النطاق القرآني للسؤال',
      bottom: SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: widget.isSubmitting ? null : _submit,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primaryLight,
            minimumSize: const Size.fromHeight(52),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          icon: widget.isSubmitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : const Icon(Icons.add_circle_outline_rounded, size: 20),
          label: const Text('إضافة السؤال'),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: ExamInlineWarningCard(message: _error!),
            ),

          // ─── من ───────────────────────────────────────────────────────
          _RangeSection(
            title: 'من',
            selectedSurah: _fromSurah,
            ayahController: _fromAyahController,
            onSurahChanged: (v) => setState(() => _fromSurah = v),
          ),
          const SizedBox(height: 14),

          // ─── إلى ─────────────────────────────────────────────────────
          _RangeSection(
            title: 'إلى',
            selectedSurah: _toSurah,
            ayahController: _toAyahController,
            onSurahChanged: (v) => setState(() => _toSurah = v),
          ),
        ],
      ),
    );
  }
}

class _RangeSection extends StatelessWidget {
  final String title;
  final int selectedSurah;
  final TextEditingController ayahController;
  final ValueChanged<int> onSurahChanged;

  const _RangeSection({
    required this.title,
    required this.selectedSurah,
    required this.ayahController,
    required this.onSurahChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.primaryLight,
                  )),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: DropdownButtonFormField<int>(
                  initialValue: selectedSurah,
                  isExpanded: true,
                  decoration: examInputDecoration('السورة'),
                  items: List.generate(
                    114,
                    (i) => DropdownMenuItem(
                      value: i + 1,
                      child: Text(
                        '${i + 1}. ${surahNames[i]}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  onChanged: (v) {
                    if (v != null) onSurahChanged(v);
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: ayahController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: examInputDecoration('الآية'),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
