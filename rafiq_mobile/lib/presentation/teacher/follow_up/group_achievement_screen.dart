import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../application/attendance/attendance_controller.dart';
import '../../../../application/context/context_controller.dart';
import '../../../../domain/entities/attendance.dart';

import '../../../../core/constants/app_radius.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/theme/app_shadows.dart';
import '../../../../core/utils/app_snack_bar.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/standard_app_bar.dart';

import '../../../../application/follow_up/follow_up_controller.dart';
import '../../../../data/models/follow_up_dtos.dart';

class ActivityType {
  final String id;
  final String label;
  final String emoji;

  const ActivityType(
      {required this.id, required this.label, required this.emoji});
}

const List<ActivityType> activityTypes = [
  ActivityType(id: "lecture", label: "محاضرة", emoji: "🎤"),
  ActivityType(id: "tafseer", label: "تفسير", emoji: "📖"),
  ActivityType(id: "seera", label: "سيرة", emoji: "🕌"),
  ActivityType(id: "hadith", label: "حديث", emoji: "📜"),
  ActivityType(id: "fiqh", label: "فقه", emoji: "⚖️"),
  ActivityType(id: "tajweed", label: "تجويد", emoji: "🔊"),
  ActivityType(id: "tarbawi", label: "نشاط تربوي", emoji: "🌱"),
];

class GroupAchievementScreen extends ConsumerStatefulWidget {
  const GroupAchievementScreen({super.key});

  @override
  ConsumerState<GroupAchievementScreen> createState() =>
      _GroupAchievementScreenState();
}

