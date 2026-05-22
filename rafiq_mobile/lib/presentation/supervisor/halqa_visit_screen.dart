import 'package:flutter/material.dart';

import 'supervisor_visit_lifecycle_screen.dart';

/// Backward-compatible entry point for older imports.
///
/// The visit lifecycle is handled by [SupervisorVisitLifecycleScreen], which
/// starts and ends visits through the supervisor-visits API.
class HalqaVisitScreen extends StatelessWidget {
  final int circleId;

  const HalqaVisitScreen({super.key, required this.circleId});

  @override
  Widget build(BuildContext context) {
    return SupervisorVisitLifecycleScreen(circleId: circleId);
  }
}

/*
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/context/context_controller.dart';
import '../../application/org/org_providers.dart';
import '../../application/supervisor/supervisor_notes_controller.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/org_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/widgets/custom_text_field.dart';
import '../shared/widgets/enterprise_card.dart';
import '../shared/widgets/primary_button.dart';
import '../shared/widgets/section_header.dart';
import '../shared/widgets/skeleton_loader.dart';
import '../shared/widgets/standard_app_bar.dart';

const _attendanceTaskKey = 'attendance_task_completed';

const _defaultChecklist = [
  {
    'key': 'teacher_on_time',
    'label': 'المعلم حاضر في الموعد',
  },
  {
    'key': 'circle_prepared',
    'label': 'الحلقة منظمة ومرتبة',
  },
  {
    'key': _attendanceTaskKey,
    'label': 'تسجيل الحضور مكتمل',
  },
  {
    'key': 'individual_recitation',
    'label': 'التسميع يتم بشكل فردي',
  },
  {
    'key': 'tajweed_follow_up',
    'label': 'المعلم يتابع أخطاء التجويد',
  },
  {
    'key': 'students_engaged',
    'label': 'الطلاب ملتزمون ومنتبهون',
  },
];

class _CommentedLegacyHalqaVisitScreen extends ConsumerStatefulWidget {
  final int circleId;

  const _CommentedLegacyHalqaVisitScreen({super.key, required this.circleId});

  @override
  ConsumerState<_CommentedLegacyHalqaVisitScreen> createState() => _HalqaVisitScreenState();
}

class _HalqaVisitScreenState extends ConsumerState<_CommentedLegacyHalqaVisitScreen> {
  late final List<Map<String, dynamic>> _checklist = _defaultChecklist
      .map(
        (item) => {
          'key': item['key'],
          'label': item['label'],
          'checked': false,
        },
      )
      .toList(growable: true);

  final _notesController = TextEditingController();
  int _rating = 0;
  bool _isSaved = false;
  bool _isSaving = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _toggleItem(int index) {
    setState(() {
      _checklist[index]['checked'] = !(_checklist[index]['checked'] as bool);
    });
  }

  Future<void> _handleSubmit(OrgCircleDto circle) async {
    final attendanceTaskCompleted = _checklist.any(
      (item) =>
          item['key'] == _attendanceTaskKey && item['checked'] == true,
    );
    if (!attendanceTaskCompleted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'اعتمد مهمة الحضور من قائمة التحقق قبل حفظ الزيارة.',
          ),
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final targetLabel =
          '${circle.name}${circle.teacherName != null ? ' - ${circle.teacherName}' : ''}';
      final completedCount =
          _checklist.where((item) => item['checked'] == true).length;
      final notes = _notesController.text.trim();
      final content = [
        'زيارة إشرافية بنمط حضور مهامي.',
        'تم التحقق من تنفيذ حضور الحلقة عبر قائمة المهام، دون تسجيل يدوي من المشرف.',
        if (notes.isNotEmpty) notes,
      ].join('\n');

      await ref.read(legacyNotesProviderDisabled.notifier).create(
            circleId: circle.id,
            category: 'VISIT',
            targetLabel: targetLabel,
            content: content,
            scores: {
              'attendanceMode': 'TASK_BASED',
              'attendanceTaskVerified': true,
              'manualAttendanceControl': false,
              'completedChecklistItems': completedCount,
              'totalChecklistItems': _checklist.length,
            },
            visitChecklist: _checklist
                .map(
                  (item) => {
                    'key': item['key'] as String,
                    'label': item['label'] as String,
                    'checked': item['checked'] as bool,
                  },
                )
                .toList(growable: false),
            rating: _rating > 0 ? _rating : null,
          );

      if (!mounted) {
        return;
      }

      setState(() {
        _isSaved = true;
        _isSaving = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حفظ تقرير الزيارة بنجاح')),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر الحفظ: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(contextControllerProvider);
    final centerId = int.tryParse(contextState.selectedCenterId ?? '');
    final circlesAsync = ref.watch(orgCirclesProvider(centerId));

    return Scaffold(
      appBar: const StandardAppBar(
        title: 'زيارة الحلقة',
        subtitle: 'تقييم ميداني موحد',
      ),
      body: circlesAsync.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: const [
            SkeletonCardLoader(),
            SkeletonCardLoader(),
            SkeletonCardLoader(),
          ],
        ),
        error: (error, _) => AppEmptyState(
          title: 'تعذر تحميل بيانات الحلقة',
          subtitle: error.toString(),
          icon: Icons.error_outline_rounded,
          actionLabel: 'إعادة المحاولة',
          onAction: () => ref.invalidate(orgCirclesProvider(centerId)),
        ),
        data: (circles) {
          final circle =
              circles.where((item) => item.id == widget.circleId).firstOrNull;
          if (circle == null) {
            return AppEmptyState(
              title: 'الحلقة غير موجودة',
              subtitle: 'لم يتم العثور على الحلقة ضمن النطاق الحالي.',
              icon: Icons.group_off_rounded,
              actionLabel: 'العودة',
              onAction: () => context.pop(),
            );
          }

          final completedCount =
              _checklist.where((item) => item['checked'] == true).length;

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: [
              _CircleSummaryCard(circle: circle)
                  .animate()
                  .fadeIn()
                  .slideY(begin: 0.04, end: 0),
              const SizedBox(height: AppSpacing.lg),
              SectionHeader(
                title: 'قائمة التحقق ($completedCount/${_checklist.length})',
              ),
              const SizedBox(height: AppSpacing.sm),
              const EnterpriseCard(
                accentColor: AppColors.infoLight,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.fact_check_outlined,
                      color: AppColors.infoLight,
                    ),
                    SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        'الحضور هنا يعتمد كمهمة إشرافية: يتحقق المشرف من اكتمال تسجيل الحضور بواسطة المعلم، ولا يملك زر تسجيل يدوي داخل مسار المشرف.',
                        style: TextStyle(
                          color: AppColors.textSecondaryLight,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              ...List.generate(
                _checklist.length,
                (index) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: _ChecklistItemCard(
                    label: _checklist[index]['label'] as String,
                    checked: _checklist[index]['checked'] as bool,
                    onTap: () => _toggleItem(index),
                  ).animate().fadeIn(delay: (40 * index).ms),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              const SectionHeader(title: 'التقييم العام'),
              const SizedBox(height: AppSpacing.sm),
              _RatingCard(
                rating: _rating,
                onChanged: (value) => setState(() => _rating = value),
              ).animate().fadeIn(delay: 100.ms),
              const SizedBox(height: AppSpacing.lg),
              const SectionHeader(title: 'ملاحظات الزيارة'),
              const SizedBox(height: AppSpacing.sm),
              EnterpriseCard(
                child: CustomTextField(
                  controller: _notesController,
                  hintText:
                      'أضف الملاحظات أو ما تم الاتفاق عليه مع المعلم...',
                  maxLines: 5,
                  minLines: 5,
                ),
              ).animate().fadeIn(delay: 150.ms),
              const SizedBox(height: AppSpacing.lg),
              if (_isSaved)
                const EnterpriseCard(
                  accentColor: AppColors.successLight,
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle_rounded,
                        color: AppColors.successLight,
                      ),
                      SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          'تم حفظ تقرير الزيارة. يمكنك العودة الآن أو متابعة مراجعة الحلقة.',
                          style: TextStyle(
                            color: AppColors.successLight,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms)
              else
                PrimaryButton(
                  label: 'حفظ تقرير الزيارة',
                  onPressed: _isSaving ? null : () => _handleSubmit(circle),
                  icon: Icons.save_rounded,
                  isLoading: _isSaving,
                ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 96),
            ],
          );
        },
      ),
    );
  }
}

class _CircleSummaryCard extends StatelessWidget {
  final OrgCircleDto circle;

  const _CircleSummaryCard({required this.circle});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return EnterpriseCard(
      accentColor: AppColors.primaryLight,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            circle.name,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            circle.teacherName?.trim().isNotEmpty == true
                ? 'المعلم: ${circle.teacherName}'
                : 'المعلم غير محدد',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              _MetaChip(
                icon: Icons.groups_rounded,
                label: '${circle.studentsCount} طالب',
              ),
              if (circle.locationText?.trim().isNotEmpty == true)
                _MetaChip(
                  icon: Icons.location_on_rounded,
                  label: circle.locationText!,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _MetaChip({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.primaryLight),
          const SizedBox(width: AppSpacing.xs),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.primaryLight,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChecklistItemCard extends StatelessWidget {
  final String label;
  final bool checked;
  final VoidCallback onTap;

  const _ChecklistItemCard({
    required this.label,
    required this.checked,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      onTap: onTap,
      accentColor: checked ? AppColors.successLight : null,
      child: Row(
        children: [
          Checkbox(
            value: checked,
            onChanged: (_) => onTap(),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: checked
                    ? AppColors.textPrimaryLight
                    : AppColors.textSecondaryLight,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingCard extends StatelessWidget {
  final int rating;
  final ValueChanged<int> onChanged;

  const _RatingCard({
    required this.rating,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final description = switch (rating) {
      0 => 'اختر تقييماً عاماً للحلقة',
      1 || 2 => 'يحتاج إلى تحسين',
      3 => 'مستوى متوسط',
      4 => 'جيد',
      _ => 'ممتاز',
    };

    return EnterpriseCard(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              5,
              (index) => IconButton(
                onPressed: () => onChanged(index + 1),
                icon: Icon(
                  Icons.star_rounded,
                  color: index < rating
                      ? AppColors.warningLight
                      : AppColors.borderLight,
                ),
              ),
            ),
          ),
          Text(
            description,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

*/
