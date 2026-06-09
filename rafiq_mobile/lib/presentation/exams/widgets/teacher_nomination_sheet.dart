import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../application/exams/exam_providers.dart';
import '../../../application/exams/exam_controller.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_snack_bar.dart';
import '../../../data/models/exam_dtos.dart';
import '../../shared/widgets/primary_button.dart';
import '../../shared/widgets/custom_text_field.dart';

class TeacherNominationSheet extends ConsumerStatefulWidget {
  final int studentId;
  final int? circleId;

  const TeacherNominationSheet({
    super.key,
    required this.studentId,
    this.circleId,
  });

  @override
  ConsumerState<TeacherNominationSheet> createState() =>
      _TeacherNominationSheetState();
}

class _TeacherNominationSheetState
    extends ConsumerState<TeacherNominationSheet> {
  int? _selectedExamId;
  final _dateController = TextEditingController(
    text: DateTime.now().toIso8601String().split('T').first,
  );
  final _notesController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _dateController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedExamId == null) {
      AppSnackBar.warning(context, 'يرجى اختيار نوع الاختبار');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(examRepositoryProvider);
      await repository.createNominationRequest(
        CreateNominationRequestDto(
          examId: _selectedExamId!,
          studentId: widget.studentId,
          circleId: widget.circleId ?? 0, // Fallback if missing
          proposedExamDate: _dateController.text,
          teacherNotes:
              _notesController.text.isEmpty ? null : _notesController.text,
        ),
      );

      if (mounted) {
        ref.invalidate(examControllerProvider);
        final messenger = ScaffoldMessenger.of(context);
        context.pop();
        AppSnackBar.successOnState(messenger, 'تم إرسال طلب الترشيح بنجاح');
      }
    } catch (_) {
      if (mounted) {
        AppSnackBar.error(
            context, 'تعذر إرسال طلب الترشيح. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(availableExamsProvider(widget.circleId));

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
        top: AppSpacing.lg,
        left: AppSpacing.lg,
        right: AppSpacing.lg,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.borderLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'طلب ترشيح طالب لاختبار',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimaryLight,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          const Text(
            'نوع الاختبار',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          examsAsync.when(
            data: (exams) => DropdownButtonFormField<int>(
              initialValue: _selectedExamId,
              decoration: const InputDecoration(
                hintText: 'اختر نوع الاختبار...',
                contentPadding: EdgeInsets.symmetric(horizontal: 16),
              ),
              items: exams
                  .map((e) => DropdownMenuItem(
                        value: e.id,
                        child: Text(e.title),
                      ))
                  .toList(),
              onChanged: (val) => setState(() => _selectedExamId = val),
            ),
            loading: () => const LinearProgressIndicator(),
            error: (err, _) => Text('خطأ في تحميل الاختبارات: $err'),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 90)),
              );
              if (date != null) {
                _dateController.text = date.toIso8601String().split('T').first;
              }
            },
            child: AbsorbPointer(
              child: CustomTextField(
                labelText: 'التاريخ المقترح',
                controller: _dateController,
                readOnly: true,
                suffixIcon: const Icon(Icons.calendar_today_rounded),
              ),
            ),
          ),
          const SizedBox(height: 16),
          CustomTextField(
            labelText: 'ملاحظات إضافية (اختياري)',
            controller: _notesController,
            maxLines: 3,
            hintText: 'أضف أي ملاحظات لمدير المركز هنا...',
          ),
          const SizedBox(height: 32),
          PrimaryButton(
            label: 'إرسال الطلب',
            onPressed: _submit,
            isLoading: _isLoading,
          ),
        ],
      ),
    );
  }
}
