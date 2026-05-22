import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/student/student_dashboard_provider.dart';

import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/standard_app_bar.dart';

class Assignment {
  final int id;
  final String type; // "حفظ" or "مراجعة"
  final String surah;
  final String verses;
  final bool completed;

  const Assignment({
    required this.id,
    required this.type,
    required this.surah,
    required this.verses,
    required this.completed,
  });

  Assignment copyWith({bool? completed}) {
    return Assignment(
      id: id,
      type: type,
      surah: surah,
      verses: verses,
      completed: completed ?? this.completed,
    );
  }
}

class AssignmentsScreen extends ConsumerStatefulWidget {
  const AssignmentsScreen({super.key});

  @override
  ConsumerState<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends ConsumerState<AssignmentsScreen> {
  // We keep track of local toggles if we derive assignments from profile
  final Set<int> _completedIds = {};

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(studentDashboardProvider.notifier).loadProfile();
    });
  }

  void _toggleCompletion(int id) {
    setState(() {
      if (_completedIds.contains(id)) {
        _completedIds.remove(id);
      } else {
        _completedIds.add(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      appBar: const StandardAppBar(title: 'واجبي اليوم'),
      body: _buildBody(theme),
    );
  }

  Widget _buildBody(ThemeData theme) {
    final state = ref.watch(studentDashboardProvider);

    if (state.isLoading) {
      return const PageStateView.loading();
    }

    if (state.error != null) {
      return PageStateView.error(
        title: 'عذراً',
        message: 'حدث خطأ أثناء تحميل الواجبات',
        actionLabel: 'إعادة المحاولة',
        onAction: () =>
            ref.read(studentDashboardProvider.notifier).loadProfile(),
      );
    }

    // Since the API doesn't provide future assignments directly, we derive a goal from currentJuzz
    // or show an empty state if no data is available.
    final profile = state.profileData?['studentProfile'];
    final currentJuzz = profile != null ? profile['currentJuzz'] as int? : null;

    final activeAssignments = currentJuzz != null
        ? [
            Assignment(
                id: 1,
                type: "حفظ",
                surah: "تثبيت الجزء $currentJuzz",
                verses: "حسب الخطة",
                completed: _completedIds.contains(1)),
            Assignment(
                id: 2,
                type: "مراجعة",
                surah: "مراجعة الأجزاء السابقة",
                verses: "آخر 5 أجزاء",
                completed: _completedIds.contains(2)),
          ]
        : <Assignment>[];

    if (activeAssignments.isEmpty) {
      return const PageStateView.empty(
        title: 'لا توجد واجبات اليوم',
        message: 'لم يتم تعيين أي واجب لهذا اليوم الاستناداً للبيانات الحالية.',
      );
    }

    final completedCount = activeAssignments.where((a) => a.completed).length;
    final totalCount =
        activeAssignments.isNotEmpty ? activeAssignments.length : 1;
    final progress = ((completedCount / totalCount) * 100).round();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Progress Summary
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [const Color(0xFF0F172A), const Color(0xFF14B8A6).withValues(alpha: 0.9)],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
              borderRadius: BorderRadius.circular(30),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primaryLight.withValues(alpha: 0.25),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: const Icon(Icons.stars_rounded, color: Colors.amber, size: 24),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'إنجاز اليوم',
                            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                          ),
                          Text(
                            'واصل التقدم لتحقيق هدفك!',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '$progress%',
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: progress / 100,
                    minHeight: 8,
                    backgroundColor: Colors.white.withValues(alpha: 0.1),
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'أنهيت $completedCount من $totalCount مهام',
                      style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                    const Text(
                      'ما شاء الله!',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95)),
          const SizedBox(height: AppSpacing.lg),

          // Assignments List
          ...List.generate(activeAssignments.length, (index) {
            final a = activeAssignments[index];
            final isCompleted = a.completed;
            final isHifz = a.type == "حفظ";

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isCompleted ? const Color(0xFFF0FDFA) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isCompleted ? const Color(0xFFCCFBF1) : AppColors.borderLight.withValues(alpha: 0.5),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => _toggleCompletion(a.id),
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isCompleted ? const Color(0xFF14B8A6) : const Color(0xFFF8FAFC),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isCompleted ? Colors.transparent : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Icon(
                          isCompleted ? Icons.check_rounded : Icons.circle_outlined,
                          color: isCompleted ? Colors.white : const Color(0xFF94A3B8),
                          size: 24,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                a.type,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  color: isHifz ? AppColors.primaryLight : AppColors.infoLight,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              if (isCompleted) ...[
                                const SizedBox(width: 8),
                                Container(
                                  width: 4,
                                  height: 4,
                                  decoration: const BoxDecoration(color: Color(0xFF14B8A6), shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 4),
                                const Text(
                                  'تم الإنجاز',
                                  style: TextStyle(color: Color(0xFF14B8A6), fontSize: 10, fontWeight: FontWeight.w800),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            a.surah,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: isCompleted ? const Color(0xFF64748B) : const Color(0xFF1E293B),
                              decoration: isCompleted ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          Text(
                            a.verses,
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryLight, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      isHifz ? Icons.menu_book_rounded : Icons.auto_stories_rounded,
                      color: isHifz ? AppColors.primaryLight.withValues(alpha: 0.2) : AppColors.infoLight.withValues(alpha: 0.2),
                    ),
                  ],
                ),
              )
                  .animate()
                  .fadeIn(delay: (index * 70).ms)
                  .slideX(begin: 0.05, end: 0),
            );
          }),
          const SizedBox(height: 100), // BottomNav padding
        ],
      ),
    );
  }
}
