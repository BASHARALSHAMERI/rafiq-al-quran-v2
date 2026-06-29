import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../application/auth/auth_controller.dart';
import '../../../application/exams/exam_controller.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/enums/user_role.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_shadows.dart';
import '../../../data/models/exam_dtos.dart';
import '../../shared/providers/current_user_role_provider.dart';
import 'exam_certification_sheet.dart';
import 'exam_shared_widgets.dart';
import 'manual_question_sheet.dart';
import 'question_evaluation_sheet.dart';

// ponytail: shared surahNames and strength/weakness options in exam_shared_widgets.dart

class ExamAttemptWorkspaceSheet extends ConsumerStatefulWidget {
  final ExamAttemptDto attempt;

  const ExamAttemptWorkspaceSheet({
    super.key,
    required this.attempt,
  });

  @override
  ConsumerState<ExamAttemptWorkspaceSheet> createState() =>
      _ExamAttemptWorkspaceSheetState();
}

class _ExamAttemptWorkspaceSheetState
    extends ConsumerState<ExamAttemptWorkspaceSheet> {
  late ExamAttemptDto _attempt;
  late final TextEditingController _theoreticalController;
  late final TextEditingController _performanceController;

  String _strengthNotes = '';
  String _weaknessNotes = '';
  String _committeeNotes = '';

  final List<ExamAttemptQuestionDto> _questions = [];
  String? _localError;
  String? _successMessage;
  
  int _questionCount = 3;
  int? _selectedQuestionId;

  ExamRangeDto? _resolveAttemptRange() {
    if (_attempt.exam?.examBranch == 'FULL_QURAN') {
      return const ExamRangeDto(
          fromSurah: 1, fromAyah: 1, toSurah: 114, toAyah: 6);
    }
    if (_attempt.examRange != null) return _attempt.examRange;
    if (_attempt.exam?.juzRange != null) return _attempt.exam?.juzRange;
    return null;
  }

  @override
  void initState() {
    super.initState();
    _attempt = widget.attempt;
    final breakdown = widget.attempt.breakdown;

    _theoreticalController = TextEditingController(
      text: initialNumericValue(breakdown?.theoreticalTajweedScore, 0),
    );
    _performanceController = TextEditingController(
      text: initialNumericValue(breakdown?.performanceScore, 0),
    );

    _strengthNotes = breakdown?.strengthNotes ?? '';
    _weaknessNotes = breakdown?.weaknessNotes ?? '';
    _committeeNotes = widget.attempt.committeeNotes ?? '';

    if (widget.attempt.questions != null) {
      _questions.addAll(widget.attempt.questions!);
    }
  }

  @override
  void dispose() {
    _theoreticalController.dispose();
    _performanceController.dispose();
    super.dispose();
  }

  UserRole? get _currentRole => ref.read(currentUserRoleProvider);
  int? get _currentUserId =>
      int.tryParse(ref.read(authControllerProvider).user?.id ?? '');

  ExamAttemptCommitteeMemberDto? get _myCommitteeMembership {
    final userId = _currentUserId;
    if (userId == null) return null;
    for (final member in _attempt.committeeMembers ??
        const <ExamAttemptCommitteeMemberDto>[]) {
      if (member.userId == userId) return member;
    }
    return null;
  }

  bool get _isCommitteeMember => _myCommitteeMembership != null;

  bool get _isCommitteeChair {
    final role = (_myCommitteeMembership?.committeeRole ?? '').toUpperCase();
    return role == 'CHAIR';
  }

  bool get _isReadOnly =>
      _currentRole == UserRole.student || _currentRole == UserRole.parent;

  bool get _isCenterAdmin => _currentRole == UserRole.centerAdmin;

  bool get _canEvaluate =>
      !_isReadOnly &&
      _isCommitteeMember &&
      (_currentRole == UserRole.teacher ||
          _currentRole == UserRole.supervisor ||
          _currentRole == UserRole.centerAdmin) &&
      (_attempt.status == 'SCHEDULED' || _attempt.status == 'IN_PROGRESS');

  bool get _canGenerateQuestions =>
      _canEvaluate && _isCommitteeChair && _questions.isEmpty;

  bool get _canModifyQuestions => _canEvaluate && _isCommitteeChair;

  bool get _canFinalize =>
      _canEvaluate &&
      _isCommitteeChair &&
      _questions.isNotEmpty &&
      _questions.every((q) => q.isEvaluated);

  bool get _canPublish =>
      (_isCenterAdmin || _currentRole == UserRole.superAdmin) &&
      _attempt.status == 'APPROVED';

  bool get _canReopen =>
      (_isCenterAdmin || _currentRole == UserRole.superAdmin) &&
      (_attempt.status == 'APPROVED' || _attempt.status == 'PUBLISHED');

  bool get _canShowCertificate {
    if (_attempt.status != 'PUBLISHED') return false;
    final score = _attempt.totalScore;
    final passScore = _attempt.exam?.passScore;
    if (score == null || passScore == null) return false;
    return score >= passScore;
  }

  void _clearMessages() {
    setState(() {
      _localError = null;
      _successMessage = null;
    });
  }

  double _readDouble(TextEditingController controller) {
    return double.tryParse(controller.text) ?? 0.0;
  }

  void _handleError(dynamic e) {
    if (!mounted) return;
    setState(() {
      _localError =
          ref.read(examControllerProvider).actionError ?? e.toString();
    });
  }

  double _calculateTotalScore() {
    final maxScore = (_attempt.exam?.maxScore ?? 100);
    final scoreDeductions = _readDouble(_theoreticalController) +
        _readDouble(_performanceController);
    final questionDeductions = _questions.fold<double>(
      0,
      (sum, item) =>
          sum +
          item.promptingDeductions +
          item.remindingDeductions +
          item.tajweedDeductions,
    );

    final total = maxScore - scoreDeductions - questionDeductions;
    if (total < 0) return 0;
    if (total > maxScore) return maxScore;
    return total;
  }


  Future<void> _generateQuestions() async {
    _clearMessages();
    try {
      final updatedAttempt = await ref
          .read(examControllerProvider.notifier)
          .generateAttemptQuestions(_attempt.id, count: _questionCount);
      if (!mounted) return;
      setState(() {
        _attempt = updatedAttempt;
        _questions.clear();
        _questions.addAll(updatedAttempt.questions ?? []);
        _successMessage = 'تم توليد الأسئلة بنجاح';
      });
    } catch (e) {
      _handleError(e);
    }
  }

  Future<void> _addQuestionManually() async {
    _clearMessages();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer(
        builder: (context, ref, child) {
          final isSubmitting = ref.watch(examControllerProvider).isSubmitting;
          return Padding(
            padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom),
            child: ManualQuestionSheet(
              isSubmitting: isSubmitting,
              onSubmit: ({
                required int fromSurah,
                required int fromAyah,
                required int toSurah,
                required int toAyah,
              }) async {
                final updatedAttempt = await ref
                    .read(examControllerProvider.notifier)
                    .createAttemptQuestion(
                      _attempt.id,
                      fromSurah: fromSurah,
                      fromAyah: fromAyah,
                      toSurah: toSurah,
                      toAyah: toAyah,
                    );
                if (mounted) {
                  setState(() {
                    _attempt = updatedAttempt;
                    _questions.clear();
                    _questions.addAll(updatedAttempt.questions ?? []);
                    _successMessage = 'تم إضافة السؤال بنجاح';
                  });
                }
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _deleteQuestion(int questionId) async {
    _clearMessages();
    try {
      final updatedAttempt = await ref
          .read(examControllerProvider.notifier)
          .deleteAttemptQuestion(_attempt.id, questionId);
      if (!mounted) return;
      setState(() {
        _attempt = updatedAttempt;
        _questions.clear();
        _questions.addAll(updatedAttempt.questions ?? []);
        _successMessage = 'تم حذف السؤال بنجاح';
        if (_selectedQuestionId == questionId) {
          _selectedQuestionId = null;
        }
      });
    } catch (e) {
      _handleError(e);
    }
  }

  void _openQuestionEvaluation(ExamAttemptQuestionDto q) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => QuestionEvaluationSheet(
        question: q,
        canEdit: _canEvaluate,
        criteria: resolveExamCriteria(_attempt.exam),
        onConfirm: ({
          required int id,
          required double promptingDeductions,
          required double remindingDeductions,
          required double tajweedDeductions,
          required bool isEvaluated,
        }) {
          setState(() {
            final idx = _questions.indexWhere((item) => item.id == id);
            if (idx != -1) {
              _questions[idx] = q.copyWith(
                promptingDeductions: promptingDeductions,
                remindingDeductions: remindingDeductions,
                tajweedDeductions: tajweedDeductions,
                isEvaluated: isEvaluated,
              );
            }
          });
        },
      ),
    );
  }

  void _openReviewAndSave() {
    _clearMessages();

    // Validations
    final criteria = resolveExamCriteria(_attempt.exam);

    if (_attempt.exam == null) {
      setState(() => _localError = 'بيانات الاختبار غير مكتملة');
      return;
    }
    if (_questions.isEmpty) {
      setState(() => _localError = 'لا توجد أسئلة لتقييمها');
      return;
    }
    if (_questions.any((q) => !q.isEvaluated)) {
      setState(() => _localError = 'يجب تقييم جميع الأسئلة أولاً');
      return;
    }

    final theoreticalScore = _readDouble(_theoreticalController);
    final performanceScore = _readDouble(_performanceController);

    String? valError;
    if (theoreticalScore < 0 ||
        (criteria != null && theoreticalScore > criteria.theoreticalTajweedScore)) {
      valError = 'درجة التجويد النظري غير صحيحة';
    } else if (performanceScore < 0 ||
        (criteria != null && performanceScore > criteria.performanceScore)) {
      valError = 'درجة الأداء غير صحيحة';
    }

    if (valError != null) {
      setState(() => _localError = valError);
      return;
    }

    final draftQuestions = _questions
        .map((q) => QuestionDraftResult(
              id: q.id,
              orderIndex: q.orderIndex,
              fromSurah: q.fromSurah,
              fromAyah: q.fromAyah,
              toSurah: q.toSurah,
              toAyah: q.toAyah,
              prompting: q.promptingDeductions,
              reminding: q.remindingDeductions,
              tajweed: q.tajweedDeductions,
              isEvaluated: q.isEvaluated,
            ))
        .toList();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer(
        builder: (context, ref, child) {
          final isSubmitting = ref.watch(examControllerProvider).isSubmitting;
          return Padding(
            padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom),
            child: ExamCertificationSheet(
              attempt: _attempt,
              theoreticalTajweedScore: theoreticalScore,
              performanceScore: performanceScore,
              questions: draftQuestions,
              strengthNotes: _strengthNotes,
              weaknessNotes: _weaknessNotes,
              committeeNotes: _committeeNotes,
              isSubmitting: isSubmitting,
              onStrengthNotesChanged: (v) => _strengthNotes = v,
              onWeaknessNotesChanged: (v) => _weaknessNotes = v,
              onCommitteeNotesChanged: (v) => _committeeNotes = v,
              onBack: () => Navigator.of(context).pop(),
              onSave: () async {
                final navigator = Navigator.of(context);
                try {
                  final req = EvaluateAttemptRequestDto(
                    memorizationScore: 0,
                    tajweedScore: 0,
                    theoreticalTajweedScore: theoreticalScore.round(),
                    performanceScore: performanceScore.round(),
                    committeeNotes: trimOrNull(_committeeNotes),
                    strengthNotes: normalizeListText(_strengthNotes),
                    weaknessNotes: normalizeListText(_weaknessNotes),
                    questions: _questions
                        .map((q) => ScoreAttemptQuestionRequestDto(
                              id: q.id,
                              promptingDeductions: q.promptingDeductions,
                              remindingDeductions: q.remindingDeductions,
                              tajweedDeductions: q.tajweedDeductions,
                              isEvaluated: q.isEvaluated,
                            ))
                        .toList(),
                  );

                  final updated = await ref
                      .read(examControllerProvider.notifier)
                      .evaluateAttempt(_attempt.id, req);

                  if (mounted) {
                    setState(() {
                      _attempt = updated;
                      _successMessage = 'تم حفظ التقييم بنجاح';
                    });
                    navigator.pop();
                  }
                } catch (e) {
                  if (mounted) {
                    navigator.pop();
                    _handleError(e);
                  }
                }
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _finalizeEvaluation() async {
    _clearMessages();
    try {
      final updatedAttempt = await ref
          .read(examControllerProvider.notifier)
          .finalizeAttemptEvaluation(_attempt.id);
      if (!mounted) return;
      setState(() {
        _attempt = updatedAttempt;
        _successMessage = 'تم إغلاق التقييم واعتماد المحاولة تلقائياً';
      });
    } catch (e) {
      _handleError(e);
    }
  }

  Future<void> _reopenAttempt() async {
    _clearMessages();
    final reasonController = TextEditingController();

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إعادة فتح المحاولة'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
                'هل أنت متأكد من رغبتك بإعادة فتح المحاولة؟ سيتمكن رئيس اللجنة من تعديل التقييم مجدداً.'),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              decoration: examInputDecoration('سبب إعادة الفتح (اختياري)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.errorLight),
            child: const Text('إعادة الفتح'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final updatedAttempt = await ref
          .read(examControllerProvider.notifier)
          .reopenAttempt(_attempt.id, reason: reasonController.text);
      if (!mounted) return;
      setState(() {
        _attempt = updatedAttempt;
        _successMessage = 'تم إعادة فتح المحاولة بنجاح';
      });
    } catch (e) {
      _handleError(e);
    }
  }

  Future<void> _publishResult() async {
    _clearMessages();
    try {
      final updatedAttempt = await ref
          .read(examControllerProvider.notifier)
          .publishAttemptResult(_attempt.id);
      if (!mounted) return;
      setState(() {
        _attempt = updatedAttempt;
        _successMessage = 'تم نشر النتيجة واعتماد الشهادة بنجاح';
      });
    } catch (e) {
      _handleError(e);
    }
  }

  void _showCertificate() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('شهادة الاختبار', textAlign: TextAlign.center),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('الطالب: ${_attempt.student?.fullName ?? '-'}',
                style: const TextStyle(fontWeight: FontWeight.bold)),
            const Divider(),
            Text('الاختبار: ${_attempt.exam?.title ?? '-'}'),
            const SizedBox(height: 6),
            Text('المركز: ${_attempt.circle?.center?.name ?? '-'}'),
            const SizedBox(height: 6),
            Text(
                'النتيجة: ${_attempt.totalScore?.round() ?? '-'} / ${_attempt.exam?.maxScore.round() ?? '-'}'),
            const SizedBox(height: 6),
            Text('التقدير: ${_attempt.gradeLabel ?? '-'}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final examState = ref.watch(examControllerProvider);
    final exam = _attempt.exam;
    final criteria = resolveExamCriteria(exam);
    final maxScore = (exam?.maxScore ?? 100).round();
    final passScore = (exam?.passScore ?? 0).round();
    final liveScore = _calculateTotalScore();
    final isPass = liveScore >= passScore;

    return ExamSheetScaffold(
      title: _canEvaluate ? 'إجراء التقييم' : 'نتيجة الاختبار',
      subtitle: '',
      bottom: Row(
        children: [
          if (_canShowCertificate) ...[
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _showCertificate,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                  side: const BorderSide(color: AppColors.primaryLight),
                ),
                icon: const Icon(Icons.workspace_premium_rounded, size: 18),
                label: const Text('الشهادة'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
          ],
          Expanded(
            child: FilledButton.icon(
              onPressed: examState.isSubmitting
                  ? null
                  : !_canEvaluate
                      ? () => Navigator.of(context).pop(_attempt)
                      : _openReviewAndSave,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primaryLight,
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
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Icon(
                      !_canEvaluate
                          ? Icons.check_circle_outline_rounded
                          : Icons.rate_review_rounded,
                      size: 20,
                    ),
              label: Text(!_canEvaluate ? 'إغلاق' : 'مراجعة وحفظ'),
            ),
          ),
          if (_canFinalize) ...[
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: FilledButton.icon(
                onPressed: examState.isSubmitting ? null : _finalizeEvaluation,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.secondaryLight,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                icon: const Icon(Icons.task_alt_rounded, size: 20),
                label: const Text('إغلاق التقييم'),
              ),
            ),
          ],
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PremiumHeader(
            attempt: _attempt,
            liveScore: liveScore.toInt(),
            isPass: isPass,
            examRange: _resolveAttemptRange(),
          ),
          const SizedBox(height: AppSpacing.md),

          _ExamToolbar(
            canGenerate: _canGenerateQuestions,
            canAdd: _canModifyQuestions,
            canEvaluate: _canEvaluate && _selectedQuestionId != null,
            canDelete: _canModifyQuestions && _selectedQuestionId != null,
            canReopen: _canReopen,
            canPublish: _canPublish,
            isSubmitting: examState.isSubmitting,
            questionCount: _questionCount,
            onCountChanged: (v) => setState(() => _questionCount = v),
            onGenerate: _generateQuestions,
            onAdd: _addQuestionManually,
            onEvaluate: () {
              final q = _questions.firstWhere((e) => e.id == _selectedQuestionId);
              _openQuestionEvaluation(q);
            },
            onDelete: () => _deleteQuestion(_selectedQuestionId!),
            onReopen: _reopenAttempt,
            onPublish: _publishResult,
          ),
          const SizedBox(height: AppSpacing.md),

          if (_localError != null) ...[
            ExamInlineWarningCard(message: _localError!),
            const SizedBox(height: AppSpacing.md),
          ],
          if (_successMessage != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.successLight.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: AppColors.successLight.withValues(alpha: 0.18),
                ),
              ),
              child: Text(
                _successMessage!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textPrimaryLight,
                    ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],

          if (!_isReadOnly && !_isCommitteeMember) ...[
            const ExamInlineWarningCard(
              message:
                  'لست عضواً في لجنة هذه المحاولة. العرض متاح فقط بصيغة قراءة.',
            ),
            const SizedBox(height: AppSpacing.md),
          ],

          const ExamSectionHeader(
            title: 'الأسئلة والتقييم',
            subtitle: 'قم بتحديد سؤال لتقييمه أو حذفه من شريط الإجراءات',
          ),
          const SizedBox(height: AppSpacing.sm),

          if (_questions.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderLight),
                boxShadow: AppShadows.xs,
              ),
              child: Text(
                'لا توجد أسئلة محفوظة لهذه المحاولة.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondaryLight,
                    ),
                textAlign: TextAlign.center,
              ),
            )
          else
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderLight),
                boxShadow: AppShadows.xs,
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _questions.length,
                  separatorBuilder: (_, __) => Divider(
                      height: 1, color: AppColors.borderLight.withValues(alpha: 0.5)),
                  itemBuilder: (context, index) {
                    final q = _questions[index];
                    final deductions = q.promptingDeductions +
                        q.remindingDeductions +
                        q.tajweedDeductions;
                    return InkWell(
                      onTap: () => setState(() => _selectedQuestionId = q.id),
                      onDoubleTap: () {
                        setState(() => _selectedQuestionId = q.id);
                        _openQuestionEvaluation(q);
                      },
                      child: Container(
                        color: _selectedQuestionId == q.id
                            ? AppColors.primaryLight.withValues(alpha: 0.05)
                            : Colors.transparent,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 14),
                        child: Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: q.isEvaluated
                                    ? AppColors.successLight.withValues(alpha: 0.1)
                                    : AppColors.primaryLight.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '${q.orderIndex}',
                                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                      color: q.isEvaluated
                                          ? AppColors.successLight
                                          : AppColors.primaryLight,
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${surahName(q.fromSurah).replaceFirst('سورة ', '')} ${q.fromAyah} - ${surahName(q.toSurah).replaceFirst('سورة ', '')} ${q.toAyah}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  if (q.isEvaluated)
                                    Text(
                                      deductions > 0
                                          ? 'الخصم: -${deductions % 1 == 0 ? deductions.toInt() : deductions}'
                                          : 'بدون أخطاء ✓',
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelSmall
                                          ?.copyWith(
                                            color: deductions > 0
                                                ? AppColors.errorLight
                                                : AppColors.successLight,
                                          ),
                                    )
                                  else
                                    Text(
                                      'لم يتم التقييم',
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelSmall
                                          ?.copyWith(
                                              color: AppColors.textSecondaryLight),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          const SizedBox(height: AppSpacing.md),

          const ExamSectionHeader(
            title: 'الدرجات الأساسية',
            subtitle: 'وفق معايير القالب المعتمد',
          ),
          const SizedBox(height: AppSpacing.sm),
          _ScoreStepper(
            controller: _theoreticalController,
            enabled: _canEvaluate,
            label: 'درجة التجويد النظري',
            maxValue: criteria?.theoreticalTajweedScore,
            helper: criteria == null
                ? null
                : 'الحد الأعلى ${criteria.theoreticalTajweedScore.round()}',
            onChanged: () => setState(() {}),
          ),
          const SizedBox(height: AppSpacing.sm),
          _ScoreStepper(
            controller: _performanceController,
            enabled: _canEvaluate,
            label: 'الأداء العام',
            maxValue: criteria?.performanceScore,
            helper: criteria == null
                ? null
                : 'الحد الأعلى ${criteria.performanceScore.round()}',
            onChanged: () => setState(() {}),
          ),
          const SizedBox(height: AppSpacing.md),

          if (_canEvaluate) ...[
            _SearchableMultiSelect(
              label: 'جوانب التميز',
              options: examStrengthSuggestions,
              selected: splitListText(_strengthNotes),
              color: AppColors.successLight,
              onChanged: (list) {
                setState(() {
                  _strengthNotes = list.join('، ');
                });
              },
            ),
            const SizedBox(height: AppSpacing.sm),
            _SearchableMultiSelect(
              label: 'جوانب القصور',
              options: examWeaknessSuggestions,
              selected: splitListText(_weaknessNotes),
              color: AppColors.warningLight,
              onChanged: (list) {
                setState(() {
                  _weaknessNotes = list.join('، ');
                });
              },
            ),
            const SizedBox(height: AppSpacing.md),
          ],

          _ResultCard(
            maxScore: maxScore,
            passScore: passScore,
            liveScore: liveScore.toInt(),
            gradeLabel: _attempt.gradeLabel,
            isPass: isPass,
          ),
        ],
      ),
    );
  }
}

class _PremiumHeader extends StatelessWidget {
  final ExamAttemptDto attempt;
  final int liveScore;
  final bool isPass;
  final ExamRangeDto? examRange;

  const _PremiumHeader({
    required this.attempt,
    required this.liveScore,
    required this.isPass,
    this.examRange,
  });

  @override
  Widget build(BuildContext context) {
    final exam = attempt.exam;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPass
              ? [AppColors.primaryLight, AppColors.primaryLight.withValues(alpha: 0.8)]
              : [AppColors.secondaryLight, AppColors.secondaryLight.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: (isPass ? AppColors.primaryLight : AppColors.secondaryLight)
                .withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      attempt.student?.fullName ?? 'اسم الطالب',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                    ),
                    Text(
                      '${attempt.circle?.name ?? 'الحلقة'} • ${exam?.title ?? 'بدون عنوان'}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.8),
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  ],
                ),
              ),
              ExamStatusBadge(status: attempt.status, light: true),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Colors.white24, height: 1),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 10,
            children: [
              _HeaderInfoItem(
                icon: Icons.calendar_today_rounded,
                label: 'التاريخ',
                value: attempt.examDate ?? '-',
              ),
              _HeaderInfoItem(
                icon: Icons.star_rounded,
                label: 'الدرجة',
                value: '$liveScore / ${exam?.maxScore.round() ?? 100}',
              ),
              if (examRange != null)
                _HeaderInfoItem(
                  icon: Icons.menu_book_rounded,
                  label: 'النطاق',
                  value: '${surahName(examRange!.fromSurah).replaceFirst('سورة ', '')} ${examRange!.fromAyah} - ${surahName(examRange!.toSurah).replaceFirst('سورة ', '')} ${examRange!.toAyah}',
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderInfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _HeaderInfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 14, color: Colors.white),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white70,
                    fontSize: 10,
                  ),
            ),
            Text(
              value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ExamToolbar extends StatelessWidget {
  final bool canGenerate;
  final bool canAdd;
  final bool canEvaluate;
  final bool canDelete;
  final bool canReopen;
  final bool canPublish;
  final bool isSubmitting;
  final int questionCount;
  final ValueChanged<int> onCountChanged;
  final VoidCallback onGenerate;
  final VoidCallback onAdd;
  final VoidCallback onEvaluate;
  final VoidCallback onDelete;
  final VoidCallback onReopen;
  final VoidCallback onPublish;

  const _ExamToolbar({
    required this.canGenerate,
    required this.canAdd,
    required this.canEvaluate,
    required this.canDelete,
    required this.canReopen,
    required this.canPublish,
    required this.isSubmitting,
    required this.questionCount,
    required this.onCountChanged,
    required this.onGenerate,
    required this.onAdd,
    required this.onEvaluate,
    required this.onDelete,
    required this.onReopen,
    required this.onPublish,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          // 1. Lifecycle Actions (Publish/Reopen) - Primary positions if available
          if (canPublish) ...[
            _ToolbarButton(
              icon: Icons.public_rounded,
              label: 'نشر',
              color: AppColors.successLight,
              onPressed: isSubmitting ? null : onPublish,
            ),
            const SizedBox(width: 8),
          ],
          if (canReopen) ...[
            _ToolbarButton(
              icon: Icons.lock_open_rounded,
              label: 'فتح',
              color: AppColors.warningLight,
              onPressed: isSubmitting ? null : onReopen,
            ),
            const SizedBox(width: 8),
          ],

          if (canPublish || canReopen)
            Container(width: 1, height: 24, color: AppColors.borderLight, margin: const EdgeInsets.only(right: 8)),

          // 2. Core Actions: Evaluate, Delete, Add
          _ToolbarButton(
            icon: Icons.edit_note_rounded,
            label: 'تقييم',
            color: AppColors.primaryLight,
            onPressed: (canEvaluate && !isSubmitting) ? onEvaluate : null,
          ),
          const SizedBox(width: 8),
          _ToolbarButton(
            icon: Icons.delete_outline_rounded,
            label: 'حذف',
            color: AppColors.errorLight,
            onPressed: (canDelete && !isSubmitting) ? onDelete : null,
          ),
          const SizedBox(width: 8),
          _ToolbarButton(
            icon: Icons.add_circle_outline_rounded,
            label: 'إضافة',
            color: AppColors.textSecondaryLight,
            onPressed: (canAdd && !isSubmitting) ? onAdd : null,
          ),
          const SizedBox(width: 8),

          // 3. Question Count Stepper + Generate
          Container(width: 1, height: 24, color: AppColors.borderLight, margin: const EdgeInsets.only(right: 8)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove, size: 14),
                  onPressed: (canGenerate && questionCount > 1) ? () => onCountChanged(questionCount - 1) : null,
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(4),
                ),
                Text('$questionCount', style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: canGenerate ? AppColors.textPrimaryLight : AppColors.textSecondaryLight.withValues(alpha: 0.5),
                )),
                IconButton(
                  icon: const Icon(Icons.add, size: 14),
                  onPressed: (canGenerate && questionCount < 10) ? () => onCountChanged(questionCount + 1) : null,
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(4),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _ToolbarButton(
            icon: Icons.auto_awesome_rounded,
            label: 'توليد',
            color: AppColors.primaryLight,
            onPressed: (canGenerate && !isSubmitting) ? onGenerate : null,
          ),
        ],
      ),
    );
  }
}

class _ToolbarButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onPressed;

  const _ToolbarButton({
    required this.icon,
    required this.label,
    required this.color,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final bool isEnabled = onPressed != null;
    return Material(
      color: isEnabled ? color.withValues(alpha: 0.1) : AppColors.background,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isEnabled ? color.withValues(alpha: 0.2) : AppColors.borderLight.withValues(alpha: 0.5),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: isEnabled ? color : AppColors.textSecondaryLight.withValues(alpha: 0.5)),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: isEnabled ? color : AppColors.textSecondaryLight.withValues(alpha: 0.5),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  final int maxScore;
  final int passScore;
  final int liveScore;
  final String? gradeLabel;
  final bool isPass;

  const _ResultCard({
    required this.maxScore,
    required this.passScore,
    required this.liveScore,
    required this.gradeLabel,
    required this.isPass,
  });

  @override
  Widget build(BuildContext context) {
    final progress =
        maxScore <= 0 ? 0.0 : (liveScore / maxScore).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.xs,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'الخلاصة النهائية',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isPass
                      ? AppColors.successLight.withValues(alpha: 0.08)
                      : AppColors.warningLight.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  isPass ? 'ناجح' : 'يحتاج تحسين',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: isPass
                            ? AppColors.successLight
                            : AppColors.warningLight,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          LinearProgressIndicator(
            value: progress,
            minHeight: 10,
            borderRadius: BorderRadius.circular(999),
            backgroundColor: AppColors.borderLight,
            valueColor: AlwaysStoppedAnimation<Color>(
              isPass ? AppColors.successLight : AppColors.warningLight,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'الدرجة الحالية $liveScore من $maxScore • حد النجاح $passScore',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
          ),
          if (gradeLabel != null && gradeLabel!.trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'التقدير: $gradeLabel',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ScoreStepper extends StatelessWidget {
  final TextEditingController controller;
  final bool enabled;
  final String label;
  final String? helper;
  final double? maxValue;
  final VoidCallback? onChanged;

  const _ScoreStepper({
    required this.controller,
    required this.enabled,
    required this.label,
    this.helper,
    this.maxValue,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimaryLight,
                    ),
              ),
            ),
            if (helper != null)
              Text(
                helper!,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondaryLight,
                    ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: enabled ? Colors.white : AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: enabled ? AppColors.borderLight : Colors.transparent,
            ),
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.remove_rounded, size: 20),
                onPressed: enabled
                    ? () {
                        final val = double.tryParse(controller.text) ?? 0.0;
                        if (val >= 0.5) {
                          controller.text = (val - 0.5).toString();
                          onChanged?.call();
                        }
                      }
                    : null,
                color: AppColors.textSecondaryLight,
              ),
              Expanded(
                child: TextField(
                  controller: controller,
                  enabled: enabled,
                  textAlign: TextAlign.center,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                  onChanged: (v) {
                    final val = double.tryParse(v);
                    if (val != null && maxValue != null && val > maxValue!) {
                      controller.text = maxValue!.toString();
                    }
                    onChanged?.call();
                  },
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_rounded, size: 20),
                onPressed: enabled
                    ? () {
                        final val = double.tryParse(controller.text) ?? 0.0;
                        if (maxValue == null || val + 0.5 <= maxValue!) {
                          controller.text = (val + 0.5).toString();
                          onChanged?.call();
                        }
                      }
                    : null,
                color: AppColors.textSecondaryLight,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

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
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.textSecondaryLight,
                fontWeight: FontWeight.w700,
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
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              children: [
                Expanded(
                  child: selected.isEmpty
                      ? Text(
                          'اختر من القائمة...',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondaryLight,
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
                                      color: color.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                          color: color.withValues(alpha: 0.2)),
                                    ),
                                    child: Text(
                                      s,
                                      style: TextStyle(
                                        color: color,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                ),
                const Icon(Icons.search_rounded,
                    size: 18, color: AppColors.textSecondaryLight),
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
  State<_MultiSelectSearchSheet> createState() => _MultiSelectSearchSheetState();
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
    final filtered = widget.options
        .where((opt) => opt.contains(_query))
        .toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.borderLight,
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
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
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
              decoration: InputDecoration(
                hintText: 'بحث...',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
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
                      fontWeight: isSel ? FontWeight.w800 : FontWeight.w500,
                      color: isSel ? widget.color : AppColors.textPrimaryLight,
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
