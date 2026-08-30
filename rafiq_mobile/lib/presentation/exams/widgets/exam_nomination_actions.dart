import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../application/exams/exam_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_snack_bar.dart';
import '../../../data/models/exam_dtos.dart';

class SupervisorReviewNominationSheet extends ConsumerStatefulWidget {
  final ExamNominationDto nomination;

  const SupervisorReviewNominationSheet({
    super.key,
    required this.nomination,
  });

  @override
  ConsumerState<SupervisorReviewNominationSheet> createState() =>
      _SupervisorReviewNominationSheetState();
}

class _SupervisorReviewNominationSheetState
    extends ConsumerState<SupervisorReviewNominationSheet> {
  final _notesController = TextEditingController();
  bool _isApproved = true;

  @override
  void initState() {
    super.initState();
    _notesController.text = widget.nomination.supervisorReviewNotes ?? '';
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    final controller = ref.read(examControllerProvider.notifier);

    try {
      await controller.reviewNomination(
        nominationId: widget.nomination.id,
        decision: _isApproved ? 'SUPERVISOR_APPROVED' : 'REJECTED',
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      );

      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (_) {
      if (mounted) {
        AppSnackBar.error(
            context, 'تعذر حفظ المراجعة. يرجى المحاولة مرة أخرى.');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(examControllerProvider);
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return Stack(
      children: [
        SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              top: 16,
              left: 16,
              right: 16,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'مراجعة طلب الترشيح',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: primary,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'الطالب: ${widget.nomination.student?.fullName ?? "—"}',
                  style: TextStyle(fontWeight: FontWeight.w800, color: context.textPrimaryColor),
                ),
                const SizedBox(height: 4),
                Text(
                  'الاختبار: ${widget.nomination.exam?.title ?? "—"}',
                  style: TextStyle(color: context.textSecondaryColor),
                ),
                const SizedBox(height: 24),
                Text(
                  'قرار المشرف',
                  style: TextStyle(fontWeight: FontWeight.w800, color: context.textPrimaryColor),
                ),
                const SizedBox(height: 8),
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(
                      value: true,
                      label: Text('موافقة'),
                      icon: Icon(Icons.check_circle_outline),
                    ),
                    ButtonSegment(
                      value: false,
                      label: Text('رفض'),
                      icon: Icon(Icons.cancel_outlined),
                    ),
                  ],
                  selected: {_isApproved},
                  onSelectionChanged: (Set<bool> newSelection) {
                    setState(() {
                      _isApproved = newSelection.first;
                    });
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _notesController,
                  style: TextStyle(color: context.textPrimaryColor),
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات المراجعة (اختياري)',
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true,
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('إلغاء'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: FilledButton(
                        onPressed: state.isSubmitting ? null : _submitReview,
                        style: FilledButton.styleFrom(
                          backgroundColor: _isApproved
                              ? custom.success
                              : Theme.of(context).colorScheme.error,
                        ),
                        child: Text(_isApproved ? 'اعتماد الطلب' : 'رفض الطلب'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        if (state.isSubmitting)
          Positioned.fill(
            child: Container(
              color: Colors.black.withValues(alpha: 0.3),
              child: Center(
                child: CircularProgressIndicator(color: primary),
              ),
            ),
          ),
      ],
    );
  }
}

class CenterApproveNominationSheet extends ConsumerWidget {
  final Object nomination;

  const CenterApproveNominationSheet({
    super.key,
    required this.nomination,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final primary = Theme.of(context).colorScheme.primary;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(Icons.info_outline, size: 48, color: primary),
            const SizedBox(height: 16),
            Text(
              'اعتماد المركز متاح فقط عبر منصة الويب.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textPrimaryColor),
            ),
            const SizedBox(height: 8),
            Text(
              'يرجى تسجيل الدخول إلى لوحة تحكم المركز من المتصفح لإتمام عملية الاعتماد.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textSecondaryColor),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              style: FilledButton.styleFrom(backgroundColor: primary),
              child: const Text('حسناً'),
            ),
          ],
        ),
      ),
    );
  }
}
