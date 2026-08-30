import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../application/context/context_controller.dart';
import '../../../application/exams/exam_controller.dart';
import '../../../application/exams/exam_student_provider.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_shadows.dart';
import '../../../data/models/exam_dtos.dart';
import 'exam_shared_widgets.dart';

class ExamNominationSheet extends ConsumerStatefulWidget {
  final List<ExamDto> exams;

  const ExamNominationSheet({
    super.key,
    required this.exams,
  });

  @override
  ConsumerState<ExamNominationSheet> createState() =>
      _ExamNominationSheetState();
}

class _ExamNominationSheetState extends ConsumerState<ExamNominationSheet> {
  final _searchController = TextEditingController();
  final _dateController = TextEditingController();
  final _notesController = TextEditingController();
  final _readinessController = TextEditingController(text: '70');

  int? _selectedExamId;
  int? _selectedStudentId;
  String _searchQuery = '';
  String? _localError;

  @override
  void initState() {
    super.initState();
    if (widget.exams.length == 1) {
      _selectedExamId = widget.exams.first.id;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _dateController.dispose();
    _notesController.dispose();
    _readinessController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initialDate = DateTime.tryParse(_dateController.text) ?? now;
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
      locale: const Locale('ar'),
    );

    if (pickedDate == null) {
      return;
    }

    _dateController.text = DateFormat('yyyy-MM-dd').format(pickedDate);
  }

