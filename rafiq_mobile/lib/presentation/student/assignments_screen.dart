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
  final String type;
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
    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(title: 'واجبي اليوم'),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    final state = ref.watch(studentDashboardProvider);
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;
    final isDark = context.isDark;

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
        message: 'لم يتم تعيين أي واجب لهذا اليوم استناداً للبيانات الحالية.',
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
              gradient: const LinearGradient(
                colors: [Color(0xFF0F766E), Color(0xFF115E59)],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
              borderRadius: BorderRadius.circular(30),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F766E).withValues(alpha: 0.25),
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
                    backgroundColor: Colors.white.withValues(alpha: 0.15),
                    color: const Color(0xFF34D399),
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
            final typeColor = isHifz ? primary : custom.info;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isCompleted
                      ? custom.success.withValues(alpha: isDark ? 0.16 : 0.08)
                      : context.cardColor,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isCompleted
                        ? custom.success.withValues(alpha: 0.35)
                        : context.borderColor,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.02),
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
                          color: isCompleted ? custom.success : context.surfaceColor,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isCompleted ? Colors.transparent : context.borderColor,
                          ),
                        ),
                        child: Icon(
                          isCompleted ? Icons.check_rounded : Icons.circle_outlined,
                          color: isCompleted ? Colors.white : context.textSecondaryColor,
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
                                  color: typeColor,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              if (isCompleted) ...[
                                const SizedBox(width: 8),
                                Container(
                                  width: 4,
                                  height: 4,
                                  decoration: BoxDecoration(color: custom.success, shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'تم الإنجاز',
                                  style: TextStyle(color: custom.success, fontSize: 10, fontWeight: FontWeight.w800),
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
                              color: isCompleted ? context.textSecondaryColor : context.textPrimaryColor,
                              decoration: isCompleted ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          Text(
                            a.verses,
                            style: TextStyle(fontSize: 12, color: context.textSecondaryColor, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      isHifz ? Icons.menu_book_rounded : Icons.auto_stories_rounded,
                      color: typeColor.withValues(alpha: 0.3),
                    ),
                  ],
                ),
              )
                  .animate()
                  .fadeIn(delay: (index * 70).ms)
                  .slideX(begin: 0.05, end: 0),
            );
          }),
          const SizedBox(height: 100),
        ],
      ),
    );
  }
}
