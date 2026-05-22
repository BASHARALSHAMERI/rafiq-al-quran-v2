import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/exams/exam_controller.dart';
import '../../application/parent/parent_dashboard_provider.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/section_header.dart';

class ChildResultsScreen extends ConsumerStatefulWidget {
  final String childId;

  const ChildResultsScreen({super.key, required this.childId});

  @override
  ConsumerState<ChildResultsScreen> createState() => _ChildResultsScreenState();
}

class _ChildResultsScreenState extends ConsumerState<ChildResultsScreen> {
  @override
  void initState() {
    super.initState();
    // We assume the parent data is already loaded from the list/detail flow,
    // but we can trigger a load of attempts to be sure we have them.
    Future.microtask(() {
      final state = ref.read(parentDashboardProvider);
      final profile = state.childrenProfiles[int.tryParse(widget.childId) ?? 0];
      if (profile != null) {
        final enrollments =
            profile['studentEnrollments'] as List<dynamic>? ?? [];
        if (enrollments.isNotEmpty) {
          final firstEnrollment =
              enrollments.first as Map<String, dynamic>? ?? const {};
          final circle =
              firstEnrollment['circle'] as Map<String, dynamic>? ?? const {};
          final circleId = _readInt(circle['id']);
          final center = circle['center'] as Map<String, dynamic>? ?? const {};
          final centerId = _readInt(center['id']);
          ref.read(examControllerProvider.notifier).loadDashboard(
                centerId: centerId,
                circleId: circleId,
              );
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(parentDashboardProvider);
    final examState = ref.watch(examControllerProvider);
    final cId = int.tryParse(widget.childId) ?? 0;

    final profile = state.childrenProfiles[cId];
    if (profile == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF7F8F5),
        appBar: AppBar(
          title: const Text('نتائج الطالب'),
          centerTitle: false,
          backgroundColor: const Color(0xFFF7F8F5),
        ),
        body: const PageStateView.loading(message: 'جاري تحميل النتائج...'),
      );
    }

    final name = profile['fullName'] ?? 'ابن';
    final enrollments = profile['studentEnrollments'] as List<dynamic>? ?? [];
    final hasCircle = enrollments.isNotEmpty;
    final firstCircle =
        hasCircle ? enrollments.first['circle'] as Map<String, dynamic>? : null;
    final halqa = firstCircle?['name']?.toString() ?? 'غير مسجل';
    final teacher =
        firstCircle?['teacher']?['fullName']?.toString() ?? 'غير محدد';

    // Filter exams for this specific child
    final studentAttempts =
        examState.attempts.where((a) => a.studentId == cId).toList();

    // Memorization logs from profile
    final followUps = profile['followUpsAsStudent'] as List<dynamic>? ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      appBar: AppBar(
        title: const Text('نتائج الطالب'),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 2),
                Text('$halqa • المعلم: $teacher',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondaryLight)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const SectionHeader(title: 'الاختبارات'),
          const SizedBox(height: 8),
          if (studentAttempts.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(
                  child: Text('لا توجد اختبارات مسجلة.',
                      style: TextStyle(color: AppColors.textSecondaryLight))),
            ),
          ...studentAttempts.map(
            (attempt) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AppCard(
                child: Row(
                  children: [
                    const Icon(Icons.quiz_rounded,
                        color: AppColors.primaryLight),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(attempt.exam?.title ?? 'اختبار',
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)),
                          Text(
                            '${attempt.reviewedAt != null ? DateFormat('yyyy-MM-dd').format(DateTime.tryParse(attempt.reviewedAt.toString()) ?? DateTime.now()) : 'قيد المراجعة'} • ${attempt.status == 'REVIEWED' ? (attempt.gradeLabel ?? '-') : attempt.status}',
                            style: const TextStyle(
                                fontSize: 10,
                                color: AppColors.textSecondaryLight),
                          ),
                        ],
                      ),
                    ),
                    if (attempt.totalScore != null)
                      Text('${attempt.totalScore!.round()}%',
                          style: const TextStyle(fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const SectionHeader(title: 'سجل الحفظ'),
          const SizedBox(height: 8),
          if (followUps.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(
                  child: Text('لا يوجد سجل حفظ متاح.',
                      style: TextStyle(color: AppColors.textSecondaryLight))),
            ),
          ...followUps.take(10).map(
            (item) {
              final label =
                  'سورة ${item['surah'] ?? ''} (${item['fromAyah']}-${item['toAyah']})';
              final grade = item['rating']?.toString() ?? 'GOOD';
              final style = _getGradeStyle(grade);

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppCard(
                  child: Row(
                    children: [
                      const Icon(Icons.menu_book_rounded,
                          color: AppColors.primaryLight),
                      const SizedBox(width: 10),
                      Expanded(child: Text(label)),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: style['color'].withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(style['label'],
                            style: TextStyle(
                                color: style['color'],
                                fontSize: 11,
                                fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  int? _readInt(dynamic value) {
    if (value is int) {
      return value;
    }

    return int.tryParse('$value');
  }

  Map<String, dynamic> _getGradeStyle(String grade) {
    switch (grade.toUpperCase()) {
      case 'EXCELLENT':
      case 'ممتاز':
        return {'label': 'ممتاز', 'color': AppColors.successLight};
      case 'V_GOOD':
      case 'جيد جداً':
      case 'جيد جدا':
        return {'label': 'جيد جداً', 'color': AppColors.primaryLight};
      case 'GOOD':
      case 'جيد':
        return {'label': 'جيد', 'color': AppColors.infoLight};
      case 'ACCEPTABLE':
      case 'مقبول':
        return {'label': 'مقبول', 'color': AppColors.warningLight};
      default:
        return {'label': 'ضعيف', 'color': AppColors.errorLight};
    }
  }
}