class _GroupAchievementScreenState
    extends ConsumerState<GroupAchievementScreen> {
  String? _selectedTypeId;
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _isSaved = false;
  bool _isSaving = false;

  List<({int id, String name})> get presentStudents {
    final attState = ref.watch(attendanceControllerProvider);
    final presentIds = attState.draftByStudentId.entries
        .where((e) => e.value.status == AttendanceStatus.present)
        .map((e) => e.key)
        .toSet();

    return attState.students
        .where((s) => presentIds.contains(s.id))
        .map((s) => (id: int.tryParse(s.id) ?? 0, name: s.name))
        .toList();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (_isSaving) return;
    if (_selectedTypeId == null) {
      _showError('اختر نوع النشاط');
      return;
    }
    if (_titleController.text.trim().isEmpty) {
      _showError('أدخل عنوان النشاط');
      return;
    }

    final students = presentStudents;
    if (students.isEmpty) {
      _showError('لا يوجد طلاب حاضرون لتسجيل النشاط لهم');
      return;
    }

    final circleIdStr = ref.read(contextControllerProvider).selectedCircleId;
    final circleId = int.tryParse(circleIdStr ?? '');
    if (circleId == null) {
      _showError('لم يتم تحديد حلقة نشطة');
      return;
    }

    setState(() => _isSaving = true);

    try {
      final controller = ref.read(followUpControllerProvider.notifier);
      final activityLabel =
          activityTypes.firstWhere((t) => t.id == _selectedTypeId).label;
      final fullTitle = '$activityLabel: ${_titleController.text.trim()}';
      final notes = _descriptionController.text.trim();

      int successCount = 0;
      for (final student in students) {
        if (student.id == 0) continue;
        try {
          await controller.createFollowUp(
            CreateFollowUpRequestDto(
              studentId: student.id,
              circleId: circleId,
              type: 'MATN',
              recordDate: DateTime.now().toIso8601String(),
              matnName: fullTitle,
              notes: notes.isEmpty ? null : notes,
              rating: 100,
            ),
          );
          successCount++;
        } catch (e) {
          debugPrint(
              'Failed to save achievement for student ${student.id}: $e');
        }
      }

      if (successCount > 0) {
        setState(() {
          _isSaved = true;
          _isSaving = false;
        });

        if (mounted) {
          AppSnackBar.success(
            context,
            'تم تسجيل النشاط بنجاح لـ $successCount طالب',
          );
        }
      } else {
        _showError('تعذر حفظ النشاط، يرجى المحاولة مرة أخرى');
        setState(() => _isSaving = false);
      }
    } catch (e) {
      _showError('حدث خطأ غير متوقع');
      setState(() => _isSaving = false);
    }
  }

  void _showError(String message) {
    AppSnackBar.error(context, message);
  }

  void _handleReset() {
    setState(() {
      _selectedTypeId = null;
      _titleController.clear();
      _descriptionController.clear();
      _isSaved = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: const StandardAppBar(
        title: 'الإنجاز الجماعي',
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          children: [
            // Present Students Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(
                    color: AppColors.primaryLight.withValues(alpha: 0.1)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Icon(Icons.people_alt_rounded,
                        size: 18, color: AppColors.primaryLight),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('الطلاب الحاضرون اليوم',
                            style: theme.textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.w700)),
                        Text(
                          '${presentStudents.length} طالب سيتم ربط النشاط بهم تلقائياً',
                          style: theme.textTheme.labelSmall
                              ?.copyWith(color: AppColors.textSecondaryLight),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn().slideY(begin: 0.1, end: 0, duration: 300.ms),
            const SizedBox(height: AppSpacing.md),

            // Activity Type Selection
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('نوع النشاط',
                      style: theme.textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondaryLight,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: AppSpacing.sm),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: activityTypes.length,
                    itemBuilder: (context, index) {
                      final type = activityTypes[index];
                      final isSelected = _selectedTypeId == type.id;

                      return GestureDetector(
                        onTap: () => setState(() => _selectedTypeId = type.id),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primaryLight.withValues(alpha: 0.1)
                                : theme.scaffoldBackgroundColor,
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            border: Border.all(
                              color: isSelected
                                  ? AppColors.primaryLight
                                  : AppColors.borderLight,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(type.emoji,
                                  style: const TextStyle(fontSize: 22)),
                              const SizedBox(height: 4),
                              Text(
                                type.label,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: isSelected
                                      ? AppColors.primaryLight
                                      : AppColors.textPrimaryLight,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            )
                .animate()
                .fadeIn(delay: 50.ms)
                .slideY(begin: 0.1, end: 0, duration: 300.ms),
            const SizedBox(height: AppSpacing.md),

            // Title
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('عنوان النشاط',
                      style: theme.textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondaryLight,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: AppSpacing.xs),
                  TextField(
                    controller: _titleController,
                    decoration: InputDecoration(
                      hintText: 'مثال: شرح أحكام الميم الساكنة',
                      filled: true,
                      fillColor: theme.scaffoldBackgroundColor,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide:
                            const BorderSide(color: AppColors.borderLight),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide:
                            const BorderSide(color: AppColors.borderLight),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide: BorderSide(
                            color:
                                AppColors.primaryLight.withValues(alpha: 0.5),
                            width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            )
                .animate()
                .fadeIn(delay: 100.ms)
                .slideY(begin: 0.1, end: 0, duration: 300.ms),
            const SizedBox(height: AppSpacing.md),

            // Description
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('وصف النشاط (اختياري)',
                      style: theme.textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondaryLight,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: AppSpacing.xs),
                  TextField(
                    controller: _descriptionController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'تفاصيل إضافية عن النشاط...',
                      filled: true,
                      fillColor: theme.scaffoldBackgroundColor,
                      contentPadding: const EdgeInsets.all(14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide:
                            const BorderSide(color: AppColors.borderLight),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide:
                            const BorderSide(color: AppColors.borderLight),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide: BorderSide(
                            color:
                                AppColors.primaryLight.withValues(alpha: 0.5),
                            width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            )
                .animate()
                .fadeIn(delay: 150.ms)
                .slideY(begin: 0.1, end: 0, duration: 300.ms),
            const SizedBox(height: AppSpacing.lg),

            // Save / Success State
            StatefulBuilder(builder: (context, setState) {
              if (_isSaved) {
                return Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.successLight.withValues(alpha: 0.1),
                        border: Border.all(
                            color:
                                AppColors.successLight.withValues(alpha: 0.2)),
                        borderRadius: BorderRadius.circular(AppRadius.xl),
                      ),
                      child: Column(
                        children: [
                          const Text('✓ تم تسجيل النشاط بنجاح',
                              style: TextStyle(
                                  color: AppColors.successLight,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Text('تم ربطه بـ ${presentStudents.length} طالب حاضر',
                              style: theme.textTheme.labelSmall?.copyWith(
                                  color: AppColors.textSecondaryLight)),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton(
                        onPressed: _handleReset,
                        style: TextButton.styleFrom(
                          backgroundColor: theme.scaffoldBackgroundColor,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.xl),
                          ),
                        ),
                        child: const Text('تسجيل نشاط جديد',
                            style: TextStyle(
                                color: AppColors.textPrimaryLight,
                                fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                )
                    .animate()
                    .fadeIn(delay: 200.ms)
                    .slideY(begin: 0.1, end: 0, duration: 300.ms);
              }

              return GestureDetector(
                onTap: _isSaving ? null : _handleSave,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    gradient: _isSaving ? null : AppGradients.deepPrimary,
                    color: _isSaving
                        ? AppColors.textSecondaryLight.withValues(alpha: 0.3)
                        : null,
                    borderRadius: BorderRadius.circular(AppRadius.xl),
                    boxShadow: _isSaving ? null : AppShadows.primaryGlow,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_isSaving)
                        const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      else
                        const Icon(Icons.save_rounded,
                            color: Colors.white, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        _isSaving
                            ? 'جار الحفظ...'
                            : 'حفظ وتسجيل للطلاب الحاضرين',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              )
                  .animate()
                  .fadeIn(delay: 200.ms)
                  .slideY(begin: 0.1, end: 0, duration: 300.ms);
            }),

            const SizedBox(height: 100), // BottomNav padding
          ],
        ),
      ),
    );
  }
}