  Future<void> _submit() async {
    final contextState = ref.read(contextControllerProvider);
    final circleId = contextState.selectedCircleId;

    setState(() => _localError = null);

    if (_selectedExamId == null) {
      setState(() => _localError = 'يرجى اختيار قالب الاختبار');
      return;
    }

    if (_selectedStudentId == null) {
      setState(() => _localError = 'يرجى اختيار الطالب');
      return;
    }

    if (circleId == null || circleId <= 0) {
      setState(() => _localError = 'تعذر تحديد الحلقة الحالية');
      return;
    }

    final readiness = int.tryParse(_readinessController.text.trim());
    if (readiness != null && (readiness < 0 || readiness > 100)) {
      setState(() => _localError = 'درجة الجاهزية يجب أن تكون بين 0 و100');
      return;
    }

    try {
      final nomination =
          await ref.read(examControllerProvider.notifier).createNomination(
                examId: _selectedExamId!,
                studentId: _selectedStudentId!,
                circleId: circleId,
                teacherNotes: _notesController.text.trim().isEmpty
                    ? null
                    : _notesController.text.trim(),
                readinessScore: readiness,
                proposedExamDate: _dateController.text.trim().isEmpty
                    ? null
                    : _dateController.text.trim(),
              );

      if (!mounted) {
        return;
      }

      Navigator.of(context).pop(nomination);
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _localError = ref.read(examControllerProvider).actionError ??
            readExamStudentError(error);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(contextControllerProvider);
    final examState = ref.watch(examControllerProvider);
    final studentsAsync = ref.watch(examStudentOptionsProvider);
    final primary = Theme.of(context).colorScheme.primary;

    final students = studentsAsync.maybeWhen(
      data: (items) => items,
      orElse: () => const <ExamStudentOption>[],
    );

    final filteredStudents = students
        .where((student) =>
            student.fullName.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList(growable: false);

    return ExamSheetScaffold(
      title: 'ترشيح طالب',
      subtitle: 'المعلم يرسل الطلب للمشرف للمراجعة والاعتماد',
      bottom: FilledButton.icon(
        onPressed: examState.isSubmitting ? null : _submit,
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        icon: examState.isSubmitting
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : const Icon(Icons.check_circle_outline_rounded, size: 20),
        label:
            Text(examState.isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الترشيح'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _NominationContextCard(
            centerName: contextState.selectedCenterName ?? 'غير محدد',
            circleName: contextState.selectedCircleName ?? 'غير محدد',
            templatesCount: widget.exams.length,
          ),
          const SizedBox(height: AppSpacing.md),
          if (_localError != null) ...[
            ExamInlineWarningCard(message: _localError!),
            const SizedBox(height: AppSpacing.md),
          ],
          const ExamSectionHeader(
            title: 'قالب الاختبار',
            subtitle: 'يجب أن يكون القالب منشوراً من إدارة الويب',
          ),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<int>(
            initialValue: _selectedExamId,
            isExpanded: true,
            dropdownColor: context.cardColor,
            decoration: examInputDecoration(context, 'اختر قالب الاختبار'),
            items: widget.exams
                .map(
                  (exam) => DropdownMenuItem<int>(
                    value: exam.id,
                    child: Text(
                      '${exam.title} - ${exam.type == 'FULL_QURAN' ? 'المصحف كاملاً' : (exam.examBranch ?? 'أجزاء')}',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: context.textPrimaryColor),
                    ),
                  ),
                )
                .toList(growable: false),
            onChanged: examState.isSubmitting
                ? null
                : (value) => setState(() => _selectedExamId = value),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _dateController,
                  readOnly: true,
                  style: TextStyle(color: context.textPrimaryColor),
                  decoration:
                      examInputDecoration(context, 'تاريخ مقترح للاختبار').copyWith(
                    suffixIcon: IconButton(
                      onPressed: _pickDate,
                      icon: Icon(Icons.calendar_month_rounded, color: primary),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: TextField(
                  controller: _readinessController,
                  keyboardType: TextInputType.number,
                  style: TextStyle(color: context.textPrimaryColor),
                  decoration: examInputDecoration(context, 'درجة الجاهزية (0-100)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const ExamSectionHeader(
            title: 'اختيار الطالب',
            subtitle: 'ضمن الحلقة الحالية فقط',
          ),
          const SizedBox(height: AppSpacing.sm),
          ExamSearchField(
            controller: _searchController,
            query: _searchQuery,
            hintText: 'ابحث باسم الطالب...',
            onChanged: (value) => setState(() => _searchQuery = value.trim()),
            onClear: () {
              _searchController.clear();
              setState(() => _searchQuery = '');
            },
          ),
          const SizedBox(height: AppSpacing.sm),
          Container(
            constraints: const BoxConstraints(minHeight: 180, maxHeight: 280),
            decoration: BoxDecoration(
              color: context.cardColor,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.borderColor),
              boxShadow: AppShadows.xs,
            ),
            child: studentsAsync.when(
              loading: () => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: CircularProgressIndicator(color: primary),
                ),
              ),
              error: (error, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    readExamStudentError(error),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: context.textSecondaryColor,
                    ),
                  ),
                ),
              ),
              data: (_) {
                if (filteredStudents.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text(
                        _searchQuery.isEmpty
                            ? 'لا يوجد طلاب نشطون في الحلقة الحالية'
                            : 'لا توجد نتائج مطابقة لعبارة البحث',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: context.textSecondaryColor,
                        ),
                      ),
                    ),
                  );
                }

                return RadioGroup<int>(
                  groupValue: _selectedStudentId,
                  onChanged: examState.isSubmitting
                      ? (_) {}
                      : (value) => setState(() => _selectedStudentId = value),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: filteredStudents.length,
                    separatorBuilder: (_, __) => Divider(height: 1, color: context.borderColor),
                    itemBuilder: (context, index) {
                      final student = filteredStudents[index];
                      return RadioListTile<int>(
                        dense: true,
                        value: student.id,
                        activeColor: primary,
                        title: Text(
                          student.fullName,
                          style: TextStyle(
                            color: context.textPrimaryColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        subtitle: Text(
                          '${student.levelLabel} • ${student.statusLabel}',
                          style: TextStyle(
                            color: context.textSecondaryColor,
                            fontSize: 12,
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const ExamSectionHeader(
            title: 'ملاحظات المعلم',
            subtitle: 'تظهر للمشرف أثناء مراجعة الترشيح',
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _notesController,
            minLines: 3,
            maxLines: 5,
            style: TextStyle(color: context.textPrimaryColor),
            decoration: examInputDecoration(context, 'اكتب ملاحظاتك هنا'),
          ),
        ],
      ),
    );
  }
}

class _NominationContextCard extends StatelessWidget {
  final String centerName;
  final String circleName;
  final int templatesCount;

  const _NominationContextCard({
    required this.centerName,
    required this.circleName,
    required this.templatesCount,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: context.borderColor),
        boxShadow: AppShadows.xs,
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          ExamPill(
            icon: Icons.apartment_rounded,
            text: centerName,
            color: primary,
          ),
          ExamPill(
            icon: Icons.groups_rounded,
            text: circleName,
            color: custom.info,
          ),
          ExamPill(
            icon: Icons.publish_rounded,
            text: '$templatesCount اختبار منشور',
            color: custom.accent,
          ),
        ],
      ),
    );
  }
}
