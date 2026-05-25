import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/context/context_controller.dart';
import '../../application/org/org_providers.dart';
import '../../application/supervisor/supervisor_notes_controller.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_gradients.dart';
import '../../core/theme/app_shadows.dart';
import '../../data/models/org_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/standard_app_bar.dart';
import '../shared/widgets/section_header.dart';

const _criteria = [
  ('punctuality', 'الالتزام بالمواعيد'),
  ('teaching', 'جودة التعليم والتسميع'),
  ('discipline', 'إدارة الحلقة والانضباط'),
  ('communication', 'التواصل مع أولياء الأمور'),
  ('records', 'تسجيل البيانات والمتابعة'),
];

class TeacherEvaluationScreen extends ConsumerStatefulWidget {
  const TeacherEvaluationScreen({super.key});

  @override
  ConsumerState<TeacherEvaluationScreen> createState() =>
      _TeacherEvaluationScreenState();
}

class _TeacherEvaluationScreenState
    extends ConsumerState<TeacherEvaluationScreen> {
  OrgCircleDto? _selectedCircle;
  final Map<String, int> _ratings = {};
  final _notesController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (_selectedCircle == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى اختيار حلقة للتقييم')),
      );
      return;
    }

    if (_ratings.length < _criteria.length ||
        _ratings.values.any((v) => v == 0)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى تقييم جميع المعايير قبل الحفظ.')),
      );
      return;
    }

    final scores = {
      for (final c in _criteria) c.$1: (_ratings[c.$1] ?? 0).toDouble(),
    };
    final avg = scores.values.isEmpty
        ? 0.0
        : scores.values.reduce((a, b) => a + b) / scores.length;
    scores['avgScore'] = avg;

    final circle = _selectedCircle!;
    final contextState = ref.read(contextControllerProvider);
    final centerId = int.tryParse(contextState.selectedCenterId ?? '');
    final targetLabel =
        '${circle.name}${circle.teacherName != null ? ' - ${circle.teacherName}' : ''}';

    setState(() => _isSaving = true);
    try {
      await ref.read(supervisorNotesControllerProvider.notifier).create(
            centerId: centerId,
            circleId: circle.id,
            category: 'EVALUATION',
            targetLabel: targetLabel,
            content: _notesController.text.trim().isNotEmpty
                ? _notesController.text.trim()
                : 'تقييم دوري للمعلم',
            scores: scores.map((k, v) => MapEntry(k, v)),
          );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('تم حفظ التقييم بنجاح'),
          backgroundColor: AppColors.successLight,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.md)),
        ),
      );
      setState(() {
        _selectedCircle = null;
        _ratings.clear();
        _notesController.clear();
        _isSaving = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('تعذر الحفظ: $e'),
          backgroundColor: AppColors.errorLight,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ctx = ref.watch(contextControllerProvider);
    final centerId = int.tryParse(ctx.selectedCenterId ?? '');
    final circlesAsync = ref.watch(orgCirclesProvider(centerId));

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: StandardAppBar(
        title: 'تقييم المعلمين',
        leading: _selectedCircle != null
            ? IconButton(
                icon: const Icon(
                  Icons.chevron_right_rounded,
                  size: 28,
                ),
                onPressed: () => setState(() {
                  _selectedCircle = null;
                  _ratings.clear();
                  _notesController.clear();
                }),
              )
            : null,
      ),
      body: circlesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppEmptyState(
          title: 'تعذر تحميل الحلقات',
          subtitle: e.toString(),
          icon: Icons.error_outline_rounded,
          actionLabel: 'إعادة المحاولة',
          onAction: () => ref.invalidate(orgCirclesProvider(centerId)),
        ),
        data: (circles) {
          final teacherCircles =
              circles.where((c) => c.isActive).toList(growable: false);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _selectedCircle == null
                  ? _buildCircleList(theme, teacherCircles)
                  : _buildEvaluationForm(theme),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCircleList(ThemeData theme, List<OrgCircleDto> circles) {
    if (circles.isEmpty) {
      return const AppEmptyState(
        title: 'لا توجد حلقات نشطة',
        subtitle: 'لم يتم العثور على حلقات نشطة لهذا المركز.',
        icon: Icons.groups_rounded,
      );
    }

    return Column(
      key: const ValueKey('list'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Distinguishing banner: periodic comprehensive evaluation vs field visit
        Container(
          padding: const EdgeInsets.all(12),
          margin: const EdgeInsets.only(bottom: AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.infoLight.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: AppColors.infoLight.withValues(alpha: 0.25),
            ),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline_rounded,
                  color: AppColors.infoLight, size: 18),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'التقييم الدوري الشامل لمهارات المعلم — يختلف عن زيارة الحلقة الميدانية. يُرفع للسجل التقييمي ومدير المركز.',
                  style: TextStyle(
                    color: AppColors.infoLight,
                    fontSize: 12,
                    height: 1.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SectionHeader(title: 'اختر الحلقة / المعلم للتقييم'),
        const SizedBox(height: AppSpacing.sm),
        ...List.generate(circles.length, (index) {
          final c = circles[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GestureDetector(
              onTap: () => setState(() => _selectedCircle = c),
              child: AppCard(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Icon(Icons.person_rounded,
                          color: AppColors.primaryLight),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c.name,
                              style: theme.textTheme.titleSmall
                                  ?.copyWith(fontWeight: FontWeight.w700)),
                          Text(
                            '${c.teacherName ?? 'لم يحدد المعلم'} · ${c.studentsCount} طالب',
                            style: theme.textTheme.labelSmall
                                ?.copyWith(color: AppColors.textSecondaryLight),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded,
                        color: AppColors.textSecondaryLight),
                  ],
                ),
              ),
            )
                .animate()
                .fadeIn(delay: (index * 50).ms)
                .slideY(begin: 0.1, end: 0, duration: 300.ms),
          );
        }),
      ],
    );
  }

  Widget _buildEvaluationForm(ThemeData theme) {
    final c = _selectedCircle!;
    return Column(
      key: const ValueKey('form'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primaryLight.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
                color: AppColors.primaryLight.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('تقييم: ${c.name}',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              if (c.teacherName != null)
                Text('المعلم: ${c.teacherName}',
                    style: theme.textTheme.labelSmall
                        ?.copyWith(color: AppColors.textSecondaryLight)),
              Text('${c.studentsCount} طالب',
                  style: theme.textTheme.labelSmall
                      ?.copyWith(color: AppColors.textSecondaryLight)),
            ],
          ),
        ).animate().fadeIn(),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'معايير التقييم'),
        const SizedBox(height: AppSpacing.sm),
        ..._criteria.map((criterion) {
          final currentVal = _ratings[criterion.$1] ?? 0;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: AppCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(criterion.$2,
                      style: theme.textTheme.labelMedium
                          ?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      ...List.generate(5, (i) {
                        final starVal = i + 1;
                        final isSelected = starVal <= currentVal;
                        return GestureDetector(
                          onTap: () =>
                              setState(() => _ratings[criterion.$1] = starVal),
                          child: Padding(
                            padding: const EdgeInsets.only(left: 4),
                            child: Icon(
                              Icons.star_rounded,
                              size: 28,
                              color: isSelected
                                  ? AppColors.warningLight
                                  : AppColors.textSecondaryLight
                                      .withValues(alpha: 0.25),
                            ),
                          ),
                        );
                      }),
                      const Spacer(),
                      if (currentVal > 0)
                        Text('$currentVal/5',
                            style: theme.textTheme.labelSmall?.copyWith(
                                color: AppColors.textSecondaryLight)),
                    ],
                  ),
                ],
              ),
            ),
          ).animate().fadeIn().slideX(begin: 0.05, end: 0);
        }),
        const SizedBox(height: AppSpacing.sm),
        const SectionHeader(title: 'ملاحظات إضافية'),
        const SizedBox(height: AppSpacing.sm),
        TextField(
          controller: _notesController,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: 'أضف ملاحظاتك حول أداء المعلم...',
            filled: true,
            fillColor: AppColors.cardLight,
            contentPadding: const EdgeInsets.all(14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: const BorderSide(color: AppColors.borderLight),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: const BorderSide(color: AppColors.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: BorderSide(
                  color: AppColors.primaryLight.withValues(alpha: 0.5),
                  width: 2),
            ),
          ),
        ).animate().fadeIn().slideY(begin: 0.1, end: 0),
        const SizedBox(height: AppSpacing.lg),
        Row(
          children: [
            Expanded(
              child: TextButton(
                onPressed: () => setState(() {
                  _selectedCircle = null;
                  _ratings.clear();
                  _notesController.clear();
                }),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    side: const BorderSide(color: AppColors.borderLight),
                  ),
                ),
                child: const Text('رجوع',
                    style: TextStyle(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: GestureDetector(
                onTap: _isSaving ? null : _handleSubmit,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    gradient: AppGradients.deepPrimary,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    boxShadow: AppShadows.primaryGlow,
                  ),
                  child: _isSaving
                      ? const Center(
                          child: SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2)))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.send_rounded,
                                color: Colors.white, size: 16),
                            SizedBox(width: 8),
                            Text('حفظ التقييم',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700)),
                          ],
                        ),
                ),
              ),
            ),
          ],
        ).animate().fadeIn().slideY(begin: 0.1, end: 0),
        const SizedBox(height: 100),
      ],
    );
  }
}
